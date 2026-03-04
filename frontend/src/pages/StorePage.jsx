import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Loader2,
  Coins,
  AlertCircle,
  CheckCircle,
  Package,
  Zap,
  Crown,
  Star,
  Gem,
  Rocket,
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

function formatNumber(n) {
  return n.toLocaleString('pt-BR');
}

function RCPackageCard({ pkg, onBuy, buying }) {
  const Icon = pkg.icon;
  const pricePerRC = (pkg.price / pkg.rc * 1000).toFixed(2);

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
          <button
            onClick={() => onBuy(pkg)}
            disabled={buying}
            className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white shadow-lg ${pkg.shadow}`}
          >
            {buying ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>R$ {pkg.price}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoreProductCard({ product, onBuy, buying, userAC }) {
  const canAfford = userAC >= (product.price || 0);

  return (
    <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden flex flex-col">
      <div className="aspect-square bg-surface-light relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-surface-lighter" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-white">{product.name}</h3>
        <p className="text-sm text-gray-400 mt-1 flex-1 line-clamp-3">
          {product.description || 'Sem descricao.'}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Coins size={18} className="text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400">{formatNumber(product.price || 0)}</span>
            <span className="text-xs text-gray-500">AC</span>
          </div>
          <button
            onClick={() => onBuy(product)}
            disabled={buying || !canAfford}
            className={`px-5 py-2 font-bold rounded-lg text-sm transition-colors flex items-center gap-1.5 disabled:cursor-not-allowed ${
              canAfford
                ? 'bg-primary hover:bg-primary-light text-white disabled:opacity-50'
                : 'bg-surface-lighter text-gray-500'
            }`}
          >
            {buying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShoppingBag size={16} />
            )}
            {canAfford ? 'Comprar' : 'Sem AC'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [buyingPkg, setBuyingPkg] = useState(null);
  const [buySuccess, setBuySuccess] = useState(null);
  const [buyError, setBuyError] = useState(null);
  const [activeTab, setActiveTab] = useState('coins');

  const userRC = profile?.rise_coins || 0;
  const userAC = profile?.arena_coins || 0;

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const data = await api.getStoreProducts();
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  async function handleBuyProduct(product) {
    if (!user) return;
    setBuyingId(product.id);
    setBuySuccess(null);
    setBuyError(null);

    try {
      await api.createOrder(product.id, 1);
      setBuySuccess(`"${product.name}" comprado com sucesso!`);
      setTimeout(() => setBuySuccess(null), 4000);
    } catch (err) {
      setBuyError(err.message || 'Erro ao comprar produto.');
      setTimeout(() => setBuyError(null), 4000);
    } finally {
      setBuyingId(null);
    }
  }

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

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Loja</h1>
          <p className="text-gray-400 mt-1">Adquira Rise Coins e itens exclusivos</p>
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
          onClick={() => setActiveTab('coins')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'coins'
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25'
              : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter'
          }`}
        >
          Rise Coins (RC)
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'items'
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25'
              : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter'
          }`}
        >
          Loja de Itens
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
                  <p className="text-xs text-gray-400 mt-0.5">Moeda premium comprada com dinheiro real. Use para participar de partidas, eventos e campeonatos.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Coins size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Arena Coins (AC)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Moeda ganha jogando. Receba por vitorias, participacao em eventos, desafios e conquistas.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Packages grid */}
          <h2 className="text-xl font-bold text-white mb-4">Pacotes de Rise Coins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {RC_PACKAGES.map((pkg) => (
              <RCPackageCard
                key={pkg.id}
                pkg={pkg}
                onBuy={handleBuyRC}
                buying={buyingPkg === pkg.id}
              />
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Apos a compra, o saldo de Rise Coins e atualizado automaticamente na sua conta.
          </p>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div>
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
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={64} className="text-surface-lighter mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Loja vazia</h2>
              <p className="text-gray-400">Novos itens serao adicionados em breve.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <StoreProductCard
                  key={product.id}
                  product={product}
                  onBuy={handleBuyProduct}
                  buying={buyingId === product.id}
                  userAC={userAC}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
