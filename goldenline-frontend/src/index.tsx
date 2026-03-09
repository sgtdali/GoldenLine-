import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/print.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

if (typeof window !== 'undefined') {
  if (window.location.pathname.endsWith('/index.html')) {
    window.history.replaceState({}, '', '/');
  }

  const suppressResizeObserverErrors = (event: ErrorEvent) => {
    if (
      event?.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      event?.message === 'ResizeObserver loop limit exceeded'
    ) {
      event.stopImmediatePropagation();
    }
  };
  window.addEventListener('error', suppressResizeObserverErrors);
}

const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);
root.render(
  // <React.StrictMode> SARGISINI BURADAN KALDIRDIK
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
  // </React.StrictMode> SARGISINI BURADAN KALDIRDIK
);
