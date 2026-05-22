export default {
	async fetch(request, env, ctx) {
		return new Response('Threads Timer Worker is running.');
	},
	async scheduled(event, env, ctx) {
		const secret = env.THREADS_SECRET;
		const baseUrl = 'https://threads-poster-ja32.onrender.com';

		// --- Language switches: set to true/false to enable/disable ---
		const enableEn = true;
		const enableHi = true;
		const enableTe = false;

		const now = new Date(Date.now());
		const gmtMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
		const windowStart = 0 * 60 + 30;
		const windowEnd = 16 * 60 + 30;
		const inActiveWindow = gmtMinutes >= windowStart && gmtMinutes < windowEnd;
		const minuteOfDay = Math.floor(Date.now() / 1000 / 60);
		const EN_MIN = 20;
		const EN_MAX = 22;
		const enCycleIndex = Math.floor(minuteOfDay / EN_MIN);
		const enCycleLength = EN_MIN + (enCycleIndex % (EN_MAX - EN_MIN + 1));
		const enPositionInCycle = minuteOfDay % enCycleLength;
		const isEnTick = enPositionInCycle === 0;
		const HI_OFFSET = 10;
		const hiMinuteShifted = minuteOfDay - HI_OFFSET;
		const hiCycleIndex = Math.floor(hiMinuteShifted / EN_MIN);
		const hiCycleLength = EN_MIN + (hiCycleIndex % (EN_MAX - EN_MIN + 1));
		const hiPositionInCycle = hiMinuteShifted % hiCycleLength;
		const isHiTick = hiMinuteShifted >= 0 && hiPositionInCycle === 0;
		const TE_OFFSET = 5;
		const teMinuteShifted = minuteOfDay - TE_OFFSET;
		const teCycleIndex = Math.floor(teMinuteShifted / EN_MIN);
		const teCycleLength = EN_MIN + (teCycleIndex % (EN_MAX - EN_MIN + 1));
		const tePositionInCycle = teMinuteShifted % teCycleLength;
		const isTeTick = teMinuteShifted >= 0 && tePositionInCycle === 0;
		const isImageTick = (isEnTick && enableEn) || (isHiTick && enableHi) || (isTeTick && enableTe);
		if (isImageTick && inActiveWindow) {
			if (isEnTick && enableEn) {
				console.log(`EN cycle ${enCycleIndex} (length=${enCycleLength}min): posting English image.`);
				try {
					const res = await fetch(`${baseUrl}/post/image`, {
						method: 'POST',
						headers: { 'x-internal-secret': secret, 'Content-Type': 'application/json' },
						body: JSON.stringify({ template_path: '1.png', language: 'en' }),
					});
					console.log(`English image post: ${res.status}`);
				} catch (e) {
					console.error('English image post failed:', e);
				}
			}
			if (isHiTick && enableHi) {
				console.log(`HI cycle ${hiCycleIndex} (length=${hiCycleLength}min): posting Hindi image.`);
				try {
					const res = await fetch(`${baseUrl}/post/image`, {
						method: 'POST',
						headers: { 'x-internal-secret': secret, 'Content-Type': 'application/json' },
						body: JSON.stringify({ template_path: '1.png', language: 'hi' }),
					});
					console.log(`Hindi image post: ${res.status}`);
				} catch (e) {
					console.error('Hindi image post failed:', e);
				}
			}
			if (isTeTick && enableTe) {
				console.log(`TE cycle ${teCycleIndex} (length=${teCycleLength}min): posting Telugu image.`);
				try {
					const res = await fetch(`${baseUrl}/post/image`, {
						method: 'POST',
						headers: { 'x-internal-secret': secret, 'Content-Type': 'application/json' },
						body: JSON.stringify({ template_path: '1.png', language: 'te' }),
					});
					console.log(`Telugu image post: ${res.status}`);
				} catch (e) {
					console.error('Telugu image post failed:', e);
				}
			}
		} else {
			try {
				await fetch(`${baseUrl}/trans`);
			} catch (e) {
				console.error('Ping /trans failed:', e);
			}
		}
	},
};
