import React from 'react';
import { 
  Briefcase, 
  Clock, 
  Star, 
  Grid3X3, 
  Target, 
  FileText, 
  Layers, 
  FolderOpen, 
  Filter, 
  BarChart3, 
  Users, 
  Settings,
  ChevronRight
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const menuItems = [
    { icon: Briefcase, label: 'Your work', hasSubmenu: true },
    { icon: Clock, label: 'Recent', hasSubmenu: true },
    { icon: Star, label: 'Starred', hasSubmenu: true },
    { icon: Grid3X3, label: 'Apps', hasSubmenu: false },
    { icon: Target, label: 'Goals', hasSubmenu: false },
    { 
      icon: FileText, 
      label: 'Plans', 
      hasSubmenu: false,
      isActive: true,
      subItems: [
        { label: 'Marketing Campaign', isActive: true },
        { label: 'View all plans', isActive: false }
      ]
    },
    { icon: Layers, label: 'Spaces', hasSubmenu: false },
    { icon: FolderOpen, label: 'Projects', hasSubmenu: false },
    { icon: Filter, label: 'Filters', hasSubmenu: false },
    { icon: BarChart3, label: 'Dashboards', hasSubmenu: false },
    { icon: Users, label: 'Teams', hasSubmenu: false },
    { icon: Settings, label: 'Customize sidebar', hasSubmenu: false },
  ];

  return (
    <div className="w-64 bg-[#f7f8f9] border-r border-[#dfe1e6] h-[calc(100vh-56px)] overflow-y-auto">
      <div className="p-4 space-y-1">
        {menuItems.map((item, index) => (
          <div key={index}>
            {/* Main Menu Item */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              item.isActive 
                ? 'bg-[#e9f2ff] text-[#0052cc] border-l-4 border-[#0052cc] ml-0 pl-2' 
                : 'hover:bg-[#f1f2f4] text-[#42526e]'
            }`}>
              <div className="flex items-center space-x-3">
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.hasSubmenu && (
                <ChevronRight className="w-3 h-3 text-[#6b778c]" />
              )}
            </div>

            {/* Sub Items */}
            {item.subItems && (
              <div className="ml-7 mt-1 space-y-1">
                {item.subItems.map((subItem, subIndex) => (
                  <div
                    key={subIndex}
                    className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      subItem.isActive 
                        ? 'bg-[#e9f2ff] text-[#0052cc] font-medium' 
                        : 'hover:bg-[#f1f2f4] text-[#6b778c]'
                    }`}
                  >
                    <span className="text-sm">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;