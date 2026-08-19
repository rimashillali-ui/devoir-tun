import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useLang, pickTitle } from "@/lib/i18n";
import { ARTICLE_SECTIONS, ARABIC_ONLY_SECTIONS, TERMS, getExamSlots, type Term } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, Video, FileText } from "lucide-react";
import { AdSlot } from "./AdSlot";

type Doc = {
  id: string;
  title_ar: string;
  title_fr: string;
  subtitle_ar: string | null;
  subtitle_fr: string | null;
  
  video_url: string | null;
  term: string | null;
  exam_slot: string | null;
  sort_order?: number | null;
};
type Article = { id: string; title_ar: string; title_fr: string | null; subtitle_ar: string | null; subtitle_fr: string | null };


export function SectionContent({
  level, track, subject, section,
}: { level: string; track?: string | null; subject: string; section: string }) {
  const { t, lang } = useLang();
  const isArticle = ARTICLE_SECTIONS.has(section);
  const arabicOnly = ARABIC_ONLY_SECTIONS.has(section);

  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    if (isArticle) {
      let q = supabase.from("articles").select("id,title_ar,title_fr,subtitle_ar,subtitle_fr")
        .eq("section", section).order("created_at", { ascending: false });

      if (level) q = q.eq("level", level);
      if (track) q = q.eq("track", track); else q = q.is("track", null);
      if (subject) q = q.eq("subject", subject);
      q.then(({ data }) => setArticles((data ?? []) as Article[]));
    } else {
      let q = supabase.from("documents").select("id,title_ar,title_fr,subtitle_ar,subtitle_fr,video_url,term,exam_slot,sort_order")
        .eq("level", level).eq("subject", subject).eq("section", section)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (track) q = q.eq("track", track); else q = q.is("track", null);
      const sortLang = arabicOnly ? "ar" : lang;
      const manualOrder = section === "cours" || section === "series" || section === "texte";
      q.then(({ data }) => {
        const list = (data ?? []) as Doc[];
        if (!manualOrder) {
          list.sort((a, b) => sortKey(a, sortLang).localeCompare(sortKey(b, sortLang), undefined, { numeric: true, sensitivity: "base" }));
        }
        setDocs(list);
      });
    }
  }, [level, track, subject, section, isArticle, arabicOnly, lang]);

  const dir = arabicOnly ? "rtl" : undefined;
  const useLang2 = arabicOnly ? "ar" : lang;

  return (
    <div dir={dir} className="space-y-6">
      <h1 className="text-3xl font-bold">{t.subjects[subject] ?? subject} — {t.sections[section] ?? section}</h1>
      <AdSlot slot="header" className="my-4 flex justify-center" />

      {isArticle ? (
        <ArticleList items={articles} lang={useLang2} />
      ) : section === "devoirs" ? (
        <DevoirsTabs docs={docs} subject={subject} level={level} lang={useLang2} />
      ) : section === "cours" || section === "series" ? (
        <TermTabs docs={docs} lang={useLang2} />
      ) : (
        <DocList docs={docs} lang={useLang2} />
      )}

      <AdSlot slot="footer" className="my-4 flex justify-center" />
    </div>
  );
}

function sortKey(d: Doc, lang: "ar" | "fr") {
  return pickTitle(lang, d.title_ar, d.title_fr) ?? "";
}

function TermTabs({ docs, lang }: { docs: Doc[] | null; lang: "ar" | "fr" }) {
  const { t } = useLang();
  if (docs === null) return <p className="text-muted-foreground">{t.loading}</p>;
  return (
    <Tabs defaultValue="T1" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        {TERMS.map((tm) => (<TabsTrigger key={tm} value={tm}>{t.terms[tm]}</TabsTrigger>))}
      </TabsList>
      {TERMS.map((tm) => {
        const list = docs.filter((d) => d.term === tm);
        return (
          <TabsContent key={tm} value={tm} className="mt-4">
            {list.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">{t.no_content}</p>
            ) : (
              <DocList docs={list} lang={lang} />
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function DocList({ docs, lang }: { docs: Doc[] | null; lang: "ar" | "fr" }) {
  const { t } = useLang();
  if (docs === null) return <p className="text-muted-foreground">{t.loading}</p>;
  if (docs.length === 0) return <p className="text-muted-foreground py-12 text-center">{t.no_content}</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map((d) => (
        <div key={d.id} className="glass p-5 space-y-3 flex flex-col">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-cyan shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold">{pickTitle(lang, d.title_ar, d.title_fr)}</h3>
              {pickTitle(lang, d.subtitle_ar, d.subtitle_fr) && (
                <p className="text-xs text-muted-foreground mt-1">{pickTitle(lang, d.subtitle_ar, d.subtitle_fr)}</p>
              )}
            </div>
            {d.video_url && <Video className="h-4 w-4 text-rose" aria-label="vidéo" />}
          </div>

          <Link
            to="/preview/$id"
            params={{ id: d.id }}
            className="mt-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
          >
            <Eye className="h-4 w-4" /> {t.preview}
          </Link>
        </div>
      ))}
    </div>
  );
}

function ArticleList({ items, lang }: { items: Article[] | null; lang: "ar" | "fr" }) {
  const { t } = useLang();
  if (items === null) return <p className="text-muted-foreground">{t.loading}</p>;
  if (items.length === 0) return <p className="text-muted-foreground py-12 text-center">{t.no_content}</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((a) => (
        <Link key={a.id} to="/article/$id" params={{ id: a.id }} className="glass glass-hover p-5">
          <h3 className="font-bold text-lg">{pickTitle(lang, a.title_ar, a.title_fr)}</h3>
          {pickTitle(lang, a.subtitle_ar, a.subtitle_fr) && (
            <p className="text-sm text-muted-foreground mt-1">{pickTitle(lang, a.subtitle_ar, a.subtitle_fr)}</p>
          )}
        </Link>
      ))}

    </div>
  );
}

function DevoirsTabs({ docs, subject, level, lang }: { docs: Doc[] | null; subject: string; level: string; lang: "ar" | "fr" }) {
  const { t } = useLang();
  if (docs === null) return <p className="text-muted-foreground">{t.loading}</p>;
  return (
    <Tabs defaultValue="T1" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        {TERMS.map((tm) => (<TabsTrigger key={tm} value={tm}>{t.terms[tm]}</TabsTrigger>))}
      </TabsList>
      {TERMS.map((tm) => (
        <TabsContent key={tm} value={tm} className="space-y-6 mt-4">
          {getExamSlots(subject, tm as Term, level).map((slot) => {
            const list = docs.filter((d) => d.term === tm && d.exam_slot === slot);
            return (
              <div key={slot}>
                <h3 className="text-lg font-bold mb-3">{slot}</h3>
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.no_content}</p>
                ) : (
                  <DocList docs={list} lang={lang} />
                )}
              </div>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
}
