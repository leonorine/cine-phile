<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Tv, Plus, Loader2, Filter, Film, Star, Trash2 } from 'lucide-vue-next'
import { getImageUrl } from '@/services/media.service'
import type { CollectionStatus } from '@/services/collection.service'

const router = useRouter()
const authStore = useAuthStore()

const activeStatus = ref<'all' | CollectionStatus>('all')
const activeType = ref<'all' | 'movie' | 'tv'>('all')
const isLoading = ref(true)

const statusTabs = [
  { id: 'all' as const, label: 'Tous' },
  { id: 'to_watch' as CollectionStatus, label: 'À voir' },
  { id: 'watched' as CollectionStatus, label: 'Visionnés' },
]

const typeTabs = [
  { id: 'all' as const, label: 'Tout', icon: null },
  { id: 'movie' as const, label: 'Films', icon: Film },
  { id: 'tv' as const, label: 'Séries', icon: Tv },
]

onMounted(async () => {
  isLoading.value = true
  try {
    await authStore.loadCollection()
  } catch (error) {
    console.error('Error loading collection:', error)
  } finally {
    isLoading.value = false
  }
})

const filteredCollection = computed(() => {
  let items = authStore.collection || []
  
  // Filter by status
  if (activeStatus.value !== 'all') {
    items = items.filter(item => item.status === activeStatus.value)
  }
  
  // Filter by media type
  if (activeType.value !== 'all') {
    items = items.filter(item => item.media_type === activeType.value)
  }
  
  return items
})

const getCountByStatus = (status: CollectionStatus | 'all') => {
  if (status === 'all') return authStore.collection?.length || 0
  return (authStore.collection || []).filter(item => item.status === status).length
}

const getStatusColor = (status: CollectionStatus) => {
  switch (status) {
    case 'to_watch': return 'bg-[#7a306c]'
    case 'watched': return 'bg-[#03b5aa]'
    default: return 'bg-[#03b5aa]'
  }
}

const getStatusLabel = (status: CollectionStatus) => {
  switch (status) {
    case 'to_watch': return 'À voir'
    case 'watched': return 'Vu'
    default: return status
  }
}

const viewMovieDetails = (mediaId: number, mediaType: 'movie' | 'tv') => {
  router.push({ name: 'movie-details', params: { id: mediaId.toString() }, query: { type: mediaType } })
}

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}

const renderStars = (rating: number) => {
  return rating // Already stored as /5 float
}

const isDeleting = ref<string | null>(null)

