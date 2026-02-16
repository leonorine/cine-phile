import api from './api'
import type { ApiResponse } from './api'

export interface FollowUser {
    id: string
    pseudo: string
    avatar_url: string | null
}

// Follow a user
export async function followUser(userId: string): Promise<void> {
    await api.post(`/follows/${userId}`)
}

// Unfollow a user
export async function unfollowUser(userId: string): Promise<void> {
    await api.delete(`/follows/${userId}`)
}

// Get my followers (users who follow me)
export async function getFollowers(): Promise<FollowUser[]> {
    const response = await api.get<ApiResponse<FollowUser[]>>('/follows/followers')
    return response.data.data
}

// Get users I'm following
export async function getFollowing(): Promise<FollowUser[]> {
    const response = await api.get<ApiResponse<FollowUser[]>>('/follows/following')
    return response.data.data
}

// Check if I'm following a specific user
export async function checkIfFollowing(userId: string): Promise<boolean> {
    const response = await api.get<ApiResponse<{ isFollowing: boolean }>>(`/follows/check/${userId}`)
    return response.data.data.isFollowing
}

// Get followers of a specific user
export async function getUserFollowers(userId: string): Promise<FollowUser[]> {
    const response = await api.get<ApiResponse<FollowUser[]>>(`/follows/${userId}/followers`)
    return response.data.data
}

// Get users that a specific user follows
export async function getUserFollowing(userId: string): Promise<FollowUser[]> {
    const response = await api.get<ApiResponse<FollowUser[]>>(`/follows/${userId}/following`)
    return response.data.data
}
