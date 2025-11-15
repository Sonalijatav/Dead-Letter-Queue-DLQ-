const mongoose = require('mongoose');
const { jobSchema } = require('./models/job');

let connected = false;

async function connect(uri) {
  if (connected) return mongoose;
  await mongoose.connect(uri, { });
  connected = true;
  return mongoose;
}

module.exports = { connect, models: { Job: mongoose.model('Job', jobSchema) } };
