import api from './api'
import type { ApiResponse } from './api'

// Collection item types - matching DB schema
export type CollectionStatus = 'to_watch' | 'watched'
export type DbMediaType = 'film' | 'serie'
export type FrontendMediaType = 'movie' | 'tv'

// DB Schema representation
export interface CollectionItemDB {
    id: string
    user_id: string
    media_id: string
    media_type: DbMediaType
    title: string
    poster_url: string | null
    status: CollectionStatus
    rating: number | null
    added_at: string
    updated_at: string
}

// Frontend representation (for UI)
export interface CollectionItem {
    id: string
    user_id: string
    media_id: number
    media_type: FrontendMediaType
    title: string
    poster_path: string | null
    status: CollectionStatus
    rating: number | null
    notes: string | null
    is_favorite: boolean
    created_at: string
    updated_at: string
}

export interface CreateCollectionItemData {
    media_id: number
    media_type: FrontendMediaType
    title: string
    poster_path?: string | null
    status?: CollectionStatus
    rating?: number
    notes?: string
}

export interface UpdateCollectionItemData {
    status?: CollectionStatus
    rating?: number
    notes?: string | null
    is_favorite?: boolean
}

export interface CollectionFilters {
    status?: CollectionStatus
    media_type?: DbMediaType
    is_favorite?: boolean
    limit?: number
    offset?: number
}

// Helpers to convert between frontend and DB types
function toDbMediaType(type: FrontendMediaType): DbMediaType {
    return type === 'movie' ? 'film' : 'serie'
}

function toFrontendMediaType(type: DbMediaType): FrontendMediaType {
    return type === 'film' ? 'movie' : 'tv'
}

function dbToFrontend(item: CollectionItemDB): CollectionItem {
    return {
        id: item.id,
        user_id: item.user_id,
        media_id: parseInt(item.media_id, 10),
        media_type: toFrontendMediaType(item.media_type),
        title: item.title,
        poster_path: item.poster_url,
        status: item.status,
        rating: item.rating,
        notes: null,
        is_favorite: false,
        created_at: item.added_at,
        updated_at: item.updated_at,
    }
}

// Get user's collection
export async function getCollection(
    filters?: CollectionFilters
): Promise<CollectionItem[]> {
    const response = await api.get<ApiResponse<CollectionItemDB[]>>('/collection', {
        params: filters,
    })
    return (response.data.data || []).map(dbToFrontend)
}

// Add item to collection
export async function addToCollection(
    data: CreateCollectionItemData
): Promise<CollectionItem> {
    const payload = {
        media_id: data.media_id.toString(),
        media_type: toDbMediaType(data.media_type),
        title: data.title,
        poster_url: data.poster_path || null,
        status: data.status || 'to_watch',
        rating: data.rating || null,
    }
    const response = await api.post<ApiResponse<CollectionItemDB>>('/collection', payload)
    return dbToFrontend(response.data.data)
}

// Update collection item
export async function updateCollectionItem(
    id: string,
    data: UpdateCollectionItemData
): Promise<CollectionItem> {
    const response = await api.put<ApiResponse<CollectionItemDB>>(`/collection/${id}`, data)
    return dbToFrontend(response.data.data)
}

// Remove from collection
export async function removeFromCollection(id: string): Promise<void> {
    await api.delete(`/collection/${id}`)
}

// Check if media is in collection
export async function isInCollection(
    mediaId: number,
    mediaType: FrontendMediaType
): Promise<CollectionItem | null> {
    try {
        const collection = await getCollection()
        return collection.find(
            item => item.media_id === mediaId && item.media_type === mediaType
        ) || null
    } catch {
        return null
    }
}
