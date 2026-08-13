'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function HorizonWarp() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  // Reveal only when the user has scrolled past the midpoint of this element
  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const el = wrapperRef.current;
    if (!el) return;

    gsap.set(el, { opacity: 0 });

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'center bottom',  // element centre enters bottom of viewport
      end:   'center 30%',     // element centre reaches 30% from top
      scrub: 2,
      onUpdate: (self) => {
        // Flat 0 for the first half of scroll progress, then 0→1 in the second half
        const progress = Math.max(0, (self.progress - 0.5) * 2);
        gsap.set(el, { opacity: progress });
      },
      onLeave:     () => gsap.set(el, { opacity: 1 }),
      onLeaveBack: () => gsap.set(el, { opacity: 0 }),
    });

    return () => st.kill();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const dpr = window.devicePixelRatio || 1;
    function resize() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00012,
      vy: -Math.random() * 0.00025 - 0.00008,
      size: Math.random() * 1.4 + 0.4,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
    }));

    const sparks = Array.from({ length: 28 }, () => ({
      x: Math.random(), life: Math.random(),
      speed: Math.random() * 0.018 + 0.006,
      size: Math.random() * 3.5 + 1.2,
      hue: Math.random() * 30,
      xDrift: (Math.random() - 0.5) * 0.0004,
    }));

    const plane = { xFrac: -0.1, speed: 0.0008 };

    function drawPlane(cx, cy, scale, alpha) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      const C = '#FF5B1D';
      const E = 'rgba(200,65,15,0.92)'; // slightly darker for engine pods

      // ── Fuselage — bezier-curved teardrop body ──────────────────
      ctx.fillStyle = C;
      ctx.beginPath();
      ctx.moveTo(40, 0);                              // nose tip
      ctx.bezierCurveTo(36, -5, 18, -7, 0, -7);      // upper-front
      ctx.lineTo(-32, -5);                            // upper-mid
      ctx.bezierCurveTo(-40, -4, -44, -2, -44, 0);   // tail point
      ctx.bezierCurveTo(-44, 2, -40, 4, -32, 5);     // tail-bottom
      ctx.lineTo(0, 7);                               // lower-mid
      ctx.bezierCurveTo(18, 7, 36, 5, 40, 0);        // lower-front
      ctx.closePath();
      ctx.fill();

      // ── Main wings — swept back ~28°, tapered ──────────────────
      // Upper wing
      ctx.beginPath();
      ctx.moveTo(10, -7);    // leading edge root
      ctx.lineTo(-8, -7);    // trailing edge root
      ctx.lineTo(-24, -44);  // trailing edge tip
      ctx.lineTo(-6, -44);   // leading edge tip
      ctx.closePath();
      ctx.fill();

      // Lower wing (mirror)
      ctx.beginPath();
      ctx.moveTo(10, 7);
      ctx.lineTo(-8, 7);
      ctx.lineTo(-24, 44);
      ctx.lineTo(-6, 44);
      ctx.closePath();
      ctx.fill();

      // Winglet tips (slight taper brightening)
      ctx.globalAlpha = alpha * 0.65;
      ctx.beginPath();
      ctx.moveTo(-6, -44); ctx.lineTo(-24, -44); ctx.lineTo(-26, -47); ctx.lineTo(-8, -47);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, 44); ctx.lineTo(-24, 44); ctx.lineTo(-26, 47); ctx.lineTo(-8, 47);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = alpha;

      // ── Engine nacelles under wings ─────────────────────────────
      ctx.fillStyle = E;
      ctx.beginPath();
      ctx.ellipse(-4, -28, 10, 3.5, -0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-4, 28, 10, 3.5, 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = C;

      // ── Horizontal tail stabilizers ─────────────────────────────
      // Upper stab
      ctx.beginPath();
      ctx.moveTo(-33, -5);
      ctx.lineTo(-41, -5);
      ctx.lineTo(-47, -19);
      ctx.lineTo(-39, -19);
      ctx.lineTo(-34, -6);
      ctx.closePath();
      ctx.fill();
      // Lower stab
      ctx.beginPath();
      ctx.moveTo(-33, 5);
      ctx.lineTo(-41, 5);
      ctx.lineTo(-47, 19);
      ctx.lineTo(-39, 19);
      ctx.lineTo(-34, 6);
      ctx.closePath();
      ctx.fill();

      // ── Vertical tail fin (dorsally visible from top) ───────────
      ctx.globalAlpha = alpha * 0.75;
      ctx.beginPath();
      ctx.moveTo(-34, -5);
      ctx.lineTo(-43, -21);
      ctx.lineTo(-39, -21);
      ctx.lineTo(-30, -5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }


    function draw() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const hY = H * (0.46 + Math.sin(t * 0.25) * 0.018);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#FFF8F5');
      bg.addColorStop(0.32, '#FFE8D8');
      bg.addColorStop(0.48, '#1C0C05');
      bg.addColorStop(0.62, '#080709');
      bg.addColorStop(1, '#070709');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const atmo = ctx.createRadialGradient(W/2, hY, 0, W/2, hY, W*0.75);
      atmo.addColorStop(0, 'rgba(255,91,29,0.20)');
      atmo.addColorStop(0.35, 'rgba(255,91,29,0.08)');
      atmo.addColorStop(1, 'rgba(255,91,29,0)');
      ctx.fillStyle = atmo;
      ctx.fillRect(0, 0, W, H);

      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        s.twinkle += s.twinkleSpeed;
        if (s.y < 0) s.y = 1;
        if (s.x < 0) s.x = 1; if (s.x > 1) s.x = 0;
        const sY = s.y * H;
        if (sY < hY + 20) return;
        const fade = Math.min(1, (sY - hY - 20) / 60);
        const a = (Math.sin(s.twinkle) * 0.25 + 0.75) * s.opacity * fade;
        ctx.beginPath(); ctx.arc(s.x * W, sY, s.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a * 0.15})`; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x * W, sY, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
      });

      ctx.save();
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255,91,29,0.35)';
      [{ x: W*0.08, label: 'LAT: 48.8566\u00b0 N' }, { x: W*0.68, label: 'LNG: 2.3522\u00b0 E' }, { x: W*0.38, label: 'ALT: 35,000 ft' }]
        .forEach(({ x, label }) => {
          ctx.fillText(label, x, hY + H * 0.28);
          ctx.beginPath(); ctx.moveTo(x - 4, hY + H*0.28 - 14); ctx.lineTo(x - 4, hY + H*0.28 - 8);
          ctx.strokeStyle = 'rgba(255,91,29,0.3)'; ctx.lineWidth = 1; ctx.stroke();
        });
      ctx.restore();

      const cY1 = hY - 12 + Math.sin(t * 0.4) * 5;
      const cY2 = hY + 12 + Math.cos(t * 0.3) * 4;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, hY); ctx.bezierCurveTo(W*0.3, cY1, W*0.7, cY2, W, hY);
      ctx.strokeStyle = 'rgba(255,91,29,0.06)'; ctx.lineWidth = 48; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,91,29,0.14)'; ctx.lineWidth = 18; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,91,29,0.35)'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = '#FF5B1D'; ctx.lineWidth = 1.8;
      ctx.shadowColor = '#FF5B1D'; ctx.shadowBlur = 8; ctx.stroke();
      ctx.restore();

      sparks.forEach(spark => {
        spark.life += spark.speed; spark.x += spark.xDrift;
        if (spark.life > 1) { spark.life = 0; spark.x = Math.random(); spark.xDrift = (Math.random()-0.5)*0.0004; }
        const p = spark.life;
        const a = Math.sin(p * Math.PI) * 0.85;
        const sY = hY - p * H * 0.38;
        const sX = spark.x * W;
        const r = spark.size * (1 - p * 0.55);
        ctx.beginPath(); ctx.arc(sX, sY, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${91+Math.floor(spark.hue*2.8)},29,${a})`; ctx.fill();
        ctx.beginPath(); ctx.arc(sX, sY, r*3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,91,29,${a*0.12})`; ctx.fill();
      });

      plane.xFrac += plane.speed;
      if (plane.xFrac > 1.12) plane.xFrac = -0.12;
      const pX = plane.xFrac * W;
      const pY = hY + Math.sin(t * 0.9 + 1.2) * 5 - 6;
      const trailLen = W * 0.14;
      const trail = ctx.createLinearGradient(pX - trailLen, 0, pX, 0);
      trail.addColorStop(0, 'rgba(255,91,29,0)');
      trail.addColorStop(0.6, 'rgba(255,91,29,0.2)');
      trail.addColorStop(1, 'rgba(255,91,29,0.55)');
      ctx.beginPath(); ctx.moveTo(pX - trailLen, pY); ctx.lineTo(pX, pY);
      ctx.strokeStyle = trail; ctx.lineWidth = 1.5;
      ctx.shadowColor = '#FF5B1D'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(pX + 22, pY, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,91,29,0.12)'; ctx.fill();
      drawPlane(pX, pY, 0.7, 0.9);

      t += 0.016;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div ref={wrapperRef} style={{ opacity: 0 }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full block max-w-full"
        style={{ height: '280px', display: 'block' }}
      />
    </div>
  );
}
