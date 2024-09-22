export function Input({ className, ...props }) {
    return (
      <input
        className={`px-4 py-2 rounded-md bg-gray-800 text-orange-400 border border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400 ${className}`}
        {...props}
      />
    );
  }