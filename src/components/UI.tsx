import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="InterPrepAI home">
      <img src="/assets/logo-mark.svg" alt="" />
      InterPrep<span>AI</span>
    </Link>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}
export function PageTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
export function Ring({
  value,
  label = "Preparation",
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="ring" role="img" aria-label={`${label}: ${value}%`}>
      <svg viewBox="0 0 120 120">
        <defs>
          <linearGradient id="ring-gradient" x2="1" y2="1">
            <stop stopColor="#6960ff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="49" stroke="var(--ring-track)" />
        <circle
          cx="60"
          cy="60"
          r="49"
          stroke="url(#ring-gradient)"
          strokeDasharray={`${(value / 100) * 308} 308`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <strong>{value}%</strong>
    </div>
  );
}
export function ArrowLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
export function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
