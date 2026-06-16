import React from 'react';
import './SkeletonLoader.css';

interface SkeletonProps {
  type?: 'card' | 'list' | 'text' | 'chart';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'chart':
        return (
          <div className="skeleton-chart" aria-hidden="true">
            <div className="skeleton-bar" style={{ height: '60%' }}></div>
            <div className="skeleton-bar" style={{ height: '80%' }}></div>
            <div className="skeleton-bar" style={{ height: '40%' }}></div>
            <div className="skeleton-bar" style={{ height: '90%' }}></div>
            <div className="skeleton-bar" style={{ height: '50%' }}></div>
          </div>
        );
      case 'list':
        return (
          <div className="skeleton-list" aria-hidden="true">
            <div className="skeleton-circle"></div>
            <div className="skeleton-lines">
              <div className="skeleton-line short"></div>
              <div className="skeleton-line long"></div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="skeleton-text" aria-hidden="true">
            <div className="skeleton-line long"></div>
            <div className="skeleton-line medium"></div>
            <div className="skeleton-line short"></div>
          </div>
        );
      case 'card':
      default:
        return (
          <div className="skeleton-card" aria-hidden="true">
            <div className="skeleton-image"></div>
            <div className="skeleton-line short"></div>
            <div className="skeleton-line long"></div>
            <div className="skeleton-line medium"></div>
          </div>
        );
    }
  };

  return (
    <div className="skeleton-container" data-testid="skeleton-loader">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>
      ))}
    </div>
  );
};
