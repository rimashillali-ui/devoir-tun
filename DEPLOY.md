# Déployer Devoiratouna sur Vercel (base de données conservée)

Le site tourne sur **TanStack Start** (SSR) et se connecte à une base **Supabase**.
La base ne bouge pas : documents, articles, quiz, messages, comptes et rôles admin
restent exactement où ils sont. On ne change que l'hébergement du site.

---

## 1. Récupérer le code

1. Dans l'éditeur : bouton **GitHub → Connect / Export to GitHub**.
2. En local :

```bash
git clone https://github.com/<votre-compte>/<votre-repo>.git
cd <votre-repo>
npm install
cp .env.example .env      # puis remplir les valeurs (voir étape 2)
npm run dev               # http://localhost:5173
```

## 2. Variables d'environnement

Cinq variables, toutes des clés **publiques** (aucun secret) :

| Variable | Rôle |
| --- | --- |
| `VITE_SUPABASE_URL` | URL de la base, côté navigateur |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | clé publishable, côté navigateur |
| `VITE_SUPABASE_PROJECT_ID` | identifiant projet |
| `SUPABASE_URL` | même URL, côté serveur (SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | même clé, côté serveur (SSR) |

Les valeurs actuelles se trouvent dans le fichier `.env` du projet exporté.
Le site n'a **aucun besoin** de la clé service-role : toutes les opérations admin
passent par les policies RLS et des fonctions SQL sécurisées.

## 3. Importer dans Vercel

1. **Add New → Project**, choisir le dépôt GitHub.
2. Framework Preset : **Other** (le fichier `vercel.json` fournit déjà les commandes).
   - Build Command : `npm run build`
   - Install Command : `npm install`
3. **Environment Variables** : coller les 5 variables ci-dessus pour
   *Production* **et** *Preview*.
4. **Deploy**.

La cible de build est détectée automatiquement (`VERCEL=1` → preset Nitro `vercel`).
Pour reproduire un build Vercel en local : `NITRO_PRESET=vercel npm run build`.

## 4. Réglages Supabase après le premier déploiement

Dans le tableau de bord Supabase → **Authentication → URL Configuration** :

- **Site URL** : `https://<votre-projet>.vercel.app`
- **Redirect URLs** : ajouter `https://<votre-projet>.vercel.app/**`
  (et l'URL du domaine personnalisé quand il est branché)

Sans cela, la confirmation d'email et les connexions échouent.

Si vous voulez ajouter **Google** comme méthode de connexion hors Lovable :
créer des identifiants OAuth chez Google Cloud, les coller dans
**Authentication → Providers → Google**, puis appeler
`supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
depuis la page `/auth`.

## 5. Vérifications après déploiement

- `/` — page d'accueil, image de couverture, 5 niveaux
- `/n/9eme/s/math/cours` — onglets T1/T2/T3 et documents
- `/n/bac/f/maths/s/math/devoirs` — onglets trimestre + créneaux C/S
- `/preview/<id>` — visionneuse PDF
- `/download/<id>` — captcha, compte à rebours, puis téléchargement
- `/auth` puis `/admin` — connexion admin, création/édition d'un document
- `/sitemap.xml`, `/robots.txt`, `/ads.txt`

## 6. Domaine et SEO

Une fois le domaine branché (Vercel → Settings → Domains), remplacer les URLs
absolues qui pointent encore vers l'ancien hébergement :

- `src/routes/__root.tsx` : `og:image`, `twitter:image`, JSON-LD (`url`, `target`)
- `src/routes/sitemap[.]xml.ts` : domaine de base
- `public/robots.txt` : ligne `Sitemap:`

## 7. À savoir

- **Administration de la base** : pour gérer la base depuis votre propre compte
  Supabase (SQL editor, réglages Auth, sauvegardes), il faut la réclamer /
  transférer depuis les réglages Cloud de l'éditeur Lovable. Le site sur Vercel
  fonctionne dans tous les cas.
- **Serveur MCP** (`/mcp`) : conservé, la dépendance s'installe normalement
  depuis npm. Pour le retirer, supprimer `src/routes/mcp.ts`, `src/routes/[.mcp]/`,
  `src/lib/mcp/`, le plugin `mcpPlugin()` dans `vite.config.ts` et la dépendance
  `@lovable.dev/mcp-js`.
- **Publicités / CMP / ads.txt** : fonctionnent à l'identique sur Vercel.
- **Sauvegarde** : pensez à activer les sauvegardes automatiques côté Supabase.
