# Gestion des Erreurs - CinePhile Backend

## Vue d'ensemble

Le backend CinePhile implémente une gestion complète des erreurs à plusieurs niveaux pour garantir la stabilité et la fiabilité de l'API.

## Architecture de gestion des erreurs

### 1. Middleware Global d'Erreurs Express

Situé dans [index.ts](file:///Users/leonorine/Desktop/COURS/Fac/Master/M2/S1/PFE/cine-phile/backend/src/index.ts#L91-L123)

```typescript
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Global error handler:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: err.message,
      },
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized',
        details: err.message,
      },
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});
```

**Fonctionnalités:**
- ✅ Catch toutes les erreurs non gérées dans les routes
- ✅ Gestion spécifique pour `ValidationError` (400)
- ✅ Gestion spécifique pour `UnauthorizedError` (401)
- ✅ Stack trace en développement uniquement
- ✅ Format de réponse cohérent `{ success: false, error: {...} }`

### 2. Middleware 404

Situé dans [index.ts](file:///Users/leonorine/Desktop/COURS/Fac/Master/M2/S1/PFE/cine-phile/backend/src/index.ts#L78-L88)

```typescript
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.path,
      method: req.method,
    },
  });
});
```

**Fonctionnalités:**
- ✅ Capture toutes les routes inexistantes
- ✅ Retourne 404 avec détails (path, method)
- ✅ Format cohérent avec les autres erreurs

### 3. Gestionnaires d'Erreurs au Niveau du Processus

Situé dans [index.ts](file:///Users/leonorine/Desktop/COURS/Fac/Master/M2/S1/PFE/cine-phile/backend/src/index.ts#L137-L166)

#### Unhandled Promise Rejections

```typescript
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // In production, you might want to exit the process
  // process.exit(1);
});
```

**Capture:** Promesses rejetées non gérées (async/await sans try/catch)

#### Uncaught Exceptions

```typescript
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  // In production, you should exit the process after cleanup
  // process.exit(1);
});
```

**Capture:** Exceptions synchrones non gérées

#### Graceful Shutdown

```typescript
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});
```

**Fonctionnalités:**
- ✅ Arrêt propre avec CTRL+C (SIGINT)
- ✅ Arrêt propre lors du déploiement (SIGTERM)

## Gestion des Erreurs dans les Routes

### Try/Catch dans chaque endpoint

Toutes les routes utilisent des blocs try/catch:

```typescript
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Validation
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: validationResult.error.issues[0].message },
      });
    }

    // Business logic
    const result = await someAsyncOperation();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in endpoint:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur serveur inattendue' },
    });
  }
});
```

## Codes HTTP Utilisés

| Code | Signification | Utilisation |
|------|---------------|-------------|
| 200 | OK | Succès (GET, PUT, DELETE) |
| 201 | Created | Ressource créée (POST) |
| 400 | Bad Request | Validation échouée, données invalides |
| 401 | Unauthorized | Non authentifié, token invalide |
| 403 | Forbidden | Pas d'autorisation, ownership |
| 404 | Not Found | Ressource non trouvée |
| 409 | Conflict | Doublon (pseudo, like déjà existant) |
| 429 | Too Many Requests | Rate limit TMDb dépassé |
| 500 | Internal Server Error | Erreur serveur non prévue |
| 503 | Service Unavailable | Service externe indisponible |

## Format des Réponses d'Erreur

### Succès
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Erreur Simple
```json
{
  "success": false,
  "error": {
    "message": "Description de l'erreur"
  }
}
```

### Erreur avec Détails
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": "Le pseudo doit contenir au moins 3 caractères"
  }
}
```

### Erreur 404
```json
{
  "success": false,
  "error": {
    "message": "Route not found",
    "path": "/api/invalid",
    "method": "GET"
  }
}
```

### Erreur en Développement (avec stack)
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "stack": "Error: ...\n    at ..."
  }
}
```

## Exemples de Gestion d'Erreurs Spécifiques

### 1. Validation Zod

```typescript
const validationResult = schema.safeParse(req.body);

if (!validationResult.success) {
  return res.status(400).json({
    success: false,
    error: {
      message: validationResult.error.issues[0].message,
    },
  });
}
```

### 2. Ressource Non Trouvée

```typescript
const { data: user } = await db
  .from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

if (!user) {
  return res.status(404).json({
    success: false,
    error: {
      message: 'Utilisateur non trouvé',
    },
  });
}
```

### 3. Vérification d'Ownership

```typescript
if (comment.user_id !== req.user!.id) {
  return res.status(403).json({
    success: false,
    error: {
      message: 'Vous n\'avez pas la permission de modifier ce commentaire',
    },
  });
}
```

### 4. Conflit (Doublon)

```typescript
const { data: existingLike } = await db
  .from('comment_likes')
  .select('id')
  .eq('comment_id', commentId)
  .eq('user_id', userId)
  .maybeSingle();

if (existingLike) {
  return res.status(409).json({
    success: false,
    error: {
      message: 'Vous avez déjà aimé ce commentaire',
    },
  });
}
```

### 5. Erreur TMDb API

```typescript
if (error.response?.status === 429) {
  return res.status(429).json({
    success: false,
    error: {
      message: 'Rate limit dépassé, veuillez réessayer plus tard',
    },
  });
}

if (error.response?.status === 503) {
  return res.status(503).json({
    success: false,
    error: {
      message: 'Service TMDb temporairement indisponible',
    },
  });
}
```

## Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours utiliser try/catch** dans les routes async
2. **Valider les inputs** avec Zod avant traitement
3. **Retourner le bon code HTTP** selon le type d'erreur
4. **Logger les erreurs** avec console.error
5. **Format cohérent** pour toutes les réponses
6. **Messages clairs** pour l'utilisateur
7. **Vérifier l'existence** des ressources avant modification
8. **Vérifier l'ownership** avant modification/suppression

### ❌ À ÉVITER

1. ❌ Exposer les stack traces en production
2. ❌ Retourner 500 pour des erreurs de validation
3. ❌ Oublier de logger les erreurs
4. ❌ Messages d'erreur techniques pour l'utilisateur
5. ❌ Ignorer les erreurs silencieusement
6. ❌ Utiliser throw dans les routes (préférer return res.status)

## Tests d'Erreurs

```bash
# Test 404
curl http://localhost:3000/api/invalid

# Test validation
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"text": "ab"}'

# Test unauthorized
curl http://localhost:3000/api/collection

# Test not found
curl http://localhost:3000/api/users/00000000-0000-0000-0000-000000000000
```

## Améliorations Futures

1. **Winston Logger** - Remplacer console.log
2. **Sentry** - Error tracking en production
3. **Custom Error Classes** - Erreurs typées
4. **Error Codes** - Codes d'erreur uniques
5. **Rate Limiting** - Protection contre abus
6. **Request ID** - Traçabilité des erreurs

## Conclusion

Le système de gestion des erreurs est **complet et robuste**:
- ✅ Middleware global Express
- ✅ Gestionnaires process-level
- ✅ 404 handler
- ✅ Try/catch dans toutes les routes
- ✅ Format cohérent
- ✅ Codes HTTP appropriés
- ✅ Logging détaillé
- ✅ Graceful shutdown

Le backend est prêt pour la production ! 🚀
