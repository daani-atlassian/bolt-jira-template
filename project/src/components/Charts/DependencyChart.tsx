import React, { useState } from 'react';
import { GitBranch, AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Issue, Dependency } from '../../types';

interface DependencyChartProps {
  issues: Issue[];
}

const DependencyChart: React.FC<DependencyChartProps> = ({ issues }) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  // Analyze dependencies by status for unified chart
  const statusAnalysis = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const analysis = {
      'is-blocked-by': { 
        'TO DO': { count: 0, issues: [] as string[] }, 
        'IN PROGRESS': { count: 0, issues: [] as string[] }, 
        'DONE': { count: 0, issues: [] as string[] },
        'OVERDUE': { count: 0, issues: [] as string[] },
        total: 0 
      },
      'blocks': { 
        'TO DO': { count: 0, issues: [] as string[] }, 
        'IN PROGRESS': { count: 0, issues: [] as string[] }, 
        'DONE': { count: 0, issues: [] as string[] },
        'OVERDUE': { count: 0, issues: [] as string[] },
        total: 0 
      },
      'relates-to': { 
        'TO DO': { count: 0, issues: [] as string[] }, 
        'IN PROGRESS': { count: 0, issues: [] as string[] }, 
        'DONE': { count: 0, issues: [] as string[] },
        'OVERDUE': { count: 0, issues: [] as string[] },
        total: 0 
      }
    };

    issues.forEach(issue => {
      issue.dependencies.forEach(dep => {
        // Check if the target issue is overdue
        const targetIssue = issues.find(i => i.id === dep.targetIssueId);
        let status = dep.targetIssueStatus;
        
        // If target issue is not done and is overdue, mark as OVERDUE
        if (status !== 'DONE' && targetIssue) {
          const dueDate = new Date(targetIssue.dueDate);
          if (dueDate < today) {
            status = 'OVERDUE';
          }
        }
        
        analysis[dep.type][status].count++;
        analysis[dep.type][status].issues.push(issue.key);
        analysis[dep.type].total++;
      });
    });

    return analysis;
  }, [issues]);

  // Analyze all dependencies for risk-based detailed list
  const riskAnalysis = React.useMemo(() => {
    const analysis = {
      items: [] as Array<{issue: Issue, dependency: Dependency, riskLevel: 'overdue'|'pending'|'completed', reason: string}>
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    issues.forEach(issue => {
      issue.dependencies.forEach(dep => {
        let riskLevel: 'overdue'|'pending'|'completed' = 'completed';
        let reason = 'completed';

        // Determine risk level and reason
        if (dep.targetIssueStatus === 'DONE') {
          riskLevel = 'completed';
          reason = 'completed';
        } else if (dep.targetIssueStatus === 'TO DO') {
          // Check if target issue is overdue
          const targetIssue = issues.find(i => i.id === dep.targetIssueId);
          if (targetIssue) {
            const dueDate = new Date(targetIssue.dueDate);
            if (dueDate < today) {
              riskLevel = 'overdue';
              const overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              reason = `overdue +${overdueDays}d`;
            } else {
              riskLevel = 'pending';
              reason = 'not started';
            }
          } else {
            riskLevel = 'pending';
            reason = 'not started';
          }
        } else if (dep.targetIssueStatus === 'IN PROGRESS') {
          riskLevel = 'pending';
          reason = 'in progress';
        }

        if (dep.type === 'is-blocked-by') {
          analysis.items.push({ issue, dependency: dep, riskLevel, reason });
        }
      });
    });

    return analysis;
  }, [issues]);

  // Calculate totals for the chart
  const totalDependencies = Object.values(statusAnalysis).reduce((sum, type) => sum + type.total, 0);
  const hasBlockedBy = statusAnalysis['is-blocked-by'].total > 0;
  const hasBlocks = statusAnalysis['blocks'].total > 0;
  const hasRelatesTo = statusAnalysis['relates-to'].total > 0;

  if (totalDependencies === 0) {
    return (
      <div className="w-full text-center py-4">
        <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-[#00875a] opacity-50" />
        <div className="text-sm text-[#42526e]">No dependencies</div>
        <div className="text-xs text-[#6b778c]">All work is independent</div>
      </div>
    );
  }

  // Create unified dependency type pie chart
  const createDependencyPieChart = () => {
    const centerX = 35;
    const centerY = 35;
    const radius = 28;
    
    const total = totalDependencies;
    if (total === 0) return [];
    
    const segments = [
      { value: statusAnalysis['is-blocked-by'].total, color: '#de350b', label: 'Blocked by' },
      { value: statusAnalysis['blocks'].total, color: '#ffab00', label: 'Blocks' },
      { value: statusAnalysis['relates-to'].total, color: '#0052cc', label: 'Relates to' }
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

  const dependencyPieSegments = createDependencyPieChart();

  return (
    <div className="w-full space-y-3">
      
      {/* Unified Dependency Types with Pie Chart */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[#172b4d]">Dependency Types</div>
        <div className="flex items-center space-x-4">
          {/* Pie Chart */}
          <div className="flex-shrink-0">
            <svg width="70" height="70" viewBox="0 0 70 70">
              {dependencyPieSegments.map(item => item.path)}
              {/* Center circle for donut effect */}
              <circle cx="35" cy="35" r="18" fill="white" />
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {dependencyPieSegments.map((item, index) => (
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
                    {item.segment.value}
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

      {/* Risk Level Groupings - Only show blocking dependencies for space efficiency */}
      {hasBlockedBy && riskAnalysis.items.length > 0 && (
        <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
          <div className="text-xs font-semibold text-[#172b4d]">
            Blocked Items by Risk
          </div>
          
          <div className="space-y-1 max-h-28 overflow-y-auto hide-scrollbar">
            {/* Overdue Items */}
            {riskAnalysis.items
              .filter(item => item.riskLevel === 'overdue')
              .map((item, index) => (
                <div key={`overdue-${index}`} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#de350b]"></div>
                      <span className="text-xs font-mono text-[#42526e] font-medium">
                        {item.issue.key}
                      </span>
                      <ArrowRight className="w-2 h-2 text-[#6b778c]" />
                      <span className="text-xs font-mono text-[#42526e]">
                        {item.dependency.targetIssueKey}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#42526e]">
                        {item.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            
            {/* Pending Items */}
            {riskAnalysis.items
              .filter(item => item.riskLevel === 'pending')
              .map((item, index) => (
                <div key={`pending-${index}`} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#ffab00]"></div>
                      <span className="text-xs font-mono text-[#42526e] font-medium">
                        {item.issue.key}
                      </span>
                      <ArrowRight className="w-2 h-2 text-[#6b778c]" />
                      <span className="text-xs font-mono text-[#42526e]">
                        {item.dependency.targetIssueKey}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#42526e]">
                        {item.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            
            {/* Completed Items */}
            {riskAnalysis.items
              .filter(item => item.riskLevel === 'completed')
              .map((item, index) => (
                <div key={`completed-${index}`} className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#dfe1e6] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#00875a]"></div>
                      <span className="text-xs font-mono text-[#42526e] font-medium">
                        {item.issue.key}
                      </span>
                      <ArrowRight className="w-2 h-2 text-[#6b778c]" />
                      <span className="text-xs font-mono text-[#42526e]">
                        {item.dependency.targetIssueKey}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#42526e]">
                        {item.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DependencyChart;