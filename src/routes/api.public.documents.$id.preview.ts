import { createFileRoute } from "@tanstack/react-router";
import { serveDocumentFile } from "@/lib/document-file-proxy.server";

export const Route = createFileRoute("/api/public/documents/$id/preview")({
  server: {
    handlers: {
      GET: async ({ params }) => serveDocumentFile(params.id, "preview"),
    },
  },
});
