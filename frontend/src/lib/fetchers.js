import { supabase } from './supabase'

export async function fetchGames() {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

export async function fetchGame(slug) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export async function fetchTournaments() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*, games(name, slug, max_team_size)')
    .neq('status', 'draft')
    .order('start_date', { ascending: true })

  if (error) throw error
  return (data || []).map(t => ({
    ...t,
    game_name: t.games?.name || 'Jogo',
    game_slug: t.games?.slug,
    team_size: t.team_size || t.games?.max_team_size || 5,
    prize_pool: t.prize_description || t.prize_pool,
    max_players: t.max_participants || t.max_players,
    current_players: t.current_participants || t.current_players || 0,
  }))
}

export async function fetchLobbies() {
  const { data, error } = await supabase
    .from('lobbies')
    .select('*, games(name, slug)')
    .in('status', ['waiting', 'ready'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(l => ({
    ...l,
    game_name: l.games?.name || 'Jogo',
    game_slug: l.games?.slug,
  }))
}

export async function fetchRankings(gameSlug) {
  // First get game id from slug
  const { data: game, error: gErr } = await supabase
    .from('games')
    .select('id')
    .eq('slug', gameSlug)
    .single()

  if (gErr) throw gErr

  const { data, error } = await supabase
    .from('rankings')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('game_id', game.id)
    .order('rating', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data || []).map(r => ({
    ...r,
    username: r.profiles?.username,
    display_name: r.profiles?.display_name,
    avatar_url: r.profiles?.avatar_url,
  }))
}

export async function fetchUserRankings(userId) {
  const { data, error } = await supabase
    .from('rankings')
    .select('*, games(name, slug, banner_url)')
    .eq('user_id', userId)
    .order('rating', { ascending: false })

  if (error) throw error
  return (data || []).map(r => ({
    ...r,
    game_name: r.games?.name || 'Jogo',
    game_slug: r.games?.slug,
    game_banner: r.games?.banner_url,
  }))
}

export async function fetchPlatformStats() {
  const [
    { count: users },
    { count: matches },
    { count: tournaments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
  ])

  return {
    users: users || 0,
    matches: matches || 0,
    tournaments: tournaments || 0,
  }
}
