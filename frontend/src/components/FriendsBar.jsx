import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Plus, Send, ArrowLeft, Loader2, UserPlus, Check, Trash2,
  Users, MessageCircle, Swords, Crown, UserMinus, User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { supabase } from '../lib/supabase';

// ─── helpers ────────────────────────────────────────────────────────────────

function directChannelId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

function timeAgo(dateStr) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function Avatar({ user, size = 8, crown = false }) {
  const name = user?.display_name || user?.username || '?';
  return (
    <div className={`relative w-${size} h-${size} rounded-full bg-[#e8611a] overflow-hidden flex items-center justify-center flex-shrink-0`}>
      {user?.avatar_url
        ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
        : <span className={`font-bold text-white ${size <= 7 ? 'text-[10px]' : 'text-xs'}`}>{name[0].toUpperCase()}</span>
      }
      {crown && (
        <div className="absolute -top-0.5 -right-0.5">
          <Crown size={10} className="text-yellow-400" />
        </div>
      )}
    </div>
  );
}

// ─── DirectChatView ──────────────────────────────────────────────────────────

function DirectChatView({ channelId, otherUser, onBack }) {
  const { user } = useAuth();
  const { subscribeChat } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('chat_messages')
      .select('id, content, created_at, user_id')
      .eq('channel_type', 'direct')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (!cancelled) { setMessages(data || []); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [channelId]);

  useEffect(() => {
    return subscribeChat('direct', channelId, ({ message }) => {
      setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
    });
  }, [channelId, subscribeChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || !user) return;
    setSending(true);
    setInput('');
    await supabase.from('chat_messages').insert({
      channel_type: 'direct', channel_id: channelId, content: trimmed, user_id: user.id,
    });
    setSending(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 flex-shrink-0">
        <button onClick={onBack} className="p-1 rounded text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={13} />
        </button>
        <Avatar user={otherUser} size={6} />
        <span className="text-xs font-semibold text-white truncate">
          {otherUser?.display_name || otherUser?.username || 'Usuário'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {loading
          ? <div className="flex justify-center py-4"><Loader2 size={14} className="animate-spin text-gray-500" /></div>
          : messages.length === 0
            ? <p className="text-[10px] text-gray-600 text-center py-4">Nenhuma mensagem. Diga olá!</p>
            : messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${msg.user_id === user?.id ? 'bg-[#e8611a]/80 text-white' : 'bg-white/8 text-gray-200'}`}
                  title={timeAgo(msg.created_at)}
                >
                  {msg.content}
                </div>
              </div>
            ))
        }
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-1.5 px-2 py-2 border-t border-white/5 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Mensagem..."
          maxLength={1000}
          className="flex-1 bg-white/5 text-xs text-white placeholder-gray-600 rounded-lg px-2.5 py-1.5 outline-none focus:bg-white/8 transition-colors"
        />
        <button type="submit" disabled={!input.trim() || sending} className="p-1.5 rounded-lg bg-[#e8611a] text-white hover:opacity-90 disabled:opacity-40 transition-opacity">
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}

// ─── SquadSection ────────────────────────────────────────────────────────────

function SquadSection({ userId, userProfile }) {
  const [squad, setSquad] = useState(null);       // { id, leader_id }
  const [members, setMembers] = useState([]);      // [{ user_id, profiles }]
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteSlot, setInviteSlot] = useState(null); // index of slot being filled
  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const tokenRef = useRef(null);

  // Store token for beforeunload
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      tokenRef.current = session?.access_token;
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadSquad = useCallback(async () => {
    if (!userId) return;

    // Get current squad membership
    const { data: membership } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      setSquad(null);
      setMembers([]);
      // Check for pending squad invites
      const { data: invites } = await supabase
        .from('squad_invites')
        .select('id, squad_id, inviter:inviter_id(username, display_name, avatar_url)')
        .eq('invitee_id', userId);
      setReceivedInvites(invites || []);
      setLoading(false);
      return;
    }

    // Get squad details + members
    const [{ data: squadData }, { data: membersData }] = await Promise.all([
      supabase.from('squads').select('id, leader_id').eq('id', membership.squad_id).single(),
      supabase
        .from('squad_members')
        .select('user_id, profiles(id, username, display_name, avatar_url)')
        .eq('squad_id', membership.squad_id),
    ]);

    setSquad(squadData);
    setMembers(membersData || []);
    setReceivedInvites([]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadSquad(); }, [loadSquad]);

  // Realtime: squad_members changes
  useEffect(() => {
    if (!squad?.id) return;
    const ch = supabase.channel(`squad-members-${squad.id}`)
      .on('postgres_changes', { event: '*', table: 'squad_members', schema: 'public', filter: `squad_id=eq.${squad.id}` }, loadSquad)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [squad?.id, loadSquad]);

  // Realtime: squad_invites for current user
  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`squad-invites-${userId}`)
      .on('postgres_changes', { event: '*', table: 'squad_invites', schema: 'public', filter: `invitee_id=eq.${userId}` }, loadSquad)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [userId, loadSquad]);

  // Auto-leave on tab close
  useEffect(() => {
    if (!squad?.id || !userId) return;
    const handleUnload = () => {
      if (!tokenRef.current) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/squad_members?squad_id=eq.${squad.id}&user_id=eq.${userId}`;
      fetch(url, {
        method: 'DELETE',
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json',
        },
        keepalive: true,
      });
      // If leader, also delete squad
      if (squad.leader_id === userId) {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/squads?id=eq.${squad.id}`, {
          method: 'DELETE',
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${tokenRef.current}`,
          },
          keepalive: true,
        });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [squad, userId]);

  async function createSquad() {
    const { data: s, error } = await supabase
      .from('squads')
      .insert({ leader_id: userId })
      .select()
      .single();
    if (error) return;
    await supabase.from('squad_members').insert({ squad_id: s.id, user_id: userId });
    loadSquad();
  }

  async function leaveSquad() {
    if (!squad) return;
    await supabase.from('squad_members').delete().eq('squad_id', squad.id).eq('user_id', userId);
    if (squad.leader_id === userId) {
      await supabase.from('squads').delete().eq('id', squad.id);
    }
    loadSquad();
  }

  async function kickMember(memberId) {
    if (!squad || squad.leader_id !== userId) return;
    await supabase.from('squad_members').delete().eq('squad_id', squad.id).eq('user_id', memberId);
    loadSquad();
  }

  async function sendSquadInvite(e) {
    e.preventDefault();
    setInviteError('');
    const username = inviteUsername.trim();
    if (!username) return;

    const { data: target } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (!target) { setInviteError('Usuário não encontrado.'); return; }
    if (target.id === userId) { setInviteError('Você não pode se convidar.'); return; }

    // Auto-criar grupo ao primeiro convite
    let currentSquad = squad;
    if (!currentSquad) {
      const { data: s, error: sErr } = await supabase
        .from('squads')
        .insert({ leader_id: userId })
        .select()
        .single();
      if (sErr) { setInviteError('Erro ao criar grupo.'); return; }
      await supabase.from('squad_members').insert({ squad_id: s.id, user_id: userId });
      currentSquad = s;
      setSquad(s);
    }

    if (members.length >= 5) { setInviteError('Grupo cheio (máx. 5).'); return; }

    const { error } = await supabase.from('squad_invites').insert({
      squad_id: currentSquad.id,
      inviter_id: userId,
      invitee_id: target.id,
    });

    if (error) {
      setInviteError(error.code === '23505' ? 'Convite já enviado.' : 'Erro ao convidar.');
      return;
    }

    setInviteUsername('');
    setInviteSlot(null);
    loadSquad();
  }

  async function acceptSquadInvite(invite) {
    const { error } = await supabase.from('squad_members').insert({
      squad_id: invite.squad_id,
      user_id: userId,
    });
    if (error) { return; }
    await supabase.from('squad_invites').delete().eq('id', invite.id);
    loadSquad();
  }

  async function declineSquadInvite(invite) {
    await supabase.from('squad_invites').delete().eq('id', invite.id);
    loadSquad();
  }

  const isLeader = squad?.leader_id === userId;
  const selfProfile = members.find(m => m.user_id === userId)?.profiles || userProfile;
  const otherMembers = members.filter(m => m.user_id !== userId);

  // Slot 0 = sempre o próprio usuário; slots 1-4 = outros membros ou vazio
  const slots = [
    { fixed: true, profile: selfProfile, memberId: userId },
    ...Array.from({ length: 4 }).map((_, i) => {
      const m = otherMembers[i];
      return m ? { fixed: false, profile: m.profiles, memberId: m.user_id } : null;
    }),
  ];

  return (
    <div className="px-3 py-3 border-b border-white/5">
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Grupo</p>

      {loading ? (
        <div className="flex justify-center py-2"><Loader2 size={13} className="animate-spin text-gray-600" /></div>
      ) : (
        <>
          {/* Convites recebidos (só quando fora de grupo) */}
          {!squad && receivedInvites.map(invite => (
            <div key={invite.id} className="mb-2 bg-white/5 rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-gray-300 mb-1.5">
                <span className="font-semibold text-white">{invite.inviter?.display_name || invite.inviter?.username}</span> te convidou para um grupo
              </p>
              <div className="flex gap-1.5">
                <button onClick={() => acceptSquadInvite(invite)} className="flex items-center gap-1 px-2 py-0.5 bg-green-600/80 text-white rounded text-[10px] hover:bg-green-500 transition-colors">
                  <Check size={10} /> Aceitar
                </button>
                <button onClick={() => declineSquadInvite(invite)} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 text-gray-400 rounded text-[10px] hover:bg-white/15 transition-colors">
                  <X size={10} /> Recusar
                </button>
              </div>
            </div>
          ))}

          {/* 5 bolinhas */}
          <div className="flex items-center gap-1.5 mb-2">
            {slots.map((slot, i) => (
              <div key={i} className="relative group">
                {slot ? (
                  <>
                    <Avatar user={slot.profile} size={8} crown={squad && slot.memberId === squad.leader_id} />
                    {!slot.fixed && squad && isLeader && (
                      <button
                        onClick={() => kickMember(slot.memberId)}
                        title="Remover"
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full items-center justify-center hidden group-hover:flex"
                      >
                        <X size={8} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-8 h-8 rounded-full border border-dashed border-white/15 flex items-center justify-center">
                    <Plus size={11} className="text-gray-700" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input de convite */}
          {inviteSlot !== null && (
            <form onSubmit={sendSquadInvite} className="mb-2">
              <div className="flex gap-1">
                <input
                  value={inviteUsername}
                  onChange={e => setInviteUsername(e.target.value)}
                  placeholder="Username do amigo"
                  className="flex-1 bg-white/5 text-[11px] text-white placeholder-gray-600 rounded px-2 py-1 outline-none focus:bg-white/8"
                  autoFocus
                />
                <button type="submit" className="px-2 py-1 bg-[#e8611a] text-white rounded text-[10px] font-bold hover:opacity-90">
                  Convidar
                </button>
                <button type="button" onClick={() => { setInviteSlot(null); setInviteError(''); setInviteUsername(''); }} className="p-1 text-gray-500 hover:text-white">
                  <X size={12} />
                </button>
              </div>
              {inviteError && <p className="text-[10px] text-red-400 mt-1">{inviteError}</p>}
            </form>
          )}

          {/* Sair do grupo */}
          {squad && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600">
                {isLeader ? 'Você é o líder' : `Líder: ${members.find(m => m.user_id === squad.leader_id)?.profiles?.display_name || '?'}`}
              </span>
              <button onClick={leaveSquad} className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors">
                <UserMinus size={11} />
                {isLeader ? 'Disbander' : 'Sair'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── TeamsSection ─────────────────────────────────────────────────────────────

function TeamsSection() {
  return (
    <div className="px-3 py-3 border-b border-white/5">
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Equipes</p>
      <button className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 text-xs text-gray-400 hover:text-white transition-colors">
        <Swords size={13} />
        Criar equipe
      </button>
    </div>
  );
}

// ─── FriendsTab ───────────────────────────────────────────────────────────────

function FriendsTab({ userId, onStartChat, onInviteToSquad }) {
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [addInput, setAddInput] = useState('');
  const [addError, setAddError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null); // friend.id with open context menu
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenuId]);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('friendships')
      .select('id, status, requester_id, addressee_id, requester:requester_id(id, username, display_name, avatar_url), addressee:addressee_id(id, username, display_name, avatar_url)')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    const accepted = (data || []).filter(f => f.status === 'accepted').map(f => ({
      id: f.id,
      other: f.requester_id === userId ? f.addressee : f.requester,
    }));
    const pending = (data || []).filter(f => f.status === 'pending' && f.addressee_id === userId).map(f => ({
      id: f.id,
      requester: f.requester,
    }));

    setFriends(accepted);
    setPendingReceived(pending);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  // Realtime: friendship changes
  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`friendships-${userId}`)
      .on('postgres_changes', { event: '*', table: 'friendships', schema: 'public' }, loadFriends)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [userId, loadFriends]);

  async function sendFriendRequest(e) {
    e.preventDefault();
    setAddError('');
    const username = addInput.trim();
    if (!username) return;

    const { data: target } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (!target) { setAddError('Usuário não encontrado.'); return; }
    if (target.id === userId) { setAddError('Você não pode se adicionar.'); return; }

    const { error } = await supabase.from('friendships').insert({ requester_id: userId, addressee_id: target.id });
    if (error) {
      setAddError(error.code === '23505' ? 'Solicitação já enviada.' : 'Erro ao enviar.');
      return;
    }
    setAddInput('');
    setShowAdd(false);
  }

  async function acceptFriend(id) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
    loadFriends();
  }

  async function removeFriend(id) {
    await supabase.from('friendships').delete().eq('id', id);
    loadFriends();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Add friend */}
      <div className="px-3 pt-2 pb-1">
        {showAdd ? (
          <form onSubmit={sendFriendRequest} className="mb-1">
            <div className="flex gap-1">
              <input
                value={addInput}
                onChange={e => setAddInput(e.target.value)}
                placeholder="Username"
                className="flex-1 bg-white/5 text-[11px] text-white placeholder-gray-600 rounded px-2 py-1.5 outline-none focus:bg-white/8"
                autoFocus
              />
              <button type="submit" className="p-1.5 bg-[#e8611a] text-white rounded hover:opacity-90 transition-opacity">
                <Check size={12} />
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setAddError(''); }} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                <X size={12} />
              </button>
            </div>
            {addError && <p className="text-[10px] text-red-400 mt-1">{addError}</p>}
          </form>
        ) : (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-white transition-colors mb-2">
            <UserPlus size={13} />
            Adicionar amigo
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={14} className="animate-spin text-gray-500" /></div>
      ) : (
        <>
          {/* Pending requests */}
          {pendingReceived.length > 0 && (
            <div className="px-3 pb-2">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Solicitações</p>
              {pendingReceived.map(req => (
                <div key={req.id} className="flex items-center gap-2 mb-1.5">
                  <Avatar user={req.requester} size={7} />
                  <span className="flex-1 text-[11px] text-gray-300 truncate">
                    {req.requester?.display_name || req.requester?.username}
                  </span>
                  <button onClick={() => acceptFriend(req.id)} className="p-1 text-green-400 hover:text-green-300 transition-colors">
                    <Check size={12} />
                  </button>
                  <button onClick={() => removeFriend(req.id)} className="p-1 text-red-400 hover:text-red-300 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Friends list */}
          {friends.length === 0 ? (
            <p className="text-[11px] text-gray-600 text-center py-4 px-3">Nenhum amigo ainda.</p>
          ) : (
            <div>
              {friends.map(f => (
                <div key={f.id} className="relative">
                  <button
                    onClick={() => setOpenMenuId(prev => prev === f.other?.id ? null : f.other?.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/5 transition-colors text-left"
                  >
                    <Avatar user={f.other} size={7} />
                    <p className="flex-1 text-[11px] font-semibold text-white truncate">
                      {f.other?.display_name || f.other?.username}
                    </p>
                  </button>

                  {openMenuId === f.other?.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-full mt-0.5 z-50 bg-[#1a1d26] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[160px]"
                    >
                      <button
                        onClick={() => { onInviteToSquad(f.other); setOpenMenuId(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-gray-300 hover:bg-white/8 hover:text-white transition-colors"
                      >
                        <Users size={12} className="text-green-400" />
                        Convidar para o grupo
                      </button>
                      <button
                        onClick={() => { onStartChat(f.other); setOpenMenuId(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-gray-300 hover:bg-white/8 hover:text-white transition-colors"
                      >
                        <MessageCircle size={12} className="text-[#e8611a]" />
                        Mensagem
                      </button>
                      <a
                        href={`/profile/${f.other?.id}`}
                        onClick={() => setOpenMenuId(null)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-gray-300 hover:bg-white/8 hover:text-white transition-colors"
                      >
                        <User size={12} className="text-blue-400" />
                        Ver perfil
                      </a>
                      <button
                        onClick={() => { removeFriend(f.id); setOpenMenuId(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-red-400 hover:bg-white/8 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={12} />
                        Remover amigo
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── MessagesTab ──────────────────────────────────────────────────────────────

function MessagesTab({ userId, onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('channel_id, content, created_at, user_id')
        .eq('channel_type', 'direct')
        .or(`channel_id.like.${userId}_%,channel_id.like.%_${userId}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (cancelled) return;
      if (!messages?.length) { setLoading(false); return; }

      const convMap = {};
      for (const m of messages) {
        if (!convMap[m.channel_id]) convMap[m.channel_id] = m;
      }

      const otherIds = Object.keys(convMap).map(cid => cid.split('_').find(p => p !== userId)).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', otherIds);

      if (cancelled) return;
      const pm = {};
      for (const p of profiles || []) pm[p.id] = p;

      setConversations(
        Object.entries(convMap).map(([cid, lastMsg]) => ({
          channelId: cid,
          lastMsg,
          otherUser: pm[cid.split('_').find(p => p !== userId)] || null,
        }))
      );
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={14} className="animate-spin text-gray-500" /></div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-6 px-3">
          <MessageCircle size={24} className="text-gray-700 mx-auto mb-2" />
          <p className="text-[11px] text-gray-600">Nenhuma conversa ainda.</p>
          <p className="text-[10px] text-gray-700 mt-1">Clique no ícone de chat em um amigo.</p>
        </div>
      ) : (
        conversations.map(conv => (
          <button
            key={conv.channelId}
            onClick={() => onOpenChat(conv)}
            className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
          >
            <Avatar user={conv.otherUser} size={8} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white truncate">
                {conv.otherUser?.display_name || conv.otherUser?.username || 'Usuário'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{conv.lastMsg.content}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─── FriendsBar (main) ────────────────────────────────────────────────────────

export default function FriendsBar({ isOpen, onClose }) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('amigos');
  const [activeChat, setActiveChat] = useState(null); // { channelId, otherUser }

  // Close active chat on panel close
  useEffect(() => { if (!isOpen) setActiveChat(null); }, [isOpen]);

  function startChat(otherUser) {
    if (!user || !otherUser) return;
    const channelId = directChannelId(user.id, otherUser.id);
    setActiveChat({ channelId, otherUser });
    setTab('mensagens');
  }

  async function handleInviteToSquad(friend) {
    if (!user || !friend?.id) return;

    // Verifica/cria squad
    const { data: membership } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let squadId = membership?.squad_id;

    if (!squadId) {
      const { data: s, error: sErr } = await supabase
        .from('squads')
        .insert({ leader_id: user.id })
        .select()
        .single();
      if (sErr) return;
      await supabase.from('squad_members').insert({ squad_id: s.id, user_id: user.id });
      squadId = s.id;
    }

    await supabase.from('squad_invites').insert({
      squad_id: squadId,
      inviter_id: user.id,
      invitee_id: friend.id,
    });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-20 md:hidden" onClick={onClose} />}

      {/* Sidebar — hidden on mobile unless open, always visible on desktop */}
      <div className={`fixed top-14 right-0 bottom-0 w-64 bg-[#0c0e13] border-l border-white/5 z-30 flex flex-col ${isOpen ? 'flex' : 'hidden'} md:flex`}>

        {/* Header (mobile close button) */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 flex-shrink-0 md:hidden">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Social</span>
          <button onClick={onClose} className="p-1 rounded text-gray-600 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {!user ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-[11px] text-gray-600 text-center">Faça login para acessar o social.</p>
          </div>
        ) : activeChat ? (
          <DirectChatView
            channelId={activeChat.channelId}
            otherUser={activeChat.otherUser}
            onBack={() => setActiveChat(null)}
          />
        ) : (
          <>
            {/* Squad section */}
            <SquadSection userId={user.id} userProfile={profile} />

            {/* Teams section */}
            <TeamsSection />

            {/* Tabs: Amigos / Mensagens */}
            <div className="flex border-b border-white/5 flex-shrink-0">
              <button
                onClick={() => setTab('amigos')}
                className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${tab === 'amigos' ? 'text-white border-b-2 border-[#e8611a]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Amigos
              </button>
              <button
                onClick={() => setTab('mensagens')}
                className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${tab === 'mensagens' ? 'text-white border-b-2 border-[#e8611a]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Mensagens
              </button>
            </div>

            {tab === 'amigos'
              ? <FriendsTab userId={user.id} onStartChat={startChat} onInviteToSquad={handleInviteToSquad} />
              : <MessagesTab userId={user.id} onOpenChat={setActiveChat} />
            }
          </>
        )}
      </div>
    </>
  );
}
