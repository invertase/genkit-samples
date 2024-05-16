import { generate, GenerateOptions, GenerateResponse } from "@genkit-ai/ai";
import { z } from "zod";

export interface GenerateWithRetryOptions<O extends z.ZodTypeAny = z.ZodTypeAny>
  extends GenerateOptions<O> {
  retries: number;
  customValidation?: (
    response: GenerateResponse<z.infer<O>>
  ) => Promise<boolean>;
  delayMs?: number;
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function parseError(error: unknown): Error {
  return isError(error) ? error : new Error("Unknown error");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function simpleGenerateWithRetry<
  O extends z.ZodTypeAny = z.ZodTypeAny
>(options: GenerateWithRetryOptions<O>): Promise<GenerateResponse<z.infer<O>>> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      const response = await generate(options);
      if (
        options.customValidation &&
        !(await options.customValidation(response))
      ) {
        throw new Error("Validation failed");
      }
      return response;
    } catch (error) {
      lastError = parseError(error);
      if (attempt < options.retries) {
        await delay(options.delayMs ?? 500);
      }
    }
  }

  throw lastError;
}
