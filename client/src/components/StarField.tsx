import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleOffset: number;
  twinkleSpeed: number;
  twinkleAmt: number;
};

type ShootingStar = {
  x: number;
  y: number;
  len: number;
  speed: number;
  angle: number;
  life: number;
  maxLife: number;
};

function makeStars(w: number, h: number): Star[] {
  return Array.from({ length: 260 }, () => {
    const big = Math.random() < 0.06;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: big ? Math.random() * 1.4 + 1.0 : Math.random() * 0.7 + 0.2,
      baseAlpha: big ? Math.random() * 0.4 + 0.5 : Math.random() * 0.45 + 0.25,
      twinkleOffset: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.8 + 0.25,
      twinkleAmt: Math.random() * 0.25 + 0.05,
    };
  });
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let stars: Star[] = [];
    let shooters: ShootingStar[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = makeStars(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnShooter = () => {
      shooters.push({
        x: Math.random() * canvas.width * 0.75 + canvas.width * 0.05,
        y: Math.random() * canvas.height * 0.45,
        len: Math.random() * 140 + 90,
        speed: Math.random() * 7 + 6,
        angle: (Math.random() * Math.PI) / 5 + Math.PI / 10,
        life: 0,
        maxLife: Math.random() * 28 + 18,
      });
    };

    let shooterTick = 0;
    let nextShooter = Math.random() * 300 + 200;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stars — pure white with twinkle
      stars.forEach((s) => {
        const twinkle = Math.sin(t * 0.001 * s.twinkleSpeed + s.twinkleOffset) * s.twinkleAmt;
        const a = Math.max(0, Math.min(1, s.baseAlpha + twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.fill();
      });

      // Shooting stars
      shooterTick++;
      if (shooterTick >= nextShooter) {
        spawnShooter();
        shooterTick = 0;
        nextShooter = Math.random() * 360 + 200;
      }

      shooters = shooters.filter((s) => s.life < s.maxLife);
      shooters.forEach((s) => {
        s.life++;
        const p = s.life / s.maxLife;
        const fade = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
        const hx = s.x + Math.cos(s.angle) * s.speed * s.life;
        const hy = s.y + Math.sin(s.angle) * s.speed * s.life;
        const tx = hx - Math.cos(s.angle) * s.len;
        const ty = hy - Math.sin(s.angle) * s.len;

        const grad = ctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.6, `rgba(220,235,255,${fade * 0.6})`);
        grad.addColorStop(1, `rgba(255,255,255,${fade})`);

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
