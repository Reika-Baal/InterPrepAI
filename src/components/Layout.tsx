import { NavLink, Outlet, Link } from "react-router-dom";
import {
  House,
  CalendarDays,
  ClipboardCheck,
  MessagesSquare,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "./UI";
const links = [
  { path: "/dashboard", label: "Dashboard", icon: House },
  { path: "/interviews", label: "My Interviews", icon: CalendarDays },
  { path: "/practice", label: "Practice", icon: ClipboardCheck },
  { path: "/feedback", label: "Feedback", icon: MessagesSquare },
  { path: "/progress", label: "Progress", icon: ChartNoAxesCombined },
  { path: "/settings", label: "Settings", icon: Settings },
];
export default function Layout({
  name,
  isGuest,
  storageError,
  retry,
  logout,
}: {
  name: string;
  isGuest: boolean;
  storageError: string;
  retry: () => void;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="workspace">
      <header className="mobile-bar">
        <Logo />
        <button
          className="icon-btn"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Logo />
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Workspace">
          {links.map((l) => (
            <NavLink key={l.path} to={l.path} onClick={() => setOpen(false)}>
              <l.icon size={19} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-promo">
          <Sparkles size={22} />
          <strong>A little every day.</strong>
          <p>Small steps lead to big opportunities.</p>
          <Link to="/practice" onClick={() => setOpen(false)}>
            Keep practising <ArrowUpRight size={15} />
          </Link>
        </div>
        <Link to="/settings" className="profile" onClick={() => setOpen(false)}>
          <span className="avatar">
            {name.slice(0, 1).toUpperCase() || "P"}
          </span>
          <div>
            <strong>{name || "Your profile"}</strong>
            <small>{isGuest ? "Guest workspace" : "Connected workspace"}</small>
          </div>
          <Settings size={16} />
        </Link>
        <button className="text-link" onClick={logout}>
          {isGuest ? "End guest session" : "Sign out"}
        </button>
      </aside>
      <main className="workspace-main">
        <div className="workspace-top">
          <span>
            <span className="online-dot" /> Your next chapter starts here
          </span>
          <Link to="/settings" className="avatar" aria-label="Profile settings">
            {name.slice(0, 1).toUpperCase() || "P"}
          </Link>
        </div>
        {storageError && (
          <p className="notice" role="alert">
            {storageError}{" "}
            <button className="btn secondary" onClick={retry}>
              Retry save
            </button>
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
