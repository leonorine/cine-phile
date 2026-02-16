<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'
import { exchangeOAuthToken } from '@/services/oauth.service'
import { setToken } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    // Get the session from the URL hash
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      throw sessionError
    }
    
    if (!session) {
      error.value = 'Aucune session trouvée'
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    // Exchange Supabase session for backend JWT
    const response = await exchangeOAuthToken({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      provider_token: session.provider_token || undefined,
      user: {
        id: session.user.id,
        email: session.user.email || '',
        user_metadata: session.user.user_metadata
      }
    })

    // Store the backend JWT token
    setToken(response.token)
    
    // Update auth store with user data
    authStore.currentUser = response.user
    
    // Redirect to dashboard
    router.push({ name: 'dashboard' })
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    error.value = err.message || 'Erreur lors de l\'authentification'
    setTimeout(() => router.push('/login'), 3000)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0f1419] px-4">
    <div class="max-w-md w-full text-center">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="w-16 h-16 mx-auto border-4 border-[#1e90ff] border-t-transparent rounded-full animate-spin"></div>
        <h2 class="text-2xl font-semibold text-[#ecebe8]">Authentification en cours...</h2>
        <p class="text-[#8b949e]">Veuillez patienter</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="space-y-4">
        <div class="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-semibold text-[#ecebe8]">Erreur d'authentification</h2>
        <p class="text-red-400">{{ error }}</p>
        <p class="text-[#8b949e] text-sm">Redirection vers la page de connexion...</p>
      </div>

      <!-- Success State -->
      <div v-else class="space-y-4">
        <div class="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-semibold text-[#ecebe8]">Authentification réussie !</h2>
        <p class="text-[#8b949e]">Redirection...</p>
      </div>
    </div>
  </div>
</template>
