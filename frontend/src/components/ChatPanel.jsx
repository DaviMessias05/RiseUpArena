import { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { sendChatMessage, getChatMessages } from '../lib/api';

function formatTimestamp(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatPanel({ channelType, channelId }) {
  const { user } = useAuth();
  const { subscribe, unsubscribe } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch existing messages on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      try {
        setLoading(true);
        const data = await getChatMessages(channelType, channelId);
        if (!cancelled) {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch chat messages:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [channelType, channelId]);

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = `${channelType}:${channelId}`;

    const handleMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    subscribe(channel, handleMessage);

    return () => {
      unsubscribe(channel, handleMessage);
    };
  }, [channelType, channelId, subscribe, unsubscribe]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || !user) return;

    try {
      setSending(true);
      await sendChatMessage(channelType, channelId, trimmed);
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-surface-light overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-light bg-surface-light/30">
        <h3 className="text-sm font-semibold text-gray-200">Chat</h3>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-surface-lighter scrollbar-track-transparent"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary-light border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = user && (msg.user_id === user.id || msg.username === user.username);
            return (
              <div key={msg.id || idx} className="group">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isOwn ? 'text-primary-light' : 'text-accent'
                    }`}
                  >
                    {msg.username || 'Anonymous'}
                  </span>
                  <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.created_at ? formatTimestamp(msg.created_at) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-300 break-words">{msg.content}</p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {user ? (
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-4 py-3 border-t border-surface-light"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
            className="flex-1 bg-surface-light text-sm text-gray-200 placeholder-gray-500 px-3 py-2 rounded-lg border border-surface-lighter focus:outline-none focus:border-primary-light transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-primary hover:bg-primary-light text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-surface-light text-center text-sm text-gray-500">
          Log in to send messages
        </div>
      )}
    </div>
  );
}
