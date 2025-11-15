const { connect, models } = require('./src/db');
const config = require('./src/config');

async function main() {
  await connect(config.MONGODB_URI);
  const Job = models.Job;
  await Job.updateOne(
    { id: "9a3b5644-1b5b-4c0b-8139-55a8dfc13e5a" },
    { $set: { state: "pending", attempts: 0, next_run_at: new Date(), updated_at: new Date(), last_error: null } }
  );
  console.log("reset done");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
