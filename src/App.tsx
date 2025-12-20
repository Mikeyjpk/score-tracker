import React from "react";
import { usePlayerManager, useGameState } from "./hooks";
import { RiDeleteBin5Fill } from "react-icons/ri";
import { FaCrown } from "react-icons/fa";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Item } from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { IoIosSettings } from "react-icons/io";
import { RiResetLeftLine } from "react-icons/ri";

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
		removeAllPlayers,
	} = usePlayerManager();

	const {
		gameMode,
		changeGameMode,
		nextRound,
		resetGame,
		isGameEnded,
		roundDisplayText,
	} = useGameState();

	const getOrdinalSuffix = (rank: number): string => {
		const lastDigit = rank % 10;
		const lastTwoDigits = rank % 100;

		// Handle special cases for 11th, 12th, 13th
		if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
			return `${rank}th`;
		}

		// Handle regular cases
		switch (lastDigit) {
			case 1:
				return `${rank}st`;
			case 2:
				return `${rank}nd`;
			case 3:
				return `${rank}rd`;
			default:
				return `${rank}th`;
		}
	};

	const calculatePlayerRank = () => {
		if (players.length === 0) {
			return {};
		}

		// Create a copy of players with their scores for sorting
		const playersWithScores = players.map((player) => ({
			id: player.id,
			totalScore: player.totalScore,
		}));

		// Sort based on game mode
		const sortedPlayers = playersWithScores.sort((a, b) => {
			if (gameMode === "lowest-wins") {
				return a.totalScore - b.totalScore; // Ascending for lowest wins
			} else {
				// "highest-wins" and "unique-rounds" both use descending
				return b.totalScore - a.totalScore; // Descending for highest wins
			}
		});

		// Create ranking map with tie handling
		const rankings: { [key: number]: number } = {};
		let currentRank = 1;

		for (let i = 0; i < sortedPlayers.length; i++) {
			const player = sortedPlayers[i];

			// If this player has the same score as the previous player, they get the same rank
			if (i > 0 && sortedPlayers[i - 1].totalScore === player.totalScore) {
				rankings[player.id] = rankings[sortedPlayers[i - 1].id];
			} else {
				rankings[player.id] = currentRank;
			}

			currentRank = i + 2;
		}

		return rankings;
	};

	const playerRankings = calculatePlayerRank();

	const handleApplyRoundScores = () => {
		applyRoundScores();
		nextRound();
	};

	const handleResetAll = () => {
		resetPlayerScores();
		resetGame();
	};

	return (
		<main className="flex flex-col h-screen max-w-7xl mx-auto gap-4">
			{/* Settings Sheet - Always available */}
			<Sheet>
				{/* Header - Only visible when players exist */}
				{players.length > 0 && (
					<div className="flex justify-between items-center px-4 pt-4">
						<Badge variant={"outline"} className="flex gap-3 text-lg py-1">
							<div>Current Round:</div>
							<Badge variant={"secondary"}>{roundDisplayText}</Badge>
						</Badge>
						<SheetTrigger asChild>
							<Button>
								<IoIosSettings />
							</Button>
						</SheetTrigger>
					</div>
				)}

				<SheetContent className="flex flex-col h-full">
					<SheetHeader>
						<SheetTitle>Settings</SheetTitle>

						<div className="flex flex-col gap-3 pt-6">
							<Select
								value={gameMode}
								onValueChange={(newMode) => {
									changeGameMode(
										newMode as "highest-wins" | "lowest-wins" | "unique-rounds"
									);
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Game Mode" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="highest-wins">
										Highest Score Wins
									</SelectItem>
									<SelectItem value="lowest-wins">Lowest Score Wins</SelectItem>
									<SelectItem value="unique-rounds">JOE</SelectItem>
								</SelectContent>
							</Select>

							<form onSubmit={addPlayer} className="flex gap-3">
								<Input
									type="text"
									placeholder="Player name"
									value={newPlayerName}
									onChange={(e) => setNewPlayerName(e.target.value)}
								/>
								<Button type="submit">Add</Button>
							</form>
						</div>
					</SheetHeader>

					{/* Scrollable Players List */}
					<div className="flex-1 overflow-y-auto py-4">
						{players.length > 0 && (
							<div className="flex flex-col gap-3">
								{players.map((player) => (
									<Item
										variant={"outline"}
										key={player.id}
										className="flex items-center justify-between"
									>
										<span>{player.name}</span>
										<Button
											variant="outline"
											size="icon"
											onClick={() => removePlayer(player.id)}
											className="border-red-400 text-red-600 hover:cursor-pointer hover:text-red-400"
										>
											<RiDeleteBin5Fill className="" />
										</Button>
									</Item>
								))}
							</div>
						)}
					</div>

					{/* Action Buttons at Bottom */}
					<SheetFooter className="pt-4 border-t">
						<div className="flex flex-col gap-3 w-full">
							<Button
								type="button"
								variant="destructive"
								onClick={removeAllPlayers}
								className="font-semibold text-white"
							>
								Remove all players
							</Button>

							<Button
								type="button"
								variant="outline"
								onClick={handleResetAll}
								className="font-semibold tracking-wide border-red-600 text-red-600"
							>
								Reset Game <RiResetLeftLine />
							</Button>
						</div>
					</SheetFooter>
				</SheetContent>

				{/* Main Content Area - Scrollable */}
				<div className="flex-1 overflow-y-auto px-4">
					{players.length < 1 ? (
						/* Empty State */
						<div className="flex flex-1 items-center justify-center h-full">
							<div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-sm text-center">
								<div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border bg-muted">
									<FaCrown className="text-3xl opacity-80" />
								</div>
								<div className="text-xl font-semibold mb-2">Scoreboard</div>
								<div className="text-lg mb-2">Add players to get started</div>
								<p className="text-sm text-muted-foreground mb-4">
									Open <span className="font-medium">Settings</span> to add
									player names and choose a game mode.
								</p>
								<div className="rounded-xl border bg-muted/40 p-4 text-sm">
									<div className="flex items-start gap-3">
										<div className="mt-2 h-2 w-2 rounded-full bg-foreground/50" />
										<div className="flex flex-col">
											<span className="text-muted-foreground">
												Your games settings will persist after refreshing the
												browser
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					) : (
						/* Player Scores */
						<div className="flex flex-1 h-full flex-col gap-2">
							{players
								.slice()
								.sort((a, b) =>
									gameMode === "highest-wins"
										? b.totalScore - a.totalScore
										: a.totalScore - b.totalScore
								)
								.map((player, index) => (
									<Item
										key={player.id}
										variant="outline"
										className="flex justify-between items-center"
									>
										<div className="flex gap-3">
											<Badge variant="default" className="w-12 justify-center">
												<span className="flex flex-col items-center">
													{index === 0 && <FaCrown />}
													{getOrdinalSuffix(playerRankings[player.id])}
												</span>
											</Badge>

											<div className="flex flex-col">
												<div className="text-lg">{player.name}</div>
												<div>Score: {player.totalScore}</div>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<Input
												className="w-24 text-center shadow-none"
												type="number"
												inputMode="numeric"
												value={player.roundScore}
												onChange={(e) =>
													updateRoundScore(player.id, e.target.value)
												}
											/>
										</div>
									</Item>
								))}
						</div>
					)}
				</div>

				{/* Action Bar */}
				<div className="border-t bg-backgroun">
					<div className="flex justify-center gap-3 pb-10 pt-6">
						{players.length > 0 ? (
							<Button
								size={"lg"}
								type="button"
								className="bg-green-500 hover:bg-green-300 hover:text-green-900 cursor-pointer font-bold"
								onClick={handleApplyRoundScores}
								disabled={isGameEnded}
							>
								Add Scores
							</Button>
						) : (
							<SheetTrigger asChild>
								<Button
									size={"lg"}
									type="button"
									className="bg-blue-500 hover:bg-blue-300 hover:text-blue-900 cursor-pointer font-bold"
								>
									<IoIosSettings className="mr-2" />
									Settings
								</Button>
							</SheetTrigger>
						)}
					</div>
				</div>
			</Sheet>
		</main>
	);
};

export default App;
