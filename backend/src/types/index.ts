/**
 * User type definition
 * Represents a user in the application
 */
export interface User {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
    updated_at: string;
}

/**
 * CollectionItem type definition
 * Represents a movie/series in a user's collection
 */
export interface CollectionItem {
    id: string;
    user_id: string;
    media_type: 'movie' | 'tv' | 'series';
    media_id: string; // TMDB or OMDB ID
    title: string;
    poster_url?: string;
    release_date?: string;
    rating?: number; // User's personal rating (0-10)
    status: 'watched' | 'watching' | 'to_watch' | 'dropped';
    is_favorite: boolean;
    notes?: string;
    added_at: string;
    updated_at: string;
}

/**
 * Comment type definition
 * Represents a comment on a collection item or user review
 */
export interface Comment {
    id: string;
    user_id: string;
    collection_item_id?: string; // Optional: if comment is on a collection item
    parent_comment_id?: string; // Optional: for nested comments/replies
    content: string;
    likes_count: number;
    created_at: string;
    updated_at: string;
    // Populated fields (not in DB, but useful for API responses)
    user?: User;
    replies?: Comment[];
}

/**
 * Notification type definition
 * Represents a notification for a user
 */
export interface Notification {
    id: string;
    user_id: string; // Recipient of the notification
    sender_id?: string; // User who triggered the notification
    type: 'friend_request' | 'friend_accepted' | 'comment' | 'like' | 'mention' | 'system';
    title: string;
    message: string;
    link?: string; // Optional link to related content
    is_read: boolean;
    created_at: string;
    // Populated fields
    sender?: User;
}

/**
 * Friend type definition
 * Represents a friendship or friend request between users
 */
export interface Friend {
    id: string;
    user_id: string; // User who sent the friend request
    friend_id: string; // User who received the friend request
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
    created_at: string;
    updated_at: string;
    // Populated fields
    user?: User;
    friend?: User;
}

/**
 * API Response wrapper type
 * Generic type for consistent API responses
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        [key: string]: any;
    };
}

/**
 * Pagination parameters type
 */
export interface PaginationParams {
    page: number;
    limit: number;
    offset?: number;
}

/**
 * Filter parameters for collection items
 */
export interface CollectionFilters {
    media_type?: 'movie' | 'tv' | 'series';
    status?: 'watched' | 'watching' | 'to_watch' | 'dropped';
    is_favorite?: boolean;
    search?: string;
    sort_by?: 'added_at' | 'title' | 'rating' | 'release_date';
    sort_order?: 'asc' | 'desc';
}
