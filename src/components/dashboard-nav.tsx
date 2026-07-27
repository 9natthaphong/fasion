import Link from "next/link";

export function DashboardNav({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <aside className="dashboard-nav">
      <Link href="/" className="wordmark">
        FITTODAY
      </Link>
      <div>
        <p className="dashboard-nav-title">{title}</p>
        <nav aria-label={title}>
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <form action="/api/auth/logout" method="post">
        <button className="button button-ghost" type="submit">
          ออกจากระบบ
        </button>
      </form>
    </aside>
  );
}

