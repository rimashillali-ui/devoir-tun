import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveTutorDoc, deleteTutorDoc } from "@/lib/tutor-admin.functions";
import { extractTextFromFile } from "@/lib/extract-text";
import { AdminModal } from "@/components/admin/AdminModal";
import { toast } from "sonner";
import { Trash2, Plus, Save, Upload, Loader2, FileText } from "lucide-react";

const input = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";
const btn = "px-3 py-2 rounded-md text-sm font-medium";

const LEVELS = [
  { id: "9", label: "9ème année de base" },
  { id: "bac", label: "Baccalauréat" },
] as const;

const SUBJECTS = [
  { id: "math", label: "Mathématiques" },
  { id: "pc", label: "Physique-Chimie" },
  { id: "general", label: "Général / Méthodologie" },
] as const;

type Doc = {
  id?: string;
  level: "9" | "bac";
  subject: "math" | "pc" | "general";
  title: string;
  file_name: string | null;
  content: string;
  enabled: boolean;
};

function empty(level: "9" | "bac"): Doc {
  return { level, subject: "math", title: "", file_name: null, content: "", enabled: true };
}

export function TutorDocsAdmin() {
  const [level, setLevel] = useState<"9" | "bac">("9");
  const [items, setItems] = useState<Doc[]>([]);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("tutor_documents")
      .select("id, level, subject, title, file_name, content, enabled")
      .eq("level", level)
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setItems((data ?? []) as Doc[]);
  }

  useEffect(() => { load(); }, [level]);

  async function onFile(file: File) {
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setEditing((cur) => ({
        ...(cur ?? empty(level)),
        file_name: file.name,
        title: cur?.title?.trim() ? cur.title : file.name.replace(/\.[^.]+$/, ""),
        content: text,
      }));
      toast.success(`Texte extrait (${text.length} caractères)`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExtracting(false);
    }
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      await saveTutorDoc({ data: {
        id: editing.id,
        level: editing.level,
        subject: editing.subject,
        title: editing.title,
        file_name: editing.file_name,
        content: editing.content,
        enabled: editing.enabled,
      }});
      toast.success("Cours enregistré — le tuteur IA l'utilisera immédiatement");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce cours de référence ?")) return;
    try {
      await deleteTutorDoc({ data: { id } });
      toast.success("Supprimé");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select className={input} value={level} onChange={(e) => setLevel(e.target.value as "9" | "bac")}>
          {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <div className="flex justify-end">
          <button
            onClick={() => setEditing(empty(level))}
            className={btn + " bg-primary text-primary-foreground inline-flex items-center gap-1"}
          >
            <Plus className="w-4 h-4" /> Importer un cours
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Les cours du niveau sélectionné sont injectés automatiquement dans le prompt du tuteur IA
        (« Voici le cours officiel tunisien de référence… »).
      </p>

      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className="glass p-3 flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan shrink-0" /> {d.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {SUBJECTS.find((s) => s.id === d.subject)?.label} · {d.content.length} caractères
                {d.file_name ? ` · ${d.file_name}` : ""} {d.enabled ? "" : " · désactivé"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing(d)} className={btn + " bg-white/5 hover:bg-white/10"}>Modifier</button>
              <button onClick={() => remove(d.id!)} className="text-destructive p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            Aucun cours pour ce niveau. Clique sur « Importer un cours ».
          </p>
        )}
      </div>

      {editing && (
        <AdminModal
          onClose={() => setEditing(null)}
          title={editing.id ? "Modifier le cours de référence" : "Nouveau cours de référence"}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                className={input}
                value={editing.level}
                onChange={(e) => setEditing({ ...editing, level: e.target.value as "9" | "bac" })}
              >
                {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <select
                className={input}
                value={editing.subject}
                onChange={(e) => setEditing({ ...editing, subject: e.target.value as Doc["subject"] })}
              >
                {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <input
              className={input}
              placeholder="Titre du cours (ex : Fonctions dérivées — Bac Maths)"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />

            <label className="flex items-center gap-2 text-sm border border-dashed border-white/20 rounded-md px-3 py-3 cursor-pointer hover:border-cyan/40">
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{extracting ? "Extraction du texte…" : "Choisir un fichier PDF, .txt ou .md"}</span>
              <input
                type="file"
                accept=".pdf,.txt,.md,text/plain,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }}
              />
            </label>

            <textarea
              className={input + " font-mono text-xs"}
              rows={10}
              placeholder="Texte du cours (extrait automatiquement du fichier, modifiable)"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">{editing.content.length} caractères</p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
              />
              Actif (utilisé par le tuteur IA)
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className={btn + " bg-white/5"}>Annuler</button>
              <button
                onClick={save}
                disabled={busy || !editing.title.trim() || editing.content.trim().length < 20}
                className={btn + " bg-primary text-primary-foreground inline-flex items-center gap-1 disabled:opacity-40"}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
