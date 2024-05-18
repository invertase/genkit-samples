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
import "./RainEffect.css";

const ChessPiece: React.FC<{ colorClass: string; isWhite: boolean }> = ({
  colorClass,
  isWhite,
}) => {
  const icons = [
    faChessKing,
    faChessQueen,
    faChessRook,
    faChessBishop,
    faChessKnight,
    faChessPawn,
  ];
  const chessIcon = icons[Math.floor(Math.random() * icons.length)];

  const randomInt0to2 = Math.floor(Math.random() * 8);

  switch (randomInt0to2) {
    case 0:
      return (
        <div className="w-8 h-8 text-white">
          <GeminiIcon isWhite={isWhite} />
        </div>
      );
    case 2:
      return <InvertaseIcon isWhite={isWhite} />;
    default:
      return (
        <div className="w-8 h-8 text-white">
          <FontAwesomeIcon className={colorClass} icon={chessIcon} size="2x" />
        </div>
      );
  }
};

const InvertaseIcon = ({ isWhite }: { isWhite: boolean }) => (
  <div className="w-8 h-8 text-white">
    <svg viewBox="0 0 26 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M25.7129 9.79654L21.7526 7.53911V3.00942L17.0743 0.346051L13.1139 2.60347L9.15355 0.346051L4.47039 3.00942V7.55397L0.509998 9.81139V15.1579L4.47039 17.4154V21.9104L9.15355 24.5787L13.1139 22.3213L17.0743 24.5787L21.7526 21.9104V17.4252L25.7129 15.1678V9.79654ZM9.87138 14.2866V10.6381L13.109 8.79159L16.3417 10.6381V14.2866L13.109 16.1282L9.87138 14.2866ZM13.8318 3.85099L17.0644 2.00941L20.2971 3.85099V7.51931L17.0644 9.36585L13.8318 7.51931V3.85099ZM5.91099 3.85099L9.14861 2.00941L12.3813 3.85099V7.51931L9.14861 9.36585L5.91099 7.51931V3.85099ZM1.95059 10.6381L5.18326 8.79159L8.42089 10.6381V14.2866L5.16841 16.1381L1.95059 14.3064V10.6381ZM9.15355 22.9005L5.91593 21.0589V17.4054L9.15355 15.5639L12.3862 17.4054V21.0589L9.15355 22.9005ZM17.0743 22.9005L13.8417 21.0589V17.4054L17.0743 15.5639L20.307 17.4054V21.0589L17.0743 22.9005ZM24.2724 14.3163L21.0545 16.148L17.8021 14.2965V10.648L21.0347 8.80148L24.2724 10.648V14.3163Z"
        fill={isWhite ? "white" : "black"}
      ></path>
    </svg>
  </div>
);

const GeminiIcon = ({ isWhite }: { isWhite: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16">
    <path
      d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"
      fill={isWhite ? "white" : "black"}
    />
  </svg>
);

export const RainEffect: React.FC = () => {
  const numberOfPieces = 30;
  // Use a more dynamic calculation for 'left' based on the index
  const pieces = Array.from({ length: numberOfPieces }, (_, index) => {
    const leftPosition = (index / numberOfPieces) * 100; // This spreads them evenly from 0% to 100%

    const isWhite = Math.random() > 0.5;
    const colorClass = isWhite
      ? "text-white border-white"
      : "text-black border-black";

    const animationDuration = Math.random() * 5 + 10;
    const animationDelay = Math.random() * 5; // Random delay up to 5 seconds

    return (
      <div
        key={index}
        style={{
          left: `${leftPosition}%`,
          animationDuration: `${animationDuration}s`,
          animationDelay: `${animationDelay}s`,
        }}
        className="chess-piece opacity-20"
      >
        <ChessPiece isWhite={isWhite} colorClass={colorClass} />
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
