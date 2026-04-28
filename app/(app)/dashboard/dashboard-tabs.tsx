"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/receipts", label: "Receipts" },
  { href: "/dashboard/rewards", label: "Rewards" },
  { href: "/dashboard/redemptions", label: "Redemptions" },
];

export default function DashboardTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex gap-1 border-b border-[var(--pp-cream-dark)] -mx-1 px-1 overflow-x-auto scrollbar-none">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 px-3 py-2.5 font-mono text-[11px] tracking-[0.22em] uppercase border-b-2 -mb-px transition-colors ${
              active
                ? "text-[var(--pp-burgundy)] border-[var(--pp-burgundy)]"
                : "text-[var(--pp-ink-soft)] border-transparent hover:text-[var(--pp-ink)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
