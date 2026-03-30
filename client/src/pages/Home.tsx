import { useAuth } from "@/_core/hooks/useAuth";
import { handleGoogleLoginClick } from "@/lib/google-oauth";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Users, TrendingUp, FileText, MessageSquare, Lock, Bell } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    }
  }, [isAuthenticated, user]);

  // Animated orb canvas — skipped on low-power devices
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

    const orbs = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 80 + Math.random() * 160,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.2,
      hue: [210, 240, 270, 190][i % 4],
      alpha: 0.05 + Math.random() * 0.08,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      orbs.forEach((o) => {
        o.pulse += 0.007;
        o.x += o.vx;
        o.y += o.vy;
        if (o.y + o.r < 0) { o.y = canvas.height + o.r; o.x = Math.random() * canvas.width; }
        if (o.x + o.r < 0) o.x = canvas.width + o.r;
        if (o.x - o.r > canvas.width) o.x = -o.r;
        const pr = o.r + Math.sin(o.pulse) * 10;
        const a = o.alpha + Math.sin(o.pulse * 0.7) * 0.025;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, pr);
        g.addColorStop(0, `hsla(${o.hue},80%,65%,${a})`);
        g.addColorStop(0.5, `hsla(${o.hue},70%,50%,${a * 0.4})`);
        g.addColorStop(1, `hsla(${o.hue},60%,40%,0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const handleSignIn = () => {
    try {
      handleGoogleLoginClick();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      setAuthError(msg);
      console.error("[Auth]", msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050810]">
        <div className="w-10 h-10 rounded-full border-2 border-[#334] border-t-[#7B8CFF] animate-spin" />
      </div>
    );
  }

  const features = [
    { icon: Users,        label: "Employee Management", desc: "Comprehensive profiles with department tracking and status management.", color: "#7B8CFF" },
    { icon: TrendingUp,   label: "Payroll Processing",  desc: "Track salaries, manage allowances, deductions, and payroll history.",  color: "#A78BFA" },
    { icon: FileText,     label: "Leave Management",    desc: "Request, approve and track leave across all types in one place.",      color: "#60D4F7" },
    { icon: MessageSquare,label: "HR Assistant",        desc: "AI-powered chatbot for policies, onboarding, and HR queries.",         color: "#7B8CFF" },
    { icon: Lock,         label: "Role-Based Access",   desc: "Secure admin and employee roles with granular access controls.",       color: "#A78BFA" },
    { icon: Bell,         label: "Notifications",       desc: "Real-time alerts for salary changes, leave approvals, and HR events.", color: "#60D4F7" },
  ];

  return (
    <div className="min-h-screen bg-[#050810] text-[#E8EAFF] overflow-x-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .home * { box-sizing: border-box; }
        @keyframes floatUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .anim-1 { animation: floatUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .anim-2 { animation: floatUp 0.8s 0.12s cubic-bezier(0.16,1,0.3,1) both; }
        .anim-3 { animation: floatUp 0.8s 0.24s cubic-bezier(0.16,1,0.3,1) both; }
        .feat-card { transition: transform 0.3s, box-shadow 0.3s; }
        .feat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 60px rgba(100,120,255,0.18); }
        .glow-btn {
          background: linear-gradient(135deg,#7B8CFF,#A78BFA,#60D4F7);
          background-size: 200% 200%;
          animation: gradShift 4s ease infinite;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          border: none;
          cursor: pointer;
        }
        .glow-btn:hover { opacity:0.9; transform:scale(1.02); box-shadow:0 0 28px rgba(123,140,255,0.45); }
        .glow-btn:active { transform:scale(0.98); }
        .ghost-btn {
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          cursor: pointer;
        }
        .ghost-btn:hover { border-color: rgba(123,140,255,0.45) !important; color: rgba(232,234,255,0.85) !important; }
      `}</style>

      {/* Canvas background */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Grid overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(123,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(123,140,255,0.03) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="home relative z-10">
        {/* Nav */}
        <nav style={{ borderBottom: "1px solid rgba(123,140,255,0.1)", backdropFilter: "blur(20px)", background: "rgba(5,8,16,0.7)" }}
          className="sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#7B8CFF,#A78BFA)" }}>
                <Users size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.4px", color: "#fff" }}>
                Lunar-HR
              </span>
            </div>
            <button onClick={handleSignIn} className="glow-btn shrink-0"
              style={{ borderRadius: 10, padding: "9px 20px", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14 }}>
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            {/* Left: text */}
            <div className="flex-1 max-w-xl">
              <div className="anim-1">
                <span style={{
                  display: "inline-block", fontSize: 11, fontWeight: 600, letterSpacing: "2px",
                  textTransform: "uppercase", color: "#7B8CFF", marginBottom: 20,
                  padding: "5px 12px", border: "1px solid rgba(123,140,255,0.3)",
                  borderRadius: 100, background: "rgba(123,140,255,0.08)"
                }}>
                  HR Platform
                </span>
                <h1 style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 800,
                  fontSize: "clamp(36px,6vw,64px)", lineHeight: 1.06,
                  letterSpacing: "-2px", color: "#fff", marginBottom: 20
                }}>
                  Modern HR<br />
                  <span style={{ background: "linear-gradient(135deg,#7B8CFF,#A78BFA,#60D4F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Management
                  </span>
                </h1>
              </div>

              <p className="anim-2" style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(232,234,255,0.5)", marginBottom: 32, maxWidth: 480 }}>
                Centralize employee data, streamline payroll, and automate HR workflows — built for modern teams.
              </p>

              {/* Error message */}
              {authError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: "#FCA5A5", margin: 0 }}>{authError}</p>
                </div>
              )}

              <div className="anim-3 flex flex-wrap gap-3">
                {/* Primary CTA */}
                <button onClick={handleSignIn} className="glow-btn flex items-center gap-2.5"
                  style={{ borderRadius: 12, padding: "14px 28px", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 15 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Ghost CTA */}
                <a href="#features" className="ghost-btn flex items-center"
                  style={{ borderRadius: 12, padding: "14px 24px", color: "rgba(232,234,255,0.5)", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 15, background: "rgba(123,140,255,0.05)", border: "1px solid rgba(123,140,255,0.15)", textDecoration: "none" }}>
                  See features
                </a>
              </div>
            </div>

            {/* Right: stat pills — stacks below on mobile */}
            <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 flex-wrap lg:flex-nowrap lg:items-end">
              {[["2,400+", "Employees managed"], ["99.9%", "Uptime SLA"], ["< 1s", "Response time"]].map(([val, label], i) => (
                <div key={i} style={{
                  background: "rgba(15,18,35,0.85)", border: "1px solid rgba(123,140,255,0.15)",
                  borderRadius: 16, padding: "14px 20px", backdropFilter: "blur(20px)",
                  animation: `floatUp 0.8s ${0.35 + i * 0.1}s both`,
                  minWidth: 120,
                }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 12, color: "rgba(232,234,255,0.4)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <div className="text-center mb-10 sm:mb-14">
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(24px,4vw,40px)", letterSpacing: "-1px", color: "#fff", marginBottom: 10 }}>
              Powerful features
            </h2>
            <p style={{ color: "rgba(232,234,255,0.4)", fontSize: 15 }}>Everything your team needs, nothing you don't</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map(({ icon: Icon, label, desc, color }, i) => (
              <div key={i} className="feat-card" style={{
                animationDelay: `${i * 0.07}s`,
                background: "rgba(12,15,30,0.7)",
                border: "1px solid rgba(123,140,255,0.1)",
                borderRadius: 18, padding: "24px",
                backdropFilter: "blur(20px)",
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: `1px solid ${color}28` }}>
                  <Icon size={18} color={color} />
                </div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 8 }}>{label}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "rgba(232,234,255,0.42)", margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA block */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
          <div style={{ background: "rgba(12,15,30,0.85)", border: "1px solid rgba(123,140,255,0.15)", borderRadius: 24, padding: "clamp(32px,5vw,56px) clamp(24px,5vw,48px)", backdropFilter: "blur(30px)", textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(22px,4vw,36px)", letterSpacing: "-1px", color: "#fff", marginBottom: 12 }}>
              Ready to transform your HR?
            </h2>
            <p style={{ color: "rgba(232,234,255,0.42)", fontSize: 15, lineHeight: 1.65, marginBottom: 28, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
              Join teams using Lunar-HR to streamline operations and improve employee management.
            </p>
            <button onClick={handleSignIn} className="glow-btn inline-flex items-center gap-2.5"
              style={{ borderRadius: 12, padding: "14px 32px", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 15 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Get started with Google
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid rgba(123,140,255,0.08)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p style={{ fontSize: 12, color: "rgba(232,234,255,0.22)", margin: 0 }}>© 2026 Lunar-HR. All rights reserved.</p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Contact"].map(l => (
                <a key={l} href="#" style={{ fontSize: 12, color: "rgba(232,234,255,0.22)", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseOver={e => (e.currentTarget.style.color = "rgba(232,234,255,0.65)")}
                  onMouseOut={e => (e.currentTarget.style.color = "rgba(232,234,255,0.22)")}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
