import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 max-w-sm w-full mx-4">

          {/* Animated Icon Container */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm rounded-[1.5rem] flex items-center justify-center">
              <ShieldCheck className="absolute w-8 h-8 text-indigo-300 opacity-50" />
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          </div>

          {/* Typography */}
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Authenticating</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Securing Admin Session</p>
          </div>

        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;