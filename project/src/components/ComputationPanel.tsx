import React, { useState, useMemo } from 'react';
import { SelectedCell } from '../types';
import { 
  computeDateRange, 
  computeNumerical, 
  formatNumber, 
  formatDate, 
  groupSelectedCells 
} from '../utils/computationUtils';
import { Calculator, X, Hash, DollarSign } from 'lucide-react';

interface ComputationPanelProps {
  selectedCells: SelectedCell[];
  onClearSelections: () => void;
}

const ComputationPanel: React.FC<ComputationPanelProps> = ({ 
  selectedCells, 
  onClearSelections 
}) => {
  const [numericalComputationType, setNumericalComputationType] = useState<'sum' | 'average' | 'range' | 'count' | 'countUnique'>('sum');

  // Separate date cells from other types for special handling
  const { dateCells, otherCells } = useMemo(() => {
    const dateCells = selectedCells.filter(cell => cell.dataType === 'date');
    const otherCells = selectedCells.filter(cell => cell.dataType !== 'date');
    return { dateCells, otherCells };
  }, [selectedCells]);

  // Check if we have multiple date fields selected
  const uniqueDateFields = useMemo(() => {
    return Array.from(new Set(dateCells.map(cell => cell.fieldName)));
  }, [dateCells]);

  const formatFieldName = (fieldName: string): string => {
    switch (fieldName) {
      case 'startDate':
        return 'Start Date';
      case 'dueDate':
        return 'Due Date';
      case 'targetDate':
        return 'Target Date';
      default:
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
  };

  const renderCombinedDateComputation = (allDateCells: SelectedCell[]) => {
    // Get all dates from all date cells
    const allDates = allDateCells.map(cell => ({
      date: cell.value,
      fieldName: cell.fieldName,
      displayValue: cell.displayValue
    }));
    
    // Find absolute earliest and latest
    const validDates = allDates
      .map(item => ({
        ...item,
        dateObj: new Date(item.date)
      }))
      .filter(item => !isNaN(item.dateObj.getTime()))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
    if (validDates.length === 0) {
      return (
        <div className="text-xs text-[#6b778c]">
          No valid dates selected
        </div>
      );
    }

    const earliest = validDates[0];
    const latest = validDates[validDates.length - 1];
    const differenceInDays = Math.ceil((latest.dateObj.getTime() - earliest.dateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    const displayDifferenceText = differenceInDays === 0 
      ? "Same date"
      : `${differenceInDays} day${differenceInDays === 1 ? '' : 's'}`;
      
    return (
      <div className="bg-[#f7f8f9] p-3 rounded border border-[#dfe1e6]">
        <div className="flex items-end justify-between mb-2">
          <div className="flex flex-col items-start">
            <span className="px-1 py-0.5 bg-[#dfe1e6] text-[#6b778c] text-xs rounded font-medium mb-1">
              {formatFieldName(earliest.fieldName)}
            </span>
            <span className="text-xs font-medium text-[#172b4d]">{formatDate(earliest.date)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="px-1 py-0.5 bg-[#dfe1e6] text-[#6b778c] text-xs rounded font-medium mb-1">
              {formatFieldName(latest.fieldName)}
            </span>
            <span className="text-xs font-medium text-[#172b4d]">{formatDate(latest.date)}</span>
          </div>
        </div>
        
        {/* Visual timeline */}
        <div className="relative mb-2">
          <div className="h-1 bg-[#dfe1e6] rounded-full">
            <div className="h-1 bg-[#0052cc] rounded-full w-full"></div>
          </div>
          <div className="absolute left-0 top-0 w-2 h-1 bg-[#0052cc] rounded-full"></div>
          <div className="absolute right-0 top-0 w-2 h-1 bg-[#0052cc] rounded-full"></div>
        </div>
        
        {/* Days between */}
        <div className="text-center">
          <span className="text-sm font-bold text-[#0052cc]">
            {displayDifferenceText}
          </span>
        </div>
      </div>
    );
  };

  const renderDateComputation = (cells: SelectedCell[]) => {
    const dates = cells.map(cell => cell.value);
    const result = computeDateRange(dates);

    if (!result.earliest || !result.latest) {
      return (
        <div className="text-xs text-[#6b778c]">
          No valid dates selected
        </div>
      );
    }

    const displayDifferenceText = result.differenceInDays === 0 
      ? "Same date"
      : `${result.differenceInDays} day${result.differenceInDays === 1 ? '' : 's'}`;

    return (
      <div className="bg-[#f7f8f9] p-3 rounded border border-[#dfe1e6]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#172b4d]">{formatDate(result.earliest)}</span>
          <span className="text-xs font-medium text-[#172b4d]">{formatDate(result.latest)}</span>
        </div>
        
        {/* Visual timeline */}
        <div className="relative mb-2">
          <div className="h-1 bg-[#dfe1e6] rounded-full">
            <div className="h-1 bg-[#0052cc] rounded-full w-full"></div>
          </div>
          <div className="absolute left-0 top-0 w-2 h-1 bg-[#0052cc] rounded-full"></div>
          <div className="absolute right-0 top-0 w-2 h-1 bg-[#0052cc] rounded-full"></div>
        </div>
        
        {/* Days between */}
        <div className="text-center">
          <span className="text-sm font-bold text-[#0052cc]">
            {displayDifferenceText}
          </span>
        </div>
      </div>
    );
  };

  const renderNumericalComputation = (cells: SelectedCell[], dataType: string) => {
    const numbers = cells.map(cell => parseFloat(cell.value)).filter(num => !isNaN(num));
    const result = computeNumerical(numbers, numericalComputationType);

    const getIcon = () => {
      if (dataType === 'currency') return DollarSign;
      return Hash;
    };

    const Icon = getIcon();

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white border border-[#dfe1e6] rounded flex items-center justify-center shadow-sm">
              <Icon className="w-4 h-4 text-[#172b4d]" />
            </div>
          </div>
          
          {/* Computation Type Selector */}
          <div className="bg-[#f1f2f4] p-1 rounded gap-1 text-xs">
            <button
              onClick={() => setNumericalComputationType('sum')}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                numericalComputationType === 'sum'
                  ? 'bg-white text-[#0052cc] shadow-sm'
                  : 'text-[#6b778c] hover:text-[#42526e]'
              }`}
            >
              Sum
            </button>
            <button
              onClick={() => setNumericalComputationType('average')}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                numericalComputationType === 'average'
                  ? 'bg-white text-[#0052cc] shadow-sm'
                  : 'text-[#6b778c] hover:text-[#42526e]'
              }`}
            >
              Avg
            </button>
            <button
              onClick={() => setNumericalComputationType('range')}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                numericalComputationType === 'range'
                  ? 'bg-white text-[#0052cc] shadow-sm'
                  : 'text-[#6b778c] hover:text-[#42526e]'
              }`}
            >
              Range
            </button>
            <button
              onClick={() => setNumericalComputationType('count')}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                numericalComputationType === 'count'
                  ? 'bg-white text-[#0052cc] shadow-sm'
                  : 'text-[#6b778c] hover:text-[#42526e]'
              }`}
            >
              Count
            </button>
          </div>
        </div>

        <div className="bg-[#f7f8f9] p-3 rounded border border-[#dfe1e6]">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6b778c]">
                {numericalComputationType === 'sum' ? 'Total:' :
                 numericalComputationType === 'average' ? 'Average:' :
                 numericalComputationType === 'range' ? 'Range:' :
                 numericalComputationType === 'count' ? 'Count:' :
                 'Unique values:'}
              </span>
              <span className="font-medium text-[#0052cc] text-sm">
                {formatNumber(typeof result === 'number' ? result : 0, dataType)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#dfe1e6] pt-1">
              <span className="text-[#6b778c]">Items:</span>
              <span className="font-medium text-[#172b4d]">{numbers.length}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Group non-date cells by field and data type
  const groupedOtherCells = groupSelectedCells(otherCells);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white border border-[#dfe1e6] rounded flex items-center justify-center shadow-sm">
            <Calculator className="w-4 h-4 text-[#172b4d]" />
          </div>
          <span className="font-medium text-[#172b4d] text-sm">
            Computation ({selectedCells.length} selected)
          </span>
        </div>
        <button
          onClick={onClearSelections}
          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
          title="Clear selections"
        >
          <X className="w-4 h-4 text-[#6b778c]" />
        </button>
      </div>

      {/* Date computations */}
      <div className="space-y-2">
        {dateCells.length > 0 && (
          <div className="border border-[#dfe1e6] rounded-lg p-2">
            <div className="mb-2">
              <h4 className="text-sm font-medium text-[#172b4d]">
                {uniqueDateFields.length > 1 ? 'Date Range' : formatFieldName(uniqueDateFields[0])}
              </h4>
              <div className="text-xs text-[#6b778c]">
                {dateCells.length} cell{dateCells.length === 1 ? '' : 's'} selected
                {uniqueDateFields.length > 1 && ` across ${uniqueDateFields.length} fields`}
              </div>
            </div>
            
            {uniqueDateFields.length > 1 ? 
              renderCombinedDateComputation(dateCells) : 
              renderDateComputation(dateCells)
            }
          </div>
        )}

        {/* Non-date computations by field type */}
        {Object.entries(groupedOtherCells).map(([key, cells]) => {
          const fieldName = cells[0].fieldName;
          const dataType = cells[0].dataType;
          
          return (
            <div key={key} className="border border-[#dfe1e6] rounded-lg p-2">
              <div className="mb-2">
                <h4 className="text-sm font-medium text-[#172b4d] capitalize">
                  {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h4>
                <div className="text-xs text-[#6b778c]">
                  {cells.length} cell{cells.length === 1 ? '' : 's'} selected
                </div>
              </div>
              
              {renderNumericalComputation(cells, dataType)}
            </div>
          );
        })}
      </div>

      {/* Clear All Button */}
      <div className="border-t border-[#dfe1e6] pt-2">
        <button
          onClick={onClearSelections}
          className="w-full px-2 py-1.5 text-xs font-medium text-[#6b778c] hover:text-[#42526e] hover:bg-[#f1f2f4] rounded transition-colors"
        >
          Clear All Selections
        </button>
      </div>
    </div>
  );
};

export default ComputationPanel;