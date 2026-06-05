import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

type Player = {
	id: number;
	name: string;
	totalScore: number;
	roundScore: string;
	lastRoundScore: number | null;
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

		// Limit name to 25 characters
		const limitedName =
			trimmedName.length > 25 ? trimmedName.substring(0, 25) : trimmedName;

		const newPlayer: Player = {
			id: nextId,
			name: limitedName,
			totalScore: 0,
			roundScore: "",
			lastRoundScore: null,
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

	const adjustRoundScore = (id: number, delta: number) => {
		setPlayers((prev) =>
			prev.map((player) => {
				if (player.id !== id) {
					return player;
				}

				const current = Number(player.roundScore);
				const base = Number.isNaN(current) ? 0 : current;
				return { ...player, roundScore: String(base + delta) };
			})
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
					lastRoundScore: numericRoundScore,
					roundScore: "",
				};
			})
		);
	};

	const undoLastRound = () => {
		setPlayers((prev) =>
			prev.map((player) => ({
				...player,
				totalScore: player.totalScore - (player.lastRoundScore ?? 0),
				lastRoundScore: null,
				roundScore: "",
			}))
		);
	};

	const resetPlayerScores = () => {
		setPlayers((prev) =>
			prev.map((player) => ({
				...player,
				totalScore: 0,
				roundScore: "",
				lastRoundScore: null,
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

	// `!= null` intentionally also catches players stored before this field existed
	const canUndo = players.some((player) => player.lastRoundScore != null);

	return {
		players,
		newPlayerName,
		setNewPlayerName,
		addPlayer,
		updateRoundScore,
		adjustRoundScore,
		applyRoundScores,
		undoLastRound,
		canUndo,
		resetPlayerScores,
		removePlayer,
		removeAllPlayers,
	};
};
