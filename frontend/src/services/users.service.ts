import api from './api'
import type { ApiResponse } from './api'

export interface SearchUser {
    id: string
    pseudo: string
    avatar_url: string | null
    email?: string
}

// Search users by username
export async function searchUsers(query: string): Promise<SearchUser[]> {
    const response = await api.get<ApiResponse<SearchUser[]>>(`/users/search?q=${encodeURIComponent(query)}`)
    return response.data.data
}
