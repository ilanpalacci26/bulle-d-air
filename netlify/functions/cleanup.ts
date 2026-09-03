import type { Config } from "@netlify/functions";
import { tripStore } from "./_shared/trips";

export default async () => {
  const store = tripStore();
  let cursor: string | undefined;
  let removed = 0;
  do {
    const page = await store.list({ prefix: "trip/", cursor });
    for (const blob of page.blobs) {
      const metadata = await store.getMetadata(blob.key);
      if (metadata?.metadata?.expiresAt && Date.parse(String(metadata.metadata.expiresAt)) <= Date.now()) {
        await store.delete(blob.key);
        removed += 1;
      }
    }
    cursor = page.next_cursor;
  } while (cursor);
  console.log(`Expired trips removed: ${removed}`);
};

export const config: Config = { schedule: "@hourly" };
