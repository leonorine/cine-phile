<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Header from '@/components/layout/Header.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useMobile } from '@/composables/useMobile'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()
const { isMobile } = useMobile()

// Pages where header should not be shown
const publicPages = ['landing', 'login', 'signup', 'reset-password']

const shouldShowHeader = () => {
  return !publicPages.includes(route.name as string)
}

onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <div class="min-h-screen bg-[#071429]">
    <!-- Header - Desktop & Mobile (but different on mobile via bottom nav) -->
    <Header 
      v-if="authStore.isAuthenticated && shouldShowHeader()" 
    />
    
    <!-- Main Content -->
    <main :class="{ 'pb-20': isMobile && authStore.isAuthenticated && shouldShowHeader() }">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- Bottom Navigation - Mobile Only -->
    <BottomNav 
      v-if="isMobile && authStore.isAuthenticated && shouldShowHeader()" 
    />
  </div>
</template>

<style>
/* Base app styles are in assets/styles/index.css */
</style>
