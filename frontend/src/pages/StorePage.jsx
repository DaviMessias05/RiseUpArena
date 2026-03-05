import { Link } from 'react-router-dom';
import {
  Coins,
  AlertCircle,
  CheckCircle,
  Zap,
  Star,
  Gem,
  Crown,
  Rocket,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PAYMENT_LINKS = {
  starter: 'https://buy.stripe.com/4gM28s7DvafP3Xo1se1VK00',
  popular: 'https://buy.stripe.com/aFa3cw6zr3RrgKa7QC1VK01',
  pro: 'https://buy.stripe.com/6oUdRaf5X9bLfG65Iu1VK02',
  elite: 'https://buy.stripe.com/4gM4gA1f7bjT3Xob2O1VK03',
  ultra: 'https://buy.stripe.com/aFadRa5vn2Nn2Tk6My1VK04',
};

const RC_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    rc: 5000,
    price: 15,
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/25',
    popular: false,
  },
  {
    id: 'popular',
    name: 'Popular',
    rc: 12000,
    price: 29,
    icon: Star,
    color: 'from-primary to-primary-dark',
    shadow: 'shadow-primary/25',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    rc: 35000,
    price: 69,
    icon: Gem,
    color: 'from-purple-500 to-purple-700',
    shadow: 'shadow-purple-500/25',
    popular: false,
  },
  {
    id: 'elite',
    name: 'Elite',
    rc: 80000,
    price: 129,
    icon: Crown,
    color: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/25',
    popular: false,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    rc: 200000,
    price: 299,
    icon: Rocket,
    color: 'from-rose-500 to-rose-700',
    shadow: 'shadow-rose-500/25',
    popular: false,
  },
];

function formatNumber(n) {
  return n.toLocaleString('pt-BR');
}

function RCPackageCard({ pkg, user }) {
  const Icon = pkg.icon;
  const pricePerRC = ((pkg.price / pkg.rc) * 1000).toFixed(2);

  return (
    <div className={`relative bg-surface rounded-2xl border ${pkg.popular ? 'border-primary' : 'border-surface-light/50'} overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${pkg.shadow}`}>
      {pkg.popular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary-light text-center py-1">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Mais Popular</span>
        </div>
      )}
      <div className={`${pkg.popular ? 'pt-10' : 'pt-6'} px-6 pb-6 flex flex-col flex-1`}>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center mb-4`}>
          <Icon size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-accent">{formatNumber(pkg.rc)}</span>
          <span className="text-sm font-medium text-gray-400">RC</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">R$ {pricePerRC} por 1.000 RC</p>
        <div className="mt-auto pt-5">
          {user ? (
            <a
              href={PAYMENT_LINKS[pkg.id]}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white shadow-lg ${pkg.shadow}`}
            >
              R$ {pkg.price}
            </a>
          ) : (
            <Link
              to="/auth/login"
              className="w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-surface-light hover:bg-surface-lighter text-gray-400 border border-surface-lighter"
            >
              Faça login para comprar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const { user, profile } = useAuth();

  const userRC = profile?.rise_coins || 0;
  const userAC = profile?.arena_coins || 0;

  const params = new URLSearchParams(window.location.search);
  const successType = params.get('success');

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Loja</h1>
          <p className="text-gray-400 mt-1">Adquira Rise Coins para participar de partidas e eventos</p>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface rounded-xl border border-surface-light/50">
              <Coins size={20} className="text-accent" />
              <span className="text-lg font-bold text-accent">{formatNumber(userRC)}</span>
              <span className="text-xs text-gray-400 font-medium">RC</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface rounded-xl border border-surface-light/50">
              <Coins size={20} className="text-emerald-400" />
              <span className="text-lg font-bold text-emerald-400">{formatNumber(userAC)}</span>
              <span className="text-xs text-gray-400 font-medium">AC</span>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {successType === 'rc' && (
        <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-success flex-shrink-0" />
          <p className="text-sm text-success">Pagamento confirmado! Seus Rise Coins serão adicionados em breve.</p>
        </div>
      )}

      {/* Info section */}
      <div className="bg-surface rounded-2xl border border-surface-light/50 p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-3">Como funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Coins size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Rise Coins (RC)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Moeda premium comprada com dinheiro real. Use para participar de partidas, eventos e campeonatos.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Coins size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Arena Coins (AC)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Moeda ganha jogando. Receba por vitórias, participação em eventos, desafios e conquistas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Packages grid */}
      <h2 className="text-xl font-bold text-white mb-4">Pacotes de Rise Coins</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {RC_PACKAGES.map((pkg) => (
          <RCPackageCard key={pkg.id} pkg={pkg} user={user} />
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        Pagamento seguro via Stripe. Após a confirmação, o saldo de Rise Coins é atualizado automaticamente.
      </p>
    </div>
  );
}
