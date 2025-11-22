import { useState } from "react";

type GameMode = "highest-wins" | "lowest-wins" | "unique-rounds";

const UNIQUE_ROUND_CODES = [null, 33, 34, 44, 333, 334, 344, 444];

const getRoundDisplayNumber = (round: number, mode: GameMode) => {
  if (mode !== "unique-rounds") return round;

  return UNIQUE_ROUND_CODES[round] ?? "?";
};

const isGameEnded = (round: number, mode: GameMode) => {
  return mode === "unique-rounds" && round > 7;
};

export const useGameState = () => {
  const [gameMode, setGameMode] = useState<GameMode>("highest-wins");
  const [round, setRound] = useState(1);

  const nextRound = () => {
    setRound((prev) => prev + 1);
  };

  const resetGame = () => {
    setRound(1);
  };

  const changeGameMode = (newMode: GameMode) => {
    setGameMode(newMode);
    resetGame();
  };

  const renderRoundText = () => {
    if (isGameEnded(round, gameMode)) {
      return "Game Over";
    }

    if (gameMode === "unique-rounds") {
      return `Round: ${getRoundDisplayNumber(round, gameMode)}`;
    }

    return `Round: ${round}`;
  };

  return {
    gameMode,
    round,
    setGameMode,
    changeGameMode,
    nextRound,
    resetGame,
    isGameEnded: isGameEnded(round, gameMode),
    roundDisplayText: renderRoundText(),
  };
};
