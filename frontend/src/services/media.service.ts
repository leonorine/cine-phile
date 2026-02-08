import api from './api'
import type { ApiResponse } from './api'

// Media types
export interface MediaSearchResult {
    id: number
    title: string
    media_type: 'movie' | 'tv'
    poster_path: string | null
    backdrop_path: string | null
    overview: string
    vote_average: number
    release_date: string
    genre_ids: number[]
}

export interface MediaDetails {
    id: number
    title: string
    original_title: string
    tagline: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    release_date: string
    runtime: number
    vote_average: number
    vote_count: number
    genres: { id: number; name: string }[]
    production_countries: { iso_3166_1: string; name: string }[]
    spoken_languages: { iso_639_1: string; name: string }[]
    cast: {
        id: number
        name: string
        character: string
        profile_path: string | null
    }[]
    crew: {
        id: number
        name: string
        job: string
        department: string
        profile_path: string | null
    }[]
    // TV specific
    first_air_date?: string
    last_air_date?: string
    number_of_seasons?: number
    number_of_episodes?: number
    status?: string
}

export interface SearchResponse {
    results: MediaSearchResult[]
    page: number
    total_pages: number
    total_results: number
}

// Search movies and TV shows
export async function searchMedia(
    query: string,
    page: number = 1
): Promise<SearchResponse> {
    const response = await api.get<ApiResponse<SearchResponse>>('/search', {
        params: { q: query, page },
    })
    return response.data.data
}

// Get trending movies and TV shows
export async function getTrending(): Promise<SearchResponse> {
    const response = await api.get<ApiResponse<SearchResponse>>('/search/trending')
    return response.data.data
}

// Get media details (movie or TV show)
export async function getMediaDetails(
    type: 'movie' | 'tv',
    id: number | string
): Promise<MediaDetails> {
    const response = await api.get<ApiResponse<MediaDetails>>(`/media/${type}/${id}`)
    return response.data.data
}

// Helper to get full image URL
export function getImageUrl(
    path: string | null,
    size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string {
    if (!path) {
        return 'https://via.placeholder.com/500x750?text=No+Image'
    }
    return `https://image.tmdb.org/t/p/${size}${path}`
}
