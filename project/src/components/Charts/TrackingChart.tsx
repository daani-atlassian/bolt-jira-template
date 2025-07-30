import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Issue } from '../../types';
import { calculateTrackingStatus } from '../../mock/mockData';

interface TrackingChartProps {
  issues: Issue[];
}

const TrackingChart: React.FC<TrackingChartProps> = ({ issues }) => {
  const trackingData = issues.reduce((acc, issue) => {
    const tracking = calculateTrackingStatus(issue.targetDate, issue.dueDate);
    acc[tracking.severity] = (acc[tracking.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const onTrack = trackingData.low || 0;
  const atRisk = trackingData.medium || 0;
  const offTrack = trackingData.high || 0;
  const total = onTrack + atRisk + offTrack;

  if (total === 0) {
    return (
      <div className="text-center py-4 text-[#6b778c] text-sm">
        No tracking data available
      </div>
    );
  }

  const getHealthColor = () => {
    if (offTrack > 0) return { color: '#de350b', label: 'Off Track', icon: AlertCircle };
    if (atRisk > 0) return { color: '#ffab00', label: 'At Risk', icon: AlertTriangle };
    return { color: '#00875a', label: 'On Track', icon: CheckCircle2 };
  };

  const health = getHealthColor();

  // Create unified tracking pie chart
  const createTrackingPieChart = () => {
    const centerX = 35;
    const centerY = 35;
    const radius = 28;
    
    if (total === 0) return [];
    
    const segments = [
      { value: onTrack, color: '#00875a', label: 'On track' },
      { value: atRisk, color: '#ffab00', label: 'At risk' },
      { value: offTrack, color: '#de350b', label: 'Off track' }
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

  const trackingPieSegments = createTrackingPieChart();

  return (
    <div className="w-full space-y-3">
      {/* Unified Tracking Chart */}
      <div className="flex items-center space-x-4">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          <svg width="70" height="70" viewBox="0 0 70 70">
            {trackingPieSegments.map(item => item.path)}
            {/* Center circle for donut effect */}
            <circle cx="35" cy="35" r="18" fill="white" />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {trackingPieSegments.map((item, index) => (
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

      {/* Summary */}
      <div className="text-center pt-1 border-t border-[#f1f2f4]">
        <div className="text-xs text-[#6b778c]">
          {total} items tracked
        </div>
      </div>
    </div>
  );
};

export default TrackingChart;