/*
  This file is run in a separate Node.js process per worker.
  It connects to MongoDB, then starts the worker loop.
*/
const { connect, models } = require('./db');
const config = require('./config');
const { runWorker } = require('./worker');

async function main() {
  const workerId = 'worker-' + (process.argv[2] || process.pid);
  await connect(config.MONGODB_URI);
  await runWorker(workerId);
}
main().catch(err => { console.error('worker_process error', err); process.exit(1); });
