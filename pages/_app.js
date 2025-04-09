import '../public/tailwind.css';
import '../styles/global.css';
import { useEffect } from 'react';
import '../lib/errorHandling';

const handleError = (event) => {
  if (event.message.includes('Could not establish connection') || 
      event.message.includes('Receiving end does not exist')) {
    console.warn('Caught connection error:', event.message);
    console.warn('Error source:', event.filename);
    console.warn('Error line:', event.lineno);
    console.warn('Error column:', event.colno);
    console.warn('Error stack:', event.error?.stack);
    event.preventDefault();
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', handleError);
}

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleError);
      }
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;