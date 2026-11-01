import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    border: '1px solid var(--color-primary)'
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)'
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)'
  }
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: '13px', padding: '6px 12px' },
  md: { fontSize: '14px', padding: '8px 16px' },
  lg: { fontSize: '16px', padding: '12px 24px' }
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  style,
  ...rest
}) => {
  return (
    <button
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        outline: 'none',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
        rest.onMouseOver?.(e);
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
        rest.onMouseOut?.(e);
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.outline = '2px solid var(--color-primary)';
        (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLButtonElement).style.outline = 'none';
        rest.onBlur?.(e);
      }}
    >
      {children}
    </button>
  );
};
