import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/layout";
import { NAV_LINKS } from "../data/content";
import darkLogo from "../../imports/logo/FA_Nalar Logo_dark.svg";

/** Distance scrolled (px) before the navbar picks up its frosted-glass background. */
const SCROLL_THRESHOLD = 24;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggle = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);

  // Lenis moves the real document scroll position each frame, so a plain
  // window scroll listener picks up the eased values automatically — no
  // extra bridging needed (same reasoning as smooth-scroll.tsx).
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className="pointer-events-none fixed left-0 top-0 z-50 flex w-full items-center justify-between px-6 py-8 text-black md:px-12">
        {/* Frosted background layer — fades/blurs in once scrolled past the
            threshold. White at the very top, gradually fading to transparent
            toward the bottom of the bar, so it blends into the page instead
            of cutting off with a hard edge. Sits behind the logo/links/
            hamburger (all of which stay pointer-events-auto) via -z-10, and
            is itself pointer-events-none so it never blocks clicks/taps. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-white/60 to-transparent transition-opacity duration-300 ease-out",
            isScrolled ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="pointer-events-auto flex-1">
          <a href="#home" className="relative z-[60] flex w-fit items-center gap-2" onClick={close}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-2 md:h-12 md:w-12"
              aria-hidden="true"
            >
              {/* Missing asset reminder: src/imports/logo/FA_Nalar Logo_dark.svg
                  was removed from this upload for file-size reasons — this
                  <img> reference is unchanged from the original file. */}
              <img src={darkLogo} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="font-display text-3xl font-light tracking-[-1.2px] md:text-[40px]">
              Nalar
            </span>
          </a>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          className="pointer-events-auto z-[60] flex h-[19px] w-[37px] flex-col justify-between"
        >
          <span
            className="block h-[2px] w-full bg-black transition-all duration-300"
            style={{ transform: isOpen ? "translateY(8.5px) rotate(45deg)" : "none" }}
          />
          <span
            className="block h-[2px] w-full bg-black transition-all duration-300"
            style={{ opacity: isOpen ? 0 : 1 }}
          />
          <span
            className="block h-[2px] w-full bg-black transition-all duration-300"
            style={{ transform: isOpen ? "translateY(-8.5px) rotate(-45deg)" : "none" }}
          />
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-white px-6 md:px-12"
          >
            <div className="flex flex-col space-y-4 font-display text-[32px] font-light leading-tight tracking-[-0.96px] md:text-[56px] md:tracking-[-1.68px]">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    "transition-colors",
                    link.accent ? "text-brand hover:text-brand-hover" : "hover:text-gray-600",
                  )}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}