// index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; 
import "assets/plugins/nucleo/css/nucleo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "assets/scss/argon-dashboard-react.scss";
import './styles/tailwind.css';
import './typography.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
