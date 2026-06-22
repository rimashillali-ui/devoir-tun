# Devoiratouna — Plan d'implémentation

Plateforme éducative bilingue (AR/FR) avec navigation Niveau → Filière → Matière → Section, bibliothèque PDF, articles, pubs et panneau admin.

## Stack

- TanStack Start + Tailwind v4 + shadcn/ui
- Lovable Cloud (Postgres + Auth email/mdp)
- i18n maison FR/AR avec RTL
- Polices: Tajawal/Cairo (AR), Inter (FR) via `<link>` dans `__root.tsx`

## 1. Base de données (migration)

```text
documents(id, level, track?, subject, section, term?, exam_slot?,
          title_ar, title_fr, source_url, video_url?, created_at)
articles(id, level, track?, subject?, section,
         title_ar, title_fr?, content_html_ar, content_html_fr?, created_at)
ads(id, slot, provider, code_html?, image_url?, link_url?, enabled)
contact_messages(id, name, email, subject, message, created_at, read)
site_settings(key, value_json)
user_roles + app_role enum + has_role() + bootstrap_admin()
pages(slug, title_ar, title_fr, content_html_ar, content_html_fr)  -- privacy/terms/about
```

- RLS: SELECT public sur documents/articles/ads/pages/site_settings ; INSERT/UPDATE/DELETE admin uniquement
- `contact_messages` : INSERT public (anon), SELECT/UPDATE admin
- GRANT explicites pour `anon` et `authenticated`
- `video_url` ajouté à documents (YouTube) pour la section cours

## 2. Constantes pédagogiques

`src/lib/constants.ts` :

- `LEVELS` : 9eme, 1sec, 2sc, 3eme, bac
- `TRACKS_BY_LEVEL` : 3eme → [maths, info] ; bac → [maths, sciences, info, eco, tech]
- `SUBJECTS_BY_LEVEL_TRACK` map `${level}` ou `${level}:${track}` → matières
- `SECTIONS` : cours, series, devoirs, texte, conseils
- `ARABIC_ONLY_SECTIONS = {texte}`
- `TEXTE_ALLOWED_SUBJECTS = {arabe, francais}`
- `TERMS` + `getExamSlots(subject)` : math → C1,C2,S1 / C3,C4,S2 / C5,C6,S3 ; autres → C1,S1 / C3,S2 / C5,S3
- `AD_SLOTS` : header, footer, corner_{tl,tr,bl,br}, sidebar_{left,right}, inlist

## 3. Routes

```text
/                                        accueil (5 cartes niveaux)
/n/$level                                filières OU matières directes
/n/$level/f/$track                       matières filtrées
/n/$level/[f/$track]/$subject            5 sections (texte masqué selon matière)
/n/$level/[f/$track]/$subject/$section   docs/articles (devoirs = onglets T1/T2/T3 + slots)
/preview/$id                             aperçu iframe gview, bouton Télécharger
/download/$id                            compteur 15s + 8 slots pubs → lien raw
/article/$id                             article HTML (texte = AR forcé)
/contact                                 formulaire → contact_messages
/about, /privacy, /terms                 pages CMS (table pages)
/auth                                    email/mdp + bouton "Me promouvoir admin"
/admin                                   panneau (Documents, Articles, Pubs, Pages, Paramètres, Rôles, Messages)
```

Routes admin sous `_authenticated/` ; check rôle admin dans loader.

## 4. i18n

- `LanguageProvider` (context) + `localStorage:devoiratouna-lang`
- `dir="rtl"` sur `<html>` + `lang` dynamique
- Tous les textes dans `src/lib/translations.ts` (objets `ar` / `fr`)
- Section `texte` + articles `texte` : toujours rendus AR + RTL même en FR

## 5. Composants clés

