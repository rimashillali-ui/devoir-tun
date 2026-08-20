import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { submitUploadToDrive, type UploadSubmission } from "./uploads.server";

export const submitUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: UploadSubmission) => data)
  .handler(async ({ data, context }) => {
    return submitUploadToDrive(data, (context as any).claims?.email ?? null);
  });
