<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Tv, Star, Users, Heart } from 'lucide-vue-next'

const router = useRouter()

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}
</script>

<template>
  <div class="min-h-screen bg-[#071429]">
    <!-- Hero Section -->
    <div class="relative min-h-[85vh] flex items-center justify-center px-4 overflow-hidden">
      <!-- Subtle Background Pattern -->
      <div class="absolute inset-0 opacity-[0.03]">
        <div class="absolute inset-0 bg-pattern" />
      </div>

      <div class="relative max-w-4xl mx-auto text-center">
        <!-- Logo -->
        <div class="flex justify-center mb-10">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center shadow-[0_0_40px_rgba(3,181,170,0.25)]">
            <Tv class="w-9 h-9 text-[#ecebe8]" :stroke-width="1.5" />
          </div>
        </div>

        <!-- Main Heading -->
        <h1 
          class="text-5xl md:text-6xl lg:text-7xl text-[#ecebe8] mb-8 leading-[1.1]" 
          style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.03em"
        >
          Votre univers
          <br />
          <span class="bg-gradient-to-r from-[#03b5aa] via-[#f8d071] to-[#7a306c] bg-clip-text text-transparent">
            films & séries
          </span>
        </h1>

        <!-- Subheading -->
        <p 
          class="text-xl md:text-2xl text-[#ecebe8] opacity-70 mb-14 max-w-2xl mx-auto leading-relaxed" 
          style="font-family: var(--font-sans); font-weight: 300; letter-spacing: 0.005em"
        >
          Organisez vos découvertes, partagez vos coups de cœur, connectez-vous avec la communauté
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            @click="navigateTo('signup')"
            class="w-full sm:w-auto px-10 py-4 bg-[#03b5aa] text-[#ecebe8] font-medium text-lg rounded-xl
              hover:bg-[#03b5aa]/90 transform hover:scale-[1.02] transition-all duration-300 
              shadow-[0_8px_30px_rgba(3,181,170,0.3)]"
            style="letter-spacing: 0.02em"
          >
            Créer un compte
          </button>
          <button
            @click="navigateTo('login')"
            class="w-full sm:w-auto px-8 py-4 border-2 border-[#ecebe8]/30 text-[#ecebe8] font-medium text-lg rounded-xl
              hover:bg-[#ecebe8]/5 hover:border-[#ecebe8]/50 transition-all duration-300"
            style="letter-spacing: 0.02em"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-5xl mx-auto px-4 py-20">
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="bg-[#071429]/40 border border-[#ecebe8]/10 rounded-xl p-8 hover:border-[#03b5aa]/40 hover:shadow-[0_8px_32px_rgba(3,181,170,0.15)] transition-all duration-300">
          <div class="w-12 h-12 rounded-lg bg-[#f8d071]/10 flex items-center justify-center mb-6">
            <Star class="w-6 h-6 text-[#f8d071]" :stroke-width="1.5" />
          </div>
          <h3 
            class="text-lg text-[#ecebe8] mb-3" 
            style="font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em"
          >
            Notez & organisez
          </h3>
          <p 
            class="text-[#ecebe8] opacity-60 leading-relaxed text-[15px]" 
            style="letter-spacing: 0.005em"
          >
            Créez votre collection personnelle et gardez une trace de tout ce que vous avez vu
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="bg-[#071429]/40 border border-[#ecebe8]/10 rounded-xl p-8 hover:border-[#03b5aa]/40 hover:shadow-[0_8px_32px_rgba(3,181,170,0.15)] transition-all duration-300">
          <div class="w-12 h-12 rounded-lg bg-[#7a306c]/10 flex items-center justify-center mb-6">
            <Users class="w-6 h-6 text-[#7a306c]" :stroke-width="1.5" />
          </div>
          <h3 
            class="text-lg text-[#ecebe8] mb-3" 
            style="font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em"
          >
            Communauté passionnée
          </h3>
          <p 
            class="text-[#ecebe8] opacity-60 leading-relaxed text-[15px]" 
            style="letter-spacing: 0.005em"
          >
            Partagez vos avis et découvrez les recommandations d'autres amateurs
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="bg-[#071429]/40 border border-[#ecebe8]/10 rounded-xl p-8 hover:border-[#03b5aa]/40 hover:shadow-[0_8px_32px_rgba(3,181,170,0.15)] transition-all duration-300">
          <div class="w-12 h-12 rounded-lg bg-[#03b5aa]/10 flex items-center justify-center mb-6">
            <Heart class="w-6 h-6 text-[#03b5aa]" :stroke-width="1.5" />
          </div>
          <h3 
            class="text-lg text-[#ecebe8] mb-3" 
            style="font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.01em"
          >
            Découvrez des pépites
          </h3>
          <p 
            class="text-[#ecebe8] opacity-60 leading-relaxed text-[15px]" 
            style="letter-spacing: 0.005em"
          >
            Explorez des contenus sélectionnés et trouvez votre prochain coup de cœur
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-[#ecebe8]/10 py-8 mt-12">
      <div class="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center">
            <Tv class="w-4 h-4 text-[#ecebe8]" :stroke-width="1.5" />
          </div>
          <span 
            class="text-[#ecebe8] font-medium tracking-tight" 
            style="font-family: var(--font-display); letter-spacing: -0.01em"
          >
            MediaTrack
          </span>
        </div>
        <div class="flex gap-6 text-[#ecebe8] opacity-50 text-sm">
          <button class="hover:opacity-100 transition-opacity" style="letter-spacing: 0.01em">À propos</button>
          <button class="hover:opacity-100 transition-opacity" style="letter-spacing: 0.01em">Contact</button>
          <button class="hover:opacity-100 transition-opacity" style="letter-spacing: 0.01em">Confidentialité</button>
        </div>
        <p class="text-[#ecebe8] opacity-40 text-sm" style="letter-spacing: 0.01em">© 2026 MediaTrack</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.bg-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ecebe8' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>
