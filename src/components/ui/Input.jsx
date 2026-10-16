import React from 'react';

export function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helpText,
  required = false,
  disabled = false,
  leadIcon: LeadIcon,
  trailIcon: TrailIcon,
  onTrailIconClick,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}
      <div className="input-wrapper">
        {LeadIcon && (
          <span className="input-icon-lead">
            <LeadIcon size={16} />
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-input ${LeadIcon ? 'has-lead-icon' : ''} ${
            TrailIcon ? 'has-trail-icon' : ''
          } ${error ? 'is-invalid' : ''}`}
          {...props}
        />
        {TrailIcon && (
          <span
            className="input-icon-trail"
            onClick={onTrailIconClick}
            role={onTrailIconClick ? 'button' : undefined}
          >
            <TrailIcon size={16} />
          </span>
        )}
      </div>
      {error && <p className="form-error-msg">{error}</p>}
      {helpText && !error && <p className="form-help-text">{helpText}</p>}
    </div>
  );
}

export function Textarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  error,
  helpText,
  required = false,
  disabled = false,
  rows = 3,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}
      <textarea
        id={inputId}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`form-textarea ${error ? 'is-invalid' : ''}`}
        {...props}
      />
      {error && <p className="form-error-msg">{error}</p>}
      {helpText && !error && <p className="form-help-text">{helpText}</p>}
    </div>
  );
}
