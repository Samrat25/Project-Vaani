"use client";

import React, { useState, useEffect } from "react";

interface NavItem {
  name: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "#hero" },
  { name: "Live Demo", href: "#player" },
  { name: "Architecture", href: "#about" },
  { name: "Targets", href: "#targets" },
  { name: "Specs", href: "#specs" },
  { name: "Security", href: "#security" },
];

export default function Navbar(): React.JSX.Element {
  const [activeSection, setActiveSection] = useState<string>("Home");
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Sync active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        if (item.href === "#hero") continue;
        const el = document.querySelector(item.href);
        if (el) {
          const top = (el as HTMLElement).offsetTop;
          if (scrollPos >= top) {
            setActiveSection(item.name);
            return;
          }
        }
      }
      setActiveSection("Home");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full pt-4 sm:pt-6 px-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-[850px] flex items-center justify-between sm:justify-center gap-3 sm:gap-6 pointer-events-auto">
          {/* Logo Button */}
          <a
            href="#hero"
            aria-label="Home"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.22)] flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
          >
            <img
              src="/assets/logo.webp"
              alt="Logo"
              className="w-7 h-7 object-contain"
            />
          </a>

          {/* Desktop Nav Pill */}
          <nav
            className="bg-white h-11 sm:h-12 flex-1 max-w-[500px] px-2 sm:px-4 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.22)] hidden sm:flex items-center justify-evenly"
            aria-label="Main Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.name;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setActiveSection(item.name)}
                  className={`relative px-3 py-2 text-[13px] md:text-[14px] font-medium tracking-tight text-[#2e2e2e] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-55 hover:opacity-85"
                  }`}
                >
                  {item.name}
                  {/* Three-dot active indicator */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-black shadow-[-5px_0_0_#000,5px_0_0_#000]"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop Sign In Button */}
          <a
            href="#player"
            className="bg-[#28282a] hover:bg-[#323234] text-[#c8c8c8] hover:text-white h-11 sm:h-12 px-5 sm:px-6 rounded-full font-medium text-xs sm:text-sm tracking-tight hidden sm:inline-flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.22)] transition-all flex-shrink-0"
          >
            Launch Demo
          </a>

          {/* Mobile Burger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="w-11 h-11 rounded-full bg-[#28282a] border border-white/20 flex sm:hidden flex-col items-center justify-center gap-1.5 z-50 transition-colors"
          >
            <span
              className={`w-5 h-[1.5px] bg-white rounded transition-transform duration-250 ${
                mobileOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`w-5 h-[1.5px] bg-white rounded transition-opacity duration-250 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`w-5 h-[1.5px] bg-white rounded transition-transform duration-250 ${
                mobileOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay & Drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 sm:hidden animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-20 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[380px] bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-2 z-50"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  setActiveSection(item.name);
                  setMobileOpen(false);
                }}
                className={`py-2.5 text-center text-sm font-medium text-[#2e2e2e] transition-opacity ${
                  activeSection === item.name ? "opacity-100 font-bold" : "opacity-65"
                }`}
              >
                {item.name}
              </a>
            ))}
            <a
              href="#player"
              onClick={() => setMobileOpen(false)}
              className="mt-3 w-full h-11 rounded-full bg-[#28282a] text-[#c8c8c8] hover:text-white font-medium text-xs flex items-center justify-center transition-colors"
            >
              Launch Live Demo
            </a>
          </div>
        </div>
      )}
    </>
  );
}
