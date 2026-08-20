import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { extractTextFromFile } from "@/lib/extract-text";
import { countPages, renderBookPages } from "@/lib/pdf-book";
import { transcribeBookPages } from "@/lib/tutor-vision.functions";
import {
  TUTOR_LEVELS,
  LEVEL_LABELS,
  subjectsForLevelTrack,
  subjectLabel,
  tracksForLevel,
  trackLabel,
} from "@/lib/tutor-meta";
import { AdminModal } from "@/components/admin/AdminModal";
import { BookOpen, Loader2, Plus, Trash2, Upload, Pencil, Eye, EyeOff, ScanEye } from "lucide-react";
import { toast } from "sonner";


type Doc = {
  id: string;
  level: string;
  track: string | null;
  subject: string | null;
  title: string;
  file_name: string | null;
  content: string;
  enabled: boolean;
};

const empty = {
  id: "",
  level: TUTOR_LEVELS[0]!,
  track: "",
  subject: "",
  title: "",
  file_name: "",
  content: "",
  enabled: true,
};

export function TutorCoursesAdmin() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [filterLevel, setFilterLevel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [book, setBook] = useState<{ file: File; pages: number } | null>(null);
  const [range, setRange] = useState({ from: 1, to: 20 });
  const [vision, setVision] = useState<{ running: boolean; label: string }>({ running: false, label: "" });
  const transcribe = useServerFn(transcribeBookPages);


  async function load() {
    const { data, error } = await supabase
      .from("tutor_documents")
      .select("id, level, track, subject, title, file_name, content, enabled")
      .order("level", { ascending: true });
    if (error) toast.error(error.message);
    setDocs((data ?? []) as Doc[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const subjects = useMemo(
    () => subjectsForLevelTrack(form.level, form.track || null),
    [form.level, form.track],
  );
  const tracks = useMemo(() => tracksForLevel(form.level), [form.level]);
  const visible = filterLevel ? docs.filter((d) => d.level === filterLevel) : docs;

  function openNew() {
    setForm({ ...empty });
    setBook(null);
    setOpen(true);
  }

  function openEdit(d: Doc) {
    setForm({
      id: d.id,
      level: d.level,
      track: d.track ?? "",
      subject: d.subject ?? "",
      title: d.title,
      file_name: d.file_name ?? "",
      content: d.content,
      enabled: d.enabled,
    });
    setBook(null);
    setOpen(true);
  }


  async function onFile(file: File | undefined) {
    if (!file) return;
    setExtracting(true);
    setBook(null);
    try {
      const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
      if (isPdf) {
        const pages = await countPages(file);
        setBook({ file, pages });
        setRange({ from: 1, to: Math.min(20, pages) });
      }
      const text = await extractTextFromFile(file);
      setForm((f) => ({
        ...f,
        content: text ? text.slice(0, 200000) : f.content,
        file_name: file.name,
        title: f.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      if (text) toast.success(`Texte extrait (${text.length} caractères)`);
      else if (isPdf) toast.info("Aucun texte détecté : utilise la lecture par vision ci-dessous.");
      else throw new Error("Fichier vide");
    } catch (e: any) {
      toast.error(e?.message ?? "Extraction impossible");
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** Lecture par vision : rend les pages en images et les fait transcrire par l'IA. */
  async function runVision() {
    if (!book) return;
    const from = Math.max(1, Math.min(book.pages, Math.trunc(range.from) || 1));
    const to = Math.max(from, Math.min(book.pages, Math.trunc(range.to) || from));
    if (to - from + 1 > 60) {
      toast.error("60 pages maximum par passe. Fais le livre par tranches.");
      return;
    }
    setVision({ running: true, label: "Préparation des pages…" });
    const chunks: string[] = [];
    try {
      const BATCH = 5;
      for (let start = from; start <= to; start += BATCH) {
        const end = Math.min(to, start + BATCH - 1);
        setVision({ running: true, label: `Rendu des pages ${start}–${end}…` });
        const pages = await renderBookPages(book.file, { fromPage: start, toPage: end });
        if (pages.length === 0) continue;
        setVision({ running: true, label: `Lecture IA des pages ${start}–${end}…` });
        const res = await transcribe({ data: { pages, title: form.title || book.file.name } });
        if (res?.text) chunks.push(res.text.trim());
      }
      if (chunks.length === 0) throw new Error("Aucun contenu transcrit");
      const added = `\n\n${chunks.join("\n\n")}`;
      setForm((f) => ({ ...f, content: (f.content + added).slice(0, 400000) }));
      toast.success(`Vision terminée : pages ${from}–${to} ajoutées (${added.length} caractères)`);
    } catch (e: any) {
      if (chunks.length > 0) {
        setForm((f) => ({ ...f, content: (f.content + "\n\n" + chunks.join("\n\n")).slice(0, 400000) }));
      }
      toast.error(e?.message ?? "Lecture par vision impossible");
    } finally {
      setVision({ running: false, label: "" });
    }
  }


  async function save() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Titre et contenu du cours requis");
      return;
    }
    setSaving(true);
    const payload = {
      level: form.level,
      track: form.track || null,
      subject: form.subject || null,
      title: form.title.trim(),
      file_name: form.file_name || null,
      content: form.content,
      enabled: form.enabled,
    };
    const { error } = form.id
      ? await supabase.from("tutor_documents").update(payload).eq("id", form.id)
      : await supabase.from("tutor_documents").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cours enregistré");
    setOpen(false);
    void load();
  }

  async function toggle(d: Doc) {
    await supabase.from("tutor_documents").update({ enabled: !d.enabled }).eq("id", d.id);
    void load();
  }

  async function remove(id: string) {
    await supabase.from("tutor_documents").delete().eq("id", id);
    void load();
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-cyan" />;

  return (
    <div className="space-y-4">
      <div className="glass p-4 flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-emerald shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Importe ici les cours officiels (PDF ou texte) par niveau et par matière. Leur texte est injecté dans
          le prompt du Tuteur IA comme base de référence quand l'élève choisit ce niveau et cette matière.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-bold"
        >
          <Plus className="h-4 w-4" /> Nouveau cours IA
        </button>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm"
        >
          <option value="">Tous les niveaux</option>
          {TUTOR_LEVELS.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABELS[l] ?? l}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {visible.length === 0 && <p className="text-sm text-muted-foreground">Aucun cours importé.</p>}
        {visible.map((d) => (
          <div key={d.id} className="glass p-3 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <p className="font-bold text-sm">{d.title}</p>
              <p className="text-xs text-muted-foreground">
                {LEVEL_LABELS[d.level] ?? d.level} ·{" "}
                {d.track ? trackLabel(d.track) : "toutes filières"} ·{" "}
                {d.subject ? subjectLabel(d.subject) : "toutes les matières"} · {d.content.length} car.
                {d.file_name ? ` · ${d.file_name}` : ""}
              </p>
            </div>
            <button
              onClick={() => void toggle(d)}
              className="text-xs inline-flex items-center gap-1.5 border border-white/10 rounded-md px-2 py-1.5"
            >
              {d.enabled ? <Eye className="h-3.5 w-3.5 text-emerald" /> : <EyeOff className="h-3.5 w-3.5" />}
              {d.enabled ? "Actif" : "Inactif"}
            </button>
            <button onClick={() => openEdit(d)} className="p-2 rounded-md hover:bg-white/10" aria-label="Modifier">
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => void remove(d.id)}
              className="p-2 rounded-md hover:bg-white/10 text-rose-400"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <AdminModal title={form.id ? "Modifier le cours IA" : "Nouveau cours IA"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="text-sm space-y-1">
                <span className="text-xs text-muted-foreground">Niveau</span>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value, track: "", subject: "" })}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm"
                >
                  {TUTOR_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABELS[l] ?? l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span className="text-xs text-muted-foreground">Filière</span>
                <select
                  value={form.track}
                  onChange={(e) => setForm({ ...form, track: e.target.value, subject: "" })}
                  disabled={tracks.length === 0}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm disabled:opacity-40"
                >
                  <option value="">
                    {tracks.length === 0 ? "Pas de filière" : "Toutes les filières"}
                  </option>
                  {tracks.map((tr) => (
                    <option key={tr} value={tr}>
                      {trackLabel(tr)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span className="text-xs text-muted-foreground">Matière</span>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Toutes les matières</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {subjectLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="text-sm space-y-1 block">
              <span className="text-xs text-muted-foreground">Titre du cours</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm"
                placeholder="Ex. Fonctions dérivées — chapitre 3"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={extracting}
                className="inline-flex items-center gap-2 border border-white/10 rounded-md px-3 py-2 text-sm disabled:opacity-50"
              >
                {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importer un PDF / TXT
              </button>
              <span className="text-xs text-muted-foreground">
                Le texte est extrait automatiquement puis modifiable ci-dessous.
              </span>
            </div>

            {book && (
              <div className="glass p-3 space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <ScanEye className="h-4 w-4 text-cyan" /> Lecture par vision — {book.pages} page(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  L'IA lit les pages comme des images (utile pour les livres scannés ou quand l'extraction de
                  texte est incomplète). Traite par tranches de 60 pages maximum ; le résultat s'ajoute au
                  contenu ci-dessous.
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-sm space-y-1">
                    <span className="text-xs text-muted-foreground block">De la page</span>
                    <input
                      type="number"
                      min={1}
                      max={book.pages}
                      value={range.from}
                      onChange={(e) => setRange((r) => ({ ...r, from: Number(e.target.value) }))}
                      className="w-24 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm space-y-1">
                    <span className="text-xs text-muted-foreground block">à la page</span>
                    <input
                      type="number"
                      min={1}
                      max={book.pages}
                      value={range.to}
                      onChange={(e) => setRange((r) => ({ ...r, to: Number(e.target.value) }))}
                      className="w-24 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void runVision()}
                    disabled={vision.running}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-bold disabled:opacity-50"
                  >
                    {vision.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanEye className="h-4 w-4" />}
                    Lire par vision
                  </button>
                  {vision.running && <span className="text-xs text-muted-foreground">{vision.label}</span>}
                </div>
              </div>
            )}



            <label className="text-sm space-y-1 block">
              <span className="text-xs text-muted-foreground">Contenu du cours (texte de référence)</span>
              <textarea
                rows={10}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm resize-y"
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              Utiliser ce cours dans le Tuteur IA
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="border border-white/10 rounded-md px-3 py-2 text-sm">
                Annuler
              </button>
              <button
                onClick={() => void save()}
                disabled={saving}
                className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
