import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './src/store';
import App from './src/App';
import './src/styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(
    <AppProvider>
        <App />
    </AppProvider>
);
