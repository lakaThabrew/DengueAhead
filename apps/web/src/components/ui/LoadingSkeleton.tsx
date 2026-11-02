import React from 'react';

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '6px',
  count = 1
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            width,
            height,
            borderRadius,
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-shimmer 1.5s infinite',
            marginBottom: i < count - 1 ? '8px' : undefined
          }}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => (
  <div
    aria-busy="true"
    aria-label="Loading…"
    style={{
      backgroundColor: 'var(--color-surface-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}
  >
    <LoadingSkeleton height="16px" width="60%" />
    <LoadingSkeleton height="40px" width="40%" />
    <LoadingSkeleton height="14px" width="80%" />
  </div>
);
