# Configuration Supabase Backend

Ce dossier contient la configuration Supabase et les middlewares d'authentification pour le backend Express.

## Fichiers créés

### 1. `src/config/supabase.ts`
Configuration du client Supabase avec:
- **Client Supabase** initialisé avec `SUPABASE_URL` et `SUPABASE_SERVICE_KEY`
- **Export `auth`**: Client d'authentification Supabase (`GoTrueClient`)
- **Export `db`**: Client de base de données Supabase (`SupabaseClient`)
- **Helper `verifySupabaseToken(token)`**: Vérifie les tokens JWT via l'API Supabase
- **Helper `verifyJWT(token)`**: Vérifie les tokens JWT localement avec `jsonwebtoken`

### 2. `src/middleware/auth.ts`
Middlewares d'authentification:
- **`authMiddleware`**: Middleware obligatoire qui vérifie le token JWT et retourne 401 si invalide
- **`optionalAuthMiddleware`**: Middleware optionnel qui ajoute l'utilisateur au contexte si un token valide est fourni

### 3. `src/types/index.ts`
Types TypeScript pour:
- `User`: Utilisateur de l'application
- `CollectionItem`: Film/série dans la collection d'un utilisateur
- `Comment`: Commentaire sur un item ou une review
- `Notification`: Notification pour un utilisateur
- `Friend`: Relation d'amitié entre utilisateurs
- `ApiResponse<T>`: Wrapper générique pour les réponses API
- `PaginationParams`: Paramètres de pagination
- `CollectionFilters`: Filtres pour les items de collection

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env`:

```bash
SUPABASE_URL=https://hgfcnvxstqlvrazzjeor.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
JWT_SECRET=your_jwt_secret_here
```

## Utilisation

### Exemple de route protégée

```typescript
import express from 'express';
import { authMiddleware } from './middleware/auth';
import { db } from './config/supabase';
import { CollectionItem } from './types';

const router = express.Router();

// Route protégée - nécessite un token valide
router.get('/collection', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const { data, error } = await db
      .from('collection_items')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### Exemple de route avec authentification optionnelle

```typescript
import { optionalAuthMiddleware } from './middleware/auth';

// Route publique avec contenu personnalisé si authentifié
router.get('/movies/popular', optionalAuthMiddleware, async (req, res) => {
  try {
    // Si l'utilisateur est authentifié, personnaliser les résultats
    const userId = req.user?.id;
    
    // Logique de récupération des films populaires
    // avec personnalisation si userId existe
    
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Utilisation directe du client Supabase

```typescript
import { db, auth } from './config/supabase';

// Requête à la base de données
const { data, error } = await db
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Opérations d'authentification
const { data: userData, error: authError } = await auth.getUser(token);
```

## Structure des headers pour l'authentification

Les requêtes authentifiées doivent inclure le header:

```
Authorization: Bearer <jwt_token>
```

## Réponses d'erreur

Le middleware retourne les erreurs suivantes:

- **401 Unauthorized**: Token manquant, invalide ou expiré
- **500 Internal Server Error**: Erreur inattendue lors de l'authentification

Format de réponse d'erreur:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```
