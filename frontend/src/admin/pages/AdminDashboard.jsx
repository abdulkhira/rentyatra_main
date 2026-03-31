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

// Simple placeholder component for other sections
function PlaceholderView({ title }) {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
                <p className="text-slate-600 mt-2">This section is coming soon...</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 text-center">
                <div className="text-6xl text-slate-300 mb-4">🚧</div>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">Under Development</h2>
                <p className="text-slate-500">This feature is currently being developed and will be available soon.</p>
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
        <div className="bg-slate-100 min-h-screen font-sans">
            {/* Desktop Only - No Mobile Support */}
            <div className="hidden md:block">
                {/* Desktop Sidebar */}
                <AdminSidebar activePage={activePage} setActivePage={setActivePage} />

                {/* Main Content Area */}
                <div className="ml-64 flex flex-col min-h-screen">
                    <AdminHeader pageTitle={activePage} setActivePage={setActivePage} />
                    <main className="flex-1 p-8 mt-16">
                        {renderContent()}
                    </main>
                </div>
            </div>

            {/* Mobile Not Supported Message */}
            <div className="md:hidden flex items-center justify-center min-h-screen bg-slate-100">
                <div className="text-center p-8 max-w-md">
                    <div className="text-6xl mb-6">💻</div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">Desktop Only</h1>
                    <p className="text-slate-600 mb-6">
                        The admin panel is designed for desktop use only. Please access it from a desktop or laptop computer for the best experience.
                    </p>
                    <div className="bg-white rounded-lg p-6 shadow-lg border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-700 mb-2">System Requirements</h2>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• Desktop or Laptop Computer</li>
                            <li>• Minimum 1024px screen width</li>
                            <li>• Modern web browser</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
