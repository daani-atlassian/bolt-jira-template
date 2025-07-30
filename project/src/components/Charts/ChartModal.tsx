import React from 'react';
import { X } from 'lucide-react';
import AggregationDropdown from './AggregationDropdown';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  position: { top: number; left: number; width: number; height: number } | null;
  children: React.ReactNode;
  chartType: 'status' | 'startDate' | 'dueDate' | 'targetDueDate' | 'budget' | 'storyPoints' | 'timeTracking' | 'slippage' | 'dependencies' | 'comments' | null;
}

const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, title, position, children, chartType }) => {
  if (!isOpen || !position) return null;

  // Position chart inline to the left of the field
  const calculatePosition = () => {
    const modalWidth = 320;
    const gap = 12; // Gap between chart and field
    const padding = 16; // Padding from viewport edges
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Position to the left of the field with gap
    let left = position.left - modalWidth - gap;
    let top = position.top;
    
    // If chart would go off the left edge, position it with minimum padding
    if (left < padding) {
      left = padding;
    }
    
    // Ensure chart doesn't go off the right edge (shouldn't happen with left positioning, but safety check)
    if (left + modalWidth + padding > viewportWidth) {
      left = viewportWidth - modalWidth - padding;
    }
    
    // Ensure chart doesn't go above viewport
    if (top < padding) {
      top = padding;
    }
    
    return { top, left };
  };
  
  const finalPosition = calculatePosition();
  
  return (
    <div 
      className="fixed bg-white rounded-lg shadow-xl border border-[#dfe1e6] w-[320px] z-50 flex flex-col max-h-[80vh]"
      style={{
        top: finalPosition.top,
        left: finalPosition.left,
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-[#f1f2f4] flex-shrink-0">
        <h2 className="text-sm font-semibold text-[#172b4d] truncate pr-2">{title}</h2>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <AggregationDropdown chartType={chartType} />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
          >
            <X className="w-3 h-3 text-[#6b778c]" />
          </button>
        </div>
      </div>
      <div className="flex flex-col min-h-0">
        <div className="p-4 pb-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChartModal;