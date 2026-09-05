"use client";

import React, { useEffect, useRef, useState } from "react";

interface StatItem {
  icon: string;
  target: number;
  decimals: number;
  suffix: string;
  label: string;
  duration: number;
  delay: number;
}

const STATS: StatItem[] = [
  {
    icon: "<",
    target: 120,
    decimals: 0,
    suffix: "ms",
    label: "Inference Time",
    duration: 1500,
    delay: 350,
  },
  {
    icon: "%",
    target: 99.99,
    decimals: 2,
    suffix: "%",
    label: "Platform Uptime",
    duration: 1580,
    delay: 450,
  },
  {
    icon: "*",
    target: 24,
    decimals: 0,
    suffix: "/7",
    label: "Autonomous Runtime",
    duration: 1660,
    delay: 550,
  },
  {
    icon: "#",
    target: 2.4,
    decimals: 1,
    suffix: "M",
    label: "Context Windows",
    duration: 1740,
    delay: 650,
  },
];

export default function Hero(): React.JSX.Element {
  const [counts, setCounts] = useState<string[]>(STATS.map((s) => (0).toFixed(s.decimals)));
  const statsRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!statsRef.current) return;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateValue = (
      index: number,
      target: number,
      decimals: number,
      duration: number,
      delay: number
    ) => {
      setTimeout(() => {
        let startTime: number | null = null;
        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = easeOutCubic(progress) * target;

          setCounts((prev) => {
            const next = [...prev];
            next[index] = current.toFixed(decimals);
            return next;
          });

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            setCounts((prev) => {
              const next = [...prev];
              next[index] = target.toFixed(decimals);
              return next;
            });
          }
        };
        requestAnimationFrame(step);
      }, delay);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animatedRef.current) {
            animatedRef.current = true;
            STATS.forEach((stat, idx) => {
              animateValue(idx, stat.target, stat.decimals, stat.duration, stat.delay);
            });
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full min-h-[calc(100vh-80px)] flex flex-col justify-between items-center text-center px-4 sm:px-6 pt-10 sm:pt-14 pb-8 max-w-[1000px] mx-auto z-10"
    >
      {/* Middle Region: Trust Row, Dot-Matrix Headline, Subhead, Glowing CTA */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-[850px] my-auto">
        {/* Trust Row */}
        <div
          className="inline-flex items-center mb-6 sm:mb-8 anim-reveal"
          style={{ "--d": "0.05s" } as React.CSSProperties}
        >
          {/* Avatar 1: Microsoft */}
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#28282a] border border-white/40 p-1 flex items-center justify-center relative z-10 hover:-translate-y-0.5 transition-transform"
            title="Microsoft"
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <i className="fa-brands fa-microsoft text-black text-sm" aria-hidden="true" />
            </div>
          </div>

          {/* Avatar 2: Amazon */}
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#28282a] border border-white/40 p-1 flex items-center justify-center relative -ml-4 z-20 hover:-translate-y-0.5 transition-transform"
            title="Amazon"
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <i className="fa-brands fa-amazon text-black text-sm" aria-hidden="true" />
            </div>
          </div>

          {/* Avatar 3: Google */}
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#28282a] border border-white/40 p-1 flex items-center justify-center relative -ml-4 z-30 hover:-translate-y-0.5 transition-transform"
            title="Google"
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <i className="fa-brands fa-google text-black text-sm" aria-hidden="true" />
            </div>
          </div>

          {/* Trust Text Pill */}
          <div className="h-10 sm:h-11 rounded-full bg-[#28282a] border border-white/40 -ml-4 pl-6 pr-4 sm:pr-5 flex items-center font-sans font-medium text-[#c4c2c3] text-xs sm:text-[13.5px] whitespace-nowrap z-20 shadow-md">
            <span>Trusted by 2000+ Enterprises</span>
          </div>
        </div>

        {/* Headline: Solid White Dot-Matrix Display Font */}
        <h1 className="font-display text-white text-[clamp(32px,6.8vw,80px)] leading-[1.08] tracking-[-0.04em] font-normal mb-2 uppercase select-none">
          <span
            className="block anim-reveal"
            style={{ "--d": "0.12s" } as React.CSSProperties}
          >
            Intelligence
          </span>
          <span
            className="block anim-reveal"
            style={{ "--d": "0.30s" } as React.CSSProperties}
          >
            Designed To Evolve
          </span>
        </h1>

        {/* Subhead */}
        <p
          className="max-w-[540px] mx-auto font-sans text-[#d0d0d0] text-sm sm:text-base leading-relaxed opacity-85 mt-4 sm:mt-5 mb-7 sm:mb-9 anim-reveal"
          style={{ "--d": "0.28s" } as React.CSSProperties}
        >
          Build applications that reason, adapt and collaborate using an on-device neural voice isolation platform designed for mission-critical acoustic extremes.
        </p>

        {/* Glowing CTA Button */}
        <div
          className="anim-reveal"
          style={{ "--d": "0.40s" } as React.CSSProperties}
        >
          <a
            href="#player"
            className="inline-flex items-center justify-center bg-white text-black font-semibold text-sm sm:text-[14.5px] px-8 sm:px-10 py-3 sm:py-3.5 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_0_22px_rgba(255,255,255,0.32),0_0_44px_rgba(255,255,255,0.12)] hover:scale-105 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_0_28px_rgba(255,255,255,0.45),0_0_56px_rgba(255,255,255,0.2)] transition-all duration-200"
          >
            Launch Live Combat Demo
          </a>
        </div>
      </div>

      {/* Bottom Region: Stats Footer */}
      <div
        ref={statsRef}
        aria-label="Platform Statistics"
        className="w-full max-w-[920px] grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-12 sm:pt-14 pb-4"
      >
        {STATS.map((stat, idx) => (
          <div
            key={stat.label}
            className="flex flex-col items-center text-center gap-1 anim-reveal"
            style={{ "--d": `${0.5 + idx * 0.08}s` } as React.CSSProperties}
          >
            <div className="font-display text-white text-2xl sm:text-3xl leading-none">
              {stat.icon}
            </div>
            <div className="flex items-baseline justify-center font-sans font-semibold text-white text-xl sm:text-2xl tracking-tight">
              <span>{counts[idx]}</span>
              <span className="text-[0.8em] font-medium ml-0.5">{stat.suffix}</span>
            </div>
            <div className="font-sans text-[#8e8e8e] text-xs sm:text-[12.5px] font-normal">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

