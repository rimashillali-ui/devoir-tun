import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AdminCtx = { userId: string; supabase: SupabaseClient<Database> };

async function assertAdmin(ctx: AdminCtx) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Forbidden");
}

// ===== Documents =====
const docSchema = z.object({
  id: z.string().uuid().optional(),
  level: z.string(),
  track: z.string().nullable().optional(),
  subject: z.string(),
  section: z.string(),
  term: z.string().nullable().optional(),
  exam_slot: z.string().nullable().optional(),
  title_ar: z.string().min(1),
  title_fr: z.string().min(1),
  subtitle_ar: z.string().nullable().optional(),
  subtitle_fr: z.string().nullable().optional(),
  source_url: z.string().url(),
  video_url: z.string().url().nullable().optional(),
  sort_order: z.number().int().optional(),
});


export const saveDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof docSchema>) => docSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("documents").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase.from("documents").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { items: { id: string; sort_order: number }[] }) =>
    z.object({ items: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int() })).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    for (const it of data.items) {
      const { error } = await context.supabase.from("documents").update({ sort_order: it.sort_order }).eq("id", it.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ===== Articles =====
const articleSchema = z.object({
  id: z.string().uuid().optional(),
  level: z.string().nullable().optional(),
  track: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  section: z.string(),
  title_ar: z.string().min(1),
  title_fr: z.string().nullable().optional(),
  subtitle_ar: z.string().nullable().optional(),
  subtitle_fr: z.string().nullable().optional(),
  content_html_ar: z.string().min(1),
  content_html_fr: z.string().nullable().optional(),
});


export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof articleSchema>) => articleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("articles").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase.from("articles").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Ads =====
const adSchema = z.object({
  slot: z.string(),
  provider: z.string(),
  code_html: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  link_url: z.string().nullable().optional(),
  enabled: z.boolean(),
});

export const saveAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof adSchema>) => adSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ads").upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: "slot" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Pages =====
const pageSchema = z.object({
  slug: z.string(),
  title_ar: z.string(),
  title_fr: z.string(),
  content_html_ar: z.string(),
  content_html_fr: z.string(),
});

export const savePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof pageSchema>) => pageSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("pages").upsert({ ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Settings =====
export const saveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: unknown }) =>
    z.object({ key: z.string(), value: z.any() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("site_settings").upsert({
      key: data.key,
      value_json: data.value,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Contact (public) =====
export const sendContact = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; subject?: string; message: string }) =>
    z
      .object({
        name: z.string().min(1).max(200),
        email: z.string().email().max(200),
        subject: z.string().max(200).optional(),
        message: z.string().min(1).max(5000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { createPublicServerClient } = await import("@/integrations/supabase/public-server-client");
    const supabasePublic = createPublicServerClient();
    const { error } = await supabasePublic.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject ?? null,
      message: data.message,
      read: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Contact admin list/update =====
export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markMessageRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; read: boolean }) =>
    z.object({ id: z.string().uuid(), read: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("contact_messages").update({ read: data.read }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Roles (vérification admin côté serveur, puis écriture privilégiée) =====
export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin")
      .order("created_at");
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((r) => r.user_id);
    const emails = new Map<string, string | null>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, email").in("id", ids);
      for (const p of profs ?? []) emails.set(p.id, p.email);
    }
    return (data ?? []).map((r) => ({
      user_id: r.user_id,
      role: "admin" as const,
      created_at: r.created_at,
      profiles: { email: emails.get(r.user_id) ?? null },
    }));
  });

export const promoteByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prof) throw new Error("Utilisateur introuvable (doit avoir un compte)");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: prof.id, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Vous ne pouvez pas vous révoquer vous-même");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });





