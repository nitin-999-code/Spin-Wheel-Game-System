import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Trophy, Skull, Users, ArrowLeft } from 'lucide-react';

const WheelGame = () => {
  const { user, fetchProfile } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [wheel, setWheel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveWheel();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('user_eliminated', ({ userId }) => {
        setWheel(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          updated.participants = updated.participants.map(p => 
            (p.user._id === userId || p.user === userId) ? { ...p, isEliminated: true } : p
          );
          return updated;
        });
      });
      
      socket.on('wheel_completed', ({ wheel: completedWheel }) => {
        setWheel(completedWheel);
        fetchProfile();
        // Keep result visible for 15 seconds before redirecting
        setTimeout(() => {
          navigate('/');
        }, 15000);
      });
      
      socket.on('wheel_aborted', () => {
        navigate('/');
        fetchProfile();
      });
    }

    return () => {
      if (socket) {
        socket.off('user_eliminated');
        socket.off('wheel_completed');
        socket.off('wheel_aborted');
      }
    };
  }, [socket, navigate]);

  async function fetchActiveWheel() {
    try {
      const res = await api.get('/api/wheels/active');
      if (!res.data.wheel) {
        navigate('/');
        return;
      }
      setWheel(res.data.wheel);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !wheel) return <div className="text-center mt-10">Loading Game...</div>;

  const activeCount = wheel.participants.filter(p => !p.isEliminated).length;

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="bg-gray-900 p-6 border-b border-gray-700 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
          
          {wheel.status === 'completed' ? (
            <div className="animate-fade-in">
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
              <div className="inline-block px-6 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-xl font-bold">
                Winner: {wheel.winner?.username || 'Unknown'}
              </div>
            </div>
          ) : (
            <div>
              <div className="w-32 h-32 mx-auto rounded-full border-4 border-emerald-500 flex items-center justify-center relative mb-4 animate-spin-slow">
                <div className="absolute inset-0 rounded-full border-t-4 border-yellow-400 animate-spin"></div>
                <div className="text-2xl font-bold text-white bg-gray-900 w-24 h-24 rounded-full flex items-center justify-center z-10">
                  {activeCount}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-widest uppercase mb-1">
                Spinning...
              </h2>
              <p className="text-emerald-400 font-mono">Eliminating 1 player every 7s</p>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              Arena ({activeCount} Remaining)
            </h3>
            <div className="text-yellow-400 font-bold bg-yellow-400/10 px-4 py-2 rounded border border-yellow-400/20">
              Prize Pool: {wheel.totalPool}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wheel.participants.map((p, idx) => {
              const isEliminated = p.isEliminated;
              const isWinner = wheel.status === 'completed' && wheel.winner?._id === p.user._id;
              
              return (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-500 flex flex-col items-center justify-center text-center h-32 ${
                    isWinner 
                      ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-105 z-10' 
                      : isEliminated 
                        ? 'bg-red-900/30 border-red-900/50 opacity-50 grayscale' 
                        : 'bg-gray-700 border-gray-600 hover:border-emerald-500/50'
                  }`}
                >
                  {isWinner && <Trophy className="absolute top-2 right-2 w-4 h-4 text-yellow-400" />}
                  {isEliminated && <Skull className="absolute top-2 right-2 w-4 h-4 text-red-500" />}
                  
                  <div className={`font-bold text-lg mb-1 truncate w-full px-2 ${
                    isWinner ? 'text-yellow-400' : isEliminated ? 'text-gray-500' : 'text-white'
                  }`}>
                    {p.user.username}
                  </div>
                  
                  <div className="text-xs">
                    {p.user._id === user.id && (
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">You</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelGame;
