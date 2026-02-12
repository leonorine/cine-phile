<script setup lang="ts">
import { ref } from 'vue'
import { Film } from 'lucide-vue-next'

interface Props {
  src: string | null
  alt: string
  size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'w500',
  class: ''
})

const hasError = ref(false)
const isLoading = ref(true)

const handleError = () => {
  hasError.value = true
  isLoading.value = false
}

const handleLoad = () => {
  isLoading.value = false
}
</script>

<template>
  <div class="relative w-full h-full overflow-hidden">
    <!-- Actual Image -->
    <img
      v-if="src && !hasError"
      :src="src"
      :alt="alt"
      :class="props.class"
      @error="handleError"
      @load="handleLoad"
      class="w-full h-full object-cover"
    />
    
    <!-- Fallback Placeholder -->
    <div
      v-else
      class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#7a306c]/20 to-[#03b5aa]/20 backdrop-blur-sm"
    >
      <Film class="w-12 h-12 text-[#ecebe8]/30 mb-3" :stroke-width="1.5" />
      <p class="text-[#ecebe8]/50 text-xs text-center px-4 line-clamp-2">
        {{ alt }}
      </p>
    </div>
    
    <!-- Loading State -->
    <div
      v-if="isLoading && src && !hasError"
      class="absolute inset-0 bg-[#071429]/60 animate-pulse"
    />
  </div>
</template>
