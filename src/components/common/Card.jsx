/**
 * Card Component - Reusable card container
 */
export default function Card({
  children,
  title,
  subtitle,
  onClick,
  className = '',
  hoverable = false,
  ...props
}) {
  const baseClasses = 'card';
  const hoverClasses = hoverable ? 'card--hoverable' : '';
  const clickableClasses = onClick ? 'card--clickable' : '';

  const classes = [
    baseClasses,
    hoverClasses,
    clickableClasses,
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (onClick) onClick();
  };

  const handleKeyPress = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={classes}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {(title || subtitle) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card__content">
        {children}
      </div>
    </div>
  );
}
