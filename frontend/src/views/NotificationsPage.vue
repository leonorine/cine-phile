<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Bell, Check, Loader2 } from 'lucide-vue-next'

const router = useRouter()

const authStore = useAuthStore()
const isLoading = ref(true)

onMounted(async () => {
  isLoading.value = true
  try {
    await authStore.loadNotifications()
  } catch (error) {
    console.error('Error loading notifications:', error)
  } finally {
    isLoading.value = false
  }
})

const notifications = computed(() => authStore.notifications)

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return '❤️'
    case 'comment': return '💬'
    case 'follow': return '👤'
    case 'friend_request': return '👋'
    case 'friend_accepted': return '🎉'
    default: return '🔔'
  }
}

const getNotificationText = (notification: any) => {
  const actor = notification.actor_pseudo || 'Quelqu\'un'
  switch (notification.type) {
    case 'like':
      return { title: `${actor} a aimé votre avis`, message: 'A aimé l\'un de vos commentaires' }
    case 'comment':
      return { title: `${actor} a commenté`, message: 'A commenté l\'un de vos films' }
    case 'follow':
    case 'friend_request':
      return { title: `${actor} s'est abonné à votre profil`, message: 'Nouvel abonné' }
    case 'friend_accepted':
      return { title: `${actor} est maintenant votre ami`, message: '' }
    default:
      return { title: `Nouvelle notification de ${actor}`, message: '' }
  }
}

const handleNotificationClick = async (notification: any) => {
  await authStore.markNotificationAsRead(notification.id)
  // Navigate to actor's profile if available
  if (notification.actor_id) {
    router.push({ name: 'profile', params: { id: notification.actor_id as string } })
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  return `${days}j`
}



const markAllAsRead = async () => {
  await authStore.markAllNotificationsAsRead()
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] pb-20 md:pb-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 
            class="text-3xl text-[#ecebe8] mb-2" 
            style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em"
          >
            Notifications
          </h1>
          <p class="text-[#ecebe8] opacity-60" style="letter-spacing: 0.005em">
            {{ authStore.unreadNotificationsCount }} non lues
          </p>
        </div>
        <button
          v-if="authStore.unreadNotificationsCount > 0"
          @click="markAllAsRead"
          class="px-4 py-2 text-[#03b5aa] text-sm hover:bg-[#03b5aa]/10 rounded-lg transition-all flex items-center gap-2"
        >
          <Check class="w-4 h-4" />
          Tout marquer comme lu
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-[#03b5aa] animate-spin" />
      </div>

      <!-- Notifications List -->
      <div v-else-if="notifications.length > 0" class="space-y-3">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          @click="handleNotificationClick(notification)"
          :class="[
            'p-4 rounded-xl border transition-all cursor-pointer',
            notification.read 
              ? 'bg-[#071429]/40 border-[#ecebe8]/5' 
              : 'bg-[#071429]/60 border-[#ecebe8]/10 hover:border-[#03b5aa]/30'
          ]"
        >
          <div class="flex items-start gap-4">
            <!-- Avatar or icon -->
            <div class="flex-shrink-0">
              <div v-if="notification.actor_avatar" class="w-10 h-10 rounded-full overflow-hidden">
                <img :src="notification.actor_avatar || undefined" :alt="notification.actor_pseudo || ''" class="w-full h-full object-cover" />
              </div>
              <div v-else class="text-2xl leading-none">
                {{ getNotificationIcon(notification.type) }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-4">
                <p 
                  :class="[
                    'text-sm font-medium',
                    notification.read ? 'text-[#ecebe8]/60' : 'text-[#ecebe8]'
                  ]"
                >
                  {{ getNotificationText(notification).title }}
                </p>
                <span class="text-[#ecebe8] opacity-40 text-xs flex-shrink-0">
                  {{ formatTime(notification.created_at) }}
                </span>
              </div>
              <p 
                v-if="getNotificationText(notification).message"
                :class="[
                  'text-xs mt-0.5',
                  notification.read ? 'text-[#ecebe8]/30' : 'text-[#ecebe8]/50'
                ]"
              >
                {{ getNotificationText(notification).message }}
              </p>
            </div>
            <div 
              v-if="!notification.read"
              class="w-2 h-2 rounded-full bg-[#03b5aa] flex-shrink-0 mt-1"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#071429]/60 border border-[#ecebe8]/10 flex items-center justify-center">
          <Bell class="w-10 h-10 text-[#ecebe8] opacity-30" />
        </div>
        <h3 
          class="text-xl text-[#ecebe8] mb-2" 
          style="font-family: var(--font-serif); font-weight: 500;"
        >
          Aucune notification
        </h3>
        <p class="text-[#ecebe8] opacity-50">
          Vous n'avez aucune notification pour l'instant
        </p>
      </div>
    </div>
  </div>
</template>
