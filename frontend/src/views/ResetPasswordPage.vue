<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const email = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  error.value = ''

  if (!email.value) {
    error.value = 'Veuillez entrer votre adresse email'
    return
  }

  loading.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  loading.value = false
  success.value = true
}

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="bg-[#071429]/60 backdrop-blur-xl border border-[#ecebe8]/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(7,20,41,0.4)]">
        <!-- Success State -->
        <template v-if="success">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-6 bg-[#03b5aa]/10 rounded-full flex items-center justify-center">
              <CheckCircle class="w-8 h-8 text-[#03b5aa]" />
            </div>
            <h1 class="text-2xl text-[#ecebe8] mb-4" style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em">
              Email envoyé !
            </h1>
            <p class="text-[#ecebe8] opacity-60 mb-8" style="letter-spacing: 0.005em">
              Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.
            </p>
            <button
              @click="navigateTo('login')"
              class="w-full px-6 py-3 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-lg
                hover:bg-[#03b5aa]/90 transition-all duration-300"
              style="letter-spacing: 0.02em"
            >
              Retour à la connexion
            </button>
          </div>
        </template>

        <!-- Form State -->
        <template v-else>
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-3xl text-[#ecebe8] mb-2" style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em">
              Mot de passe oublié
            </h1>
            <p class="text-[#ecebe8] opacity-60" style="letter-spacing: 0.005em">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
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

            <button
              type="submit"
              :disabled="loading"
              class="w-full px-6 py-3 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-lg
                hover:bg-[#03b5aa]/90 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300 shadow-[0_4px_12px_rgba(3,181,170,0.3)]"
              style="letter-spacing: 0.02em"
            >
              {{ loading ? 'Envoi en cours...' : 'Envoyer le lien' }}
            </button>
          </form>

          <button
            @click="navigateTo('login')"
            class="w-full mt-6 flex items-center justify-center gap-2 text-[#ecebe8] opacity-60 text-sm hover:opacity-100 transition-opacity"
            style="letter-spacing: 0.01em"
          >
            <ArrowLeft class="w-4 h-4" />
            Retour à la connexion
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
