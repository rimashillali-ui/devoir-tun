import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveTutorPrompt } from "@/lib/admin.functions";
import {
  TUTOR_LEVELS,
  LEVEL_LABELS,
  subjectsForLevelTrack,
  subjectLabel,
  tracksForLevel,
  trackLabel,
  BASE_PROMPT_LEVEL,
} from "@/lib/tutor-meta";
import { Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Row = { level: string; subject: string; track: string; prompt: string };

export function TutorPromptsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string>(TUTOR_LEVELS[0]!);
  const [track, setTrack] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tutor_prompts")
        .select("level, subject, track, prompt")
        .neq("level", BASE_PROMPT_LEVEL);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const tracks = useMemo(() => tracksForLevel(level), [level]);
  const subjects = useMemo(() => subjectsForLevelTrack(level, track || null), [level, track]);

  useEffect(() => {
    const found = rows.find(
      (r) => r.level === level && (r.subject ?? "") === subject && (r.track ?? "") === track,
    );
    setText(found?.prompt ?? "");
  }, [rows, level, subject, track]);

  async function save() {
    setSaving(true);
    try {
      await saveTutorPrompt({ data: { level, subject, track, prompt: text } });
      setRows((prev) => [
        ...prev.filter(
          (r) => !(r.level === level && (r.subject ?? "") === subject && (r.track ?? "") === track),
        ),
        { level, subject, track, prompt: text },
      ]);
      toast.success("Consignes enregistrées");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-cyan" />;

  const configured = rows.filter((r) => (r.prompt ?? "").trim().length > 0);

  return (
    <div className="space-y-4">
      <div className="glass p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-cyan shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Ces consignes s'ajoutent au prompt principal du Tuteur IA. Choisis un niveau, une filière (3ème et
          Bac) et, si tu veux affiner, une matière. Les consignes plus générales (toutes filières / toutes
          matières) s'appliquent en plus des consignes précises.
        </p>
      </div>

      <div className="glass p-4 space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm space-y-1">
            <span className="text-xs text-muted-foreground">Niveau</span>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setTrack("");
                setSubject("");
              }}
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
              value={track}
              onChange={(e) => {
                setTrack(e.target.value);
                setSubject("");
              }}
              disabled={tracks.length === 0}
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm disabled:opacity-40"
            >
              <option value="">
                {tracks.length === 0 ? "Pas de filière à ce niveau" : "Toutes les filières"}
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
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Toutes les matières (général)</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {subjectLabel(s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Consignes pédagogiques pour ce niveau / cette filière / cette matière…"
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm resize-y"
        />
        <button
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {configured.length > 0 && (
        <div className="glass p-4 space-y-2">
          <h3 className="font-bold text-sm">Consignes déjà définies</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            {configured.map((r) => (
              <li key={`${r.level}:${r.track}:${r.subject}`}>
                <button
                  onClick={() => {
                    setLevel(r.level);
                    setTrack(r.track ?? "");
                    setSubject(r.subject ?? "");
                  }}
                  className="hover:text-foreground underline"
                >
                  {LEVEL_LABELS[r.level] ?? r.level} ·{" "}
                  {r.track ? trackLabel(r.track) : "toutes filières"} ·{" "}
                  {r.subject ? subjectLabel(r.subject) : "toutes les matières"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
