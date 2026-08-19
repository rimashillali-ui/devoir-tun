import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchDocuments from "./tools/search-documents";
import getDocument from "./tools/get-document";
import searchArticles from "./tools/search-articles";

const SUPABASE_URL =
  process.env["VITE_SUPABASE_URL"] ?? "https://abckrmjptqxgmyzaxvam.supabase.co";

export default defineMcp({
  name: "devoiratouna-mcp",
  title: "Devoiratouna",
  version: "0.1.0",
  // Require a verified OAuth (Supabase-issued) bearer token for every MCP call.
  auth: auth.oauth.issuer({
    issuer: `${SUPABASE_URL}/auth/v1`,
    jwksUri: `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    acceptedAudiences: ["authenticated"],
    resourceName: "Devoiratouna MCP",
  }),
  instructions:
    "Search and retrieve public Tunisian educational content (documents, exams, articles) from Devoiratouna — دوفواراتنا.",
  tools: [searchDocuments, getDocument, searchArticles],
});

