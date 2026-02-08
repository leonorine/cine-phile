<script setup lang="ts">
import { ref, computed } from 'vue'
import { Star } from 'lucide-vue-next'
import type { Movie } from '@/types'

interface Props {
  movie: Movie
  showRating?: boolean
  userRating?: number
  statusBadge?: 'to_watch' | 'watching' | 'watched'
}

const props = withDefaults(defineProps<Props>(), {
  showRating: true
})

const emit = defineEmits<{
  click: []
}>()

const isHovered = ref(false)

const getStatusColor = (status: string) => {
  switch (status) {
    case 'to_watch':
      return 'bg-[#f8d071]'
    case 'watching':
      return 'bg-[#03b5aa]'
    case 'watched':
      return 'bg-[#7a306c]'
    default:
      return 'bg-[#ecebe8]/20'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'to_watch':
      return 'À voir'
    case 'watching':
      return 'En cours'
    case 'watched':
      return 'Vu'
    default:
      return ''
  }
}

const displayRating = computed(() => {
  return props.userRating || props.movie.rating
})

const starsCount = computed(() => {
  return Math.round(props.movie.rating / 2)
})
</script>

<template>
  <div
    class="relative group cursor-pointer transition-all duration-300"
    @click="emit('click')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Card Container -->
    <div
      :class="[
        'relative overflow-hidden rounded-xl',
        'bg-[#071429]/40 border border-[#ecebe8]/10',
        'transition-all duration-300',
        isHovered 
          ? 'transform scale-[1.03] shadow-[0_12px_40px_rgba(3,181,170,0.2)] border-[#03b5aa]/40' 
          : 'shadow-[0_4px_16px_rgba(7,20,41,0.3)]'
      ]"
      style="aspect-ratio: 2/3"
    >
      <!-- Movie Poster -->
      <img
        :src="movie.posterUrl"
        :alt="movie.title"
        class="w-full h-full object-cover"
      />

      <!-- Status Badge -->
      <div
        v-if="statusBadge"
        :class="[
          'absolute top-3 left-3 px-3 py-1 rounded-full text-[#ecebe8] text-xs font-medium backdrop-blur-sm',
          getStatusColor(statusBadge)
        ]"
        style="letter-spacing: 0.02em"
      >
        {{ getStatusLabel(statusBadge) }}
      </div>

      <!-- Rating Badge -->
      <div
        v-if="showRating && displayRating"
        class="absolute top-3 right-3 w-9 h-9 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center shadow-lg"
      >
        <span class="text-[#ecebe8] text-sm font-medium" style="letter-spacing: 0.01em">
          {{ typeof displayRating === 'number' ? displayRating.toFixed(1) : displayRating }}
        </span>
      </div>

      <!-- Hover Overlay -->
      <div
        :class="[
          'absolute inset-0 bg-gradient-to-t from-[#071429] via-[#071429]/80 to-transparent',
          'transition-opacity duration-300',
          'flex flex-col justify-end p-5',
          isHovered ? 'opacity-100' : 'opacity-0'
        ]"
      >
        <h3 class="text-[#ecebe8] text-base mb-1 line-clamp-2" style="font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em">
          {{ movie.title }}
        </h3>
        <p class="text-[#ecebe8] opacity-60 text-sm mb-3" style="letter-spacing: 0.005em">{{ movie.year }}</p>
        <div class="flex items-center gap-1">
          <Star
            v-for="i in 5"
            :key="i"
            :class="[
              'w-3.5 h-3.5',
              i <= starsCount
                ? 'fill-[#f8d071] text-[#f8d071]'
                : 'fill-[#ecebe8]/10 text-[#ecebe8]/10'
            ]"
          />
          <span class="text-[#f8d071] text-sm ml-1.5 font-medium" style="letter-spacing: 0.01em">{{ movie.rating }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
