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
			console.log(
				`Outside active window (GMT ${now.getUTCHours()}:${String(now.getUTCMinutes()).padStart(2, '0')}), skipping image posts.`,
			);
			return;
		}

		// Count total minutes elapsed since epoch to track cron tick number
		const minuteOfDay = Math.floor(Date.now() / 1000 / 60);

		// English post: every 35–40 ticks (randomised each cycle)
		// We use a cycle length randomly picked between 35 and 40.
		// To keep it deterministic per cycle without state, we seed the cycle
		// boundary using integer division of minuteOfDay by 35, then add a
		// stable offset derived from that cycle index.
		const EN_MIN = 35;
		const EN_MAX = 40;
		const enCycleIndex = Math.floor(minuteOfDay / EN_MIN);
		// Pseudo-random offset in [0, EN_MAX - EN_MIN] based on cycle index
		const enOffset = enCycleIndex % (EN_MAX - EN_MIN + 1); // 0–5
		const enCycleLength = EN_MIN + enOffset;
		const enPositionInCycle = minuteOfDay % enCycleLength;

		// Hindi post: every 45–48 ticks (randomised each cycle)
		const HI_MIN = 45;
		const HI_MAX = 48;
		const hiCycleIndex = Math.floor(minuteOfDay / HI_MIN);
		const hiOffset = hiCycleIndex % (HI_MAX - HI_MIN + 1); // 0–3
		const hiCycleLength = HI_MIN + hiOffset;
		const hiPositionInCycle = minuteOfDay % hiCycleLength;

		// Fire English image post at the start of each EN cycle
		if (enPositionInCycle === 0) {
			console.log(`EN cycle ${enCycleIndex} triggered (length=${enCycleLength}), posting English image.`);
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

		// Fire Hindi image post at the start of each HI cycle
		if (hiPositionInCycle === 0) {
			console.log(`HI cycle ${hiCycleIndex} triggered (length=${hiCycleLength}), posting Hindi image.`);
			try {
				const res = await fetch(`${baseUrl}/post/image`, {
					method: 'POST',
					headers: {
						'x-internal-secret': secret,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ template_path: '1.png', language: 'hi' }),
				});
				console.log(`Hindi image post: ${res.status}`);
			} catch (e) {
				console.error('Hindi image post failed:', e);
			}
		}
	},
};
