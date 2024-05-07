import { generate } from "@genkit-ai/ai";
import { initializeGenkit } from "@genkit-ai/core";
import { defineFlow } from "@genkit-ai/flow";
import { geminiPro } from "@genkit-ai/vertexai";
import * as z from "zod";
import config from "./genkit.config.js";

// Initialize Genkit
initializeGenkit(config);

// This flow writes code for a flow that does the task given in the input
export const flowception = defineFlow(
  {
    name: "flowception",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (task) => {
    const llmResponse = await generate({
      prompt: flowPromptTemplate(task),
      model: geminiPro,
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text();
  }
);

const introductionToGenkit = `
Project Genkit is a code-first GenAI app development framework in typescript,
that empowers app developers to easily build production-ready
AI apps and seamlessly deploy and monitor them with Google Cloud.
It is composed of libraries and dev tools intended for development
of server-side AI features.
`;

const exampleOfAFlow = `
Here is an example of a simple flow that you can use to generate a joke: \n\n
import { generate } from "@genkit-ai/ai";
import { initializeGenkit } from "@genkit-ai/core";
import { defineFlow } from "@genkit-ai/flow";
import { geminiPro } from "@genkit-ai/vertexai";
import * as z from "zod";
import config from "./genkit.config.js";
initializeGenkit(config);
export const jokeFlow = defineFlow(
{
  name: "flowFlow",
  inputSchema: z.string(),
  outputSchema: z.string(),
},
async (subject) => {
  const llmResponse = await generate({
    prompt: \`Tell me a joke about \$\{subject\}\`,
    model: geminiPro,
    config: {
      temperature: 1,
    },
  });

  return llmResponse.text();
}
);
`;

const flowPromptTemplate = (task: string) => {
  const instructionPrompt = `
  Give me typescript code that defines a flow that ${task}. You should enclose the code for the flow in tags <CODE> </CODE>, and make sure to include the necessary imports. Enclose the imports in <IMPORTS></IMPORTS>\n
  You are allowed to use Node.js libraries that aren't part of the Genkit framework.\n Return ONLY the code, do not include any comments. Do not include the initializeGenkit call.
  `;

  const generateInstructions = `
  If in your code you would like to prompt an AI model to generate text, you can use the generate function from the @genkit-ai/ai library. The generate function takes an object with the following properties:
  - prompt: a string that is the prompt to the AI model
  - model: the AI model to use (always use geminiPro)
  - config: an object with the following properties:
  - temperature: a number between 0 and 1 that controls the randomness of the generated text

  It will return a promise that resolves to an object with a text: void => string method, which returns the generated text.
  `;

  return `${introductionToGenkit} \n\n ${exampleOfAFlow} \n\n ${instructionPrompt} \n\n ${generateInstructions}`;
};