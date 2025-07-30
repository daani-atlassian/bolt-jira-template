import React, { useState, useMemo } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, Target, Users, BarChart3 } from 'lucide-react';
import { Issue } from '../../types';

interface TimeTrackingChartProps {
  issues: Issue[];
}

const TimeTrackingChart: React.FC<TimeTrackingChartProps> = ({ issues }) => {
  const [viewMode, setViewMode] = useState<'distribution' | 'capacity' | 'efficiency'>('distribution');

  // Calculate time tracking analytics
  const timeData = useMemo(() => {
    const itemsWithTracking = issues.filter(issue => 
      issue.originalEstimate && issue.originalEstimate > 0
    );

    const totalOriginalEstimate = itemsWithTracking.reduce((sum, issue) => sum + issue.originalEstimate, 0);
    const totalTimeSpent = itemsWithTracking.reduce((sum, issue) => sum + (issue.timeSpent || 0), 0);
    const totalRemaining = itemsWithTracking.reduce((sum, issue) => sum + (issue.remainingEstimate || 0), 0);

    // Time by assignee for all analysis
    const assigneeAnalysis = issues.reduce((acc, issue) => {
      const assigneeId = issue.assignee.id;
      if (!acc[assigneeId]) {
        acc[assigneeId] = {
          assignee: issue.assignee,
          originalEstimate: 0,
          timeSpent: 0,
          remainingEstimate: 0,
          totalIssues: 0,
          inProgressIssues: 0,
          completedIssues: 0,
          todoIssues: 0,
          issues: []
        };
      }
      
      acc[assigneeId].originalEstimate += issue.originalEstimate || 0;
      acc[assigneeId].timeSpent += issue.timeSpent || 0;
      acc[assigneeId].remainingEstimate += issue.remainingEstimate || 0;
      acc[assigneeId].totalIssues++;
      acc[assigneeId].issues.push(issue);
      
      if (issue.status === 'IN PROGRESS') acc[assigneeId].inProgressIssues++;
      else if (issue.status === 'DONE') acc[assigneeId].completedIssues++;
      else acc[assigneeId].todoIssues++;
      
      return acc;
    }, {} as Record<string, any>);

    // Capacity insights calculations
    const capacityInsights = Object.values(assigneeAnalysis).map((person: any) => {
      const weeklyCapacity = 40; // Assume 40 hours per week standard
      const utilization = person.originalEstimate > 0 ? (person.timeSpent / person.originalEstimate) * 100 : 0;
      const workloadHours = person.originalEstimate + person.remainingEstimate;
      const capacityUsage = (workloadHours / weeklyCapacity) * 100;
      
      // Determine capacity status
      let capacityStatus: 'under-allocated' | 'optimal' | 'over-allocated' = 'optimal';
      if (capacityUsage < 70) capacityStatus = 'under-allocated';
      else if (capacityUsage > 110) capacityStatus = 'over-allocated';
      
      return {
        ...person,
        weeklyCapacity,
        utilization,
        workloadHours,
        capacityUsage,
        capacityStatus,
        activeWorkload: person.inProgressIssues + person.todoIssues
      };
    });

    // Delivery track record for efficiency analysis
    const completedIssues = issues.filter(issue => issue.actualDueDate);
    const deliveryTrackRecord = completedIssues.reduce((acc, issue) => {
      const assigneeId = issue.assignee.id;
      if (!acc[assigneeId]) {
        acc[assigneeId] = {
          assignee: issue.assignee,
          early: 0,
          onTime: 0,
          late: 0,
          total: 0
        };
      }
      
      const target = new Date(issue.targetDate);
      const actual = new Date(issue.actualDueDate);
      const diffDays = Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
      
      acc[assigneeId].total++;
      if (diffDays < 0) {
        acc[assigneeId].early++;
      } else if (diffDays === 0) {
        acc[assigneeId].onTime++;
      } else {
        acc[assigneeId].late++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate percentage of hours used
    const hoursUsedPercentage = totalOriginalEstimate > 0 
      ? (totalTimeSpent / totalOriginalEstimate) * 100
      : 0;

    return {
      totalOriginalEstimate,
      totalTimeSpent,
      totalRemaining,
      hoursUsedPercentage,
      assigneeTime: Object.values(assigneeAnalysis),
      capacityInsights,
      deliveryTrackRecord: Object.values(deliveryTrackRecord),
      trackingCoverage: (itemsWithTracking.length / issues.length) * 100
    };
  }, [issues]);

  const formatHours = (hours: number) => {
    return `${hours}h`;
  };

  if (timeData.trackingCoverage === 0) {
    return (
      <div className="w-full text-center py-6">
        <Clock className="w-8 h-8 mx-auto mb-2 text-[#6b778c] opacity-50" />
        <div className="text-sm text-[#42526e]">No time tracking data</div>
        <div className="text-xs text-[#6b778c]">Add time estimates to track usage</div>
      </div>
    );
  }

  // Create pie chart segments
  const createPieChart = () => {
    const centerX = 35;
    const centerY = 35;
    const radius = 30;
    let currentAngle = -90; // Start from top

    const colors = ['#0052cc', '#36b37e', '#ffab00', '#de350b', '#6554c0'];
    
    return timeData.assigneeTime.map((person: any, index: number) => {
      const percentage = person.timeSpent / timeData.totalTimeSpent;
      const angle = percentage * 360;
      
      const startAngleRad = (currentAngle * Math.PI) / 180;
      const endAngleRad = ((currentAngle + angle) * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      const color = colors[index % colors.length];
      
      const path = (
        <path
          key={person.assignee.id}
          d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
          fill={color}
          className="transition-all duration-300 hover:opacity-80"
        />
      );
      
      currentAngle += angle;
      return { path, person, color, percentage };
    });
  };

  const pieSegments = createPieChart();

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
          onClick={() => setViewMode('capacity')}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            viewMode === 'capacity'
              ? 'bg-white text-[#0052cc] shadow-sm'
              : 'text-[#6b778c] hover:text-[#42526e]'
          }`}
        >
          Capacity
        </button>
      </div>

      {viewMode === 'distribution' ? (
        <div className="flex items-center space-x-4">
          {/* Pie Chart */}
          <div className="flex-shrink-0">
            <svg width="70" height="70" viewBox="0 0 70 70">
              {pieSegments.map(segment => segment.path)}
              {/* Center circle for donut effect */}
              <circle cx="35" cy="35" r="18" fill="white" />
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2 max-h-32 overflow-y-auto">
            {pieSegments.map((segment, index) => (
              <div key={segment.person.assignee.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <img
                    src={segment.person.assignee.avatar}
                    alt={segment.person.assignee.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="text-xs text-[#6b778c] truncate max-w-16">
                    {segment.person.assignee.name.split(' ')[0]}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#42526e]">
                    {formatHours(segment.person.timeSpent)}
                  </div>
                  <div className="text-xs text-[#6b778c]">
                    {Math.round(segment.percentage * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'capacity' ? (
        <div className="space-y-3">
          {/* Team Capacity Overview */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#172b4d]">Team Capacity Analysis</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {timeData.capacityInsights
                .sort((a: any, b: any) => b.capacityUsage - a.capacityUsage)
                .map((person: any, index: number) => (
                  <div key={person.assignee.id} className="flex items-center justify-between p-1 rounded hover:bg-[#fafbfc]">
                    <div className="flex items-center space-x-2">
                      <img
                        src={person.assignee.avatar}
                        alt={person.assignee.name}
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="text-xs text-[#6b778c] truncate max-w-16">
                        {person.assignee.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className={`text-xs font-semibold ${
                          person.capacityStatus === 'over-allocated' ? 'text-[#de350b]' :
                          person.capacityStatus === 'under-allocated' ? 'text-[#ffab00]' :
                          'text-[#00875a]'
                        }`}>
                          {Math.round(person.capacityUsage)}% load
                        </div>
                        <div className="text-xs text-[#6b778c]">
                          {person.activeWorkload} active
                        </div>
                      </div>
                      <div className="w-12 h-1.5 bg-[#f1f2f4] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            person.capacityStatus === 'over-allocated' ? 'bg-[#de350b]' :
                            person.capacityStatus === 'under-allocated' ? 'bg-[#ffab00]' :
                            'bg-[#00875a]'
                          }`}
                          style={{ width: `${Math.min(person.capacityUsage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Capacity Summary */}
          <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
            <div className="text-xs font-semibold text-[#172b4d]">Capacity Status</div>
            <div className="space-y-1">
              {[
                { 
                  status: 'over-allocated', 
                  label: 'Over-allocated', 
                  color: 'text-[#de350b]', 
                  bgColor: 'bg-[#de350b]',
                  count: timeData.capacityInsights.filter((p: any) => p.capacityStatus === 'over-allocated').length
                },
                { 
                  status: 'optimal', 
                  label: 'Optimal load', 
                  color: 'text-[#00875a]', 
                  bgColor: 'bg-[#00875a]',
                  count: timeData.capacityInsights.filter((p: any) => p.capacityStatus === 'optimal').length
                },
                { 
                  status: 'under-allocated', 
                  label: 'Under-allocated', 
                  color: 'text-[#ffab00]', 
                  bgColor: 'bg-[#ffab00]',
                  count: timeData.capacityInsights.filter((p: any) => p.capacityStatus === 'under-allocated').length
                }
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${item.bgColor}`}></div>
                    <span className="text-xs text-[#6b778c]">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-1.5 bg-[#f1f2f4] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.bgColor}`}
                        style={{ width: `${timeData.capacityInsights.length > 0 ? (item.count / timeData.capacityInsights.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${item.color} w-4`}>
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workload Distribution */}
          <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
            <div className="text-xs font-semibold text-[#172b4d]">Workload Distribution</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b778c]">Total estimated work</span>
                <span className="font-semibold text-[#42526e]">
                  {formatHours(timeData.totalOriginalEstimate + timeData.totalRemaining)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b778c]">Team weekly capacity</span>
                <span className="font-semibold text-[#42526e]">
                  {formatHours(timeData.capacityInsights.length * 40)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b778c]">Current utilization</span>
                <span className={`font-semibold ${
                  timeData.hoursUsedPercentage > 100 ? 'text-[#de350b]' :
                  timeData.hoursUsedPercentage > 80 ? 'text-[#ffab00]' :
                  'text-[#00875a]'
                }`}>
                  {Math.round(timeData.hoursUsedPercentage)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TimeTrackingChart;