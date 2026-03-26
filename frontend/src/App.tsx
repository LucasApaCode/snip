import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Login from './pages/Login'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function ThemedToaster() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: isDark ? '#1a1a2e' : '#191c1d',
          color: isDark ? '#e6e0ff' : '#f8f9fa',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          border: isDark ? '1px solid rgba(58,53,80,0.5)' : 'none',
        },
        success: {
          iconTheme: { primary: '#6c47ff', secondary: isDark ? '#e6e0ff' : '#f8f9fa' },
        },
      }}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/analytics/:slug" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
