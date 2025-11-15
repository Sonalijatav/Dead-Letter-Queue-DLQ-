const { v4: uuidv4 } = require('uuid');
const { models } = require('./db');
const config = require('./config');

async function enqueue(payload) {
  const Job = models.Job;
  const job = {
    id: payload.id || uuidv4(),
    command: payload.command,
    max_retries: payload.max_retries != null ? payload.max_retries : config.DEFAULT_MAX_RETRIES,
    attempts: 0,
    state: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    next_run_at: new Date()
  };
  await Job.create(job);
  return job;
}

async function list(state) {
  const Job = models.Job;
  const q = state ? { state } : {};
  return Job.find(q).sort({ created_at: 1 }).lean();
}

async function getStatus() {
  const Job = models.Job;
  const counts = await Job.aggregate([
    { $group: { _id: '$state', count: { $sum: 1 } } }
  ]);
  const map = counts.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});
  return map;
}

async function findAndClaim(workerId) {
  // Atomically find a job that's pending or failed but due for retry
  const Job = models.Job;
  const now = new Date();
  const job = await Job.findOneAndUpdate(
    {
      state: { $in: ['pending','failed'] },
      next_run_at: { $lte: now }
    },
    {
      $set: { state: 'processing', processing_by: workerId, locked_at: new Date(), updated_at: new Date() }
    },
    { sort: { created_at: 1 }, returnDocument: 'after' }
  ).lean();
  return job;
}

async function markCompleted(jobId) {
  const Job = models.Job;
  return Job.updateOne({ id: jobId }, { $set: { state: 'completed', updated_at: new Date(), processing_by: null, locked_at: null } });
}

async function markFailed(jobId, error) {
  const Job = models.Job;
  const job = await Job.findOne({ id: jobId });
  if (!job) return;
  job.attempts += 1;
  job.last_error = (error && error.message) ? error.message : String(error);
  job.updated_at = new Date();
  if (job.attempts > job.max_retries) {
    job.state = 'dead';
    job.next_run_at = null;
  } else {
    job.state = 'failed';
    const base = config.BACKOFF_BASE;
    const delaySec = Math.pow(base, job.attempts);
    job.next_run_at = new Date(Date.now() + delaySec * 1000);
  }
  job.processing_by = null;
  job.locked_at = null;
  await job.save();
  return job.toObject();
}

async function retryDeadJob(jobId) {
  const Job = models.Job;
  const job = await Job.findOne({ id: jobId, state: 'dead' });
  if (!job) throw new Error('DLQ job not found');
  job.state = 'pending';
  job.attempts = 0;
  job.next_run_at = new Date();
  job.updated_at = new Date();
  await job.save();
  return job.toObject();
}

module.exports = { enqueue, list, getStatus, findAndClaim, markCompleted, markFailed, retryDeadJob };
