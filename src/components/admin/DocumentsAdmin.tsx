import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, getTracks, getSubjects, getDocumentSections, TERMS, getExamSlots, type Term } from "@/lib/constants";
import { saveDocument, deleteDocument, listDocumentsAdmin } from "@/lib/admin.functions";
import { generateDocTitle } from "@/lib/title-generator";
import { invalidateReads } from "@/lib/resilient-read";
import { toast } from "sonner";
import { Trash2, Pencil, Plus, Wand2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ReorderPanel } from "./ReorderPanel";
import { AdminModal } from "./AdminModal";


type Doc = any;

const input = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";
const label = "block text-xs text-muted-foreground mb-1";

export function DocumentsAdmin() {
  const [rows, setRows] = useState<Doc[]>([]);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [creating, setCreating] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [search, setSearch] = useState("");


  async function load() {
    try {
      const data = await listDocumentsAdmin();
      setRows((data ?? []) as Doc[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Chargement impossible");
    }
  }
  useEffect(() => { load(); }, []);

  async function onDelete(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    try { await deleteDocument({ data: { id } }); invalidateReads(); toast.success("Supprimé"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => { setCreating(true); setEditing({ section: "cours", level: "9eme", subject: "math" }); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1">
          <Plus className="h-4 w-4" /> Nouveau document
        </button>
        <button onClick={() => setShowReorder((v) => !v)}
          className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4" /> {showReorder ? "Fermer" : "Réorganiser (souris)"}
        </button>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (titre, matière, niveau, filière, section)…"
          className="flex-1 min-w-[240px] bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm"
        />
      </div>


      {showReorder && <ReorderPanel />}

      {(editing || creating) && (
        <DocForm
          initial={editing ?? {}}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}

      <div className="glass overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr><th className="p-2 text-start">Niveau</th><th className="p-2 text-start">Filière</th><th className="p-2 text-start">Matière</th><th className="p-2 text-start">Section</th><th className="p-2 text-start">Titre</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {(() => {
              const q = search.trim().toLowerCase();
              const filtered = q
                ? rows.filter((d) => [d.title_fr, d.title_ar, d.subtitle_fr, d.subtitle_ar, d.subject, d.level, d.track, d.section, d.term, d.exam_slot]
                    .filter(Boolean).some((v: string) => String(v).toLowerCase().includes(q)))
                : rows;
              if (filtered.length === 0) {
                return <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucun document</td></tr>;
              }
              return filtered.map((d) => (
                <tr key={d.id} className="border-t border-white/5">
                  <td className="p-2">{d.level}</td>
                  <td className="p-2">{d.track ?? "—"}</td>
                  <td className="p-2">{d.subject}</td>
                  <td className="p-2">{d.section}{d.term ? ` ${d.term}/${d.exam_slot}` : ""}</td>
                  <td className="p-2">{d.title_fr}</td>
                  <td className="p-2 text-end">
                    <button onClick={() => setEditing(d)} className="p-1 hover:bg-white/10 rounded"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(d.id)} className="p-1 hover:bg-white/10 rounded text-rose"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ));
            })()}
          </tbody>

        </table>
      </div>
    </div>
  );
}

function DocForm({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<any>({
    id: initial.id,
    level: initial.level ?? "9eme",
    track: initial.track ?? null,
    subject: initial.subject ?? "",
    section: initial.section ?? "cours",
    term: initial.term ?? null,
    exam_slot: initial.exam_slot ?? null,
    title_ar: initial.title_ar ?? "",
    title_fr: initial.title_fr ?? "",
    subtitle_ar: initial.subtitle_ar ?? "",
    subtitle_fr: initial.subtitle_fr ?? "",
    video_url: initial.video_url ?? "",
    sort_order: initial.sort_order ?? 0,
  });
  // Ordre des sources défini par l'admin : index 0 = source principale, puis miroirs.
  const [sources, setSources] = useState<string[]>(() => {
    const list = [initial.source_url ?? "", ...((initial.mirror_urls as string[] | undefined) ?? [])];
    while (list.length < 4) list.push("");
    return list.slice(0, 4);
  });
  function setSource(i: number, v: string) {
    setSources((prev) => prev.map((s, idx) => (idx === i ? v : s)));
  }
  function moveSource(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= sources.length) return;
    setSources((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  const tracks = getTracks(d.level);
  const subjects = getSubjects(d.level, d.track);
  const slots = d.term ? getExamSlots(d.subject, d.term as Term, d.level) : [];

  function autoGenerateTitle() {
    if (!d.subject) { toast.error("Choisis d'abord une matière"); return; }
    if (d.section === "devoirs" && !d.exam_slot) {
      toast.error("Choisis le type (contrôle / synthèse) pour générer le titre");
      return;
    }
    const t = generateDocTitle({
      level: d.level,
      track: d.track,
      subject: d.subject,
      section: d.section,
      term: d.term,
      examSlot: d.exam_slot,
      sortOrder: Number(d.sort_order) || 1,
    });
    if (!t) { toast.error("Impossible de générer"); return; }
    setD({ ...d, title_fr: t.fr, title_ar: t.ar });
    toast.success("Titres générés");
  }


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const cleaned = sources.map((s) => s.trim()).filter(Boolean);
      if (cleaned.length === 0) { toast.error("Ajoute au moins un lien source"); return; }
      const hasTerm = d.section === "devoirs" || d.section === "cours" || d.section === "series";
      await saveDocument({ data: {
        id: d.id,
        level: d.level,
        track: tracks.length ? d.track : null,
        subject: d.subject,
        section: d.section,
        term: hasTerm ? d.term : null,
        exam_slot: d.section === "devoirs" ? d.exam_slot : null,
        title_ar: d.title_ar,
        title_fr: d.title_fr,
        subtitle_ar: d.subtitle_ar?.trim() || null,
        subtitle_fr: d.subtitle_fr?.trim() || null,

        source_url: cleaned[0],
        mirror_urls: cleaned.slice(1),
        video_url: d.section === "cours" && d.video_url ? d.video_url : null,
        sort_order: Number(d.sort_order) || 0,
      } });
      invalidateReads(); toast.success("Enregistré"); onSaved();
    } catch (err: any) { toast.error(err.message); }
  }

  return (
    <AdminModal title={d.id ? "Modifier le document" : "Nouveau document"} onClose={onClose}>
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={label}>Niveau</label>
          <select className={input} value={d.level} onChange={(e) => setD({ ...d, level: e.target.value, track: null, subject: "" })}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        {tracks.length > 0 && (
          <div>
            <label className={label}>Filière</label>
            <select className={input} value={d.track ?? ""} onChange={(e) => setD({ ...d, track: e.target.value, subject: "" })}>
              <option value="">— choisir —</option>
              {tracks.map((tr) => <option key={tr} value={tr}>{tr}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={label}>Matière</label>
          <select className={input} value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })}>
            <option value="">— choisir —</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Section</label>
          <select className={input} value={d.section} onChange={(e) => setD({ ...d, section: e.target.value })}>
            {getDocumentSections(d.level).map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {(d.section === "devoirs" || d.section === "cours" || d.section === "series") && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Trimestre</label>
            <select className={input} value={d.term ?? ""} onChange={(e) => setD({ ...d, term: e.target.value, exam_slot: null })}>
              <option value="">—</option>
              {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {d.section === "devoirs" && (
            <div>
              <label className={label}>Type</label>
              <select className={input} value={d.exam_slot ?? ""} onChange={(e) => setD({ ...d, exam_slot: e.target.value })}>
                <option value="">—</option>
                {slots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
      {(
        <button type="button" onClick={autoGenerateTitle}
          className="inline-flex items-center gap-1 text-xs bg-cyan/20 text-cyan border border-cyan/30 px-3 py-1.5 rounded-md hover:bg-cyan/30">
          <Wand2 className="h-3.5 w-3.5" /> Générer titres FR / AR auto
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={label}>Titre AR</label>
          <input className={input} value={d.title_ar} onChange={(e) => setD({ ...d, title_ar: e.target.value })} required dir="rtl" />
        </div>
        <div>
          <label className={label}>Titre FR</label>
          <input className={input} value={d.title_fr} onChange={(e) => setD({ ...d, title_fr: e.target.value })} required />
        </div>
        <div>
          <label className={label}>Sous-titre AR (optionnel)</label>
          <input className={input} value={d.subtitle_ar} onChange={(e) => setD({ ...d, subtitle_ar: e.target.value })} dir="rtl" />
        </div>
        <div>
          <label className={label}>Sous-titre FR (optionnel)</label>
          <input className={input} value={d.subtitle_fr} onChange={(e) => setD({ ...d, subtitle_fr: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <label className={label}>
          Sources du fichier (GitHub / Google Drive / OneDrive / Backblaze B2 via Worker) — ordre d'essai automatique
        </label>
        {sources.map((src, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${i === 0 ? "bg-emerald/20 text-emerald" : "bg-white/10 text-muted-foreground"}`}>
              {i === 0 ? "1 · principale" : `${i + 1} · miroir`}
            </span>
            <input
              type="url"
              className={input}
              value={src}
              onChange={(e) => setSource(i, e.target.value)}
              placeholder={i === 0 ? "https://…/fichier.pdf" : "Lien miroir (optionnel)"}
              {...(i === 0 ? { required: true } : {})}
            />
            <button type="button" onClick={() => moveSource(i, -1)} disabled={i === 0}
              className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30" title="Monter">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => moveSource(i, 1)} disabled={i === sources.length - 1}
              className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30" title="Descendre">
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">
          Si une source ne répond pas, la suivante est essayée automatiquement côté serveur (l'élève ne voit rien).
        </p>
      </div>
      {d.section === "cours" && (
        <div>
          <label className={label}>Vidéo YouTube (optionnel)</label>
          <input type="url" className={input} value={d.video_url ?? ""} onChange={(e) => setD({ ...d, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
        </div>
      )}
      <div>
        <label className={label}>Ordre d'affichage (plus petit = en premier)</label>
        <input type="number" className={input} value={d.sort_order} onChange={(e) => setD({ ...d, sort_order: e.target.value })} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm hover:bg-white/10">Annuler</button>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">Enregistrer</button>
      </div>
    </form>
    </AdminModal>
  );
}
