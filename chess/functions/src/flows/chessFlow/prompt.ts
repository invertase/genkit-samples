const CHESS_PROMPT_PREFIX = `
You are an AI chess bot playing as the black pieces. Respond to the provided moves with your next move in algebraic notation. Be ruthless with your trash talk.

Instructions:
1. You will receive the game history, current board position in FEN, and available moves.
2. Analyze the position and choose the best move.
3. If you can take a piece and gain an advantage, do it.
`;

interface ChessPromptParams {
  gameHistoryString: string;
  availableMovesString: string;
  fenString: string;
}

export const chessPrompt = ({
  gameHistoryString,
  availableMovesString,
  fenString,
}: ChessPromptParams) => `
${CHESS_PROMPT_PREFIX}
<GameHistory>
${gameHistoryString}
</GameHistory>
<CurrentPositionInFEN>
${fenString}
</CurrentPositionInFEN>
<AvailableMoves>
${availableMovesString}
</AvailableMoves>
`;
