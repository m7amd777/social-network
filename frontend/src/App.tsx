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

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  const currentUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://picsum.photos/seed/user1/200/200.jpg',
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setShowLogin(true)
  }

  const handleShowLogin = () => {
    setShowSignup(false)
    setShowLogin(true)
  }

  const handleShowSignup = () => {
    setShowLogin(false)
    setShowSignup(true)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Feed />
      case 'profile':
        return <Profile onLogout={handleLogout} />
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

  return (
    <>
      {showLogin ? (
        <Login onShowSignup={handleShowSignup} />
      ) : showSignup ? (
        <Signup onShowLogin={handleShowLogin} />
      ) : (
        <div className="app-root">
          <Header currentUser={currentUser} />
          <div className="app-body">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
            />

            <main className="app-main">
              <div className="content-container">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  )
}

export default App