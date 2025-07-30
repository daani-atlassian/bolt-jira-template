import React from 'react';
import { 
  FileText, 
  List, 
  Calendar, 
  BarChart3, 
  Plus, 
  Filter, 
  Users, 
  Share2, 
  MoreHorizontal,
  Settings,
  Search,
  ChevronDown,
  Megaphone
} from 'lucide-react';

const ProjectHeader: React.FC = () => {
  const tabs = [
    { icon: FileText, label: 'Summary', isActive: false },
    { icon: List, label: 'List', isActive: true },
    { icon: BarChart3, label: 'Timeline', isActive: false },
    { icon: Calendar, label: 'Calendar', isActive: false },
  ];

  const assignees = [
    { id: '1', avatar: 'https://images.pexels.com/photos/1462980/pexels-photo-1462980.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1', name: 'Fran Perez' },
    { id: '2', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1', name: 'Hassana Ajiyi' },
    { id: '3', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1', name: 'Andreas Ramos' },
    { id: '4', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1', name: 'Lydia Legume' },
    { id: '5', avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1', name: 'Maria Santos' },
  ];

  return (
    <div className="bg-white border-b border-[#dfe1e6]">


  
      {/* Tabs */}
      <div className="px-6 flex items-center justify-between">
        <div className="flex space-x-6">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`flex items-center space-x-2 px-1 py-3 text-sm font-medium transition-colors relative ${
                tab.isActive 
                  ? 'text-[#0052cc] border-b-2 border-[#0052cc]' 
                  : 'text-[#6b778c] hover:text-[#42526e]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
          <button className="p-2 rounded hover:bg-[#f1f2f4] transition-colors">
            <Plus className="w-4 h-4 text-[#6b778c]" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 flex items-center justify-between bg-[#fafbfc] border-t border-[#f1f2f4]">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b778c]" />
            <input
              type="text"
              placeholder=""
              className="w-64 pl-10 pr-4 py-2 bg-white border border-[#dfe1e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent"
            />
          </div>

          {/* Assignee Avatars */}
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-2">
              {assignees.map((assignee) => (
                <img
                  key={assignee.id}
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="w-8 h-8 rounded-full border-2 border-white hover:z-10 transition-all duration-200 cursor-pointer"
                />
              ))}
            </div>
            <button className="w-8 h-8 rounded-full border-2 border-dashed border-[#dfe1e6] flex items-center justify-center hover:border-[#0052cc] transition-colors">
              <Plus className="w-4 h-4 text-[#6b778c]" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-2 text-sm text-[#6b778c] hover:bg-[#f1f2f4] rounded transition-colors">
            <ChevronDown className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#0052cc] text-white rounded transition-colors hover:bg-[#0747a6]">
            <span>Group by: Assignee</span>
          </button>
          
          <button className="p-2 rounded hover:bg-[#f1f2f4] transition-colors">
            <Share2 className="w-4 h-4 text-[#6b778c]" />
          </button>
          
          <button className="p-2 rounded hover:bg-[#f1f2f4] transition-colors">
            <MoreHorizontal className="w-4 h-4 text-[#6b778c]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;