<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Film, Tv, Loader2, X } from 'lucide-vue-next'
import { searchMedia, getImageUrl } from '@/services/media.service'

const router = useRouter()

const query = ref('')
const results = ref<any[]>([])
const isSearching = ref(false)
const isOpen = ref(false)
const selectedIndex = ref(-1)

// Debounce search
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

watch(query, (newQuery) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  
  if (newQuery.length < 2) {
    results.value = []
    isOpen.value = false
    return
  }
  
  debounceTimeout = setTimeout(async () => {
    isSearching.value = true
    try {
      const data = await searchMedia(newQuery)
      results.value = data.results.slice(0, 8) // Limit to 8 results
      isOpen.value = results.value.length > 0
      selectedIndex.value = -1
    } catch (error) {
      console.error('Search error:', error)
      results.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
})

const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
    e.preventDefault()
    selectResult(results.value[selectedIndex.value])
  } else if (e.key === 'Escape') {
    closeDropdown()
  }
}

const selectResult = (item: any) => {
  const type = item.media_type === 'tv' ? 'tv' : 'movie'
  router.push({ name: 'movie-details', params: { id: item.id }, query: { type } })
  closeDropdown()
}

const closeDropdown = () => {
  isOpen.value = false
  query.value = ''
  results.value = []
}

const getTitle = (item: any) => item.title || item.name
const getYear = (item: any) => {
  const date = item.release_date || item.first_air_date
  return date ? date.split('-')[0] : ''
}
</script>

<template>
  <div class="relative w-full max-w-md">
    <!-- Search Input -->
    <div class="relative">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ecebe8]/40" />
      <input
        v-model="query"
        @keydown="handleKeydown"
        @focus="isOpen = results.length > 0"
        type="text"
        placeholder="Rechercher un film ou une série..."
        class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl pl-12 pr-10 py-3 text-[#ecebe8] placeholder-[#ecebe8]/40
          focus:outline-none focus:border-[#03b5aa] focus:ring-2 focus:ring-[#03b5aa]/20 transition-all"
      />
      <Loader2 v-if="isSearching" class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#03b5aa] animate-spin" />
      <button
        v-else-if="query"
        @click="closeDropdown"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-[#ecebe8]/40 hover:text-[#ecebe8]/70"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Click outside handler - must be BEFORE the dropdown in DOM to not intercept clicks -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />

    <!-- Dropdown Results -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <div
        v-if="isOpen && results.length > 0"
        class="absolute top-full left-0 right-0 mt-2 bg-[#0a1d35] border border-[#ecebe8]/10 rounded-xl shadow-2xl overflow-hidden z-50"
      >
        <div class="max-h-96 overflow-y-auto">
          <button
            v-for="(item, index) in results"
            :key="item.id"
            @click.stop="selectResult(item)"
            @mouseenter="selectedIndex = index"
            :class="[
              'w-full flex items-center gap-3 p-3 transition-colors text-left',
              index === selectedIndex ? 'bg-[#03b5aa]/10' : 'hover:bg-[#ecebe8]/5'
            ]"
          >
            <!-- Poster -->
            <div class="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[#071429]/60">
              <img
                v-if="item.poster_path"
                :src="getImageUrl(item.poster_path, 'w92')"
                :alt="getTitle(item)"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <Film v-if="item.media_type === 'movie'" class="w-6 h-6 text-[#ecebe8]/20" />
                <Tv v-else class="w-6 h-6 text-[#ecebe8]/20" />
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-[#ecebe8] font-medium truncate">{{ getTitle(item) }}</p>
              <div class="flex items-center gap-2 text-sm text-[#ecebe8]/50">
                <span v-if="getYear(item)">{{ getYear(item) }}</span>
                <span class="flex items-center gap-1">
                  <Film v-if="item.media_type === 'movie'" class="w-3 h-3" />
                  <Tv v-else class="w-3 h-3" />
                  {{ item.media_type === 'movie' ? 'Film' : 'Série' }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
