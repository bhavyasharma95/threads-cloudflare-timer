export default {
	async fetch(request, env, ctx) {
		return new Response('Threads Timer Worker is running.');
	},
	async scheduled(event, env, ctx) {
		const secret = env.THREADS_SECRET;
		const baseUrl = 'https://threads-poster-ja32.onrender.com';

		// --- Clash guard: skip the 1-min ping for 3 ticks around a 45-min boundary ---
		// A "clash" occurs when the current minute-of-day is a multiple of 45.
		// We suppress the ping 1 minute before, on, and 1 minute after that boundary.
		if (event.cron === '* * * * *') {
			const minuteOfDay = Math.floor(Date.now() / 1000 / 60) % (60 * 24);
			const minuteInCycle = minuteOfDay % 45;
			// minuteInCycle === 0  → on the boundary
			// minuteInCycle === 44 → 1 minute before
			// minuteInCycle === 1  → 1 minute after
			const isClash = minuteInCycle === 0 || minuteInCycle === 44 || minuteInCycle === 1;
			if (isClash) {
				console.log(`Skipping 1-min ping (clash guard, minuteInCycle=${minuteInCycle})`);
				return;
			}
		}

		// --- Always (non-suppressed 1-min ticks + the 45-min tick): ping /trans ---
		try {
			await fetch(`${baseUrl}/trans`);
		} catch (e) {
			console.error('Ping failed:', e);
		}

		// --- Only on the 45-minute cron: post content ---
		if (event.cron === '*/45 * * * *') {
			const minuteOfDay = Math.floor(Date.now() / 1000 / 60);
			const useLatest = Math.floor(minuteOfDay / 45) % 2 === 0;
			const endpoint = useLatest ? '/post/latest' : '/post/carousel';
			try {
				const res = await fetch(`${baseUrl}${endpoint}`, {
					method: 'POST',
					headers: {
						'x-internal-secret': secret,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ limit: 1 }),
				});
				console.log(`Posted to ${endpoint}: ${res.status}`);
			} catch (e) {
				console.error(`Post to ${endpoint} failed:`, e);
			}
		}
	},
};
