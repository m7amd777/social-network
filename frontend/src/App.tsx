import { useState } from 'react'
import './styles/theme.css'
import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Groups from './components/Groups'
import Messages from './components/Messages'
import Events from './components/Events'
import Notifications from './components/Notifications'
import Login from './components/Login'
import Signup from './components/Signup'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppContent() {
  const { user, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [showSignup, setShowSignup] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<number | null>(null)

  const handleLogout = async () => {
    await logout()
  }

  const handleShowLogin = () => {
    setShowSignup(false)
  }

  const handleShowSignup = () => {
    setShowSignup(true)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Feed />
      case 'profile':
        return <Profile onLogout={handleLogout} userId={viewingUserId ?? undefined} />
      case 'groups':
        return <Groups />
      case 'messages':
        return <Messages />
      case 'events':
        return <Events />
      case 'notifications':
        return <Notifications />
      default:
        return <Feed />
    }
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Not authenticated - show login or signup
  if (!user) {
    return showSignup ? (
      <Signup onShowLogin={handleShowLogin} />
    ) : (
      <Login onShowSignup={handleShowSignup} />
    )
  }

  // Build currentUser object for Header from auth user
  const currentUser = {
    id: String(user.id),
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar || 'https://picsum.photos/seed/user1/200/200.jpg',
  }

  // Authenticated - show main app
  return (
    <div className="app-root">
      <Header
        currentUser={currentUser}
        onUserSelect={(id) => { setViewingUserId(id); setActiveTab('profile'); }}
      />
      <div className="app-body">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => { setViewingUserId(null); setActiveTab(tab); }}
          onLogout={handleLogout}
        />
        <main className="app-main">
          <div className="content-container">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
