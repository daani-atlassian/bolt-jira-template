import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface AggregationDropdownProps {
  chartType: 'status' | 'startDate' | 'dueDate' | 'targetDueDate' | 'budget' | 'storyPoints' | 'timeTracking' | 'slippage' | 'dependencies' | 'comments' | null;
}

const AggregationDropdown: React.FC<AggregationDropdownProps> = ({ chartType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Define aggregation options based on chart type
  const getAggregationOptions = () => {
    switch (chartType) {
      case 'startDate':
      case 'dueDate':
      case 'targetDueDate':
        return [
          { value: 'earliest', label: 'Earliest Date' },
          { value: 'latest', label: 'Latest Date' },
          { value: 'range', label: 'Date Range' },
          { value: 'count', label: 'Count' },
        ];
      case 'budget':
        return [
          { value: 'sum', label: 'Sum' },
          { value: 'average', label: 'Average' },
          { value: 'min', label: 'Min' },
          { value: 'max', label: 'Max' },
          { value: 'count', label: 'Count' },
          { value: 'distribution', label: 'Distribution' }
        ];
      case 'storyPoints':
      case 'timeTracking':
      case 'slippage':
        return [
          { value: 'sum', label: 'Sum' },
          { value: 'average', label: 'Average' },
          { value: 'min', label: 'Min' },
          { value: 'max', label: 'Max' },
          { value: 'count', label: 'Count' },
          { value: 'median', label: 'Median' }
        ];
      default:
        return [];
    }
  };

  const options = getAggregationOptions();
  
  // Set default selected option
  useEffect(() => {
    if (options.length > 0 && !selectedOption) {
      if (chartType === 'startDate') {
        setSelectedOption('earliest');
      } else if (chartType === 'dueDate' || chartType === 'targetDueDate') {
        setSelectedOption('latest');
      } else if (chartType === 'budget') {
        setSelectedOption('sum');
      } else {
        setSelectedOption('sum');
      }
    }
  }, [chartType, options, selectedOption]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't show dropdown for non-aggregatable fields
  const shouldShowDropdown = ['startDate', 'dueDate', 'targetDueDate', 'budget', 'storyPoints', 'timeTracking', 'slippage'].includes(chartType || '');
  
  if (!shouldShowDropdown) return null;

  const handleOptionSelect = (option: { value: string; label: string }) => {
    setSelectedOption(option.value);
    setIsOpen(false);
    // TODO: In the future, this would trigger actual aggregation logic
  };

  const selectedLabel = options.find(opt => opt.value === selectedOption)?.label || 'Aggregation';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-[#42526e] hover:text-[#172b4d] hover:bg-[#f1f2f4] border border-[#dfe1e6] rounded transition-colors bg-white"
        title="Change aggregation type"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-[#dfe1e6] z-50 py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                selectedOption === option.value
                  ? 'bg-[#e9f2ff] text-[#0052cc] font-medium'
                  : 'text-[#42526e] hover:bg-[#f1f2f4]'
              }`}
            >
              <span>{option.label}</span>
              {selectedOption === option.value && (
                <Check className="w-3 h-3 text-[#0052cc]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AggregationDropdown;