const mongoose = require('mongoose');
const SpinWheel = require('../models/SpinWheel');
const GameConfig = require('../models/GameConfig');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const socketService = require('./socket.service');

let wheelTimer = null;
let gameLoopTimer = null;

const startGame = async (wheelId) => {
  try {
    const wheel = await SpinWheel.findById(wheelId).populate('participants.user');
    if (!wheel || wheel.status !== 'pending') return;

    if (wheel.participants.length < 3) {
      // Abort and refund
      wheel.status = 'aborted';
      await wheel.save();
      
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const config = await GameConfig.findOne();
        const entryFee = config ? config.entryFee : 100;
        
        for (const p of wheel.participants) {
          await User.findByIdAndUpdate(p.user._id, { $inc: { coins: entryFee } }, { session });
          await Transaction.create([{
            user: p.user._id,
            wheel: wheel._id,
            type: 'refund',
            amount: entryFee,
            description: 'Wheel aborted due to insufficient participants'
          }], { session });
        }
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        console.error('Refund error:', err);
      } finally {
        session.endSession();
      }
      
      socketService.emitEvent('wheel_aborted', { wheelId: wheel._id });
      return;
    }

    // Start game
    wheel.status = 'active';
    wheel.startedAt = new Date();
    await wheel.save();
    socketService.emitEvent('wheel_started', { wheelId: wheel._id, participants: wheel.participants });

    // Elimination loop
    const activeParticipants = wheel.participants.map(p => p.user._id.toString());
    
    gameLoopTimer = setInterval(async () => {
      // Randomly eliminate one
      if (activeParticipants.length <= 1) {
        clearInterval(gameLoopTimer);
        const winnerId = activeParticipants[0];
        await finishGame(wheelId, winnerId);
        return;
      }
      
      const eliminateIdx = Math.floor(Math.random() * activeParticipants.length);
      const eliminatedId = activeParticipants.splice(eliminateIdx, 1)[0];
      
      await SpinWheel.updateOne(
        { _id: wheelId, 'participants.user': eliminatedId },
        { $set: { 'participants.$.isEliminated': true } }
      );
      
      socketService.emitEvent('user_eliminated', { wheelId, userId: eliminatedId });
      
    }, 7000);
    
  } catch (error) {
    console.error('Game start error:', error);
  }
};

const finishGame = async (wheelId, winnerId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wheel = await SpinWheel.findById(wheelId).session(session);
    wheel.status = 'completed';
    wheel.winner = winnerId;
    wheel.endedAt = new Date();
    
    const config = await GameConfig.findOne().session(session);
    const winnerAmount = (wheel.totalPool * config.winnerPoolPercentage) / 100;
    const adminAmount = (wheel.totalPool * config.adminPoolPercentage) / 100;
    
    // Credit winner
    await User.findByIdAndUpdate(winnerId, { $inc: { coins: winnerAmount } }, { session });
    await Transaction.create([{
      user: winnerId,
      wheel: wheelId,
      type: 'payout',
      amount: winnerAmount,
      description: 'Wheel winner payout'
    }], { session });
    
    // Credit admin
    const admin = await User.findOne({ role: 'admin' }).session(session);
    if (admin) {
      await User.findByIdAndUpdate(admin._id, { $inc: { coins: adminAmount } }, { session });
      await Transaction.create([{
        user: admin._id,
        wheel: wheelId,
        type: 'credit',
        amount: adminAmount,
        description: 'Admin pool credit'
      }], { session });
    }
    
    await wheel.save({ session });
    await session.commitTransaction();
    
    const populatedWheel = await SpinWheel.findById(wheelId).populate('participants.user').populate('winner');
    socketService.emitEvent('wheel_completed', { wheel: populatedWheel });
  } catch (err) {
    await session.abortTransaction();
    console.error('Finish game error:', err);
  } finally {
    session.endSession();
  }
};

exports.scheduleGame = (wheelId) => {
  if (wheelTimer) clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => {
    startGame(wheelId);
  }, 3 * 60 * 1000); // 3 minutes
};

exports.manualStart = async (wheelId) => {
  if (wheelTimer) clearTimeout(wheelTimer);
  await startGame(wheelId);
};
