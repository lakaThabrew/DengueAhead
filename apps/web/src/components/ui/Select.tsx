import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, id, style, ...rest }) => {
  const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...rest}
        style={{
          fontSize: '14px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-card)',
          color: 'var(--color-text-main)',
          outline: 'none',
          cursor: 'pointer',
          ...style
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
