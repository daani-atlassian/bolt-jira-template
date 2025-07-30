import React from 'react';
import { CheckCircle2, Clock, Square } from 'lucide-react';

interface StatusChartProps {
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
}

const StatusChart: React.FC<StatusChartProps> = ({ todoCount, inProgressCount, doneCount }) => {
  const total = todoCount + inProgressCount + doneCount;
  
  if (total === 0) {
    return (
      <div className="text-center py-4 text-[#6b778c] text-sm">
        No items to display
      </div>
    );
  }

  const todoPercent = (todoCount / total) * 100;
  const inProgressPercent = (inProgressCount / total) * 100;
  const donePercent = (doneCount / total) * 100;

  // Calculate angles for pie chart
  const todoAngle = (todoPercent / 100) * 360;
  const inProgressAngle = (inProgressPercent / 100) * 360;
  const doneAngle = (donePercent / 100) * 360;

  const createPieSlice = (startAngle: number, endAngle: number, color: string) => {
    const centerX = 35;
    const centerY = 35;
    const radius = 30;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return (
      <path
        d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
        fill={color}
        className="transition-all duration-300 hover:opacity-80"
      />
    );
  };

  let currentAngle = -90; // Start from top
  const slices = [];

  if (todoCount > 0) {
    slices.push(createPieSlice(currentAngle, currentAngle + todoAngle, '#8993a4'));
    currentAngle += todoAngle;
  }

  if (inProgressCount > 0) {
    slices.push(createPieSlice(currentAngle, currentAngle + inProgressAngle, '#0052cc'));
    currentAngle += inProgressAngle;
  }

  if (doneCount > 0) {
    slices.push(createPieSlice(currentAngle, currentAngle + doneAngle, '#00875a'));
  }

  return (
    <div className="w-full space-y-4">
      <div className="w-full flex items-center space-x-4">
      {/* Pie Chart */}
      <div className="flex-shrink-0">
        <svg width="70" height="70" viewBox="0 0 70 70">
          {slices}
          {/* Center circle for donut effect */}
          <circle cx="35" cy="35" r="18" fill="white" />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {todoCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-[#8993a4] rounded-full"></div>
              <span className="text-xs text-[#6b778c]">To do</span>
            </div>
            <span className="text-xs font-semibold text-[#8993a4]">{todoCount}</span>
          </div>
        )}
        
        {inProgressCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-[#0052cc] rounded-full"></div>
              <span className="text-xs text-[#6b778c]">In progress</span>
            </div>
            <span className="text-xs font-semibold text-[#0052cc]">{inProgressCount}</span>
          </div>
        )}
        
        {doneCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-[#00875a] rounded-full"></div>
              <span className="text-xs text-[#6b778c]">Done</span>
            </div>
            <span className="text-xs font-semibold text-[#00875a]">{doneCount}</span>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default StatusChart;