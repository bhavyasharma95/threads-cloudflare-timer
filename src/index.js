export default {
	async fetch(request, env, ctx) {
		return new Response('Threads Timer Worker is running.');
	},

	async scheduled(event, env, ctx) {
		const secret = env.THREADS_SECRET;
		const baseUrl = 'https://threads-poster-ja32.onrender.com';

		// Always ping /trans
		try {
			await fetch(`${baseUrl}/trans`);
		} catch (e) {
			console.error('Ping /trans failed:', e);
		}

		// Check if we're within the active window: 00:30 GMT to 16:30 GMT
		const now = new Date(Date.now());
		const gmtMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
		const windowStart = 0 * 60 + 30; // 00:30 GMT = 30 minutes
		const windowEnd = 16 * 60 + 30; // 16:30 GMT = 990 minutes
		const inActiveWindow = gmtMinutes >= windowStart && gmtMinutes < windowEnd;

		if (!inActiveWindow) {
			console.log(`Outside active window (GMT ${now.getUTCHours()}:${String(now.getUTCMinutes()).padStart(2, '0')}), skipping image post.`);
			return;
		}

		// Total minutes elapsed since epoch — our stateless clock
		const minuteOfDay = Math.floor(Date.now() / 1000 / 60);

		// English post: every 40–45 minutes (cycle rotates to avoid a fixed interval)
		// Cycle length steps through 40→41→42→43→44→45→40… based on cycle index
		const EN_MIN = 40;
		const EN_MAX = 45;
		const enCycleIndex = Math.floor(minuteOfDay / EN_MIN);
		const enCycleLength = EN_MIN + (enCycleIndex % (EN_MAX - EN_MIN + 1)); // 40–45
		const enPositionInCycle = minuteOfDay % enCycleLength;

		if (enPositionInCycle === 0) {
			console.log(`EN cycle ${enCycleIndex} triggered (length=${enCycleLength} min), posting English image.`);
			try {
				const res = await fetch(`${baseUrl}/post/image`, {
					method: 'POST',
					headers: {
						'x-internal-secret': secret,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ template_path: '1.png', language: 'en' }),
				});
				console.log(`English image post: ${res.status}`);
			} catch (e) {
				console.error('English image post failed:', e);
			}
		}
	},
};
