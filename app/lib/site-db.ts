import { ObjectId } from "mongodb";
import { getDb } from "./db";

export type SiteFeature = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type SiteClass = {
  id: string;
  name: string;
  time: string;
  level: string;
  duration: string;
  order: number;
};

export type SiteTrainer = {
  id: string;
  name: string;
  role: string;
  stat: string;
  initial: string;
  spec: string;
  order: number;
};

export type SitePlan = {
  id: string;
  name: string;
  price: string;
  featured: boolean;
  perks: string[];
  order: number;
};

export type SiteMetric = {
  id: string;
  value: string;
  label: string;
  order: number;
};

export type SiteNotice = {
  id: string;
  title: string;
  message: string;
  active: boolean;
  order: number;
};

export type SitePresence = {
  current: number;
  capacity: number;
  updatedAt: string;
};

export type SiteOffer = {
  title: string;
  body: string;
  buttonText: string;
  expiryDate: string;
  active: boolean;
};

const SEED_DATA: Record<string, object[]> = {
  site_features: [
    { title: "Strength Floor", description: "Full range of free weights and machines for serious strength training.", order: 0 },
    { title: "Coached Progress", description: "Expert coaches track your lifts and keep you progressing every session.", order: 1 },
    { title: "Conditioning Lab", description: "Dedicated cardio and conditioning zone with premium equipment.", order: 2 },
  ],
  site_classes: [
    { name: "Power Build", time: "Mon / Wed / Fri", level: "Strength", duration: "60 min", order: 0 },
    { name: "Engine Room", time: "Tue / Thu", level: "Conditioning", duration: "45 min", order: 1 },
    { name: "Mobility Reset", time: "Daily", level: "Recovery", duration: "30 min", order: 2 },
    { name: "Barbell Club", time: "Saturday", level: "Technique", duration: "90 min", order: 3 },
  ],
  site_trainers: [
    { name: "Mia Carter", role: "Strength Lead", stat: "8 yrs", initial: "MC", spec: "Powerlifting · Olympic Lifting", order: 0 },
    { name: "Jason Lee", role: "Conditioning Coach", stat: "NASM", initial: "JL", spec: "Metabolic Conditioning · Endurance", order: 1 },
    { name: "Ava Patel", role: "Mobility Specialist", stat: "FRC", initial: "AP", spec: "Functional Range · Movement Rehab", order: 2 },
  ],
  site_plans: [
    {
      name: "Open Gym",
      price: "₹999",
      featured: false,
      perks: ["Floor access 24 / 7", "App-based class booking", "Locker & shower access"],
      order: 0,
    },
    {
      name: "Performance",
      price: "₹1,999",
      featured: true,
      perks: [
        "Everything in Open Gym",
        "Unlimited class slots",
        "Monthly coach check-in",
        "Priority booking window",
      ],
      order: 1,
    },
    {
      name: "Personal",
      price: "₹4,999",
      featured: false,
      perks: [
        "Everything in Performance",
        "Weekly 1-on-1 session",
        "Custom programme",
        "Nutrition guidance",
      ],
      order: 2,
    },
  ],
  site_metrics: [
    { value: "24/7", label: "Member Access", order: 0 },
    { value: "150+", label: "Weekly Sessions", order: 1 },
    { value: "12", label: "Coach Programs", order: 2 },
  ],
  site_notices: [],
};

function docToItem<T>(doc: Record<string, unknown>): T {
  const { _id, ...rest } = doc;
  return { id: (_id as ObjectId).toHexString(), ...rest } as T;
}

async function col(name: string) {
  const db = await getDb();
  const collection = db.collection(name);

  if (name === "site_notices") {
    await collection.deleteMany({ title: "Welcome to AR Fitness!" });
  }

  const count = await collection.countDocuments();
  if (count === 0 && SEED_DATA[name]?.length > 0) {
    await collection.insertMany(SEED_DATA[name] as object[]);
  }

  return collection;
}

export async function listItems<T>(collection: string): Promise<T[]> {
  const c = await col(collection);
  const docs = await c.find({}).sort({ order: 1 }).toArray();

  return docs.map((doc) => docToItem<T>(doc as Record<string, unknown>));
}

export async function createItem<T>(
  collection: string,
  data: object,
): Promise<T & { id: string }> {
  const c = await col(collection);
  const order = await c.countDocuments();
  const result = await c.insertOne({ ...data, order });
  const doc = await c.findOne({ _id: result.insertedId });

  return docToItem<T & { id: string }>(doc as Record<string, unknown>);
}

