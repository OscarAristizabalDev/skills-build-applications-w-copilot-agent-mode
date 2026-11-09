import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });
  if (typeof input !== 'object' || input === null) {
    throw badRequest('Activity details are required');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const validId = (value: unknown) => typeof value === 'string'
    && /^[\da-f]{24}$/i.test(value)
    && mongoose.isValidObjectId(value);

  if (!validId(userId) || !validId(teamId)) {
    throw badRequest('Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw badRequest('Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity minutes must be a positive number');
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });
  if (typeof input !== 'object' || input === null) {
    throw badRequest('Team details are required');
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw badRequest('Team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw badRequest('Team mascot is required');
  }
  if (!Array.isArray(members) || !members.every((member) => typeof member === 'string' && mongoose.isValidObjectId(member))) {
    throw badRequest('Team members must be valid user IDs');
  }

  const memberIds = members as string[];
  const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
  if (existingMembers !== new Set(memberIds.map((member) => member.toLowerCase())).size) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
  return team.toObject();
}

export async function getLeaderboard() {
  const entries = await Activity.aggregate<{
    teamName: string;
    totalPoints: number;
  }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const activities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focusForActivity = (type: string) => {
    const normalized = type.toLowerCase();
    if (['run', 'running', 'cycle', 'cycling', 'cardio', 'endurance'].includes(normalized)) return 'endurance';
    if (['strength', 'weightlifting', 'weights'].includes(normalized)) return 'strength';
    if (['walk', 'walking', 'mobility', 'yoga', 'stretching'].includes(normalized)) return 'mobility';
    return normalized;
  };
  const activityFocus = new Map<string, number>();
  for (const activity of activities) {
    const focus = focusForActivity(activity.type);
    activityFocus.set(focus, (activityFocus.get(focus) ?? 0) + activity.points);
  }
  const goal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.toLowerCase() : '';
  const workouts = await Workout.find().lean();
  const ranked = workouts.map((workout) => {
    const score = activityFocus.get(workout.focus.toLowerCase()) ?? (workout.focus.toLowerCase() === goal ? 0.5 : 0);
    const matchingActivity = activities.find((activity) => focusForActivity(activity.type) === workout.focus.toLowerCase());
    const reason = matchingActivity
      ? `Matches your ${matchingActivity.type} activity pattern`
      : workout.focus.toLowerCase() === goal
        ? `Matches your ${goal} fitness goal`
        : 'Suggested workout';
    return { workout, score, reason };
  });
  ranked.sort((left, right) => right.score - left.score || (left.workout.title ?? '').localeCompare(right.workout.title ?? ''));
  return ranked.map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
