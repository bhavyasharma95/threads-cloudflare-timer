export default {
	async fetch(request, env, ctx) {
		return new Response('Threads Timer Worker is running.');
	},

	async scheduled(event, env, ctx) {
		const secret = env.THREADS_SECRET;
		const baseUrl = 'https://threads-poster-ja32.onrender.com';

		// --- Always: ping the base URL to keep the server warm ---
		try {
			await fetch(`${baseUrl}/`);
		} catch (e) {
			console.error('Ping failed:', e);
		}

		// --- Only on the 45-minute cron: post content ---
		if (event.cron === '*/45 * * * *') {
			// Alternate between /post/latest and /post/carousel
			// Uses the current minute-of-day to decide which to call
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
