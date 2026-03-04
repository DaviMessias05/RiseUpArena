const TIER_CONFIG = {
  bronze: {
    label: 'Bronze',
    bg: 'bg-amber-800/20',
    text: 'text-amber-600',
    border: 'border-amber-800/40',
    glow: '',
  },
  silver: {
    label: 'Silver',
    bg: 'bg-gray-400/20',
    text: 'text-gray-300',
    border: 'border-gray-400/40',
    glow: '',
  },
  gold: {
    label: 'Gold',
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
    glow: '',
  },
  platinum: {
    label: 'Platinum',
    bg: 'bg-cyan-400/20',
    text: 'text-cyan-300',
    border: 'border-cyan-400/40',
    glow: 'shadow-[0_0_8px_rgba(34,211,238,0.2)]',
  },
  diamond: {
    label: 'Diamond',
    bg: 'bg-blue-400/20',
    text: 'text-blue-300',
    border: 'border-blue-400/40',
    glow: 'shadow-[0_0_10px_rgba(96,165,250,0.25)]',
  },
  master: {
    label: 'Master',
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
  },
  legend: {
    label: 'Legend',
    bg: 'bg-amber-400/20',
    text: 'text-amber-300',
    border: 'border-amber-400/40',
    glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]',
  },
};

export default function RankBadge({ tier, rating }) {
  const config = TIER_CONFIG[tier?.toLowerCase()] || TIER_CONFIG.bronze;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border} ${config.glow}`}
    >
      <TierIcon tier={tier} />
      <span>{config.label}</span>
      {rating != null && (
        <span className="opacity-75 font-medium">{rating}</span>
      )}
    </span>
  );
}

function TierIcon({ tier }) {
  const t = tier?.toLowerCase();

  if (t === 'legend') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }

  if (t === 'master') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 01-1 1H6a1 1 0 01-1-1v-1h14v1z" />
      </svg>
    );
  }

  if (t === 'diamond' || t === 'platinum') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M6 2l-6 8 12 13L24 10 18 2H6zm1.5 1h9l4.5 6.5-9 10-9-10L7.5 3z" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 8l-1.5 3.5L7 13l3.5 1.5L12 18l1.5-3.5L17 13l-3.5-1.5L12 8zM12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  );
}
