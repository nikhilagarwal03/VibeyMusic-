import { MongoClient, type Db } from "mongodb";
import { env } from "#common/config";

let mongoClientPromise: Promise<MongoClient> | null = null;

const getMongoClient = async () => {
  if (!env.MONGODB_URI) {
    throw new Error("MongoDB is not configured. Set MONGODB_URI and MONGODB_DB_NAME.");
  }

  if (!mongoClientPromise) {
    const client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
    });

    mongoClientPromise = client.connect();
  }

  return mongoClientPromise;
};

export const getMongoDb = async (): Promise<Db> => {
  if (!env.MONGODB_DB_NAME) {
    throw new Error("MongoDB database name is missing. Set MONGODB_DB_NAME.");
  }

  const client = await getMongoClient();
  return client.db(env.MONGODB_DB_NAME);
};

export const warmupMongoConnection = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    return false;
  }

  const db = await getMongoDb();
  await db.command({ ping: 1 });
  return true;
};
