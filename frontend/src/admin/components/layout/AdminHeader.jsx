import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { ChevronDown, LogOut, User, Settings, Bell } from 'lucide-react';

function AdminHeader({ pageTitle, setActivePage }) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout, admin } = useAdminAuth();

  // Modern outside-click handler (better than onBlur with timeouts)
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('pendingAdmin');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('pendingAdmin');
      navigate('/admin/login');
    }
  };

  const handleNavClick = (page) => {
    setActivePage(page);
    setDropdownOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 fixed top-0 left-64 right-0 z-30 transition-all font-sans">
      {/* Reduced height from h-20 to h-16 to match the modern, tighter sidebar header */}
      <div className="flex items-center justify-between h-16 px-6 lg:px-8">

        {/* Page Title / Breadcrumb style */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-500 hidden sm:block">Overview</span>
          <span className="text-sm text-zinc-400 hidden sm:block">/</span>
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">{pageTitle}</h1>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-4">

          {/* Subtle Notification Bell */}
          <button className="relative p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 border-2 border-white rounded-full"></span>
          </button>

          <div className="h-4 w-px bg-zinc-200 hidden sm:block"></div>

          {/* User Dropdown Wrapper */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1 pr-2 rounded-md hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <div className="relative">
                <img
                  className="h-8 w-8 rounded-full object-cover border border-zinc-200 bg-zinc-50"
                  src={admin?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=09090b&color=ffffff&size=32&bold=true`}
                  alt="Admin Avatar"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=09090b&color=ffffff&size=32&bold=true`;
                  }}
                />
                {/* Minimalist online indicator */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <div className="flex-col items-start hidden md:flex">
                <span className="text-sm font-medium text-zinc-900 leading-none">
                  {admin?.name || 'Admin User'}
                </span>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-40 animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right">

                {/* Context Header */}
                <div className="px-4 py-2.5 mb-1 border-b border-zinc-100">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-0.5">Account</p>
                  <p className="text-sm font-medium text-zinc-900 truncate">{admin?.email || 'admin@rentyatra.com'}</p>
                </div>

                {/* Menu Items */}
                <div className="px-1 py-1">
                  <button
                    onClick={() => handleNavClick('Profile')}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  >
                    <User className="h-4 w-4 text-zinc-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => handleNavClick('Settings')}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-zinc-400" />
                    Settings
                  </button>
                </div>

                <div className="h-px bg-zinc-100 my-1"></div>

                <div className="px-1 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;