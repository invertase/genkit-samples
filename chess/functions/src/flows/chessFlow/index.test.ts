import { chessStepsFunction } from "./stepFunction";
import { simpleGenerateWithRetry } from "../../utils/retry";

jest.mock("../../utils/retry", () => ({
  simpleGenerateWithRetry: jest.fn(),
}));

const mockChessInstance = {
  reset: jest.fn(),
  isGameOver: jest.fn().mockReturnValue(false),
  moves: jest.fn().mockReturnValue(["a4", "a5"]),
  move: jest.fn().mockImplementation(() => true),
  fen: jest.fn().mockReturnValue("fen_string"),
  pgn: jest.fn().mockReturnValue("pgn_string"),
};

jest.mock("chess.js", () => {
  return {
    __esModule: true,
    Chess: jest.fn().mockImplementation(() => mockChessInstance),
  };
});

describe("chessStepFunction", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await chessStepsFunction({ move: "reset" });
  });

  test("should reset the game when move is reset", async () => {
    const response = await chessStepsFunction({ move: "reset" });
    expect(response).toEqual({
      moveInPGNNotation: "",
      reasoning: "Game reset",
      trashTalk:
        "Hello! I am Gemini and I play chess. Make your move if you dare!",
      availableMoves: ["a4", "a5"],
      gameHistory: [],
      position: "fen_string",
      gameId: expect.any(String),
      gameOver: false,
    });
    expect(mockChessInstance.reset).toHaveBeenCalled();
  });

  test("should process a valid move and call LLM for next move", async () => {
    (simpleGenerateWithRetry as jest.Mock).mockResolvedValueOnce({
      output: jest.fn().mockReturnValue({
        moveInPGNNotation: "e5",
        reasoning: "Best strategic move",
        trashTalk: "Checkmate soon",
      }),
    });

    const response = await chessStepsFunction({ move: "e4" });

    expect(simpleGenerateWithRetry).toHaveBeenCalled();
    expect(response).toEqual({
      moveInPGNNotation: "e5",
      reasoning: "Best strategic move",
      trashTalk: "Checkmate soon",
      availableMoves: ["a4", "a5"],
      gameId: expect.any(String),
      gameOver: false,
      gameHistory: ["e4", "e5"],
      position: "fen_string",
    });
    expect(mockChessInstance.move).toHaveBeenCalledWith("e4");
    expect(mockChessInstance.move).toHaveBeenCalledWith("e5");
  });

  test("should throw an error if LLM returns no valid output", async () => {
    (simpleGenerateWithRetry as jest.Mock).mockResolvedValueOnce({
      output: jest.fn().mockReturnValue(null),
    });

    expect(await chessStepsFunction({ move: "e2" })).toBe({
      availableMoves: ["a4", "a5"],
      errorCode: 500,
      gameHistory: ["e2"],
      gameId: "LBfITcr2re9jAZgpMcBs",
      gameOver: false,
      moveInPGNNotation: "",
      position: "fen_string",
      reasoning: "No output from LLM",
      trashTalk: "",
    });
  });
});
