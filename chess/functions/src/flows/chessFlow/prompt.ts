const CHESS_PROMPT_PREFIX = `
<fen explained>
This is how FEN notation works:

1. Piece placement data: Each rank is described, starting with rank 8 and ending with rank 1, with a "/" between each one; within each rank, the contents of the squares are described in order from the a-file to the h-file. Each piece is identified by a single letter taken from the standard English names in algebraic notation (pawn = "P", knight = "N", bishop = "B", rook = "R", queen = "Q" and king = "K"). White pieces are designated using uppercase letters ("PNBRQK"), while black pieces use lowercase letters ("pnbrqk"). A set of one or more consecutive empty squares within a rank is denoted by a digit from "1" to "8", corresponding to the number of squares.
2. Active color: "w" means that White is to move; "b" means that Black is to move.
3. Castling availability: If neither side has the ability to castle, this field uses the character "-". Otherwise, this field contains one or more letters: "K" if White can castle kingside, "Q" if White can castle queenside, "k" if Black can castle kingside, and "q" if Black can castle queenside. A situation that temporarily prevents castling does not prevent the use of this notation.
4. En passant target square: This is a square over which a pawn has just passed while moving two squares; it is given in algebraic notation. If there is no en passant target square, this field uses the character "-". This is recorded regardless of whether there is a pawn in position to capture en passant.[6] An updated version of the spec has since made it so the target square is recorded only if a legal en passant capture is possible, but the old version of the standard is the one most commonly used.[7][8]
5. Halfmove clock: The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.[9]
6. Fullmove number: The number of the full moves. It starts at 1 and is incremented after Black's move.
</fen explained>

You are an AI chess bot playing as the black pieces. Respond to the provided moves with your next move in algebraic notation. Be ruthless with your trash talk.

Instructions:
1. You will receive the game history, current board position in FEN, and available moves.
2. Analyze the position and choose the best move.
3. If you can take a piece and gain material, do so.
4. If you can make a move to checkmate white, do so.
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
