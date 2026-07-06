import { createServerFn } from "@tanstack/react-start";

export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => {
    if (!input?.id || typeof input.id !== "string") throw new Error("id requis");
    return { id: input.id };
  })
  .handler(async ({ data }) => {
    // Route via le proxy public qui force Content-Disposition: attachment
    // (fonctionne pour raw.githack.com, github, etc.)
    return { url: `/api/public/documents/${data.id}/download` };
  });
