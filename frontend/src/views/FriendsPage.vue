<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Users, Search, UserPlus, Loader2 } from 'lucide-vue-next'
import { searchUsers } from '@/services/users.service'
import { followUser, unfollowUser } from '@/services/follows.service'
import type { FollowUser } from '@/services/follows.service'

const router = useRouter()
const authStore = useAuthStore()

const searchQuery = ref('')
const searchResults = ref<FollowUser[]>([])
const isSearching = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  isLoading.value = true
  try {
    await authStore.loadFriends()
  } catch (error) {
    console.error('Error loading friends:', error)
  } finally {
    isLoading.value = false
  }
})

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    searchResults.value = await searchUsers(searchQuery.value)
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    isSearching.value = false
  }
}

const handleFollow = async (userId: string) => {
  try {
    await followUser(userId)
    await authStore.loadFriends()
    // Remove from search results after following
    searchResults.value = searchResults.value.filter(u => u.id !== userId)
  } catch (error) {
    console.error('Error following user:', error)
  }
}

const handleUnfollow = async (userId: string) => {
  try {
    await unfollowUser(userId)
    await authStore.loadFriends()
  } catch (error) {
    console.error('Error unfollowing user:', error)
  }
}

const viewUserProfile = (userId: string) => {
  router.push({ name: 'profile', params: { id: userId } })
}

const getInitials = (name: string) => {
  return name?.substring(0, 2).toUpperCase() || '??'
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] pb-20 md:pb-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 
          class="text-3xl text-[#ecebe8] mb-2" 
          style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em"
        >
          Abonnements
        </h1>
        <p class="text-[#ecebe8] opacity-60" style="letter-spacing: 0.005em">
          {{ authStore.following.length }} abonnements · {{ authStore.followers.length }} abonnés
        </p>
      </div>

      <!-- Search Bar -->
      <div class="relative mb-8">
        <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#ecebe8] opacity-40" />
        <input
          type="text"
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Rechercher des utilisateurs..."
          class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl pl-12 pr-4 py-3 text-[#ecebe8] placeholder-[#ecebe8]/40
            focus:outline-none focus:border-[#03b5aa] focus:ring-2 focus:ring-[#03b5aa]/20 transition-all"
        />
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="mb-8">
        <h3 class="text-sm text-[#ecebe8] opacity-60 mb-4 uppercase tracking-wide">Résultats de recherche</h3>
        <div class="space-y-3">
          <div 
            v-for="user in searchResults" 
            :key="user.id"
            class="p-4 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl flex items-center justify-between hover:border-[#03b5aa]/30 transition-all"
          >
            <div class="flex items-center gap-4 flex-1 cursor-pointer" @click="viewUserProfile(user.id)">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center text-[#ecebe8] font-medium overflow-hidden">
                <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.pseudo" class="w-full h-full object-cover" />
                <template v-else>{{ getInitials(user.pseudo) }}</template>
              </div>
              <div>
                <p class="text-[#ecebe8] font-medium">{{ user.pseudo }}</p>
              </div>
            </div>
            <button
              @click.stop="handleFollow(user.id)"
              class="p-2 bg-[#03b5aa]/10 text-[#03b5aa] rounded-lg hover:bg-[#03b5aa]/20 transition-all"
            >
              <UserPlus class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-[#03b5aa] animate-spin" />
      </div>

      <!-- Following List -->
      <div v-else-if="authStore.following.length > 0" class="space-y-3">
        <h3 class="text-sm text-[#ecebe8] opacity-60 mb-4 uppercase tracking-wide">Mes abonnements</h3>
        <div 
          v-for="user in authStore.following" 
          :key="user.id"
          class="p-4 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl flex items-center justify-between hover:border-[#ecebe8]/20 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center text-[#ecebe8] font-medium overflow-hidden">
              <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.pseudo" class="w-full h-full object-cover" />
              <template v-else>{{ getInitials(user.pseudo) }}</template>
            </div>
            <div>
              <p class="text-[#ecebe8] font-medium">{{ user.pseudo }}</p>
            </div>
          </div>
          <button
            @click="handleUnfollow(user.id)"
            class="px-4 py-2 text-[#7a306c] text-sm hover:bg-[#7a306c]/10 rounded-lg transition-all"
          >
            Se désabonner
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#071429]/60 border border-[#ecebe8]/10 flex items-center justify-center">
          <Users class="w-10 h-10 text-[#ecebe8] opacity-30" />
        </div>
        <h3 
          class="text-xl text-[#ecebe8] mb-2" 
          style="font-family: var(--font-serif); font-weight: 500;"
        >
          Aucun abonnement pour l'instant
        </h3>
        <p class="text-[#ecebe8] opacity-50 mb-6">Recherchez des utilisateurs pour les suivre</p>
      </div>
    </div>
  </div>
</template>
