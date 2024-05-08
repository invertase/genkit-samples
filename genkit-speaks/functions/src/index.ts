import { SpeechClient } from "@google-cloud/speech";
import { z } from "zod";
import { onRequest } from "firebase-functions/v1/https";
import { configureGenkit, initializeGenkit } from "@genkit-ai/core";
import { onFlow } from "@genkit-ai/firebase/functions";
import { geminiPro } from "@genkit-ai/vertexai";
import { defineFlow, Flow, runFlow } from "@genkit-ai/flow";
import { generate } from "@genkit-ai/ai";
import { firebaseAuth } from "@genkit-ai/firebase/auth";
import e from "express";
import { firebase } from "@genkit-ai/firebase";
import { vertexAI } from "@genkit-ai/vertexai";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import * as admin from "firebase-admin";

process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

admin.initializeApp();

const db = admin.firestore();
const collection = db.collection("gemini_speaks");

const textToSpeechClient = new TextToSpeechClient();

initializeGenkit(
  configureGenkit({
    plugins: [firebase(), vertexAI({ location: "us-central1" })],
    logLevel: "debug",
    enableTracingAndMetrics: true,
  })
);

const bufferSchema = z.any();

// Zod schema to validate incoming data
const inputSchema = bufferSchema;

export const transcribeFlow = defineFlow(
  {
    name: "transcribeFlow",
    inputSchema: inputSchema,
    outputSchema: z.string(),
    // authPolicy: firebaseAuth((user) => {
    //   if (!user.email_verified) throw new Error('Requires verification!');
    // }),
    // httpsOptions: {
    // cors: "*",
    // },
  },
  async (buffer) => {
    const speechClient = new SpeechClient();

    const audioBytes = buffer;

    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: "MP3" as "MP3",
        sampleRateHertz: 16000,
        // sampleRateHertz: config.sampleRateHertz,
        languageCode: "en-US",
        // enableWordTimeOffsets: config.enableWordTimeOffsets,
      },
    };

    console.log("Transcribing audio...");
    try {
      const [response] = await speechClient.recognize(request);

      if (!response.results) {
        return "TRANSCRIPTION_FAILED";
      }

      // TODO: error handling etc here
      const transcription = response.results
        .map((result) => result.alternatives![0]!.transcript)
        .join("\n");
      return transcription;
    } catch (error) {
      console.error("Transcription failed:", error);
      return "TRANSCRIPTION_FAILED";
    }
  }
);

const doc = collection.doc("example");

export const respondFlow = defineFlow(
  {
    name: "respondFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (text) => {
    const { history } =
      (await doc.get()).data() || ({ history: [] } as { history: string[] });

    const response = await generate({
      model: geminiPro,
      prompt: text,
      history,
    });

    const newHistory = response.toHistory();

    doc.set({ history: newHistory });
    return response.text();
  }
);

export const synthesizerFlow = defineFlow(
  {
    name: "synthesizerFlow",
    inputSchema: z.string(),
    outputSchema: z.object({ synthesized: z.any(), text: z.string() }),
  },
  async (text) => {
    const request = {
      input: { text: text },
      // Select the language
      voice: { languageCode: "en-US" },
      // select the type of audio encoding
      audioConfig: { audioEncoding: "MP3" },
    };

    // Performs the text-to-speech request
    // @ts-ignore
    const [response] = await textToSpeechClient.synthesizeSpeech(request);

    return { synthesized: response.audioContent, text };
  }
);

export const transcribe = onRequest(async (req, res) => {
  const transcription = await runFlow(transcribeFlow, req.body);

  const response = await runFlow(respondFlow, transcription);

  const {synthesized, text} = await runFlow(synthesizerFlow, response);

  res.status(200).send({ text, synthesized });
});

// example of a utility function:
export const pipe = <
  IA extends z.ZodTypeAny,
  OA extends z.ZodTypeAny,
  S extends z.ZodTypeAny
>(
  currentFlow: Flow<IA, OA, S>
) => {
  return {
    f: function <OB extends z.ZodTypeAny>(nextFlow: Flow<OA, OB, S>) {
      const combinedFlow = defineFlow<IA, OB, S>(
        {
          name: `${currentFlow.name} -> ${nextFlow.name}`,
          inputSchema: currentFlow.inputSchema,
          outputSchema: nextFlow.outputSchema,
        },
        async (inputA: IA) => {
          const outputA = await runFlow(currentFlow, inputA);
          return await runFlow(nextFlow, outputA);
        }
      );
      return pipe(combinedFlow);
    },
    build: () => currentFlow,
  };
};

// This is the same as the previous example, but with a more functional approach
const totalFlow = pipe(transcribeFlow)
  .f(respondFlow)
  .f(synthesizerFlow)
  .build();

//  It would be nicer to have: const totalFlow = pipe(flow1,flow2,flow3) etc, harder to correctly type this though


// So now it could be like this:
export const transcribeAlternative = onRequest(async (req, res) => {
  const result = await runFlow(totalFlow, req.body);
  res.status(200).send(result);
});
