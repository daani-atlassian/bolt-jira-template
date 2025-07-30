import React from 'react';
import { 
  Search, 
  Plus, 
  Settings, 
  HelpCircle, 
  Bell, 
  Grid3X3,
  X
} from 'lucide-react';

const TopNavigation: React.FC = () => {
  return (
    <div className="h-14 bg-white border-b border-[#f1f2f4] flex items-center justify-between px-4">
      {/* Left Section - Logo and Apps */}
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded hover:bg-[#f1f2f4] transition-colors">
          <Grid3X3 className="w-5 h-5 text-[#6b778c]" />
        </button>
        <div className="flex items-center space-x-2">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpn2UjOI5jqytTO5sYPJMPQxtxwWOnNTgSfg&s" alt="Atlassian Logo" className="h-5" />
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b778c]" />
          <input
            type="text"
            placeholder="Search Atlassian"
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8f9] border border-[#dfe1e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent focus:bg-white"
          />
        </div>
      </div>

      {/* Right Section - Actions and Profile */}
      <div className="flex items-center space-x-2">
        
        <button className="p-2 rounded hover:bg-[#f1f2f4] transition-colors">
          <HelpCircle className="w-5 h-5 text-[#6b778c]" />
        </button>
        
        <button className="p-2 rounded hover:bg-[#f1f2f4] transition-colors">
          <Bell className="w-5 h-5 text-[#6b778c]" />
        </button>
        
        <button className="ml-2">
          <img
            src="https://images.pexels.com/photos/1462980/pexels-photo-1462980.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
            alt="User Avatar"
            className="w-8 h-8 rounded-full border-2 border-transparent hover:border-[#0052cc] transition-colors"
          />
        </button>
      </div>
    </div>
  );
};

export default TopNavigation;