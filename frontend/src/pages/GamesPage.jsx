import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Loader2, Users } from 'lucide-react';
import * as api from '../lib/api';

function GameCard({ game }) {
  return (
    <Link
      to={`/games/${game.slug}`}
      className="group bg-surface rounded-xl overflow-hidden border border-surface-light/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-video bg-surface-light relative overflow-hidden">
        {game.banner_url ? (
          <img
            src={game.banner_url}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 size={48} className="text-surface-lighter" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2 py-1 bg-primary/80 text-white text-xs font-semibold rounded">
            {game.genre || 'Esports'}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-white group-hover:text-primary-light transition-colors">
          {game.name}
        </h3>
        <p className="text-sm text-gray-400 mt-2 line-clamp-2">
          {game.description || 'Compete neste jogo na plataforma Rise Up!'}
        </p>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          {game.player_count !== undefined && (
            <span className="flex items-center gap-1">
              <Users size={14} />
              {game.player_count} jogadores ativos
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchGames() {
      try {
        const data = await api.getGames();
        if (!cancelled) {
          setGames(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGames();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Jogos</h1>
        <p className="text-gray-400 mt-1">Explore os jogos disponíveis na plataforma</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={40} className="text-primary-light animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-danger mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-surface-light hover:bg-surface-lighter text-white rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 size={64} className="text-surface-lighter mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhum jogo disponível</h2>
          <p className="text-gray-400">Novos jogos serão adicionados em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id || game.slug} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
