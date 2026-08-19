import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, getTracks, getSubjects, ARTICLE_SECTIONS, ARABIC_ONLY_SECTIONS } from "@/lib/constants";
import { saveArticle, deleteArticle } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Trash2, Pencil, Plus } from "lucide-react";
import { AdminModal } from "./AdminModal";

const input = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";
const label = "block text-xs text-muted-foreground mb-1";

export function ArticlesAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  async function load() {
    const { data } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function onDelete(id: string) {
    if (!confirm("Supprimer ?")) return;
    try { await deleteArticle({ data: { id } }); toast.success("Supprimé"); load(); } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setEditing({ section: "conseils" })}
        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1">
        <Plus className="h-4 w-4" /> Nouvel article
      </button>
      {editing && <ArticleForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      <div className="glass overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5"><tr><th className="p-2 text-start">Section</th><th className="p-2 text-start">Niveau</th><th className="p-2 text-start">Matière</th><th className="p-2 text-start">Titre</th><th className="p-2"></th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-white/5">
                <td className="p-2">{a.section}</td>
                <td className="p-2">{a.level ?? "—"}</td>
                <td className="p-2">{a.subject ?? "—"}</td>
                <td className="p-2">{a.title_fr ?? a.title_ar}</td>
                <td className="p-2 text-end">
                  <button onClick={() => setEditing(a)} className="p-1 hover:bg-white/10 rounded"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(a.id)} className="p-1 hover:bg-white/10 rounded text-rose"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Aucun article</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArticleForm({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: () => void }) {
  const [a, setA] = useState<any>({
    id: initial.id,
    level: initial.level ?? "",
    track: initial.track ?? null,
    subject: initial.subject ?? "",
    section: initial.section ?? "conseils",
    title_ar: initial.title_ar ?? "",
    title_fr: initial.title_fr ?? "",
    subtitle_ar: initial.subtitle_ar ?? "",
    subtitle_fr: initial.subtitle_fr ?? "",
    content_html_ar: initial.content_html_ar ?? "",
    content_html_fr: initial.content_html_fr ?? "",
  });
  const tracks = a.level ? getTracks(a.level) : [];
  const subjects = a.level ? getSubjects(a.level, a.track) : [];
  const frDisabled = ARABIC_ONLY_SECTIONS.has(a.section);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveArticle({ data: {
        id: a.id,
        level: a.level || null,
        track: tracks.length && a.track ? a.track : null,
        subject: a.subject || null,
        section: a.section,
        title_ar: a.title_ar,
        title_fr: frDisabled ? null : (a.title_fr || null),
        subtitle_ar: a.subtitle_ar?.trim() || null,
        subtitle_fr: frDisabled ? null : (a.subtitle_fr?.trim() || null),
        content_html_ar: a.content_html_ar,
        content_html_fr: frDisabled ? null : (a.content_html_fr || null),
      } });
      toast.success("Enregistré"); onSaved();
    } catch (err: any) { toast.error(err.message); }
  }


  return (
    <form onSubmit={submit} className="glass p-4 space-y-3 relative">
      <button type="button" onClick={onClose} className="absolute top-2 end-2 p-1 hover:bg-white/10 rounded"><X className="h-4 w-4" /></button>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={label}>Section</label>
          <select className={input} value={a.section} onChange={(e) => setA({ ...a, section: e.target.value })}>
            {[...ARTICLE_SECTIONS].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Niveau (opt.)</label>
          <select className={input} value={a.level} onChange={(e) => setA({ ...a, level: e.target.value, track: null, subject: "" })}>
            <option value="">—</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        {tracks.length > 0 && (
          <div>
            <label className={label}>Filière</label>
            <select className={input} value={a.track ?? ""} onChange={(e) => setA({ ...a, track: e.target.value })}>
              <option value="">—</option>
              {tracks.map((tr) => <option key={tr} value={tr}>{tr}</option>)}
            </select>
          </div>
        )}
        {subjects.length > 0 && (
          <div>
            <label className={label}>Matière (opt.)</label>
            <select className={input} value={a.subject} onChange={(e) => setA({ ...a, subject: e.target.value })}>
              <option value="">—</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      <div>
        <label className={label}>Titre AR</label>
        <input className={input} value={a.title_ar} onChange={(e) => setA({ ...a, title_ar: e.target.value })} required dir="rtl" />
      </div>
      <div>
        <label className={label}>Titre FR {frDisabled && "(désactivé pour شرح نص)"}</label>
        <input className={input} value={a.title_fr} onChange={(e) => setA({ ...a, title_fr: e.target.value })} disabled={frDisabled} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={label}>Sous-titre AR (optionnel)</label>
          <input className={input} value={a.subtitle_ar} onChange={(e) => setA({ ...a, subtitle_ar: e.target.value })} dir="rtl" />
        </div>
        <div>
          <label className={label}>Sous-titre FR (optionnel)</label>
          <input className={input} value={a.subtitle_fr} onChange={(e) => setA({ ...a, subtitle_fr: e.target.value })} disabled={frDisabled} />
        </div>
      </div>

      <div>
        <label className={label}>Contenu HTML AR</label>
        <textarea className={input + " font-mono"} rows={10} dir="rtl" value={a.content_html_ar}
          onChange={(e) => setA({ ...a, content_html_ar: e.target.value })} required />
      </div>
      <div>
        <label className={label}>Contenu HTML FR {frDisabled && "(désactivé)"}</label>
        <textarea className={input + " font-mono"} rows={10} value={a.content_html_fr}
          onChange={(e) => setA({ ...a, content_html_fr: e.target.value })} disabled={frDisabled} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">Enregistrer</button>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm hover:bg-white/10">Annuler</button>
      </div>
    </form>
  );
}
