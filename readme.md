## Run

```
npm run dev      # during development
npm run build && npm run start   # for production
```

In server.ts

```
import { loadScheduledJobs, addScheduledJob } from "./lib/cronJobManager";
import { publishTestPaperAndNotify } from "./lib/publishAndNotify";

(async () => {
  await loadScheduledJobs(publishTestPaperAndNotify);

  // Example: Scheduling a paper for future publish
  // (triggered from your admin panel route)
  // await addScheduledJob("test-paper-id-123", new Date("2025-08-01T14:00:00Z"), publishTestPaperAndNotify);
})();
```
