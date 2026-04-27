import React from 'react';
import {
  LayoutGrid, Users, PackageOpen, Tags, CreditCard,
  Zap, BarChart3, Image as ImageIcon, FileText,
  LifeBuoy, Search, ChevronsUpDown, Sparkles, Bell
} from 'lucide-react';

// Extracted outside the component to prevent recreation on every render
const navGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', icon: LayoutGrid }
    ]
  },
  {
    title: 'Directory',
    items: [
      { name: 'Users', icon: Users },
      { name: 'Categories', icon: PackageOpen },
      { name: 'Sub Categories', icon: Tags },
      { name: 'Rental listing', icon: FileText },
    ]
  },
  {
    title: 'Monetization',
    items: [
      { name: 'Subscriptions', icon: CreditCard },
      { name: 'Boosts', icon: Zap, isPro: true },
      { name: 'Ad Banners', icon: ImageIcon },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Support', icon: LifeBuoy },
    ]
  }
];

function AdminSidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-64 bg-[#09090b] text-zinc-400 flex flex-col fixed inset-y-0 left-0 z-40 border-r border-zinc-800/60 font-sans selection:bg-blue-500/30">

      {/* Brand & Workspace Selector */}
      <div className="h-20 flex items-center px-4 border-b border-zinc-800/60 shrink-0">
        <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20 border border-blue-400/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl font-semibold text-zinc-100 tracking-tight">RentYatra</span>
              <span className="text-[12px] text-zinc-500 font-medium">Production</span>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </button>
      </div>

      {/* Global Search / Command Palette Trigger */}
      {/* Navigation Scroll Area */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto scrollbar-hide pb-4">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {/* Group Label */}
            <h3 className="px-3 text-[14px] font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              {group.title}
            </h3>

            {/* Group Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => setActivePage(item.name)}
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-md transition-all duration-150 ${isActive
                      ? 'bg-zinc-800/80 text-zinc-100 shadow-sm'
                      : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-400'
                        }`} />
                      <span className={`text-[16px] ${isActive ? 'font-medium' : 'font-normal'}`}>
                        {item.name}
                      </span>
                    </div>

                    {/* Right Side Accessories (Badges / Pro Tags) */}
                    <div className="flex items-center gap-2">
                      {item.isPro && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Pro
                        </span>
                      )}
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isActive
                          ? 'bg-zinc-700 text-zinc-100'
                          : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'
                          }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;