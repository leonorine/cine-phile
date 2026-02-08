# Routes Collection - Documentation API

## Endpoints créés

Tous les endpoints sont préfixés par `/api/collection` et **protégés par authentification**.

> [!IMPORTANT]
> Tous les endpoints nécessitent un token JWT valide dans le header `Authorization: Bearer <token>`.

---

### 1. GET `/api/collection`
Récupérer la collection personnelle de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters (tous optionnels):**
- `status`: Filtrer par statut (`to_watch`, `watching`, `watched`)
- `media_type`: Filtrer par type (`movie`, `tv`)
- `is_favorite`: Filtrer les favoris (`true` ou `false`)
- `sort_by`: Trier par (`added_at`, `rating`, `title`) - défaut: `added_at`
- `sort_order`: Ordre de tri (`asc`, `desc`) - défaut: `desc`

**Exemples:**
```
GET /api/collection
GET /api/collection?status=watched
GET /api/collection?is_favorite=true&sort_by=rating&sort_order=desc
GET /api/collection?media_type=movie&status=to_watch
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "media_id": "27205",
      "media_type": "movie",
      "title": "Inception",
      "poster_url": "https://image.tmdb.org/t/p/w500/...",
      "status": "watched",
      "rating": 9,
      "notes": "Film incroyable !",
      "is_favorite": true,
      "added_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:00:00Z"
    }
  ]
}
```

**Erreurs possibles:**
- 400: Paramètres de requête invalides
- 401: Non authentifié
- 500: Erreur serveur

---

### 2. POST `/api/collection`
Ajouter un film/série à la collection.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "media_id": "27205",
  "media_type": "movie",
  "title": "Inception",
  "poster_url": "https://image.tmdb.org/t/p/w500/...",
  "status": "to_watch",
  "rating": 9,
  "notes": "À regarder ce weekend"
}
```

**Champs requis:**
- `media_id` (string): ID TMDb du média
- `media_type` (enum): `movie` ou `tv`
- `title` (string): Titre du média

**Champs optionnels:**
- `poster_url` (string URL): URL du poster
- `status` (enum): `to_watch`, `watching`, `watched` (défaut: `to_watch`)
- `rating` (number 1-10): Note personnelle
- `notes` (string): Notes personnelles

**Réponse succès (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "media_id": "27205",
    "media_type": "movie",
    "title": "Inception",
    "poster_url": "https://image.tmdb.org/t/p/w500/...",
    "status": "to_watch",
    "rating": 9,
    "notes": "À regarder ce weekend",
    "is_favorite": false,
    "added_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Erreurs possibles:**
- 400: Validation échouée (champs manquants ou invalides)
- 401: Non authentifié
- 409: Film/série déjà dans la collection
- 500: Erreur serveur

---

### 3. PUT `/api/collection/:id`
Mettre à jour un élément de la collection.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (UUID): ID de l'élément dans la collection

**Body (tous les champs sont optionnels):**
```json
{
  "rating": 10,
  "status": "watched",
  "notes": "Chef d'œuvre absolu !",
  "is_favorite": true
}
```

**Champs modifiables:**
- `rating` (number 1-10): Note personnelle
- `status` (enum): `to_watch`, `watching`, `watched`
- `notes` (string): Notes personnelles
- `is_favorite` (boolean): Marquer comme favori

**Exemple:**
```
PUT /api/collection/550e8400-e29b-41d4-a716-446655440000
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "media_id": "27205",
    "media_type": "movie",
    "title": "Inception",
    "poster_url": "https://image.tmdb.org/t/p/w500/...",
    "status": "watched",
    "rating": 10,
    "notes": "Chef d'œuvre absolu !",
    "is_favorite": true,
    "added_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:00:00Z"
  }
}
```

**Erreurs possibles:**
- 400: Validation échouée (ID invalide, rating hors limites)
- 401: Non authentifié
- 403: Pas d'autorisation (l'élément appartient à un autre utilisateur)
- 404: Élément non trouvé
- 500: Erreur serveur

---

### 4. DELETE `/api/collection/:id`
Supprimer un élément de la collection.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id` (UUID): ID de l'élément dans la collection

**Exemple:**
```
DELETE /api/collection/550e8400-e29b-41d4-a716-446655440000
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "message": "Élément supprimé avec succès"
  }
}
```

