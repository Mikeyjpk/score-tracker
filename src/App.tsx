import React, { useEffect, useRef, useState } from "react";
import { usePlayerManager, useGameState, useWakeLock } from "./hooks";
import {
	Crown,
	Minus,
	Plus,
	Trash2,
	RotateCcw,
	ArrowRight,
	Coffee,
	Check,
	Settings,
	Users,
} from "lucide-react";
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
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type GameMode = "highest-wins" | "lowest-wins" | "unique-rounds";

const GAME_MODE_LABELS: Record<GameMode, string> = {
	"highest-wins": "Highest score wins",
	"lowest-wins": "Lowest score wins",
	"unique-rounds": "JOE",
};

// Stable per-player identity colours (assigned by id) used for the dots in Settings.
const PLAYER_COLORS = [
	"#22d3ee", // cyan
	"#e879f9", // fuchsia
	"#a78bfa", // violet
	"#34d399", // emerald
	"#fb923c", // orange
	"#f472b6", // pink
	"#60a5fa", // blue
	"#facc15", // yellow
];

const getPlayerColor = (id: number) =>
	PLAYER_COLORS[(id - 1) % PLAYER_COLORS.length];

// Podium colouring for the rank badge on the scoreboard.
const rankBadgeClass = (rank: number) => {
	if (rank === 2) return "bg-slate-300 text-slate-900";
	if (rank === 3) return "bg-amber-500 text-amber-950";
	return "bg-muted text-muted-foreground";
};

const formatDelta = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

type StepperProps = {
	value: string;
	onChange: (value: string) => void;
	onAdjust: (delta: number) => void;
	accent?: boolean;
};

const Stepper: React.FC<StepperProps> = ({
	value,
	onChange,
	onAdjust,
	accent = false,
}) => {
	const buttonClass = cn(
		"grid h-8 w-8 place-items-center rounded-full transition-colors",
		accent
			? "bg-white/20 text-white hover:bg-white/30"
			: "bg-background text-foreground hover:bg-accent border border-border",
	);

	return (
		<div
			className={cn(
				"flex items-center gap-1 rounded-full p-1",
				accent ? "bg-white/15" : "bg-muted",
			)}
		>
			<button
				type="button"
				aria-label="Decrease"
				className={buttonClass}
				onClick={() => onAdjust(-1)}
			>
				<Minus className="h-4 w-4" />
			</button>
			<input
				type="number"
				inputMode="numeric"
				value={value}
				placeholder="0"
				onChange={(e) => onChange(e.target.value)}
				className={cn(
					"w-12 bg-transparent text-center text-base font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
					accent
						? "text-white placeholder:text-white/50"
						: "text-foreground placeholder:text-muted-foreground",
				)}
			/>
			<button
				type="button"
				aria-label="Increase"
				className={buttonClass}
				onClick={() => onAdjust(1)}
			>
				<Plus className="h-4 w-4" />
			</button>
		</div>
	);
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => (
	<div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
		{children}
	</div>
);

type ConfirmButtonProps = {
	icon: React.ReactNode;
	label: string;
	confirmLabel: string;
	doneLabel: string;
	onConfirm: () => void;
	destructive?: boolean;
};

/**
 * A two-tap button: the first tap arms it (and asks for confirmation), the
 * second performs the action and shows a brief "done" state so the user gets
 * clear feedback. Arming reverts on its own after a few seconds.
 */
const ConfirmButton: React.FC<ConfirmButtonProps> = ({
	icon,
	label,
	confirmLabel,
	doneLabel,
	onConfirm,
	destructive = false,
}) => {
	const [phase, setPhase] = useState<"idle" | "confirm" | "done">("idle");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearTimer = () => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = null;
	};

	useEffect(() => clearTimer, []);

	const handleClick = () => {
		if (phase === "done") return;

		if (phase === "idle") {
			setPhase("confirm");
			clearTimer();
			timerRef.current = setTimeout(() => setPhase("idle"), 3500);
			return;
		}

		clearTimer();
		onConfirm();
		setPhase("done");
		timerRef.current = setTimeout(() => setPhase("idle"), 2000);
	};

	const phaseClass = {
		idle: destructive
			? "border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
			: "",
		confirm: destructive
			? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90"
			: "border-transparent bg-amber-500 text-amber-950 hover:bg-amber-400",
		done: "border-transparent bg-emerald-600 text-white hover:bg-emerald-600",
	}[phase];

	return (
		<Button
			type="button"
			variant="outline"
			onClick={handleClick}
			aria-live="polite"
			className={cn("w-full justify-center font-semibold", phaseClass)}
		>
			{phase === "idle" && (
				<>
					{icon}
					{label}
				</>
			)}
			{phase === "confirm" && (
				<>
					{icon}
					{confirmLabel}
				</>
			)}
			{phase === "done" && (
				<>
					<Check className="h-4 w-4" />
					{doneLabel}
				</>
			)}
		</Button>
	);
};

