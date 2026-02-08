<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Search, Bell, User, Tv, Users, LogOut, Settings } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)

const getInitials = (pseudo: string) => {
  return pseudo
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
  showUserMenu.value = false
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'landing' })
  showUserMenu.value = false
}
</script>

<template>
  <header class="bg-[#071429]/90 backdrop-blur-xl border-b border-[#ecebe8]/10 sticky top-0 z-50">
    <div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div
          class="flex items-center gap-3 cursor-pointer group"
          @click="navigateTo(authStore.currentUser ? 'dashboard' : 'landing')"
        >
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center shadow-[0_0_20px_rgba(3,181,170,0.2)] transition-transform group-hover:scale-105">
            <Tv class="w-5 h-5 text-[#ecebe8]" :stroke-width="1.5" />
          </div>
          <span class="text-[#ecebe8] text-xl tracking-tight hidden sm:block" style="font-family: var(--font-display); letter-spacing: -0.01em">MediaTrack</span>
        </div>

        <!-- Right Side - User Menu -->
        <div v-if="authStore.currentUser" class="flex items-center gap-4">
          <!-- Search Icon - Mobile -->
          <button
            @click="navigateTo('search')"
            class="md:hidden text-[#ecebe8] opacity-70 hover:opacity-100 transition-opacity"
          >
            <Search class="w-5 h-5" />
          </button>

          <!-- Notifications -->
          <button
            @click="navigateTo('notifications')"
            class="relative text-[#ecebe8] opacity-70 hover:opacity-100 transition-opacity"
          >
            <Bell class="w-5 h-5" />
            <span
              v-if="authStore.unreadNotificationsCount > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-[#7a306c] rounded-full text-[#ecebe8] text-xs flex items-center justify-center font-medium"
            >
              {{ authStore.unreadNotificationsCount > 9 ? '9+' : authStore.unreadNotificationsCount }}
            </span>
          </button>

          <!-- User Menu -->
          <div class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="w-9 h-9 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center text-[#ecebe8] font-medium text-sm overflow-hidden ring-2 ring-[#03b5aa]/20 hover:ring-[#03b5aa]/40 transition-all"
              style="letter-spacing: 0.02em"
            >
              <img
                v-if="authStore.currentUser.avatar_url"
                :src="authStore.currentUser.avatar_url"
                :alt="authStore.currentUser.username"
                class="w-full h-full object-cover"
              />
              <template v-else>
                {{ getInitials(authStore.currentUser.username) }}
              </template>
            </button>

            <!-- Dropdown Menu -->
            <template v-if="showUserMenu">
              <div
                class="fixed inset-0 z-40"
                @click="showUserMenu = false"
              />
              <div class="absolute right-0 mt-2 w-48 bg-[#071429]/95 backdrop-blur-xl border border-[#ecebe8]/10 rounded-lg shadow-2xl py-2 z-50">
                <button
                  @click="navigateTo('profile')"
                  class="w-full px-4 py-2.5 text-left text-[#ecebe8] hover:bg-[#ecebe8]/5 flex items-center gap-3 transition-colors"
                  style="letter-spacing: 0.01em"
                >
                  <User class="w-4 h-4" />
                  Mon profil
                </button>
                <button
                  @click="navigateTo('collection')"
                  class="w-full px-4 py-2.5 text-left text-[#ecebe8] hover:bg-[#ecebe8]/5 flex items-center gap-3 transition-colors"
                  style="letter-spacing: 0.01em"
                >
                  <Tv class="w-4 h-4" />
                  Ma collection
                </button>
                <button
                  @click="navigateTo('friends')"
                  class="w-full px-4 py-2.5 text-left text-[#ecebe8] hover:bg-[#ecebe8]/5 flex items-center gap-3 transition-colors"
                  style="letter-spacing: 0.01em"
                >
                  <Users class="w-4 h-4" />
                  Mes amis
                </button>
                <button
                  @click="navigateTo('settings')"
                  class="w-full px-4 py-2.5 text-left text-[#ecebe8] hover:bg-[#ecebe8]/5 flex items-center gap-3 transition-colors"
                  style="letter-spacing: 0.01em"
                >
                  <Settings class="w-4 h-4" />
                  Paramètres
                </button>
                <div class="border-t border-[#ecebe8]/10 my-2" />
                <button
                  @click="handleLogout"
                  class="w-full px-4 py-2.5 text-left text-[#7a306c] hover:bg-[#ecebe8]/5 flex items-center gap-3 transition-colors"
                  style="letter-spacing: 0.01em"
                >
                  <LogOut class="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Not Logged In -->
        <div v-else class="flex items-center gap-3">
          <button
            @click="navigateTo('login')"
            class="px-5 py-2 text-[#ecebe8] opacity-70 hover:opacity-100 transition-opacity"
            style="letter-spacing: 0.02em"
          >
            Connexion
          </button>
          <button
            @click="navigateTo('signup')"
            class="px-6 py-2.5 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-lg 
              hover:bg-[#03b5aa]/90 transition-all shadow-[0_4px_20px_rgba(3,181,170,0.25)]"
            style="letter-spacing: 0.02em"
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