export async function updateItem<T>(
  collection: string,
  id: string,
  data: object,
): Promise<T | null> {
  const c = await col(collection);
  const result = await c.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" },
  );

  if (!result) {
    return null;
  }

  return docToItem<T>(result as Record<string, unknown>);
}

export async function deleteItem(collection: string, id: string): Promise<boolean> {
  const c = await col(collection);
  const result = await c.deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount === 1;
}

/* ── Music ───────────────────────────────────────────────────────────── */

export type MusicPlaylist = {
  id: string;
  name: string;
  color: string;
  shareToken: string;
  order: number;
};

export type MusicTrack = {
  id: string;
  playlistId: string;
  title: string;
  youtubeId: string;
  addedAt: string;
  order: number;
};

export async function listMusicPlaylists(): Promise<MusicPlaylist[]> {
  const db = await getDb();
  const docs = await db.collection("music_playlists").find({}).sort({ order: 1 }).toArray();
  return docs.map((d) => docToItem<MusicPlaylist>(d as Record<string, unknown>));
}

export async function createMusicPlaylist(data: { name: string; color: string }): Promise<MusicPlaylist> {
  const db = await getDb();
  const c = db.collection("music_playlists");
  const order = await c.countDocuments();
  const shareToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const result = await c.insertOne({ ...data, shareToken, order });
  const doc = await c.findOne({ _id: result.insertedId });
  return docToItem<MusicPlaylist>(doc as Record<string, unknown>);
}

export async function deleteMusicPlaylist(id: string): Promise<boolean> {
  const db = await getDb();
  await db.collection("music_tracks").deleteMany({ playlistId: id });
  const result = await db.collection("music_playlists").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function listMusicTracks(playlistId?: string): Promise<MusicTrack[]> {
  const db = await getDb();
  const query = playlistId ? { playlistId } : {};
  const docs = await db.collection("music_tracks").find(query).sort({ addedAt: 1 }).toArray();
  return docs.map((d) => docToItem<MusicTrack>(d as Record<string, unknown>));
}

export async function addMusicTrack(data: {
  playlistId: string;
  title: string;
  youtubeId: string;
}): Promise<MusicTrack> {
  const db = await getDb();
  const c = db.collection("music_tracks");
  const result = await c.insertOne({ ...data, addedAt: new Date().toISOString() });
  const doc = await c.findOne({ _id: result.insertedId });
  return docToItem<MusicTrack>(doc as Record<string, unknown>);
}

export async function deleteMusicTrack(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("music_tracks").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function getPlaylistByToken(shareToken: string): Promise<MusicPlaylist | null> {
  const db = await getDb();
  const doc = await db.collection("music_playlists").findOne({ shareToken });
  if (!doc) return null;
  return docToItem<MusicPlaylist>(doc as Record<string, unknown>);
}

export async function getPresence(): Promise<SitePresence> {
  const db = await getDb();
  const doc = await db.collection("site_presence").findOne({});

  if (!doc) return { current: 0, capacity: 50, updatedAt: new Date().toISOString() };

  return {
    current: Number(doc.current) || 0,
    capacity: Number(doc.capacity) || 50,
    updatedAt: String(doc.updatedAt || ""),
  };
}

export async function setPresence(data: Partial<SitePresence>): Promise<SitePresence> {
  const db = await getDb();
  const c = db.collection("site_presence");
  const existing = await c.findOne({});
  const update = { ...data, updatedAt: new Date().toISOString() };

  if (existing) {
    await c.updateOne({}, { $set: update });
  } else {
    await c.insertOne({ current: 0, capacity: 50, ...update });
  }

  return getPresence();
}

export async function getOffer(): Promise<SiteOffer | null> {
  const db = await getDb();
  const doc = await db.collection("site_offer").findOne({});

  if (!doc) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as SiteOffer;
}

export async function setOffer(data: object): Promise<SiteOffer> {
  const db = await getDb();
  const c = db.collection("site_offer");
  const existing = await c.findOne({});

  if (existing) {
    await c.updateOne({}, { $set: data });
  } else {
    await c.insertOne(data as Parameters<typeof c.insertOne>[0]);
  }

  return getOffer() as Promise<SiteOffer>;
}
