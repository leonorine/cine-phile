<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Bell, Shield, Moon, Globe, LogOut, ChevronRight, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const settingsSections = [
  {
    title: 'Compte',
    items: [
      { icon: User, label: 'Modifier le profil', action: 'edit-profile' },
      { icon: Shield, label: 'Sécurité', action: 'security' },
    ],
  },
  {
    title: 'Préférences',
    items: [
      { icon: Bell, label: 'Notifications', action: 'notifications' },
      { icon: Moon, label: 'Thème sombre', action: 'theme', toggle: true },
      { icon: Globe, label: 'Langue', action: 'language' },
    ],
  },
]

const handleAction = (action: string) => {
  console.log('Action:', action)
  // TODO: Implement settings actions
}

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'landing' })
}

const goBack = () => {
  router.back()
}

const getInitials = (name: string | undefined) => {
  return name?.substring(0, 2).toUpperCase() || '??'
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] pb-20 md:pb-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="mb-6 flex items-center gap-2 text-[#ecebe8] opacity-60 hover:opacity-100 transition-opacity"
      >
        <ArrowLeft class="w-5 h-5" />
        Retour
      </button>

      <h1 
        class="text-3xl text-[#ecebe8] mb-8" 
        style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em"
      >
        Paramètres
      </h1>

      <!-- User Info -->
      <div v-if="authStore.currentUser" class="bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl p-6 mb-8 flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center text-[#ecebe8] text-xl font-bold overflow-hidden">
          <img 
            v-if="authStore.currentUser.avatar_url" 
            :src="authStore.currentUser.avatar_url" 
            :alt="authStore.currentUser.username"
            class="w-full h-full object-cover" 
          />
          <template v-else>
            {{ getInitials(authStore.currentUser.username) }}
          </template>
        </div>
        <div>
          <p class="text-[#ecebe8] font-medium text-lg">{{ authStore.currentUser.username }}</p>
          <p class="text-[#ecebe8] opacity-50 text-sm">{{ authStore.currentUser.email }}</p>
        </div>
      </div>

      <!-- Settings Sections -->
      <div class="space-y-6">
        <div v-for="section in settingsSections" :key="section.title">
          <h3 class="text-sm text-[#ecebe8] opacity-60 uppercase tracking-wide mb-3 px-2">
            {{ section.title }}
          </h3>
          <div class="bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl overflow-hidden divide-y divide-[#ecebe8]/5">
            <button
              v-for="item in section.items"
              :key="item.action"
              @click="handleAction(item.action)"
              class="w-full p-4 flex items-center gap-4 hover:bg-[#ecebe8]/5 transition-all"
            >
              <component :is="item.icon" class="w-5 h-5 text-[#ecebe8] opacity-60" />
              <span class="flex-1 text-left text-[#ecebe8]">{{ item.label }}</span>
              <ChevronRight class="w-5 h-5 text-[#ecebe8] opacity-30" />
            </button>
          </div>
        </div>

        <!-- Logout -->
        <button
          @click="handleLogout"
          class="w-full p-4 bg-[#7a306c]/10 border border-[#7a306c]/20 rounded-xl flex items-center gap-4 text-[#7a306c] hover:bg-[#7a306c]/20 transition-all"
        >
          <LogOut class="w-5 h-5" />
          <span class="flex-1 text-left font-medium">Se déconnecter</span>
        </button>
      </div>
    </div>
  </div>
</template>
