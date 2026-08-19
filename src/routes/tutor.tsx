import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { supabase } from "@/integrations/supabase/client";
import { askTutor } from "@/lib/tutor.functions";
import { BackButton } from "@/components/BackButton";
import { Sparkles, Send, Loader2, RotateCcw, GraduationCap, LogIn, Wifi } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "Tuteur IA — Maths & Physique | Devoiratouna" },
      {
        name: "description",
        content:
          "Assistant pédagogique IA pour les élèves tunisiens de 9ème année et du Bac : révise les Mathématiques et la Physique-Chimie pas à pas.",
      },
      { property: "og:title", content: "Tuteur IA — Maths & Physique | Devoiratouna" },
      {
        property: "og:description",
        content: "Un professeur virtuel qui te guide étape par étape, selon le programme tunisien.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/tutor" }],
  }),
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };
type Level = "9" | "bac";

const STORE = "dt_tutor_chat_v1";

function Bubble({ m }: { m: Msg }) {
  const mine = m.role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          mine
            ? "bg-cyan text-background font-medium rounded-br-sm"
            : "glass border border-white/10 rounded-bl-sm"
        }`}
      >
        {mine ? (
          <p className="whitespace-pre-wrap">{m.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-pre:bg-black/40">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {m.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TutorPage() {
  const run = useServerFn(askTutor);
  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");
  const [level, setLevel] = useState<Level | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthState(data.user ? "in" : "out"));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthState(s?.user ? "in" : "out"));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Restauration de la conversation
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return;
      const saved = JSON.parse(raw) as { level: Level | null; messages: Msg[] };
      if (saved.level) setLevel(saved.level);
      if (Array.isArray(saved.messages)) setMessages(saved.messages);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORE, JSON.stringify({ level, messages }));
  }, [level, messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy || !level) return;
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setBusy(true);
    const notice = setTimeout(() => setSwitching(true), 6000);
    try {
      const res = await run({ data: { level, messages: history } });
      if (res.fellBack) setSwitching(true);
      setMessages([...history, { role: "assistant", content: res.content }]);
    } catch (err: any) {
      toast.error(err?.message ?? "L'assistant est indisponible.");
      setMessages(history);
    } finally {
      clearTimeout(notice);
      setSwitching(false);
      setBusy(false);
    }
  }

  function reset() {
    setMessages([]);
    if (typeof window !== "undefined") localStorage.removeItem(STORE);
  }

  if (authState === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
      </div>
    );
  }

  if (authState === "out") {
    return (
      <div className="max-w-md mx-auto glass p-8 text-center space-y-4">
        <Sparkles className="h-9 w-9 text-cyan mx-auto" />
        <h1 className="text-2xl font-bold">Tuteur IA réservé aux inscrits</h1>
        <p className="text-sm text-muted-foreground">
          Crée ton compte gratuit ou connecte-toi pour discuter avec ton professeur virtuel de Maths et
          Physique-Chimie.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 bg-cyan text-background font-bold px-4 py-2.5 rounded-lg"
        >
          <LogIn className="h-4 w-4" /> Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <BackButton to="/" />

      <header className="glass p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-black">Tuteur IA — Maths & Physique</h1>
            <p className="text-xs text-muted-foreground">Programme tunisien · explications pas à pas</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-white/10 rounded-lg px-3 py-2"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Nouvelle discussion
          </button>
        )}
      </header>

      {!level ? (
        <div className="glass p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald" />
            <h2 className="font-bold">Choisis ton niveau</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { id: "9" as Level, title: "9ème année de base", desc: "Bases simples et exemples concrets" },
              { id: "bac" as Level, title: "Baccalauréat", desc: "Rigueur de l'examen national" },
            ]).map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className="text-start glass border border-white/10 hover:border-cyan/40 hover:-translate-y-0.5 transition-all p-4 rounded-xl"
              >
                <p className="font-bold">{l.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">
              Niveau : {level === "9" ? "9ème année" : "Baccalauréat"}
            </span>
            <button onClick={() => setLevel(null)} className="hover:text-foreground underline">
              changer
            </button>
          </div>

          <div className="glass p-4 space-y-4 min-h-[45vh] max-h-[60vh] overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-10 space-y-2">
                <p>Pose ta question de Maths ou de Physique-Chimie.</p>
                <p className="text-xs">
                  Exemple : « Comment résoudre une équation du second degré ? » ou « Explique la poussée
                  d'Archimède »
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <Bubble key={i} m={m} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-cyan" />
                {switching ? (
                  <span className="flex items-center gap-1.5 text-amber">
                    <Wifi className="h-3.5 w-3.5" /> Optimisation de la connexion...
                  </span>
                ) : (
                  <span>Le professeur réfléchit…</span>
                )}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="glass p-3 flex items-end gap-2 sticky bottom-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(e as unknown as React.FormEvent);
                }
              }}
              rows={2}
              placeholder="Écris ta question…"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan/50 resize-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="bg-cyan text-background font-bold h-11 w-11 rounded-lg flex items-center justify-center disabled:opacity-40"
              aria-label="Envoyer"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          <p className="text-[11px] text-muted-foreground text-center">
            L'assistant guide sans donner la solution finale. Vérifie toujours avec ton cours.
          </p>
        </>
      )}
    </div>
  );
}
