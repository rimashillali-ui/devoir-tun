import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reorderDocuments } from "@/lib/admin.functions";
import { LEVELS, getTracks, getSubjects, SECTIONS, TERMS, getExamSlots, type Term } from "@/lib/constants";
import { toast } from "sonner";
import { GripVertical, Save } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Row = { id: string; title_fr: string; title_ar: string; sort_order: number };

const input = "bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";
const label = "block text-xs text-muted-foreground mb-1";

export function ReorderPanel() {
  const [level, setLevel] = useState<string>("9eme");
  const [track, setTrack] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [section, setSection] = useState<string>("cours");
  const [term, setTerm] = useState<string>("");
  const [examSlot, setExamSlot] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const tracks = getTracks(level);
  const subjects = getSubjects(level, track || null);
  const needsTerm = section === "cours" || section === "series" || section === "devoirs";
  const needsSlot = section === "devoirs";
  const slots = needsSlot && term && subject ? getExamSlots(subject, term as Term, level) : [];

  const ready = level && subject && section && (!needsTerm || term) && (!needsSlot || examSlot);

  async function load() {
    if (!ready) { setRows([]); return; }
    let q = supabase.from("documents")
      .select("id,title_fr,title_ar,sort_order")
      .eq("level", level).eq("subject", subject).eq("section", section)
      .order("sort_order", { ascending: true });
    if (tracks.length) q = q.eq("track", track); else q = q.is("track", null);
    if (needsTerm) q = q.eq("term", term);
    if (needsSlot) q = q.eq("exam_slot", examSlot);
    const { data } = await q;
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [level, track, subject, section, term, examSlot]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = rows.findIndex((r) => r.id === active.id);
    const newIdx = rows.findIndex((r) => r.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(rows, oldIdx, newIdx).map((r, i) => ({ ...r, sort_order: (i + 1) * 10 }));
    setRows(next);
  }

  async function save() {
    setSaving(true);
    try {
      await reorderDocuments({ data: { items: rows.map((r) => ({ id: r.id, sort_order: r.sort_order })) } });
      toast.success("Ordre enregistré");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="glass p-4 space-y-3">
      <h3 className="font-bold text-sm">Réorganiser (glisser-déposer)</h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <div><label className={label}>Niveau</label>
          <select className={input + " w-full"} value={level} onChange={(e) => { setLevel(e.target.value); setTrack(""); setSubject(""); }}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select></div>
        {tracks.length > 0 && (
          <div><label className={label}>Filière</label>
            <select className={input + " w-full"} value={track} onChange={(e) => { setTrack(e.target.value); setSubject(""); }}>
              <option value="">—</option>
              {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
        )}
        <div><label className={label}>Matière</label>
          <select className={input + " w-full"} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">—</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className={label}>Section</label>
          <select className={input + " w-full"} value={section} onChange={(e) => { setSection(e.target.value); setTerm(""); setExamSlot(""); }}>
            {SECTIONS.filter((s) => s !== "texte" && s !== "conseils").map((s) => <option key={s} value={s}>{s}</option>)}
          </select></div>
        {needsTerm && (
          <div><label className={label}>Trimestre</label>
            <select className={input + " w-full"} value={term} onChange={(e) => { setTerm(e.target.value); setExamSlot(""); }}>
              <option value="">—</option>
              {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
        )}
        {needsSlot && (
          <div><label className={label}>Type</label>
            <select className={input + " w-full"} value={examSlot} onChange={(e) => setExamSlot(e.target.value)}>
              <option value="">—</option>
              {slots.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
        )}
      </div>

      {!ready ? (
        <p className="text-xs text-muted-foreground">Sélectionne tous les filtres pour afficher la liste.</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun document pour ces filtres.</p>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {rows.map((r, i) => <Item key={r.id} row={r} index={i} />)}
              </ul>
            </SortableContext>
          </DndContext>
          <button onClick={save} disabled={saving}
            className="bg-emerald text-background px-3 py-1.5 rounded-md text-sm font-bold inline-flex items-center gap-1 disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "…" : "Enregistrer l'ordre"}
          </button>
        </>
      )}
    </div>
  );
}

function Item({ row, index }: { row: Row; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <li ref={setNodeRef} style={style}
      className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-2 py-2 text-sm">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded" aria-label="Glisser">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-xs text-muted-foreground w-8">#{index + 1}</span>
      <span className="flex-1 truncate">{row.title_fr || row.title_ar}</span>
      <span className="text-xs text-muted-foreground">ordre: {row.sort_order}</span>
    </li>
  );
}
