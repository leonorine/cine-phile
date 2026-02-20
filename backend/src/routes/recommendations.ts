import { Router, Request, Response } from 'express';
import { db } from '../config/supabase';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import axios from 'axios';

const router = Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Genre mapping for display
const GENRE_NAMES: Record<number, string> = {
    28: 'Action',
    12: 'Aventure',
    16: 'Animation',
    35: 'Comédie',
    80: 'Crime',
    99: 'Documentaire',
    18: 'Drame',
    10751: 'Familial',
    14: 'Fantastique',
    36: 'Histoire',
    27: 'Horreur',
    10402: 'Musique',
    9648: 'Mystère',
    10749: 'Romance',
    878: 'Science-Fiction',
    10770: 'Téléfilm',
    53: 'Thriller',
    10752: 'Guerre',
    37: 'Western',
};

// ============================================
// GET /api/recommendations
// ============================================
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Get user's collection to analyze preferences
        const { data: collection, error: collectionError } = await db
            .from('collection')
            .select('media_id, media_type, rating')
            .eq('user_id', userId);

        if (collectionError) {
            console.error('Error fetching collection:', collectionError);
            return res.status(500).json({
                success: false,
                error: { message: 'Erreur lors de la récupération de la collection' },
            });
        }

        // If collection is empty, return trending
        if (!collection || collection.length === 0) {
            const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'fr-FR',
                },
            });

            return res.status(200).json({
                success: true,
                data: {
                    recommendations: response.data.results.slice(0, 10),
                    reason: 'Basé sur les tendances du moment',
                },
            });
        }

        // Collect genre IDs from user's highly-rated movies
        const genreCounts: Record<number, number> = {};
        const watchedMediaIds = new Set(collection.map(c => `${c.media_type}-${c.media_id}`));

        // Fetch genre data for each item in collection
        for (const item of collection.slice(0, 20)) { // Limit to avoid too many API calls
            const type = item.media_type === 'film' ? 'movie' : 'tv';
            try {
                const mediaResponse = await axios.get(`${TMDB_BASE_URL}/${type}/${item.media_id}`, {
                    params: {
                        api_key: TMDB_API_KEY,
                        language: 'fr-FR',
                    },
                });

                const genres = mediaResponse.data.genres || [];
                const weight = item.rating ? item.rating / 10 : 0.5;

                for (const genre of genres) {
                    genreCounts[genre.id] = (genreCounts[genre.id] || 0) + weight;
                }
            } catch (error) {
                // Skip items that fail
                continue;
            }
        }

        // Find top genres
        const sortedGenres = Object.entries(genreCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id]) => parseInt(id));

        if (sortedGenres.length === 0) {
            // Fallback to trending if no genres found
            const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'fr-FR',
                },
            });

            return res.status(200).json({
                success: true,
                data: {
                    recommendations: response.data.results.slice(0, 10),
                    reason: 'Basé sur les tendances du moment',
                },
            });
        }

        // Get recommendations based on top genres
        // Fetch page 1 AND page 2 to have enough results after filtering
        const [page1, page2] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/discover/movie`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'fr-FR',
                    with_genres: sortedGenres.join(','),
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': 200,
                    page: 1,
                },
            }),
            axios.get(`${TMDB_BASE_URL}/discover/movie`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'fr-FR',
                    with_genres: sortedGenres.join(','),
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': 200,
                    page: 2,
                },
            }),
        ]);

        const allResults = [...page1.data.results, ...page2.data.results];

        // Filter out movies already in collection (stored as 'film-' in our DB)
        // TMDB discover returns movies so we check both 'film-' and 'movie-' prefixes
        const recommendations = allResults
            .filter((movie: any) =>
                !watchedMediaIds.has(`film-${movie.id}`) &&
                !watchedMediaIds.has(`movie-${movie.id}`)
            )
            .slice(0, 10);

        // Build reason string based on favorite genres
        const genreNames = sortedGenres
            .map(id => GENRE_NAMES[id])
            .filter(Boolean)
            .join(', ');

        res.status(200).json({
            success: true,
            data: {
                recommendations,
                reason: `Basé sur vos genres préférés : ${genreNames}`,
                favorite_genres: sortedGenres.map(id => ({ id, name: GENRE_NAMES[id] })),
            },
        });

    } catch (error) {
        console.error('Unexpected error in recommendations:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Erreur serveur inattendue' },
        });
    }
});

export default router;
