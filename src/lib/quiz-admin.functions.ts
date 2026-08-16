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

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  level: z.string().min(1),
  subject: z.string().min(1),
  question_ar: z.string().min(1).max(2000),
  choices: z.array(z.string().min(1).max(500)).min(2).max(8),
  correct_index: z.number().int().min(0),
  explanation_ar: z.string().max(4000).nullable().optional(),
  sort_order: z.number().int().optional(),
});

export const saveQuizQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof questionSchema>) => questionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.correct_index >= data.choices.length) throw new Error("Index de bonne réponse invalide");
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("quiz_questions").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase
      .from("quiz_questions")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteQuizQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("quiz_questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
