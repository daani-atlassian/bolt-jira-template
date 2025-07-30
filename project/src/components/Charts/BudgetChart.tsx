import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { Issue } from '../../types';

interface BudgetChartProps {
  issues: Issue[];
}

const BudgetChart: React.FC<BudgetChartProps> = ({ issues }) => {
  const [viewMode, setViewMode] = useState<'distribution' | 'efficiency'>('distribution');

  // Calculate budget analytics
  const budgetData = useMemo(() => {
    const totalBudget = issues.reduce((sum, issue) => sum + (issue.budget || 0), 0);
    const completedBudget = issues
      .filter(issue => issue.status === 'DONE')
      .reduce((sum, issue) => sum + (issue.budget || 0), 0);
    const inProgressBudget = issues
      .filter(issue => issue.status === 'IN PROGRESS')
      .reduce((sum, issue) => sum + (issue.budget || 0), 0);
    const todoBudget = issues
      .filter(issue => issue.status === 'TO DO')
      .reduce((sum, issue) => sum + (issue.budget || 0), 0);

    // Budget by assignee
    const assigneeBudgets = issues.reduce((acc, issue) => {
      const assigneeId = issue.assignee.id;
      if (!acc[assigneeId]) {
        acc[assigneeId] = {
          assignee: issue.assignee,
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0
        };
      }
      const budget = issue.budget || 0;
      acc[assigneeId].total += budget;
      
      if (issue.status === 'DONE') acc[assigneeId].completed += budget;
      else if (issue.status === 'IN PROGRESS') acc[assigneeId].inProgress += budget;
      else acc[assigneeId].todo += budget;
      
      return acc;
    }, {} as Record<string, any>);

    // Budget efficiency (actual hours vs budget allocation)
    const budgetEfficiency = issues
      .filter(issue => issue.budget && issue.timeSpent)
      .map(issue => {
        const hourlyRate = 50; // Assume $50/hour
        const budgetedHours = issue.budget / hourlyRate;
        const efficiency = budgetedHours > 0 ? (issue.timeSpent / budgetedHours) * 100 : 0;
        return {
          issue,
          efficiency,
          budgetedHours,
          actualHours: issue.timeSpent,
          variance: (issue.timeSpent - budgetedHours) * hourlyRate
        };
      });

    return {
      totalBudget,
      completedBudget,
      inProgressBudget,
      todoBudget,
      assigneeBudgets: Object.values(assigneeBudgets),
      budgetEfficiency,
      completionRate: totalBudget > 0 ? (completedBudget / totalBudget) * 100 : 0
    };
  }, [issues]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (budgetData.totalBudget === 0) {
    return (
      <div className="w-full text-center py-6">
        <DollarSign className="w-8 h-8 mx-auto mb-2 text-[#6b778c] opacity-50" />
        <div className="text-sm text-[#42526e]">No budget allocated</div>
        <div className="text-xs text-[#6b778c]">Add budget information to track spending</div>
      </div>
    );
  }

  // Create pie chart for status distribution
  const createStatusPieChart = () => {
    const centerX = 35;
    const centerY = 35;
    const radius = 28;
    
    const total = budgetData.totalBudget;
    if (total === 0) return [];
    
    const segments = [
      { value: budgetData.completedBudget, color: '#00875a', label: 'Done' },
      { value: budgetData.inProgressBudget, color: '#0052cc', label: 'In Progress' },
      { value: budgetData.todoBudget, color: '#8993a4', label: 'To Do' }
    ].filter(segment => segment.value > 0);
    
    let currentAngle = -90; // Start from top
    
    return segments.map((segment, index) => {
      const percentage = segment.value / total;
      const angle = percentage * 360;
      
      const startAngleRad = (currentAngle * Math.PI) / 180;
      const endAngleRad = ((currentAngle + angle) * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const path = (
        <path
          key={index}
          d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
          fill={segment.color}
          className="transition-all duration-300 hover:opacity-80"
        />
      );
      
      currentAngle += angle;
      return { path, segment, percentage };
    });
  };

  const statusPieSegments = createStatusPieChart();

  return (
    <div className="w-full space-y-4">
      {/* View Mode Toggle */}
      <div className="flex space-x-1 bg-[#f1f2f4] p-1 rounded">
        <button
          onClick={() => setViewMode('distribution')}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            viewMode === 'distribution'
              ? 'bg-white text-[#0052cc] shadow-sm'
              : 'text-[#6b778c] hover:text-[#42526e]'
          }`}
        >
          Distribution
        </button>
        <button
          onClick={() => setViewMode('efficiency')}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            viewMode === 'efficiency'
              ? 'bg-white text-[#0052cc] shadow-sm'
              : 'text-[#6b778c] hover:text-[#42526e]'
          }`}
        >
          Efficiency
        </button>
      </div>

      {viewMode === 'distribution' ? (
        <div className="space-y-3">
          {/* Unified Status Distribution with Pie Chart */}
          <div className="flex items-center space-x-4">
            {/* Pie Chart */}
            <div className="flex-shrink-0">
              <svg width="70" height="70" viewBox="0 0 70 70">
                {statusPieSegments.map(item => item.path)}
                {/* Center circle for donut effect */}
                <circle cx="35" cy="35" r="18" fill="white" />
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {statusPieSegments.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.segment.color }}
                    ></div>
                    <span className="text-xs text-[#6b778c]">{item.segment.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-[#42526e]">
                      {formatCurrency(item.segment.value)}
                    </div>
                    <div className="text-xs text-[#6b778c]">
                      {Math.round(item.percentage * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignee Distribution */}
          <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
            <div className="text-xs font-semibold text-[#172b4d]">Budget by Assignee</div>
            <div className="space-y-1 max-h-28 overflow-y-auto hide-scrollbar">
              {budgetData.assigneeBudgets
                .sort((a, b) => b.total - a.total)
                .map((item: any, index: number) => (
                  <div key={item.assignee.id} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={item.assignee.avatar}
                          alt={item.assignee.name}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-xs text-[#42526e] font-medium truncate max-w-20">
                          {item.assignee.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-[#42526e]">
                          {formatCurrency(item.total)}
                        </div>
                        <div className="text-xs text-[#6b778c]">
                          {Math.round((item.total / budgetData.totalBudget) * 100)}% of total
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Efficiency Explanation */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#172b4d]">Budget Efficiency</div>
            <div className="bg-[#fafbfc] p-2 rounded border border-[#f1f2f4]">
              <div className="text-xs text-[#42526e] leading-relaxed">
                Efficiency measures how well budget is used compared to time spent. 
                Based on $50/hour rate: <span className="font-medium text-[#00875a]">Green = under budget</span>, 
                <span className="font-medium text-[#ffab00]"> Yellow = near budget</span>, 
                <span className="font-medium text-[#de350b]"> Red = over budget</span>.
              </div>
            </div>
          </div>

          {/* Efficiency Overview Chart */}
          {budgetData.budgetEfficiency.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#172b4d]">Efficiency Overview</div>
              <div className="flex items-center space-x-4">
                {/* Pie Chart for Efficiency Categories */}
                <div className="flex-shrink-0">
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    {(() => {
                      const efficiencyCategories = budgetData.budgetEfficiency.reduce((acc, item) => {
                        const category = item.efficiency > 120 ? 'over' : 
                                       item.efficiency > 100 ? 'near' : 'under';
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const total = budgetData.budgetEfficiency.length;
                      const segments = [
                        { value: efficiencyCategories.under || 0, color: '#00875a', label: 'Under budget' },
                        { value: efficiencyCategories.near || 0, color: '#ffab00', label: 'Near budget' },
                        { value: efficiencyCategories.over || 0, color: '#de350b', label: 'Over budget' }
                      ].filter(segment => segment.value > 0);
                      
                      let currentAngle = -90;
                      
                      return segments.map((segment, index) => {
                        const percentage = segment.value / total;
                        const angle = percentage * 360;
                        
                        const startAngleRad = (currentAngle * Math.PI) / 180;
                        const endAngleRad = ((currentAngle + angle) * Math.PI) / 180;
                        
                        const x1 = 35 + 28 * Math.cos(startAngleRad);
                        const y1 = 35 + 28 * Math.sin(startAngleRad);
                        const x2 = 35 + 28 * Math.cos(endAngleRad);
                        const y2 = 35 + 28 * Math.sin(endAngleRad);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        const path = (
                          <path
                            key={index}
                            d={`M 35 35 L ${x1} ${y1} A 28 28 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={segment.color}
                            className="transition-all duration-300 hover:opacity-80"
                          />
                        );
                        
                        currentAngle += angle;
                        return path;
                      });
                    })()}
                    {/* Center circle for donut effect */}
                    <circle cx="35" cy="35" r="18" fill="white" />
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {(() => {
                    const efficiencyCategories = budgetData.budgetEfficiency.reduce((acc, item) => {
                      const category = item.efficiency > 120 ? 'over' : 
                                     item.efficiency > 100 ? 'near' : 'under';
                      acc[category] = (acc[category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    
                    const total = budgetData.budgetEfficiency.length;
                    const segments = [
                      { value: efficiencyCategories.under || 0, color: '#00875a', label: 'Under budget' },
                      { value: efficiencyCategories.near || 0, color: '#ffab00', label: 'Near budget' },
                      { value: efficiencyCategories.over || 0, color: '#de350b', label: 'Over budget' }
                    ].filter(segment => segment.value > 0);
                    
                    return segments.map((segment, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          ></div>
                          <span className="text-xs text-[#6b778c]">{segment.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-[#42526e]">
                            {segment.value} items
                          </div>
                          <div className="text-xs text-[#6b778c]">
                            {Math.round((segment.value / total) * 100)}%
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Budget Efficiency */}
          <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
            <div className="text-xs font-semibold text-[#172b4d]">Item Details</div>
            {budgetData.budgetEfficiency.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto hide-scrollbar">
                {budgetData.budgetEfficiency
                  .sort((a, b) => b.efficiency - a.efficiency)
                  .slice(0, 8)
                  .map((item, index) => (
                    <div key={item.issue.id} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            item.efficiency > 120 ? 'bg-[#de350b]' :
                            item.efficiency > 100 ? 'bg-[#ffab00]' :
                            'bg-[#00875a]'
                          }`}></div>
                          <span className="text-xs font-mono text-[#42526e] font-medium">{item.issue.key}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-[#42526e]">
                            {Math.round(item.efficiency)}% efficient
                          </div>
                          <div className="text-xs text-[#6b778c]">
                            {formatCurrency(Math.abs(item.variance))} {item.variance > 0 ? 'over' : 'under'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-[#ffab00]" />
                <div className="text-xs text-[#6b778c]">No time tracking data</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetChart;