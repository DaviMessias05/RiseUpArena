import { useState } from 'react';
import {
  Loader2,
  Coins,
  AlertCircle,
  CheckCircle,
  Zap,
  Crown,
  Star,
  Gem,
  Rocket,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';

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

const VIP_PLANS = [
  {
    id: 'vip_bronze',
    name: 'VIP Bronze',
    price: 19.90,
    duration: '30 dias',
    icon: Star,
    color: 'from-amber-700 to-amber-800',
    shadow: 'shadow-amber-700/25',
    borderColor: 'border-amber-700',
    popular: false,
    benefits: [
      'Emblema VIP Bronze no perfil',
      'Bonus de 10% em RC ganhos',
      'Acesso antecipado a lobbies',
      'Cor exclusiva no chat',
    ],
  },
  {
    id: 'vip_silver',
    name: 'VIP Prata',
    price: 39.90,
    duration: '30 dias',
    icon: Gem,
    color: 'from-gray-400 to-gray-500',
    shadow: 'shadow-gray-400/25',
    borderColor: 'border-gray-400',
    popular: true,
    benefits: [
      'Todos os beneficios do Bronze',
      'Emblema VIP Prata no perfil',
      'Bonus de 25% em RC ganhos',
      'Prioridade na fila de matchmaking',
      'Acesso a torneios exclusivos',
      'Banner personalizado no perfil',
    ],
  },
  {
    id: 'vip_gold',
    name: 'VIP Ouro',
    price: 69.90,
    duration: '30 dias',
    icon: Crown,
    color: 'from-yellow-500 to-amber-500',
    shadow: 'shadow-yellow-500/25',
    borderColor: 'border-yellow-500',
    popular: false,
    benefits: [
      'Todos os beneficios do Prata',
      'Emblema VIP Ouro no perfil',
      'Bonus de 50% em RC ganhos',
      'Acesso VIP ao suporte',
      'Convites ilimitados para lobbies privadas',
      'Destaque no ranking',
      'Efeitos exclusivos no perfil',
    ],
  },
];

function formatNumber(n) {
  return n.toLocaleString('pt-BR');
}

function RCPackageCard({ pkg, onBuy, buying }) {
  const Icon = pkg.icon;
  const pricePerRC = ((pkg.price / pkg.rc) * 1000).toFixed(2);

  return (
    <div
      className={`relative bg-surface rounded-2xl border ${pkg.popular ? 'border-primary' : 'border-surface-light/50'} overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${pkg.shadow}`}
    >
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
          <button
            onClick={() => onBuy(pkg)}
            disabled={buying}
            className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white shadow-lg ${pkg.shadow}`}
          >
            {buying ? <Loader2 size={18} className="animate-spin" /> : <>R$ {pkg.price}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function VipPlanCard({ plan, onBuy, buying }) {
  const Icon = plan.icon;

  return (
    <div
      className={`relative bg-surface rounded-2xl border ${plan.popular ? plan.borderColor : 'border-surface-light/50'} overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${plan.shadow}`}
    >
      {plan.popular && (
        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-r ${plan.color} text-center py-1`}>
          <span className="text-xs font-bold text-white uppercase tracking-wider">Mais Popular</span>
        </div>
      )}
      <div className={`${plan.popular ? 'pt-10' : 'pt-6'} px-6 pb-6 flex flex-col flex-1`}>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
          <Icon size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{plan.duration}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-sm text-gray-400">R$</span>
          <span className="text-3xl font-black text-white">{plan.price.toFixed(2).replace('.', ',')}</span>
        </div>

        <ul className="mt-5 space-y-2.5 flex-1">
          {plan.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check size={16} className="text-primary-light flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-300">{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <button
            onClick={() => onBuy(plan)}
            disabled={buying}
            className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-lg ${plan.shadow}`}
          >
            {buying ? <Loader2 size={18} className="animate-spin" /> : 'Assinar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VipsPage() {
  const { user, profile } = useAuth();
  const [buyingPkg, setBuyingPkg] = useState(null);
  const [buyingVip, setBuyingVip] = useState(null);
  const [buySuccess, setBuySuccess] = useState(null);
  const [buyError, setBuyError] = useState(null);
  const [activeTab, setActiveTab] = useState('vips');

  const userRC = profile?.rise_coins || 0;
  const userAC = profile?.arena_coins || 0;

  async function handleBuyRC(pkg) {
    setBuyingPkg(pkg.id);
    setBuySuccess(null);
    setBuyError(null);

    try {
      await api.apiPost('/store/buy-rc', { package_id: pkg.id });
      setBuySuccess(`Pacote ${pkg.name} adquirido! +${formatNumber(pkg.rc)} RC adicionados.`);
      setTimeout(() => setBuySuccess(null), 4000);
    } catch (err) {
      setBuyError(err.message || 'Erro ao comprar pacote de RC.');
      setTimeout(() => setBuyError(null), 4000);
    } finally {
      setBuyingPkg(null);
    }
  }

  async function handleBuyVip(plan) {
    setBuyingVip(plan.id);
    setBuySuccess(null);
    setBuyError(null);

    try {
      await api.apiPost('/store/buy-vip', { plan_id: plan.id });
      setBuySuccess(`Plano ${plan.name} ativado com sucesso!`);
      setTimeout(() => setBuySuccess(null), 4000);
    } catch (err) {
      setBuyError(err.message || 'Erro ao adquirir plano VIP.');
      setTimeout(() => setBuyError(null), 4000);
    } finally {
      setBuyingVip(null);
    }
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">VIPs & Rise Coins</h1>
          <p className="text-gray-400 mt-1">Adquira planos VIP e Rise Coins</p>
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

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('vips')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'vips'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25'
              : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter'
          }`}
        >
          Planos VIP
        </button>
        <button
          onClick={() => setActiveTab('coins')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'coins'
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25'
              : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter'
          }`}
        >
          Rise Coins (RC)
        </button>
      </div>

      {/* Alerts */}
      {buySuccess && (
        <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-success flex-shrink-0" />
          <p className="text-sm text-success">{buySuccess}</p>
        </div>
      )}

      {buyError && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{buyError}</p>
        </div>
      )}

      {/* VIPs Tab */}
      {activeTab === 'vips' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VIP_PLANS.map((plan) => (
              <VipPlanCard
                key={plan.id}
                plan={plan}
                onBuy={handleBuyVip}
                buying={buyingVip === plan.id}
              />
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Os planos VIP sao renovados manualmente. Beneficios ativados imediatamente apos a compra.
          </p>
        </div>
      )}

      {/* Rise Coins Tab */}
      {activeTab === 'coins' && (
        <div>
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
                  <p className="text-xs text-gray-400 mt-0.5">
                    Moeda premium comprada com dinheiro real. Use para participar de partidas, eventos e campeonatos.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Coins size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Arena Coins (AC)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Moeda ganha jogando. Receba por vitorias, participacao em eventos, desafios e conquistas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Packages grid */}
          <h2 className="text-xl font-bold text-white mb-4">Pacotes de Rise Coins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {RC_PACKAGES.map((pkg) => (
              <RCPackageCard key={pkg.id} pkg={pkg} onBuy={handleBuyRC} buying={buyingPkg === pkg.id} />
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Apos a compra, o saldo de Rise Coins e atualizado automaticamente na sua conta.
          </p>
        </div>
      )}
    </div>
  );
}
