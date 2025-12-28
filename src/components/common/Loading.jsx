/**
 * Loading Component - Loading spinner
 */
export default function Loading({
  size = 'medium',
  text = 'Loading...',
  fullScreen = false,
  className = ''
}) {
  const baseClasses = 'loading';
  const sizeClasses = `loading--${size}`;
  const fullScreenClasses = fullScreen ? 'loading--fullscreen' : '';

  const classes = [
    baseClasses,
    sizeClasses,
    fullScreenClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="loading__spinner"></div>
      {text && <p className="loading__text">{text}</p>}
    </div>
  );
}
