export const handleConnectionError = (event) => {
    if (event.message.includes('Could not establish connection') || 
        event.message.includes('Receiving end does not exist')) {
      event.preventDefault();
      console.warn('Connection error occurred, but it was caught and handled.');
    }
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('error', handleConnectionError);
  }