/* 庆祝彩带：Canvas 粒子，零依赖，仅在冲刺时启动动画循环 */
const Confetti = (() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  // 脚本在 body 末尾加载，DOM 已就绪，直接追加即可
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5', '#F15BB5', '#FF9F43', '#FFFFFF'];
  let parts = [];
  let running = false;
  let frame = null;
  const timers = new Set();
  function later(fn, delay) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, delay);
    timers.add(id);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function burst(cx, cy, n = 60, power = 1) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < n; i++) {
      parts.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 14 * power,
        vy: -Math.random() * 12 * power - 4,
        g: 0.32,
        size: 6 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.floor(Math.random() * 3), // 0圆 1方 2三角
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        life: 70 + Math.random() * 40,
      });
    }
    start();
  }

  function burstAtEl(el) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 60, 1);
  }

  function celebrate() {
    const w = window.innerWidth, h = window.innerHeight;
    burst(w * 0.2, h * 0.35, 55, 1.2);
    burst(w * 0.8, h * 0.35, 55, 1.2);
    later(() => burst(w / 2, h * 0.3, 80, 1.3), 250);
    later(() => burst(w * 0.35, h * 0.5, 40), 500);
    later(() => burst(w * 0.65, h * 0.5, 40), 700);
  }

  function start() {
    if (running) return;
    running = true;
    frame = requestAnimationFrame(loop);
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter(p => p.life > 0 && p.y < canvas.height + 40);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr; p.life--;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.color;
      if (p.shape === 0) {
        ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
      } else if (p.shape === 1) {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    if (parts.length) { frame = requestAnimationFrame(loop); }
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  function stop() {
    timers.forEach(clearTimeout); timers.clear();
    cancelAnimationFrame(frame); frame = null; parts = []; running = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  return { burst, burstAtEl, celebrate, stop };
})();
