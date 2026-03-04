import { Link } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';

const STATUS_STYLES = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  open: 'bg-success/20 text-success border-success/30',
  ongoing: 'bg-accent/20 text-accent border-accent/30',
  finished: 'bg-danger/20 text-danger border-danger/30',
};

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TournamentCard({ tournament }) {
  const statusStyle =
    STATUS_STYLES[tournament.status] || STATUS_STYLES.draft;

  const participantCount =
    tournament.participant_count ?? 0;

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="group block bg-surface rounded-xl border border-surface-light overflow-hidden transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(109,40,217,0.25)]"
    >
      <div className="p-5">
        {/* Top row: badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle}`}
          >
            {tournament.status?.charAt(0).toUpperCase() +
              tournament.status?.slice(1)}
          </span>
          {tournament.format && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary-light border border-primary/30">
              {tournament.format}
            </span>
          )}
        </div>

        {/* Tournament name */}
        <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors mb-1">
          {tournament.name}
        </h3>

        {/* Game name */}
        {tournament.game && (
          <p className="text-sm text-gray-400 mb-4">
            {typeof tournament.game === 'string'
              ? tournament.game
              : tournament.game.name}
          </p>
        )}

        {/* Info row */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-gray-500" />
            <span>
              <span className="text-gray-200 font-medium">
                {participantCount}
              </span>
              {tournament.max_participants && (
                <span> / {tournament.max_participants}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-gray-500" />
            <span>{formatDate(tournament.start_date)}</span>
          </div>
        </div>

        {/* Participant progress bar */}
        {tournament.max_participants > 0 && (
          <div className="mt-3 w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-light rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  (participantCount / tournament.max_participants) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
