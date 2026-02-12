<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { Search, Film, X, Loader2 } from 'lucide-vue-next'
import { getImageUrl } from '@/services/media.service'
import ImageWithFallback from '@/components/ImageWithFallback.vue'

const router = useRouter()
const route = useRoute()
const mediaStore = useMediaStore()

const searchQuery = ref('')
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

onMounted(() => {
  // Check if there's a query in the URL
  const q = route.query.q as string
  if (q) {
    searchQuery.value = q
    mediaStore.search(q)
  } else {
    // Load trending on mount if no search query
    mediaStore.loadTrending()
  }
})

// Debounced search
watch(searchQuery, (newQuery) => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  debounceTimer.value = setTimeout(() => {
    if (newQuery.trim()) {
      mediaStore.search(newQuery)
      router.replace({ query: { q: newQuery } })
    } else {
      mediaStore.clearSearch()
      mediaStore.loadTrending() // Reload trending when search is empty
      router.replace({ query: {} })
    }
  }, 400)
})

const clearSearch = () => {
  searchQuery.value = ''
  mediaStore.clearSearch()
  mediaStore.loadTrending() // Reload trending when clearing search
  router.replace({ query: {} })
}

const viewMovieDetails = (id: number, mediaType: 'movie' | 'tv') => {
  router.push({ name: 'movie-details', params: { id: id.toString() }, query: { type: mediaType } })
}

const loadMore = () => {
  mediaStore.loadMoreResults()
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] pb-20 md:pb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search Header -->
      <div class="mb-8">
        <h1 
          class="text-3xl text-[#ecebe8] mb-6" 
          style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em"
        >
          Rechercher
        </h1>
        
        <!-- Search Input -->
        <div class="relative max-w-2xl">
          <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#ecebe8] opacity-40" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Rechercher un film ou une série..."
            class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl pl-12 pr-12 py-4 text-[#ecebe8] text-lg placeholder-[#ecebe8]/40
              focus:outline-none focus:border-[#03b5aa] focus:ring-2 focus:ring-[#03b5aa]/20 transition-all"
          />
          <button 
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#ecebe8] opacity-40 hover:opacity-100 transition-opacity"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="mediaStore.isLoading && !(mediaStore.searchResults?.length)" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-[#03b5aa] animate-spin" />
      </div>

      <!-- Results Header -->
      <template v-else-if="searchQuery.trim() ? (mediaStore.searchResults || []).length > 0 : (mediaStore.trendingMedia || []).length > 0">
        <div class="flex items-center justify-between mb-6">
          <p class="text-[#ecebe8] opacity-60">
            <template v-if="searchQuery.trim()">
              {{ mediaStore.totalResults }} résultats pour "{{ mediaStore.searchQuery }}"
            </template>
            <template v-else>
              <span class="text-xl font-medium opacity-100">Tendances du moment</span>
            </template>
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div 
            v-for="movie in (searchQuery.trim() ? mediaStore.searchResults : mediaStore.trendingMedia)" 
            :key="`${movie.media_type}-${movie.id}`"
            @click="viewMovieDetails(movie.id, movie.media_type)"
            class="relative group cursor-pointer"
          >
            <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#071429]/60 border border-[#ecebe8]/10">
              <img 
                :src="getImageUrl(movie.poster_path, 'w342')"
                :alt="movie.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <!-- Media Type Badge -->
              <div class="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-[#03b5aa] text-[#ecebe8]">
                {{ movie.media_type === 'movie' ? 'Film' : 'Série' }}
              </div>

              <!-- Info on Hover -->
              <div class="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p class="text-[#ecebe8] font-medium text-sm mb-1 line-clamp-2">{{ movie.title }}</p>
                <div class="flex items-center gap-2 text-xs text-[#ecebe8]/70">
                  <span>⭐ {{ movie.vote_average.toFixed(1) }}</span>
                  <span v-if="movie.release_date">• {{ movie.release_date.split('-')[0] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More Button (only for search results, not trending) -->
        <div v-if="searchQuery.trim() && mediaStore.hasMorePages" class="flex justify-center mt-8">
          <button
            @click="loadMore"
            :disabled="mediaStore.isLoading"
            class="px-8 py-3 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-xl
              hover:bg-[#03b5aa]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="mediaStore.isLoading" class="w-5 h-5 animate-spin" />
            <span v-else>Charger plus</span>
          </button>
        </div>
      </template>

      <!-- No Results -->
      <div v-else-if="searchQuery && !mediaStore.isLoading" class="text-center py-20">
        <Film class="w-16 h-16 text-[#ecebe8] opacity-20 mx-auto mb-4" />
        <p class="text-[#ecebe8] opacity-60 text-lg">Aucun résultat pour "{{ searchQuery }}"</p>
        <p class="text-[#ecebe8] opacity-40 text-sm mt-2">Essayez avec d'autres mots-clés</p>
      </div>

      <!-- Trending Section (when no search) -->
      <template v-else-if="(mediaStore.trendingMedia || []).length > 0">
        <div class="mb-6">
          <h2 
            class="text-xl text-[#ecebe8] mb-2" 
            style="font-family: var(--font-serif); font-weight: 500;"
          >
            🔥 Tendances
          </h2>
          <p class="text-[#ecebe8] opacity-50 text-sm">Découvrez les films et séries populaires du moment</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div 
            v-for="movie in mediaStore.trendingMedia" 
            :key="`trending-${movie.media_type}-${movie.id}`"
            @click="viewMovieDetails(movie.id, movie.media_type)"
            class="relative group cursor-pointer"
          >
            <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#071429]/60 border border-[#ecebe8]/10">
              <img 
                :src="getImageUrl(movie.poster_path, 'w342')"
                :alt="movie.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div class="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-[#03b5aa] text-[#ecebe8]">
                {{ movie.media_type === 'movie' ? 'Film' : 'Série' }}
              </div>

              <div class="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p class="text-[#ecebe8] font-medium text-sm mb-1 line-clamp-2">{{ movie.title }}</p>
                <div class="flex items-center gap-2 text-xs text-[#ecebe8]/70">
                  <span>⭐ {{ movie.vote_average.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
