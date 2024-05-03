import { chessStepsFunction, gameHistory } from ".";
import { simpleGenerateWithRetry } from "../../utils/retry";

jest.mock("../../utils/retry", () => ({
  simpleGenerateWithRetry: jest.fn(),
}));

const mockChessInstance = {
  reset: jest.fn(),
  isGameOver: jest.fn().mockReturnValue(false),
  moves: jest.fn().mockReturnValue(["a4", "a5"]),
  move: jest.fn(),
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
  beforeEach(() => {
    gameHistory.length = 0; // Clear the game history
    jest.clearAllMocks();
  });

  test('should reset the game when move is "reset"', async () => {
    const response = await chessStepsFunction("reset");
    expect(response).toEqual({
      moveInPGNNotation: "",
      reasoning: "Game reset",
      smarmyComment: "",
      availableMoves: ["a4", "a5"],
      gameHistory: [],
      position: "fen_string",
    });
    expect(mockChessInstance.reset).toHaveBeenCalled();
  });

  test("should process a valid move and call LLM for next move", async () => {
    (simpleGenerateWithRetry as jest.Mock).mockResolvedValueOnce({
      output: jest.fn().mockReturnValue({
        moveInPGNNotation: "e4",
        reasoning: "Best strategic move",
        smarmyComment: "Checkmate soon",
      }),
    });

    const response = await chessStepsFunction("e2");

    expect(simpleGenerateWithRetry).toHaveBeenCalled();
    expect(response).toEqual({
      moveInPGNNotation: "e4",
      reasoning: "Best strategic move",
      smarmyComment: "Checkmate soon",
      availableMoves: ["a4", "a5"],
      gameHistory: ["e2", "e4"],
      position: "fen_string",
    });
    expect(mockChessInstance.move).toHaveBeenCalledWith("e2");
    expect(mockChessInstance.move).toHaveBeenCalledWith("e4");
  });

  test("should throw an error if LLM returns no valid output", async () => {
    (simpleGenerateWithRetry as jest.Mock).mockResolvedValueOnce({
      output: jest.fn().mockReturnValue(null),
    });

    await expect(chessStepsFunction("e2")).rejects.toThrow(
      "No output from LLM"
    );
  });
});
