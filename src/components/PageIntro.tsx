interface PageIntroProps {
  description: string;
  eyebrow: string;
  id: string;
  stat: string;
  title: string;
}

export function PageIntro({ description, eyebrow, id, stat, title }: PageIntroProps) {
  return (
    <header className="page-heading">
      <div className="page-heading-copy">
        <span className="page-eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
      <strong className="page-heading-stat">{stat}</strong>
    </header>
  );
}
