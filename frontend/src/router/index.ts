import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy-loaded views
const LandingPage = () => import('@/views/LandingPage.vue')
const LoginPage = () => import('@/views/LoginPage.vue')
const SignupPage = () => import('@/views/SignupPage.vue')
const ResetPasswordPage = () => import('@/views/ResetPasswordPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const SearchPage = () => import('@/views/SearchPage.vue')
const MovieDetailsPage = () => import('@/views/MovieDetailsPage.vue')
const CollectionPage = () => import('@/views/CollectionPage.vue')
const ProfilePage = () => import('@/views/ProfilePage.vue')
const FriendsPage = () => import('@/views/FriendsPage.vue')
const NotificationsPage = () => import('@/views/NotificationsPage.vue')
const SettingsPage = () => import('@/views/SettingsPage.vue')

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'landing',
        component: LandingPage,
        meta: { requiresAuth: false }
    },
    {
        path: '/login',
        name: 'login',
        component: LoginPage,
        meta: { requiresAuth: false }
    },
    {
        path: '/signup',
        name: 'signup',
        component: SignupPage,
        meta: { requiresAuth: false }
    },
    {
        path: '/reset-password',
        name: 'reset-password',
        component: ResetPasswordPage,
        meta: { requiresAuth: false }
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: DashboardPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/search',
        name: 'search',
        component: SearchPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/movie/:id',
        name: 'movie-details',
        component: MovieDetailsPage,
        meta: { requiresAuth: true },
        props: true
    },
    {
        path: '/collection',
        name: 'collection',
        component: CollectionPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile/:id?',
        name: 'profile',
        component: ProfilePage,
        meta: { requiresAuth: true },
        props: true
    },
    {
        path: '/friends',
        name: 'friends',
        component: FriendsPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/notifications',
        name: 'notifications',
        component: NotificationsPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'settings',
        component: SettingsPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// Navigation guard for authentication
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // Wait for auth initialization to complete before checking
    if (!authStore.isInitialized) {
        await authStore.initialize()
    }

    const requiresAuth = to.meta.requiresAuth

    if (requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login', query: { redirect: to.fullPath } })
    } else if (!requiresAuth && authStore.isAuthenticated && ['login', 'signup'].includes(to.name as string)) {
        next({ name: 'dashboard' })
    } else {
        next()
    }
})

export default router
