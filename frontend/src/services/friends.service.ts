import api from './api'
import type { ApiResponse } from './api'

// Friend types
export interface Friend {
    id: string
    username: string
    email: string
    avatar_url: string | null
    bio: string | null
    created_at: string
}

export interface FriendRequest {
    id: string
    sender_id: string
    receiver_id: string
    status: 'pending' | 'accepted' | 'rejected'
    created_at: string
    sender?: Friend
    receiver?: Friend
}

// Get user's friends
export async function getFriends(): Promise<Friend[]> {
    const response = await api.get<ApiResponse<Friend[]>>('/friends')
    return response.data.data
}

// Get pending friend requests
export async function getFriendRequests(): Promise<FriendRequest[]> {
    const response = await api.get<ApiResponse<FriendRequest[]>>('/friends/requests')
    return response.data.data
}

// Send friend request
export async function sendFriendRequest(userId: string): Promise<FriendRequest> {
    const response = await api.post<ApiResponse<FriendRequest>>('/friends/request', {
        receiver_id: userId,
    })
    return response.data.data
}

// Accept friend request
export async function acceptFriendRequest(requestId: string): Promise<void> {
    await api.put(`/friends/request/${requestId}`, { status: 'accepted' })
}

// Reject friend request
export async function rejectFriendRequest(requestId: string): Promise<void> {
    await api.put(`/friends/request/${requestId}`, { status: 'rejected' })
}

// Remove friend
export async function removeFriend(friendId: string): Promise<void> {
    await api.delete(`/friends/${friendId}`)
}

// Search users
export async function searchUsers(query: string): Promise<Friend[]> {
    const response = await api.get<ApiResponse<Friend[]>>('/users/search', {
        params: { q: query },
    })
    return response.data.data
}
