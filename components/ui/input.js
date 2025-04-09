export function Input({ className, ...props }) {
    return (
      <input
        className={`px-4 py-2 rounded-full bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 ${className}`}
        {...props}
      />
    );
  }