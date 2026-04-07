import { type ReactElement } from 'react'
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './styles/theme.css'
import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Groups from './components/Groups'
import GroupPage from './components/GroupPage'
import Messages from './components/Messages'
import Events from './components/Events'
import Notifications from './components/Notifications'
import Login from './components/Login'
import Signup from './components/Signup'
import RightSidebar from './components/RightSidebar'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/feed" replace />
  }

  return children
}

function ProfileByRoute() {
  const { userId } = useParams<{ userId: string }>()
  const parsedUserId = userId ? Number(userId) : NaN

  if (!userId || Number.isNaN(parsedUserId) || parsedUserId <= 0) {
    return <Navigate to="/profile" replace />
  }

  return <Profile userId={parsedUserId} />
}

function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (!user) {
    return null
  }

  const currentUser = {
    id: String(user.id),
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar || '',
  }

  return (
    <NotificationProvider>
      <div className="app-root">
        <Header
          currentUser={currentUser}
          onUserSelect={(id) => navigate(`/profile/${id}`)}
        />
        <div className="app-body">
          <Sidebar onLogout={handleLogout} />
          <main className="app-main">
            <div className="content-container">
              <Outlet />
            </div>
            <RightSidebar
              onUserClick={(id) => navigate(`/profile/${id}`)}
              onGroupClick={(id) => navigate(`/groups/${id}`)}
            />
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}

function AppRoutes() {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route
        path="/login"
        element={(
          <PublicRoute>
            <Login onShowSignup={() => navigate('/signup')} />
          </PublicRoute>
        )}
      />
      <Route
        path="/signup"
        element={(
          <PublicRoute>
            <Signup onShowLogin={() => navigate('/login')} />
          </PublicRoute>
        )}
      />

      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<Navigate to="/feed" replace />} />
        <Route path="feed" element={<Feed onUserClick={(id) => navigate(`/profile/${id}`)} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<ProfileByRoute />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:groupId" element={<GroupPage />} />
        <Route path="group-page" element={<GroupPage />} />
        <Route path="events" element={<Events />} />
      </Route>

      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
