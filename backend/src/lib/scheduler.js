const { supabase } = require('./supabase');
const { generateBracket } = require('./bracketGenerator');

async function autoStartTournaments() {
  try {
    const now = new Date();
    // Grace window: process tournaments that started up to 30 min ago but are still 'upcoming'
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('id, name, start_date')
      .eq('status', 'upcoming')
      .lte('start_date', now.toISOString())
      .gte('start_date', thirtyMinAgo.toISOString());

    if (error) {
      console.error('[Scheduler] Failed to query tournaments:', error.message);
      return;
    }
    if (!tournaments?.length) return;

    for (const t of tournaments) {
      try {
        // Get checked-in participants only
        const { data: checkedIn, error: partErr } = await supabase
          .from('tournament_participants')
          .select('user_id')
          .eq('tournament_id', t.id)
          .eq('status', 'checked_in');

        if (partErr) {
          console.error(`[Scheduler] Failed to fetch participants for ${t.id}:`, partErr.message);
          continue;
        }

        if (!checkedIn || checkedIn.length < 2) {
          console.log(`[Scheduler] Tournament "${t.name}" (${t.id}): only ${checkedIn?.length ?? 0} checked-in player(s), skipping auto-start.`);
          continue;
        }

        console.log(`[Scheduler] Auto-starting tournament "${t.name}" (${t.id}) with ${checkedIn.length} checked-in players`);
        const userIds = checkedIn.map(p => p.user_id);
        const result = await generateBracket(t.id, userIds);
        console.log(`[Scheduler] Tournament "${t.name}" started — ${result.matchCount} matches, ${result.rounds} rounds`);
      } catch (err) {
        console.error(`[Scheduler] Error auto-starting tournament ${t.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Unexpected error:', err.message);
  }
}

function startScheduler() {
  console.log('[Scheduler] Tournament auto-start scheduler running (checks every 60s)');
  setInterval(autoStartTournaments, 60 * 1000);
  // Also run immediately on startup to catch any missed tournaments
  autoStartTournaments();
}

module.exports = { startScheduler };
