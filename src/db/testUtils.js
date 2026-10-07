import { db } from './database.js';

export async function resetDatabase() {
  await db.delete();
  await db.open();
}
