export function Button({ children, className, ...props }) {
    return (
      <button
        className={`px-4 py-2 rounded-md bg-orange-400 text-black hover:bg-orange-500 transition-colors duration-200 ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }