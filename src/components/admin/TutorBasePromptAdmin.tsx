import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveTutorPrompt } from "@/lib/admin.functions";
import { BASE_PROMPT_LEVEL, DEFAULT_BASE_PROMPT } from "@/lib/tutor-meta";
import { Brain, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

export function TutorBasePromptAdmin() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tutor_prompts")
        .select("prompt")
        .eq("level", BASE_PROMPT_LEVEL)
        .maybeSingle();
      setText((data?.prompt ?? "").trim() || DEFAULT_BASE_PROMPT);
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await saveTutorPrompt({
        data: { level: BASE_PROMPT_LEVEL, subject: "", track: "", prompt: text },
      });
      toast.success("Prompt principal enregistré");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-cyan" />;

  return (
    <div className="space-y-4">
      <div className="glass p-4 flex items-start gap-3">
        <Brain className="h-5 w-5 text-indigo shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          C'est le prompt système principal du Tuteur IA : il s'applique à tous les niveaux, toutes les
          filières et toutes les matières. Les consignes de l'onglet « Tuteur IA » viennent s'ajouter à
          celui-ci.
        </p>
      </div>

      <div className="glass p-4 space-y-3">
        <textarea
          rows={16}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Prompt système principal…"
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm resize-y font-mono"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            onClick={() => setText(DEFAULT_BASE_PROMPT)}
            className="inline-flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded-md text-sm hover:bg-white/5"
          >
            <RotateCcw className="h-4 w-4" /> Restaurer le prompt par défaut
          </button>
        </div>
      </div>
    </div>
  );
}
