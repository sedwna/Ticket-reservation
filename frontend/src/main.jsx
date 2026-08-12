import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import ThemeProvider from './context/ThemeProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        containerClassName="font-sans"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-surface-card)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-line)',
            fontSize: '14px',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: 'var(--shadow-elevated)',
            direction: 'rtl',
            fontFamily: 'Vazirmatn, Inter, system-ui, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'var(--color-surface-card)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'var(--color-surface-card)',
            },
          },
        }}
      />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
