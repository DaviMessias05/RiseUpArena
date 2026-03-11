import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  User,
  Edit3,
  Save,
  X,
  Loader2,
  Gamepad2,
  Trophy,
  Swords,
  Clock,
  AlertCircle,
  Camera,
  Upload,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { VipBadge } from './VipPage';
import { supabase, sessionReady } from '../lib/supabase';
import { uploadAvatar } from '../lib/api';

function getLevelInfo(rp) {
  if (rp >= 3000) return { level: 10, label: 'Nível 10', color: 'text-red-400' };
  if (rp >= 2501) return { level: 9, label: 'Nível 9', color: 'text-yellow-400' };
  if (rp >= 2101) return { level: 8, label: 'Nível 8', color: 'text-purple-400' };
  if (rp >= 1701) return { level: 7, label: 'Nível 7', color: 'text-purple-300' };
  if (rp >= 1301) return { level: 6, label: 'Nível 6', color: 'text-blue-400' };
  if (rp >= 901)  return { level: 5, label: 'Nível 5', color: 'text-cyan-400' };
  if (rp >= 601)  return { level: 4, label: 'Nível 4', color: 'text-green-400' };
  if (rp >= 301)  return { level: 3, label: 'Nível 3', color: 'text-emerald-400' };
  if (rp >= 101)  return { level: 2, label: 'Nível 2', color: 'text-gray-300' };
  return { level: 1, label: 'Nível 1', color: 'text-gray-400' };
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function AvatarUpload({ currentUrl, onUploaded, userId }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  const validateFile = useCallback((file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato inválido. Use JPG, PNG, WebP ou GIF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Imagem muito grande. Máximo 2MB.';
    }
    return null;
  }, []);

  const uploadFile = useCallback(async (file) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setUploading(true);

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const { url } = await uploadAvatar(file);

      setPreview(url);
      onUploaded(url);
    } catch (err) {
      setUploadError(err.message || 'Erro ao enviar imagem.');
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  }, [userId, currentUrl, onUploaded, validateFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [uploadFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setUploadError(null);
    onUploaded('');
  }, [onUploaded]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        Foto de Perfil
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragging
            ? 'border-primary bg-primary/10'
            : 'border-surface-lighter hover:border-primary/50 hover:bg-surface-light/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="text-primary-light animate-spin" />
            <span className="text-sm text-gray-400">Enviando...</span>
          </div>
        ) : preview ? (
          <div className="flex items-center gap-4">
            <img
              src={preview}
              alt="Preview"
              className="w-20 h-20 rounded-xl object-cover border-2 border-surface-lighter"
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-300">Arraste outra imagem ou clique para trocar</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="flex items-center gap-1.5 text-xs text-danger hover:text-red-400 transition-colors self-start"
              >
                <Trash2 size={14} />
                Remover foto
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center">
              <ImagePlus size={24} className="text-gray-400" />
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-300">
                Arraste uma imagem aqui ou <span className="text-primary-light font-medium">clique para selecionar</span>
              </span>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP ou GIF - Máx. 2MB</p>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-danger">
          <AlertCircle size={14} />
          {uploadError}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-surface rounded-xl border border-surface-light/50 p-5 text-center">
      <Icon size={24} className={`mx-auto mb-2 ${color || 'text-primary-light'}`} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function MatchHistoryRow({ match }) {
  const isWin = match.result === 'win';
  const isDraw = match.result === 'draw';

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        isWin
          ? 'bg-success/5 border-success/20'
          : isDraw
          ? 'bg-surface-light border-surface-lighter'
          : 'bg-danger/5 border-danger/20'
      }`}
    >
      <div
        className={`w-14 text-center font-bold text-sm py-1 rounded ${
          isWin
            ? 'bg-success/20 text-success'
            : isDraw
            ? 'bg-gray-500/20 text-gray-400'
            : 'bg-danger/20 text-danger'
        }`}
      >
        {isWin ? 'W' : isDraw ? 'D' : 'L'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">
          {match.game_name || 'Partida'}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {match.created_at
            ? new Date(match.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </div>
      </div>
      {match.score && (
        <div className="text-sm text-gray-400 font-medium">{match.score}</div>
      )}
      {match.rating_change !== undefined && match.rating_change !== null && (
        <div
          className={`text-sm font-bold ${
            match.rating_change > 0
              ? 'text-success'
              : match.rating_change < 0
              ? 'text-danger'
              : 'text-gray-400'
          }`}
        >
          {match.rating_change > 0 ? '+' : ''}{match.rating_change} RP
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { userId: paramUserId } = useParams();
  const { user, profile: authProfile, updateProfile } = useAuth();

  const isOwnProfile = !paramUserId || (user && paramUserId === user.id);
  const targetUserId = paramUserId || user?.id;

  const [profileData, setProfileData] = useState(null);
  const [gameStats, setGameStats] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    avatar_url: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      await sessionReady;

      try {
        // Fetch profile, rankings (stats) and match history in parallel via Supabase directly
        const profilePromise = isOwnProfile && authProfile
          ? Promise.resolve({ data: authProfile, error: null })
          : supabase.from('profiles').select('*').eq('id', targetUserId).single();

        const statsPromise = supabase
          .from('rankings')
          .select('rating, wins, losses, games(id, name, slug)')
          .eq('user_id', targetUserId);

        const matchesPromise = supabase
          .from('match_players')
          .select('result, rating_change, matches(id, created_at, games(name))')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false, referencedTable: 'matches' })
          .limit(20);

        const [profileResult, statsResult, matchesResult] = await Promise.allSettled([
          profilePromise,
          statsPromise,
          matchesPromise,
        ]);

        if (cancelled) return;

        if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
          const p = profileResult.value.data;
          setProfileData(p);
          setEditForm({
            bio: p?.bio || '',
            avatar_url: p?.avatar_url || '',
          });
        } else {
          throw new Error('Perfil não encontrado.');
        }

        if (statsResult.status === 'fulfilled' && !statsResult.value.error) {
          setGameStats((statsResult.value.data || []).map(s => ({
            game_id: s.games?.id,
            game_name: s.games?.name,
            game_slug: s.games?.slug,
            rating: s.rating,
            wins: s.wins,
            losses: s.losses,
          })));
        }

        if (matchesResult.status === 'fulfilled' && !matchesResult.value.error) {
          setMatches((matchesResult.value.data || []).map(mp => ({
            id: mp.matches?.id,
            result: mp.result,
            rating_change: mp.rating_change,
            created_at: mp.matches?.created_at,
            game_name: mp.matches?.games?.name,
          })));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [targetUserId, isOwnProfile, authProfile]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);

    try {
      const updated = await updateProfile({
        bio: editForm.bio || null,
        avatar_url: editForm.avatar_url || null,
      });
      setProfileData((prev) => ({ ...prev, ...updated }));
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={40} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (!targetUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <User size={64} className="text-surface-lighter mb-4" />
        <p className="text-gray-400 text-lg">Faça login para ver seu perfil.</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-danger text-lg mb-4">{error || 'Perfil não encontrado.'}</p>
      </div>
    );
  }

  const totalWins = gameStats.reduce((sum, s) => sum + (s.wins || 0), 0);
  const totalLosses = gameStats.reduce((sum, s) => sum + (s.losses || 0), 0);
  const totalGames = totalWins + totalLosses;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-surface rounded-2xl border border-surface-light/50 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-primary-dark via-primary to-primary-light" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={profileData.username}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-surface bg-surface"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-surface-light border-4 border-surface flex items-center justify-center">
                  <User size={36} className="text-gray-400" />
                </div>
              )}
              {isOwnProfile && editing && (
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-surface">
                  <Camera size={14} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">
                  {profileData.username}
                </h1>
                {profileData.vip_tier && <VipBadge tier={profileData.vip_tier} size="sm" />}
              </div>
              {profileData.full_name && (
                <p className="text-gray-400">{profileData.full_name}</p>
              )}
              {profileData.bio && (
                <p className="text-sm text-gray-300 mt-1">{profileData.bio}</p>
              )}
            </div>
            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-5 py-2 bg-surface-light hover:bg-surface-lighter text-white font-medium rounded-xl border border-surface-lighter transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                <Edit3 size={16} />
                Editar Perfil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isOwnProfile && editing && (
        <div className="bg-surface rounded-xl border border-surface-light/50 p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Editar Perfil</h2>

          {saveError && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{saveError}</p>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <AvatarUpload
              currentUrl={editForm.avatar_url}
              userId={user.id}
              onUploaded={(url) => setEditForm({ ...editForm, avatar_url: url })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Conte algo sobre você..."
                maxLength={200}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-2.5 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                {saveLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setSaveError(null);
                  setEditForm({
                    bio: profileData.bio || '',
                    avatar_url: profileData.avatar_url || '',
                  });
                }}
                className="px-6 py-2.5 bg-surface-light hover:bg-surface-lighter text-white rounded-xl border border-surface-lighter transition-colors flex items-center gap-2"
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Swords} label="Partidas" value={totalGames} color="text-primary-light" />
        <StatCard icon={Trophy} label="Vitórias" value={totalWins} color="text-success" />
        <StatCard
          icon={Gamepad2}
          label="Jogos"
          value={gameStats.length}
          color="text-accent"
        />
        <StatCard
          icon={Clock}
          label="Win Rate"
          value={totalGames > 0 ? `${Math.round((totalWins / totalGames) * 100)}%` : '0%'}
          color="text-cyan-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-primary text-white'
              : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter'
          }`}
        >
          Estatísticas por Jogo
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-primary text-white'
              : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter'
          }`}
        >
          Histórico de Partidas
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {gameStats.length === 0 ? (
            <div className="bg-surface rounded-xl border border-surface-light/50 p-12 text-center">
              <Gamepad2 size={48} className="text-surface-lighter mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma estatística disponível.</p>
              <p className="text-sm text-gray-500 mt-1">Jogue partidas para ver suas stats!</p>
            </div>
          ) : (
            gameStats.map((stat) => {
              const wins = stat.wins || 0;
              const losses = stat.losses || 0;
              const total = wins + losses;
              const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
              const tier = getLevelInfo(stat.rating || 0);

              return (
                <div
                  key={stat.game_slug || stat.game_id}
                  className="bg-surface rounded-xl border border-surface-light/50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Gamepad2 size={20} className="text-primary-light" />
                      <h3 className="text-lg font-bold text-white">
                        {stat.game_name || 'Jogo'}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${tier.color}`}>
                      {tier.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">RP</div>
                      <div className="text-xl font-bold text-white">{stat.rating || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Vitórias</div>
                      <div className="text-xl font-bold text-success">{wins}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Derrotas</div>
                      <div className="text-xl font-bold text-danger">{losses}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Win Rate</div>
                      <div className={`text-xl font-bold ${winRate >= 50 ? 'text-success' : 'text-gray-400'}`}>
                        {winRate}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="bg-surface rounded-xl border border-surface-light/50 p-12 text-center">
              <Swords size={48} className="text-surface-lighter mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma partida registrada.</p>
              <p className="text-sm text-gray-500 mt-1">Participe de lobbies e campeonatos!</p>
            </div>
          ) : (
            matches.map((match, idx) => (
              <MatchHistoryRow key={match.id || idx} match={match} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
