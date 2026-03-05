import { createContext, useContext, useState, useCallback } from 'react';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [activeSession, setActiveSessionState] = useState(null);
  // activeSession: { tournamentId, matchId, tournamentName, round, opponentName } | null

  const addNotification = useCallback(({ type, title, message, tournamentId }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [
      { id, type, title, message, tournamentId, read: false, createdAt: new Date() },
      ...prev,
    ].slice(0, 50)); // cap at 50
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const setActiveSession = useCallback((session) => {
    setActiveSessionState(session);
  }, []);

  const clearSession = useCallback(() => {
    setActiveSessionState(null);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      activeSession,
      addNotification,
      dismissNotification,
      markAllRead,
      setActiveSession,
      clearSession,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
