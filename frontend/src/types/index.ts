// Core Types for Cinema Platform

export interface User {
    id: string
    pseudo: string
    email: string
    avatar?: string
    bio?: string
    memberSince: string
    stats: {
        totalMovies: number
        totalComments: number
        totalFriends: number
    }
}

export type MovieStatus = 'to_watch' | 'watching' | 'watched'

export interface Movie {
    id: string
    title: string
    year: number
    posterUrl: string
    backdropUrl?: string
    genre: string[]
    director: string
    actors: string[]
    duration: number
    synopsis: string
    rating: number
    releaseDate: string
    budget?: number
    revenue?: number
    streamingPlatforms?: string[]
}

export interface UserMovie {
    movieId: string
    status: MovieStatus
    userRating?: number
    addedAt: string
}

export interface Comment {
    id: string
    userId: string
    movieId: string
    text: string
    images?: string[]
    createdAt: string
    likes: number
    likedBy: string[]
}

export interface Notification {
    id: string
    type: 'friend' | 'comment' | 'like' | 'movie'
    message: string
    timestamp: string
    read: boolean
    fromUserId?: string
    relatedMovieId?: string
}

export interface FriendRequest {
    id: string
    fromUserId: string
    toUserId: string
    status: 'pending' | 'accepted' | 'rejected'
    createdAt: string
}

// Navigation types for Vue Router
export type RouteName =
    | 'landing'
    | 'login'
    | 'signup'
    | 'reset-password'
    | 'dashboard'
    | 'search'
    | 'movie-details'
    | 'collection'
    | 'profile'
    | 'friends'
    | 'notifications'
    | 'settings'
