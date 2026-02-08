import api from './api'
import type { ApiResponse } from './api'

export interface Recommendation {
    id: number
    title: string
    name?: string
    poster_path: string | null
    backdrop_path: string | null
    overview: string
    vote_average: number
    vote_count: number
    release_date?: string
    first_air_date?: string
    genre_ids: number[]
    media_type?: string
}

export interface RecommendationsResponse {
    recommendations: Recommendation[]
    reason: string
    favorite_genres?: { id: number; name: string }[]
}

// Get personalized recommendations
export async function getRecommendations(): Promise<RecommendationsResponse> {
    const response = await api.get<ApiResponse<RecommendationsResponse>>('/recommendations')
    return response.data.data
}
