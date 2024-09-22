export function Slider({ className, ...props }) {
    return (
      <input
        type="range"
        className={`w-full appearance-none bg-gray-700 h-2 rounded-full outline-none ${className}`}
        style={{
          '--thumb-color': '#FF9F1C',
          '--thumb-size': '16px',
        }}
        {...props}
      />
    );
  }