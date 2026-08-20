import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveTutorPrompt } from "@/lib/admin.functions";
import { LEVELS } from "@/lib/constants";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const LEVEL_LABELS: Record<string, string> = {
  "9eme": "9ème année de base",
  "1sec": "1ère année secondaire",
  "2sc": "2ème année secondaire",
  "3eme": "3ème année secondaire",
  bac: "Baccalauréat",
};

export function TutorPromptsAdmin() {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tutor_prompts").select("level, prompt");
      const map: Record<string, string> = {};
      for (const l of LEVELS) map[l] = "";
      for (const row of data ?? []) map[row.level] = row.prompt ?? "";
      setPrompts(map);
      setLoading(false);
    })();
  }, []);

  async function save(level: string) {
    setSaving(level);
    try {
      await saveTutorPrompt({ data: { level, prompt: prompts[level] ?? "" } });
      toast.success("Consignes enregistrées");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-cyan" />;

  return (
    <div className="space-y-4">
      <div className="glass p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-cyan shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Ces consignes sont ajoutées au prompt système du Tuteur IA selon le niveau choisi par l'élève.
          Elles complètent les règles de base (guider sans donner la solution, LaTeX, français).
        </p>
      </div>

      {LEVELS.map((level) => (
        <div key={level} className="glass p-4 space-y-3">
          <h3 className="font-bold">{LEVEL_LABELS[level] ?? level}</h3>
          <textarea
            rows={5}
            value={prompts[level] ?? ""}
            onChange={(e) => setPrompts({ ...prompts, [level]: e.target.value })}
            placeholder="Consignes pédagogiques pour ce niveau…"
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm resize-y"
          />
          <button
            onClick={() => save(level)}
            disabled={saving === level}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
          >
            {saving === level ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      ))}
    </div>
  );
}
