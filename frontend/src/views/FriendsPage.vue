<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Search, UserPlus, Loader2, Clock, X } from 'lucide-vue-next'
import { searchUsers } from '@/services/users.service'
import { followUser, unfollowUser } from '@/services/follows.service'
import type { FollowUser } from '@/services/follows.service'

const router = useRouter()
const authStore = useAuthStore()

const searchQuery = ref('')
const searchResults = ref<FollowUser[]>([])
const isSearching = ref(false)
const isLoading = ref(true)

// --- Visited Profiles History ---
interface VisitedProfile {
  id: string
  pseudo: string
  avatar_url: string | null
}

const HISTORY_KEY = 'cinephile_visited_profiles'
const MAX_HISTORY = 5
const visitedHistory = ref<VisitedProfile[]>([])

const loadVisitedHistory = () => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    visitedHistory.value = stored ? JSON.parse(stored) : []
  } catch {
    visitedHistory.value = []
  }
}

const saveToVisitedHistory = (profile: VisitedProfile) => {
  // Don't save own profile
  if (profile.id === authStore.currentUser?.id) return
  const history = visitedHistory.value.filter(h => h.id !== profile.id)
  history.unshift(profile)
  visitedHistory.value = history.slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(visitedHistory.value))
}

const removeFromVisitedHistory = (id: string) => {
  visitedHistory.value = visitedHistory.value.filter(h => h.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(visitedHistory.value))
}

const clearVisitedHistory = () => {
  visitedHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
}

const showHistory = computed(() => visitedHistory.value.length > 0 && !searchResults.value.length && !searchQuery.value.trim())

onMounted(async () => {
  loadVisitedHistory()
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

  if (searchQuery.value.trim().length < 2) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    searchResults.value = await searchUsers(searchQuery.value)
  } catch (error) {
    console.error('Error searching users:', error)
  } finally {
    isSearching.value = false
  }
}

const handleFollow = async (userId: string) => {
  try {
    await followUser(userId)
    await authStore.loadFriends()
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

const viewUserProfile = (user: { id: string; pseudo: string; avatar_url: string | null }) => {
  saveToVisitedHistory({ id: user.id, pseudo: user.pseudo, avatar_url: user.avatar_url })
  router.push({ name: 'profile', params: { id: user.id } })
}

const getInitials = (name: string) => {
  return name?.substring(0, 2).toUpperCase() || '??'
}

const isFollowing = (userId: string) => {
  return authStore.following.some(u => u.id === userId)
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
          class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl pl-12 pr-10 py-3 text-[#ecebe8] placeholder-[#ecebe8]/40
            focus:outline-none focus:border-[#03b5aa] focus:ring-2 focus:ring-[#03b5aa]/20 transition-all"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''; searchResults = []"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#ecebe8]/40 hover:text-[#ecebe8] transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Visited Profiles History -->
      <div v-if="showHistory" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm text-[#ecebe8]/60 flex items-center gap-2 uppercase tracking-wide">
            <Clock class="w-4 h-4" />
            Profils récemment consultés
          </h3>
          <button @click="clearVisitedHistory" class="text-[#ecebe8]/30 hover:text-[#ecebe8]/60 text-xs transition-colors">
            Tout effacer
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="profile in visitedHistory"
            :key="profile.id"
            class="p-3 bg-[#071429]/40 border border-[#ecebe8]/5 rounded-xl flex items-center justify-between hover:border-[#ecebe8]/10 transition-all group"
          >
            <div
              class="flex items-center gap-3 flex-1 cursor-pointer"
              @click="viewUserProfile(profile)"
            >
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center text-[#ecebe8] text-sm font-medium overflow-hidden flex-shrink-0">
                <img v-if="profile.avatar_url" :src="profile.avatar_url" :alt="profile.pseudo" class="w-full h-full object-cover" />
                <template v-else>{{ getInitials(profile.pseudo) }}</template>
              </div>
              <p class="text-[#ecebe8]/80 font-medium text-sm">{{ profile.pseudo }}</p>
            </div>
            <button
              @click.stop="removeFromVisitedHistory(profile.id)"
              class="opacity-0 group-hover:opacity-100 text-[#ecebe8]/20 hover:text-[#ecebe8]/60 transition-all p-1"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
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
            <div class="flex items-center gap-4 flex-1 cursor-pointer" @click="viewUserProfile(user)">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center text-[#ecebe8] font-medium overflow-hidden">
                <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.pseudo" class="w-full h-full object-cover" />
                <template v-else>{{ getInitials(user.pseudo) }}</template>
              </div>
              <div>
                <p class="text-[#ecebe8] font-medium">{{ user.pseudo }}</p>
              </div>
            </div>
            <button
              v-if="!isFollowing(user.id)"
              @click.stop="handleFollow(user.id)"
              class="p-2 bg-[#03b5aa]/10 text-[#03b5aa] rounded-lg hover:bg-[#03b5aa]/20 transition-all"
            >
              <UserPlus class="w-5 h-5" />
            </button>
            <button
              v-else
              @click.stop="handleUnfollow(user.id)"
              class="px-4 py-2 text-[#7a306c] text-sm hover:bg-[#7a306c]/10 rounded-lg transition-all"
            >
              Se désabonner
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-[#03b5aa] animate-spin" />
      </div>
    </div>
  </div>
</template>
