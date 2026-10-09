import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { API_BASE_URL, normalizeApiUrl } from './config/api'

// When VITE_API_URL is configured, transparently prefix relative /api calls without duplicates
if (API_BASE_URL && typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = normalizeApiUrl(API_BASE_URL, input);
    } else if (input instanceof URL && input.pathname.startsWith('/api')) {
      const fullPath = `${input.pathname}${input.search}`;
      input = normalizeApiUrl(API_BASE_URL, fullPath);
    }
    return originalFetch.call(this, input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
