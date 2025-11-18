import React from 'react';

function ActionIcon({ type }) {
  if (type === 'LOGIN') {
    return (
      <svg className="uc-action-svg login" width="18" height="18" viewBox="0 0 24 24" role="img" aria-label="Login" focusable="false">
        <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
        <path d="M13 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
      </svg>
    );
  }
  if (type === 'LOGOUT') {
    return (
      <svg className="uc-action-svg logout" width="18" height="18" viewBox="0 0 24 24" role="img" aria-label="Logout" focusable="false">
        <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
        <path d="M11 6l-6 6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
      </svg>
    );
  }
  return (
    <span style={{color:'#64748b',fontSize:'0.75rem'}} aria-label="Acción desconocida" role="img">?</span>
  );
}

export default ActionIcon;
