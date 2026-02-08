# Routes d'Authentification - Documentation

## Endpoints créés

Tous les endpoints sont préfixés par `/api/auth`.

### 1. POST `/api/auth/register`
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "pseudo": "username"
}
```

**Validation:**
- Email: format valide
- Password: minimum 6 caractères
- Pseudo: 2-50 caractères

**Réponse succès (201):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "pseudo": "username",
    "token": "jwt_token"
  }
}
```

**Erreurs possibles:**
- 400: Email invalide, password trop faible, pseudo déjà utilisé
- 500: Erreur serveur

**Logique:**
1. Valide les inputs avec Zod
2. Vérifie que le pseudo n'est pas déjà pris
3. Crée l'utilisateur dans Supabase Auth
4. Crée le profil dans la table `users`
5. Rollback si la création du profil échoue

---

### 2. POST `/api/auth/login`
Authentifier un utilisateur existant.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "pseudo": "username",
    "token": "jwt_token"
  }
}
```

**Erreurs possibles:**
- 400: Validation échouée
- 401: Email ou mot de passe incorrect
- 500: Erreur serveur

---

### 3. GET `/api/auth/user` 🔒
Récupérer les informations de l'utilisateur authentifié.

**Headers requis:**
```
Authorization: Bearer <jwt_token>
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "avatar_url": "",
    "bio": "",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Erreurs possibles:**
- 401: Token manquant ou invalide (middleware)
- 404: Utilisateur non trouvé
- 500: Erreur serveur

---

### 4. POST `/api/auth/logout`
Déconnecter l'utilisateur (invalide la session Supabase).

**Headers optionnels:**
```
Authorization: Bearer <jwt_token>
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "message": "Déconnexion réussie"
  }
}
```

**Note:** Retourne toujours succès, même sans token. Le client doit supprimer le token localement.

---

### 5. POST `/api/auth/reset-password`
Envoyer un email de réinitialisation de mot de passe.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Réponse succès (200):**
```json
{
  "success": true,
  "data": {
    "message": "Si cet email existe, un lien de réinitialisation a été envoyé"
  }
}
```

**Note:** Retourne toujours succès pour éviter l'énumération d'emails.

---

## Format des erreurs

Toutes les erreurs suivent ce format:

```json
{
  "success": false,
  "error": {
    "message": "Description de l'erreur"
  }
}
```

## Codes HTTP

- **200**: Succès (GET, POST logout, reset-password)
- **201**: Ressource créée (POST register)
- **400**: Requête invalide (validation échouée)
- **401**: Non authentifié (credentials invalides, token manquant)
- **404**: Ressource non trouvée
- **500**: Erreur serveur

## Sécurité

- ✅ Validation Zod sur tous les inputs
- ✅ Vérification JWT via Supabase
- ✅ Pas de révélation d'existence d'email (reset-password)
- ✅ Messages d'erreur génériques pour login
- ✅ Rollback automatique si création de profil échoue
- ✅ Logs d'erreurs côté serveur

## Tests avec cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "pseudo": "testuser"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get User
```bash
curl -X GET http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```
