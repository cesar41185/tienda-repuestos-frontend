// Skeleton loader component for loading states
import './SkeletonLoader.css';

export function SkeletonRow({ columns = 8 }) {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <div className="skeleton-box"></div>
        </td>
      ))}
    </tr>
  );
}

export function SkeletonImage({ width = '100%', height = '100px' }) {
  return (
    <div className="skeleton-image" style={{ width, height }}></div>
  );
}
