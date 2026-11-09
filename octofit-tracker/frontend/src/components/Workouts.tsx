import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const loadData = useCallback(
    () => getJson<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then(({ suggestions }) => suggestions),
    [],
  );

  return <CapabilityCard<Workout>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    loadData={loadData}
    emptyMessage="No workout suggestions yet."
    renderItem={(workout) => `${workout.title}${workout.focus ? ` - ${workout.focus}` : ''}${workout.minutes ? `, ${workout.minutes} minutes` : ''}${workout.difficulty ? `, ${workout.difficulty}` : ''}${workout.reason ? `. ${workout.reason}` : ''}`}
  />;
}
