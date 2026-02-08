import { db } from '../config/supabase';

/**
 * Notification types
 */
export type NotificationType =
    | 'friend_request'
    | 'comment_like'
    | 'friend_comment'
    | 'friend_rating';

/**
 * Create a notification for a user
 * @param user_id - ID of the user who will receive the notification
 * @param type - Type of notification
 * @param actor_id - ID of the user who triggered the notification
 * @param media_id - Optional media ID related to the notification
 * @returns The created notification or null if error
 */
export async function createNotification(
    user_id: string,
    type: NotificationType,
    actor_id: string,
    media_id?: string
): Promise<any | null> {
    try {
        const { data, error } = await db
            .from('notifications')
            .insert({
                user_id,
                type,
                actor_id,
                media_id: media_id || null,
                read: false,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error creating notification:', error);
        return null;
    }
}

/**
 * Check if a user exists
 * @param user_id - ID of the user to check
 * @returns true if user exists, false otherwise
 */
export async function userExists(user_id: string): Promise<boolean> {
    try {
        const { data, error } = await db
            .from('users')
            .select('id')
            .eq('id', user_id)
            .maybeSingle();

        if (error) {
            console.error('Error checking user existence:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Unexpected error checking user existence:', error);
        return false;
    }
}
