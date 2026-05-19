const mongoose = require('mongoose');
const SpinWheel = require('../models/SpinWheel');
const GameConfig = require('../models/GameConfig');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const gameService = require('../services/game.service');
const socketService = require('../services/socket.service');

exports.createWheel = async (req, res) => {
  try {
    const existing = await SpinWheel.findOne({ status: { $in: ['pending', 'active'] } });
    if (existing) {
      return res.status(400).json({ message: 'An active or pending wheel already exists' });
    }

    const wheel = new SpinWheel();
    await wheel.save();

    gameService.scheduleGame(wheel._id);
    socketService.emitEvent('wheel_created', { wheel });

    res.status(201).json({ wheel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveWheel = async (req, res) => {
  try {
    const wheel = await SpinWheel.findOne({ status: { $in: ['pending', 'active'] } })
      .populate('participants.user', 'username coins role');
    res.json({ wheel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLatestWheel = async (req, res) => {
  try {
    const wheel = await SpinWheel.findOne({ status: 'completed' })
      .sort({ endedAt: -1 })
      .populate('participants.user', 'username coins role')
      .populate('winner', 'username coins role');
    res.json({ wheel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.joinWheel = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Admins cannot join wheel games.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wheelId = req.params.id;
    const userId = req.user._id;

    const wheel = await SpinWheel.findById(wheelId).session(session);
    if (!wheel) throw new Error('Wheel not found');
    if (wheel.status !== 'pending') throw new Error('Wheel is not open for joining');

    const alreadyJoined = wheel.participants.some(p => p.user.toString() === userId.toString());
    if (alreadyJoined) throw new Error('User already joined');

    const config = await GameConfig.findOne().session(session);
    if (!config) throw new Error('Game config missing');

    const user = await User.findById(userId).session(session);
    if (user.coins < config.entryFee) throw new Error('Insufficient coins');

    // Debit coins
    user.coins -= config.entryFee;
    await user.save({ session });

    // Update wheel
    wheel.participants.push({ user: userId });
    wheel.totalPool += config.entryFee;
    await wheel.save({ session });

    // Record transaction
    await Transaction.create([{
      user: userId,
      wheel: wheelId,
      type: 'debit',
      amount: config.entryFee,
      description: 'Wheel entry fee'
    }], { session });

    await session.commitTransaction();

    const populatedWheel = await SpinWheel.findById(wheelId).populate('participants.user', 'username coins role');
    socketService.emitEvent('user_joined', { wheel: populatedWheel });
    socketService.emitEvent('coins_updated', { userId, coins: user.coins });

    res.json({ message: 'Joined successfully', wheel: populatedWheel });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

exports.manualStart = async (req, res) => {
  try {
    const wheelId = req.params.id;
    const wheel = await SpinWheel.findById(wheelId);
    
    if (!wheel) return res.status(404).json({ message: 'Wheel not found' });
    if (wheel.status !== 'pending') return res.status(400).json({ message: 'Wheel already started or completed' });
    
    await gameService.manualStart(wheelId);
    res.json({ message: 'Start triggered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
