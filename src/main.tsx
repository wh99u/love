import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/glass.css';
import './ui/ui.css';
import './ui/forms.css';
import { App } from './App';

// Chromium can refract the backdrop through an SVG filter; WebKit (iPhone) cannot.
const ua = navigator.userAgent;
if (/Chrome\//.test(ua) && !/iPhone|iPad|iPod/.test(ua)) document.documentElement.classList.add('has-lens');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
