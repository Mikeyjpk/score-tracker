import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

type Player = {
	id: number;
	name: string;
	totalScore: number;
	roundScore: string;
};

export const usePlayerManager = () => {
	const [players, setPlayers] = useLocalStorage<Player[]>(
		"scoreTracker_players",
		[]
	);
	const [newPlayerName, setNewPlayerName] = useState("");
	const [nextId, setNextId] = useLocalStorage("scoreTracker_nextId", 1);

	const addPlayer = (event: React.FormEvent) => {
		event.preventDefault();

		const trimmedName = newPlayerName.trim();
		if (!trimmedName) {
			return;
		}

		const newPlayer: Player = {
			id: nextId,
			name: trimmedName,
			totalScore: 0,
			roundScore: "",
		};

		setPlayers((prev) => [...prev, newPlayer]);
		setNextId(nextId + 1);
		setNewPlayerName("");
	};

	const updateRoundScore = (id: number, value: string) => {
		setPlayers((prev) =>
			prev.map((player) =>
				player.id === id ? { ...player, roundScore: value } : player
			)
		);
	};

	const applyRoundScores = () => {
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

	const resetPlayerScores = () => {
		setPlayers((prev) =>
			prev.map((player) => ({
				...player,
				totalScore: 0,
				roundScore: "",
			}))
		);
	};

	const removePlayer = (id: number) => {
		setPlayers((prev) => prev.filter((player) => player.id !== id));
	};

	const removeAllPlayers = () => {
		setPlayers([]);
		setNextId(1);
	};

	return {
		players,
		newPlayerName,
		setNewPlayerName,
		addPlayer,
		updateRoundScore,
		applyRoundScores,
		resetPlayerScores,
		removePlayer,
		removeAllPlayers,
	};
};
