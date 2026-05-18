const mongoose = require('mongoose');

const gameConfigSchema = new mongoose.Schema({
  entryFee: { type: Number, default: 100 },
  winnerPoolPercentage: { type: Number, default: 80 },
  adminPoolPercentage: { type: Number, default: 10 },
  appPoolPercentage: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('GameConfig', gameConfigSchema);
