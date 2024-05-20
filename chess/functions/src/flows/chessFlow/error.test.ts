import { chessStepsFunction } from "./stepFunction";
import { simpleGenerateWithRetry } from "../../utils/retry";

// Mock Firebase Admin SDK
jest.mock("firebase-admin", () => {
  const firestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnValue({ moves: [] }),
    exists: jest.fn().mockReturnValue(true),
  };
  return {
    initializeApp: jest.fn(),
    firestore: jest.fn().mockReturnValue(firestore),
  };
});

// Mock simpleGenerateWithRetry
jest.mock("../../utils/retry", () => ({
  simpleGenerateWithRetry: jest.fn(),
}));

describe("chessStepsFunction", () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await chessStepsFunction({ move: "reset", gameId: "testGameId" });
  });

  test("should return 429 error when rate limit is exceeded", async () => {
    (simpleGenerateWithRetry as jest.Mock).mockRejectedValueOnce(
      new Error("429")
    );

    const result = await chessStepsFunction({
      move: "e4",
      gameId: "testGameId",
    });

    expect(result).toEqual({
      errorCode: 429,
      moveInPGNNotation: "",
      reasoning: "Rate limit exceeded. Please try again later.",
      trashTalk: "",
      availableMoves: expect.any(Array),
      gameHistory: expect.any(Array),
      position: expect.any(String),
      gameId: "testGameId",
      gameOver: false,
    });
  });

  test("should return 500 error on internal server error", async () => {
    (simpleGenerateWithRetry as jest.Mock).mockRejectedValueOnce(
      new Error("Internal Server Error")
    );

    const result = await chessStepsFunction({
      move: "e4",
      gameId: "testGameId",
    });

    expect(result).toEqual({
      errorCode: 500,
      moveInPGNNotation: "",
      reasoning: "Internal Server Error",
      trashTalk: "",
      availableMoves: expect.any(Array),
      gameHistory: expect.any(Array),
      position: expect.any(String),
      gameId: "testGameId",
      gameOver: false,
    });
  });
});
