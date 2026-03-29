import { useAuth } from "@/_core/hooks/useAuth";
import { handleGoogleLoginClick } from "@/lib/google-oauth";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { Users, TrendingUp, FileText, MessageSquare, Lock, Cloud } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    }
  }, [isAuthenticated, user]);

  // Antigravity particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const orbs = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 60 + Math.random() * 180,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.12 - Math.random() * 0.25,
      hue: [210, 240, 270, 190, 300][i % 5],
      alpha: 0.06 + Math.random() * 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;

      orbs.forEach((o) => {
        o.pulse += 0.008;
        o.x += o.vx;
        o.y += o.vy;
        if (o.y + o.r < 0) { o.y = canvas.height + o.r; o.x = Math.random() * canvas.width; }
        if (o.x + o.r < 0) o.x = canvas.width + o.r;
        if (o.x - o.r > canvas.width) o.x = -o.r;

        const pulsedR = o.r + Math.sin(o.pulse) * 12;
        const alpha = o.alpha + Math.sin(o.pulse * 0.7) * 0.03;

        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, pulsedR);
        grad.addColorStop(0, `hsla(${o.hue}, 80%, 65%, ${alpha})`);
        grad.addColorStop(0.5, `hsla(${o.hue}, 70%, 50%, ${alpha * 0.5})`);
        grad.addColorStop(1, `hsla(${o.hue}, 60%, 40%, 0)`);

        ctx.beginPath();
        ctx.arc(o.x, o.y, pulsedR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050810" }}>
        <div style={{ width: 40, height: 40, border: "2px solid #334", borderTopColor: "#7B8CFF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const features = [
    { icon: Users, label: "Employee Management", desc: "Comprehensive profiles, easy CRUD, centralized data.", color: "#7B8CFF" },
    { icon: TrendingUp, label: "Payroll Management", desc: "Track salaries, process payroll, manage deductions.", color: "#A78BFA" },
    { icon: FileText, label: "Document Storage", desc: "Secure cloud storage for contracts and HR documents.", color: "#60D4F7" },
    { icon: MessageSquare, label: "HR Chatbot", desc: "Intelligent assistant for policies and onboarding.", color: "#7B8CFF" },
    { icon: Lock, label: "Role-Based Access", desc: "Secure admin and user roles with granular controls.", color: "#A78BFA" },
    { icon: Cloud, label: "Notifications", desc: "Real-time alerts for salary changes and HR events.", color: "#60D4F7" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050810", color: "#E8EAFF", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes floatUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gradShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .hero-title { animation: floatUp 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-sub { animation: floatUp 0.9s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-btns { animation: floatUp 0.9s 0.3s cubic-bezier(0.16,1,0.3,1) both; }
        .feat-card { animation: fadeIn 0.6s both; transition: transform 0.3s, box-shadow 0.3s; }
        .feat-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 60px rgba(100,120,255,0.2); }
        .glow-btn { background: linear-gradient(135deg, #7B8CFF, #A78BFA, #60D4F7); background-size: 200% 200%; animation: gradShift 4s ease infinite; transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s; }
        .glow-btn:hover { opacity: 0.92; transform: scale(1.03); box-shadow: 0 0 30px rgba(123,140,255,0.5); }
        .grid-line { position: absolute; background: rgba(123,140,255,0.04); }
      `}</style>

      {/* Animated canvas */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      {/* Subtle grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(123,140,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(123,140,255,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 10, borderBottom: "1px solid rgba(123,140,255,0.1)", backdropFilter: "blur(20px)", background: "rgba(5,8,16,0.6)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #7B8CFF, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px", color: "#fff" }}>Lunar-HR</span>
          </div>
          <button onClick={() => handleGoogleLoginClick()} className="glow-btn" style={{ border: "none", borderRadius: 12, padding: "10px 24px", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", letterSpacing: "0.2px" }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "120px 32px 80px" }}>
        <div style={{ maxWidth: 720 }}>
          <div className="hero-title" style={{ marginBottom: 8 }}>
            <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#7B8CFF", marginBottom: 24, padding: "6px 14px", border: "1px solid rgba(123,140,255,0.3)", borderRadius: 100, background: "rgba(123,140,255,0.08)" }}>
              HR Platform
            </span>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(42px, 6vw, 72px)", lineHeight: 1.05, letterSpacing: "-2px", color: "#fff" }}>
              Modern HR<br />
              <span style={{ background: "linear-gradient(135deg, #7B8CFF, #A78BFA, #60D4F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Management</span>
            </h1>
          </div>
          <p className="hero-sub" style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(232,234,255,0.55)", maxWidth: 540, marginBottom: 44 }}>
            Centralize employee data, streamline payroll operations, and automate HR workflows with a system built for modern teams.
          </p>
          <div className="hero-btns" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button onClick={() => handleGoogleLoginClick()} className="glow-btn" style={{ border: "none", borderRadius: 14, padding: "16px 36px", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <button style={{ border: "1px solid rgba(123,140,255,0.2)", borderRadius: 14, padding: "16px 36px", color: "rgba(232,234,255,0.6)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 16, cursor: "pointer", background: "rgba(123,140,255,0.05)", backdropFilter: "blur(10px)", transition: "all 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(123,140,255,0.5)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(123,140,255,0.2)")}>
              Learn More
            </button>
          </div>
        </div>

        {/* Floating stat pills */}
        <div style={{ position: "absolute", right: "5%", top: "15%", display: "flex", flexDirection: "column", gap: 12, opacity: 0.85 }}>
          {[["2,400+", "Employees Managed"], ["99.9%", "Uptime SLA"], ["< 1s", "Response Time"]].map(([val, label], i) => (
            <div key={i} style={{ background: "rgba(15,18,35,0.8)", border: "1px solid rgba(123,140,255,0.15)", borderRadius: 16, padding: "14px 20px", backdropFilter: "blur(20px)", animation: `floatUp 0.9s ${0.4 + i * 0.1}s both` }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>{val}</div>
              <div style={{ fontSize: 12, color: "rgba(232,234,255,0.4)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "40px 32px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-1px", color: "#fff", marginBottom: 12 }}>Powerful Features</h2>
          <p style={{ color: "rgba(232,234,255,0.4)", fontSize: 16 }}>Everything you need for modern HR management</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {features.map(({ icon: Icon, label, desc, color }, i) => (
            <div key={i} className="feat-card" style={{ animationDelay: `${i * 0.08}s`, background: "rgba(12,15,30,0.7)", border: "1px solid rgba(123,140,255,0.1)", borderRadius: 20, padding: "28px", backdropFilter: "blur(20px)", cursor: "default" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, border: `1px solid ${color}30` }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 8 }}>{label}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(232,234,255,0.45)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "60px 32px 100px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", background: "rgba(12,15,30,0.8)", border: "1px solid rgba(123,140,255,0.15)", borderRadius: 28, padding: "56px 40px", backdropFilter: "blur(30px)" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, letterSpacing: "-1px", color: "#fff", marginBottom: 14 }}>Ready to Transform<br />Your HR?</h2>
          <p style={{ color: "rgba(232,234,255,0.45)", fontSize: 16, lineHeight: 1.6, marginBottom: 36 }}>Join organizations using Lunar-HR to streamline operations and improve employee management.</p>
          <button onClick={() => handleGoogleLoginClick()} className="glow-btn" style={{ border: "none", borderRadius: 14, padding: "16px 44px", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Get Started with Google
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(123,140,255,0.08)", padding: "28px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "rgba(232,234,255,0.25)" }}>© 2026 Lunar-HR. All rights reserved.</p>
          <div style={{ display: "flex", gap: 28 }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: "rgba(232,234,255,0.25)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={e => (e.currentTarget.style.color = "rgba(232,234,255,0.7)")}
                onMouseOut={e => (e.currentTarget.style.color = "rgba(232,234,255,0.25)")}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
