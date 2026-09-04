type ProductNavProps = { active: "demo" | "candidate" | "architecture" };

export function ProductNav({ active }: ProductNavProps) {
  const items = [
    { id: "demo" as const, label: "Live Harness", href: "/" },
    { id: "candidate" as const, label: "Candidate Story", href: "/candidate" },
    { id: "architecture" as const, label: "Architecture", href: "/architecture" },
  ];
  return (
    <nav className="product-nav" aria-label="HarnessLab sections">
      {items.map((item) => (
        <a
          key={item.id}
          className={`product-nav-link ${active === item.id ? "active" : ""}`}
          href={item.href}
          aria-current={active === item.id ? "page" : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
