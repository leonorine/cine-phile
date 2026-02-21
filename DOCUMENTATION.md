# Documentation Technique — Ciné-phile

> **Projet :** Ciné-phile — Plateforme sociale de suivi et de partage cinématographique  
> **Auteur :** Leonorine  
> **Date :** Février 2026  
> **Version :** 1.0.0

---

# PARTIE I — Documentation Générale de l'Architecture (Proposition de Projet)

## 1. Présentation du Projet

### 1.1 Contexte et Problématique

Les passionnés de cinéma et de séries télévisées n'ont pas de plateforme unique qui combine à la fois le suivi personnel de leurs visionnages, la notation de films, le partage social avec leurs proches, et la découverte de nouveaux contenus adaptés à leurs goûts.

Les solutions existantes (Letterboxd, Trakt, SensCritique) sont soit trop complexes, soit orientées vers un public anglophone, soit dépourvues de dimension sociale accessible.

### 1.2 Objectif du Projet

**Ciné-phile** est une plateforme web communautaire francophone permettant à ses utilisateurs de :

- **Suivre** leur historique de visionnage (films et séries).
- **Noter** et **commenter** les œuvres visionnées.
- **Découvrir** de nouveaux films et séries grâce à un moteur de recommandations personnalisé.
- **Partager** leurs avis et collections avec leur réseau d'amis.
- **Explorer** les profils et collections d'autres utilisateurs.

### 1.3 Public Cible

| Segment | Description |
|---------|------------|
| Cinéphiles actifs | Utilisateurs qui suivent régulièrement leur consommation de films/séries |
| Utilisateurs sociaux | Personnes souhaitant partager leurs découvertes avec leurs amis |
| Étudiants | Utilisation dans un cadre de projet de fin d'études (PFE) |

---

## 2. Architecture Générale du Système

### 2.1 Vue d'Ensemble

Ciné-phile adopte une architecture **client-serveur en couches** avec séparation stricte frontend / backend / données / services externes.

```
┌──────────────────────────────────────────────────────────┐
│                    UTILISATEUR (Navigateur)               │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────────┐
│           FRONTEND — Vue.js SPA (Vercel)                  │
│   ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│   │  Vue Router │  │  Pinia   │  │  Axios HTTP Client│   │
│   └─────────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────┬────────────────────────────────┘
                          │ REST API (JSON)
┌─────────────────────────▼────────────────────────────────┐
│           BACKEND — Express.js / Node.js (Render)         │
│   ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│   │   Router    │  │   Zod    │  │  JWT Auth Middleware│  │
│   └─────────────┘  └──────────┘  └──────────────────┘   │
└───────┬─────────────────────────────────────┬────────────┘
        │                                     │
┌───────▼──────────┐              ┌───────────▼───────────┐
│   SUPABASE       │              │   TMDB API             │
│  (PostgreSQL)    │              │  (The Movie Database)  │
│  (Auth)          │              │  films, séries, images │
│  (Storage)       │              └───────────────────────┘
└──────────────────┘
```

### 2.2 Choix Technologiques

#### Frontend
| Technologie | Version | Rôle |
|------------|---------|------|
| **Vue.js** | 3.x | Framework d'interface utilisateur (Composition API) |
| **TypeScript** | 5.x | Typage statique pour la fiabilité du code |
| **Pinia** | 2.x | Gestion d'état global réactive |
| **Vue Router** | 4.x | Navigation SPA avec guards d'authentification |
| **Axios** | 1.x | Client HTTP pour les appels API |
| **Vite** | 5.x | Bundler et serveur de développement |
| **Lucide Vue** | — | Bibliothèque d'icônes SVG |

#### Backend
| Technologie | Version | Rôle |
|------------|---------|------|
| **Node.js** | 18+ | Runtime JavaScript serveur |
| **Express.js** | 5.x | Framework web REST API |
| **TypeScript** | 5.x | Typage statique |
| **Zod** | 4.x | Validation des données d'entrée |
| **JSON Web Token** | 9.x | Authentification stateless |
| **bcrypt** | 6.x | Hachage des mots de passe |

#### Données et Services
| Service | Rôle |
|---------|------|
| **Supabase (PostgreSQL)** | Base de données relationnelle, authentification OAuth, stockage |
| **TMDB API** | Source de données films/séries (métadonnées, affiches, synopsis) |

