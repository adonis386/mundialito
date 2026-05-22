"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

type Accent = "green" | "wine" | "maroon";

const accentStyles: Record<Accent, string> = {
  green: "from-[#096c4b] to-[#0b8d62]",
  wine: "from-[#3c0007] to-[#630012]",
  maroon: "from-[#630012] to-[#3c0007]",
};

const panelTransition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

type Props = {
  title: string;
  subtitle?: string;
  accent?: Accent;
  defaultOpen?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  subtitle,
  accent = "wine",
  defaultOpen = false,
  headerRight,
  children,
}: Props) {
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between gap-3 bg-gradient-to-br ${accentStyles[accent]} px-4 py-3 text-left transition-opacity hover:opacity-95`}
      >
        <div className="min-w-0">
          <div className="text-sm font-black italic tracking-tighter text-white">{title}</div>
          {subtitle ? (
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">{subtitle}</div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight ? (
            <span
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {headerRight}
            </span>
          ) : null}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
            className="inline-flex"
            aria-hidden
          >
            <ChevronDown className="h-5 w-5 text-white/90" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : panelTransition}
            className="overflow-hidden border-t border-slate-200/60"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
