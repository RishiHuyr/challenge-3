import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  actionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  actionClick
}) => {
  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem var(--spacing-xl)',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '2rem auto'
      }}
    >
      <span
        style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}
        role="img"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        {description}
      </p>

      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}

      {actionLabel && actionClick && (
        <button onClick={actionClick} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
export default EmptyState;