#### Déploiement
| Composant | Hébergeur |
|-----------|-----------|
| Frontend | Vercel (déploiement automatique depuis Git) |
| Backend | Render (serveur Node.js managé) |
| Base de données | Supabase Cloud (PostgreSQL managé) |

---

## 3. Modèle de Données (Schéma Conceptuel)

### 3.1 Entités Principales

```
┌────────────────┐       ┌─────────────────────┐
│     USERS      │       │   COLLECTION_ITEMS   │
├────────────────┤       ├─────────────────────┤
│ id (UUID)      │──┐    │ id (UUID)           │
│ username       │  └───>│ user_id (FK)        │
│ email*         │       │ media_id (TMDB ID)  │
│ avatar_url     │       │ media_type          │
│ bio            │       │ title               │
│ created_at     │       │ poster_url          │
└────────────────┘       │ status              │
        │                │ rating (1-10)       │
        │                │ added_at            │
        │                └─────────────────────┘
        │
        │                ┌─────────────────────┐
        │                │     COMMENTS        │
        ├───────────────>├─────────────────────┤
        │                │ id (UUID)           │
        │                │ user_id (FK)        │
        │                │ media_id (TMDB ID)  │
        │                │ media_type          │
        │                │ text                │
        │                │ image_urls []       │
        │                │ created_at          │
        │                └─────────────────────┘
        │
        │                ┌─────────────────────┐
        │                │   COMMENT_LIKES     │
        ├───────────────>├─────────────────────┤
        │                │ id (UUID)           │
        │                │ comment_id (FK)     │
        │                │ user_id (FK)        │
        │                └─────────────────────┘
        │
        │                ┌─────────────────────┐
        │                │      FOLLOWS        │
        ├───────────────>├─────────────────────┤
        │   FOLLOWER     │ id (UUID)           │
        ├───────────────>│ follower_id (FK)    │
        │   FOLLOWING    │ following_id (FK)   │
        │                │ created_at          │
        │                └─────────────────────┘
        │
        │                ┌─────────────────────┐
        └───────────────>│   NOTIFICATIONS     │
                         ├─────────────────────┤
                         │ id (UUID)           │
                         │ user_id (FK)        │
                         │ type                │
                         │ actor_id (FK)       │
                         │ media_id            │
                         │ read (boolean)      │
                         │ created_at          │
                         └─────────────────────┘
```

*`email` stocké uniquement dans `auth.users` (Supabase) — pas dans `public.users`

### 3.2 Types Énumérés

```
media_type  : 'film' | 'serie'
status      : 'to_watch' | 'watched'
notif_type  : 'new_follower' | 'friend_comment' | 'comment_like'
```

---

## 4. Fonctionnalités Prévues

### 4.1 Carte Fonctionnelle

| Module | Fonctionnalité | Priorité |
|--------|---------------|----------|
| **Authentification** | Inscription email/mot de passe | Haute |
| | Connexion | Haute |
| | OAuth Google | Haute |
| | Réinitialisation du mot de passe | Moyenne |
| **Collection** | Ajout film/série à la collection | Haute |
| | Statut (à voir / vu) | Haute |
| | Notation 1–10 | Haute |
| | Filtrage et tri | Moyenne |
| **Découverte** | Recherche par titre | Haute |
| | Tendances du moment | Moyenne |
| | Recommandations personnalisées | Haute |
| **Social** | Suivi d'autres utilisateurs | Haute |
| | Consultation des profils | Haute |
| | Commentaires sur les films | Haute |
| | Likes sur les commentaires | Moyenne |
| | Notifications | Moyenne |
| **Profil** | Édition du pseudo et de la bio | Moyenne |
| | Upload d'avatar | Moyenne |
| | Statistiques de collection | Faible |

### 4.2 User Stories Clés

1. **En tant qu'utilisateur**, je veux m'inscrire avec mon email ou mon compte Google pour accéder à la plateforme.
2. **En tant qu'utilisateur**, je veux rechercher un film par titre et le trouver rapidement.
3. **En tant qu'utilisateur**, je veux ajouter un film à ma collection et lui attribuer une note après l'avoir regardé.
4. **En tant qu'utilisateur**, je veux voir les recommandations basées sur mes films favoris.
5. **En tant qu'utilisateur**, je veux suivre un ami et voir sa collection.
6. **En tant qu'utilisateur**, je veux commenter un film et voir les avis d'autres cinéphiles.

