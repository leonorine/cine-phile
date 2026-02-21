
import { createClient } from '@supabase/supabase-js';
import { fakerFR as faker } from '@faker-js/faker';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory .env
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TMDB_API_KEY) {
    console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_KEY or TMDB_API_KEY in .env');
    process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

interface MediaItem {
    id: number;
    title: string;
    poster_path: string | null;
    media_type: 'film' | 'serie';
}

async function fetchPopularMedia(): Promise<MediaItem[]> {
    const items: MediaItem[] = [];

    try {
        // Fetch Movies
        const moviesRes = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`);
        items.push(...moviesRes.data.results.map((m: any) => ({
            id: m.id,
            title: m.title,
            poster_path: m.poster_path,
            media_type: 'film' as const
        })));

        // Fetch TV Shows
        const tvRes = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`);
        items.push(...tvRes.data.results.map((t: any) => ({
            id: t.id,
            title: t.name,
            poster_path: t.poster_path,
            media_type: 'serie' as const
        })));

        console.log(`🎬 Fetched ${items.length} popular movies/series from TMDB`);
    } catch (error) {
        console.error('Error fetching TMDB data:', error);
    }

    return items;
}

async function seedActivity() {
    console.log('🚀 Starting activity seeding...');

    // 1. Get all users
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, pseudo');

    if (userError || !users) {
        console.error('Error fetching users:', userError);
        return;
    }

    console.log(`👥 Found ${users.length} users to update`);

    // 2. Get popular media
    const mediaList = await fetchPopularMedia();
    if (mediaList.length === 0) {
        console.error('No media found via TMDB API');
        return;
    }

    let totalCollectionAdded = 0;
    let totalCommentsAdded = 0;

    // 3. Loop through users and add activity
    for (const user of users) {
        // Randomly select 3-12 items to add to collection
        const numItems = faker.number.int({ min: 3, max: 12 });
        const selectedMedia = faker.helpers.arrayElements(mediaList, numItems);

        for (const media of selectedMedia) {
            const status = faker.helpers.arrayElement(['to_watch', 'watched']);
            let rating: number | null = null;

            // If watched, 80% chance to rate
            if (status === 'watched' && Math.random() < 0.8) {
                rating = faker.number.int({ min: 1, max: 10 });
            }

            // Insert into collection
            const { error: collectionError } = await supabase
                .from('collection')
                .upsert({
                    user_id: user.id,
                    media_id: media.id.toString(),
                    media_type: media.media_type,
                    title: media.title,
                    poster_url: media.poster_path,
                    status: status,
                    rating: rating,
                    added_at: faker.date.recent({ days: 30 }).toISOString(),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, media_id' }); // Assuming unique constraint on (user_id, media_id)

            if (!collectionError) {
                totalCollectionAdded++;

                // If rated, 30% chance to comment
                if (rating && Math.random() < 0.3) {
                    const { error: commentError } = await supabase
                        .from('comments')
                        .insert({
                            user_id: user.id,
                            media_id: media.id.toString(),
                            media_type: media.media_type,
                            text: faker.lorem.sentences({ min: 1, max: 3 }),
                            image_urls: [],
                            created_at: faker.date.recent({ days: 10 }).toISOString()
                        });

                    if (!commentError) totalCommentsAdded++;
                }
            }
        }
    }

    console.log('\n=================================');
    console.log(`🎉 Activity seeding completed!`);
    console.log(`📚 Collection items added/updated: ${totalCollectionAdded}`);
    console.log(`💬 Comments added: ${totalCommentsAdded}`);
    console.log('=================================\n');
}

seedActivity();
