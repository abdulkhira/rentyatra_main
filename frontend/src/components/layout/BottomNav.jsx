import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Plus, Package, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const tokens = {
  primary: '#FF5A1F',
  primaryDark: '#E04A10',
  primaryLight: '#FFF1EC',
  secondary: '#3D5AF1',
  secondaryLight: '#EEF1FF',
  success: '#16a34a',
  bg: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F9FB',
  text: '#1A1A2E',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  radius: '14px',
  radiusSm: '10px',
  radiusLg: '20px',
  shadow: '0 2px 12px rgba(0,0,0,0.07)',
  shadowMd: '0 4px 24px rgba(0,0,0,0.10)',
  shadowLg: '0 8px 40px rgba(0,0,0,0.13)',
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/dashboard/account') return location.pathname === '/dashboard/account';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path) => {
    if (loading) return;
    if (
      (path === '/post-ad' || path === '/dashboard' || path === '/dashboard/my-ads' || path === '/messages') &&
      !isAuthenticated
    ) {
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, path: '/messages' },
    { id: 'my-ads', label: 'My Rentals', icon: Package, path: '/dashboard/my-ads' },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      path: loading ? '#' : (isAuthenticated ? '/dashboard/account' : '/login'),
      disabled: loading,
    },
  ];

  return (
    <>
      {/* Background extension below nav for safe area */}
      <div
        className="bottom-nav-extension fixed left-0 right-0 bottom-0 md:hidden z-40"
        style={{ height: 40, backgroundColor: tokens.surface }}
      />

      {/* Bottom nav — 4 items, no center bump */}
      <nav
        className="bottom-nav fixed left-0 right-0 md:hidden z-50"
        style={{
          bottom: 40,
          background: tokens.surface,
          borderTop: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadowMd,
          borderRadius: '20px 20px 0 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: 64,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                disabled={item.disabled}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1,
                  transition: 'transform 0.1s',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onPointerDown={e => { if (!item.disabled) e.currentTarget.style.transform = 'scale(0.93)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Icon
                  size={20}
                  color={active ? tokens.primary : tokens.text}
                  strokeWidth={active ? 2.5 : 2}
                  style={{ transition: 'color 0.15s' }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: active ? tokens.primary : tokens.text,
                    transition: 'color 0.15s',
                    letterSpacing: '0.01em',
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button — bottom-right */}
      <div className='md:hidden'>
        <button
          onClick={() => handleNavClick('/post-ad')}
          className="md:hidden"
          style={{
            position: 'fixed',
            right: 20,
            bottom: 80,       /* sits above the nav bar */
            zIndex: 60,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: tokens.primary,
            border: 'none',
            boxShadow: `0 4px 20px rgba(255,90,31,0.45)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s, background 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.93)'; }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = tokens.primary; }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseEnter={e => { e.currentTarget.style.background = tokens.primaryDark; }}
          onMouseLeave={e => { e.currentTarget.style.background = tokens.primary; }}
          aria-label="Rent Out — post an ad"
        >
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

    </>
  );
};

export default BottomNav;