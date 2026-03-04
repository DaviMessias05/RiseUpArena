import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CallbackPage from './pages/auth/CallbackPage'
import GamesPage from './pages/GamesPage'
import GameDetailPage from './pages/GameDetailPage'
import TournamentsPage from './pages/TournamentsPage'
import LobbiesPage from './pages/LobbiesPage'
import LobbyDetailPage from './pages/LobbyDetailPage'
import RankingsPage from './pages/RankingsPage'
import StorePage from './pages/StorePage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/admin/AdminPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="pt-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:slug" element={<GameDetailPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route
            path="/lobbies"
            element={
              <ProtectedRoute>
                <LobbiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lobbies/:id"
            element={
              <ProtectedRoute>
                <LobbyDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route
            path="/store"
            element={
              <ProtectedRoute>
                <StorePage />
              </ProtectedRoute>
            }
          />
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
      </main>
    </div>
  )
}
