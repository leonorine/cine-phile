import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/services/auth.service'
import * as collectionService from '@/services/collection.service'
import * as followsService from '@/services/follows.service'
import * as notificationsService from '@/services/notifications.service'
import { getToken, removeToken } from '@/services/api'
import type { CollectionItem, CollectionStatus } from '@/services/collection.service'
import type { FollowUser } from '@/services/follows.service'
import type { Notification } from '@/services/notifications.service'

// User type matching API response
export interface User {
    id: string
    email: string
    username: string
    avatar_url: string | null
    bio: string | null
    created_at: string
    updated_at: string
}

export const useAuthStore = defineStore('auth', () => {
    // State
    const currentUser = ref<User | null>(null)
    const collection = ref<CollectionItem[]>([])
    const followers = ref<FollowUser[]>([])
    const following = ref<FollowUser[]>([])
    const notifications = ref<Notification[]>([])
    const isLoading = ref(false)
    const isInitialized = ref(false)
    const error = ref<string | null>(null)

    // Computed
    const isAuthenticated = computed(() => !!currentUser.value && !!getToken())

    const unreadNotificationsCount = computed(() =>
        notifications.value.filter(n => !n.read).length
    )

    const collectionByStatus = computed(() => ({
        to_watch: collection.value.filter(i => i.status === 'to_watch'),
        watched: collection.value.filter(i => i.status === 'watched'),
    }))

    // Initialize - check if user is logged in
    const initialize = async () => {
        if (isInitialized.value) return

        const token = getToken()
        if (!token) {
            isInitialized.value = true
            return
        }

        try {
            isLoading.value = true
            const userProfile = await authService.getCurrentUser()
            currentUser.value = userProfile

            // Load user data in parallel
            await Promise.allSettled([
                loadCollection(),
                loadFriends(),
                loadNotifications(),
            ])
        } catch (err) {
            console.error('Failed to initialize user session:', err)
            removeToken()
            currentUser.value = null
        } finally {
            isLoading.value = false
            isInitialized.value = true
        }
    }

    // Login
    const login = async (email: string, password: string): Promise<boolean> => {
        isLoading.value = true
        error.value = null

        try {
            await authService.login(email, password)

            // Fetch full user profile
            const userProfile = await authService.getCurrentUser()
            currentUser.value = userProfile

            // Load user data
            await Promise.allSettled([
                loadCollection(),
                loadFriends(),
                loadNotifications(),
            ])

            return true
        } catch (err: any) {
            error.value = err.message || 'Email ou mot de passe incorrect'
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Signup
    const signup = async (email: string, pseudo: string, password: string): Promise<boolean> => {
        isLoading.value = true
        error.value = null

        try {
            await authService.register(email, pseudo, password)

            // Fetch full user profile
            const userProfile = await authService.getCurrentUser()
            currentUser.value = userProfile

            return true
        } catch (err: any) {
            error.value = err.message || 'Une erreur est survenue lors de l\'inscription'
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Logout
    const logout = async () => {
        try {
            await authService.logout()
        } catch (err) {
            console.error('Logout error:', err)
        } finally {
            currentUser.value = null
            collection.value = []
            followers.value = []
            following.value = []
            notifications.value = []
        }
    }

    // Reset password
    const resetPassword = async (email: string): Promise<boolean> => {
        isLoading.value = true
        error.value = null

        try {
            await authService.resetPassword(email)
            return true
        } catch (err: any) {
            error.value = err.message || 'Une erreur est survenue'
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Collection actions
    const loadCollection = async () => {
        try {
            collection.value = await collectionService.getCollection()
        } catch (err) {
            console.error('Failed to load collection:', err)
        }
    }

    const addToCollection = async (
        mediaId: number,
        mediaType: 'movie' | 'tv',
        title: string,
        posterPath: string | null,
        status: CollectionStatus = 'to_watch'
    ): Promise<boolean> => {
        try {
            const newItem = await collectionService.addToCollection({
                media_id: mediaId,
                media_type: mediaType,
                title,
                poster_path: posterPath,
                status,
            })
            collection.value.push(newItem)
            return true
        } catch (err: any) {
            error.value = err.message
            return false
        }
    }

    const updateCollectionItem = async (
        id: string,
        data: { status?: CollectionStatus; rating?: number; notes?: string | null; is_favorite?: boolean }
    ): Promise<boolean> => {
        try {
            const updated = await collectionService.updateCollectionItem(id, data)
            const index = collection.value.findIndex(i => i.id === id)
            if (index !== -1) {
                collection.value[index] = updated
            }
            return true
        } catch (err: any) {
            error.value = err.message
            return false
        }
    }

    const removeFromCollection = async (id: string): Promise<boolean> => {
        try {
            await collectionService.removeFromCollection(id)
            collection.value = collection.value.filter(i => i.id !== id)
            return true
        } catch (err: any) {
            error.value = err.message
            return false
        }
    }

    const isInCollection = (mediaId: number, mediaType: 'movie' | 'tv'): CollectionItem | null => {
        return collection.value.find(
            i => i.media_id === mediaId && i.media_type === mediaType
        ) || null
    }

    // Friends actions
    const loadFriends = async () => {
        try {
            const [followersData, followingData] = await Promise.all([
                followsService.getFollowers(),
                followsService.getFollowing()
            ])
            followers.value = followersData
            following.value = followingData
        } catch (err) {
            console.error('Failed to load follows:', err)
        }
    }

    const removeFriend = async (userId: string): Promise<boolean> => {
        try {
            await followsService.unfollowUser(userId)
            followers.value = followers.value.filter(f => f.id !== userId)
            following.value = following.value.filter(f => f.id !== userId)
            return true
        } catch (err: any) {
            error.value = err.message
            return false
        }
    }

    // Notification actions
    const loadNotifications = async () => {
        try {
            notifications.value = await notificationsService.getNotifications()
        } catch (err) {
            console.error('Failed to load notifications:', err)
        }
    }

    const markNotificationAsRead = async (notificationId: string) => {
        try {
            await notificationsService.markAsRead(notificationId)
            notifications.value = notifications.value.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            )
        } catch (err) {
            console.error('Failed to mark notification as read:', err)
        }
    }

    const markAllNotificationsAsRead = async () => {
        try {
            await notificationsService.markAllAsRead()
            notifications.value = notifications.value.map(n => ({ ...n, read: true }))
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err)
        }
    }

    return {
        // State
        currentUser,
        collection,
        followers,
        following,
        notifications,
        isLoading,
        isInitialized,
        error,
        // Computed
        isAuthenticated,
        unreadNotificationsCount,
        collectionByStatus,
        // Actions
        initialize,
        login,
        signup,
        logout,
        resetPassword,
        // Collection
        loadCollection,
        addToCollection,
        updateCollectionItem,
        removeFromCollection,
        isInCollection,
        // Friends
        loadFriends,
        removeFriend,
        // Notifications
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
    }
})
