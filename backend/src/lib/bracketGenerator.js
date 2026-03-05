const { supabase } = require('./supabase');

/**
 * Generates a single-elimination bracket for a tournament.
 * @param {string} tournamentId
 * @param {string[]} participantUserIds - Array of user IDs to seed into the bracket
 */
async function generateBracket(tournamentId, participantUserIds) {
  if (!participantUserIds || participantUserIds.length < 2) {
    throw new Error('Mínimo de 2 participantes necessário.');
  }

  // Shuffle participants
  const shuffled = participantUserIds.map(uid => ({ user_id: uid }));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pad to next power of 2
  const slots = Math.pow(2, Math.ceil(Math.log2(Math.max(shuffled.length, 2))));
  const totalRounds = Math.log2(slots);
  while (shuffled.length < slots) shuffled.push(null);

  // Build all match rows
  const matchesData = [];
  let roundCount = slots / 2;
  for (let r = 1; r <= totalRounds; r++) {
    for (let i = 0; i < roundCount; i++) {
      const p1 = r === 1 ? (shuffled[i * 2] || null) : null;
      const p2 = r === 1 ? (shuffled[i * 2 + 1] || null) : null;
      const isBye = r === 1 && ((p1 === null) !== (p2 === null));
      matchesData.push({
        tournament_id: tournamentId,
        round: r,
        match_order: i + 1,
        player1_id: p1?.user_id ?? null,
        player2_id: p2?.user_id ?? null,
        winner_id: isBye ? (p1?.user_id ?? p2?.user_id) : null,
        status: isBye ? 'finished' : (r === 1 && p1 && p2 ? 'in_progress' : 'pending'),
        bracket_type: r === totalRounds ? 'grand_final' : 'winners',
      });
    }
    roundCount = roundCount / 2;
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('tournament_matches').insert(matchesData).select();
  if (insertErr) throw new Error('Erro ao criar chaves: ' + insertErr.message);

  // Group by round sorted by match_order
  const byRound = {};
  for (const m of inserted) {
    if (!byRound[m.round]) byRound[m.round] = [];
    byRound[m.round].push(m);
  }
  for (const r of Object.keys(byRound)) byRound[r].sort((a, b) => a.match_order - b.match_order);

  // Link next_match_id
  const linkUpdates = [];
  for (let r = 1; r < totalRounds; r++) {
    for (const m of (byRound[r] || [])) {
      const nextIdx = Math.floor((m.match_order - 1) / 2);
      const nextMatch = byRound[r + 1]?.[nextIdx];
      if (nextMatch) linkUpdates.push(
        supabase.from('tournament_matches').update({ next_match_id: nextMatch.id }).eq('id', m.id)
      );
    }
  }
  await Promise.all(linkUpdates);

  // Auto-advance byes into round 2
  for (const m of inserted.filter(m => m.round === 1 && m.status === 'finished' && m.winner_id)) {
    const nextIdx = Math.floor((m.match_order - 1) / 2);
    const nextMatch = byRound[2]?.[nextIdx];
    if (nextMatch) {
      const field = (m.match_order % 2 === 1) ? 'player1_id' : 'player2_id';
      await supabase.from('tournament_matches').update({ [field]: m.winner_id }).eq('id', nextMatch.id);
    }
  }

  await supabase.from('tournaments').update({ status: 'in_progress' }).eq('id', tournamentId);
  return { matchCount: inserted.length, rounds: totalRounds };
}

module.exports = { generateBracket };
