<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import { Star, TrendingUp, Users, Film, Sparkles, Loader2 } from 'lucide-vue-next'
import { getImageUrl } from '@/services/media.service'
import * as recommendationsService from '@/services/recommendations.service'
import type { RecommendationsResponse } from '@/services/recommendations.service'
import SearchAutocomplete from '@/components/SearchAutocomplete.vue'

const router = useRouter()
const authStore = useAuthStore()
const mediaStore = useMediaStore()

const isLoading = ref(true)
const recommendations = ref<RecommendationsResponse | null>(null)
const isLoadingRecommendations = ref(false)

// Computed properties
const currentUser = computed(() => authStore.currentUser)
const trendingMovies = computed(() => (mediaStore.trendingMedia || []).slice(0, 6))
const friends = computed(() => (authStore.friends || []).slice(0, 4))
const collection = computed(() => (authStore.collection || []).slice(0, 4))

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      mediaStore.loadTrending(),
      authStore.loadCollection(),
      authStore.loadFriends(),
    ])
    
    // Load recommendations after collection is loaded
    loadRecommendations()
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    isLoading.value = false
  }
})

const loadRecommendations = async () => {
  if (!authStore.currentUser) return
  
  isLoadingRecommendations.value = true
  try {
    recommendations.value = await recommendationsService.getRecommendations()
  } catch (error) {
    console.error('Error loading recommendations:', error)
  } finally {
    isLoadingRecommendations.value = false
  }
}

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}

