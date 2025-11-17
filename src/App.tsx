import React, { useRef, useState } from "react";
import { FaCrown } from "react-icons/fa";

type Player = {
  id: number;
  name: string;
  totalScore: number;
  roundScore: string; // keep as string for easier input handling
};

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const nextId = useRef(1);

  const handleAddPlayer = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    const newPlayer: Player = {
      id: nextId.current++,
      name: trimmedName,
      totalScore: 0,
      roundScore: "",
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setNewPlayerName("");
  };

  const handleRoundScoreChange = (id: number, value: string) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, roundScore: value } : player
      )
    );
  };

  const handleApplyRoundScores = () => {
    setPlayers((prev) =>
      prev.map((player) => {
        const value = player.roundScore.trim();
        const numericRoundScore = value === "" ? 0 : Number(value);

        if (Number.isNaN(numericRoundScore)) {
          return { ...player, roundScore: "" };
        }

        return {
          ...player,
          totalScore: player.totalScore + numericRoundScore,
          roundScore: "",
        };
      })
    );
  };

  const handleResetAll = () => {
    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        totalScore: 0,
        roundScore: "",
      }))
    );
  };

  const handleRemovePlayer = (id: number) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  return (
    <main>
      <h1>Scoreboard</h1>

      {/* Add Player */}
      <form onSubmit={handleAddPlayer}>
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
                        handleRoundScoreChange(player.id, e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <button
                      type="button"
                      className="remove-player-button"
                      onClick={() => handleRemovePlayer(player.id)}
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
              Reset scores
            </button>
            <button
              type="button"
              className="apply-score-button"
              onClick={handleApplyRoundScores}
            >
              Apply round scores
            </button>
          </div>

          {/* Score Display */}
          <div className="score-cards">
            {players
              .slice()
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((player, index) => (
                <div className="score-card" key={player.id}>
                  <div className="player-info">
                    {index === 0 &&
                      players.length > 0 &&
                      player.totalScore > 0 && (
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