---

## 5. Sécurité — Approche Générale

| Mécanisme | Description |
|-----------|-------------|
| **JWT** | Chaque requête authentifiée porte un token JWT signé |
| **Supabase Auth** | Gestion native des sessions utilisateurs et OAuth |
| **RLS (Row Level Security)** | Politiques PostgreSQL limitant l'accès aux lignes de données |
| **Validation Zod** | Toutes les entrées API sont validées et sanitisées côté serveur |
| **CORS** | Origines autorisées limitées au frontend déployé |
| **HTTPS** | Chiffrement de toutes les communications (Vercel/Render) |

---

## 6. Diagramme de Déploiement

```
Internet
   │
   ├──> [Vercel] ──────────────> dist/ (Vue.js bundlé)
   │         └── CDN mondial pour les assets statiques
   │
   ├──> [Render] ──────────────> Node.js Express API
   │         └── Variable PORT, auto-restart
   │
   └──> [Supabase Cloud]
             ├── PostgreSQL (tables ci-dessus)
             ├── Auth (JWT Supabase + OAuth providers)
             └── Storage (avatars)
```

---

---

# PARTIE II — Documentation Technique Détaillée (Mise en Œuvre)

## 7. Structure du Projet

```
cine-phile/
├── frontend/                  # Application Vue.js
│   ├── src/
│   │   ├── main.ts            # Point d'entrée de l'app
│   │   ├── App.vue            # Composant racine
│   │   ├── router/
│   │   │   └── index.ts       # Définition des routes
│   │   ├── stores/
│   │   │   ├── auth.ts        # Store Pinia (auth, collection, follows, notifs)
│   │   │   └── media.ts       # Store Pinia (recherche, médias)
│   │   ├── services/          # Couche d'accès API (axios)
│   │   │   ├── api.ts         # Instance axios + intercepteurs
│   │   │   ├── auth.service.ts
│   │   │   ├── collection.service.ts
│   │   │   ├── comments.service.ts
│   │   │   ├── follows.service.ts
│   │   │   ├── friends.service.ts
│   │   │   ├── media.service.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── oauth.service.ts
│   │   │   ├── profile.service.ts
│   │   │   ├── recommendations.service.ts
│   │   │   ├── supabase.ts    # Client Supabase frontend (OAuth)
│   │   │   └── users.service.ts
│   │   ├── views/             # Pages de l'application
│   │   │   ├── LandingPage.vue       # Page d'accueil publique
│   │   │   ├── LoginPage.vue         # Connexion
│   │   │   ├── SignupPage.vue        # Inscription
│   │   │   ├── OAuthCallback.vue     # Callback OAuth Google
│   │   │   ├── ResetPasswordPage.vue # Réinitialisation mdp
│   │   │   ├── DashboardPage.vue     # Tableau de bord (tendances + recommandations)
│   │   │   ├── SearchPage.vue        # Recherche de films/séries
│   │   │   ├── MovieDetailsPage.vue  # Détail d'un film/série
│   │   │   ├── CollectionPage.vue    # Collection personnelle
│   │   │   ├── ProfilePage.vue       # Profil utilisateur
│   │   │   ├── FriendsPage.vue       # Gestion des abonnements
│   │   │   ├── NotificationsPage.vue # Notifications
│   │   │   └── SettingsPage.vue      # Paramètres du compte
│   │   ├── components/        # Composants réutilisables
│   │   ├── composables/       # Composables Vue (hooks)
│   │   ├── types/             # Interfaces TypeScript globales
│   │   └── assets/
│   │       └── styles/
│   │           └── custom.css # Styles globaux (palette couleurs)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                   # API Express.js
│   ├── src/
│   │   ├── index.ts           # Point d'entrée Express
│   │   ├── config/
│   │   │   └── supabase.ts    # Client Supabase (service role)
│   │   ├── middleware/
│   │   │   └── auth.ts        # authMiddleware + optionalAuthMiddleware
│   │   ├── routes/
│   │   │   ├── auth.ts        # /api/auth/*
│   │   │   ├── collection.ts  # /api/collection/*
│   │   │   ├── comments.ts    # /api/comments/*
│   │   │   ├── follows.ts     # /api/follows/*
│   │   │   ├── friends.ts     # /api/friends/*
│   │   │   ├── media.ts       # /api/search, /api/media/*
│   │   │   ├── notifications.ts # /api/notifications/*
│   │   │   ├── recommendations.ts # /api/recommendations
│   │   │   └── users.ts       # /api/users/*
│   │   ├── types/
│   │   │   └── index.ts       # Interfaces TypeScript (User, etc.)
│   │   └── utils/
│   │       └── notifications.ts # Fonction createNotification()
│   ├── scripts/
│   │   ├── seed_users.ts      # Génération d'utilisateurs de test
│   │   └── seed_activity.ts   # Génération d'activité (collections, commentaires)
│   ├── migrations/            # Scripts SQL de migration
│   ├── package.json
│   └── tsconfig.json
│
├── DOCUMENTATION.md           # Ce fichier
├── DEPLOYMENT.md              # Guide de déploiement
└── README.md
```

