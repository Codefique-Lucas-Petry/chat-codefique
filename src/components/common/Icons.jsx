export function FileTypeIcon({ className = 'w-5 h-5' }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M8 3.75h6.586a2 2 0 0 1 1.414.586l3.664 3.664a2 2 0 0 1 .586 1.414V18.25A2.75 2.75 0 0 1 17.5 21h-9A2.75 2.75 0 0 1 5.75 18.25V6.5A2.75 2.75 0 0 1 8.5 3.75Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14.75 3.75v4.5h4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8.75 14.25h6.5M8.75 17.25h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  
  export function MenuIcon({ className = 'w-5 h-5' }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M4.75 7.25h14.5M4.75 12h14.5M4.75 16.75h14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }