import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/documents/$id/download")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { serveDocumentFile } = await import("@/lib/document-file-proxy.server");
        return serveDocumentFile(params.id, "download");
      },
    },
  },
});
