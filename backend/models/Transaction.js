const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wheel: { type: mongoose.Schema.Types.ObjectId, ref: 'SpinWheel' },
  type: { type: String, enum: ['debit', 'credit', 'refund', 'payout'], required: true },
  amount: { type: Number, required: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
