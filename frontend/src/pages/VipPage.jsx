import { Crown, Check, Star, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PAYMENT_LINKS = {
  bronze: 'https://buy.stripe.com/eVq8wQ3nf87H9hI8UG1VK05',
  silver: 'https://buy.stripe.com/28EeVebTLbjTalMc6S1VK06',
  premium: 'https://buy.stripe.com/dRm7sMcXP1JjdxYgn81VK07',
};

const PLANS = [
  {
    tier: 'bronze',
    name: 'VIP Bronze',
    price: 'R$ 24,90',
    priceLabel: '/mês',
    color: 'from-orange-500 to-orange-700',
    borderColor: 'border-orange-500/30',
    icon: Shield,
    benefits: [
      'Badge VIP Bronze no perfil',
      'Avatar exclusivo VIP',
      'Acesso a torneios VIP',
      'Prioridade no matchmaking',
      'Destaque no ranking',
    ],
  },
  {
    tier: 'silver',
    name: 'VIP Silver',
    price: 'R$ 50,00',
    priceLabel: '/mês',
    color: 'from-gray-300 to-gray-500',
    borderColor: 'border-gray-300/30',
    icon: Star,
    popular: true,
    benefits: [
      'Todos benefícios do Bronze',
      'Badge VIP Silver no perfil',
      '2,5% de desconto em partidas',
    ],
  },
  {
    tier: 'premium',
    name: 'VIP Premium',
    price: 'R$ 75,00',
    priceLabel: '/mês',
    color: 'from-yellow-400 to-yellow-600',
    borderColor: 'border-yellow-400/30',
    icon: Crown,
    benefits: [
      'Todos benefícios do Silver',
      'Badge VIP Premium dourado',
      'Borda de perfil exclusiva',
      'Acesso a campeonatos exclusivos',
      'Prioridade máxima no matchmaking',
      '5% de desconto em partidas',
      '5% de desconto em campeonatos',
    ],
  },
];

export function VipBadge({ tier, size = 'md' }) {
  const config = {
    bronze: { label: 'VIP Bronze', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
    silver: { label: 'VIP Silver', color: 'text-gray-300 bg-gray-300/10 border-gray-300/30' },
    premium: { label: 'VIP Premium', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  };

  const c = config[tier];
  if (!c) return null;

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded border ${c.color} ${sizeClass}`}>
      <Crown size={size === 'sm' ? 12 : 14} />
      {c.label}
    </span>
  );
}

export default function VipPage() {
  const { user, profile } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const successVip = params.get('success') === 'vip';

  const currentTier = profile?.vip_tier;
  const vipExpiresAt = profile?.vip_expires_at;
  const isVipActive = currentTier && vipExpiresAt && new Date(vipExpiresAt) > new Date();

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full mb-4">
          <Crown size={18} className="text-yellow-400" />
          <span className="text-yellow-400 font-semibold text-sm">Sistema VIP</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Eleve sua experiência
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Benefícios exclusivos, prioridade no matchmaking, destaque no ranking e descontos em partidas e campeonatos.
        </p>
      </div>

      {/* Alerts */}
      {successVip && (
        <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl flex items-center gap-3">
          <Check size={20} className="text-success flex-shrink-0" />
          <p className="text-sm text-success">Pagamento confirmado! Seu plano VIP será ativado em breve.</p>
        </div>
      )}

      {/* Current VIP status */}
      {isVipActive && (
        <div className="mb-8 p-5 bg-surface rounded-xl border border-yellow-400/30 flex items-center gap-4">
          <Crown size={32} className="text-yellow-400" />
          <div>
            <p className="text-white font-bold">Seu plano atual: <VipBadge tier={currentTier} /></p>
            <p className="text-sm text-gray-400 mt-1">
              Expira em {new Date(vipExpiresAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = isVipActive && currentTier === plan.tier;

          return (
            <div
              key={plan.tier}
              className={`relative bg-surface rounded-2xl border overflow-hidden transition-transform hover:scale-[1.02] ${
                plan.popular ? 'border-primary/50 shadow-lg shadow-primary/10' : plan.borderColor
              } ${isCurrentPlan ? 'ring-2 ring-yellow-400' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-white text-xs font-bold text-center py-1.5">
                  MAIS POPULAR
                </div>
              )}

              <div className={`p-6 ${plan.popular ? 'pt-10' : ''}`}>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon size={28} className="text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.priceLabel}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={16} className="text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 bg-surface-lighter text-gray-400 font-bold rounded-xl cursor-not-allowed"
                  >
                    Plano Atual
                  </button>
                ) : user ? (
                  <a
                    href={PAYMENT_LINKS[plan.tier]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary-light text-white'
                        : 'bg-surface-light hover:bg-surface-lighter text-white border border-surface-lighter'
                    }`}
                  >
                    <Zap size={18} />
                    Assinar
                  </a>
                ) : (
                  <Link
                    to="/auth/login"
                    className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary-light text-white'
                        : 'bg-surface-light hover:bg-surface-lighter text-white border border-surface-lighter'
                    }`}
                  >
                    <Zap size={18} />
                    Assinar
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-surface rounded-2xl border border-surface-light/50 overflow-hidden">
        <div className="p-6 border-b border-surface-light/50">
          <h2 className="text-xl font-bold text-white">Comparação dos Planos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-light/30">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Benefício</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-orange-400">Bronze</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Silver</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-yellow-400">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light/30">
              {[
                ['Badge VIP no perfil', true, true, true],
                ['Avatar exclusivo', true, true, true],
                ['Torneios VIP', true, true, true],
                ['Prioridade matchmaking', true, true, true],
                ['Destaque no ranking', true, true, true],
                ['Borda de perfil exclusiva', false, false, true],
                ['Campeonatos exclusivos', false, false, true],
                ['Desconto em partidas', '—', '2,5%', '5%'],
                ['Desconto em campeonatos', '—', '—', '5%'],
              ].map(([label, bronze, silver, premium], idx) => (
                <tr key={idx} className="hover:bg-surface-light/20">
                  <td className="px-6 py-3 text-sm text-gray-300">{label}</td>
                  {[bronze, silver, premium].map((val, i) => (
                    <td key={i} className="px-6 py-3 text-center">
                      {val === true ? (
                        <Check size={18} className="text-success mx-auto" />
                      ) : val === false ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <span className="text-sm font-semibold text-white">{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