---

## 8. API REST — Référence Complète

Toutes les réponses suivent le format standardisé :

```json
// Succès
{ "success": true, "data": { ... } }

// Erreur
{ "success": false, "error": { "message": "..." } }
```

### 8.1 Authentification — `/api/auth`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Inscription email/pseudo/mot de passe |
| `POST` | `/api/auth/login` | ❌ | Connexion, retourne le token JWT |
| `POST` | `/api/auth/logout` | Optionnel | Déconnexion (invalidation session) |
| `GET` | `/api/auth/user` | ✅ | Récupère le profil de l'utilisateur connecté |
| `PUT` | `/api/auth/profile` | ✅ | Met à jour pseudo, bio ou avatar_url |
| `POST` | `/api/auth/upload-avatar` | ✅ | Upload avatar en base64 |
| `POST` | `/api/auth/reset-password` | ❌ | Envoi email de réinitialisation |
| `POST` | `/api/auth/oauth/callback` | ❌ | Callback OAuth Google (échange de token) |

**Exemple — Inscription :**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "MonMotDePasse123!",
  "pseudo": "AliceCinephile"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid-...",
    "email": "alice@example.com",
    "pseudo": "AliceCinephile",
    "token": "eyJhbGci..."
  }
}
```

---

### 8.2 Médias — `/api` (TMDB Proxy)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/search?q=&type=` | ✅ | Recherche films/séries via TMDB |
| `GET` | `/api/search/trending` | ✅ | Films tendances du moment |
| `GET` | `/api/media/:type/:id` | ✅ | Détail d'un film ou d'une série |

**Paramètres de recherche :**
- `q` : terme de recherche (min. 2 caractères)
- `type` : `movie` | `tv` | (vide = les deux)

---

### 8.3 Collection — `/api/collection`

> Toutes les routes nécessitent une authentification.

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/collection` | Liste les items de la collection |
| `POST` | `/api/collection` | Ajoute un item |
| `PUT` | `/api/collection/:id` | Met à jour (note, statut) |
| `DELETE` | `/api/collection/:id` | Supprime un item |

**Paramètres de filtre (GET) :**

| Param | Valeurs | Description |
|-------|---------|-------------|
| `status` | `to_watch` / `watched` | Filtrer par statut |
| `media_type` | `film` / `serie` | Filtrer par type |
| `sort_by` | `added_at` / `rating` / `title` | Tri |
| `sort_order` | `asc` / `desc` | Ordre de tri |

**Exemple — Ajout à la collection :**
```http
POST /api/collection
Authorization: Bearer <token>
Content-Type: application/json

{
  "media_id": "550",
  "media_type": "film",
  "title": "Fight Club",
  "poster_url": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "status": "watched",
  "rating": 9
}
```

---

### 8.4 Commentaires — `/api/comments`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/api/comments` | ✅ | Crée un commentaire |
| `GET` | `/api/comments/:media_id` | Optionnel | Liste les commentaires d'un media |
| `PUT` | `/api/comments/:id` | ✅ | Modifie un commentaire (propriétaire) |
| `DELETE` | `/api/comments/:id` | ✅ | Supprime un commentaire (propriétaire) |
| `POST` | `/api/comments/:id/like` | ✅ | Like un commentaire |
| `DELETE` | `/api/comments/:id/like` | ✅ | Unlike un commentaire |
| `GET` | `/api/comments/user/me` | ✅ | Commentaires de l'utilisateur connecté |
| `GET` | `/api/comments/user/:user_id` | ❌ | Commentaires + collection notée d'un utilisateur |

