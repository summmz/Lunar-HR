import { useEffect, useRef } from "react";

// Only render on devices with a fine pointer (mouse)
const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export default function BlobCursor() {
  if (isTouchDevice()) return null;
  const blobRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const target = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const raf = useRef<number>(0);
  const isVisible = useRef(false);

  useEffect(() => {
    const blob = blobRef.current;
    if (!blob) return;

    const onMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!isVisible.current) {
        pos.current = { x: e.clientX, y: e.clientY };
        blob.style.opacity = "1";
        isVisible.current = true;
      }
    };

    const onMouseLeave = () => {
      blob.style.opacity = "0";
      isVisible.current = false;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      pos.current.x = lerp(pos.current.x, target.current.x, 0.08);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.08);

      blob.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Main blob */}
      <div
        ref={blobRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
          transition: "opacity 0.4s ease",
          background:
            "radial-gradient(circle at center, oklch(0.65 0.15 220 / 0.18) 0%, oklch(0.75 0.12 350 / 0.10) 50%, transparent 70%)",
          filter: "blur(40px)",
          willChange: "transform",
        }}
      />
      {/* Small sharp cursor dot */}
      <SharpDot />
    </>
  );
}

function SharpDot() {
  const dotRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    let x = -100, y = -100;

    const onMouseMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.opacity = "1";
    };

    const onMouseLeave = () => {
      dot.style.opacity = "0";
    };

    const animate = () => {
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 10000,
        opacity: 0,
        transition: "opacity 0.3s ease",
        background: "oklch(0.85 0.10 220)",
        willChange: "transform",
      }}
    />
  );
}
