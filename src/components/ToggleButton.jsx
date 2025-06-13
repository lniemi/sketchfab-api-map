import React from 'react';

const ToggleButton = ({ sidebarCollapsed, onToggle }) => {
  return (
    <button 
      className={`toggle-button ${sidebarCollapsed ? 'collapsed' : ''}`}
      onClick={onToggle}
      aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
};

export default ToggleButton;
