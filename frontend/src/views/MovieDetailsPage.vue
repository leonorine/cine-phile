<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import { Star, Clock, Calendar, ArrowLeft, Share2, Plus, Check, Loader2, Send, MessageCircle, AlertCircle } from 'lucide-vue-next'
import { getImageUrl } from '@/services/media.service'
import * as commentsService from '@/services/comments.service'
import type { Comment } from '@/services/comments.service'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mediaStore = useMediaStore()

const isAddingToCollection = ref(false)
const addedToCollection = ref(false)

// Rating state
const userRating = ref(0)
const hoverRating = ref(0)   // 0, 0.5, 1, 1.5, 2 ... 5
const isUpdatingRating = ref(false)

// Comments state
const comments = ref<Comment[]>([])
const newComment = ref('')
const isLoadingComments = ref(false)
const isPostingComment = ref(false)
const commentError = ref('')

// Get media type and ID from route
const mediaId = computed(() => parseInt(route.params.id as string))
const mediaType = computed(() => (route.query.type as 'movie' | 'tv') || 'movie')
const dbMediaType = computed(() => mediaType.value === 'movie' ? 'film' : 'serie')

// Current media details
const media = computed(() => mediaStore.currentMedia)
const isLoading = computed(() => mediaStore.isLoading)
const error = computed(() => mediaStore.error)

// Check if already in collection
const collectionItem = computed(() => authStore.isInCollection(mediaId.value, mediaType.value))

// Get current rating from collection item (stored as 0.5-5 float)
const currentRating = computed(() => collectionItem.value?.rating || 0)

// Check if can comment (must have a rating)
const canComment = computed(() => userRating.value > 0 || currentRating.value > 0)

onMounted(async () => {
  await mediaStore.loadMediaDetails(mediaType.value, mediaId.value)
  await loadComments()
  
  // Initialize user rating from collection (convert 1-10 to 1-5)
  if (collectionItem.value?.rating) {
    userRating.value = Math.round(collectionItem.value.rating / 2)
  }
})

// Reload when route params change
watch([mediaId, mediaType], async () => {
  await mediaStore.loadMediaDetails(mediaType.value, mediaId.value)
  await loadComments()
  userRating.value = currentRating.value
})

// Watch collection item rating
watch(() => collectionItem.value?.rating, (newRating) => {
  if (newRating) {
    userRating.value = Math.round(newRating / 2)
  }
})

const loadComments = async () => {
  isLoadingComments.value = true
  try {
    comments.value = await commentsService.getComments(mediaId.value)
  } catch (error) {
    console.error('Failed to load comments:', error)
  } finally {
    isLoadingComments.value = false
  }
}