const handleDelete = async (event: Event, itemId: string, itemTitle: string) => {
  event.stopPropagation() // Prevent navigation to details
  
  if (!confirm(`Voulez-vous vraiment supprimer "${itemTitle}" de votre collection ?`)) {
    return
  }
  
  isDeleting.value = itemId
  try {
    await authStore.removeFromCollection(itemId)
  } catch (error) {
    console.error('Error deleting item:', error)
    alert('Erreur lors de la suppression')
  } finally {
    isDeleting.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] pb-20 md:pb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 
            class="text-3xl text-[#ecebe8] mb-2" 
            style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em"
          >
            Ma collection
          </h1>
          <p class="text-[#ecebe8] opacity-60" style="letter-spacing: 0.005em">
            {{ authStore.collection?.length || 0 }} films et séries
          </p>
        </div>
        <button
          @click="navigateTo('search')"
          class="px-4 py-2 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-lg
            hover:bg-[#03b5aa]/90 transition-all flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <!-- Filters Section -->
      <div class="mb-8 space-y-4">
        <!-- Status Filter -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in statusTabs"
            :key="tab.id"
            @click="activeStatus = tab.id"
            :class="[
              'px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap',
              activeStatus === tab.id
                ? 'bg-[#03b5aa] text-[#ecebe8]'
                : 'bg-[#071429]/60 text-[#ecebe8] opacity-60 hover:opacity-100 border border-[#ecebe8]/10'
            ]"
          >
            {{ tab.label }}
            <span class="ml-1 opacity-60">({{ getCountByStatus(tab.id) }})</span>
          </button>
        </div>

        <!-- Type Filter -->
        <div class="flex flex-wrap gap-2">
          <span class="text-[#ecebe8]/50 text-sm flex items-center gap-1 mr-2">
            <Filter class="w-4 h-4" />
            Type:
          </span>
          <button
            v-for="tab in typeTabs"
            :key="tab.id"
            @click="activeType = tab.id"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5',
              activeType === tab.id
                ? 'bg-[#7a306c] text-[#ecebe8]'
                : 'bg-[#071429]/60 text-[#ecebe8] opacity-60 hover:opacity-100 border border-[#ecebe8]/10'
            ]"
          >
            <component v-if="tab.icon" :is="tab.icon" class="w-3.5 h-3.5" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-[#03b5aa] animate-spin" />
      </div>

      <!-- Collection Grid -->
      <div v-else-if="filteredCollection.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div 
          v-for="item in filteredCollection" 
          :key="item.id"
          @click="viewMovieDetails(item.media_id, item.media_type)"
          class="relative group cursor-pointer"
        >
          <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#071429]/60 border border-[#ecebe8]/10">
            <img 
              :src="getImageUrl(item.poster_path, 'w342')"
              :alt="item.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <!-- Status Badge -->
            <div 
              class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
              :class="getStatusColor(item.status)"
            >
              {{ getStatusLabel(item.status) }}
            </div>

            <!-- Media Type Badge -->
            <div class="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-[#071429]/80 text-[#ecebe8]">
              {{ item.media_type === 'movie' ? 'Film' : 'Série' }}
            </div>

            <!-- Delete Button -->
            <button
              @click="handleDelete($event, item.id, item.title)"
              :disabled="isDeleting === item.id"
              class="absolute bottom-2 right-2 p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 z-10"
              title="Supprimer de la collection"
            >
              <Loader2 v-if="isDeleting === item.id" class="w-4 h-4 animate-spin" />
              <Trash2 v-else class="w-4 h-4" />
            </button>

            <!-- Info on Hover -->
            <div class="absolute bottom-0 left-0 right-0 p-4 pb-12 opacity-0 group-hover:opacity-100 transition-opacity">
              <p class="text-[#ecebe8] font-medium text-sm mb-1 line-clamp-2">{{ item.title }}</p>
              <div v-if="item.rating" class="flex items-center gap-0.5">
                <Star 
                  v-for="star in 5" 
                  :key="star"
                  class="w-3 h-3"
                  :class="star <= renderStars(item.rating) ? 'text-[#f8d071]' : (star - 0.5 <= renderStars(item.rating) ? 'text-[#f8d071]/60' : 'text-[#ecebe8]/30')"
                  :fill="star <= renderStars(item.rating) ? '#f8d071' : 'none'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#071429]/60 border border-[#ecebe8]/10 flex items-center justify-center">
          <Tv class="w-10 h-10 text-[#ecebe8] opacity-30" />
        </div>
        <h3 
          class="text-xl text-[#ecebe8] mb-2" 
          style="font-family: var(--font-serif); font-weight: 500;"
        >
          {{ activeStatus === 'all' && activeType === 'all' ? 'Votre collection est vide' : 'Aucun résultat' }}
        </h3>
        <p class="text-[#ecebe8] opacity-50 mb-6">
          {{ activeStatus === 'all' && activeType === 'all' ? 'Commencez à ajouter des films et séries !' : 'Essayez de modifier les filtres' }}
        </p>
        <button
          @click="navigateTo('search')"
          class="px-6 py-3 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-xl
            hover:bg-[#03b5aa]/90 transition-all shadow-[0_4px_12px_rgba(3,181,170,0.3)]"
        >
          Découvrir des films
        </button>
      </div>
    </div>
  </div>
</template>
