import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';

function AdminHeader({ pageTitle, setActivePage }) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, admin } = useAdminAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Clear any admin-specific data
      localStorage.removeItem('pendingAdmin');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if logout fails
      localStorage.removeItem('pendingAdmin');
      navigate('/admin/login');
    }
  };

  const handleProfileClick = () => {
    setActivePage('Profile');
    setDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    setActivePage('Settings');
    setDropdownOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm fixed top-0 left-64 right-0 z-20">
      <div className="flex items-center justify-between h-16 px-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-slate-800">{pageTitle}</h1>
        </div>
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!isDropdownOpen)} 
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          >
            <img 
              className="h-10 w-10 rounded-full object-cover border-2 border-indigo-200" 
              src={admin?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=6366F1&color=FFFFFF&size=40`}
              alt="Admin Avatar" 
              onError={(e) => {
                // Fallback to generated avatar if profile image fails to load
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=6366F1&color=FFFFFF&size=40`;
              }}
            />
            <span className="font-medium text-slate-700">{admin?.name || 'Admin User'}</span>
            <ChevronDown 
              className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 py-2 border border-slate-200">
              <button 
                onClick={handleProfileClick}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </button>
              <button 
                onClick={handleSettingsClick}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-slate-100 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
