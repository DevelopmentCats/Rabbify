export function Card({ children, className, ...props }) {
    return (
      <div className={`bg-[var(--surface)] rounded-lg shadow-lg overflow-hidden ${className}`} {...props}>
        {children}
      </div>
    );
  }
  
  export function CardContent({ children, className, ...props }) {
    return (
      <div className={`p-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
  
  export function CardTitle({ children, className, ...props }) {
    return (
      <h3 className={`text-lg font-semibold mb-2 ${className}`} {...props}>
        {children}
      </h3>
    );
  }