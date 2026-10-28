// interactive constellation: nodes drift, link when close, and swarm toward the cursor
(function () {
	var canvas = document.getElementById('constellation');
	if (!canvas) return;
	var ctx = canvas.getContext('2d');
	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var LINK = 140;          // max link distance (px)
	var MOUSE_R = 190;       // cursor influence radius
	var COLORS = ['143,155,255', '255,143,209', '120,235,200'];

	var w, h, dpr, nodes = [];
	var mouse = { x: -9999, y: -9999, active: false };

	function resize() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		w = document.documentElement.clientWidth;
		h = document.documentElement.clientHeight;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = w + 'px';
		canvas.style.height = h + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		var count = Math.round(Math.min(110, (w * h) / 14000));
		nodes = [];
		for (var i = 0; i < count; i++) {
			nodes.push({
				x: Math.random() * w,
				y: Math.random() * h,
				vx: (Math.random() - 0.5) * 0.35,
				vy: (Math.random() - 0.5) * 0.35,
				r: Math.random() * 1.4 + 0.8,
				c: COLORS[Math.floor(Math.random() * COLORS.length)]
			});
		}
	}

	function step() {
		ctx.clearRect(0, 0, w, h);

		for (var i = 0; i < nodes.length; i++) {
			var a = nodes[i];

			// gentle pull toward the cursor, with a soft push when very close
			if (mouse.active) {
				var dx = mouse.x - a.x, dy = mouse.y - a.y;
				var d = Math.sqrt(dx * dx + dy * dy);
				if (d < MOUSE_R && d > 0.01) {
					var f = (1 - d / MOUSE_R);
					var dir = d < 60 ? -1.5 : 1;
					a.vx += (dx / d) * f * 0.03 * dir;
					a.vy += (dy / d) * f * 0.03 * dir;
				}
			}

			// damping + speed cap keeps motion calm
			a.vx *= 0.985;
			a.vy *= 0.985;
			a.x += a.vx;
			a.y += a.vy;

			// wrap around the edges
			if (a.x < -10) a.x = w + 10; else if (a.x > w + 10) a.x = -10;
			if (a.y < -10) a.y = h + 10; else if (a.y > h + 10) a.y = -10;

			// keep a minimum drift so nothing freezes
			if (Math.abs(a.vx) + Math.abs(a.vy) < 0.08) {
				a.vx += (Math.random() - 0.5) * 0.04;
				a.vy += (Math.random() - 0.5) * 0.04;
			}

			// links
			for (var j = i + 1; j < nodes.length; j++) {
				var b = nodes[j];
				var lx = a.x - b.x, ly = a.y - b.y;
				var dist = Math.sqrt(lx * lx + ly * ly);
				if (dist < LINK) {
					var alpha = (1 - dist / LINK) * 0.35;
					ctx.strokeStyle = 'rgba(' + a.c + ',' + alpha + ')';
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(b.x, b.y);
					ctx.stroke();
				}
			}

			// bright links from cursor to nearby nodes
			if (mouse.active) {
				var mx = a.x - mouse.x, my = a.y - mouse.y;
				var md = Math.sqrt(mx * mx + my * my);
				if (md < MOUSE_R) {
					ctx.strokeStyle = 'rgba(' + a.c + ',' + (1 - md / MOUSE_R) * 0.6 + ')';
					ctx.beginPath();
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(mouse.x, mouse.y);
					ctx.stroke();
				}
			}

			// node glow
			ctx.fillStyle = 'rgba(' + a.c + ',0.9)';
			ctx.shadowColor = 'rgba(' + a.c + ',0.9)';
			ctx.shadowBlur = 10;
			ctx.beginPath();
			ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
			ctx.fill();
			ctx.shadowBlur = 0;
		}

		if (!reduced) requestAnimationFrame(step);
	}

	window.addEventListener('mousemove', function (e) {
		mouse.x = e.clientX;
		mouse.y = e.clientY;
		mouse.active = true;
		document.documentElement.style.setProperty('--mx', e.clientX + 'px');
		document.documentElement.style.setProperty('--my', e.clientY + 'px');
	});
	window.addEventListener('mouseleave', function () { mouse.active = false; });
	window.addEventListener('touchmove', function (e) {
		var t = e.touches[0];
		mouse.x = t.clientX;
		mouse.y = t.clientY;
		mouse.active = true;
	}, { passive: true });
	window.addEventListener('touchend', function () { mouse.active = false; });

	var resizeTimer;
	window.addEventListener('resize', function () {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function () { resize(); if (reduced) step(); }, 150);
	});

	resize();
	step();
})();
