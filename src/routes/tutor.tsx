import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { supabase } from "@/integrations/supabase/client";
import { askTutor } from "@/lib/tutor.functions";
import { LEVELS } from "@/lib/constants";
import {
  readShortDoc,
  isSupportedDoc,
  MAX_PAGES,
  MAX_SIZE_BYTES,
  type ShortDocResult,
  type ShortDocProgress,
} from "@/lib/short-doc";
import {
  loadAttachments,
  saveAttachment,
  dropAttachments,
  purgeExpiredAttachments,
  loadDraft,
  saveDraft,
  clearDraft,
  retentionCutoffIso,
  TUTOR_RETENTION_DAYS,
} from "@/lib/tutor-store";


import { subjectsForLevelTrack, subjectLabel, tracksForLevel, trackLabel } from "@/lib/tutor-meta";
import { BackButton } from "@/components/BackButton";
import {
  Sparkles,
  Send,
  Loader2,
  Plus,
  GraduationCap,
  LogIn,
  Wifi,
  ImagePlus,
  X,
  Trash2,
  MessageSquare,
  ImageIcon,
  Cpu,
  FileText,

} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "Tuteur IA — Révisions tous niveaux | Devoiratouna" },
      {
        name: "description",
        content:
          "Assistant pédagogique IA pour les élèves tunisiens, de la 9ème année au Baccalauréat : révise pas à pas, envoie une photo d'exercice et retrouve ton historique.",
      },
      { property: "og:title", content: "Tuteur IA — Révisions tous niveaux | Devoiratouna" },
      {
        property: "og:description",
        content: "Un professeur virtuel qui te guide étape par étape, selon le programme tunisien.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/tutor" }],
  }),
  component: TutorPage,
});

type Msg = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  model?: string | null;
  book?: { name: string; pages: number; text: string };
};


/** Nom lisible du modèle affiché sous chaque réponse. */
function modelLabel(model?: string | null) {
  if (!model) return null;
  const short = model.split("/").pop() ?? model;
  return short.replace(/-instruct$/i, "");
}
type Conversation = { id: string; title: string; level: string; updated_at: string };

const LEVEL_LABELS: Record<string, string> = {
  "9eme": "9ème année de base",
  "1sec": "1ère année secondaire",
  "2sc": "2ème année secondaire",
  "3eme": "3ème année secondaire",
  bac: "Baccalauréat",
};

const LEVEL_DESC: Record<string, string> = {
  "9eme": "Bases simples et exemples concrets",
  "1sec": "Consolidation des acquis du collège",
  "2sc": "Rigueur des démonstrations",
  "3eme": "Préparation progressive au Bac",
  bac: "Rigueur de l'examen national",
};

/**
 * Normalise le LaTeX renvoyé par les différents modèles pour un rendu KaTeX
 * fiable : délimiteurs \( \) et \[ \], blocs ```math / ```latex, environnements
 * nus (align, equation…) et $$ collés au texte.
 */
function normalizeMath(text: string) {
  let out = text;

  // Blocs de code annoncés comme mathématiques → maths en bloc.
  out = out.replace(/```(?:math|latex|tex)\s*\n([\s\S]*?)```/gi, (_m, x) => `\n$$\n${String(x).trim()}\n$$\n`);

  // Délimiteurs LaTeX classiques.
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_m, x) => `\n$$\n${String(x).trim()}\n$$\n`);
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_m, x) => `$${String(x).trim()}$`);

  // Environnements mathématiques non entourés de $$.
  out = out.replace(
    /(^|\n)[ \t]*(\\begin\{(?:align|align\*|aligned|equation|equation\*|gather|gather\*|cases|array|pmatrix|bmatrix|vmatrix|matrix)\}[\s\S]*?\\end\{[a-z*]+\})/gi,
    (_m, pre, body) => `${pre}\n$$\n${String(body).trim()}\n$$\n`,
  );

  // $$ collés au texte → sur leur propre ligne (sinon KaTeX ne détecte rien).
  out = out.replace(/([^\n$])\$\$/g, "$1\n$$").replace(/\$\$([^\n$])/g, "$$\n$1");

  // Espaces insécables et symboles souvent mal échappés dans les formules.
  out = out.replace(/\u00a0/g, " ");

  return out;
}

