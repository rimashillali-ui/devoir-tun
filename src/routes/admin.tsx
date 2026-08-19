import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentsAdmin } from "@/components/admin/DocumentsAdmin";
import { ArticlesAdmin } from "@/components/admin/ArticlesAdmin";
import { AdsAdmin } from "@/components/admin/AdsAdmin";
import { PagesAdmin } from "@/components/admin/PagesAdmin";
import { SettingsAdmin } from "@/components/admin/SettingsAdmin";
import { RolesAdmin } from "@/components/admin/RolesAdmin";
import { MessagesAdmin } from "@/components/admin/MessagesAdmin";
import { QuizAdmin } from "@/components/admin/QuizAdmin";
import { TutorDocsAdmin } from "@/components/admin/TutorDocsAdmin";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Devoiratouna" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useLang();
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { nav({ to: "/auth" }); return; }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      if (!r) { nav({ to: "/auth" }); return; }
      setOk(true); setReady(true);
    })();
  }, [nav]);

  if (!ready) return <p className="text-muted-foreground">{t.loading}</p>;
  if (!ok) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t.admin}</h1>
      <Tabs defaultValue="documents">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="ads">Pubs</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="tutor">Cours IA</TabsTrigger>
        </TabsList>
        <TabsContent value="documents"><DocumentsAdmin /></TabsContent>
        <TabsContent value="articles"><ArticlesAdmin /></TabsContent>
        <TabsContent value="ads"><AdsAdmin /></TabsContent>
        <TabsContent value="pages"><PagesAdmin /></TabsContent>
        <TabsContent value="settings"><SettingsAdmin /></TabsContent>
        <TabsContent value="roles"><RolesAdmin /></TabsContent>
        <TabsContent value="quiz"><QuizAdmin /></TabsContent>
        <TabsContent value="messages"><MessagesAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}
