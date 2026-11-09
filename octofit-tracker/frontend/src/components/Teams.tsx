import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members?: unknown[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const loadData = useCallback(
    () => getJson<TeamsResponse>('/api/teams').then(({ teams }) => teams),
    [],
  );

  return <CapabilityCard<Team>
    title="Teams"
    description="Manage teams and members."
    loadData={loadData}
    emptyMessage="No teams yet."
    renderItem={(team) => `${team.name}${team.mascot ? ` (${team.mascot})` : ''} - ${team.members?.length ?? 0} members`}
  />;
}
