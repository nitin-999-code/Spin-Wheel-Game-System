import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Coins, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-gray-800 p-4 border-b border-gray-700 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-emerald-400 tracking-wider">ROXSTAR SPIN</Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-mono text-yellow-400 font-bold">{user.coins.toLocaleString()}</span>
          </div>
          <span className="text-gray-300">
            {user.username} <span className="text-xs bg-gray-700 px-2 py-0.5 rounded ml-1">{user.role}</span>
          </span>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
