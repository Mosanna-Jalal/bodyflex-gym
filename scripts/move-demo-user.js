/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
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

const fromUser = process.argv[2] || "mj";
const toUser = process.argv[3] || "mjx";

async function main() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 45000 });

  await client.connect();

  const db = client.db(env.MONGODB_DB || "bodyflex_gym");
  const users = db.collection("users");
  const workouts = db.collection("workouts");
  const sourceUser = await users.findOne({ userId: fromUser });
  const targetUser = await users.findOne({ userId: toUser });

  if (sourceUser && !targetUser) {
    const { _id, ...userWithoutId } = sourceUser;

    await users.insertOne({ ...userWithoutId, userId: toUser });
    await users.deleteOne({ _id });
  } else if (sourceUser && targetUser) {
    await users.updateOne({ userId: toUser }, { $set: { goals: sourceUser.goals || [] } });
    await users.deleteOne({ userId: fromUser });
  }

  const workoutsResult = await workouts.updateMany({ userId: fromUser }, { $set: { userId: toUser } });

  await client.close();

  console.log(`Moved demo account/data from "${fromUser}" to "${toUser}".`);
  console.log(`Updated workout entries: ${workoutsResult.modifiedCount}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
