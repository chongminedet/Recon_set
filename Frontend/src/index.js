import React from 'react';
import ReactDOM from 'react-dom/client';
import ReconApp from './frontend';
import './frontend.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ReconApp />
  </React.StrictMode>
);
