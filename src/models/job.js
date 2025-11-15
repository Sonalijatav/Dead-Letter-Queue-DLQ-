const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  command: { type: String, required: true },
  state: { type: String, enum: ['pending','processing','completed','failed','dead'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  max_retries: { type: Number, default: 3 },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
  next_run_at: { type: Date, default: () => new Date() },
  processing_by: { type: String, default: null },
  locked_at: { type: Date, default: null },
  last_error: { type: String, default: null }
});

module.exports = { jobSchema };
