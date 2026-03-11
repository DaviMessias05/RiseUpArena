import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'
import SessionBar from './components/SessionBar'
import HomePage from './pages/HomePage'
import { useAuth } from './contexts/AuthContext'
import { useNotifications } from './contexts/NotificationsContext'

// Lazy-loaded pages for bundle splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const CallbackPage = lazy(() => import('./pages/auth/CallbackPage'))
const CompleteProfilePage = lazy(() => import('./pages/auth/CompleteProfilePage'))
const GamesPage = lazy(() => import('./pages/GamesPage'))
const GameDetailPage = lazy(() => import('./pages/GameDetailPage'))
const TournamentsPage = lazy(() => import('./pages/TournamentsPage'))
const TournamentDetailPage = lazy(() => import('./pages/TournamentDetailPage'))
const LobbiesPage = lazy(() => import('./pages/LobbiesPage'))
const LobbyDetailPage = lazy(() => import('./pages/LobbyDetailPage'))
const RankingsPage = lazy(() => import('./pages/RankingsPage'))
const StorePage = lazy(() => import('./pages/StorePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const VipPage = lazy(() => import('./pages/VipPage'))
const MatchRoomPage = lazy(() => import('./pages/MatchRoomPage'))

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

export default function App() {
  const { user } = useAuth()
  const { activeSession } = useNotifications()
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      {user && <SessionBar />}
      <main className={`pt-14 ${user ? 'md:pr-64' : ''} ${user && activeSession ? 'ml-14' : ''}`}>
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<CallbackPage />} />
            <Route path="/auth/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/:slug" element={<GameDetailPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
            <Route path="/lobbies" element={<LobbiesPage />} />
            <Route
              path="/lobbies/:id"
              element={
                <ProtectedRoute>
                  <LobbyDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="/rankings" element={<RankingsPage />} />
            <Route path="/vip" element={<VipPage />} />
            <Route
              path="/match-room/:tournamentId"
              element={
                <ProtectedRoute>
                  <MatchRoomPage />
                </ProtectedRoute>
              }
            />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={<ProfilePage />}
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
