import React from 'react';

export function Select({
  label,
  id,
  value,
  onChange,
  options = [], // [{ value, label }] or string array
  placeholder = 'Pilih salah satu...',
  error,
  helpText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}
      <select
        id={selectId}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`form-select ${error ? 'is-invalid' : ''}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && <p className="form-error-msg">{error}</p>}
      {helpText && !error && <p className="form-help-text">{helpText}</p>}
    </div>
  );
}
