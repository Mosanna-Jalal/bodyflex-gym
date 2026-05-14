import { MongoClient, type Collection, type Db } from "mongodb";

type BodyflexUser = {
  userId: string;
  passwordHash: string;
  salt: string;
  goals: string[];
  createdAt: Date;
  referredBy?: string;
};

export type WorkoutLog = {
  userId: string;
  date: string;
  exercise: string;
  minutes: number;
  createdAt: Date;
};

export type WeightLog = {
  userId: string;
  date: string;
  weight: number;
  unit: string;
  createdAt: Date;
};

let clientPromise: Promise<MongoClient> | null = null;

function getMongoClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();

  return client.db(process.env.MONGODB_DB || "bodyflex_gym");
}

export async function usersCollection(): Promise<Collection<BodyflexUser>> {
  const db = await getDb();
  const collection = db.collection<BodyflexUser>("users");

  await collection.createIndex({ userId: 1 }, { unique: true });
  return collection;
}

export async function workoutsCollection(): Promise<Collection<WorkoutLog>> {
  const db = await getDb();
  const collection = db.collection<WorkoutLog>("workouts");

  await collection.createIndex({ userId: 1, date: 1 });
  return collection;
}

export async function weightCollection(): Promise<Collection<WeightLog>> {
  const db = await getDb();
  const collection = db.collection<WeightLog>("weight_logs");

  await collection.createIndex({ userId: 1, date: 1 });
  return collection;
}
