# 🚀 Guide de Déploiement MediaTrack

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Render    │────▶│  Supabase   │
│  (Frontend) │     │  (Backend)  │     │    (DB)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 1️⃣ Déployer le Backend sur Render.com

### Étape 1: Créer un compte
1. Va sur [render.com](https://render.com)
2. Crée un compte (gratuit) avec GitHub

### Étape 2: Créer un Web Service
1. Clique sur **"New +"** → **"Web Service"**
2. Connecte ton repo GitHub `cine-phile`
3. Configure:
   - **Name**: `mediatrack-api`
   - **Region**: `Frankfurt (EU Central)`
   - **Branch**: `master`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Étape 3: Variables d'environnement
Ajoute ces variables dans **Environment** :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `SUPABASE_URL` | `https://hgfcnvxstqlvrazzjeor.supabase.co` |
| `SUPABASE_ANON_KEY` | *(ta clé anon)* |
| `SUPABASE_SERVICE_KEY` | *(ta clé service)* |
| `JWT_SECRET` | *(ton secret JWT)* |
| `TMDB_API_KEY` | *(ta clé TMDb)* |
| `OMDB_API_KEY` | *(ta clé OMDb)* |
| `CORS_ORIGIN` | `https://mediatrack.vercel.app` |
| `FRONTEND_URL` | `https://mediatrack.vercel.app` |

4. Clique **"Create Web Service"**
5. Attends le déploiement (~5 min)
6. Note l'URL: `https://mediatrack-api.onrender.com`

---

## 2️⃣ Déployer le Frontend sur Vercel

### Étape 1: Créer un compte
1. Va sur [vercel.com](https://vercel.com)
2. Crée un compte avec GitHub

### Étape 2: Importer le projet
1. Clique **"Add New..."** → **"Project"**
2. Importe `cine-phile` depuis GitHub
3. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Étape 3: Variables d'environnement
Ajoute cette variable:

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://mediatrack-api.onrender.com/api` |

4. Clique **"Deploy"**
5. Attends (~2 min)
6. Ton site est en ligne! 🎉

---

## 3️⃣ Mettre à jour CORS sur Render

Après avoir obtenu l'URL Vercel finale, retourne sur Render et mets à jour:
- `CORS_ORIGIN` → L'URL exacte de ton frontend Vercel
- `FRONTEND_URL` → L'URL exacte de ton frontend Vercel

---

## ⚠️ Notes importantes

### Render Free Tier
- Le serveur "dort" après 15 min d'inactivité
- Premier appel peut prendre ~30 secondes (cold start)
- 750 heures gratuites/mois

### Supabase
- Déjà configuré et prêt à l'emploi
- Vérifie que les RLS policies sont correctes

### Domaine personnalisé (optionnel)
- Vercel: Settings → Domains → Ajouter ton domaine
- Render: Settings → Custom Domain

---

## 🔄 Mises à jour futures

Chaque `git push` sur `master` déclenchera automatiquement:
- Rebuild sur Render (backend)
- Rebuild sur Vercel (frontend)

---

## 🧪 Test de déploiement

1. Ouvre ton URL Vercel
2. Crée un compte
3. Connecte-toi
4. Cherche un film
5. Ajoute-le à ta collection

Si tout fonctionne, c'est déployé! 🚀
