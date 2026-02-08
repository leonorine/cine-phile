import api from './api'
import type { ApiResponse } from './api'

export interface UpdateProfileData {
    pseudo?: string
    bio?: string | null
    avatar_url?: string | null
}

export interface UserProfile {
    id: string
    email: string
    username: string
    avatar_url: string | null
    bio: string | null
    created_at: string
    updated_at: string
}

// Update profile
export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await api.put<ApiResponse<UserProfile>>('/auth/profile', data)
    return response.data.data
}

// Upload avatar (base64)
export async function uploadAvatar(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = async () => {
            try {
                const base64 = reader.result as string
                const response = await api.post<ApiResponse<{ avatar_url: string }>>('/auth/upload-avatar', {
                    file: base64,
                    fileName: file.name,
                })
                resolve(response.data.data.avatar_url)
            } catch (error) {
                reject(error)
            }
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}
