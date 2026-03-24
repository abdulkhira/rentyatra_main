import { 
  Home, 
  Users, 
  Package, 
  Tag, 
  CreditCard, 
  Zap, 
  DollarSign, 
  Image, 
  Settings,
  FileText,
  HelpCircle
} from 'lucide-react';

function AdminSidebar({ activePage, setActivePage }) {
  const navItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Users', icon: Users },
    { name: 'Products', icon: Package },
    { name: 'Categories', icon: Tag },
    { name: 'Rental listing', icon: FileText },
    { name: 'Subscriptions', icon: CreditCard },
    { name: 'Boosts', icon: Zap },
    { name: 'Payments', icon: DollarSign },
    { name: 'Ad Banners', icon: Image },
    { name: 'Support', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-col fixed inset-y-0 left-0 z-30 flex">
      <div className="flex items-center justify-center h-20 border-b border-slate-800">
        <Package className="h-8 w-8 text-indigo-400" />
        <span className="text-2xl font-bold ml-2 text-white">RentYatra</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-500 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
