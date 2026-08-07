# Devoiratouna — Spécification complète A→Z (état réel du site)

Document de référence exhaustif permettant à une autre IA de reconstruire ce site à l'identique.

## 1. Identité du produit

- Nom : **Devoiratouna** / **دوفواراتنا**
- Plateforme éducative tunisienne gratuite : documents PDF (cours, séries, devoirs), articles (شرح نص, conseils), quiz interactifs.
- Public : 9ème année de base → Baccalauréat. Accès **totalement public**, sans inscription obligatoire.
- Contact : `anis.hilali10@gmail.com`. Admin unique : `latifa.azikou@gmail.com`.
- URL publiée : `https://devoir-tun.lovable.app` (déployable aussi via Cloudflare, la base reste la même).

## 2. Stack technique

- TanStack Start v1 (React 19, Vite), routing fichiers dans `src/routes/`
- Tailwind CSS v4 via `src/styles.css` (`@theme`, tokens OKLCH) + shadcn/ui + lucide-react
- TanStack Query, sonner (toasts), @dnd-kit (drag & drop admin), zod
- Backend Lovable Cloud (Supabase managé) : Postgres + Auth + RLS
- Écritures serveur via `createServerFn` (jamais d'edge functions Supabase)
- Serveur MCP intégré (`@lovable.dev/mcp-js`)

## 3. Design system

- Thème sombre cosmique unique (`class="dark"` sur `<html>`), fond `#020617`
- Tokens `:root` en OKLCH : background `oklch(0.13 0.04 265)`, primary cyan `oklch(0.7 0.18 200)`, card semi-transparente
- Accents : `--accent-emerald`, `--accent-indigo`, `--accent-cyan`, `--accent-rose`, `--accent-amber`
- Classes utilitaires maison : `.glass` (verre flouté + bordure subtile), `.glass-hover` (translation au survol), `.prose-ar`
- Polices via `<link>` dans `__root.tsx` : Inter (latin), Tajawal + Cairo (arabe). `--font-sans`, `--font-arabic`, `--font-display`
- Optimisation mobile : `backdrop-filter` et transitions lourdes désactivés sous 768px
- Titres très gras (`font-extrabold`), dégradés `from-cyan via-indigo to-emerald` sur le H1 d'accueil

## 4. Bilinguisme (FR par défaut)

- `src/lib/i18n.tsx` : `LanguageProvider` + `useLang()` → `{ lang, dir, t, setLang, toggle }`
- Langue par défaut **`fr`** ; persistance `localStorage["devoiratouna-lang"]`
- Effet : `document.documentElement.lang` + `dir` (`rtl` si `ar`)
- `pickTitle(lang, ar, fr)` : en `ar` retourne l'arabe ; en `fr` retourne le français sinon repli sur l'arabe
- Tous les libellés dans `src/lib/translations.ts` (objets `ar` et `fr` avec sous-maps `levels`, `tracks`, `subjects`, `sections`, `terms`)
- **Règle métre** : la section `texte` (شرح نص) est **toujours rendue en arabe + RTL**, même en mode français

## 5. Modèle pédagogique (`src/lib/constants.ts`)

```text
LEVELS = ["9eme", "1sec", "2sc", "3eme", "bac"]

TRACKS_BY_LEVEL
  9eme, 1sec, 2sc : aucune filière (matières directes)
  3eme            : maths, sciences, info
  bac             : maths, sciences, info, eco, tech

BAC_COMMON = math, physique, svt, francais, arabe, anglais, philo,
             histoire-geo, education-islamique, informatique

SUBJECTS_BY_LEVEL_TRACK (clé = level ou level:track)
  9eme          : math, svt, francais, arabe, anglais
  1sec          : math, svt, physique, francais, arabe
  2sc           : math, physique, svt, francais
  3eme:maths    : math, physique, svt, francais
  3eme:sciences : math, physique, svt, francais
  3eme:info     : math, physique, sti, algo, francais
  bac:maths     : BAC_COMMON sans histoire-geo
  bac:sciences  : BAC_COMMON sans histoire-geo
  bac:info      : BAC_COMMON sans histoire-geo + algo, sti
  bac:eco       : BAC_COMMON + economie, gestion
  bac:tech      : BAC_COMMON sans histoire-geo + electrique, mecanique

SECTIONS = cours, series, devoirs, texte, conseils
ARTICLE_SECTIONS      = { texte, conseils }   → lues dans la table articles
ARABIC_ONLY_SECTIONS  = { texte }             → forcé RTL/AR
TEXTE_ALLOWED_SUBJECTS = { arabe, francais }
TERMS = T1, T2, T3
AD_SLOTS = header, footer, corner_tl, corner_tr, corner_bl, corner_br,
           sidebar_left, sidebar_right, inlist
LEVEL_ACCENT = 9eme→emerald, 1sec→indigo, 2sc→cyan, 3eme→rose, bac→amber
```

### Créneaux d'examens — `getExamSlots(subject, term, level)`

| Cas | T1 | T2 | T3 |
| --- | --- | --- | --- |
| math, niveaux 9eme/1sec/2sc | C1, C2, S1 | C3, C4, S2 | C5, C6, S3 |
| math, niveaux 3eme/bac | C1, S1 | C2, S2 | C3, S3 |
| toute autre matière | C1, S1 | C3, S2 | C5, S3 |

## 6. Base de données

```text
documents(id uuid pk, level, track?, subject, section, term?, exam_slot?,
          title_ar, title_fr, subtitle_ar?, subtitle_fr?,
          source_url, video_url?, sort_order int default 0,
          created_at, updated_at)
articles(id uuid pk, level?, track?, subject?, section,
         title_ar, title_fr?, subtitle_ar?, subtitle_fr?,
         content_html_ar, content_html_fr?, created_at, updated_at)
ads(id uuid pk, slot, provider default 'custom', code_html?, image_url?,
    link_url?, enabled bool default false, updated_at)
pages(slug pk, title_ar, title_fr, content_html_ar, content_html_fr, updated_at)
site_settings(key pk, value_json jsonb, updated_at)
contact_messages(id uuid pk, name, email, subject?, message, read bool, created_at)
quiz_questions(id uuid pk, level, subject, question_ar, choices jsonb,
               correct_index int, explanation_ar?, sort_order int,
               created_at, updated_at)
profiles(id uuid pk → auth.users, email, created_at)
user_roles(id uuid pk, user_id → auth.users, role app_role, unique(user_id, role))
enum app_role = admin | user
```

### Fonctions & triggers

- `has_role(_user_id uuid, _role app_role) → boolean` — SQL, STABLE, SECURITY DEFINER, `search_path=public`. `EXECUTE` accordé à `authenticated` (nécessaire aux policies RLS côté client), révoqué de `public`/`anon`.
- `bootstrap_admin() → boolean` — promeut l'appelant admin **uniquement s'il n'existe aucun admin**. EXECUTE révoqué du public ; appelé via server fn.
- `handle_new_user()` — trigger `AFTER INSERT ON auth.users` : crée le `profiles` et auto-promeut `latifa.azikou@gmail.com` admin.
- `update_updated_at_column()` — trigger BEFORE UPDATE sur `quiz_questions`.

### RLS (toutes les tables activées, GRANT explicites)

| Table | Lecture | Écriture |
| --- | --- | --- |
| documents, articles, ads, pages | `SELECT` public (anon + authenticated) | ALL si `has_role(auth.uid(),'admin')` |
| quiz_questions | `SELECT` public | INSERT/UPDATE/DELETE admin |
| site_settings | `SELECT` public **restreint aux clés** `countdown_seconds`, `banner` | ALL admin |
| contact_messages | `SELECT` admin uniquement | `INSERT` public avec contraintes de longueur (name 1-200, email 3-200, message 1-5000, `read=false`) ; UPDATE/DELETE admin |
| profiles | `SELECT` soi-même (`auth.uid()=id`), révoqué de anon | aucune écriture client |
| user_roles | `SELECT` soi-même | policies **RESTRICTIVE deny** sur INSERT/UPDATE/DELETE (écriture service_role uniquement) |

## 7. Arborescence des routes

```text
src/routes/
  __root.tsx                                shell : html/head, CMP, JSON-LD, Navbar, Footer, Toaster, CookieBanner
  index.tsx                                 / : cover, logo, H1, 5 cartes de niveau
  n.$level.tsx                              layout (<Outlet/>)
  n.$level.index.tsx                        /n/:level → filières si existantes, sinon matières
  n.$level.f.$track.tsx                     layout
  n.$level.f.$track.index.tsx               /n/:level/f/:track → matières de la filière
  n.$level.s.$subject.tsx                   layout
  n.$level.s.$subject.index.tsx             /n/:level/s/:subject → grille des sections
  n.$level.s.$subject.$section.tsx          /n/:level/s/:subject/:section → contenus
  n.$level.f.$track.s.$subject(.tsx/.index/.$section)   mêmes écrans avec filière
  preview.$id.tsx                           /preview/:id → visionneuse + bouton Télécharger
  download.$id.tsx                          /download/:id → captcha + compte à rebours
  article.$id.tsx                           /article/:id → HTML de l'article + JSON-LD Article
  quiz.$level.$subject.tsx                  /quiz/:level/:subject
  auth.tsx                                  /auth
  admin.tsx                                 /admin
  about.tsx  privacy.tsx  terms.tsx         pages CMS (table pages)
  contact.tsx                               formulaire → contact_messages
  sitemap[.]xml.ts                          /sitemap.xml dynamique
  ads[.]txt.ts                              /ads.txt (fusion TheMoneytizer)
  api.public.documents.$id.preview.ts       proxy aperçu
  api.public.documents.$id.download.ts      proxy téléchargement (Content-Disposition: attachment)
  mcp.ts, [.mcp]/list-tools.ts, [.mcp]/invoke-tool/$tool.ts, [.well-known]/oauth-protected-resource.ts
```

Règle structurelle importante : chaque segment parent est un **layout qui rend `<Outlet/>`**, son contenu vit dans le `*.index.tsx` frère. Sans cela les pages enfants restent vides.

## 8. Comportements par écran

### Accueil `/`
Image `/cover.png`, logo `/logo.png`, H1 dégradé bilingue, 5 cartes `glass glass-hover` (icône lucide + accent par niveau) → `/n/$level`.

### Navigation pédagogique
`/n/:level` affiche les filières si `getTracks(level).length > 0`, sinon les matières. Puis grille des 5 sections (`SectionGrid`), avec `texte` masqué si la matière n'est pas dans `TEXTE_ALLOWED_SUBJECTS`.

### Liste de contenus — `SectionContent.tsx`
- Requête client Supabase filtrée sur level/subject/section (+ `track` égal ou `is null`)
- Tri : `sort_order` croissant puis `created_at` décroissant
- `cours` / `series` / `texte` : **ordre manuel** (`sort_order` respecté tel quel), affichés en onglets T1/T2/T3
- `devoirs` : onglets T1/T2/T3, puis sous-titres par créneau (`getExamSlots`), tri alphanumérique naturel (`localeCompare` avec `numeric: true`)
- `texte` / `conseils` : lus dans `articles` et rendus via `ArticleList`
- Cartes document : titre + sous-titre bilingues, badge vidéo si `video_url`, bouton **Aperçu** → `/preview/:id`
- Slots pubs `header` en haut, `footer` en bas

### Aperçu `/preview/:id`
Loader Supabase (404 si absent). `YoutubeEmbed` en haut si `video_url`, puis `PdfViewer` en iframe. URL calculée par `toPreviewUrl` : Google Drive → `/preview`, sinon **Google Docs Viewer** `docs.google.com/gview?url=...&embedded=true` sur l'URL raw. Bouton Télécharger → `/download/:id`. Pubs sidebars.

### Téléchargement `/download/:id`
`DownloadCountdown` :
1. **Captcha maison** : addition aléatoire à résoudre (obligatoire pour tous)
2. Compte à rebours (défaut 15 s, valeur lue depuis `site_settings.countdown_seconds`) — **sauté si l'utilisateur est connecté**
3. Seulement ensuite, appel de la server fn `getDownloadUrl` qui retourne `/api/public/documents/:id/download` ; l'URL réelle n'est **jamais** dans le HTML initial ni dans l'état client avant validation
4. Le proxy serveur streame le fichier avec `Content-Disposition: attachment` (fonctionne pour raw.githack.com, GitHub raw, etc.)
5. Les 8 slots publicitaires sont rendus sur cette page + JSON-LD `LearningResource`

### Helpers URL — `src/lib/url-helpers.ts`
- `toRawUrl` : `github.com/.../blob/...` et `/raw/...` → `raw.githubusercontent.com`
- `toPreviewUrl` : Drive → `/file/d/ID/preview` ; défaut → Google Docs Viewer
- `toDownloadUrl` : Drive → `uc?export=download&id=ID` ; défaut → raw
- `toYoutubeEmbed` : `youtu.be/ID`, `?v=ID`, `/embed/ID` → URL embed
- Aucune logique SharePoint (volontairement retirée)

### Authentification `/auth`
Email + mot de passe et Google OAuth via `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`. Pas d'inscription anonyme. Si l'utilisateur est admin → bouton vers `/admin` ; sinon message « pas de droits ». Bouton « Me promouvoir admin » visible seulement si `hasAnyAdmin()` est faux.

### Quiz `/quiz/:level/:subject`
Accessible depuis le **menu latéral** (`UserSidebar`, sheet à gauche) visible pour tout utilisateur connecté. Combinaisons : `9eme`, `1sec`, `2sc`, `3eme-maths`, `bac-maths`, `bac-sciences` × `math`, `svt`. Les questions sont lues dans `quiz_questions` et rendues en quiz interactif RTL avec score et explication ; repli sur le HTML statique de `src/lib/quizzes.ts` (`QUIZZES`, iframe sandbox) si aucune question en base.

## 9. Panneau admin `/admin`

Garde : vérification client de la session + du rôle admin (`user_roles`), déconnexion/redirection sinon. Onglets shadcn `Tabs` :

1. **Documents** — CRUD, recherche plein texte, sélecteurs conditionnels (filière si le niveau en a, matières filtrées, trimestre pour cours/séries/devoirs, créneau pour devoirs), `video_url` pour cours, `sort_order`, bouton **générateur de titre** (`generateDevoirTitle` → « Devoir de contrôle n°Y-X en <matière> pour <niveau> (<filière>) » / équivalent arabe), bouton **Réorganiser (souris)** ouvrant `ReorderPanel` (dnd-kit, sauvegarde en masse via `reorderDocuments`)
2. **Articles** — CRUD HTML AR + FR (FR désactivé si `section = texte`)
3. **Publicités** — 9 slots, provider `code`/`custom`, activation
4. **Pages** — édition de `about`, `privacy`, `terms` (titres + HTML AR/FR)
5. **Paramètres** — `site_settings` : `countdown_seconds`, `banner` (bannière haut de site AR/FR)
6. **Rôles** — lister, promouvoir par email, révoquer
7. **Messages** — liste `contact_messages`, marquer comme lu
8. **Quiz** — choix niveau + matière, ajout/édition/suppression/recherche de questions (question AR, 2 à 8 choix, index correct, explication AR, ordre)

### Server functions (`src/lib/admin.functions.ts`, `quiz-admin.functions.ts`)
`saveDocument`, `deleteDocument`, `reorderDocuments`, `saveArticle`, `deleteArticle`, `saveAd`, `savePage`, `saveSetting`, `sendContact`, `listMessages`, `markMessageRead`, `listAdmins`, `promoteByEmail`, `revokeAdmin`, `hasAnyAdmin`, `bootstrapAdmin`, `saveQuizQuestion`, `deleteQuizQuestion`.
Toutes protégées par `requireSupabaseAuth` + `assertAdmin` (vérification du rôle via le client service-role importé dynamiquement dans le handler). `sendContact` est la seule publique.

## 10. Publicités & CMP

- `<AdSlot slot="…">` lit `ads` (slot + `enabled=true`) et rend soit `code_html` (`dangerouslySetInnerHTML`), soit une bannière `<a><img loading="lazy"></a>`
- Script CMP InMobi Choice inliné dans le `<head>` de `__root.tsx` (stub `__tcfapi` + `__uspapi`)
- `CookieBanner.tsx` : bandeau maison affiché à tous les visiteurs au premier passage (l'InMobi ne s'affiche qu'en UE), état en `localStorage`
- `/ads.txt` : route serveur qui récupère et fusionne les entrées TheMoneytizer, servie en `text/plain`

## 11. SEO

- `head()` par route : titre, description, `og:title`, `og:description`, canonical ; `og:image`/`twitter:image` absolus uniquement où pertinent
- JSON-LD : `EducationalOrganization` + `SearchAction` dans `__root.tsx`, `Article` sur `/article/:id`, `LearningResource` sur `/download/:id`
- `/sitemap.xml` **dynamique** (URLs absolues, toutes les pages statiques + documents + articles, exclut `/admin` et `/auth`)
- `public/robots.txt` pointe vers le sitemap ; `public/google2deedbc8869840c2.html` pour la validation Search Console
- Un seul H1 par page, `alt` sur toutes les images, polices préchargées (`preload as=style`, poids limités) pour le LCP

## 12. Serveur MCP

Exposé sur `/mcp` (+ `/.mcp/list-tools`, `/.mcp/invoke-tool/:tool`, `/.well-known/oauth-protected-resource`) avec trois outils en lecture seule : `search_documents`, `get_document`, `search_articles` (`src/lib/mcp/`).

## 13. Ordre de reconstruction recommandé

1. Activer Lovable Cloud, appliquer la migration (tables + GRANT + RLS + fonctions + triggers)
2. `constants.ts`, `translations.ts`, `i18n.tsx`, tokens `styles.css`, polices dans `__root.tsx`
3. `url-helpers.ts`, `title-generator.ts`
4. Layouts + index des routes pédagogiques, `SectionGrid`, `SectionContent`
5. `preview/$id`, `download/$id` (+ proxies `api.public.documents.*`), `article/$id`
6. `auth`, `admin` et les server functions sécurisées
7. Pages CMS, contact, `AdSlot`, CMP + CookieBanner
8. Quiz (table + admin + route), MCP
9. SEO : head par route, JSON-LD, sitemap dynamique, robots
10. Tests de parcours : 9ème direct, 3ème/info, bac/eco, bascule FR↔AR, `texte` forcé AR, aperçu Drive & GitHub, téléchargement invité (captcha + 15 s) vs connecté (captcha seul)
