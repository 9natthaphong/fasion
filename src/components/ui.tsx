import Link from "next/link";
import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="text-link">
          {action.label} <span aria-hidden>↗</span>
        </Link>
      ) : null}
    </div>
  );
}

export function DemoBadge() {
  return <span className="demo-badge">Demo</span>;
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}

export function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-mark" aria-hidden>
        ◌
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
      {href && action ? (
        <Link className="button button-solid" href={href}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

