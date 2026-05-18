const mongoose = require('mongoose');

const spinWheelSchema = new mongoose.Schema({
  status: { type: String, enum: ['pending', 'active', 'completed', 'aborted'], default: 'pending' },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    isEliminated: { type: Boolean, default: false }
  }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  totalPool: { type: Number, default: 0 },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('SpinWheel', spinWheelSchema);
