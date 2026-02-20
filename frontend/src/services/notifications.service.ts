import api from './api'
import type { ApiResponse } from './api'

// Notification types
export type NotificationType = 'like' | 'comment' | 'follow' | 'friend_request' | 'friend_accepted' | 'system'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    actor_id: string | null
    actor_pseudo: string | null
    actor_avatar: string | null
    media_id: string | null
    read: boolean
    created_at: string
}

// Get user's notifications
export async function getNotifications(): Promise<Notification[]> {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications')
    return response.data.data
}

// Mark one notification as read
export async function markAsRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`)
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all')
}
