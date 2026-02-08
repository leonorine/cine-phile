import { Router, Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';

const router = Router();

// ============================================
// Configuration TMDb API
// ============================================

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

if (!TMDB_API_KEY) {
    console.warn('⚠️  TMDB_API_KEY is not defined in environment variables');
}

// ============================================
// Simple in-memory cache
// ============================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class SimpleCache {
    private cache: Map<string, CacheEntry<any>> = new Map();

    set<T>(key: string, data: T, ttlMinutes: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMinutes * 60 * 1000,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > entry.ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    clear(): void {
        this.cache.clear();
    }
}

const cache = new SimpleCache();

// ============================================
// Validation Schemas
// ============================================

const searchQuerySchema = z.object({
    q: z.string().min(2, 'La recherche doit contenir au moins 2 caractères'),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
});

const mediaIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID invalide'),
});

const mediaTypeSchema = z.object({
    type: z.enum(['movie', 'tv']),
});

// ============================================
// Helper Functions
// ============================================

async function tmdbRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'fr-FR',
                ...params,
            },
            timeout: 10000,
        });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 429) {
            throw { status: 429, message: 'Trop de requêtes, veuillez réessayer plus tard' };
        }
        if (error.response?.status === 404) {
            throw { status: 404, message: 'Ressource non trouvée' };
        }
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw { status: 503, message: 'Service TMDb temporairement indisponible' };
        }
        throw { status: 503, message: 'Erreur lors de la communication avec TMDb' };
    }
}

function formatSearchResult(item: any) {
    return {
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : null,
        media_type: item.media_type,
        release_date: item.release_date || item.first_air_date || null,
        overview: item.overview,
        vote_average: item.vote_average,
    };
}

function formatMovieDetails(movie: any, credits: any) {
    const director = credits.crew?.find((person: any) => person.job === 'Director');
    const cast = credits.cast?.slice(0, 10).map((person: any) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profile_path: person.profile_path ? `${TMDB_IMAGE_BASE_URL}${person.profile_path}` : null,
    }));

    return {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}` : null,
        overview: movie.overview,
        genres: movie.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
        release_date: movie.release_date,
        director: director ? { id: director.id, name: director.name } : null,
        cast: cast || [],
        runtime: movie.runtime,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        tagline: movie.tagline,
        media_type: 'movie',
    };
}

function formatTVDetails(tv: any, credits: any) {
    const cast = credits.cast?.slice(0, 10).map((person: any) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profile_path: person.profile_path ? `${TMDB_IMAGE_BASE_URL}${person.profile_path}` : null,
    }));

    return {
        id: tv.id,
        title: tv.name,
        poster_path: tv.poster_path ? `${TMDB_IMAGE_BASE_URL}${tv.poster_path}` : null,
        backdrop_path: tv.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${tv.backdrop_path}` : null,
        overview: tv.overview,
        genres: tv.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
        release_date: tv.first_air_date,
        cast: cast || [],
        number_of_seasons: tv.number_of_seasons,
        number_of_episodes: tv.number_of_episodes,
        episode_run_time: tv.episode_run_time?.[0] || null,
        vote_average: tv.vote_average,
        vote_count: tv.vote_count,
        tagline: tv.tagline,
        media_type: 'tv',
    };
}

// ============================================
// GET /api/search?q=...
// ============================================
router.get('/search', async (req: Request, res: Response) => {
    try {
        // Validate query parameters
        const validationResult = searchQuerySchema.safeParse(req.query);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { q, page } = validationResult.data;

        // Check cache
        const cacheKey = `search:${q}:${page}`;
        const cachedResults = cache.get(cacheKey);
        if (cachedResults) {
            return res.status(200).json({
                success: true,
                data: cachedResults,
                meta: { cached: true },
            });
        }

        // Search on TMDb
        const response = await tmdbRequest<any>('/search/multi', {
            query: q,
            page,
        });

        // Filter and format results (only movies and TV shows, limit to 20)
        const results = response.results
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 20)
            .map(formatSearchResult);

        const data = {
            results,
            page: response.page,
            total_pages: Math.min(response.total_pages, 10), // Limit to 10 pages
            total_results: response.total_results,
        };

        // Cache results for 5 minutes
        cache.set(cacheKey, data, 5);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error('Search error:', error);

        if (error.status) {
            return res.status(error.status).json({
                success: false,
                error: {
                    message: error.message,
                },
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur lors de la recherche',
            },
        });
    }
});

// ============================================
// GET /api/media/:type/:id
// ============================================
router.get('/media/:type/:id', async (req: Request, res: Response) => {
    try {
        // Validate parameters
        const idValidation = mediaIdSchema.safeParse(req.params);
        const typeValidation = mediaTypeSchema.safeParse(req.params);

        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: idValidation.error.issues[0].message,
                },
            });
        }

        if (!typeValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: typeValidation.error.issues[0].message,
                },
            });
        }

        const { id } = idValidation.data;
        const { type } = typeValidation.data;

        // Check cache
        const cacheKey = `media:${type}:${id}`;
        const cachedDetails = cache.get(cacheKey);
        if (cachedDetails) {
            return res.status(200).json({
                success: true,
                data: cachedDetails,
                meta: { cached: true },
            });
        }

        // Fetch details and credits from TMDb
        const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
        const creditsEndpoint = `${endpoint}/credits`;

        const [details, credits] = await Promise.all([
            tmdbRequest<any>(endpoint),
            tmdbRequest<any>(creditsEndpoint),
        ]);

        // Format response based on media type
        const formattedData =
            type === 'movie'
                ? formatMovieDetails(details, credits)
                : formatTVDetails(details, credits);

        // Cache for 24 hours
        cache.set(cacheKey, formattedData, 24 * 60);

        res.status(200).json({
            success: true,
            data: formattedData,
        });
    } catch (error: any) {
        console.error('Media details error:', error);

        if (error.status) {
            return res.status(error.status).json({
                success: false,
                error: {
                    message: error.message,
                },
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur lors de la récupération des détails',
            },
        });
    }
});

// ============================================
// GET /api/search/trending
// ============================================
router.get('/search/trending', async (req: Request, res: Response) => {
    try {
        // Check cache
        const cacheKey = 'trending:week';
        const cachedTrending = cache.get(cacheKey);
        if (cachedTrending) {
            return res.status(200).json({
                success: true,
                data: cachedTrending,
                meta: { cached: true },
            });
        }

        // Fetch trending from TMDb
        const response = await tmdbRequest<any>('/trending/all/week');

        // Filter and format results (only movies and TV shows, limit to 8)
        const results = response.results
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 8)
            .map(formatSearchResult);

        // Cache for 5 minutes
        cache.set(cacheKey, results, 5);

        res.status(200).json({
            success: true,
            data: results,
        });
    } catch (error: any) {
        console.error('Trending error:', error);

        if (error.status) {
            return res.status(error.status).json({
                success: false,
                error: {
                    message: error.message,
                },
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur lors de la récupération des tendances',
            },
        });
    }
});

export default router;
