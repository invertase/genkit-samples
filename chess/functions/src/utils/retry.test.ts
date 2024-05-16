import { generate } from "@genkit-ai/ai";
import { simpleGenerateWithRetry, GenerateWithRetryOptions } from "./retry";

jest.mock("@genkit-ai/ai", () => ({
  generate: jest.fn(),
}));

describe("simpleGenerateWithRetry", () => {
  const dummyResponse = { candidates: [], usage: {}, custom: {} };
  let options: GenerateWithRetryOptions;

  beforeEach(() => {
    options = {
      model: "test-model",
      prompt: "test-prompt",
      retries: 2,
      delayMs: 1000,
    };
    jest.clearAllMocks();
  });

  test("should return a successful response without retries", async () => {
    (generate as jest.Mock).mockResolvedValue(dummyResponse);
    const response = await simpleGenerateWithRetry(options);
    expect(response).toEqual(dummyResponse);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  test("should retry the specified number of times on failure", async () => {
    const error = new Error("Network error");
    (generate as jest.Mock)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue(dummyResponse);

    const response = await simpleGenerateWithRetry(options);
    expect(response).toEqual(dummyResponse);
    expect(generate).toHaveBeenCalledTimes(3);
  });

  test("should handle custom validation successfully", async () => {
    const customValidation = jest.fn().mockResolvedValue(true);
    options.customValidation = customValidation;
    (generate as jest.Mock).mockResolvedValue(dummyResponse);

    const response = await simpleGenerateWithRetry(options);
    expect(customValidation).toHaveBeenCalled();
    expect(response).toEqual(dummyResponse);
  });

  test("should throw after exceeding retry limit", async () => {
    const error = new Error("Persistent error");
    (generate as jest.Mock).mockRejectedValue(error);
    options.retries = 1; // Testing with only 1 retry

    await expect(simpleGenerateWithRetry(options)).rejects.toThrow(
      "Persistent error"
    );
    expect(generate).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });
  test("should enforce delay between retries", async () => {
    jest.useRealTimers(); // Use real timers to test the natural behavior
    const error = new Error("Timeout error");
    (generate as jest.Mock)
      .mockRejectedValueOnce(error) // First call fails
      .mockRejectedValueOnce(error) // Second call fails
      .mockResolvedValue(dummyResponse); // Third call succeeds

    const startTime = Date.now();
    const response = await simpleGenerateWithRetry(options);
    const endTime = Date.now();

    expect(response).toEqual(dummyResponse);
    expect(generate).toHaveBeenCalledTimes(3);
    expect(endTime - startTime).toBeGreaterThanOrEqual(2000); // Check if at least 2000 ms have passed (2 retries)
  }); // Increase timeout to accommodate real delays
});
