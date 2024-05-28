import { geminiPro, googleAI } from '@genkit-ai/googleai';
import { configureGenkit } from '@genkit-ai/core';
import { definePrompt } from '@genkit-ai/dotprompt';
import { defineFlow, run } from '@genkit-ai/flow';

import * as z from 'zod';

import { PapersService } from './paper';

configureGenkit({
  plugins: [googleAI()],
  enableTracingAndMetrics: true,
  logLevel: 'debug',
});

const cleanPrompt = definePrompt(
  {
    name: 'cleanPrompt',
    model: geminiPro,
    input: {
      schema: z.object({
        content: z.string(),
      }),
    },
    output: {
      format: 'text',
    },
  },
  `The following text has been extracted from a PDF file, it contains unwanted symbols, analyze it and remove anything that is not a natural language.

  Do not attempt to alter the content, only clean it.
  
  Content: {{content}}`
);
const summarizePrompt = definePrompt(
  {
    name: 'summarizePrompt',
    model: geminiPro,
    input: {
      schema: z.object({
        title: z.string(),
        content: z.string(),
        abstract: z.string(),
      }),
    },
    output: {
      format: 'text',
    },
  },
  `Based on the following information of an academic research paper, suggest the categories of the paper among "Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Deep Learning", "Bayesian Learning", "Optimization and Learning Algorithms", "Explainable AI and Interpretability", "Fairness, Bias, and Ethics", "Natural Language Processing", "Computer Vision", "Speech Recognition and Synthesis", "Time Series Analysis and Forecasting", "Recommender Systems", "Network Analysis and Graph Mining", "Bioinformatics and Computational Biology", "Robotics and Control", "Security and Privacy", "Optimization and Decision Making", "Human-Computer Interaction (HCI) and User Interfaces", and "Emerging Applications of Machine Learning".

  Title: {{title}}
  Abstract: {{abstract}}

  Based on the following content, summarize the paper effectively.

  Content: {{content}}
  
  Your response should be formatted in a valid JSON as {"summary": string, "categories": string[]}`
);

export const papersFlow = defineFlow(
  {
    name: 'papersFlow',
    inputSchema: z.string(),
    outputSchema: z.string().array()
  },
  async (date) => {
    const papersService = new PapersService();

    // Step 1: Fetch papers by date
    const papers = await run('fetch-papers', async () => {
      const dateObj = new Date(date);
      const papers = await papersService.getPapersByDate(dateObj);
      return papers.splice(0, 1);
    });

    // Step 2: Clean the text extracted from PDFs
    const cleanPapers = await run('clean-papers', async () => {
      const outputs: any[] = [];

      for (const paper of papers) {
        const chunks = await papersService.extractTextFromPdf(paper.arxiv);

        const cleanChunks = [];

        for (const chunk of chunks) {
          const cleanedText = await cleanPrompt.generate({
            input: {
              content: chunk,
            },
          });

          cleanChunks.push(cleanedText.text());
          await new Promise((r) => setTimeout(r, 2000));
        }

        paper.content = cleanChunks.join(' ');
        outputs.push(paper);

        await new Promise((r) => setTimeout(r, 5000));
      }

      return outputs;
    });

    // Step 3: Generate summaries
    const generateSummaries = await run('generate-summaries', async () => {
      const outputs: any[] = [];

      for (const paper of cleanPapers) {
        const summary = await summarizePrompt.generate({
          input: {
            title: paper.title,
            abstract: paper.summary,
            content: paper.content,
          },
        });

        outputs.push(summary.output());
        await new Promise((r) => setTimeout(r, 5000));
      }

      return outputs;
    });

    return generateSummaries;
  }
);
