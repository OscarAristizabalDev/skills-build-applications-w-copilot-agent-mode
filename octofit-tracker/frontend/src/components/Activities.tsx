import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const loadData = useCallback(
    () => getJson<ActivityResponse>('/api/activities').then(({ activities }) => activities),
    [],
  );

  return <CapabilityCard<Activity>
    title="Activities"
    description="Track student activity minutes and points."
    loadData={loadData}
    emptyMessage="No activities yet."
    renderItem={(activity) => `${activity.type} - ${activity.minutes} minutes, ${activity.points} points`}
  />;
}
