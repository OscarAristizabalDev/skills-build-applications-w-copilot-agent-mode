import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

export default function Workouts() {
  return <CapabilityCard<Workout>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    endpoint={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
    dataKey="suggestions"
    emptyMessage="No workout suggestions yet."
    renderItem={(workout) => `${workout.title}${workout.focus ? ` - ${workout.focus}` : ''}${workout.minutes ? `, ${workout.minutes} minutes` : ''}${workout.difficulty ? `, ${workout.difficulty}` : ''}${workout.reason ? `. ${workout.reason}` : ''}`}
  />;
}
