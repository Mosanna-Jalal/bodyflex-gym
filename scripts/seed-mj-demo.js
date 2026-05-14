/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");

      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const userId = process.argv[2] || "mjx";
const demoPassword = "mj123456";
const seedBatch = "client-demo-45-no-sundays";
const goals = [
  "Train 5 days every week",
  "Build visible strength progress",
  "Keep gym consistency above 80%",
  "Improve cardio endurance",
];
const exercises = [
  "Push strength",
  "Pull strength",
  "Leg day",
  "Cardio intervals",
  "Mobility reset",
  "Full body circuit",
  "Core and conditioning",
  "Chest and triceps",
  "Back and biceps",
  "Shoulder strength",
];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");

  return { salt, hash };
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

async function main() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 45000 });

  await client.connect();

  const db = client.db(env.MONGODB_DB || "bodyflex_gym");
  const users = db.collection("users");
  const workouts = db.collection("workouts");

  await users.createIndex({ userId: 1 }, { unique: true });
  await workouts.createIndex({ userId: 1, date: 1 });

  const existingUser = await users.findOne({ userId });

  if (existingUser) {
    await users.updateOne({ userId }, { $set: { goals } });
  } else {
    const { salt, hash } = hashPassword(demoPassword);

    await users.insertOne({
      userId,
      passwordHash: hash,
      salt,
      goals,
      createdAt: new Date(),
    });
  }

  await workouts.deleteMany({ userId, seedBatch });

  const docs = [];
  const cursor = new Date();

  cursor.setHours(12, 0, 0, 0);

  while (docs.length < 45) {
    if (cursor.getDay() !== 0) {
      const index = docs.length;
      const minutes = 35 + ((index * 7) % 55);

      docs.push({
        userId,
        date: dateKey(cursor),
        exercise: exercises[index % exercises.length],
        minutes,
        seedBatch,
        createdAt: new Date(cursor),
      });
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  await workouts.insertMany(docs);
  await client.close();

  console.log(`Seeded ${docs.length} workout entries for user "${userId}" excluding Sundays.`);

  if (!existingUser) {
    console.log(`Created demo login: ${userId} / ${demoPassword}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