> ⚠️ La route `/user/me` doit être définie **avant** `/user/:user_id` dans Express pour éviter les conflits de paramètres.

---

### 8.5 Abonnements (Follows) — `/api/follows`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/api/follows/:id` | ✅ | S'abonner à un utilisateur |
| `DELETE` | `/api/follows/:id` | ✅ | Se désabonner |
| `GET` | `/api/follows/followers` | ✅ | Liste ses abonnés |
| `GET` | `/api/follows/following` | ✅ | Liste ses abonnements |

---

### 8.6 Utilisateurs — `/api/users`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/users/search?q=` | ✅ | Recherche d'utilisateurs par pseudo |
| `GET` | `/api/users/:id` | Optionnel | Profil public d'un utilisateur |
| `GET` | `/api/users/:id/collection` | ❌ | Collection publique d'un utilisateur |
| `PUT` | `/api/users/profile` | ✅ | Mise à jour du profil |

---

### 8.7 Notifications — `/api/notifications`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/notifications` | ✅ | Liste les notifications de l'utilisateur |
| `PUT` | `/api/notifications/:id/read` | ✅ | Marque une notification comme lue |
| `PUT` | `/api/notifications/read-all` | ✅ | Marque toutes comme lues |

**Types de notifications :**
| Type | Déclencheur |
|------|------------|
| `new_follower` | Quelqu'un s'abonne à l'utilisateur |
| `friend_comment` | Un ami commente un film que l'utilisateur a aussi commenté |
| `comment_like` | quelqu'un like un commentaire de l'utilisateur |

---

### 8.8 Recommandations — `/api/recommendations`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/recommendations` | ✅ | Recommandations personnalisées |

**Algorithme de recommandation :**
1. Récupère les films déjà vus par l'utilisateur (collection avec statut `watched`).
2. Identifie les genres favoris à partir des films notés ≥ 7.
3. Interroge TMDB `/discover/movie` avec ces genres (pages 1 et 2 en parallèle).
4. Filtre les films déjà vus (`vote_count.gte = 200` pour ne retenir que les films reconnus).
5. Retourne jusqu'à 10 recommandations avec la raison (`reason`).

---

## 9. Authentification — Flux Détaillé

### 9.1 Authentification Email/Mot de Passe

```
Client                    Backend                  Supabase Auth
  │                          │                          │
  │── POST /api/auth/login──>│                          │
  │   { email, password }    │                          │
  │                          │─ signInWithPassword() ──>│
  │                          │                          │
  │                          │<── JWT token ────────────│
  │<── 200 { token, user } ──│                          │
  │                          │                          │
  │  (stocke token en        │                          │
  │   localStorage)          │                          │
  │                          │                          │
  │── GET /api/auth/user ───>│                          │
  │   Authorization: Bearer  │                          │
  │                          │── getUser(token) ───────>│
  │                          │<── user confirmed ────── │
  │<── 200 { user profile } ─│                          │
```

### 9.2 Authentification Google OAuth

```
Client                    Supabase Auth             Backend
  │                          │                          │
  │── signInWithOAuth ──────>│                          │
  │   (redirect Google)      │                          │
  │                          │                          │
  │<── redirect /auth/callback?token=... ───────────────│
  │                          │                          │
  │── POST /api/auth/oauth/callback ─────────────────> │
  │   { access_token, user } │                          │
  │                          │<─── getUser(token) ─────>│
  │                          │         (verify)         │
  │                          │                          │
  │                     creates/finds user in public.users
  │                          │                          │
  │<── 200 { token, user } ──│                          │
```

### 9.3 Middleware d'Authentification

Le backend dispose de deux middlewares :

- **`authMiddleware`** : Obligatoire. Rejette les requêtes sans token valide (401).
- **`optionalAuthMiddleware`** : Facultatif. Enrichit `req.user` si un token est présent, sinon laisse passer.

