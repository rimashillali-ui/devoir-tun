import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { QUIZZES } from "@/lib/quizzes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/quiz/$level/$subject")({
  loader: ({ params }) => {
    const key = `${params.level}/${params.subject}`;
    if (!(key in QUIZZES)) throw notFound();
    return { key, html: QUIZZES[key] };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Quiz ${params.subject.toUpperCase()} — ${params.level} — Devoiratouna` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizPage,
  errorComponent: () => <p>Erreur</p>,
  notFoundComponent: () => <p className="text-center py-10">Quiz introuvable</p>,
});

function QuizPage() {
  const { key, html } = Route.useLoaderData();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  if (authed === null) return <p className="text-center py-10 text-muted-foreground">…</p>;
  if (!authed) {
    return (
      <div className="glass p-8 text-center space-y-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold">Connexion requise</h1>
        <p className="text-sm text-muted-foreground">Connecte-toi pour accéder aux quiz.</p>
        <Link to="/auth" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Se connecter
        </Link>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="glass p-8 text-center max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-2">Quiz bientôt disponible</h1>
        <p className="text-sm text-muted-foreground">Combinaison : {key}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        srcDoc={html}
        title={`Quiz ${key}`}
        className="w-full rounded-lg border border-white/10 bg-white"
        style={{ height: "calc(100vh - 160px)" }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
