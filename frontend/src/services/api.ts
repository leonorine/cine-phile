import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Token storage key
const TOKEN_KEY = 'mediatrack_auth_token'

// Get token from localStorage
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY)
}

// Set token in localStorage
export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
}

// Remove token from localStorage
export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY)
}

// Request interceptor - attach token to requests
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken()
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

// Response interceptor - handle errors globally
api.interceptors.response.use(
    (response) => {
        // Return the response data directly if it has success field
        return response
    },
    (error: AxiosError<{ success: boolean; error: { message: string } }>) => {
        // Handle 401 Unauthorized - auto logout
        if (error.response?.status === 401) {
            removeToken()
            // Redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }

        // Extract error message from API response
        const errorMessage =
            error.response?.data?.error?.message ||
            error.message ||
            'Une erreur est survenue'

        console.error('API Error:', errorMessage)

        return Promise.reject({
            status: error.response?.status,
            message: errorMessage,
            originalError: error,
        })
    }
)

// API Response types
export interface ApiResponse<T> {
    success: boolean
    data: T
    error?: {
        message: string
        details?: string
    }
}

export interface PaginatedResponse<T> {
    results: T[]
    page: number
    total_pages: number
    total_results: number
}

export default api
