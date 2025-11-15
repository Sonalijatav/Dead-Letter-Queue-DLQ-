const { exec } = require('child_process');
const queue = require('./queue');
const config = require('./config');

let keepRunning = true;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function runWorker(workerId) {
  console.log('[worker]', workerId, 'started');
  process.on('SIGINT', () => { keepRunning = false; });
  process.on('SIGTERM', () => { keepRunning = false; });
  while (keepRunning) {
    try {
      const job = await queue.findAndClaim(workerId);
      if (!job) {
        await sleep(config.WORKER_POLL_MS);
        continue;
      }
      console.log('[worker]', workerId, 'claimed job', job.id, 'cmd:', job.command);
      await executeCommand(job, workerId);
    } catch (err) {
      console.error('[worker]', workerId, 'error', err && err.message);
      await sleep(config.WORKER_POLL_MS);
    }
  }
  console.log('[worker]', workerId, 'exiting gracefully');
  process.exit(0);
}

function executeCommand(job, workerId) {
  return new Promise((resolve) => {
    const child = exec(job.command, { timeout: 1000 * 60 * 5 }, (error, stdout, stderr) => {
      if (error) {
        console.log('[worker]', workerId, 'job', job.id, 'failed:', error.message);
        queue.markFailed(job.id, error).then(() => resolve());
      } else {
        console.log('[worker]', workerId, 'job', job.id, 'completed. stdout:', String(stdout).trim());
        queue.markCompleted(job.id).then(() => resolve());
      }
    });
  });
}

module.exports = { runWorker };
