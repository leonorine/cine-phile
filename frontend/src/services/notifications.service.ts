import api from './api'
import type { ApiResponse } from './api'

// Notification types
export type NotificationType = 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'system'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    message: string
    data: Record<string, any> | null
    read: boolean
    created_at: string
}

// Get user's notifications
export async function getNotifications(): Promise<Notification[]> {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications')
    return response.data.data
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<void> {
    await api.put(`/notifications/${notificationId}`, { read: true })
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all')
}

// Get unread count
export async function getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count')
    return response.data.data.count
}
