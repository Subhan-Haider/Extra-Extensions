/**
 * LootOps: Nebula HUD Logic
 */

const renderVault = (games, targetId, isUpcoming = false) => {
	const zone = document.getElementById(targetId);
	const label = zone.previousElementSibling;

	if (!games || games.length === 0) {
		zone.style.display = "none";
		if (label) label.style.display = "none";
		return;
	}

	zone.style.display = "block";
	if (label) label.style.display = "flex";
	zone.innerHTML = "";

	games.forEach((game, i) => {
		const rawPrice = (game.price?.totalPrice?.fmtPrice?.originalPrice || "0").replace(/[^0-9.]/g, '');
		const val = parseFloat(rawPrice) || 0;
		const isHot = val >= 20;
		const priceStr = game.price?.totalPrice?.fmtPrice?.originalPrice || "FREE";
		const platform = game.isSteam ? "STEAM" : "EPIC";
		const endT = isUpcoming ? game.startDate : game.endDate;
		const tid = `t-${targetId}-${i}`;

		let img = "";
		if (game.isSteam) {
			img = game.keyImages?.[0]?.url || "../icons/icon128.png";
		} else {
			const wide = game.keyImages?.find(o => o.type === "OfferImageWide")?.url || game.keyImages?.[0]?.url;
			img = img = (wide || game.keyImages?.[0]?.url) + "?h=200&resize=1";
		}

		let url = game.link;
		if (!url) {
			const slug = game.catalogNs?.mappings?.[0]?.pageSlug || game.productSlug || game.urlSlug;
			url = `https://store.epicgames.com/${game.offerType === "BUNDLE" ? "bundles/" : "p/"}${slug}`;
		}

		const panel = document.createElement("a");
		panel.className = "loot-panel";
		panel.href = url;
		panel.style.animationDelay = `${i * 0.08}s`;

		panel.innerHTML = `
			<div class="img-box">
				<img src="${img}" class="img-actual" alt="${game.title}">
				<div class="badge-layer">
					<div class="chip">${platform}</div>
					${isHot ? '<div class="chip hot-chip">HOT</div>' : ''}
				</div>
			</div>
			<div class="loot-content">
				<div class="loot-title">${game.title}</div>
				<div class="loot-stats">
					<div class="timer-group">
						<span class="timer-tag">${isUpcoming ? 'Unlocks' : 'Expires'}</span>
						<span id="${tid}" class="timer-tick">--:--:--</span>
					</div>
					<div class="price-pill">${priceStr}</div>
				</div>
			</div>
			<button class="quick-share" data-title="${game.title}" data-url="${url}" title="Share Intel">
				<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
			</button>
		`;

		// Timer Logic
		const el = panel.querySelector("#" + tid);
		if (endT) {
			const target = new Date(endT).getTime();
			const tick = () => {
				const now = Date.now();
				const dist = target - now;
				if (!el) return;

				if (dist < 0) {
					el.innerText = isUpcoming ? "GO LIVE" : "ENDED";
					el.className = "timer-tick";
					return;
				}

				const d = Math.floor(dist / 86400000);
				const h = Math.floor((dist % 86400000) / 3600000);
				const m = Math.floor((dist % 3600000) / 60000);
				const s = Math.floor((dist % 60000) / 1000);

				if (!isUpcoming) {
					if (dist < 3600000) el.className = "timer-tick urgent";
					else if (dist < 86400000) el.className = "timer-tick expiring";
				}

				if (d > 0) el.innerText = `${d}D ${h}H ${m}M`;
				else el.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
			};
			tick();
			setInterval(tick, 1000);
		} else if (game.isSteam) {
			if (el) el.innerText = "LIMITED TIME";
		}

		// Share Event
		panel.querySelector('.quick-share').addEventListener('click', (e) => {
			e.preventDefault(); e.stopPropagation();
			const btn = e.currentTarget;
			const text = `FREE LOOT! ${btn.dataset.title} is currently $0.00. Grab it: ${btn.dataset.url}`;
			navigator.clipboard.writeText(text).then(() => {
				const old = btn.innerHTML;
				btn.innerText = "COPIED";
				btn.style.width = "auto";
				btn.style.padding = "0 8px";
				setTimeout(() => {
					btn.innerHTML = old;
					btn.style.width = "24px";
					btn.style.padding = "0";
				}, 2000);
			});
		});

		panel.onclick = (e) => {
			if (e.target.closest('.quick-share')) return;
			e.preventDefault();
			chrome.tabs.create({ url, active: true });
		};

		zone.appendChild(panel);
	});
};

const setupSystem = () => {
	const pnl = document.getElementById("sys-pnl");
	const open = document.getElementById("gear-open");
	const close = document.getElementById("gear-close");
	const sync = document.getElementById("sync-btn");

	open.onclick = () => pnl.classList.add("active");
	close.onclick = () => pnl.classList.remove("active");

	const sws = {
		lightMode: document.getElementById("sw-theme"),
		notifications: document.getElementById("sw-notif"),
		showBadge: document.getElementById("sw-badge")
	};

	chrome.storage.local.get(["settings"]).then(res => {
		const s = res.settings || { lightMode: false, notifications: true, showBadge: true };

		if (s.lightMode) document.body.classList.add("light-mode");

		Object.keys(sws).forEach(k => {
			if (s[k]) sws[k].classList.add("on");
			else sws[k].classList.remove("on");

			sws[k].onclick = () => {
				sws[k].classList.toggle("on");
				s[k] = sws[k].classList.contains("on");

				if (k === 'lightMode') document.body.classList.toggle("light-mode", s[k]);
				chrome.storage.local.set({ settings: s });
			};
		});
	});

	sync.onclick = () => {
		const original = sync.innerText;
		sync.innerText = "SYNCING...";
		chrome.runtime.sendMessage("forceRefresh").then(() => {
			setTimeout(() => window.location.reload(), 1000);
		});
	};
};

// Execution
chrome.runtime.sendMessage("currentGames").then(data => {
	if (!data) return;
	renderVault(data.currentGames, "loot-active", false);
	renderVault(data.upcomingGames, "loot-upcoming", true);

	if (data.currentGames) {
		const total = data.currentGames.reduce((acc, g) => {
			const p = parseFloat((g.price?.totalPrice?.fmtPrice?.originalPrice || "0").replace(/[^0-9.]/g, '')) || 0;
			return acc + p;
		}, 0);
		document.getElementById("savings-pill").innerText = `SAVED $${total.toFixed(2)}`;
	}
});

setupSystem();
