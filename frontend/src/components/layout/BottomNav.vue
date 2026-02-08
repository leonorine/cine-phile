<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Home, Search, Tv, Users, User } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}

const isActive = (routeName: string) => {
  return route.name === routeName
}
</script>

<template>
  <div class="md:hidden fixed bottom-0 left-0 right-0 bg-[#071429]/95 backdrop-blur-xl border-t border-[#ecebe8]/10 z-50">
    <div class="flex justify-around items-center h-16">
      <button
        @click="navigateTo('dashboard')"
        :class="[
          'flex flex-col items-center gap-1 transition-all',
          isActive('dashboard') ? 'text-[#03b5aa]' : 'text-[#ecebe8] opacity-50'
        ]"
      >
        <Home class="w-5 h-5" />
        <span class="text-xs" style="letter-spacing: 0.02em">Accueil</span>
      </button>
      
      <button
        @click="navigateTo('search')"
        :class="[
          'flex flex-col items-center gap-1 transition-all',
          isActive('search') ? 'text-[#03b5aa]' : 'text-[#ecebe8] opacity-50'
        ]"
      >
        <Search class="w-5 h-5" />
        <span class="text-xs" style="letter-spacing: 0.02em">Recherche</span>
      </button>
      
      <button
        @click="navigateTo('collection')"
        :class="[
          'flex flex-col items-center gap-1 transition-all',
          isActive('collection') ? 'text-[#03b5aa]' : 'text-[#ecebe8] opacity-50'
        ]"
      >
        <Tv class="w-5 h-5" />
        <span class="text-xs" style="letter-spacing: 0.02em">Collection</span>
      </button>
      
      <button
        @click="navigateTo('friends')"
        :class="[
          'flex flex-col items-center gap-1 transition-all',
          isActive('friends') ? 'text-[#03b5aa]' : 'text-[#ecebe8] opacity-50'
        ]"
      >
        <Users class="w-5 h-5" />
        <span class="text-xs" style="letter-spacing: 0.02em">Amis</span>
      </button>
      
      <button
        @click="navigateTo('profile')"
        :class="[
          'flex flex-col items-center gap-1 transition-all',
          isActive('profile') ? 'text-[#03b5aa]' : 'text-[#ecebe8] opacity-50'
        ]"
      >
        <User class="w-5 h-5" />
        <span class="text-xs" style="letter-spacing: 0.02em">Profil</span>
      </button>
    </div>
  </div>
</template>
