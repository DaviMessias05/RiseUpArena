import { Link } from 'react-router-dom';
import { Users, Gamepad2 } from 'lucide-react';

const STATUS_STYLES = {
  waiting: 'bg-success/20 text-success border-success/30',
  ready: 'bg-accent/20 text-accent border-accent/30',
  in_match: 'bg-danger/20 text-danger border-danger/30',
  finished: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS = {
  waiting: 'Waiting',
  ready: 'Ready',
  in_match: 'In Match',
  finished: 'Finished',
};

export default function LobbyCard({ lobby }) {
  const statusStyle =
    STATUS_STYLES[lobby.status] || STATUS_STYLES.waiting;
  const statusLabel =
    STATUS_LABELS[lobby.status] || lobby.status;

  const playerCount = lobby.player_count ?? 0;
  const gameName =
    typeof lobby.game === 'string'
      ? lobby.game
      : lobby.game?.name ?? 'Unknown Game';
  const creatorName =
    typeof lobby.created_by === 'string'
      ? lobby.created_by
      : lobby.created_by?.username ?? 'Unknown';

  return (
    <Link
      to={`/lobbies/${lobby.id}`}
      className="group block bg-surface rounded-xl border border-surface-light overflow-hidden transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(109,40,217,0.25)]"
    >
      <div className="p-5">
        {/* Status badge and game */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle}`}
          >
            {statusLabel}
          </span>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Gamepad2 size={14} className="text-gray-500" />
            <span>{gameName}</span>
          </div>
        </div>

        {/* Lobby name */}
        <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors mb-3">
          {lobby.name}
        </h3>

        {/* Player count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Users size={14} className="text-gray-500" />
            <span>
              <span className="text-gray-200 font-medium">{playerCount}</span>
              {lobby.max_players && <span> / {lobby.max_players}</span>}
              <span className="ml-1">players</span>
            </span>
          </div>

          <span className="text-xs text-gray-500">
            by {creatorName}
          </span>
        </div>

        {/* Player progress bar */}
        {lobby.max_players > 0 && (
          <div className="mt-3 w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  (playerCount / lobby.max_players) * 100,
                  100
                )}%`,
                backgroundColor:
                  playerCount >= lobby.max_players
                    ? 'var(--color-danger)'
                    : 'var(--color-primary-light)',
              }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