const viewMovieDetails = (id: number, mediaType: 'movie' | 'tv') => {
  router.push({ name: 'movie-details', params: { id: id.toString() }, query: { type: mediaType } })
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] pb-20 md:pb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Section -->
      <div class="mb-10">
        <h1 
          class="text-3xl md:text-4xl text-[#ecebe8] mb-2" 
          style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em"
        >
          Bonjour, {{ currentUser?.username || 'Cinéphile' }} 👋
        </h1>
        <p class="text-[#ecebe8] opacity-60 text-lg" style="letter-spacing: 0.005em">
          Découvrez les tendances et gérez votre collection
        </p>

        <!-- Search Bar -->
        <div class="mt-6">
          <SearchAutocomplete />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-[#03b5aa] border-t-transparent rounded-full animate-spin" />
      </div>

      <template v-else>
        <!-- Trending Section -->
        <section class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <TrendingUp class="w-6 h-6 text-[#03b5aa]" />
              <h2 
                class="text-xl text-[#ecebe8]" 
                style="font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em"
              >
                Tendances du moment
              </h2>
            </div>
            <button 
              @click="navigateTo('search')"
              class="text-[#03b5aa] text-sm hover:text-[#03b5aa]/80 transition-colors"
            >
              Voir tout →
            </button>
          </div>

          <div v-if="trendingMovies.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div 
              v-for="movie in trendingMovies" 
              :key="movie.id"
              @click="viewMovieDetails(movie.id, movie.media_type)"
              class="relative group cursor-pointer"
            >
              <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#071429]/60 border border-[#ecebe8]/10">
                <img 
                  :src="getImageUrl(movie.poster_path, 'w342')"
                  :alt="movie.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <p class="text-[#ecebe8] text-sm font-medium truncate">{{ movie.title }}</p>
                <div class="flex items-center gap-1 mt-1">
                  <Star class="w-3 h-3 text-[#f8d071]" fill="#f8d071" />
                  <span class="text-[#ecebe8] text-xs">{{ movie.vote_average.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12 text-[#ecebe8] opacity-50">
            Aucune tendance disponible pour le moment
          </div>
        </section>

        <!-- Pour vous (Recommendations) Section -->
        <section v-if="recommendations || isLoadingRecommendations" class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <Sparkles class="w-6 h-6 text-[#f8d071]" />
              <div>
                <h2 
                  class="text-xl text-[#ecebe8]" 
                  style="font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em"
                >
                  Pour vous
                </h2>
                <p v-if="recommendations?.reason" class="text-[#ecebe8] opacity-50 text-sm mt-0.5">
                  {{ recommendations.reason }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="isLoadingRecommendations" class="flex justify-center py-12">
            <Loader2 class="w-6 h-6 text-[#f8d071] animate-spin" />
          </div>

          <div v-else-if="recommendations?.recommendations?.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div 
              v-for="movie in recommendations.recommendations.slice(0, 5)" 
              :key="movie.id"
              @click="viewMovieDetails(movie.id, 'movie')"
              class="relative group cursor-pointer"
            >
              <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#071429]/60 border border-[#ecebe8]/10">
                <img 
                  :src="getImageUrl(movie.poster_path, 'w342')"
                  :alt="movie.title || movie.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <p class="text-[#ecebe8] text-sm font-medium truncate">{{ movie.title || movie.name }}</p>
                <div class="flex items-center gap-1 mt-1">
                  <Star class="w-3 h-3 text-[#f8d071]" fill="#f8d071" />
                  <span class="text-[#ecebe8] text-xs">{{ movie.vote_average?.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="mb-12">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              @click="navigateTo('collection')"
              class="p-6 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl hover:border-[#03b5aa]/40 transition-all flex items-center gap-4"
            >
              <div class="w-12 h-12 rounded-lg bg-[#03b5aa]/10 flex items-center justify-center">
                <Film class="w-6 h-6 text-[#03b5aa]" />
              </div>
              <div class="text-left">
                <p class="text-[#ecebe8] font-medium">Ma collection</p>
                <p class="text-[#ecebe8] opacity-50 text-sm">{{ collection.length }} films</p>
              </div>
            </button>

            <button 
              @click="navigateTo('friends')"
              class="p-6 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl hover:border-[#7a306c]/40 transition-all flex items-center gap-4"
            >
              <div class="w-12 h-12 rounded-lg bg-[#7a306c]/10 flex items-center justify-center">
                <Users class="w-6 h-6 text-[#7a306c]" />
              </div>
              <div class="text-left">
                <p class="text-[#ecebe8] font-medium">Mes amis</p>
                <p class="text-[#ecebe8] opacity-50 text-sm">{{ friends.length }} amis</p>
              </div>
            </button>

            <button 
              @click="navigateTo('search')"
              class="p-6 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl hover:border-[#f8d071]/40 transition-all flex items-center gap-4"
            >
              <div class="w-12 h-12 rounded-lg bg-[#f8d071]/10 flex items-center justify-center">
                <Star class="w-6 h-6 text-[#f8d071]" />
              </div>
              <div class="text-left">
                <p class="text-[#ecebe8] font-medium">Découvrir</p>
                <p class="text-[#ecebe8] opacity-50 text-sm">Rechercher des films</p>
              </div>
            </button>
          </div>
        </section>

        <!-- Collection Preview -->
        <section v-if="collection.length > 0" class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <Film class="w-6 h-6 text-[#f8d071]" />
              <h2 
                class="text-xl text-[#ecebe8]" 
                style="font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em"
              >
                Ma collection
              </h2>
            </div>
            <button 
              @click="navigateTo('collection')"
              class="text-[#03b5aa] text-sm hover:text-[#03b5aa]/80 transition-colors"
            >
              Voir tout →
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div 
              v-for="item in collection" 
              :key="item.id"
              @click="viewMovieDetails(item.media_id, item.media_type)"
              class="relative group cursor-pointer"
            >
              <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#071429]/60 border border-[#ecebe8]/10">
                <img 
                  :src="getImageUrl(item.poster_path, 'w342')"
                  :alt="item.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div 
                class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-[#03b5aa] text-[#ecebe8]': item.status === 'watched',
                  'bg-[#7a306c] text-[#ecebe8]': item.status === 'to_watch',
                }"
              >
                {{ item.status === 'watched' ? 'Vu' : 'À voir' }}
              </div>
            </div>
          </div>
        </section>

        <!-- Friends Preview -->
        <section v-if="friends.length > 0">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <Users class="w-6 h-6 text-[#7a306c]" />
              <h2 
                class="text-xl text-[#ecebe8]" 
                style="font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em"
              >
                Mes amis
              </h2>
            </div>
            <button 
              @click="navigateTo('friends')"
              class="text-[#03b5aa] text-sm hover:text-[#03b5aa]/80 transition-colors"
            >
              Voir tout →
            </button>
          </div>

          <div class="flex flex-wrap gap-4">
            <div 
              v-for="friend in friends" 
              :key="friend.id"
              class="flex items-center gap-3 p-4 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl"
            >
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center text-[#ecebe8] font-medium text-sm overflow-hidden">
                <img 
                  v-if="friend.avatar_url" 
                  :src="friend.avatar_url" 
                  :alt="friend.username"
                  class="w-full h-full object-cover" 
                />
                <template v-else>
                  {{ friend.username?.substring(0, 2).toUpperCase() }}
                </template>
              </div>
              <span class="text-[#ecebe8]">{{ friend.username }}</span>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
