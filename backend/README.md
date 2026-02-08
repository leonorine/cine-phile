# CinePhile Backend - API Complete

## Vue d'ensemble

Backend Express.js complet pour l'application CinePhile avec Supabase, TypeScript et validation Zod.

## Routes API

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/user` - Profil utilisateur (protected)
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/reset-password` - Réinitialisation mot de passe

### 🎬 Media (`/api`)
- `GET /api/search?q=...` - Recherche films/séries
- `GET /api/media/:type/:id` - Détails média (type: movie|tv)
- `GET /api/search/trending` - Tendances de la semaine

### 📚 Collection (`/api/collection`)
- `GET /api/collection` - Liste collection (protected, filtres)
- `POST /api/collection` - Ajouter à la collection (protected)
- `PUT /api/collection/:id` - Modifier item (protected)
- `DELETE /api/collection/:id` - Supprimer item (protected)

### 👥 Friends (`/api/friends`)
- `POST /api/friends/add/:friend_id` - Ajouter ami (protected)
- `GET /api/friends` - Liste amis (protected)
- `DELETE /api/friends/:friend_id` - Supprimer ami (protected)

### 🔔 Notifications (`/api/notifications`)
- `GET /api/notifications` - Liste notifications (protected)
- `POST /api/notifications/:id/read` - Marquer comme lu (protected)
- `POST /api/notifications/read-all` - Tout marquer comme lu (protected)

### 💬 Comments (`/api/comments`)
- `POST /api/comments` - Créer commentaire (protected)
- `GET /api/comments/:media_id` - Liste commentaires (public)
- `PUT /api/comments/:id` - Modifier commentaire (protected)
- `DELETE /api/comments/:id` - Supprimer commentaire (protected)
- `POST /api/comments/:id/like` - Liker commentaire (protected)
- `DELETE /api/comments/:id/like` - Unlike commentaire (protected)

### 👤 Users (`/api/users`)
- `GET /api/users/:user_id` - Profil public avec stats
- `PUT /api/users/me` - Modifier son profil (protected)
- `GET /api/users/:user_id/collection` - Collection utilisateur (public, paginé)
- `GET /api/users/:user_id/comments` - Commentaires utilisateur (public, paginé)

## Fonctionnalités

### ✅ Sécurité
- JWT authentication avec Supabase
- Middleware `authMiddleware` pour routes protégées
- Vérification d'ownership (403 Forbidden)
- Validation Zod sur tous les inputs
- CORS configuré

### ✅ Notifications automatiques
- `friend_request` - Nouvel ami ajouté
- `friend_comment` - Ami commente le même média
- `comment_like` - Commentaire liké
- `friend_rating` - Ami note un film

### ✅ Caching
- Cache in-memory pour recherches TMDb (5 min)
- Cache détails média (24h)
- Cache tendances (5 min)

### ✅ Pagination
- Collection utilisateur (limit/offset)
- Commentaires utilisateur (limit/offset)
- Défaut: limit=20, offset=0

### ✅ Error Handling
- Middleware global d'erreurs
- Gestion spécifique: ValidationError, UnauthorizedError
- 404 pour routes inexistantes
- Logs détaillés en développement

### ✅ Logging
- Request logging (timestamp, method, path)
- Error logging avec stack traces
- Startup banner avec infos serveur

## Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Configuration Supabase
│   ├── middleware/
│   │   └── auth.ts               # Auth middleware
│   ├── routes/
│   │   ├── auth.ts               # Routes authentification
│   │   ├── media.ts              # Routes recherche TMDb
│   │   ├── collection.ts         # Routes collection
│   │   ├── friends.ts            # Routes amis
│   │   ├── notifications.ts      # Routes notifications
│   │   ├── comments.ts           # Routes commentaires
│   │   └── users.ts              # Routes utilisateurs
│   ├── types/
│   │   └── index.ts              # Types TypeScript
│   ├── utils/
│   │   └── notifications.ts      # Utilitaires notifications
│   └── index.ts                  # Point d'entrée
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Variables d'environnement

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-jwt-secret

# TMDb API
TMDB_API_KEY=your-tmdb-api-key

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Frontend
FRONTEND_URL=http://localhost:5173
```

## Installation

```bash
# Installer les dépendances
npm install

# Copier .env.example vers .env
cp .env.example .env

# Configurer les variables d'environnement
# Éditer .env avec vos clés

# Lancer en développement
npm run dev

# Build production
npm run build

# Lancer en production
npm start
```

## Scripts disponibles

```json
{
  "dev": "nodemon src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "jest"
}
```

## Dépendances principales

- **express** - Framework web
- **@supabase/supabase-js** - Client Supabase
- **zod** - Validation de schémas
- **axios** - Requêtes HTTP (TMDb)
- **jsonwebtoken** - JWT
- **cors** - CORS
- **dotenv** - Variables d'environnement
- **typescript** - TypeScript
- **nodemon** - Hot reload développement

## Base de données Supabase

### Tables requises

1. **users** - Profils utilisateurs
2. **collection_items** - Collections personnelles
3. **friends** - Relations d'amitié
4. **notifications** - Notifications utilisateurs
5. **comments** - Commentaires sur médias
6. **comment_likes** - Likes sur commentaires

Voir `README_SUPABASE.md` pour les schémas SQL complets.

## Tests

```bash
# Tester la santé du serveur
curl http://localhost:3000/health

# Tester une route publique
curl http://localhost:3000/api/search?q=inception

# Tester avec authentification
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/collection
```

## Codes HTTP

- **200** - Succès
- **201** - Ressource créée
- **400** - Validation échouée
- **401** - Non authentifié
- **403** - Pas d'autorisation
- **404** - Ressource non trouvée
- **409** - Conflit (doublon)
- **429** - Rate limit dépassé
- **500** - Erreur serveur
- **503** - Service indisponible

## Format des réponses

### Succès
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Erreur
```json
{
  "success": false,
  "error": {
    "message": "Description de l'erreur",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Prochaines étapes

1. **Tests unitaires** - Jest + Supertest
2. **Rate limiting** - express-rate-limit
3. **Compression** - compression middleware
4. **Helmet** - Sécurité headers
5. **Morgan** - Logging avancé
6. **Redis** - Cache persistant
7. **WebSockets** - Notifications temps réel
8. **Swagger** - Documentation API interactive

## Licence

MIT