const App: React.FC = () => {
	const {
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
	} = usePlayerManager();

	const {
		gameMode,
		changeGameMode,
		nextRound,
		prevRound,
		resetGame,
		isGameEnded,
		roundDisplayText,
	} = useGameState();

	const {
		enabled: keepAwake,
		isSupported: wakeLockSupported,
		toggle: toggleKeepAwake,
	} = useWakeLock();

	// Modes where the lowest total score wins (JOE is a lowest-wins variant).
	const lowestWins = gameMode === "lowest-wins" || gameMode === "unique-rounds";

	const calculatePlayerRank = () => {
		if (players.length === 0) {
			return {} as Record<number, number>;
		}

		const sortedPlayers = players
			.map((player) => ({ id: player.id, totalScore: player.totalScore }))
			.sort((a, b) =>
				lowestWins ? a.totalScore - b.totalScore : b.totalScore - a.totalScore,
			);

		const rankings: Record<number, number> = {};

		// Dense ranking: tied players share a rank and the next distinct score
		// gets the immediately following rank (e.g. 1, 2, 2, 3 — not 1, 2, 2, 4).
		let rank = 0;
		for (let i = 0; i < sortedPlayers.length; i++) {
			const player = sortedPlayers[i];
			if (i === 0 || sortedPlayers[i - 1].totalScore !== player.totalScore) {
				rank += 1;
			}
			rankings[player.id] = rank;
		}

		return rankings;
	};

	const playerRankings = calculatePlayerRank();

	const sortedPlayers = players
		.slice()
		.sort((a, b) =>
			lowestWins ? a.totalScore - b.totalScore : b.totalScore - a.totalScore,
		);

	const handleApplyRoundScores = () => {
		applyRoundScores();
		nextRound();
	};

	const handleUndo = () => {
		undoLastRound();
		prevRound();
	};

	const handleResetAll = () => {
		resetPlayerScores();
		resetGame();
	};

	const hasPlayers = players.length > 0;
	const submitLabel = isGameEnded
		? "Game Over"
		: `Submit Round ${roundDisplayText}`;

	const KeepAwakeToggle = wakeLockSupported && (
		<button
			type="button"
			aria-label="Keep screen awake"
			aria-pressed={keepAwake}
			title={
				keepAwake
					? "Screen stays awake while playing"
					: "Keep the screen awake while playing"
			}
			onClick={toggleKeepAwake}
			className={cn(
				"grid h-10 w-10 place-items-center rounded-xl transition-colors",
				keepAwake
					? "bg-amber-400 text-amber-950 hover:bg-amber-300"
					: hasPlayers
						? "bg-white/20 text-white hover:bg-white/30"
						: "border border-border bg-card text-foreground hover:bg-accent",
			)}
		>
			<Coffee className="h-5 w-5" />
		</button>
	);

	return (
		<Sheet>
			<div className="flex min-h-dvh justify-center bg-muted/40 transition-[padding] duration-300 ease-in-out motion-reduce:transition-none dark:bg-muted/10 sm:px-6 sm:py-8">
				<main className="flex h-dvh w-full max-w-md flex-col overflow-hidden bg-background text-foreground transition-[max-width,border-radius,box-shadow,border-color] duration-300 ease-in-out motion-reduce:transition-none sm:h-[min(calc(100dvh-4rem),920px)] sm:max-w-2xl sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl lg:max-w-4xl">
					{/* ---------- Header ---------- */}
					{hasPlayers ? (
						<header className="shrink-0 rounded-b-3xl bg-gradient-to-br from-sky-500 to-blue-600 px-5 pb-6 pt-7 text-white shadow-lg transition-[padding] duration-300 ease-in-out motion-reduce:transition-none sm:px-7">
							<div className="flex items-start justify-between">
								<div>
									<div className="text-xs font-semibold uppercase tracking-widest text-white/70">
										Now Playing
									</div>
									<div className="text-3xl font-extrabold leading-tight">
										Round {roundDisplayText}
									</div>
								</div>
								<div className="flex gap-2">
									{KeepAwakeToggle}
									<SheetTrigger asChild>
										<button
											type="button"
											aria-label="Settings"
											className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-white transition-colors hover:bg-white/30"
										>
											<Settings className="h-5 w-5" />
										</button>
									</SheetTrigger>
								</div>
							</div>
						</header>
					) : (
						<header className="flex shrink-0 items-start justify-between px-5 pb-6 pt-7 transition-[padding] duration-300 ease-in-out motion-reduce:transition-none sm:px-7">
							<div>
								<div className="text-xs font-semibold uppercase tracking-widest text-sky-500">
									Welcome
								</div>
								<div className="text-3xl font-extrabold leading-tight">
									Card <span className="text-sky-400">Night</span>
								</div>
							</div>
							{KeepAwakeToggle}
						</header>
					)}

					{/* ---------- Scrollable content ---------- */}
					<div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 transition-[padding] duration-300 ease-in-out motion-reduce:transition-none sm:px-6">
						{hasPlayers ? (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								{sortedPlayers.map((player, index) => {
									const rank = playerRankings[player.id];
									const isLeader = index === 0;

									if (isLeader) {
										return (
											<div
												key={player.id}
												className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg sm:col-span-2"
											>
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-3">
														<div className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">
															<Crown className="h-6 w-6 text-yellow-300" />
														</div>
														<div className="min-w-0">
															<div className="break-words text-2xl font-bold leading-tight">
																{player.name}
															</div>
															{player.lastRoundScore != null && (
																<div className="text-sm text-white/70">
																	{formatDelta(player.lastRoundScore)} last
																	round
																</div>
															)}
														</div>
													</div>
													<div className="text-right">
														<div className="text-4xl font-extrabold leading-none">
															{player.totalScore}
														</div>
														<div className="text-xs font-medium tracking-wide text-white/70">
															POINTS
														</div>
													</div>
												</div>
												<div className="mt-4 flex items-center justify-between">
													<span className="text-sm text-white/80">
														This round
													</span>
													<Stepper
														accent
														value={player.roundScore}
														onChange={(v) => updateRoundScore(player.id, v)}
														onAdjust={(d) => adjustRoundScore(player.id, d)}
													/>
												</div>
											</div>
										);
									}

									const deltaPositive = (player.lastRoundScore ?? 0) >= 0;

									return (
										<div
											key={player.id}
											className="rounded-2xl border border-border bg-card p-4"
										>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-3">
													<div
														className={cn(
															"grid h-9 w-9 place-items-center rounded-full text-sm font-bold",
															rankBadgeClass(rank),
														)}
													>
														{rank}
													</div>
													<div className="min-w-0">
														<div className="wrap-break-word text-lg font-semibold leading-tight">
															{player.name}
														</div>
														{player.lastRoundScore != null && (
															<div
																className={cn(
																	"text-xs font-medium",
																	deltaPositive
																		? "text-emerald-500"
																		: "text-red-500",
																)}
															>
																{formatDelta(player.lastRoundScore)} last round
															</div>
														)}
													</div>
												</div>
												<div className="text-right">
													<div className="text-3xl font-bold leading-none">
														{player.totalScore}
													</div>
													<div className="text-[10px] font-medium tracking-wide text-muted-foreground">
														POINTS
													</div>
												</div>
											</div>
											<div className="mt-3 flex items-center justify-between">
												<span className="text-sm text-muted-foreground">
													This round
												</span>
												<Stepper
													value={player.roundScore}
													onChange={(v) => updateRoundScore(player.id, v)}
													onAdjust={(d) => adjustRoundScore(player.id, d)}
												/>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							/* ---------- Empty / onboarding state ---------- */
							<div className="flex h-full flex-col items-center justify-center px-4 text-center">
								<div className="relative mb-8">
									<div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
										<Users className="h-11 w-11 text-white" />
									</div>
									<div className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-amber-400 text-amber-950 shadow-md">
										<Plus className="h-5 w-5" />
									</div>
								</div>
								<h2 className="text-2xl font-bold">Let's set up the table</h2>
								<p className="mt-2 max-w-xs text-sm text-muted-foreground">
									Add everyone playing tonight and we'll keep the running score,
									round by round.
								</p>
								<SheetTrigger asChild>
									<button
										type="button"
										className="mt-6 flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-7 font-bold text-white shadow-lg shadow-sky-500/30 transition-transform hover:scale-[1.02]"
									>
										<Plus className="h-5 w-5" /> Add players
									</button>
								</SheetTrigger>
								<p className="mt-5 text-xs text-muted-foreground">
									{GAME_MODE_LABELS[gameMode]} · you can change this anytime
								</p>
							</div>
						)}
					</div>

					{/* ---------- Action bar ---------- */}
					{hasPlayers && (
						<div className="flex shrink-0 items-center gap-3 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-in-out motion-reduce:transition-none sm:px-6">
							<button
								type="button"
								aria-label="Undo last round"
								onClick={handleUndo}
								disabled={!canUndo}
								className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:opacity-40 disabled:hover:bg-card"
							>
								<RotateCcw className="h-5 w-5" />
							</button>
							<button
								type="button"
								onClick={handleApplyRoundScores}
								disabled={isGameEnded}
								className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-white shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
							>
								{submitLabel}
								{!isGameEnded && <ArrowRight className="h-5 w-5" />}
							</button>
						</div>
					)}
				</main>
			</div>

			{/* ---------- Settings sheet ---------- */}
			<SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
				<SheetHeader className="text-left">
					<SheetTitle className="text-2xl">Settings</SheetTitle>
				</SheetHeader>

				<div className="-mr-2 flex-1 space-y-6 overflow-y-auto pr-2 pt-6">
					{/* Game mode */}
					<div className="space-y-2">
						<SectionLabel>Game Mode</SectionLabel>
						<Select
							value={gameMode}
							onValueChange={(newMode) => changeGameMode(newMode as GameMode)}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select Game Mode" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="highest-wins">Highest score wins</SelectItem>
								<SelectItem value="lowest-wins">Lowest score wins</SelectItem>
								<SelectItem value="unique-rounds">JOE</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Players */}
					<div className="space-y-2">
						<SectionLabel>Players · {players.length}</SectionLabel>
						<form onSubmit={addPlayer} className="flex gap-2">
							<Input
								type="text"
								placeholder="Add a player..."
								value={newPlayerName}
								maxLength={25}
								onChange={(e) => setNewPlayerName(e.target.value)}
							/>
							<Button type="submit" size="icon" aria-label="Add player">
								<Plus className="h-4 w-4" />
							</Button>
						</form>

						{hasPlayers && (
							<div className="mt-1 flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-1.5">
								{players.map((player) => (
									<div
										key={player.id}
										className="flex items-center justify-between rounded-lg px-3 py-2.5"
									>
										<div className="flex min-w-0 items-center gap-3">
											<span
												className="h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: getPlayerColor(player.id) }}
											/>
											<span className="truncate font-medium">
												{player.name}
											</span>
										</div>
										<button
											type="button"
											aria-label={`Remove ${player.name}`}
											onClick={() => removePlayer(player.id)}
											className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Manage game */}
					<div className="space-y-4">
						<SectionLabel>Manage Game</SectionLabel>
						<div className="space-y-1.5">
							<ConfirmButton
								icon={<RotateCcw className="h-4 w-4" />}
								label="Reset game"
								confirmLabel="Tap again to reset the game"
								doneLabel="Game reset — back to round 1"
								onConfirm={handleResetAll}
							/>
							<p className="px-1 text-xs text-muted-foreground">
								Sets every score back to zero and returns to round 1. Players
								stay at the table.
							</p>
						</div>
						<div className="space-y-1.5">
							<ConfirmButton
								destructive
								icon={<Trash2 className="h-4 w-4" />}
								label="Remove all players"
								confirmLabel="Tap again to remove everyone"
								doneLabel="All players removed"
								onConfirm={removeAllPlayers}
							/>
							<p className="px-1 text-xs text-muted-foreground">
								Clears everyone from the table so you can start a new group.
							</p>
						</div>
					</div>
				</div>

				<SheetClose asChild>
					<Button
						type="button"
						size="lg"
						className="mt-4 w-full shrink-0 text-base font-semibold"
					>
						Done
					</Button>
				</SheetClose>
			</SheetContent>
		</Sheet>
	);
};

export default App;
