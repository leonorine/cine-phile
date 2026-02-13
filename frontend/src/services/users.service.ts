import api from './api'
import type { ApiResponse } from './api'

export interface SearchUser {
    id: string
    pseudo: string
    avatar_url: string | null
    email?: string
}

export interface UserProfile {
    id: string
    pseudo: string
    avatar_url: string | null
    bio: string | null
    collection_count: number
    comment_count: number
    friend_count: number
    created_at: string
}

// Search users by username
export async function searchUsers(query: string): Promise<SearchUser[]> {
    const response = await api.get<ApiResponse<SearchUser[]>>(`/users/search?q=${encodeURIComponent(query)}`)
    return response.data.data
}

// Get user profile by ID
export async function getUserById(userId: string): Promise<UserProfile> {
    const response = await api.get<ApiResponse<UserProfile>>(`/users/${userId}`)
    return response.data.data
}