---

## 10. Frontend — Architecture Détaillée

### 10.1 Gestion d'État (Pinia)

Le store `auth.ts` centralise toute la session utilisateur :

```
useAuthStore
├── State
│   ├── currentUser : User | null
│   ├── collection  : CollectionItem[]
│   ├── followers   : FollowUser[]
│   ├── following   : FollowUser[]
│   ├── notifications: Notification[]
│   └── isLoading, isInitialized, error
│
├── Computed
│   ├── isAuthenticated       → !!currentUser && !!token
│   ├── unreadNotificationsCount
│   └── collectionByStatus    → { to_watch: [], watched: [] }
│
└── Actions
    ├── initialize()          → Vérifie le token au démarrage
    ├── login / signup / logout / resetPassword
    ├── addToCollection / updateCollectionItem / removeFromCollection / isInCollection
    ├── loadFriends / removeFriend
    └── loadNotifications / markNotificationAsRead / markAllNotificationsAsRead
```

### 10.2 Routing et Guards

Le router Vue applique un guard `beforeEach` :

```
Route protégée (requiresAuth: true)
  └── Si non authentifié → redirect /login?redirect=<chemin>

Route publique (requiresAuth: false)
  └── Si authentifié et tente d'accéder à /login ou /signup
        → redirect /dashboard
```

**Routes de l'application :**

| Chemin | Composant | Auth requise |
|--------|-----------|-------------|
| `/` | LandingPage | ❌ |
| `/login` | LoginPage | ❌ |
| `/signup` | SignupPage | ❌ |
| `/reset-password` | ResetPasswordPage | ❌ |
| `/auth/callback` | OAuthCallback | ❌ |
| `/dashboard` | DashboardPage | ✅ |
| `/search` | SearchPage | ✅ |
| `/movie/:id` | MovieDetailsPage | ✅ |
| `/collection` | CollectionPage | ✅ |
| `/profile/:id?` | ProfilePage | ✅ |
| `/friends` | FriendsPage | ✅ |
| `/notifications` | NotificationsPage | ✅ |
| `/settings` | SettingsPage | ✅ |

### 10.3 Couche Service (api.ts)

Toutes les requêtes HTTP passent par une instance Axios centralisée :

- **Base URL** : `VITE_API_URL` (env variable)
- **Intercepteur de requête** : Injecte automatiquement `Authorization: Bearer <token>`
- **Intercepteur de réponse** : Capture les erreurs 401 et redirige vers `/login`

```typescript
// Exemple d'utilisation dans un service
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Intercepteur request
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### 10.4 Pages — Responsabilités

| Page | Fonctionnalités clés |
|------|---------------------|
| **DashboardPage** | Films tendances (TMDB), recommandations personnalisées (10 max), liste des amis |
| **SearchPage** | Recherche temps réel, filtres films/séries, ajout rapide à la collection |
| **MovieDetailsPage** | Synopsis, note TMDB, casting, commentaires des utilisateurs, ajout en collection |
| **CollectionPage** | Affichage grille avec filtres, mise à jour statut/note, suppression |
| **ProfilePage** | Stats (collection, commentaires, abonnés/abonnements), édition bio/avatar, modal collection |
| **FriendsPage** | Recherche d'utilisateurs, suivre/ne plus suivre, affichage des abonnés/abonnements |
| **NotificationsPage** | Liste des notifications, marquage comme lu |
| **SettingsPage** | Gestion du compte, changement de pseudo |

---

## 11. Configuration et Variables d'Environnement

### 11.1 Backend (`backend/.env`)

```env
# Serveur
PORT=3000
NODE_ENV=development

# Supabase (service role — CONFIDENTIEL)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...    # Service Role Key

# JWT
JWT_SECRET=votre_secret_jwt_fort

# TMDB API
TMDB_API_KEY=votre_clef_tmdb

# CORS
CORS_ORIGIN=https://votre-frontend.vercel.app
FRONTEND_URL=https://votre-frontend.vercel.app
```

### 11.2 Frontend (`frontend/.env`)

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3000

# Supabase (anon key — pour OAuth côté client)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...    # Anon Key (publique)
```

