import type { Config } from "@netlify/functions";
import { tripStore } from "./_shared/trips";

export default async () => {
  const store = tripStore();
  let removed = 0;
  for (const prefix of ["trip/", "presence/"]) {
    const page = await store.list({ prefix });
    for (const blob of page.blobs) {
      const metadata = await store.getMetadata(blob.key);
      if (metadata?.metadata?.expiresAt && Date.parse(String(metadata.metadata.expiresAt)) <= Date.now()) {
        await store.delete(blob.key);
        removed += 1;
      }
    }
  }
  console.log(`Expired records removed: ${removed}`);
};

export const config: Config = { schedule: "@hourly" };
