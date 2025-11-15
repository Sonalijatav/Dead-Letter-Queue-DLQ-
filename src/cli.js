#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const config = require('./config');
const db = require('./db');
const queue = require('./queue');
const manager = require('./worker_manager');

async function ensureDb() {
  await db.connect(config.MONGODB_URI);
}

const argv = yargs(hideBin(process.argv))
.command('enqueue [jobJson]', 'Enqueue a job (pass JSON string) or use --file', (y) => {
  y.option('file', { type: 'string', description: 'Path to JSON file containing job payload' });
}, async (args) => {
  await ensureDb();
  let payloadText = args.jobJson;
  const fs = require('fs');
  if (args.file) {
    try {
      payloadText = fs.readFileSync(args.file, 'utf8');
    } catch (e) {
      console.error('Failed to read file', args.file, e.message);
      process.exit(1);
    }
  }
  if (!payloadText) {
    console.error('No job JSON provided. Use positional JSON or --file <path>');
    process.exit(1);
  }
  let payload;
  try { payload = JSON.parse(payloadText); } catch(e){ console.error('Invalid JSON', e.message); process.exit(1); }
  const job = await queue.enqueue(payload);
  console.log('Enqueued job', job.id);
  process.exit(0);
})

  .command('worker start', 'Start worker(s)', (y) => {
    y.option('count', { type: 'number', default: 1 });
  }, async (args) => {
    await ensureDb();
    manager.startWorkers(args.count || 1);
    console.log('Workers started. Use CTRL+C to stop.');

    // Keep process alive and handle graceful shutdown
    process.stdin.resume(); // keep Node process alive

    const shutdown = () => {
      console.log('Shutting down manager and workers...');
      manager.stopWorkers();
      setTimeout(() => process.exit(0), 1000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // prevent yargs from exiting; we hold the process open
    // keep process alive
  })
  .command('worker stop', 'Stop workers (local manager)', {}, async () => {
    manager.stopWorkers();
    console.log('Workers stop signal sent.');
  })
  .command('status', 'Show job counts by state', {}, async () => {
    await ensureDb();
    const s = await queue.getStatus();
    console.log('Status:', s);
    process.exit(0);
  })
  .command('list', 'List jobs', (y) => {
    y.option('state', { type: 'string' });
  }, async (args) => {
    await ensureDb();
    const list = await queue.list(args.state);
    console.log('Jobs:');
    console.table(list.map(j=>({ id: j.id, state: j.state, attempts: j.attempts, command: j.command, next_run_at: j.next_run_at })));
    process.exit(0);
  })
  .command('dlq list', 'List dead-letter jobs', {}, async () => {
    await ensureDb();
    const list = await queue.list('dead');
    console.log('DLQ Jobs:');
    console.table(list.map(j=>({ id: j.id, attempts: j.attempts, last_error: j.last_error, command: j.command })));
    process.exit(0);
  })
  .command('dlq retry <jobId>', 'Retry a dead job', {}, async (args) => {
    await ensureDb();
    try {
      await queue.retryDeadJob(args.jobId);
      console.log('Queued DLQ job for retry:', args.jobId);
    } catch (err) { console.error(err.message); process.exit(1); }
    process.exit(0);
  })
  .command('config set <key> <value>', 'Set config (temporary via env)', {}, async (args) => {
    console.log('Note: config.set is ephemeral — update .env for persistence.');
    const k = String(args.key);
    const v = args.value;
    console.log('Set', k, 'to', v);
    process.exit(0);
  })
  .demandCommand()
  .help()
  .argv;
