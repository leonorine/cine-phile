import api, { type ApiResponse } from './api'

export interface OAuthCallbackData {
    access_token: string
    refresh_token?: string
    provider_token?: string
    user: {
        id: string
        email: string
        user_metadata: {
            full_name?: string
            avatar_url?: string
        }
    }
}

export interface OAuthResponse {
    token: string
    user: {
        id: string
        username: string
        email: string
        avatar_url: string | null
        bio: string | null
        created_at: string
        updated_at: string
    }
}

// Exchange Supabase OAuth session for backend JWT
export async function exchangeOAuthToken(data: OAuthCallbackData): Promise<OAuthResponse> {
    const response = await api.post<ApiResponse<OAuthResponse>>('/auth/oauth/callback', data)
    return response.data.data
}
