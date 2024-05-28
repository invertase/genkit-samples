import { generate, Tool } from "@genkit-ai/ai";
import { initializeGenkit } from "@genkit-ai/core";
import { defineFlow, runFlow } from "@genkit-ai/flow";
import { geminiPro } from "@genkit-ai/vertexai";
import * as z from "zod";
import config from "./genkit.config.js";
import { BrowserNavigator } from "./BrowserNavigator";
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from "node-html-markdown";
import { chunkMarkdown } from "./MarkdownChunker";

const navigatorSchema = z.instanceof(BrowserNavigator);

initializeGenkit(config);

export const totalFlow = defineFlow(
  {
    name: "totalFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const navigator = new BrowserNavigator();
    await navigator.launchBrowser();

    const searchTerm = await runFlow(getSearchTermFlow, prompt);

    const searchResults = await runFlow(performSearchFlow, {
      searchTerm,
      navigator,
    });

    const firstResult = searchResults[0];

    await navigator.navigateToUrl(firstResult);

    const html = await runFlow(extractHtmlFlow, { navigator });

    const cleanedHtml = await runFlow(cleanHtmlFlow, {
      html,
      originalPrompt: prompt,
    });

    await navigator.closeBrowser();

    return cleanedHtml;
  }
);

const getSearchTermFlow = defineFlow(
  {
    name: "getSearchTermFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const result = await generate({
      model: geminiPro,
      prompt: `Come up with a search term to help you respond to the following: ${prompt}.`,
    });

    return result.text();
  }
);

const performSearchFlow = defineFlow(
  {
    name: "performSearchFlow",
    inputSchema: z.object({
      searchTerm: z.string(),
      navigator: navigatorSchema,
    }),
    outputSchema: z.array(z.string()),
  },
  async ({ searchTerm, navigator }) => {
    await navigator.navigateToUrl(
      "https://www.google.com/search?q=" + searchTerm
    );

    const el = await navigator.findElementByText("Accept all");

    if (el) {
      await el.click();
    }

    const hrefs = await navigator.getAllLinks();

    const usefulHrefs = hrefs
      .filter((href) => href.includes("https://"))
      .filter((href) => !href.includes("google"))
      .filter((href) => !href.includes("youtube.com"));

    return usefulHrefs;
  }
);

const extractHtmlFlow = defineFlow(
  {
    name: "extractHtmlFlow",
    inputSchema: z.object({ navigator: navigatorSchema }),
    outputSchema: z.string(),
  },
  async ({ navigator }) => {
    const bodyElement = await navigator.getBodyElement();

    const html = await bodyElement.innerHTML();

    return html;
  }
);

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];

  // Loop through the text and slice it into chunks of the specified size
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }

  return chunks;
}

const isRelevantFlow = defineFlow(
  {
    name: "isRelevantFlow",
    inputSchema: z.object({ header: z.string(), prompt: z.string() }),
    outputSchema: z.boolean(),
  },
  async ({ header, prompt }) => {
    const result = await generate({
      model: geminiPro,
      prompt: `This is a header for a section of text: ${header}. The following is a prompt: ${prompt}. Is the text likely to be relevant to the prompt? Reply with "YES" or "NO" ONLY. do not reply with anything other than "YES" or "NO".`,
    });

    return result.text().toLowerCase().includes("YES");
  }
);

const summarizeFlow = defineFlow(
  {
    name: "summarizeFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (text) => {
    const result = await generate({
      model: geminiPro,
      prompt: `Summarize the following text: ${text}`,
    });

    return result.text();
  }
);

const cleanHtmlFlow = defineFlow(
  {
    name: "cleanHtmlFlow",
    inputSchema: z.object({ originalPrompt: z.string(), html: z.string() }),
    outputSchema: z.string(),
  },
  async ({ html, originalPrompt }) => {
    const markdown = NodeHtmlMarkdown.translate(html);

    const chunks = chunkMarkdown(markdown);

    const relevantChunks = chunks.filter((chunk) =>
      runFlow(isRelevantFlow, {
        header: chunk.header,
        prompt: originalPrompt,
      })
    );

    return relevantChunks.map((chunk) => chunk.header).join("\n\n");
  }
);
