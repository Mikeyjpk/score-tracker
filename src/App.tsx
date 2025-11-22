import React from "react";
import { FaCrown } from "react-icons/fa";
import { usePlayerManager, useGameState } from "./hooks";

const App: React.FC = () => {
  const {
    players,
    newPlayerName,
    setNewPlayerName,
    addPlayer,
    updateRoundScore,
    applyRoundScores,
    resetPlayerScores,
    removePlayer,
  } = usePlayerManager();

  const {
    gameMode,
    changeGameMode,
    nextRound,
    resetGame,
    isGameEnded,
    roundDisplayText,
  } = useGameState();

  const handleApplyRoundScores = () => {
    applyRoundScores();
    nextRound();
  };

  const handleResetAll = () => {
    resetPlayerScores();
    resetGame();
  };

  return (
    <main>
      <h1>Scoreboard</h1>

      {/* Game Mode Toggle */}
      <div className="game-mode-toggle">
        <select
          value={gameMode}
          onChange={(e) => {
            const newMode = e.target.value as
              | "highest-wins"
              | "lowest-wins"
              | "unique-rounds";
            changeGameMode(newMode);
            resetPlayerScores();
          }}
        >
          <option value="highest-wins">Highest Score Wins</option>
          <option value="lowest-wins">Lowest Score Wins</option>
          <option value="unique-rounds">Joe</option>
        </select>
      </div>

      {/* Add Player */}
      <form onSubmit={addPlayer}>
        <input
          type="text"
          placeholder="Player name"
          className="player-input"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
        />
        <button type="submit" className="add-player-submit-button">
          Add
        </button>
      </form>

      {/* Player Table */}
      {players.length === 0 ? (
        <p>No players yet. Add someone to get started.</p>
      ) : (
        <>
          {/* Players Table */}
          <table className="player-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Score</th>
              </tr>
            </thead>

            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>

                  <td>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={player.roundScore}
                      onChange={(e) =>
                        updateRoundScore(player.id, e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <button
                      type="button"
                      className="remove-player-button"
                      onClick={() => removePlayer(player.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Actions */}
          <div className="action-buttons">
            <button
              type="button"
              className="reset-button"
              onClick={handleResetAll}
            >
              Reset game
            </button>

            <button
              type="button"
              className="apply-score-button"
              onClick={handleApplyRoundScores}
              disabled={isGameEnded}
            >
              Apply round scores
            </button>
          </div>

          {/* Current Round Card */}
          <div className="round-card">
            <h2>Current Round</h2>

            <p>{roundDisplayText}</p>
          </div>

          {/* Score Display */}
          <div className="score-cards">
            {players
              .slice()
              .sort((a, b) =>
                gameMode === "highest-wins"
                  ? b.totalScore - a.totalScore
                  : a.totalScore - b.totalScore
              )
              .map((player, index) => (
                <div className="score-card" key={player.id}>
                  <div className="player-info">
                    {index === 0 &&
                      players.length > 0 &&
                      (gameMode === "highest-wins"
                        ? player.totalScore > 0
                        : players.some((p) => p.totalScore !== 0)) && (
                        <FaCrown className="crown-icon" />
                      )}
                    <span>{player.name}</span>
                  </div>
                  <p>{player.totalScore}</p>
                </div>
              ))}
          </div>
        </>
      )}
    </main>
  );
};

export default App;