const addToCollection = async () => {
  if (!media.value || collectionItem.value) return
  
  isAddingToCollection.value = true
  try {
    await authStore.addToCollection(
      media.value.id,
      mediaType.value,
      media.value.title,
      media.value.poster_path,
      'to_watch'
    )
    addedToCollection.value = true
    setTimeout(() => {
      addedToCollection.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to add to collection:', error)
  } finally {
    isAddingToCollection.value = false
  }
}

const updateStatus = async (status: 'to_watch' | 'watched') => {
  if (!collectionItem.value) return
  
  // Prevent duplicate API call if status is already set
  if (collectionItem.value.status === status) {
    console.log('Status already set to', status, '- skipping API call')
    return
  }
  
  await authStore.updateCollectionItem(collectionItem.value.id, { status })
}

const setRating = async (rating: number) => {
  if (!collectionItem.value || isUpdatingRating.value) return
  if (userRating.value === rating) return

  isUpdatingRating.value = true
  try {
    // Store 0.5-5 directly (DB is now float4)
    await authStore.updateCollectionItem(collectionItem.value.id, { rating })
    userRating.value = rating
  } catch (error) {
    console.error('Failed to update rating:', error)
  } finally {
    isUpdatingRating.value = false
  }
}

// Detect half-star from mouse position within a star element
const handleStarMove = (event: MouseEvent, starIndex: number) => {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = event.clientX - rect.left
  hoverRating.value = x < rect.width / 2 ? starIndex - 0.5 : starIndex
}

const handleStarLeave = () => {
  hoverRating.value = 0
}

const postComment = async () => {
  commentError.value = ''
  
  if (!canComment.value) {
    commentError.value = 'Veuillez attribuer une note avant de commenter'
    return
  }
  
  if (!newComment.value.trim() || isPostingComment.value) return
  
  isPostingComment.value = true
  try {
    const comment = await commentsService.createComment({
      media_id: mediaId.value.toString(),
      media_type: dbMediaType.value as 'film' | 'serie',
      text: newComment.value.trim()
    })
    comments.value.unshift(comment)
    newComment.value = ''
  } catch (error: any) {
    console.error('Failed to post comment:', error)
    commentError.value = error.response?.data?.error?.message || 'Erreur lors de la publication'
  } finally {
    isPostingComment.value = false
  }
}

const deleteComment = async (commentId: string) => {
  try {
    await commentsService.deleteComment(commentId)
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

const goBack = () => {
  router.back()
}

const share = () => {
  if (navigator.share && media.value) {
    navigator.share({
      title: media.value.title,
      text: `Découvre "${media.value.title}" sur MediaTrack!`,
      url: window.location.href,
    })
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#071429]">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <Loader2 class="w-10 h-10 text-[#03b5aa] animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-screen px-4">
      <p class="text-[#ecebe8] opacity-60 text-lg mb-4">{{ error }}</p>
      <button
        @click="goBack"
        class="px-6 py-3 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-xl"
      >
        Retour
      </button>
    </div>

    <!-- Content -->
    <template v-else-if="media">
      <!-- Hero Backdrop -->
      <div class="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img 
          :src="getImageUrl(media.backdrop_path, 'original')"
          :alt="media.title"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#071429] via-[#071429]/50 to-transparent" />
        
        <!-- Back Button -->
        <button
          @click="goBack"
          class="absolute top-4 left-4 p-3 bg-[#071429]/60 backdrop-blur-sm rounded-full text-[#ecebe8] hover:bg-[#071429]/80 transition-all"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>

        <!-- Share Button -->
        <button
          @click="share"
          class="absolute top-4 right-4 p-3 bg-[#071429]/60 backdrop-blur-sm rounded-full text-[#ecebe8] hover:bg-[#071429]/80 transition-all"
        >
          <Share2 class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="relative -mt-32 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div class="max-w-5xl mx-auto">
          <div class="flex flex-col md:flex-row gap-8">
            <!-- Poster -->
            <div class="flex-shrink-0 w-40 md:w-56 mx-auto md:mx-0">
              <div class="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-[#ecebe8]/10">
                <img 
                  :src="getImageUrl(media.poster_path, 'w500')"
                  :alt="media.title"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 text-center md:text-left">
              <h1 
                class="text-3xl md:text-4xl text-[#ecebe8] mb-3" 
                style="font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em"
              >
                {{ media.title }}
              </h1>

              <p v-if="media.tagline" class="text-[#ecebe8]/60 italic mb-4">{{ media.tagline }}</p>

              <!-- Meta Info -->
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-[#ecebe8]/70">
                <div class="flex items-center gap-1.5">
                  <Star class="w-4 h-4 text-[#f8d071]" fill="#f8d071" />
                  <span class="font-medium text-[#ecebe8]">{{ (media.vote_average / 2).toFixed(1) }}</span>
                  <span class="text-sm opacity-60">({{ media.vote_count }} votes)</span>
                </div>
                
                <div v-if="media.runtime" class="flex items-center gap-1.5">
                  <Clock class="w-4 h-4" />
                  <span>{{ Math.floor(media.runtime / 60) }}h {{ media.runtime % 60 }}min</span>
                </div>

                <div class="flex items-center gap-1.5">
                  <Calendar class="w-4 h-4" />
                  <span>{{ (media.release_date || media.first_air_date || '').split('-')[0] }}</span>
                </div>
              </div>

              <!-- Genres -->
              <div class="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
                <span 
                  v-for="genre in media.genres" 
                  :key="genre.id"
                  class="px-3 py-1 bg-[#ecebe8]/10 text-[#ecebe8] text-sm rounded-full"
                >
                  {{ genre.name }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap gap-3 justify-center md:justify-start mb-8">
                <template v-if="collectionItem">
                  <!-- Already in collection - show status buttons (only 2: À voir, Vu) -->
                  <div class="flex gap-2">
                    <button
                      @click="updateStatus('to_watch')"
                      :class="[
                        'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                        collectionItem.status === 'to_watch' 
                          ? 'bg-[#7a306c] text-[#ecebe8]' 
                          : 'bg-[#071429]/60 text-[#ecebe8] border border-[#ecebe8]/10'
                      ]"
                    >
                      À voir
                    </button>
                    <button
                      @click="updateStatus('watched')"
                      :class="[
                        'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                        collectionItem.status === 'watched' 
                          ? 'bg-[#03b5aa] text-[#ecebe8]' 
                          : 'bg-[#071429]/60 text-[#ecebe8] border border-[#ecebe8]/10'
                      ]"
                    >
                      <Check class="w-4 h-4" />
                      Visionné
                    </button>
                  </div>
                </template>
                <template v-else>
                  <button
                    @click="addToCollection"
                    :disabled="isAddingToCollection"
                    :class="[
                      'px-6 py-3 font-medium rounded-xl transition-all flex items-center gap-2',
                      addedToCollection 
                        ? 'bg-[#03b5aa] text-[#ecebe8]'
                        : 'bg-[#03b5aa] text-[#ecebe8] hover:bg-[#03b5aa]/90 shadow-[0_4px_12px_rgba(3,181,170,0.3)]'
                    ]"
                  >
                    <Loader2 v-if="isAddingToCollection" class="w-5 h-5 animate-spin" />
                    <Check v-else-if="addedToCollection" class="w-5 h-5" />
                    <Plus v-else class="w-5 h-5" />
                    {{ addedToCollection ? 'Ajouté !' : 'Ajouter à ma collection' }}
                  </button>
                </template>
              </div>

              <!-- User Rating (only if in collection) -->
              <div v-if="collectionItem" class="mb-8">
                <h3 class="text-lg text-[#ecebe8] font-medium mb-3">Ma note</h3>
                <div class="flex items-center gap-1">
                  <button
                    v-for="star in 5"
                    :key="star"
                    @mousemove="handleStarMove($event, star)"
                    @mouseleave="handleStarLeave"
                    @click="setRating(hoverRating || star)"
                    :disabled="isUpdatingRating"
                    class="p-1 disabled:opacity-50 relative"
                    style="width: 2.2rem; height: 2.2rem"
                  >
                    <svg viewBox="0 0 24 24" class="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient :id="`star-grad-${star}`" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="50%" :stop-color="(hoverRating || userRating) >= star - 0.5 ? '#f8d071' : '#ecebe830'" />
                          <stop offset="50%" :stop-color="(hoverRating || userRating) >= star ? '#f8d071' : '#ecebe830'" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        :fill="`url(#star-grad-${star})`"
                        stroke="#f8d071"
                        :stroke-opacity="(hoverRating || userRating) >= star - 0.5 ? 0.8 : 0.2"
                        stroke-width="1"
                      />
                    </svg>
                  </button>
                  <span v-if="userRating" class="ml-2 text-[#ecebe8]/60 text-sm">
                    {{ userRating }}/5
                  </span>
                </div>
              </div>


              <!-- Overview -->
              <div class="mb-8">
                <h3 class="text-lg text-[#ecebe8] font-medium mb-3">Synopsis</h3>
                <p class="text-[#ecebe8]/70 leading-relaxed">{{ media.overview || 'Aucun synopsis disponible.' }}</p>
              </div>

              <!-- Cast & Crew -->
              <div v-if="media.cast?.length" class="mb-8">
                <h3 class="text-lg text-[#ecebe8] font-medium mb-4">Casting principal</h3>
                <div class="flex flex-wrap gap-6 pb-4">
                  <div 
                    v-for="person in media.cast.slice(0, 10)" 
                    :key="person.id"
                    class="flex-shrink-0 text-center"
                  >
                    <div class="w-16 h-16 rounded-full overflow-hidden bg-[#071429]/60 border border-[#ecebe8]/10 mx-auto mb-2">
                      <img 
                        v-if="person.profile_path"
                        :src="getImageUrl(person.profile_path, 'w185')"
                        :alt="person.name"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-[#ecebe8]/30 text-xs">
                        👤
                      </div>
                    </div>
                    <p class="text-[#ecebe8] text-sm font-medium w-20 text-center break-words leading-tight">{{ person.name }}</p>
                    <p class="text-[#ecebe8]/50 text-xs w-20 text-center break-words leading-tight">{{ person.character }}</p>
                  </div>
                </div>
              </div>

              <!-- Director -->
              <div v-if="media.crew?.length" class="mb-8">
                <h3 class="text-lg text-[#ecebe8] font-medium mb-3">Équipe technique</h3>
                <div class="flex flex-wrap gap-4">
                  <div 
                    v-for="person in media.crew.filter(c => ['Director', 'Creator'].includes(c.job)).slice(0, 3)" 
                    :key="`${person.id}-${person.job}`"
                    class="flex items-center gap-3 p-3 bg-[#071429]/60 border border-[#ecebe8]/10 rounded-lg"
                  >
                    <div class="w-10 h-10 rounded-full overflow-hidden bg-[#071429]/80">
                      <img 
                        v-if="person.profile_path"
                        :src="getImageUrl(person.profile_path, 'w185')"
                        :alt="person.name"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p class="text-[#ecebe8] text-sm font-medium">{{ person.name }}</p>
                      <p class="text-[#ecebe8]/50 text-xs">{{ person.job }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="mt-12">
            <div class="flex items-center gap-3 mb-6">
              <MessageCircle class="w-6 h-6 text-[#03b5aa]" />
              <h2 class="text-xl text-[#ecebe8] font-medium">
                Commentaires ({{ comments.length }})
              </h2>
            </div>

            <!-- Add Comment Form -->
            <div v-if="authStore.currentUser" class="mb-8">
              <!-- Rating required warning -->
              <div v-if="!canComment && collectionItem" class="mb-4 p-3 bg-[#f8d071]/10 border border-[#f8d071]/30 rounded-lg flex items-center gap-3">
                <AlertCircle class="w-5 h-5 text-[#f8d071]" />
                <span class="text-[#f8d071] text-sm">Attribuez une note avant de commenter</span>
              </div>
              
              <div v-if="!collectionItem" class="mb-4 p-3 bg-[#7a306c]/10 border border-[#7a306c]/30 rounded-lg flex items-center gap-3">
                <AlertCircle class="w-5 h-5 text-[#7a306c]" />
                <span class="text-[#7a306c] text-sm">Ajoutez ce film à votre collection et notez-le pour commenter</span>
              </div>

              <div v-if="collectionItem" class="flex gap-4">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex-shrink-0 flex items-center justify-center text-[#ecebe8] font-medium overflow-hidden">
                  <img
                    v-if="authStore.currentUser.avatar_url"
                    :src="authStore.currentUser.avatar_url"
                    :alt="authStore.currentUser.username"
                    class="w-full h-full object-cover"
                  />
                  <template v-else>
                    {{ authStore.currentUser.username?.substring(0, 2).toUpperCase() }}
                  </template>
                </div>
                <div class="flex-1">
                  <textarea
                    v-model="newComment"
                    :placeholder="canComment ? 'Partagez votre avis sur ce film...' : 'Attribuez d\'abord une note...'"
                    :disabled="!canComment"
                    rows="3"
                    class="w-full bg-[#071429]/60 border border-[#ecebe8]/10 rounded-xl px-4 py-3 text-[#ecebe8] placeholder-[#ecebe8]/40
                      focus:outline-none focus:border-[#03b5aa] focus:ring-1 focus:ring-[#03b5aa]/30 transition-all resize-none
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p v-if="commentError" class="text-[#7a306c] text-sm mt-1">{{ commentError }}</p>
                  <div class="flex justify-end mt-2">
                    <button
                      @click="postComment"
                      :disabled="!newComment.trim() || isPostingComment || !canComment"
                      class="px-5 py-2.5 bg-[#03b5aa] text-[#ecebe8] font-medium rounded-lg flex items-center gap-2
                        hover:bg-[#03b5aa]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Loader2 v-if="isPostingComment" class="w-4 h-4 animate-spin" />
                      <Send v-else class="w-4 h-4" />
                      Publier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Comments List -->
            <div v-if="isLoadingComments" class="flex justify-center py-8">
              <Loader2 class="w-6 h-6 text-[#03b5aa] animate-spin" />
            </div>

            <div v-else-if="comments.length === 0" class="text-center py-12">
              <MessageCircle class="w-12 h-12 text-[#ecebe8]/20 mx-auto mb-3" />
              <p class="text-[#ecebe8]/50">Aucun commentaire pour le moment</p>
              <p class="text-[#ecebe8]/30 text-sm mt-1">Soyez le premier à donner votre avis !</p>
            </div>

            <div v-else class="space-y-6">
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="flex gap-4 p-4 bg-[#071429]/40 border border-[#ecebe8]/5 rounded-xl"
              >
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#03b5aa] to-[#7a306c] flex-shrink-0 flex items-center justify-center text-[#ecebe8] font-medium text-sm overflow-hidden">
                  <img
                    v-if="comment.avatar_url"
                    :src="comment.avatar_url"
                    :alt="comment.pseudo || 'User'"
                    class="w-full h-full object-cover"
                  />
                  <template v-else>
                    {{ (comment.pseudo || 'U').substring(0, 2).toUpperCase() }}
                  </template>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="text-[#ecebe8] font-medium">{{ comment.pseudo || 'Anonyme' }}</span>
                    <!-- User rating stars next to name -->
                    <div class="flex items-center gap-0.5">
                      <Star 
                        v-for="star in 5" 
                        :key="star"
                        class="w-3 h-3 text-[#f8d071]"
                        :fill="'#f8d071'"
                      />
                    </div>
                    <span class="text-[#ecebe8]/40 text-xs">{{ formatDate(comment.created_at) }}</span>
                  </div>
                  <p class="text-[#ecebe8]/80 text-sm leading-relaxed">{{ comment.text }}</p>
                  
                  <!-- Delete button (only for own comments) -->
                  <button
                    v-if="comment.user_id === authStore.currentUser?.id"
                    @click="deleteComment(comment.id)"
                    class="mt-2 text-[#7a306c] text-xs hover:text-[#7a306c]/80 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
