import { createClient, SupabaseClient, GoTrueClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
        'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined'
    );
}

// Initialize Supabase client with service role key for backend operations
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Export auth client with explicit type annotation
export const auth: GoTrueClient = supabase.auth;

// Export database client with explicit type annotation
export const db: SupabaseClient = supabase;

/**
 * Helper function to verify JWT tokens from Supabase
 * @param token - JWT token from Authorization header
 * @returns User object if token is valid, null otherwise
 */
export async function verifySupabaseToken(token: string) {
    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error) {
            console.error('Token verification error:', error.message);
            return null;
        }

        if (!data.user) {
            console.error('No user found for token');
            return null;
        }

        return data.user;
    } catch (error) {
        console.error('Unexpected error during token verification:', error);
        return null;
    }
}

/**
 * Alternative JWT verification using jsonwebtoken library
 * This is useful for verifying tokens without making API calls
 * @param token - JWT token from Authorization header
 * @returns Decoded token payload if valid, null otherwise
 */
export function verifyJWT(token: string): any {
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET;

        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is not defined');
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('JWT verification error:', error);
        return null;
    }
}

export default supabase;
