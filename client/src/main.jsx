// File: client/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { HelmetProvider } from 'react-helmet-async'; // <-- BƯỚC 1: IMPORT
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider> {/* <-- BAO BỌC APP */}
        <App />
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);