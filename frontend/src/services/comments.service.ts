import api from './api'
import type { ApiResponse } from './api'

// Comment types
export interface Comment {
    id: string
    user_id: string
    pseudo: string | null
    avatar_url: string | null
    text: string
    image_urls: string[]
    likes_count: number
    created_at: string
    updated_at: string
}

export interface CreateCommentData {
    media_id: string
    media_type: 'film' | 'serie'
    text: string
    image_urls?: string[]
}

export interface UpdateCommentData {
    text?: string
    image_urls?: string[]
}

// Get comments for a media
export async function getComments(mediaId: string | number): Promise<Comment[]> {
    const response = await api.get<ApiResponse<Comment[]>>(`/comments/${mediaId}`)
    return response.data.data || []
}

// Create a comment
export async function createComment(data: CreateCommentData): Promise<Comment> {
    const response = await api.post<ApiResponse<Comment>>('/comments', data)
    return response.data.data
}

// Update a comment
export async function updateComment(id: string, data: UpdateCommentData): Promise<Comment> {
    const response = await api.put<ApiResponse<Comment>>(`/comments/${id}`, data)
    return response.data.data
}

// Delete a comment
export async function deleteComment(id: string): Promise<void> {
    await api.delete(`/comments/${id}`)
}

// Like a comment
export async function likeComment(id: string): Promise<{ likes_count: number }> {
    const response = await api.post<ApiResponse<{ likes_count: number }>>(`/comments/${id}/like`)
    return response.data.data
}

// Unlike a comment
export async function unlikeComment(id: string): Promise<{ likes_count: number }> {
    const response = await api.delete<ApiResponse<{ likes_count: number }>>(`/comments/${id}/like`)
    return response.data.data
}

// Get current user's comments
export interface UserComment extends Comment {
    media_id: string
    media_type: 'film' | 'serie'
    rating?: number
}

export async function getUserComments(): Promise<UserComment[]> {
    const response = await api.get<ApiResponse<UserComment[]>>('/comments/user/me')
    return response.data.data || []
}

export async function getUserCommentsByUserId(userId: string): Promise<UserComment[]> {
    const response = await api.get<ApiResponse<UserComment[]>>(`/comments/user/${userId}`)
    return response.data.data || []
}
