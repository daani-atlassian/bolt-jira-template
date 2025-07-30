import React, { useState, useMemo } from 'react';
import { Zap, TrendingUp, Users, Target } from 'lucide-react';
import { Issue } from '../../types';

interface StoryPointsChartProps {
  issues: Issue[];
}

const StoryPointsChart: React.FC<StoryPointsChartProps> = ({ issues }) => {
  const [viewMode, setViewMode] = useState<'velocity' | 'distribution'>('velocity');

  // Calculate story points analytics
  const storyPointsData = useMemo(() => {
    const totalPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const completedPoints = issues
      .filter(issue => issue.status === 'DONE')
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const inProgressPoints = issues
      .filter(issue => issue.status === 'IN PROGRESS')
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const todoPoints = issues
      .filter(issue => issue.status === 'TO DO')
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);

    // Points by assignee with velocity calculation
    const assigneePoints = issues.reduce((acc, issue) => {
      const assigneeId = issue.assignee.id;
      if (!acc[assigneeId]) {
        acc[assigneeId] = {
          assignee: issue.assignee,
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
          issues: []
        };
      }
      const points = issue.storyPoints || 0;
      acc[assigneeId].total += points;
      acc[assigneeId].issues.push(issue);
      
      if (issue.status === 'DONE') acc[assigneeId].completed += points;
      else if (issue.status === 'IN PROGRESS') acc[assigneeId].inProgress += points;
      else acc[assigneeId].todo += points;
      
      return acc;
    }, {} as Record<string, any>);

    // Story points by complexity (Fibonacci sequence analysis)
    const complexityDistribution = issues.reduce((acc, issue) => {
      const points = issue.storyPoints || 0;
      if (points === 0) return acc;
      
      let complexity = 'XL (21+)';
      if (points <= 2) complexity = 'XS (1-2)';
      else if (points <= 5) complexity = 'S (3-5)';
      else if (points <= 8) complexity = 'M (5-8)';
      else if (points <= 13) complexity = 'L (8-13)';
      else if (points <= 21) complexity = 'XL (13-21)';
      
      if (!acc[complexity]) {
        acc[complexity] = { count: 0, points: 0, issues: [] };
      }
      acc[complexity].count++;
      acc[complexity].points += points;
      acc[complexity].issues.push(issue);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate velocity (completed points per person)
    const velocityData = Object.values(assigneePoints).map((person: any) => ({
      ...person,
      velocity: person.completed, // Simple velocity = completed points
      capacity: person.total,
      utilization: person.total > 0 ? (person.completed / person.total) * 100 : 0
    }));

    return {
      totalPoints,
      completedPoints,
      inProgressPoints,
      todoPoints,
      assigneePoints: Object.values(assigneePoints),
      complexityDistribution,
      velocityData,
      completionRate: totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0,
      averageStorySize: issues.filter(i => i.storyPoints).length > 0 
        ? totalPoints / issues.filter(i => i.storyPoints).length 
        : 0
    };
  }, [issues]);

  if (storyPointsData.totalPoints === 0) {
    return (
      <div className="w-full text-center py-6">
        <Zap className="w-8 h-8 mx-auto mb-2 text-[#6b778c] opacity-50" />
        <div className="text-sm text-[#42526e]">No story points assigned</div>
        <div className="text-xs text-[#6b778c]">Add story points for velocity tracking</div>
      </div>
    );
  }

  // Create pie chart for status distribution
  const createStatusPieChart = () => {
    const centerX = 35;
    const centerY = 35;
    const radius = 28;
    
    const total = storyPointsData.totalPoints;
    if (total === 0) return [];
    
    const segments = [
      { value: storyPointsData.completedPoints, color: '#00875a', label: 'Done' },
      { value: storyPointsData.inProgressPoints, color: '#0052cc', label: 'In Progress' },
      { value: storyPointsData.todoPoints, color: '#8993a4', label: 'To Do' }
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
          onClick={() => setViewMode('velocity')}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            viewMode === 'velocity'
              ? 'bg-white text-[#0052cc] shadow-sm'
              : 'text-[#6b778c] hover:text-[#42526e]'
          }`}
        >
          Velocity
        </button>
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
      </div>

      {viewMode === 'velocity' ? (
        <div className="space-y-3">
          {/* Unified Status Distribution with Pie Chart */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#172b4d]">Points by Status</div>
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
                        {item.segment.value} pts
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

          {/* Team Velocity */}
          <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
            <div className="text-xs font-semibold text-[#172b4d]">Team Velocity</div>
            <div className="space-y-1 max-h-32 overflow-y-auto hide-scrollbar">
              {storyPointsData.velocityData
                .sort((a, b) => b.velocity - a.velocity)
                .map((person: any, index: number) => (
                  <div key={person.assignee.id} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-[#00875a]"></div>
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
                          {person.velocity} pts completed
                        </div>
                        <div className="text-xs text-[#6b778c]">
                          {Math.round(person.utilization)}% done
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
          {/* Complexity Distribution */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#172b4d]">Story Complexity</div>
            <div className="space-y-1 hide-scrollbar">
              {Object.entries(storyPointsData.complexityDistribution)
                .sort(([,a], [,b]) => (b as any).points - (a as any).points)
                .map(([complexity, data]: [string, any]) => (
                  <div key={complexity} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          complexity.includes('XS') ? 'bg-[#00875a]' :
                          complexity.includes('S') ? 'bg-[#36b37e]' :
                          complexity.includes('M') ? 'bg-[#ffab00]' :
                          complexity.includes('L') ? 'bg-[#ff8b00]' :
                          'bg-[#de350b]'
                        }`}></div>
                        <span className="text-xs text-[#42526e] font-medium">{complexity}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-[#42526e]">
                          {data.points} pts
                        </div>
                        <div className="text-xs text-[#6b778c]">
                          {data.count} stories
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

export default StoryPointsChart;