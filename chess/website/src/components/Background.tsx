import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChessKing,
  faChessQueen,
  faChessRook,
  faChessBishop,
  faChessKnight,
  faChessPawn,
} from "@fortawesome/free-solid-svg-icons";

const ChessPiece: React.FC<{ colorClass: string }> = ({ colorClass }) => {
  const icons = [
    faChessKing,
    faChessQueen,
    faChessRook,
    faChessBishop,
    faChessKnight,
    faChessPawn,
  ];
  const icon = icons[Math.floor(Math.random() * icons.length)];
  return <FontAwesomeIcon className={colorClass} icon={icon} size="2x" />;
};

import "./RainEffect.css";

export const RainEffect: React.FC = () => {
  const numberOfPieces = 30;
  // Use a more dynamic calculation for 'left' based on the index
  const pieces = Array.from({ length: numberOfPieces }, (_, index) => {
    const leftPosition = (index / numberOfPieces) * 100; // This spreads them evenly from 0% to 100%
    const colorClass =
      Math.random() > 0.5
        ? "text-white border-white"
        : "text-black border-black";

    const animationDuration = Math.random() * 5 + 10;

    return (
      <div
        key={index}
        style={{
          left: `${leftPosition}%`,
          animationDuration: `${animationDuration}s`,
        }}
        className="chess-piece opacity-20"
      >
        <ChessPiece colorClass={colorClass} />
      </div>
    );
  });

  return (
    <div className="fixed w-[100vw] h-[100vh] overflow-hidden bg-gray-700">
      {pieces}
    </div>
  );
};

export default RainEffect;
