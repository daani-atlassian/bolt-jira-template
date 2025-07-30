import React, { useState, useMemo } from 'react';
import { Calendar, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Issue } from '../../types';

interface SlippageChartProps {
  issues: Issue[];
}

const SlippageChart: React.FC<SlippageChartProps> = ({ issues }) => {
  const [viewMode, setViewMode] = useState<'analysis' | 'trends'>('analysis');

  // Calculate slippage analytics
  const slippageData = useMemo(() => {
    const completedIssues = issues.filter(issue => issue.actualDueDate);
    
    if (completedIssues.length === 0) {
      return {
        hasData: false,
        avgSlippage: 0,
        totalVariance: 0,
        slippageItems: [],
        categories: {
          early: { count: 0, avgDays: 0, items: [] },
          onTime: { count: 0, avgDays: 0, items: [] },
          late: { count: 0, avgDays: 0, items: [] }
        },
        assigneeSlippage: [],
        riskFactors: []
      };
    }

    const slippageItems = completedIssues.map(issue => {
      const target = new Date(issue.targetDate);
      const actual = new Date(issue.actualDueDate);
      const planned = new Date(issue.dueDate);
      const projectStart = new Date(issue.startDate);
      
      const slippageDays = Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
      const projectDuration = Math.ceil((target.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
      const slippagePercentage = projectDuration > 0 ? (slippageDays / projectDuration) * 100 : 0;
      
      const category = slippageDays < 0 ? 'early' : 
                      slippageDays === 0 ? 'onTime' : 'late';

      return {
        issue,
        slippageDays,
        slippagePercentage,
        category,
        projectDuration,
        isDelayed: slippageDays > 0,
        severity: slippageDays <= 0 ? 'good' :
                 slippageDays <= 3 ? 'moderate' : 'severe'
      };
    });

    // Group by category
    const categories = slippageItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, totalDays: 0, items: [] };
      }
      acc[item.category].count++;
      acc[item.category].totalDays += Math.abs(item.slippageDays);
      acc[item.category].items.push(item);
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages for each category
    Object.keys(categories).forEach(category => {
      categories[category].avgDays = categories[category].count > 0 
        ? categories[category].totalDays / categories[category].count 
        : 0;
    });

    // Slippage by assignee
    const assigneeSlippage = completedIssues.reduce((acc, issue) => {
      const assigneeId = issue.assignee.id;
      if (!acc[assigneeId]) {
        acc[assigneeId] = {
          assignee: issue.assignee,
          totalSlippage: 0,
          completedCount: 0,
          issues: []
        };
      }
      
      const target = new Date(issue.targetDate);
      const actual = new Date(issue.actualDueDate);
      const slippageDays = Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
      
      acc[assigneeId].totalSlippage += slippageDays;
      acc[assigneeId].completedCount++;
      acc[assigneeId].issues.push(issue);
      return acc;
    }, {} as Record<string, any>);

    // Calculate average slippage per assignee
    Object.values(assigneeSlippage).forEach((person: any) => {
      person.avgSlippage = person.completedCount > 0 ? person.totalSlippage / person.completedCount : 0;
    });

    // Overall metrics
    const totalSlippage = slippageItems.reduce((sum, item) => sum + item.slippageDays, 0);
    const avgSlippage = completedIssues.length > 0 ? totalSlippage / completedIssues.length : 0;
    
    // Risk factors analysis
    const riskFactors = [];
    const lateItems = slippageItems.filter(item => item.slippageDays > 0);
    
    if (lateItems.length > completedIssues.length * 0.3) {
      riskFactors.push({
        type: 'schedule',
        message: `${Math.round((lateItems.length / completedIssues.length) * 100)}% of items delivered late`,
        severity: 'high'
      });
    }
    
    const severeSlippage = slippageItems.filter(item => item.slippageDays > 7);
    if (severeSlippage.length > 0) {
      riskFactors.push({
        type: 'planning',
        message: `${severeSlippage.length} items with >7 days slippage`,
        severity: 'high'
      });
    }

    return {
      hasData: true,
      avgSlippage,
      totalVariance: Math.abs(totalSlippage),
      slippageItems,
      categories,
      assigneeSlippage: Object.values(assigneeSlippage),
      riskFactors,
      onTimeDeliveryRate: ((categories.early?.count || 0) + (categories.onTime?.count || 0)) / completedIssues.length * 100
    };
  }, [issues]);

  if (!slippageData.hasData) {
    return (
      <div className="w-full text-center py-6">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-[#6b778c] opacity-50" />
        <div className="text-sm text-[#42526e]">No completed items</div>
        <div className="text-xs text-[#6b778c]">Complete items to track delivery slippage</div>
      </div>
    );
  }

  // Create unified slippage pie chart
  const createSlippagePieChart = () => {
    const centerX = 35;
    const centerY = 35;
    const radius = 28;
    
    const total = slippageData.slippageItems.length;
    if (total === 0) return [];
    
    const segments = [
      { value: slippageData.categories.early?.count || 0, color: '#00875a', label: 'Early' },
      { value: slippageData.categories.onTime?.count || 0, color: '#0052cc', label: 'On Time' },
      { value: slippageData.categories.late?.count || 0, color: '#de350b', label: 'Late' }
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

  const slippagePieSegments = createSlippagePieChart();

  return (
    <div className="w-full space-y-4">
      {/* View Mode Toggle */}
      <div className="flex space-x-1 bg-[#f1f2f4] p-1 rounded">
        <button
          onClick={() => setViewMode('analysis')}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            viewMode === 'analysis'
              ? 'bg-white text-[#0052cc] shadow-sm'
              : 'text-[#6b778c] hover:text-[#42526e]'
          }`}
        >
          Analysis
        </button>
        <button
          onClick={() => setViewMode('trends')}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            viewMode === 'trends'
              ? 'bg-white text-[#0052cc] shadow-sm'
              : 'text-[#6b778c] hover:text-[#42526e]'
          }`}
        >
          Trends
        </button>
      </div>

      {viewMode === 'analysis' ? (
        <div className="space-y-3">
          {/* Unified Delivery Performance with Pie Chart */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#172b4d]">Delivery Performance</div>
            <div className="flex items-center space-x-4">
              {/* Pie Chart */}
              <div className="flex-shrink-0">
                <svg width="70" height="70" viewBox="0 0 70 70">
                  {slippagePieSegments.map(item => item.path)}
                  {/* Center circle for donut effect */}
                  <circle cx="35" cy="35" r="18" fill="white" />
                </svg>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2">
                {[
                  { segment: { value: slippageData.categories.early?.count || 0, color: '#00875a', label: 'Early' }, percentage: slippageData.slippageItems.length > 0 ? (slippageData.categories.early?.count || 0) / slippageData.slippageItems.length : 0 },
                  { segment: { value: slippageData.categories.onTime?.count || 0, color: '#0052cc', label: 'On Time' }, percentage: slippageData.slippageItems.length > 0 ? (slippageData.categories.onTime?.count || 0) / slippageData.slippageItems.length : 0 },
                  { segment: { value: slippageData.categories.late?.count || 0, color: '#de350b', label: 'Late' }, percentage: slippageData.slippageItems.length > 0 ? (slippageData.categories.late?.count || 0) / slippageData.slippageItems.length : 0 }
                ].map((item, index) => (
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
                        {item.segment.value} items
                      </div>
                      <div className="text-xs text-[#6b778c]">
                        {Math.round(item.percentage * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {slippageData.riskFactors.length > 0 && (
            <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
              <div className="text-xs font-semibold text-[#172b4d]">Risk Factors</div>
              <div className="space-y-1">
                {slippageData.riskFactors.map((risk, index) => (
                  <div key={index} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#de350b]"></div>
                      <span className="text-xs text-[#42526e] font-medium">
                        {risk.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Team Performance */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#172b4d]">Team Delivery Trends</div>
            <div className="space-y-1 max-h-32 overflow-y-auto hide-scrollbar">
              {slippageData.assigneeSlippage
                .sort((a: any, b: any) => a.avgSlippage - b.avgSlippage)
                .map((person: any, index: number) => (
                  <div key={person.assignee.id} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          person.avgSlippage <= 0 ? 'bg-[#00875a]' :
                          person.avgSlippage <= 3 ? 'bg-[#ffab00]' :
                          'bg-[#de350b]'
                        }`}></div>
                        <img
                          src={person.assignee.avatar}
                          alt={person.assignee.name}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-xs text-[#42526e] font-medium truncate max-w-16">
                          {person.assignee.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-[#42526e]">
                          {person.avgSlippage > 0 ? '+' : ''}{person.avgSlippage.toFixed(1)}d avg
                        </div>
                        <div className="text-xs text-[#6b778c]">
                          {person.completedCount} completed
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Worst Slippages */}
          <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
            <div className="text-xs font-semibold text-[#172b4d]">Largest Slippages</div>
            <div className="space-y-1 max-h-24 overflow-y-auto hide-scrollbar">
              {slippageData.slippageItems
                .filter(item => item.slippageDays > 0)
                .sort((a, b) => b.slippageDays - a.slippageDays)
                .slice(0, 6)
                .map((item, index) => (
                  <div key={item.issue.id} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.severity === 'good' ? 'bg-[#00875a]' :
                          item.severity === 'moderate' ? 'bg-[#ffab00]' :
                          'bg-[#de350b]'
                        }`}></div>
                        <span className="text-xs font-mono text-[#42526e] font-medium">{item.issue.key}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-[#42526e]">
                          +{item.slippageDays}d late
                        </div>
                        <div className="text-xs text-[#6b778c]">
                          {Math.round(item.slippagePercentage)}% over target
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlippageChart;