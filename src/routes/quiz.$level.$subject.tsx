import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { QUIZZES, QUIZ_MENU, QUIZ_SUBJECTS } from "@/lib/quizzes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type DBQuestion = {
  id: string;
  question_ar: string;
  choices: string[];
  correct_index: number;
  explanation_ar: string | null;
};

export const Route = createFileRoute("/quiz/$level/$subject")({
  loader: ({ params }) => {
    const validLevel = QUIZ_MENU.some((l) => l.level === params.level);
    const validSubject = QUIZ_SUBJECTS.some((s) => s.id === params.subject);
    if (!validLevel || !validSubject) throw notFound();
    return { level: params.level, subject: params.subject };
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
  const { level, subject } = Route.useLoaderData();
  const key = `${level}/${subject}`;
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [questions, setQuestions] = useState<DBQuestion[] | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    supabase
      .from("quiz_questions")
      .select("id,question_ar,choices,correct_index,explanation_ar")
      .eq("level", level)
      .eq("subject", subject)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setQuestions((data ?? []) as DBQuestion[]));
  }, [level, subject]);

  if (authed === null || questions === null) return <p className="text-center py-10 text-muted-foreground">…</p>;
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

  if (questions.length > 0) {
    return <DynamicQuiz questions={questions} />;
  }

  // Fallback: legacy static HTML from QUIZZES
  const html = QUIZZES[key];
  if (html) {
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

  return (
    <div className="glass p-8 text-center max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-2">Quiz bientôt disponible</h1>
      <p className="text-sm text-muted-foreground">Combinaison : {key}</p>
    </div>
  );
}

function DynamicQuiz({ questions }: { questions: DBQuestion[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[i];

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correct_index) setScore((s) => s + 1);
  }

  function next() {
    if (i + 1 >= questions.length) { setDone(true); return; }
    setI(i + 1); setPicked(null);
  }

  function reset() {
    setI(0); setPicked(null); setScore(0); setDone(false);
  }

  if (done) {
    return (
      <div dir="rtl" className="max-w-2xl mx-auto glass p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">🎉 انتهى الاختبار</h2>
        <p className="text-lg">النتيجة : <span className="font-bold text-primary">{score} / {questions.length}</span></p>
        <button onClick={reset} className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>سؤال {i + 1} / {questions.length}</span>
        <span>النقاط : {score}</span>
      </div>
      <div className="glass p-6 space-y-4">
        <h2 className="text-lg font-bold leading-relaxed">{q.question_ar}</h2>
        <div className="space-y-2">
          {q.choices.map((c, idx) => {
            const isCorrect = idx === q.correct_index;
            const isPicked = picked === idx;
            let cls = "w-full text-right p-3 rounded-md border transition";
            if (picked === null) cls += " border-white/10 hover:border-primary hover:bg-primary/10";
            else if (isCorrect) cls += " border-green-500 bg-green-500/20";
            else if (isPicked) cls += " border-red-500 bg-red-500/20";
            else cls += " border-white/10 opacity-50";
            return (
              <button key={idx} onClick={() => pick(idx)} disabled={picked !== null} className={cls}>
                {c}
              </button>
            );
          })}
        </div>
        {picked !== null && q.explanation_ar && (
          <div className="p-3 rounded-md bg-white/5 border border-white/10 text-sm">
            💡 {q.explanation_ar}
          </div>
        )}
        {picked !== null && (
          <button onClick={next} className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium w-full">
            {i + 1 >= questions.length ? "إظهار النتيجة" : "السؤال التالي"}
          </button>
        )}
      </div>
    </div>
  );
}
