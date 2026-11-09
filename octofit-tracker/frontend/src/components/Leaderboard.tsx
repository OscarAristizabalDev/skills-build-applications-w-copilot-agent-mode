import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const loadData = useCallback(
    () => getJson<LeaderboardResponse>('/api/leaderboard').then(({ leaderboard }) => leaderboard),
    [],
  );

  return <CapabilityCard<LeaderboardEntry>
    title="Leaderboard"
    description="Compare team point totals."
    loadData={loadData}
    emptyMessage="No rankings yet."
    renderItem={(entry) => `#${entry.rank} ${entry.teamName} - ${entry.totalPoints} points`}
  />;
}
