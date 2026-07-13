interface PlaceholderPageProps {
  title: string;
  description: string;
  maxWidth?: 'form' | 'list' | 'full';
}

export function PlaceholderPage({
  title,
  description,
  maxWidth = 'list',
}: PlaceholderPageProps) {
  const widthClass =
    maxWidth === 'form'
      ? 'page-container--form'
      : maxWidth === 'full'
        ? 'page-container--full'
        : 'page-container--list';

  return (
    <div className={`page-container ${widthClass}`}>
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{description}</p>
    </div>
  );
}