**Erreurs possibles:**
- 400: ID invalide
- 401: Non authentifié
- 403: Pas d'autorisation (l'élément appartient à un autre utilisateur)
- 404: Élément non trouvé
- 500: Erreur serveur

---

## Sécurité

### Vérification d'ownership

Tous les endpoints PUT et DELETE vérifient que l'utilisateur authentifié est bien le propriétaire de l'élément:

```typescript
if (existingItem.user_id !== userId) {
  return res.status(403).json({
    success: false,
    error: {
      message: 'Vous n\'avez pas la permission...'
    }
  });
}
```

### Protection des routes

Toutes les routes utilisent le middleware `authMiddleware`:

```typescript
router.use(authMiddleware);
```

Cela garantit que:
- ✅ Le token JWT est valide
- ✅ `req.user.id` contient l'ID de l'utilisateur
- ✅ Les requêtes non authentifiées retournent 401

---

## Validation Zod

### Création d'un élément
```typescript
{
  media_id: string (min 1 char)
  media_type: 'movie' | 'tv'
  title: string (min 1 char)
  poster_url: URL valide (optionnel)
  status: 'to_watch' | 'watching' | 'watched' (défaut: 'to_watch')
  rating: number 1-10 (optionnel)
  notes: string (optionnel)
}
```

### Mise à jour d'un élément
```typescript
{
  rating: number 1-10 (optionnel)
  status: 'to_watch' | 'watching' | 'watched' (optionnel)
  notes: string (optionnel)
  is_favorite: boolean (optionnel)
}
```

### Paramètres de requête
```typescript
{
  status: 'to_watch' | 'watching' | 'watched' (optionnel)
  media_type: 'movie' | 'tv' (optionnel)
  is_favorite: 'true' | 'false' (optionnel)
  sort_by: 'added_at' | 'rating' | 'title' (défaut: 'added_at')
  sort_order: 'asc' | 'desc' (défaut: 'desc')
}
```

---

## Tests avec cURL

### Récupérer la collection
```bash
curl -X GET http://localhost:3000/api/collection \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ajouter un film
```bash
curl -X POST http://localhost:3000/api/collection \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "media_id": "27205",
    "media_type": "movie",
    "title": "Inception",
    "poster_url": "https://image.tmdb.org/t/p/w500/...",
    "status": "to_watch",
    "rating": 9
  }'
```

### Mettre à jour un élément
```bash
curl -X PUT http://localhost:3000/api/collection/UUID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 10,
    "status": "watched",
    "is_favorite": true
  }'
```

### Supprimer un élément
```bash
curl -X DELETE http://localhost:3000/api/collection/UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Codes HTTP

- **200**: Succès (GET, PUT, DELETE)
- **201**: Ressource créée (POST)
- **400**: Validation échouée
- **401**: Non authentifié
- **403**: Pas d'autorisation (ownership)
- **404**: Ressource non trouvée
- **409**: Conflit (élément déjà existant)
- **500**: Erreur serveur

---

## Base de données

### Table `collection_items`

```sql
CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_url TEXT,
  status TEXT NOT NULL DEFAULT 'to_watch' CHECK (status IN ('to_watch', 'watching', 'watched')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);
```

**Contraintes:**
- `UNIQUE(user_id, media_id)`: Un utilisateur ne peut pas avoir le même média deux fois
- `ON DELETE CASCADE`: Supprime les éléments de collection si l'utilisateur est supprimé
- `CHECK`: Valide les valeurs des enums et du rating

---

## Notes d'implémentation

### Filtrage dynamique

Le GET utilise un query builder dynamique pour appliquer les filtres:

```typescript
let query = db.from('collection_items').select('*').eq('user_id', userId);

if (status) query = query.eq('status', status);
if (media_type) query = query.eq('media_type', media_type);
if (is_favorite !== undefined) query = query.eq('is_favorite', is_favorite);

query = query.order(sort_by, { ascending: sort_order === 'asc' });
```

### Vérification d'unicité

Avant d'ajouter un élément, on vérifie qu'il n'existe pas déjà:

```typescript
const { data: existingItem } = await db
  .from('collection_items')
  .select('id')
  .eq('user_id', userId)
  .eq('media_id', media_id)
  .maybeSingle();

if (existingItem) {
  return res.status(409).json({ ... });
}
```
