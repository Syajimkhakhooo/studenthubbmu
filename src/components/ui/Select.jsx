import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [], // [{ value, label, disabled }] or string array
  placeholder = 'Pilih salah satu...',
  error,
  helpText,
  required = false,
  disabled = false,
  className = '',
  searchable,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUp, setOpenUp] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Normalize options to [{ value, label, disabled }]
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value,
          label: opt.label ?? String(opt.value),
          disabled: Boolean(opt.disabled),
        };
      }
      return {
        value: opt,
        label: String(opt),
        disabled: false,
      };
    });
  }, [options]);

  // Determine if search input should be visible
  const isSearchable = searchable ?? normalizedOptions.length > 8;

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const q = searchTerm.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchTerm]);

  // Current selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === '') return null;
    return normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [normalizedOptions, value]);

  // Detect position & flip upwards if near bottom
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 220 && spaceAbove > spaceBelow) {
        setOpenUp(true);
      } else {
        setOpenUp(false);
      }

      // Auto-focus search input if searchable
      if (isSearchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, isSearchable]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle select action
  const handleSelect = (val) => {
    if (disabled) return;
    setIsOpen(false);
    setSearchTerm('');

    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name || selectId,
          id: selectId,
          value: val,
        },
      };
      onChange(syntheticEvent);
    }
    triggerRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const item = filteredOptions[highlightedIndex];
          if (!item.disabled) {
            handleSelect(item.value);
          }
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`form-group ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          <span>
            {label}
            {required && <span className="form-label-required">*</span>}
          </span>
        </label>
      )}

      {/* Hidden native select for HTML5 validation / form semantics */}
      <select
        tabIndex={-1}
        aria-hidden="true"
        id={selectId}
        name={name || selectId}
        value={value ?? ''}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
          margin: 0,
          padding: 0,
          border: 0,
        }}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {normalizedOptions.map((opt) => (
          <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom styled select box */}
      <div className="custom-select-container">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`custom-select-trigger ${error ? 'is-invalid' : ''} ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
        >
          <span className={`custom-select-value ${!selectedOption && !value ? 'is-placeholder' : ''}`}>
            {selectedOption ? selectedOption.label : (value || placeholder)}
          </span>
          <ChevronDown
            size={16}
            className={`custom-select-chevron ${isOpen ? 'is-open' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={`custom-select-menu ${openUp ? 'open-up' : ''}`}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            {isSearchable && (
              <div className="custom-select-search" onClick={(e) => e.stopPropagation()}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      color: 'var(--text-tertiary)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    placeholder="Cari pilihan..."
                    className="custom-select-search-input"
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>
            )}

            <div className="custom-select-list" ref={listRef}>
              {filteredOptions.length === 0 ? (
                <div className="custom-select-empty">
                  {searchTerm ? 'Pilihan tidak ditemukan' : 'Tidak ada opsi'}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = selectedOption
                    ? String(selectedOption.value) === String(opt.value)
                    : String(value) === String(opt.value);
                  const isHighlighted = highlightedIndex === idx;

                  return (
                    <div
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`custom-select-option ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''} ${opt.disabled ? 'is-disabled' : ''}`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check
                          size={15}
                          style={{
                            color: 'var(--text-primary)',
                            flexShrink: 0,
                            strokeWidth: 2.5,
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="form-error-msg">{error}</p>}
      {helpText && !error && <p className="form-help-text">{helpText}</p>}
    </div>
  );
}
