import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// iOS Safari ignora user-scalable=no: bloqueamos el pinch-zoom por gesto y el
// doble-tap-zoom para que se sienta app nativa (el scroll/pan sigue libre).
['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) =>
  document.addEventListener(evt, (e) => e.preventDefault())
);
let lastTouch = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouch <= 300) e.preventDefault();
  lastTouch = now;
}, { passive: false });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
