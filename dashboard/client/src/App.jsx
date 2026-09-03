import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardHome from './pages/DashboardHome'
import Dashboard from './pages/Dashboard'
import Packages from './pages/Packages'
import GeneratedCode from './pages/GeneratedCode'
import Documentation from './pages/Documentation'
import './App.css'

function AuthGate() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState('login')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return authView === 'login'
      ? <Login onSwitchToRegister={() => setAuthView('register')} />
      : <Register onSwitchToLogin={() => setAuthView('login')} />
  }

  return <AppLayout />
}

function AppLayout() {
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':  return <DashboardHome onNavigate={setActivePage} />
      case 'crashes':    return <Dashboard />
      case 'packages':   return <Packages />
      case 'code':       return <GeneratedCode />
      case 'docs':       return <Documentation />
      default:           return <DashboardHome onNavigate={setActivePage} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      {renderPage()}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}