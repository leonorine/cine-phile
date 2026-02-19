<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const error = ref('')
const loading = ref(false)

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  error.value = ''
  loading.value = true

  // Basic validation
  if (!email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs'
    loading.value = false
    return
  }

  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      router.push({ name: 'dashboard' })
    } else {
      error.value = authStore.error || 'Email ou mot de passe incorrect'
    }
  } catch (err: any) {
    error.value = err.message || 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  try {
    const { supabase } = await import('../services/supabase')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account'
        }
      }
    })
    
    if (oauthError) {
      console.error('Google OAuth error:', oauthError)
      error.value = 'Erreur lors de la connexion avec Google'
    }
  } catch (err) {
    console.error('Google login error:', err)
    error.value = 'Erreur lors de la connexion avec Google'
  }
}

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="bg-[#071429]/60 backdrop-blur-xl border border-[#ecebe8]/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(7,20,41,0.4)]">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 
            class="text-3xl text-[#ecebe8] mb-2" 
            style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em"
          >
            Connexion
          </h1>
          <p class="text-[#ecebe8] opacity-60" style="letter-spacing: 0.005em">Bon retour parmi nous !</p>
        </div>

        <!-- Error Message -->
        <div 
          v-if="error" 
          class="mb-6 p-4 bg-[#7a306c]/10 border border-[#7a306c]/30 rounded-lg flex items-start gap-3"
        >
          <AlertCircle class="w-5 h-5 text-[#7a306c] flex-shrink-0 mt-0.5" />
          <p class="text-[#7a306c] text-sm" style="letter-spacing: 0.005em">{{ error }}</p>
        </div>

        <!-- Form -->
        <form @submit="handleSubmit" class="space-y-6">
          <!-- Email -->
          <div>
            <label 
              for="email" 
              class="block text-[#ecebe8] opacity-80 mb-2 text-sm" 
              style="font-weight: 500; letter-spacing: 0.01em"
            >
              Email
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ecebe8] opacity-40 w-5 h-5" />
              <input
                id="email"
                type="email"
                v-model="email"
                placeholder="votre@email.com"
                class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-lg pl-10 pr-4 py-3 text-[#ecebe8] placeholder-[#ecebe8]/40
                  focus:outline-none focus:border-[#03b5aa] focus:ring-2 focus:ring-[#03b5aa]/20 transition-all"
                style="letter-spacing: 0.005em"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label 
              for="password" 
              class="block text-[#ecebe8] opacity-80 mb-2 text-sm" 
              style="font-weight: 500; letter-spacing: 0.01em"
            >
              Mot de passe
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ecebe8] opacity-40 w-5 h-5" />
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="••••••••"
                class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-lg pl-10 pr-12 py-3 text-[#ecebe8] placeholder-[#ecebe8]/40
                  focus:outline-none focus:border-[#03b5aa] focus:ring-2 focus:ring-[#03b5aa]/20 transition-all"
                style="letter-spacing: 0.005em"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ecebe8] opacity-40 hover:opacity-100 transition-opacity"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="rememberMe"
                class="w-4 h-4 rounded border-[#ecebe8]/10 bg-[#071429]/60 text-[#03b5aa] 
                  focus:ring-2 focus:ring-[#03b5aa]/20 cursor-pointer"
              />
              <span class="text-[#ecebe8] opacity-70 text-sm" style="letter-spacing: 0.01em">Se souvenir de moi</span>
            </label>
            <button
              type="button"
              @click="navigateTo('reset-password')"
              class="text-[#03b5aa] text-sm hover:text-[#03b5aa]/80 transition-colors"
              style="letter-spacing: 0.01em"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full px-6 py-3 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-lg
              hover:bg-[#03b5aa]/90 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300 shadow-[0_4px_12px_rgba(3,181,170,0.3)]"
            style="letter-spacing: 0.02em"
          >
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center justify-center gap-4 my-6">
          <div class="h-px bg-[#ecebe8]/10 flex-1" />
          <span class="text-[#ecebe8] opacity-40 text-sm" style="letter-spacing: 0.01em">ou</span>
          <div class="h-px bg-[#ecebe8]/10 flex-1" />
        </div>

        <!-- Google Sign In -->
        <button
          @click="handleGoogleLogin"
          class="w-full px-6 py-3 bg-[#ecebe8] text-[#071429] font-medium rounded-lg
            hover:bg-[#ecebe8]/90 transition-all duration-300 flex items-center justify-center gap-3"
          style="letter-spacing: 0.02em"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Se connecter avec Google
        </button>

        <!-- Sign Up Link -->
        <p class="text-center mt-6 text-[#ecebe8] opacity-60 text-sm" style="letter-spacing: 0.01em">
          Pas encore inscrit ?
          <button
            @click="navigateTo('signup')"
            class="text-[#03b5aa] font-medium hover:text-[#03b5aa]/80 transition-colors"
          >
            Créer un compte
          </button>
        </p>
      </div>

      <!-- Back to Home -->
      <button
        @click="navigateTo('landing')"
        class="w-full mt-4 text-[#ecebe8] opacity-50 text-sm hover:opacity-100 transition-opacity"
        style="letter-spacing: 0.01em"
      >
        ← Retour à l'accueil
      </button>
    </div>
  </div>
</template>
