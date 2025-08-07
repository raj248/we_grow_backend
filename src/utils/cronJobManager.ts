import cron, { ScheduledTask } from "node-cron";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const JOBS_FILE_PATH = path.resolve(__dirname, "scheduled_jobs.json");

interface ScheduledJob {
  id: string;
  cronExpression: string;
}

const activeJobs: Record<string, ScheduledTask> = {};

/**
 * Load cleanup job on startup.
 */
export async function loadCleanupJob() {
  if (!(await fs.pathExists(JOBS_FILE_PATH))) {
    await fs.writeJson(JOBS_FILE_PATH, []);
  }

  const jobs: ScheduledJob[] = await fs.readJson(JOBS_FILE_PATH);

  for (const job of jobs) {
    scheduleCleanupJob(job);
  }

  // If no job found, schedule default cleanup
  if (jobs.length === 0) {
    await addCleanupJob(); // This adds and runs the repeating job
  }
}

/**
 * Add and persist a daily cleanup job (runs every 2 minutes for now).
 */
export async function addCleanupJob() {
  const cronExpression = "0 0 * * *"; // Every 2 minutes "*/2 * * * *"  (change to `0 0 * * *` for daily)

  const job: ScheduledJob = {
    id: uuidv4(),
    cronExpression,
  };

  // await persistJob(job);
  scheduleCleanupJob(job);
}

/**
 * Schedules a job that deletes expired entries from `NewlyAdded`.
 */
function scheduleCleanupJob(job: ScheduledJob) {
  if (activeJobs[job.id]) {
    return;
  }

  const task = cron.schedule(job.cronExpression, async () => {
    try {
      const result = await prisma.user.deleteMany({
        where: {
          lastActiveAt: {
            lte: new Date(),
          },
        },
      });

      console.log(`[CronJob] Removed ${result.count} expired entries from NewlyAdded`);
    } catch (error) {
      console.error(`[CronJob] Cleanup error for job ${job.id}:`, error);
    }
  });

  activeJobs[job.id] = task;
}

/**
 * Remove a scheduled job by ID.
 */
export async function removeScheduledJob(jobId: string) {
  const jobs: ScheduledJob[] = await fs.readJson(JOBS_FILE_PATH);
  const updatedJobs = jobs.filter((j) => j.id !== jobId);
  await fs.writeJson(JOBS_FILE_PATH, updatedJobs, { spaces: 2 });

  if (activeJobs[jobId]) {
    activeJobs[jobId].stop();
    delete activeJobs[jobId];
  }
}

/**
 * Persist job to JSON file.
 */
async function persistJob(job: ScheduledJob) {
  const jobs: ScheduledJob[] = (await fs.readJson(JOBS_FILE_PATH).catch(() => [])) || [];
  jobs.push(job);
  await fs.writeJson(JOBS_FILE_PATH, jobs, { spaces: 2 });
}