const KATEX_OPTIONS = {
  throwOnError: false,
  strict: false as const,
  trust: false,
  output: "htmlAndMathml" as const,
  macros: {
    "\\R": "\\mathbb{R}",
    "\\N": "\\mathbb{N}",
    "\\Z": "\\mathbb{Z}",
    "\\Q": "\\mathbb{Q}",
    "\\C": "\\mathbb{C}",
    "\\vect": "\\overrightarrow{#1}",
    "\\diff": "\\mathrm{d}",
  },
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("Lecture impossible"));
    fr.readAsDataURL(file);
  });
}

/** Réduit la photo (max 1400 px, JPEG) pour un envoi rapide et fiable à l'IA. */
async function compressImage(file: File) {
  const dataUrl = await fileToDataUrl(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image"));
      el.src = dataUrl;
    });
    const max = 1400;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL("image/jpeg", 0.82);
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}


function Bubble({ m }: { m: Msg }) {
  const mine = m.role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 break-words text-sm leading-relaxed ${
          mine
            ? "bg-cyan text-background font-medium rounded-br-sm"
            : "glass border border-white/10 rounded-bl-sm"
        }`}
      >
        {m.book && (
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold">
            <FileText className="h-3.5 w-3.5" /> {m.book.name} · {m.book.pages} page(s)
          </p>
        )}
        {m.images && m.images.length > 0 && (

          <div className="flex flex-wrap gap-2 mb-2">
            {m.images.map((src, i) => (
              <img key={i} src={src} alt="Pièce jointe" className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-lg" />
            ))}
          </div>
        )}
        {mine ? (
          <p className="whitespace-pre-wrap">{m.content}</p>
        ) : (
          <div className="tutor-math prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-pre:bg-black/40">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}>
              {normalizeMath(m.content)}
            </ReactMarkdown>
          </div>
        )}
        {!mine && modelLabel(m.model) && (
          <p className="mt-2 pt-2 border-t border-white/10 text-[11px] text-muted-foreground flex items-center gap-1">
            <Cpu className="h-3 w-3" /> Modèle : {modelLabel(m.model)}
          </p>
        )}
      </div>
    </div>
  );
}

function TutorPage() {
  const run = useServerFn(askTutor);
  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("");
  const [track, setTrack] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [book, setBook] = useState<ShortDocResult | null>(null);
  const [reading, setReading] = useState<ShortDocProgress | null>(null);

  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLInputElement>(null);
  const draftLoaded = useRef(false);


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthState(data.user ? "in" : "out");
      setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthState(s?.user ? "in" : "out");
      setUserId(s?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadConvs = useCallback(async () => {
    // Rétention : l'historique de plus de 30 jours est supprimé automatiquement.
    const cutoff = retentionCutoffIso();
    const { data: stale } = await supabase
      .from("tutor_conversations")
      .select("id")
      .lt("updated_at", cutoff);
    if (stale && stale.length > 0) {
      await supabase.from("tutor_conversations").delete().lt("updated_at", cutoff);
      for (const row of stale) dropAttachments(row.id);
    }
    purgeExpiredAttachments();

    const { data } = await supabase
      .from("tutor_conversations")
      .select("id, title, level, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    setConvs(data ?? []);
  }, []);

  useEffect(() => {
    if (authState === "in") void loadConvs();
  }, [authState, loadConvs]);

  // Restaure le brouillon (texte + pièces jointes non envoyées) après un retour sur le site.
  useEffect(() => {
    if (authState !== "in" || draftLoaded.current) return;
    draftLoaded.current = true;
    const draft = loadDraft();
    if (!draft) return;
    setInput(draft.text);
    setImages(draft.images);
    if (draft.book)
      setBook({ ...draft.book, images: [], truncatedPages: 0 } as unknown as ShortDocResult);
  }, [authState]);

  useEffect(() => {
    if (!draftLoaded.current) return;
    saveDraft({
      text: input,
      images,
      book: book ? { name: book.name, pages: book.pages, text: book.text } : null,
      convId,
    });
  }, [input, images, book, convId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function openConv(c: Conversation) {
    setLoadingConv(true);
    setConvId(c.id);
    setLevel(c.level);
    const { data } = await supabase
      .from("tutor_messages")
      .select("role, content, model")
      .eq("conversation_id", c.id)
      .order("created_at", { ascending: true });
    const att = loadAttachments(c.id);
    setMessages(
      (data ?? []).map((m, i) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
        model: m.model,
        ...(att[String(i)]?.images?.length ? { images: att[String(i)]!.images } : {}),
        ...(att[String(i)]?.book ? { book: att[String(i)]!.book! } : {}),
      })),
    );
    setLoadingConv(false);
  }

  async function removeConv(id: string) {
    await supabase.from("tutor_conversations").delete().eq("id", id);
    dropAttachments(id);
    if (convId === id) {
      setConvId(null);
      setMessages([]);
    }
    void loadConvs();
  }

  function newChat() {
    setConvId(null);
    setMessages([]);
    setImages([]);
    setBook(null);
    setInput("");
    clearDraft();
  }

  async function pickImages(files: FileList | null) {
    if (!files) return;
    const picked: string[] = [];
    for (const file of Array.from(files).slice(0, 3)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 4 Mo`);
        continue;
      }
      picked.push(await compressImage(file));
    }
    setImages((prev) => [...prev, ...picked].slice(0, 3));
    if (fileRef.current) fileRef.current.value = "";
  }

  /** Lit un document COURT (PDF de quelques pages ou Word) joint par l'élève. */
  async function pickBook(file: File | null) {
    if (bookRef.current) bookRef.current.value = "";
    if (!file) return;
    if (!isSupportedDoc(file)) {
      toast.error("Formats acceptés : PDF, DOCX (ou une photo).");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Ce document dépasse 8 Mo. Envoie un extrait plus court.");
      return;
    }
    setReading({ page: 0, total: 0 });
    try {
      const result = await readShortDoc(file, (p) => setReading(p));
      if (!result.text && result.images.length === 0) {
        toast.error("Impossible de lire ce document (aucun texte exploitable).");
        return;
      }
      setBook(result);
      toast.success(
        result.truncatedPages > 0
          ? `Document lu : ${result.pages} premières pages (limite ${MAX_PAGES})`
          : `Document lu : ${result.pages} page(s)`,
      );
    } catch (err) {
      toast.error(
        (err as Error).message === "doc-legacy"
          ? "Les anciens fichiers .doc ne sont pas lisibles : convertis-le en .docx ou en PDF."
          : "Lecture du document impossible.",
      );
    } finally {
      setReading(null);
    }
  }


  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && images.length === 0 && !book) || busy || !level || !userId) return;
    const bookImages = book?.images ?? [];
    const allImages = [...images, ...bookImages].slice(0, 12);
    const userMsg: Msg = {
      role: "user",
      content: text,
      images: allImages.length ? allImages : undefined,
      book: book ? { name: book.name, pages: book.pages, text: book.text } : undefined,
    };
    const history = [...messages, userMsg];
    const userIndex = history.length - 1;
    setMessages(history);
    setInput("");
    setImages([]);
    setBook(null);
    clearDraft();


    setBusy(true);
    const notice = setTimeout(() => setSwitching(true), 6000);
    try {
      let cid = convId;
      if (!cid) {
        const { data: created, error } = await supabase
          .from("tutor_conversations")
          .insert({
            user_id: userId,
            level,
            title: (text || userMsg.book?.name || "Photo d'exercice").slice(0, 60),
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        cid = created.id;
        setConvId(cid);
      }
      await supabase.from("tutor_messages").insert({
        conversation_id: cid,
        user_id: userId,
        role: "user",
        content: text,
        image_count: userMsg.images?.length ?? 0,
      });

      // Conserve localement les pièces jointes pour les retrouver au retour.
      saveAttachment(cid, userIndex, {
        images: userMsg.images,
        book: userMsg.book ?? null,
      });


      const res = await run({ data: { level, subject, track, messages: history } });
      if (res.fellBack) setSwitching(true);
      setMessages([...history, { role: "assistant", content: res.content, model: res.model }]);

      await supabase.from("tutor_messages").insert({
        conversation_id: cid,
        user_id: userId,
        role: "assistant",
        content: res.content,
        model: res.model,
      });
      await supabase
        .from("tutor_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", cid);
      void loadConvs();
    } catch (err: any) {
      toast.error(err?.message ?? "L'assistant est indisponible.");
      setMessages(messages);
    } finally {
      clearTimeout(notice);
      setSwitching(false);
      setBusy(false);
    }
  }

  if (authState === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
      </div>
    );
  }

  if (authState === "out") {
    return (
      <div className="max-w-md mx-auto glass p-8 text-center space-y-4">
        <Sparkles className="h-9 w-9 text-cyan mx-auto" />
        <h1 className="text-2xl font-bold">Tuteur IA réservé aux inscrits</h1>
        <p className="text-sm text-muted-foreground">
          Crée ton compte gratuit ou connecte-toi pour discuter avec ton professeur virtuel et retrouver ton
          historique de discussions.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 bg-cyan text-background font-bold px-4 py-2.5 rounded-lg"
        >
          <LogIn className="h-4 w-4" /> Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <BackButton to="/" />

      <header className="glass p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-cyan" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black truncate">Tuteur IA — tous les niveaux</h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Programme tunisien · explications pas à pas</p>
          </div>
        </div>
        <button
          onClick={newChat}
          className="flex items-center gap-1.5 text-xs font-bold border border-white/10 rounded-lg px-3 py-2 hover:border-cyan/40 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Nouvelle discussion</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <details className="glass p-3 lg:hidden order-2">
          <summary className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 cursor-pointer">
            <MessageSquare className="h-3.5 w-3.5" /> Mon historique ({convs.length})
          </summary>
          <div className="mt-2 space-y-2 max-h-[40dvh] overflow-y-auto">
            {convs.length === 0 && <p className="text-xs text-muted-foreground px-1">Aucune discussion enregistrée.</p>}
            {convs.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
                  convId === c.id ? "border-cyan/40 bg-cyan/5" : "border-white/10"
                }`}
              >
                <button onClick={() => void openConv(c)} className="flex-1 text-start truncate min-w-0">
                  <span className="block truncate font-medium">{c.title}</span>
                  <span className="text-[10px] text-muted-foreground">{LEVEL_LABELS[c.level] ?? c.level}</span>
                </button>
                <button
                  onClick={() => void removeConv(c.id)}
                  aria-label="Supprimer"
                  className="p-1 rounded text-muted-foreground hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </details>

        <aside className="glass p-3 space-y-2 lg:max-h-[70vh] overflow-y-auto order-2 lg:order-1 hidden lg:block">
          <p className="text-xs font-bold text-muted-foreground px-1 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Mon historique
          </p>
          {convs.length === 0 && <p className="text-xs text-muted-foreground px-1">Aucune discussion enregistrée.</p>}
          {convs.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
                convId === c.id ? "border-cyan/40 bg-cyan/5" : "border-white/10 hover:border-white/25"
              }`}
            >
              <button onClick={() => void openConv(c)} className="flex-1 text-start truncate">
                <span className="block truncate font-medium">{c.title}</span>
                <span className="text-[10px] text-muted-foreground">{LEVEL_LABELS[c.level] ?? c.level}</span>
              </button>
              <button
                onClick={() => void removeConv(c.id)}
                aria-label="Supprimer"
                className="p-1 rounded text-muted-foreground hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </aside>

        <div className="space-y-4 order-1 lg:order-2">
          {!level ? (
            <div className="glass p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald" />
                <h2 className="font-bold">Choisis ton niveau</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLevel(l); setSubject(""); setTrack(""); }}
                    className="text-start glass border border-white/10 hover:border-cyan/40 hover:-translate-y-0.5 transition-all p-4 rounded-xl"
                  >
                    <p className="font-bold">{LEVEL_LABELS[l]}</p>
                    <p className="text-xs text-muted-foreground mt-1">{LEVEL_DESC[l]}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">
                  Niveau : {LEVEL_LABELS[level] ?? level}
                </span>
                <button onClick={() => setLevel(null)} className="hover:text-foreground underline">
                  changer
                </button>
                {tracksForLevel(level).length > 0 && (
                  <select
                    value={track}
                    onChange={(e) => { setTrack(e.target.value); setSubject(""); }}
                    aria-label="Filière"
                    className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs"
                  >
                    <option value="">Toutes les filières</option>
                    {tracksForLevel(level).map((tr) => (
                      <option key={tr} value={tr}>
                        {trackLabel(tr)}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  aria-label="Matière"
                  className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs"
                >
                  <option value="">Toutes les matières</option>
                  {subjectsForLevelTrack(level, track || null).map((s) => (
                    <option key={s} value={s}>
                      {subjectLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="glass p-3 sm:p-4 space-y-4 min-h-[50dvh] max-h-[58dvh] sm:min-h-[45vh] sm:max-h-[60vh] overflow-y-auto overflow-x-hidden overscroll-contain">
                {loadingConv && <Loader2 className="h-4 w-4 animate-spin text-cyan mx-auto" />}
                {!loadingConv && messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-10 space-y-2">
                    <p>Pose ta question ou envoie la photo de ton exercice.</p>
                    <p className="text-xs">
                      Exemple : « Comment résoudre une équation du second degré ? » ou « Explique la poussée
                      d'Archimède »
                    </p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <Bubble key={i} m={m} />
                ))}
                {busy && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan" />
                    {switching ? (
                      <span className="flex items-center gap-1.5 text-amber">
                        <Wifi className="h-3.5 w-3.5" /> Optimisation de la connexion...
                      </span>
                    ) : (
                      <span>Le professeur réfléchit…</span>
                    )}
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={send} className="glass p-3 space-y-2 sticky bottom-2">
                {book && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald/30 bg-emerald/5 px-3 py-2 text-xs">
                    <FileText className="h-4 w-4 text-emerald shrink-0" />
                    <span className="flex-1 truncate">
                      <span className="font-bold">{book.name}</span> · {book.pages} page(s)
                      {book.images.length > 0 && ` · ${book.images.length} page(s) lue(s) en vision`}
                      {book.truncatedPages > 0 && ` · ${book.truncatedPages} page(s) non lue(s)`}
                    </span>
                    <button type="button" aria-label="Retirer le document" onClick={() => setBook(null)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {reading && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald" /> Lecture du document… page{" "}
                    {reading.page}/{reading.total}
                  </p>
                )}

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="À envoyer" className="h-16 w-16 object-cover rounded-lg" />
                        <button
                          type="button"
                          aria-label="Retirer l'image"
                          onClick={() => setImages(images.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -end-1.5 bg-background border border-white/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-1.5 sm:gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => void pickImages(e.target.files)}
                  />
                  <input
                    ref={bookRef}
                    type="file"
                    accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => void pickBook(e.target.files?.[0] ?? null)}
                  />

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg border border-white/10 flex items-center justify-center hover:border-cyan/40"
                    aria-label="Joindre une image"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => bookRef.current?.click()}
                    disabled={!!reading}
                    className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg border border-white/10 flex items-center justify-center hover:border-emerald/40 disabled:opacity-40"
                    aria-label="Joindre un document court (PDF ou Word)"
                  >
                    {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  </button>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send(e as unknown as React.FormEvent);
                      }
                    }}
                    rows={1}
                    placeholder="Écris ta question…"
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base sm:text-sm outline-none focus:border-cyan/50 resize-none max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={busy || !!reading || (!input.trim() && images.length === 0 && !book)}
                    className="bg-cyan text-background font-bold h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg flex items-center justify-center disabled:opacity-40"
                    aria-label="Envoyer"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3" /> Jusqu'à 3 images (4 Mo max) ou un document court : PDF /
                  DOCX de {MAX_PAGES} pages maximum (8 Mo) · l'assistant guide sans donner la solution finale.
                </p>

              </form>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
