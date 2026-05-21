import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Play, Users, Clock, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { user, fetchProfile } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [activeWheel, setActiveWheel] = useState(null);
  const [latestWheel, setLatestWheel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveWheel();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('wheel_created', ({ wheel }) => setActiveWheel(wheel));
      socket.on('user_joined', ({ wheel }) => setActiveWheel(wheel));
      socket.on('wheel_started', () => {
        navigate('/wheel');
      });
      socket.on('wheel_completed', () => {
        fetchActiveWheel();
        fetchLatestWheel();
      });
      socket.on('wheel_aborted', fetchActiveWheel);
      socket.on('coins_updated', () => fetchProfile());
    }
    
    return () => {
      if (socket) {
        socket.off('wheel_created');
        socket.off('user_joined');
        socket.off('wheel_started');
        socket.off('wheel_completed');
        socket.off('wheel_aborted');
        socket.off('coins_updated');
      }
    };
  }, [socket, navigate, fetchProfile]);

  async function fetchActiveWheel() {
    try {
      setLoading(true);
      const res = await api.get('/api/wheels/active');
      setActiveWheel(res.data.wheel);
      
      if (res.data.wheel && res.data.wheel.status === 'active') {
        navigate('/wheel');
      } else if (!res.data.wheel) {
        await fetchLatestWheel();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function fetchLatestWheel() {
    try {
      const res = await api.get('/api/wheels/latest');
      setLatestWheel(res.data.wheel);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWheel = async () => {
    setError('');
    try {
      await api.post('/api/wheels');
      await fetchActiveWheel();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create wheel');
    }
  };

  const handleJoinWheel = async () => {
    setError('');
    try {
      await api.post(`/api/wheels/${activeWheel._id}/join`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join wheel');
    }
  };

  const handleManualStart = async () => {
    setError('');
    try {
      await api.post(`/api/wheels/${activeWheel._id}/start`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start wheel');
    }
  };

  if (loading) return <div className="text-center mt-10">Loading Dashboard...</div>;

  const hasJoined = activeWheel?.participants?.some(p => p.user?._id === user.id || p.user === user.id);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}
      
      {user.role === 'admin' && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Admin Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={handleCreateWheel}
              disabled={!!activeWheel}
              className={`px-6 py-3 rounded font-bold transition-all ${
                activeWheel 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              }`}
            >
              Create New Wheel Game
            </button>
            {activeWheel && activeWheel.status === 'pending' && (
              <button
                onClick={handleManualStart}
                className="px-6 py-3 rounded font-bold bg-yellow-500 hover:bg-yellow-600 text-gray-900 transition-all shadow-[0_0_15px_rgba(234,179,8,0.4)]"
              >
                Force Start Now
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-400" />
            Active Game
          </h2>
          {activeWheel && activeWheel.status === 'pending' && (
             <span className="flex items-center gap-1 text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
               <Clock className="w-4 h-4" />
               Waiting for players
             </span>
          )}
        </div>
        
        <div className="p-6">
          {!activeWheel ? (
            <div className="text-center py-10 text-gray-500">
              <div className="inline-block p-4 rounded-full bg-gray-900 mb-4">
                <Clock className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-lg">No active wheel game at the moment.</p>
              <p className="text-sm mt-2">Wait for an admin to start a new game.</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-center">
                  <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Status</div>
                  <div className="text-xl font-bold text-emerald-400 capitalize">{activeWheel.status}</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-center">
                  <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Prize Pool</div>
                  <div className="text-xl font-bold text-yellow-400">{activeWheel.totalPool} Coins</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-center">
                  <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Players</div>
                  <div className="text-xl font-bold text-blue-400">{activeWheel.participants?.length || 0} / Min 3</div>
                </div>
              </div>
              
              {activeWheel.status === 'pending' && user.role !== 'admin' && (
                <div className="text-center">
                  {!hasJoined ? (
                    <button
                      onClick={handleJoinWheel}
                      className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] transform hover:scale-105"
                    >
                      Join Game (100 Coins)
                    </button>
                  ) : (
                    <div className="inline-block px-8 py-4 bg-gray-900 border border-emerald-500/50 rounded-lg text-emerald-400 font-medium">
                      You have joined! Waiting for game to start...
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-300">
                  <Users className="w-5 h-5" />
                  Participants ({activeWheel.participants?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeWheel.participants?.map((p, idx) => (
                    <div key={idx} className="bg-gray-700 px-3 py-1 rounded text-sm text-gray-200 border border-gray-600">
                      {p.user?.username || 'Player'} {p.user?._id === user.id && '(You)'}
                    </div>
                  ))}
                  {(!activeWheel.participants || activeWheel.participants.length === 0) && (
                    <div className="text-gray-500 italic text-sm">No players yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!activeWheel && latestWheel && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl mt-8">
          <div className="bg-gray-900 p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-yellow-400">Last Game Result</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-yellow-500/20 p-4 rounded-full border border-yellow-500/50">
                <Play className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <div className="text-gray-400 text-sm">Winner</div>
                <div className="text-2xl font-bold text-white">{latestWheel.winner?.username || 'Unknown'}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-gray-400 text-sm">Prize Pool</div>
                <div className="text-2xl font-bold text-emerald-400">{latestWheel.totalPool} Coins</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total Players: {latestWheel.participants?.length || 0}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
