import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Car, User, LogOut, LayoutDashboard, Settings, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">DriveEase</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Browse Cars</Link>
            {user && (
              <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">My Bookings</Link>
            )}
            {(profile?.is_admin || user?.email === 'hridoyhs369@gmail.com') && (
              <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                <Settings className="h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors hidden md:block"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors hidden md:block"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?signup=true"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm hidden md:block"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition-all"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Quick Navigation (Always visible on mobile) */}
      <div className="md:hidden border-t border-gray-50 bg-white/80 backdrop-blur-md overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-around px-2 py-3 min-w-max">
          <Link 
            to="/" 
            className="flex flex-col items-center px-4 space-y-1"
          >
            <Car className="h-5 w-5 text-indigo-600" />
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Browse</span>
          </Link>
          
          {user && (
            <Link 
              to="/dashboard" 
              className="flex flex-col items-center px-4 space-y-1"
            >
              <LayoutDashboard className="h-5 w-5 text-indigo-600" />
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Bookings</span>
            </Link>
          )}
          
          {(profile?.is_admin || user?.email === 'hridoyhs369@gmail.com') && (
            <Link 
              to="/admin" 
              className="flex flex-col items-center px-4 space-y-1"
            >
              <Settings className="h-5 w-5 text-indigo-600" />
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Admin</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu (Drawer for Sign Out / Auth) */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-4 text-base font-bold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            >
              Browse Cars
            </Link>
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-bold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              >
                My Bookings
              </Link>
            )}
            {(profile?.is_admin || user?.email === 'hridoyhs369@gmail.com') && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-bold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center"
              >
                <Settings className="h-5 w-5 mr-2" />
                Admin Panel
              </Link>
            )}
            
            <div className="pt-4 mt-4 border-t border-gray-100">
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-4 text-base font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center px-4 py-3 text-sm font-bold text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login?signup=true"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
