// Placeholder component for products without images
import './ImagePlaceholder.css';

export function ImagePlaceholder({ size = '80px', text = 'Sin foto' }) {
  return (
    <div className="image-placeholder" style={{ width: size, height: size }}>
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span className="placeholder-text">{text}</span>
    </div>
  );
}
