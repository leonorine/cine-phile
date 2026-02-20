
import { fakerFR as faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory .env
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const DEFAULT_BATCH_SIZE = 50;

async function seedUsers() {
    // Get count from arguments or default
    const args = process.argv.slice(2);
    const count = args[0] ? parseInt(args[0], 10) : DEFAULT_BATCH_SIZE;

    console.log(`🚀 Starting to seed ${count} users...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < count; i++) {
        try {
            // Generate fake user data
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const pseudo = faker.internet.username({ firstName, lastName }).replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);
            const email = faker.internet.email({ firstName, lastName, provider: 'cinephile.test' });
            const password = 'Password@123'; // Strong password required by Supabase default policy
            const bio = faker.person.bio();
            const avatarUrl = faker.image.avatar();

            // 1. Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: `${firstName} ${lastName}` }
            });

            if (authError) {
                // If user already exists, skip
                if (authError.message.includes('already registered')) {
                    console.log(`⚠️ User ${email} already exists, skipping.`);
                    continue;
                }
                console.error(`❌ Error creating auth user ${email}:`, authError.message);
                errorCount++;
                continue;
            }

            if (!authData.user) {
                console.error(`❌ User created but returned null for ${email}`);
                errorCount++;
                continue;
            }

            // 2. Create user profile in public.users table
            const { error: dbError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    pseudo: pseudo,
                    avatar_url: avatarUrl,
                    bio: bio,
                    username: pseudo,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (dbError) {
                console.error(`❌ Error creating profile for ${pseudo}:`, dbError.message);
                // Clean up auth user if profile creation fails
                await supabase.auth.admin.deleteUser(authData.user.id);
                errorCount++;
            } else {
                console.log(`✅ User created: ${pseudo} (${email})`);
                successCount++;
            }

        } catch (err) {
            console.error('Unexpected error:', err);
            errorCount++;
        }
    }

    console.log('\n=================================');
    console.log(`🎉 Seeding completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('=================================\n');
}

seedUsers();
