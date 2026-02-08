import api, { setToken, removeToken } from './api'
import type { ApiResponse } from './api'

// Auth response types
export interface AuthUser {
    user_id: string
    email: string
    pseudo: string
    token: string
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

// Login request
export async function login(email: string, password: string): Promise<AuthUser> {
    const response = await api.post<ApiResponse<AuthUser>>('/auth/login', {
        email,
        password,
    })

    if (response.data.success && response.data.data.token) {
        setToken(response.data.data.token)
    }

    return response.data.data
}

// Register request
export async function register(
    email: string,
    pseudo: string,
    password: string
): Promise<AuthUser> {
    const response = await api.post<ApiResponse<AuthUser>>('/auth/register', {
        email,
        pseudo,
        password,
    })

    if (response.data.success && response.data.data.token) {
        setToken(response.data.data.token)
    }

    return response.data.data
}

// Logout request
export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout')
    } finally {
        removeToken()
    }
}

// Get current user profile
export async function getCurrentUser(): Promise<UserProfile> {
    const response = await api.get<ApiResponse<UserProfile>>('/auth/user')
    return response.data.data
}

// Reset password request
export async function resetPassword(email: string): Promise<void> {
    await api.post('/auth/reset-password', { email })
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
    const token = localStorage.getItem('mediatrack_auth_token')
    return !!token
}
