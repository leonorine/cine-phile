<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Camera, Film, MessageCircle, Users, Settings, ArrowLeft, Edit2, Save, X, Loader2, Star } from 'lucide-vue-next'
import { updateProfile, uploadAvatar } from '@/services/profile.service'
import { getUserComments, type UserComment } from '@/services/comments.service'
import { getImageUrl } from '@/services/media.service'
import ImageCropModal from '@/components/ImageCropModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.currentUser)

// Edit mode
const isEditing = ref(false)
const isSaving = ref(false)
const editPseudo = ref('')
const editBio = ref('')
const editError = ref('')

// Avatar upload
const avatarInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)
const showCropModal = ref(false)
const selectedImageFile = ref<File | null>(null)

// User comments/reviews (feed)
const userComments = ref<(UserComment & { media_title?: string; media_poster?: string; rating?: number })[]>([])
const isLoadingComments = ref(false)

onMounted(async () => {
  loadUserComments()
})

const loadUserComments = async () => {
  isLoadingComments.value = true
  try {
    // Fetch real comments from API
    const comments = await getUserComments()
    
    // Get all rated items from collection
    const ratedItems = authStore.collection.filter(item => item.rating && item.rating > 0)
    
    // Create a map of media_id -> comment
    const commentsMap = new Map(
      comments.map(c => [String(c.media_id), c])
    )
    
    // Merge rated items with their comments (if they exist)
    userComments.value = ratedItems.map(item => {
      const comment = commentsMap.get(String(item.media_id))
      
      return {
        id: comment?.id || item.id,
        user_id: authStore.currentUser?.id || '',
        pseudo: authStore.currentUser?.username || '',
        avatar_url: authStore.currentUser?.avatar_url || null,
        text: comment?.text || '',
        image_urls: comment?.image_urls || [],
        likes_count: comment?.likes_count || 0,
        created_at: comment?.created_at || item.added_at,
        updated_at: comment?.updated_at || item.updated_at,
        media_id: String(item.media_id),
        media_type: (item.media_type === 'movie' ? 'film' : 'serie') as 'film' | 'serie',
        media_title: item.title,
        media_poster: item.poster_path || undefined,
        rating: item.rating
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (error) {
    console.error('Error loading comments:', error)
  } finally {
    isLoadingComments.value = false
  }
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const getInitials = (name: string | undefined) => {
  return name?.substring(0, 2).toUpperCase() || '??'
}

const goBack = () => {
  router.back()
}

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}

const viewMediaDetails = (mediaId: string, mediaType: 'film' | 'serie') => {
  const type = mediaType === 'film' ? 'movie' : 'tv'
  router.push({ name: 'movie-details', params: { id: mediaId }, query: { type } })
}

// Edit profile
const startEditing = () => {
  editPseudo.value = user.value?.username || ''
  editBio.value = user.value?.bio || ''
  editError.value = ''
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editError.value = ''
}

const saveProfile = async () => {
  if (!editPseudo.value.trim()) {
    editError.value = 'Le pseudo est requis'
    return
  }

  isSaving.value = true
  editError.value = ''

  try {
    const updatedUser = await updateProfile({
      pseudo: editPseudo.value.trim(),
      bio: editBio.value.trim() || null
    })

    // Update the store
    if (authStore.currentUser) {
      authStore.currentUser.username = updatedUser.username
      authStore.currentUser.bio = updatedUser.bio
    }

    isEditing.value = false
  } catch (error: any) {
    editError.value = error.response?.data?.error?.message || 'Erreur lors de la mise à jour'
  } finally {
    isSaving.value = false
  }
}

// Avatar upload
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image')
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('L\'image ne doit pas dépasser 5 Mo')
    return
  }

  // Show crop modal
  selectedImageFile.value = file
  showCropModal.value = true
}

const handleCroppedImage = async (blob: Blob) => {
  showCropModal.value = false
  isUploadingAvatar.value = true

  try {
    // Convert blob to File
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    const avatarUrl = await uploadAvatar(file)

    // Update the store
    if (authStore.currentUser) {
      authStore.currentUser.avatar_url = avatarUrl
    }
  } catch (error: any) {
    console.error('Avatar upload error:', error)
    alert('Erreur lors de l\'upload de l\'avatar')
  } finally {
    isUploadingAvatar.value = false
    selectedImageFile.value = null
    // Reset input
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}

const closeCropModal = () => {
  showCropModal.value = false
  selectedImageFile.value = null
  // Reset input
  if (avatarInput.value) {
    avatarInput.value.value = ''
  }
}

// Render stars
const renderStars = (rating: number) => {
  return Math.round(rating / 2) // Convert 1-10 to 1-5
}
</script>

<template>
  <div class="min-h-screen bg-[#071429] pb-20 md:pb-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="mb-6 flex items-center gap-2 text-[#ecebe8] opacity-60 hover:opacity-100 transition-opacity"
      >
        <ArrowLeft class="w-5 h-5" />
        Retour
      </button>

      <!-- Profile Card -->
      <div v-if="user" class="bg-[#071429]/60 border border-[#ecebe8]/10 rounded-2xl p-8 mb-8">
        <div class="flex flex-col items-center text-center">
          <!-- Avatar -->
          <div class="relative mb-6">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex items-center justify-center text-[#ecebe8] text-2xl font-bold overflow-hidden">
              <Loader2 v-if="isUploadingAvatar" class="w-8 h-8 animate-spin" />
              <template v-else>
                <img 
                  v-if="user.avatar_url" 
                  :src="user.avatar_url" 
                  :alt="user.username"
                  class="w-full h-full object-cover" 
                />
                <template v-else>
                  {{ getInitials(user.username) }}
                </template>
              </template>
            </div>
            <button 
              @click="triggerAvatarUpload"
              :disabled="isUploadingAvatar"
              class="absolute bottom-0 right-0 p-2 bg-[#03b5aa] rounded-full text-[#ecebe8] shadow-lg hover:bg-[#03b5aa]/80 transition-all disabled:opacity-50"
            >
              <Camera class="w-4 h-4" />
            </button>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarChange"
            />
          </div>

          <!-- Edit Mode -->
          <template v-if="isEditing">
            <div class="w-full max-w-xs space-y-4">
              <div>
                <input
                  v-model="editPseudo"
                  placeholder="Pseudo"
                  class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-lg px-4 py-2 text-[#ecebe8] text-center
                    focus:outline-none focus:border-[#03b5aa] focus:ring-2 focus:ring-[#03b5aa]/20"
                />
              </div>
              <div>
                <textarea
                  v-model="editBio"
                  placeholder="Bio (optionnel)"
                  rows="3"
                  class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-lg px-4 py-2 text-[#ecebe8] text-center resize-none
                    focus:outline-none focus:border-[#03b5aa] focus:ring-2 focus:ring-[#03b5aa]/20"
                />
              </div>
              <p v-if="editError" class="text-[#7a306c] text-sm">{{ editError }}</p>
              <div class="flex gap-2 justify-center">
                <button
                  @click="cancelEditing"
                  class="px-4 py-2 text-[#ecebe8] opacity-60 hover:opacity-100 flex items-center gap-2"
                >
                  <X class="w-4 h-4" />
                  Annuler
                </button>
                <button
                  @click="saveProfile"
                  :disabled="isSaving"
                  class="px-4 py-2 bg-[#03b5aa] text-[#ecebe8] rounded-lg flex items-center gap-2 hover:bg-[#03b5aa]/90 disabled:opacity-50"
                >
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                  <Save v-else class="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          </template>

          <!-- View Mode -->
          <template v-else>
            <div class="flex items-center gap-2 mb-1">
              <h1 
                class="text-2xl text-[#ecebe8]" 
                style="font-family: var(--font-display); font-weight: 700;"
              >
                {{ user.username }}
              </h1>
              <button
                @click="startEditing"
                class="p-1 text-[#ecebe8] opacity-40 hover:opacity-100 transition-opacity"
              >
                <Edit2 class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[#ecebe8] opacity-50 text-sm mb-2">{{ user.email }}</p>
            <p v-if="user.bio" class="text-[#ecebe8] opacity-70 text-sm mb-4 max-w-sm">{{ user.bio }}</p>
            <button
              v-else
              @click="startEditing"
              class="text-[#03b5aa] text-sm mb-4 hover:text-[#03b5aa]/80"
            >
              + Ajouter une bio
            </button>
            <p class="text-[#ecebe8] opacity-40 text-sm">
              Membre depuis {{ formatDate(user.created_at) }}
            </p>
          </template>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl p-6 text-center">
          <div class="text-2xl text-[#ecebe8] font-bold">{{ authStore.collection?.length || 0 }}</div>
          <div class="text-[#ecebe8] opacity-50 text-sm flex items-center justify-center gap-1 mt-1">
            <Film class="w-4 h-4" />
            Films
          </div>
        </div>
        <div class="bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl p-6 text-center">
          <div class="text-2xl text-[#ecebe8] font-bold">{{ userComments.length }}</div>
          <div class="text-[#ecebe8] opacity-50 text-sm flex items-center justify-center gap-1 mt-1">
            <MessageCircle class="w-4 h-4" />
            Avis
          </div>
        </div>
        <div class="bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl p-6 text-center">
          <div class="text-2xl text-[#ecebe8] font-bold">{{ authStore.following?.length || 0 }}</div>
          <div class="text-[#ecebe8] opacity-50 text-sm flex items-center justify-center gap-1 mt-1">
            <Users class="w-4 h-4" />
            Abonnements
          </div>
        </div>
      </div>

      <!-- My Reviews Feed (Letterboxd style) -->
      <div class="mb-8">
        <h2 class="text-xl text-[#ecebe8] font-medium mb-4 flex items-center gap-2">
          <Star class="w-5 h-5 text-[#f8d071]" />
          Mes avis
        </h2>

        <div v-if="isLoadingComments" class="flex justify-center py-8">
          <Loader2 class="w-6 h-6 text-[#03b5aa] animate-spin" />
        </div>

        <div v-else-if="userComments.length === 0" class="text-center py-8 text-[#ecebe8] opacity-50">
          <MessageCircle class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun avis pour le moment</p>
          <p class="text-sm opacity-70 mt-1">Notez vos premiers films !</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="review in userComments"
            :key="review.id"
            @click="viewMediaDetails(review.media_id, review.media_type)"
            class="flex gap-4 p-4 bg-[#071429]/40 border border-[#ecebe8]/5 rounded-xl hover:border-[#ecebe8]/10 transition-colors cursor-pointer"
          >
            <!-- Movie Poster -->
            <div class="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#071429]/60">
              <img 
                v-if="review.media_poster"
                :src="getImageUrl(review.media_poster, 'w154')"
                :alt="review.media_title"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-[#ecebe8] font-bold mb-1 truncate">{{ review.media_title }}</h3>
              
              <!-- Rating stars -->
              <div class="flex items-center gap-1 mb-2">
                <Star 
                  v-for="star in 5"
                  :key="star"
                  class="w-4 h-4"
                  :class="star <= renderStars((review as any).rating || 0) ? 'text-[#f8d071]' : 'text-[#ecebe8]/20'"
                  :fill="star <= renderStars((review as any).rating || 0) ? '#f8d071' : 'none'"
                />
                <span class="text-[#ecebe8]/50 text-xs ml-1">{{ renderStars((review as any).rating || 0) }}/5</span>
              </div>

              <!-- Comment text or rating info -->
              <p v-if="review.text && review.text.trim()" class="text-[#ecebe8]/70 text-sm line-clamp-2">{{ review.text }}</p>
              <p v-else class="text-[#ecebe8]/40 text-sm italic">Note sans commentaire</p>
              
              <!-- Date -->
              <p class="text-[#ecebe8]/30 text-xs mt-2">{{ formatDate(review.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="space-y-3">
        <button
          @click="navigateTo('collection')"
          class="w-full p-4 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl flex items-center gap-4 hover:border-[#03b5aa]/40 transition-all"
        >
          <div class="w-10 h-10 rounded-lg bg-[#03b5aa]/10 flex items-center justify-center">
            <Film class="w-5 h-5 text-[#03b5aa]" />
          </div>
          <div class="text-left flex-1">
            <p class="text-[#ecebe8] font-medium">Ma collection</p>
            <p class="text-[#ecebe8] opacity-50 text-sm">Voir tous mes films</p>
          </div>
        </button>

        <button
          @click="navigateTo('friends')"
          class="w-full p-4 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl flex items-center gap-4 hover:border-[#7a306c]/40 transition-all"
        >
          <div class="w-10 h-10 rounded-lg bg-[#7a306c]/10 flex items-center justify-center">
            <Users class="w-5 h-5 text-[#7a306c]" />
          </div>
          <div class="text-left flex-1">
            <p class="text-[#ecebe8] font-medium">Mes amis</p>
            <p class="text-[#ecebe8] opacity-50 text-sm">Gérer mes connections</p>
          </div>
        </button>

        <button
          @click="navigateTo('settings')"
          class="w-full p-4 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl flex items-center gap-4 hover:border-[#f8d071]/40 transition-all"
        >
          <div class="w-10 h-10 rounded-lg bg-[#f8d071]/10 flex items-center justify-center">
            <Settings class="w-5 h-5 text-[#f8d071]" />
          </div>
          <div class="text-left flex-1">
            <p class="text-[#ecebe8] font-medium">Paramètres</p>
            <p class="text-[#ecebe8] opacity-50 text-sm">Préférences du compte</p>
          </div>
        </button>
      </div>
    </div>
  </div>

  <!-- Image Crop Modal -->
  <ImageCropModal
    :show="showCropModal"
    :image-file="selectedImageFile"
    @close="closeCropModal"
    @cropped="handleCroppedImage"
  />
</template>