> ⚠️ Ne jamais committer les fichiers `.env` dans le contrôle de version. Le fichier `.gitignore` est configuré à cet effet.

---

## 12. Déploiement

### 12.1 Prérequis

- Compte Supabase (base de données + auth configurés)
- Compte TMDB (clé API)
- Compte Vercel (frontend)
- Compte Render (backend)

### 12.2 Backend (Render)

```bash
# Variables d'environnement à configurer sur Render :
SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, TMDB_API_KEY,
CORS_ORIGIN, FRONTEND_URL, NODE_ENV=production

# Build command :
npm install && npm run build

# Start command :
node dist/index.js
```

### 12.3 Frontend (Vercel)

```bash
# Variables d'environnement à configurer sur Vercel :
VITE_API_URL=https://votre-api.onrender.com
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Build command :
npm run build

# Output directory :
dist
```

---

## 13. Scripts Utilitaires (Développement et Tests)

### 13.1 Génération d'Utilisateurs de Test

```bash
cd backend
npx ts-node scripts/seed_users.ts [nombre]
# Exemple : npx ts-node scripts/seed_users.ts 100
```

**Description :** Crée N utilisateurs factices via l'Admin API Supabase avec des pseudos, bios et avatars générés par `@faker-js/faker`. Mot de passe par défaut : `Password@123`.

### 13.2 Génération d'Activité

```bash
cd backend
npx ts-node scripts/seed_activity.ts
```

**Description :** Pour chaque utilisateur existant :
- Récupère des films/séries populaires via TMDB.
- Ajoute 3–12 items à leur collection (statuts et notes aléatoires).
- Génère des commentaires (30% des items notés).

---

## 14. Gestion des Erreurs

### 14.1 Backend

Le backend applique une gestion structurée des erreurs :

| Code HTTP | Situation |
|-----------|-----------|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Données invalides (validation Zod échouée) |
| `401` | Token absent ou invalide |
| `403` | Permission refusée (propriétaire seulement) |
| `404` | Ressource non trouvée |
| `409` | Conflit (doublon, ex: film déjà en collection) |
| `500` | Erreur serveur interne |

Un middleware global de gestion d'erreurs est défini en dernier dans `index.ts` pour intercepter toutes les erreurs non gérées.

### 14.2 Frontend

- Les intercepteurs Axios capturent les erreurs HTTP et affichent des messages localisés.
- Les erreurs 401 déclenchent une redirection vers `/login`.
- Les stores Pinia exposent un état `error: string | null` que les composants peuvent afficher.

---

## 15. Qualité et Bonnes Pratiques

| Pratique | Implémentation |
|----------|---------------|
| **Typage fort** | TypeScript strict côté frontend et backend |
| **Validation données** | Schémas Zod sur toutes les routes POST/PUT |
| **Modularité** | Un fichier par route, un service par domaine fonctionnel |
| **Lazy loading** | Les pages Vue sont chargées à la demande (code splitting Vite) |
| **Gestion d'erreurs** | Try/catch systématique, middleware d'erreurs global |
| **Sécurité tokens** | JWT stockés en localStorage, envoyés via header `Authorization` |
| **CORS** | Origines whitelistées, credentials activés |
| **Logging** | Chaque requête est loggée côté serveur avec timestamp |

---

## 16. Glossaire

| Terme | Définition |
|-------|-----------|
| **TMDB** | The Movie Database — API publique de métadonnées cinématographiques |
| **Supabase** | Backend-as-a-Service basé sur PostgreSQL avec Auth intégrée |
| **JWT** | JSON Web Token — format de token d'authentification stateless |
| **RLS** | Row Level Security — politiques d'accès aux données par ligne dans PostgreSQL |
| **SPA** | Single Page Application — application chargée une fois, navigation côté client |
| **OAuth** | Protocole d'autorisation pour connexion via un fournisseur tiers (Google) |
| **Pinia** | Bibliothèque de gestion d'état officielle de Vue.js 3 |
| **media_type** | Type de média : `film` (côté DB) ou `serie` (côté DB), `movie`/`tv` (côté TMDB) |
| **Collection** | L'ensemble des films et séries qu'un utilisateur a ajoutés à son suivi |

---

*Document généré le 21 février 2026. Pour toute mise à jour, modifier ce fichier à la racine du dépôt.*
