import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as mediaService from '@/services/media.service'
import type { MediaSearchResult, MediaDetails } from '@/services/media.service'

export const useMediaStore = defineStore('media', () => {
    // State
    const searchResults = ref<MediaSearchResult[]>([])
    const searchQuery = ref('')
    const currentPage = ref(1)
    const totalPages = ref(0)
    const totalResults = ref(0)

    const trendingMedia = ref<MediaSearchResult[]>([])
    const currentMedia = ref<MediaDetails | null>(null)

    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Computed
    const hasSearchResults = computed(() => searchResults.value.length > 0)
    const hasMorePages = computed(() => currentPage.value < totalPages.value)

    // Actions
    const search = async (query: string, page: number = 1): Promise<void> => {
        if (!query.trim()) {
            searchResults.value = []
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const response = await mediaService.searchMedia(query, page)

            if (page === 1) {
                searchResults.value = response.results
            } else {
                searchResults.value = [...searchResults.value, ...response.results]
            }

            searchQuery.value = query
            currentPage.value = response.page
            totalPages.value = response.total_pages
            totalResults.value = response.total_results
        } catch (err: any) {
            error.value = err.message || 'Erreur lors de la recherche'
            console.error('Search error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const loadMoreResults = async (): Promise<void> => {
        if (!hasMorePages.value || isLoading.value) return
        await search(searchQuery.value, currentPage.value + 1)
    }

    const clearSearch = () => {
        searchResults.value = []
        searchQuery.value = ''
        currentPage.value = 1
        totalPages.value = 0
        totalResults.value = 0
    }

    const loadTrending = async (): Promise<void> => {
        if (trendingMedia.value?.length > 0) return // Already loaded

        isLoading.value = true
        error.value = null

        try {
            const response = await mediaService.getTrending()
            // Backend returns array directly, not { results: [...] }
            trendingMedia.value = Array.isArray(response) ? response : []
        } catch (err: any) {
            error.value = err.message || 'Erreur lors du chargement des tendances'
            console.error('Trending error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const loadMediaDetails = async (type: 'movie' | 'tv', id: number | string): Promise<void> => {
        isLoading.value = true
        error.value = null
        currentMedia.value = null

        try {
            currentMedia.value = await mediaService.getMediaDetails(type, id)
        } catch (err: any) {
            error.value = err.message || 'Erreur lors du chargement des détails'
            console.error('Media details error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const clearCurrentMedia = () => {
        currentMedia.value = null
    }

    return {
        // State
        searchResults,
        searchQuery,
        currentPage,
        totalPages,
        totalResults,
        trendingMedia,
        currentMedia,
        isLoading,
        error,
        // Computed
        hasSearchResults,
        hasMorePages,
        // Actions
        search,
        loadMoreResults,
        clearSearch,
        loadTrending,
        loadMediaDetails,
        clearCurrentMedia,
    }
})
