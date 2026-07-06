import { defineMcp } from "@lovable.dev/mcp-js";
import searchDocuments from "./tools/search-documents";
import getDocument from "./tools/get-document";
import searchArticles from "./tools/search-articles";

export default defineMcp({
  name: "devoiratouna-mcp",
  title: "Devoiratouna",
  version: "0.1.0",
  instructions:
    "Search and retrieve public Tunisian educational content (documents, exams, articles) from Devoiratouna — دوفواراتنا.",
  tools: [searchDocuments, getDocument, searchArticles],
});
