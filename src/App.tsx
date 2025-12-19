import React, { useState } from "react";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import {
	Item,
	ItemContent,
	ItemDescription,
	ItemHeader,
	ItemTitle,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
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

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const handleApplyRoundScores = () => {
		applyRoundScores();
		nextRound();
		setIsDrawerOpen(false);
	};

	const handleResetAll = () => {
		resetPlayerScores();
		resetGame();
	};

	return (
		<main className="flex flex-col h-screen max-w-7xl mx-auto">
			{/* Header - Only visible when players exist */}
			{players.length > 0 && (
				<div className="flex justify-between items-center mb-6 px-4 pt-4">
					<div className="text-lg font-semibold">Current Round</div>
					<p className="text-lg">{roundDisplayText}</p>
				</div>
			)}

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
								Open <span className="font-medium">Settings</span> to add player
								names and choose a game mode.
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
					<div className="flex flex-col gap-3 pb-4">
						{players
							.slice()
							.sort((a, b) =>
								gameMode === "highest-wins"
									? b.totalScore - a.totalScore
									: a.totalScore - b.totalScore
							)
							.map((player, index) => (
								<Item variant="outline" key={player.id}>
									{index === 0 && (
										<ItemHeader>
											<Badge variant="outline">
												<FaCrown />
											</Badge>
										</ItemHeader>
									)}
									<ItemContent>
										<ItemTitle>{player.name}</ItemTitle>
										<ItemDescription>{player.totalScore}</ItemDescription>
									</ItemContent>
								</Item>
							))}
					</div>
				)}
			</div>

			{/* Fixed Action Bar */}
			<div className="border-t bg-background p-4">
				<div className="flex justify-center gap-3">
					<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
						<DrawerTrigger asChild>
							<Button disabled={players.length === 0}>Add Scores</Button>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>Round Score</DrawerTitle>
								<DrawerDescription>
									Add players scores and then submit the round scores
								</DrawerDescription>
							</DrawerHeader>

							{/* Players Table */}
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Player</TableHead>
										<TableHead>Score</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{players.map((player) => (
										<TableRow key={player.id}>
											<TableCell className="py-3">{player.name}</TableCell>

											<TableCell className="py-3">
												<Input
													type="number"
													inputMode="numeric"
													value={player.roundScore}
													onChange={(e) =>
														updateRoundScore(player.id, e.target.value)
													}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							<DrawerFooter>
								<Button
									type="button"
									className="apply-score-button"
									onClick={handleApplyRoundScores}
									disabled={isGameEnded}
								>
									Submit Round Scores
								</Button>
								<DrawerClose>
									<Button variant="outline">Cancel</Button>
								</DrawerClose>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>

					<Sheet>
						<SheetTrigger asChild>
							<Button>
								<IoIosSettings />
								Settings
							</Button>
						</SheetTrigger>
						<SheetContent className="flex flex-col h-full">
							<SheetHeader>
								<SheetTitle>Settings</SheetTitle>

								<div className="flex flex-col gap-3 pt-6">
									<Select
										value={gameMode}
										onValueChange={(newMode) => {
											changeGameMode(
												newMode as
													| "highest-wins"
													| "lowest-wins"
													| "unique-rounds"
											);
											resetPlayerScores();
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select Game Mode" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="highest-wins">
												Highest Score Wins
											</SelectItem>
											<SelectItem value="lowest-wins">
												Lowest Score Wins
											</SelectItem>
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
								<div className="flex justify-between">
									<Button
										type="button"
										variant="outline"
										onClick={handleResetAll}
										className="font-semibold tracking-wide border-red-600 text-red-600"
									>
										Reset Game <RiResetLeftLine />
									</Button>

									<Button
										type="button"
										variant="destructive"
										onClick={removeAllPlayers}
										className="font-semibold text-white"
									>
										Remove all players
									</Button>
								</div>
							</SheetFooter>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</main>
	);
};

export default App;
