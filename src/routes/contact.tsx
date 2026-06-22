import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { sendContact } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact — Devoiratouna" }, { property: "og:url", content: "/contact" }],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await sendContact({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: String(fd.get("message") ?? ""),
        },
      });
      setDone(true);
      toast.success(t.sent);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t.contact}</h1>
      <form onSubmit={onSubmit} className="glass p-6 space-y-4">
        <input name="name" required placeholder={t.name}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2" />
        <input name="email" type="email" required placeholder={t.email}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2" />
        <input name="subject" placeholder={t.subject_field}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2" />
        <textarea name="message" required placeholder={t.message} rows={6}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2" />
        <button disabled={busy} className="bg-primary text-primary-foreground font-bold px-5 py-2 rounded-md disabled:opacity-50">
          {busy ? "..." : t.send}
        </button>
        {done && <p className="text-emerald text-sm">{t.sent}</p>}
      </form>
    </div>
  );
}
