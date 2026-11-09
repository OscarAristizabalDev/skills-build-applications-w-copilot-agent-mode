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

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
