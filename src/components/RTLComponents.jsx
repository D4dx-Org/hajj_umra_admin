import React from 'react';

/**
 * RTL Text Component - Displays text with right-to-left direction
 * @param {Object} props - Component props
 * @param {string} props.children - Text content
 * @param {string} props.className - CSS classes
 * @param {string} props.title - Tooltip text
 * @param {Object} props.style - Inline styles
 * @param {...Object} props.rest - Other HTML attributes
 */
export const RTLText = ({ children, className = "", title, style = {}, ...rest }) => {
  const rtlStyle = {
    textAlign: 'right',
    direction: 'rtl',
    ...style
  };

  return (
    <span 
      className={className}
      title={title}
      style={rtlStyle}
      {...rest}
    >
      {children}
    </span>
  );
};

/**
 * RTL Input Component - Input field with right-to-left direction
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, etc.)
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - CSS classes
 * @param {Object} props.style - Inline styles
 * @param {...Object} props.rest - Other HTML input attributes
 */
export const RTLInput = ({ 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  style = {}, 
  ...rest 
}) => {
  const rtlStyle = {
    textAlign: 'right',
    direction: 'rtl',
    ...style
  };

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      style={rtlStyle}
      {...rest}
    />
  );
};

/**
 * RTL Textarea Component - Textarea with right-to-left direction
 * @param {Object} props - Component props
 * @param {string} props.value - Textarea value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - CSS classes
 * @param {number} props.rows - Number of rows
 * @param {Object} props.style - Inline styles
 * @param {...Object} props.rest - Other HTML textarea attributes
 */
export const RTLTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  rows = 3,
  style = {}, 
  ...rest 
}) => {
  const rtlStyle = {
    textAlign: 'right',
    direction: 'rtl',
    ...style
  };

  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={rows}
      style={rtlStyle}
      {...rest}
    />
  );
};

export default {
  RTLText,
  RTLInput,
  RTLTextarea
};