- `<Navbar>` : logo, langues, lien admin si connecté
- `<Footer>` : liens légaux + contact
- `<LevelCard>`, `<TrackCard>`, `<SubjectCard>`, `<SectionCard>`
- `<DocCard>` : titre AR/FR + bouton Aperçu (+ badge vidéo si video_url)
- `<ArticleCard>`, `<ArticleView>`
- `<PdfViewer>` : iframe gview
- `<YoutubeEmbed>` : iframe youtube (cours avec video_url)
- `<AdSlot slot="...">` : rend code HTML (propellerads) ou bannière custom
- `<DownloadCountdown>` : 15s puis lien actif
- `<LangToggle>`, `<Spinner>`, `<GlassCard>`

## 6. Helpers URL

`src/lib/url-helpers.ts` :

- `toPreviewUrl(source)` : GitHub `/blob/` → `/raw/` → gview ; Drive `/file/d/ID/view` → `/preview` ; OneDrive embed
- `toDownloadUrl(source)` : raw direct
- `toYoutubeEmbed(url)` : watch?v=ID ou youtu.be/ID → embed

## 7. Panneau admin

Onglets via `<Tabs>` :

1. **Documents** : CRUD ; champs : niveau, filière (conditionnel), matière (filtrée), section, trimestre+slot (si devoirs), titres AR/FR, source_url, video_url (cours uniquement)
2. **Articles** : CRUD HTML AR + FR (FR désactivé si section=texte)
3. **Publicités** : 9 slots, provider code/custom, enable
4. **Pages** : édition privacy/terms/about (HTML AR+FR, titres)
5. **Paramètres** : site_settings (titre, description, bannière)
6. **Rôles** : promouvoir/révoquer
7. **Messages** : liste contact_messages, marquer lu

Toutes écritures via `createServerFn` + `requireSupabaseAuth` + check `has_role(uid,'admin')`.

## 8. Pubs

`<AdSlot>` lit la table ads filtrée par slot+enabled, rend :

- `adverseur` → `dangerouslySetInnerHTML`
- `custom` → `<a><img></a>`
- Lazy loading sur images

Pages `/preview` : sidebars uniquement. Page `/download` : tous les 8 slots.

## 9. SEO

- `head()` par route, titres/desc bilingues selon langue active
- H1 unique, alt images
- JSON-LD `EducationalOrganization` sur `/`
- `robots.txt` + `sitemap.xml` statiques

## 10. Étapes d'exécution

1. Activer Lovable Cloud
2. Migration SQL : tables + RLS + GRANT + `has_role` + `bootstrap_admin` + trigger profile
3. `constants.ts` + `translations.ts` + `LanguageProvider` + fonts dans `__root.tsx`
4. Helpers URL
5. Routes publiques (accueil → niveau → filière → matière → section → docs)
6. `/preview/$id` + `/download/$id` avec compteur
7. `/article/$id` + `/contact` + pages CMS (about/privacy/terms)
8. `/auth` + bootstrap admin
9. `/admin` avec tous les onglets (server functions sécurisées)
10. `<AdSlot>` + intégrations
11. SEO + sitemap + robots
12. Tests parcours : 9ème, 3ème/info, bac/eco, FR↔AR, texte AR forcé, preview, download

## Détails techniques

- Tous les composants protégés admin sous `src/routes/_authenticated/` (layout géré par l'intégration Supabase)
- Vidéos YouTube : `<YoutubeEmbed>` affiché en haut de `/preview/$id` si `video_url` présent, sinon iframe PDF seul
- Section `cours` admin : champ `video_url` optionnel à côté de `source_url`
- Pages légales (privacy/terms/about) : table `pages` éditable depuis admin, route dynamique `/page/$slug` ou routes dédiées qui lisent par slug
- Email admin par défaut : `latifa.azikou@gmail.com` (auto-promu via trigger sur signup)

## Questions

1. Email admin confirmé : `latifa.azikou@gmail.com` ? oui
2. Compteur 15s : configurable depuis admin (table site_settings) ou fixe ? oui configurable
3. Données seed : démarrer avec base vide ou quelques documents/articles d'exemple ?démare avec d'exemple  
