# Routes Media - Documentation API

## Endpoints créés

Tous les endpoints sont préfixés par `/api`.

### 1. GET `/api/search?q=...`
Rechercher des films et séries sur TMDb.

**Query Parameters:**
- `q` (required): Terme de recherche (minimum 2 caractères)
- `page` (optional): Numéro de page (défaut: 1)

**Exemple:**
```
GET /api/search?q=inception&page=1
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 27205,
        "title": "Inception",
        "poster_path": "https://image.tmdb.org/t/p/w500/...",
        "media_type": "movie",
        "release_date": "2010-07-16",
        "overview": "Dom Cobb est un voleur expérimenté...",
        "vote_average": 8.4
      }
    ],
    "page": 1,
    "total_pages": 5,
    "total_results": 89
  },
  "meta": {
    "cached": false
  }
}
```

**Cache:** 5 minutes

**Erreurs possibles:**
- 400: Recherche trop courte (< 2 caractères)
- 429: Rate limit TMDb dépassé
- 503: Service TMDb indisponible

---

### 2. GET `/api/media/:type/:id`
Récupérer les détails complets d'un film ou d'une série.

**Path Parameters:**
- `type` (required): Type de média (`movie` ou `tv`)
- `id` (required): ID TMDb du média

**Exemple:**
```
GET /api/media/movie/27205
GET /api/media/tv/1399
```

**Réponse succès - Film (200):**
```json
{
  "success": true,
  "data": {
    "id": 27205,
    "title": "Inception",
    "poster_path": "https://image.tmdb.org/t/p/w500/...",
    "backdrop_path": "https://image.tmdb.org/t/p/w500/...",
    "overview": "Dom Cobb est un voleur expérimenté...",
    "genres": [
      { "id": 28, "name": "Action" },
      { "id": 878, "name": "Science-Fiction" }
    ],
    "release_date": "2010-07-16",
    "director": {
      "id": 525,
      "name": "Christopher Nolan"
    },
    "cast": [
      {
        "id": 6193,
        "name": "Leonardo DiCaprio",
        "character": "Dom Cobb",
        "profile_path": "https://image.tmdb.org/t/p/w500/..."
      }
    ],
    "runtime": 148,
    "vote_average": 8.4,
    "vote_count": 35000,
    "tagline": "Your mind is the scene of the crime",
    "media_type": "movie"
  }
}
```

**Réponse succès - Série (200):**
```json
{
  "success": true,
  "data": {
    "id": 1399,
    "title": "Game of Thrones",
    "poster_path": "https://image.tmdb.org/t/p/w500/...",
    "backdrop_path": "https://image.tmdb.org/t/p/w500/...",
    "overview": "Il y a très longtemps...",
    "genres": [
      { "id": 10765, "name": "Sci-Fi & Fantasy" }
    ],
    "release_date": "2011-04-17",
    "cast": [...],
    "number_of_seasons": 8,
    "number_of_episodes": 73,
    "episode_run_time": 60,
    "vote_average": 8.4,
    "vote_count": 22000,
    "tagline": "Winter Is Coming",
    "media_type": "tv"
  }
}
```

**Cache:** 24 heures

**Erreurs possibles:**
- 400: Type invalide ou ID invalide
- 404: Média non trouvé
- 429: Rate limit TMDb dépassé
- 503: Service TMDb indisponible

---

### 3. GET `/api/search/trending`
Récupérer les films et séries tendance de la semaine.

**Exemple:**
```
GET /api/search/trending
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 533535,
      "title": "Deadpool & Wolverine",
      "poster_path": "https://image.tmdb.org/t/p/w500/...",
      "media_type": "movie",
      "release_date": "2024-07-24",
      "overview": "Un Deadpool apathique...",
      "vote_average": 7.8
    }
  ],
  "meta": {
    "cached": false
  }
}
```

**Limite:** 8 résultats maximum

**Cache:** 5 minutes

**Erreurs possibles:**
- 429: Rate limit TMDb dépassé
- 503: Service TMDb indisponible

---

## Configuration

### Variables d'environnement

Ajoutez dans votre fichier `.env`:

```bash
TMDB_API_KEY=your_tmdb_api_key_here
```

Pour obtenir une clé API TMDb:
1. Créez un compte sur https://www.themoviedb.org/
2. Allez dans Settings → API
3. Demandez une clé API (gratuite)

### Images TMDb

Toutes les images sont retournées avec l'URL complète:
```
https://image.tmdb.org/t/p/w500/[path]
```

Tailles disponibles:
- `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`

---

## Caching

Le système de cache en mémoire permet de:
- ✅ Réduire les appels à l'API TMDb
- ✅ Améliorer les performances
- ✅ Respecter les limites de rate limiting

**Durées de cache:**
- Recherche: 5 minutes
- Trending: 5 minutes
- Détails média: 24 heures

**Indicateur de cache:**
```json
{
  "meta": {
    "cached": true
  }
}
```

---

## Gestion des erreurs

### Codes HTTP

- **200**: Succès
- **400**: Validation échouée (paramètres invalides)
- **404**: Ressource non trouvée
- **429**: Rate limit dépassé
- **503**: Service indisponible

### Format des erreurs

```json
{
  "success": false,
  "error": {
    "message": "Description de l'erreur"
  }
}
```

### Erreurs spécifiques TMDb

- **Rate Limit (429)**: "Trop de requêtes, veuillez réessayer plus tard"
- **Not Found (404)**: "Ressource non trouvée"
- **Timeout**: "Service TMDb temporairement indisponible"
- **Connection Error**: "Erreur lors de la communication avec TMDb"

---

## Tests avec cURL

### Recherche
```bash
curl "http://localhost:3000/api/search?q=inception"
```

### Détails d'un film
```bash
curl "http://localhost:3000/api/media/movie/27205"
```

### Détails d'une série
```bash
curl "http://localhost:3000/api/media/tv/1399"
```

### Trending
```bash
curl "http://localhost:3000/api/search/trending"
```

---

## Limites

- **Résultats de recherche**: Maximum 20 par page
- **Pages de recherche**: Maximum 10 pages
- **Trending**: Maximum 8 résultats
- **Cast**: Maximum 10 acteurs
- **Timeout**: 10 secondes par requête TMDb

---

## Notes techniques

### Validation Zod

Tous les paramètres sont validés avec Zod:
- `q`: minimum 2 caractères
- `id`: doit être un nombre
- `type`: doit être "movie" ou "tv"

### Langue

Toutes les requêtes TMDb utilisent `language=fr-FR` pour obtenir les résultats en français.

### Axios

Les requêtes HTTP vers TMDb utilisent Axios avec:
- Timeout de 10 secondes
- Gestion automatique des erreurs
- Paramètres d'API key automatiques
