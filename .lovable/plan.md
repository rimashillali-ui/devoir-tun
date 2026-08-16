# Migration du projet vers Vercel + Supabase (base actuelle conservée)

Objectif : héberger Devoiratouna sur Vercel, en développant depuis GitHub/local, tout en gardant **la base de données actuelle** (documents, articles, quiz, comptes, rôles) — aucune donnée déplacée.

## Ce que je change dans le code

### 1. Cible de build Vercel
Aujourd'hui le build est produit pour Cloudflare Workers. Je passe la cible du build sur Vercel dans `vite.config.ts` (preset nitro `vercel`) et j'ajoute un `vercel.json` minimal. Le point d'entrée serveur `src/server.ts` (wrapper d'erreurs SSR) reste inchangé et fonctionne tel quel.

### 2. Suppression de la dépendance à la clé service-role
C'est le point le plus important : les fonctions admin (`src/lib/admin.functions.ts`, `quiz-admin.functions.ts`) utilisent aujourd'hui un client « service-role » dont la clé est fournie automatiquement par l'hébergement actuel et **n'est pas récupérable**. Hors de Lovable, ces fonctions échoueraient.

Je les réécris pour agir **au nom de l'administrateur connecté** :
- `assertAdmin` interroge `user_roles` via le client authentifié (`requireSupabaseAuth`) au lieu du service-role
- toutes les écritures (documents, articles, pubs, pages, paramètres, quiz) passent par ce client — elles sont déjà autorisées par les policies RLS `has_role(auth.uid(),'admin')`
- `listMessages` / `markMessageRead` : mêmes policies admin existantes, donc OK
- `promoteByEmail` / `revokeAdmin` / `bootstrapAdmin` : `user_roles` étant verrouillé en écriture côté client, j'ajoute des fonctions SQL `SECURITY DEFINER` (`admin_promote_by_email`, `admin_revoke_admin`) réservées aux admins, appelées en RPC. Aucune clé secrète nécessaire.

### 3. Nettoyage des dépendances propres à l'éditeur
Je retire ce qui n'a de sens que dans Lovable et qui casserait un build local :
- la config de build Lovable remplacée par une configuration Vite/TanStack Start standard équivalente (plugins tanstackStart, react, tailwind, tsconfig-paths, alias `@`, nitro)
- le serveur MCP (`/mcp`) et son plugin Vite : à supprimer ou à conserver ? (voir Question ci-dessous)
- `src/lib/lovable-error-reporting.ts` réduit à un no-op côté client

### 4. Variables d'environnement
Je crée un `.env.example` documentant exactement les variables à saisir dans Vercel :
```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_URL=...              (même valeur, côté serveur)
SUPABASE_PUBLISHABLE_KEY=...  (même valeur, côté serveur)
```
Ces valeurs sont celles déjà utilisées par le site — je te les donnerai à la fin (ce sont des clés publiques, sans risque).

### 5. README de déploiement
Un `DEPLOY.md` avec la procédure pas à pas :
1. Exporter le projet vers GitHub depuis l'éditeur (bouton GitHub), puis `git clone` + `npm install` + `npm run dev`
2. Importer le dépôt dans Vercel — Framework « Other », build `npm run build`, output détecté automatiquement
3. Saisir les 5 variables d'environnement (Production + Preview)
4. Dans le tableau de bord Supabase : ajouter l'URL Vercel (`https://<projet>.vercel.app`) dans **Authentication → URL Configuration → Site URL + Redirect URLs**, sinon la connexion Google casse
5. Vérifier `/`, `/n/9eme/s/math/cours`, `/preview/:id`, `/download/:id`, `/auth`, `/admin`
6. Brancher le domaine personnalisé, puis mettre à jour `robots.txt`, le `sitemap.xml` et les URLs absolues SEO (`og:image`, JSON-LD) qui pointent encore vers `devoir-tun.lovable.app`

## Points d'attention

- **Accès à la base** : ta base reste hébergée là où elle est. Pour la piloter depuis un tableau de bord Supabase à toi (SQL editor, Auth settings, sauvegardes), il faut la **réclamer/transférer** vers ton propre compte Supabase depuis les paramètres Cloud de l'éditeur. Sans ça, tu gardes le site sur Vercel mais l'administration de la base reste dans l'éditeur.
- **Aucune perte** : ni les documents, ni les quiz, ni les comptes Google, ni les rôles admin ne bougent.
- **Google OAuth** : le bouton passe aujourd'hui par un intermédiaire Lovable. Hors Lovable, je le remplace par `supabase.auth.signInWithOAuth('google', { redirectTo: window.location.origin })` — il faudra créer tes propres identifiants Google OAuth et les coller dans les réglages Auth Supabase.
- **Publicités / ads.txt / CMP** : inchangés, ils fonctionnent identiquement sur Vercel.

## Question avant de commencer

Le serveur MCP (`/mcp`, les 3 outils de recherche pour agents IA) dépend d'un paquet propre à Lovable. Je le **retire** du build Vercel par défaut ; dis-moi si tu veux au contraire que je le conserve.
