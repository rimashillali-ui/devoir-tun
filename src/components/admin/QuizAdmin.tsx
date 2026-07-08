import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveQuizQuestion, deleteQuizQuestion } from "@/lib/quiz-admin.functions";
import { QUIZ_MENU, QUIZ_SUBJECTS } from "@/lib/quizzes";
import { toast } from "sonner";
import { Trash2, Plus, Save, X } from "lucide-react";

const input = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm";
const btn = "px-3 py-2 rounded-md text-sm font-medium";

type Question = {
  id?: string;
  level: string;
  subject: string;
  question_ar: string;
  choices: string[];
  correct_index: number;
  explanation_ar: string | null;
  sort_order: number;
};

function emptyQuestion(level: string, subject: string, order: number): Question {
  return {
    level,
    subject,
    question_ar: "",
    choices: ["", ""],
    correct_index: 0,
    explanation_ar: "",
    sort_order: order,
  };
}

export function QuizAdmin() {
  const [level, setLevel] = useState(QUIZ_MENU[0].level);
  const [subject, setSubject] = useState<"math" | "svt">("math");
  const [items, setItems] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("level", level)
      .eq("subject", subject)
      .order("sort_order", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setItems((data ?? []) as Question[]);
  }

  useEffect(() => { load(); setEditing(null); }, [level, subject]);

  async function save() {
    if (!editing) return;
    try {
      await saveQuizQuestion({ data: {
        id: editing.id,
        level: editing.level,
        subject: editing.subject,
        question_ar: editing.question_ar,
        choices: editing.choices.filter((c) => c.trim().length > 0),
        correct_index: editing.correct_index,
        explanation_ar: editing.explanation_ar || null,
        sort_order: editing.sort_order,
      }});
      toast.success("Enregistré");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await deleteQuizQuestion({ data: { id } });
      toast.success("Supprimé");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  const filtered = search.trim()
    ? items.filter((q) => q.question_ar.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select className={input} value={level} onChange={(e) => setLevel(e.target.value)}>
          {QUIZ_MENU.map((l) => <option key={l.level} value={l.level}>{l.label_fr} — {l.label_ar}</option>)}
        </select>
        <select className={input} value={subject} onChange={(e) => setSubject(e.target.value as any)}>
          {QUIZ_SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.label_fr}</option>)}
        </select>
        <input className={input} placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{filtered.length} question(s)</p>
        <button
          onClick={() => setEditing(emptyQuestion(level, subject, items.length))}
          className={btn + " bg-primary text-primary-foreground inline-flex items-center gap-1"}
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {editing && (
        <div className="glass p-4 space-y-3 border-2 border-primary/40">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{editing.id ? "Modifier" : "Nouvelle question"}</h3>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            className={input} rows={2} dir="rtl" placeholder="نص السؤال"
            value={editing.question_ar}
            onChange={(e) => setEditing({ ...editing, question_ar: e.target.value })}
          />
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Choix (cocher la bonne réponse) :</label>
            {editing.choices.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="radio" name="correct" checked={editing.correct_index === i}
                  onChange={() => setEditing({ ...editing, correct_index: i })}
                />
                <input
                  className={input} dir="rtl" placeholder={`الخيار ${i + 1}`}
                  value={c}
                  onChange={(e) => {
                    const next = [...editing.choices];
                    next[i] = e.target.value;
                    setEditing({ ...editing, choices: next });
                  }}
                />
                {editing.choices.length > 2 && (
                  <button
                    onClick={() => {
                      const next = editing.choices.filter((_, j) => j !== i);
                      setEditing({
                        ...editing,
                        choices: next,
                        correct_index: Math.min(editing.correct_index, next.length - 1),
                      });
                    }}
                    className="text-destructive"
                  ><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            {editing.choices.length < 8 && (
              <button
                onClick={() => setEditing({ ...editing, choices: [...editing.choices, ""] })}
                className="text-xs text-primary hover:underline"
              >+ Ajouter un choix</button>
            )}
          </div>
          <textarea
            className={input} rows={2} dir="rtl" placeholder="التفسير (اختياري)"
            value={editing.explanation_ar ?? ""}
            onChange={(e) => setEditing({ ...editing, explanation_ar: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              type="number" className={input + " w-24"} placeholder="Ordre"
              value={editing.sort_order}
              onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
            />
            <button onClick={save} className={btn + " bg-primary text-primary-foreground inline-flex items-center gap-1"}>
              <Save className="w-4 h-4" /> Enregistrer
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((q, idx) => (
          <div key={q.id} className="glass p-3 flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" dir="rtl">{idx + 1}. {q.question_ar}</p>
              <p className="text-xs text-muted-foreground mt-1" dir="rtl">
                ✓ {q.choices[q.correct_index]}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing({ ...q, explanation_ar: q.explanation_ar ?? "" })}
                className={btn + " bg-white/5 hover:bg-white/10"}>Modifier</button>
              <button onClick={() => remove(q.id!)} className="text-destructive p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">Aucune question. Clique sur « Ajouter ».</p>
        )}
      </div>
    </div>
  );
}
