import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Student" },
  { to: "/1bill", label: "1BILL Pay" },
  { to: "/admin", label: "Admin" },
  { to: "/settlement", label: "Settlement" },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const fullBleed = location.pathname === "/1bill";
  return (
    <div className="min-h-screen">
      <div className="bg-gold-500 text-school-900 px-4 py-2 text-center text-sm font-medium">
        Mock integration — no real bank APIs. Payments are simulated through 1LINK 1BILL and
        settled to Allied Bank Limited (ABL).
      </div>
      <header className="bg-school-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-display text-xl tracking-tight">Greenfield Academy</p>
            <p className="text-xs text-school-100/80">School Fee Management · 1LINK 1BILL</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm ${
                    isActive ? "bg-white text-school-900" : "text-school-100 hover:bg-white/10"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={fullBleed ? "" : "mx-auto max-w-6xl px-4 py-8"}>{children}</main>
    </div>
  );
}
