/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { initializeGenkit } from "@genkit-ai/core";
import { generate } from "@genkit-ai/ai";
import { geminiPro as googleGeminiPro } from "@genkit-ai/googleai";
import { durableFlow } from "@genkit-ai/flow/experimental";
import { MessageData } from "@genkit-ai/ai/model";
import * as z from "zod";
import config from "./genkit.conf";

// Initialize Genkit
initializeGenkit(config);

// Keep history of messages
const history: MessageData[] = [];

export const basicChat = durableFlow(
  {
    name: "basic-chat",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    // Generate a response from the model
    const llmResponse = (
      await generate({ model: googleGeminiPro, prompt, history })
    ).text();

    // Update the history with the user and model messages
    history.push({
      content: [{ text: prompt }],
      role: "user",
    });

    history.push({
      content: [{ text: llmResponse }],
      role: "model",
    });

    // Return the model response
    return llmResponse;
  }
);
