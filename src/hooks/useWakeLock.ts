import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keeps the screen awake while enabled, using the Screen Wake Lock API.
 * Browsers release the lock automatically when the tab is hidden, so we
 * re-acquire it whenever the page becomes visible again.
 */
export const useWakeLock = () => {
	const [enabled, setEnabled] = useState(false);
	const sentinelRef = useRef<WakeLockSentinel | null>(null);

	const isSupported =
		typeof navigator !== "undefined" && "wakeLock" in navigator;

	const release = useCallback(async () => {
		try {
			await sentinelRef.current?.release();
		} catch {
			// Releasing a lock that's already gone is fine to ignore.
		}
		sentinelRef.current = null;
	}, []);

	const acquire = useCallback(async () => {
		if (!isSupported) return;
		try {
			sentinelRef.current = await navigator.wakeLock.request("screen");
		} catch {
			// Request can reject (e.g. tab not visible); leave it released.
		}
	}, [isSupported]);

	useEffect(() => {
		if (!enabled) return;

		acquire();
		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") acquire();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			release();
		};
	}, [enabled, acquire, release]);

	const toggle = useCallback(() => setEnabled((prev) => !prev), []);

	return { enabled, isSupported, toggle };
};
