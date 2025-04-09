export function Button({ children, className, ...props }) {
    return (
      <button
        className={`px-4 py-2 rounded-full font-medium text-sm bg-[var(--accent)] text-[var(--background)] hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-50 transition-all duration-200 ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }