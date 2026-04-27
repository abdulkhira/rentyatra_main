import { useState } from 'react';
import AdminSidebar from '../components/layout/AdminSidebar';
import AdminHeader from '../components/layout/AdminHeader';
import DashboardView from '../components/views/DashboardView';
import UserManagementView from '../components/views/UserManagementView';
import CategoryManagementView from '../components/views/CategoryManagementView';
import SubCategoryManagementView from '../components/views/SubCategoryManagementView';
import BannerManagementView from '../components/views/BannerManagementView';
import RentalListingManagementView from '../components/views/RentalListingManagementView';
import AdminProfileView from '../components/views/AdminProfileView';
import AdminSettingsView from '../components/views/AdminSettingsView';
import SubscriptionManagementView from '../components/views/SubscriptionManagementView';
import BoostManagementView from '../components/views/BoostManagementView';
import PaymentManagementView from '../components/views/PaymentManagementView';
import SupportManagementView from '../components/views/SupportManagementView';

// High-End placeholder component for future sections
function PlaceholderView({ title }) {
    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
                <p className="text-slate-500 font-medium">This module is currently under construction.</p>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-16 text-center flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-indigo-100">
                    <span className="text-4xl">🚧</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Under Development</h2>
                <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                    This feature is currently being crafted with care and will be available in an upcoming platform update.
                </p>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [activePage, setActivePage] = useState('Dashboard');

    const renderContent = () => {
        switch (activePage) {
            case 'Dashboard':
                return <DashboardView />;
            case 'Users':
                return <UserManagementView />;
            case 'Categories':
                return <CategoryManagementView />;
            case 'Sub Categories':
                return <SubCategoryManagementView />;
            case 'Rental listing':
                return <RentalListingManagementView />;
            case 'Subscriptions':
                return <SubscriptionManagementView />;
            case 'Boosts':
                return <BoostManagementView />;
            case 'Payments':
                return <PaymentManagementView />;
            case 'Ad Banners':
                return <BannerManagementView />;
            case 'Support':
                return <SupportManagementView />;
            case 'Profile':
                return <AdminProfileView />;
            case 'Settings':
                return <AdminSettingsView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="bg-[#F8FAFC] min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900">

            {/* Desktop Application Shell */}
            <div className="hidden md:block">

                {/* Fixed Sidebar */}
                <AdminSidebar activePage={activePage} setActivePage={setActivePage} />

                {/* Main Content Area */}
                <div className="ml-64 flex flex-col min-h-screen relative">

                    {/* Fixed Header */}
                    <AdminHeader pageTitle={activePage} setActivePage={setActivePage} />

                    {/* Dynamic View Injection (pt-20 clears the 80px / h-20 header) */}
                    <main className="flex-1 pt-20">
                        {renderContent()}
                    </main>

                </div>
            </div>

            {/* Premium Mobile Restrictor Message */}
            <div className="md:hidden flex items-center justify-center min-h-screen bg-[#F8FAFC] p-4">
                <div className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 text-center max-w-sm w-full animate-in zoom-in-95 duration-500">

                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
                        <span className="text-4xl filter drop-shadow-sm">💻</span>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Desktop Required</h1>

                    <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed">
                        The admin control panel is optimized for high-density data management and requires a larger display.
                    </p>

                    <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 text-left">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4">System Requirements</h2>
                        <ul className="text-sm font-bold text-slate-700 space-y-3">
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-sm shadow-indigo-200"></div>
                                Desktop or Laptop
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-sm shadow-indigo-200"></div>
                                Min. 1024px screen width
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-sm shadow-indigo-200"></div>
                                Modern web browser
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

        </div>
    );
}