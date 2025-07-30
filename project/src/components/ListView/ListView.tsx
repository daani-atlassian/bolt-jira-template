import React, { useEffect, useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus,
  MessageCircle,
  Calendar,
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  GitBranch,
  Calculator,
  X
} from 'lucide-react';
import { useListViewStore } from '../../stores/listViewStore';
import { SelectedCell } from '../../types';
import { mockIssues, groupIssuesByAssignee, calculateTrackingStatus } from '../../mock/mockData';
import ComputationPanel from '../ComputationPanel';
import ChartModal from '../Charts/ChartModal';
import StatusChart from '../Charts/StatusChart';
import StartDateChart from '../Charts/StartDateChart';
import DueDateChart from '../Charts/DueDateChart';
import TargetDueDateChart from '../Charts/TargetDueDateChart';
import BudgetChart from '../Charts/BudgetChart';
import StoryPointsChart from '../Charts/StoryPointsChart';
import TimeTrackingChart from '../Charts/TimeTrackingChart';
import SlippageChart from '../Charts/SlippageChart';
import TrackingChart from '../Charts/TrackingChart';
import CommentsAISummary from '../Charts/CommentsAISummary';
import DependencyChart from '../Charts/DependencyChart';

// Helper function to calculate group statistics
const calculateGroupStats = (groupIssues: any[]) => {
  // Handle empty group case
  if (groupIssues.length === 0) {
    return {
      todoCount: 0,
      inProgressCount: 0, 
      doneCount: 0,
      completionPercentage: 0,
      totalCount: 0,
      totalComments: 0,
      earliestStart: new Date(),
      latestDue: new Date(),
      totalBudget: 0,
      totalStoryPoints: 0,
      avgTimeEfficiency: 0,
      avgSlippageDays: 0,
      totalTimeSpent: 0,
      totalOriginalEstimate: 0
    };
  }

  const todoCount = groupIssues.filter(issue => issue.status === 'TO DO').length;
  const inProgressCount = groupIssues.filter(issue => issue.status === 'IN PROGRESS').length;
  const doneCount = groupIssues.filter(issue => issue.status === 'DONE').length;
  const completionPercentage = groupIssues.length > 0 ? Math.round((doneCount / groupIssues.length) * 100) : 0;
  const totalComments = groupIssues.reduce((sum, issue) => sum + issue.comments, 0);
  
  // Calculate earliest start date and latest due date
  const startDates = groupIssues.map(issue => new Date(issue.startDate));
  const dueDates = groupIssues.map(issue => new Date(issue.dueDate));
  
  const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
  const latestDue = new Date(Math.max(...dueDates.map(d => d.getTime())));
  
  // Calculate new aggregated metrics
  const totalBudget = groupIssues.reduce((sum, issue) => sum + (issue.budget || 0), 0);
  const totalStoryPoints = groupIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
  
  // Calculate total time spent and original estimate
  const totalTimeSpent = groupIssues.reduce((sum, issue) => sum + (issue.timeSpent || 0), 0);
  const totalOriginalEstimate = groupIssues.reduce((sum, issue) => sum + (issue.originalEstimate || 0), 0);
  
  // Calculate average time efficiency (timeSpent / originalEstimate)
  const timeEfficiencyItems = groupIssues.filter(issue => issue.originalEstimate && issue.originalEstimate > 0);
  const avgTimeEfficiency = timeEfficiencyItems.length > 0 
    ? timeEfficiencyItems.reduce((sum, issue) => sum + ((issue.timeSpent || 0) / issue.originalEstimate), 0) / timeEfficiencyItems.length
    : 0;
    
  // Calculate average slippage days for completed items
  const completedItems = groupIssues.filter(issue => issue.actualDueDate);
  const avgSlippageDays = completedItems.length > 0
    ? completedItems.reduce((sum, issue) => {
        const target = new Date(issue.targetDate);
        const actual = new Date(issue.actualDueDate);
        return sum + Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / completedItems.length
    : 0;
  return {
    todoCount,
    inProgressCount, 
    doneCount,
    completionPercentage,
    totalCount: groupIssues.length,
    totalComments,
    earliestStart,
    latestDue,
    totalBudget,
    totalStoryPoints,
    avgTimeEfficiency,
    avgSlippageDays,
    totalTimeSpent,
    totalOriginalEstimate
  };
};

const ListView: React.FC = () => {
  const { 
    issues, 
    expandedItems,
    setIssues, 
    toggleExpanded
  } = useListViewStore();

  // Original modal state for charts
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'status' | 'startDate' | 'dueDate' | 'targetDueDate' | 'budget' | 'storyPoints' | 'timeTracking' | 'slippage' | 'dependencies' | 'comments' | null;
    data: any;
    title: string;
    position: { top: number; left: number; width: number; height: number } | null;
    fieldId: string | null; // Track which specific field opened the modal
  }>({
    isOpen: false,
    type: null,
    data: null,
    title: '',
    position: null,
    fieldId: null
  });

  // Cell selection state
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [lastSelectedCell, setLastSelectedCell] = useState<SelectedCell | null>(null);
  const [calculatorPosition, setCalculatorPosition] = useState<{ top: number; left: number } | null>(null);
  const [showComputationPanel, setShowComputationPanel] = useState(false);
  const [computationPanelPosition, setComputationPanelPosition] = useState<{ top: number; left: number } | null>(null);

  // Initialize with mock data
  useEffect(() => {
    setIssues(mockIssues);
  }, [setIssues]);

  // Group issues by assignee
  const groupedIssues = groupIssuesByAssignee(issues);

  // Calculate global project stats
  const globalStats = calculateGroupStats(issues);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate date slippage for an issue
  const calculateSlippage = (issue: any) => {
    if (!issue.actualDueDate) return null;
    
    const target = new Date(issue.targetDate);
    const actual = new Date(issue.actualDueDate);
    const diffDays = Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays,
      isLate: diffDays > 0,
      isEarly: diffDays < 0,
      percentage: Math.round((diffDays / Math.ceil((target.getTime() - new Date(issue.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100)
    };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate time efficiency percentage
  const calculateTimeEfficiency = (issue: any) => {
    if (!issue.originalEstimate || issue.originalEstimate === 0) return null;
    return Math.round(((issue.timeSpent || 0) / issue.originalEstimate) * 100);
  };

  // Calculate variance for a set of values
  const calculateVariance = (values: number[]) => {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  };

  // Cell selection functions
  const createCellId = (issueId: string, fieldName: string): string => {
    return `${issueId}-${fieldName}`;
  };

  const getCellValue = (issue: any, fieldName: string): { value: any; dataType: 'date' | 'number' | 'currency' | 'text'; displayValue: string } => {
    switch (fieldName) {
      case 'startDate':
        return { value: issue.actualStartDate || issue.startDate, dataType: 'date', displayValue: formatDate(issue.actualStartDate || issue.startDate) };
      case 'targetDate':
        return { value: issue.targetDate, dataType: 'date', displayValue: formatDate(issue.targetDate) };
      case 'dueDate':
        return { value: issue.dueDate, dataType: 'date', displayValue: formatDate(issue.dueDate) };
      case 'budget':
        return { value: issue.budget || 0, dataType: 'currency', displayValue: formatCurrency(issue.budget || 0) };
      case 'storyPoints':
        return { value: issue.storyPoints || 0, dataType: 'number', displayValue: (issue.storyPoints || 0).toString() };
      case 'timeTracking':
        return { value: issue.timeSpent || 0, dataType: 'number', displayValue: `${issue.timeSpent || 0}h` };
      case 'slippage':
        const slippage = calculateSlippage(issue);
        return { value: slippage?.days || 0, dataType: 'number', displayValue: slippage ? `${slippage.days > 0 ? '+' : ''}${slippage.days}d` : '-' };
      default:
        return { value: '', dataType: 'text', displayValue: '' };
    }
  };

  const handleCellClick = (
    issue: any, 
    fieldName: string, 
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.stopPropagation();
    
    const cellInfo = getCellValue(issue, fieldName);
    const cellId = createCellId(issue.id, fieldName);
    
    const newCell: SelectedCell = {
      issueId: issue.id,
      fieldName,
      value: cellInfo.value,
      dataType: cellInfo.dataType,
      displayValue: cellInfo.displayValue
    };

    if (event.shiftKey && lastSelectedCell && lastSelectedCell.fieldName === fieldName) {
      // Shift selection - select range in same field only
      handleShiftSelection(newCell, fieldName);
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd selection - toggle individual cell
      handleCtrlSelection(newCell, cellId);
    } else {
      // Regular click - select only this cell
      setSelectedCells([newCell]);
      setLastSelectedCell(newCell);
      updateCalculatorPosition(event.currentTarget);
    }
  };

  const handleShiftSelection = (newCell: SelectedCell, fieldName: string) => {
    if (!lastSelectedCell || lastSelectedCell.fieldName !== fieldName) return;

    // Find all issues in the current view that match the field type
    const allIssuesInField: SelectedCell[] = [];
    
    // Collect all issues from all groups for the specific field
    groupedIssues.forEach(group => {
      group.issues.forEach(issue => {
        const cellInfo = getCellValue(issue, fieldName);
        allIssuesInField.push({
          issueId: issue.id,
          fieldName,
          value: cellInfo.value,
          dataType: cellInfo.dataType,
          displayValue: cellInfo.displayValue
        });
      });
    });

    // Find indices of last selected and current cell
    const lastIndex = allIssuesInField.findIndex(cell => cell.issueId === lastSelectedCell.issueId);
    const currentIndex = allIssuesInField.findIndex(cell => cell.issueId === newCell.issueId);
    
    if (lastIndex === -1 || currentIndex === -1) return;

    // Select range between last and current (inclusive)
    const startIndex = Math.min(lastIndex, currentIndex);
    const endIndex = Math.max(lastIndex, currentIndex);
    const rangeSelection = allIssuesInField.slice(startIndex, endIndex + 1);
    
    // Merge with existing selections (remove duplicates)
    const existingOtherFields = selectedCells.filter(cell => cell.fieldName !== fieldName);
    setSelectedCells([...existingOtherFields, ...rangeSelection]);
    setLastSelectedCell(newCell);
  };

  const handleCtrlSelection = (newCell: SelectedCell, cellId: string) => {
    const existingIndex = selectedCells.findIndex(cell => 
      cell.issueId === newCell.issueId && cell.fieldName === newCell.fieldName
    );
    
    if (existingIndex >= 0) {
      // Remove if already selected
      const newSelection = selectedCells.filter((_, index) => index !== existingIndex);
      setSelectedCells(newSelection);
      if (newSelection.length === 0) {
        setCalculatorPosition(null);
        setLastSelectedCell(null);
      }
    } else {
      // Add to selection only if same data type as existing selections
      if (selectedCells.length === 0 || selectedCells.every(cell => cell.dataType === newCell.dataType)) {
        setSelectedCells([...selectedCells, newCell]);
        setLastSelectedCell(newCell);
      }
    }
  };

  const updateCalculatorPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    const calculatorButtonWidth = 40; // Approximate width of calculator button
    const gap = 8; // Gap between cell and calculator
    const viewportWidth = window.innerWidth;
    const margin = 16; // Minimum margin from viewport edge
    
    // Always try to position calculator to the right of the cell
    let left = rect.right + scrollLeft + gap;
    
    // If calculator would go off the right edge, position it with minimum margin from edge
    if (left + calculatorButtonWidth + margin > viewportWidth) {
      left = viewportWidth - calculatorButtonWidth - margin;
    }
    
    // Ensure calculator doesn't go off screen left
    left = Math.max(margin, left);
    
    setCalculatorPosition({
      top: rect.top + scrollTop,
      left: left
    });
  };

  const isCellSelected = (issueId: string, fieldName: string): boolean => {
    return selectedCells.some(cell => cell.issueId === issueId && cell.fieldName === fieldName);
  };

  const handleCalculatorClick = (event: React.MouseEvent) => {
    if (!calculatorPosition) return;
    
    const computationPanelWidth = 320;
    const gap = 12; // Gap between calculator and computation panel
    const margin = 16; // Minimum margin from viewport edge
    const viewportWidth = window.innerWidth;
    
    // Position computation panel to the right of calculator
    let panelLeft = calculatorPosition.left + 40 + gap; // 40px calculator width
    
    // If panel would go off the right edge, position it to the left of calculator
    if (panelLeft + computationPanelWidth + margin > viewportWidth) {
      panelLeft = calculatorPosition.left - computationPanelWidth - gap;
    }
    
    // Final check to ensure panel doesn't go off screen (left side)
    if (panelLeft < margin) {
      // If it doesn't fit on either side, position it at the right edge with margin
      panelLeft = viewportWidth - computationPanelWidth - margin;
    }
    
    setComputationPanelPosition({
      top: calculatorPosition.top,
      left: panelLeft
    });
    setShowComputationPanel(true);
  };

  const handleClearSelections = () => {
    setSelectedCells([]);
    setLastSelectedCell(null);
    setCalculatorPosition(null);
    setShowComputationPanel(false);
    setComputationPanelPosition(null);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Don't clear if clicking on calculator or computation panel
    if (target.closest('.calculator-button') || target.closest('.computation-panel')) {
      return;
    }
    
    // Don't clear if it's a cell click (handled by cell click handlers)
    if (target.closest('.selectable-cell')) {
      return;
    }
    
    // Clear selections when clicking elsewhere
    handleClearSelections();
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleFieldClick = (
    type: 'status' | 'startDate' | 'dueDate' | 'targetDueDate' | 'budget' | 'storyPoints' | 'timeTracking' | 'slippage' | 'dependencies' | 'comments', 
    data: any, 
    title: string,
    event: React.MouseEvent<HTMLDivElement>,
    fieldId: string
  ) => {
    // If clicking the same field that's currently open, close the chart modal
    if (modalState.isOpen && modalState.fieldId === fieldId) {
      closeModal();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setModalState({
      isOpen: true,
      type,
      data,
      title,
      position: {
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height
      },
      fieldId
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      data: null,
      title: '',
      position: null,
      fieldId: null
    });
  };

  const StatusBar = ({ 
    todoCount, 
    inProgressCount, 
    doneCount, 
    totalCount
  }: { 
    todoCount: number;
    inProgressCount: number;
    doneCount: number;
    totalCount: number;
  }) => {
    const todoPercent = (todoCount / totalCount) * 100;
    const inProgressPercent = (inProgressCount / totalCount) * 100;
    const donePercent = (doneCount / totalCount) * 100;

    return (
      <div className="w-full h-2 bg-[#f1f2f4] rounded-full overflow-hidden">
        <div className="h-full flex">
          <div 
            className="h-full bg-[#8993a4]" 
            style={{ width: `${todoPercent}%` }}
          />
          <div 
            className="h-full bg-[#0052cc]" 
            style={{ width: `${inProgressPercent}%` }}
          />
          <div 
            className="h-full bg-[#00875a]" 
            style={{ width: `${donePercent}%` }}
          />
        </div>
      </div>
    );
  };

  const TrackingIndicator = ({ status, severity }: { status: string; severity: string }) => {
    const getConfig = (severity: string) => {
      switch (severity) {
        case 'high':
          return { 
            color: 'bg-[#de350b]', 
            icon: TrendingDown, 
            textColor: 'text-[#de350b]' 
          };
        case 'medium':
          return { 
            color: 'bg-[#ffab00]', 
            icon: AlertTriangle, 
            textColor: 'text-[#974f0c]' 
          };
        case 'low':
          return { 
            color: 'bg-[#00875a]', 
            icon: CheckCircle2, 
            textColor: 'text-[#00875a]' 
          };
        default:
          return { 
            color: 'bg-[#8993a4]', 
            icon: Minus, 
            textColor: 'text-[#6b778c]' 
          };
      }
    };

    const config = getConfig(severity);
    const Icon = config.icon;

    return (
      <div className="flex items-center space-x-2">
        <Icon className={`w-4 h-4 ${config.textColor}`} />
        <span className={`text-sm font-medium ${config.textColor}`}>
          {status}
        </span>
      </div>
    );
  };

  const renderModalContent = () => {
    if (!modalState.type || !modalState.data) return null;

    switch (modalState.type) {
      case 'status':
        return (
          <StatusChart 
            todoCount={modalState.data.todoCount}
            inProgressCount={modalState.data.inProgressCount}
            doneCount={modalState.data.doneCount}
          />
        );
      case 'startDate':
        return <StartDateChart issues={modalState.data} />;
      case 'dueDate':
        return <DueDateChart issues={modalState.data} />;
      case 'targetDueDate':
        return <TargetDueDateChart issues={modalState.data} />;
      case 'budget':
        return <BudgetChart issues={modalState.data} />;
      case 'storyPoints':
        return <StoryPointsChart issues={modalState.data} />;
      case 'timeTracking':
        return <TimeTrackingChart issues={modalState.data} />;
      case 'slippage':
        return <SlippageChart issues={modalState.data} />;
      case 'dependencies':
        return <DependencyChart issues={modalState.data} />;
      case 'comments':
        return <CommentsAISummary issues={modalState.data} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
    <div className="w-full bg-white rounded-lg shadow-sm border border-[#dfe1e6] overflow-hidden">
      <div className="overflow-x-auto">
        {/* Sticky Table Header */}
        <div className="sticky top-0 z-20 bg-[#f7f8f9] border-b border-[#dfe1e6] min-w-[1600px]">
          <div className="flex">
            <div className="w-10 px-3 py-3 flex items-center justify-center">
              <input 
                type="checkbox" 
                className="rounded border-[#dfe1e6] text-[#0052cc] focus:ring-[#0052cc] focus:ring-offset-0 focus:ring-1" 
              />
            </div>
            <div className="w-80 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide sticky left-0 z-21 bg-[#f7f8f9] border-r border-[#dfe1e6]">
              Work
            </div>
            <div className="w-36 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide">
              Status
            </div>
            <div className="w-32 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide">
              Start Date
            </div>
            <div className="w-32 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide flex items-center space-x-1">
              <span>Target Due</span>
              <Calendar className="w-3 h-3 text-[#6b778c]" />
            </div>
            <div className="w-32 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide">
              Due Date
            </div>
            <div className="w-28 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide">
              Budget
            </div>
            <div className="w-24 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide">
              Story Pts
            </div>
            <div className="w-32 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide">
              Time Track
            </div>
            <div className="w-28 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide flex items-center space-x-1">
              <span>Slippage</span>
              <div className="w-4 h-4 bg-white border border-[#dfe1e6] rounded flex items-center justify-center shadow-sm" title="Computed field">
                <Calculator className="w-3 h-3 text-[#6b778c]" />
              </div>
            </div>
            <div className="w-32 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide">
              Comments
            </div>
            <div className="w-32 px-3 py-3 text-sm font-semibold text-[#42526e] tracking-wide">
              Dependencies
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#f1f2f4] min-w-[1600px]">
          {/* Global Project Roll-up Row */}
          <div className="bg-[#f7f8f9]">
            <div className="flex">
              <div className="w-10 px-3 py-3 flex items-center justify-center">
                {/* No expand/collapse functionality for project summary */}
              </div>
              <div className="w-80 px-3 py-3 flex items-center space-x-2 sticky left-0 z-19 bg-[#f7f8f9] border-r border-[#dfe1e6]">
                <span className="font-medium text-[#42526e]">
                  Summary
                </span>
                <span className="text-sm text-[#6b778c]">
                  {globalStats.totalCount} total work item{globalStats.totalCount === 1 ? '' : 's'}
                </span>
              </div>
              <div 
                className={`w-36 px-3 py-3 flex items-center cursor-pointer transition-colors ${
                  modalState.fieldId === `status-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('status', globalStats, `Summary - Status Overview`, e, `status-global-project`)}
              >
                <StatusBar 
                  todoCount={globalStats.todoCount}
                  inProgressCount={globalStats.inProgressCount}
                  doneCount={globalStats.doneCount}
                  totalCount={globalStats.totalCount}
                />
              </div>
              <div 
                className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] cursor-pointer transition-colors ${
                  modalState.fieldId === `startDate-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('startDate', issues, `Summary - Start Date Timeline`, e, `startDate-global-project`)}
              >
                {formatDate(globalStats.earliestStart.toISOString().split('T')[0])}
              </div>
              <div 
                className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] cursor-pointer transition-colors ${
                  modalState.fieldId === `targetDueDate-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('targetDueDate', issues, `Summary - Target Due Date Timeline`, e, `targetDueDate-global-project`)}
              >
                {formatDate(issues.reduce((earliest, issue) => {
                  const target = new Date(issue.targetDate);
                  return target > earliest ? target : earliest;
                }, new Date(issues[0]?.targetDate || new Date())).toISOString().split('T')[0])}
              </div>
              <div 
                className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] cursor-pointer transition-colors ${
                  modalState.fieldId === `dueDate-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('dueDate', issues, `Summary - Due Date Timeline`, e, `dueDate-global-project`)}
              >
                {formatDate(globalStats.latestDue.toISOString().split('T')[0])}
              </div>
              <div 
                className={`w-28 px-3 py-3 flex items-center text-sm font-semibold text-[#42526e] cursor-pointer transition-colors ${
                  modalState.fieldId === `budget-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('budget', issues, `Summary - Budget Analysis`, e, `budget-global-project`)}
              >
                {formatCurrency(globalStats.totalBudget)}
              </div>
              <div 
                className={`w-24 px-3 py-3 flex items-center text-sm font-semibold text-[#42526e] cursor-pointer transition-colors ${
                  modalState.fieldId === `storyPoints-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('storyPoints', issues, `Summary - Story Points Analysis`, e, `storyPoints-global-project`)}
              >
                {globalStats.totalStoryPoints}
              </div>
              <div 
                className={`w-32 px-3 py-3 flex items-center text-sm text-[#42526e] cursor-pointer transition-colors ${
                  modalState.fieldId === `timeTracking-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('timeTracking', issues, `Summary - Time Usage Analysis`, e, `timeTracking-global-project`)}
              >
                <div className="flex items-center space-x-1">
                  <span className={`font-semibold ${
                    (globalStats.totalTimeSpent / Math.max(globalStats.totalOriginalEstimate, 1)) > 1.2 ? 'text-[#de350b]' :
                    (globalStats.totalTimeSpent / Math.max(globalStats.totalOriginalEstimate, 1)) > 1.0 ? 'text-[#ffab00]' :
                    'text-[#00875a]'
                  }`}>
                    {Math.round((globalStats.totalTimeSpent / Math.max(globalStats.totalOriginalEstimate, 1)) * 100)}%
                  </span>
                  <span className="text-[#6b778c] text-xs">used</span>
                </div>
              </div>
              <div 
                className={`w-28 px-3 py-3 flex items-center text-sm text-[#42526e] cursor-pointer transition-colors ${
                  modalState.fieldId === `slippage-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('slippage', issues, `Summary - Date Slippage Analysis`, e, `slippage-global-project`)}
              >
                <div className="flex items-center space-x-1">
                  <span className={`font-semibold ${
                    globalStats.avgSlippageDays > 3 ? 'text-[#de350b]' :
                    globalStats.avgSlippageDays > 0 ? 'text-[#ffab00]' :
                    globalStats.avgSlippageDays < 0 ? 'text-[#00875a]' :
                    'text-[#6b778c]'
                  }`}>
                    {globalStats.avgSlippageDays > 0 ? '+' : ''}{Math.round(globalStats.avgSlippageDays)}d
                  </span>
                </div>
              </div>
              <div 
                className={`w-32 px-3 py-3 flex items-center space-x-1 cursor-pointer transition-colors ${
                  modalState.fieldId === `comments-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('comments', issues, `Summary - Comments Analysis`, e, `comments-global-project`)}
              >
                <MessageCircle className="w-4 h-4 text-[#6b778c]" />
                <span className="text-sm font-semibold text-[#42526e]">
                  {globalStats.totalComments}
                </span>
              </div>
              <div 
                className={`w-32 px-3 py-3 flex items-center cursor-pointer transition-colors ${
                  modalState.fieldId === `dependencies-global-project` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                }`}
                onClick={(e) => handleFieldClick('dependencies', issues, `Summary - Dependencies Analysis`, e, `dependencies-global-project`)}
              >
                <div className="flex items-center space-x-1">
                  <GitBranch className="w-4 h-4 text-[#6b778c]" />
                  <span className="text-sm font-semibold text-[#42526e]">
                    {issues.reduce((sum, issue) => sum + issue.dependencies.length, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {groupedIssues.map((group) => {
            const stats = calculateGroupStats(group.issues);
            
            return (
              <div key={group.assignee.id}>
                {/* Assignee Group Header */}
                <div className="flex bg-[#fafbfc]">
                  <div className="w-10 px-3 py-3 flex items-center justify-center">
                    <button
                      onClick={() => toggleExpanded(group.assignee.id)}
                      className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#f1f2f4] transition-colors"
                    >
                      {expandedItems.has(group.assignee.id) ? (
                        <ChevronDown className="w-3 h-3 text-[#6b778c]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-[#6b778c]" />
                      )}
                    </button>
                  </div>
                  <div className="w-80 px-3 py-3 flex items-center space-x-2 sticky left-0 z-19 bg-[#fafbfc] border-r border-[#dfe1e6]">
                    <img
                      src={group.assignee.avatar}
                      alt={group.assignee.name}
                      className="w-6 h-6 rounded-full border border-[#dfe1e6]"
                    />
                    <span className="font-medium text-[#42526e]">
                      {group.assignee.name}
                    </span>
                    <span className="text-sm text-[#6b778c]">
                      {group.issues.length} work item{group.issues.length === 1 ? '' : 's'}
                    </span>
                    <Plus className="w-4 h-4 text-[#6b778c] ml-2" />
                  </div>
                  <div 
                    className={`w-36 px-3 py-3 flex items-center cursor-pointer transition-colors ${
                      modalState.fieldId === `status-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('status', stats, `${group.assignee.name} - ${stats.completionPercentage}% done`, e, `status-${group.assignee.id}`)}
                  >
                    <StatusBar 
                      todoCount={stats.todoCount}
                      inProgressCount={stats.inProgressCount}
                      doneCount={stats.doneCount}
                      totalCount={stats.totalCount}
                    />
                  </div>
                  <div 
                    className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] cursor-pointer transition-colors ${
                      modalState.fieldId === `startDate-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('startDate', group.issues, `${group.assignee.name} - Start Date Timeline`, e, `startDate-${group.assignee.id}`)}
                  >
                    {formatDate(stats.earliestStart.toISOString().split('T')[0])}
                  </div>
                  <div 
                    className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] cursor-pointer transition-colors selectable-cell ${
                      modalState.fieldId === `targetDueDate-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('targetDueDate', group.issues, `${group.assignee.name} - Target Due Date Timeline`, e, `targetDueDate-${group.assignee.id}`)}
                  >
                    {formatDate(group.issues.reduce((earliest, issue) => {
                      const target = new Date(issue.targetDate);
                      return target > earliest ? target : earliest;
                    }, new Date(group.issues[0]?.targetDate || new Date())).toISOString().split('T')[0])}
                  </div>
                  <div 
                    className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] cursor-pointer transition-colors ${
                      modalState.fieldId === `dueDate-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('dueDate', group.issues, `${group.assignee.name} - Due Date Timeline`, e, `dueDate-${group.assignee.id}`)}
                  >
                    {formatDate(stats.latestDue.toISOString().split('T')[0])}
                  </div>
                  <div 
                    className={`w-28 px-3 py-3 flex items-center text-sm font-semibold text-[#42526e] cursor-pointer transition-colors ${
                      modalState.fieldId === `budget-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('budget', group.issues, `${group.assignee.name} - Budget Analysis`, e, `budget-${group.assignee.id}`)}
                  >
                    {formatCurrency(stats.totalBudget)}
                  </div>
                  <div 
                    className={`w-24 px-3 py-3 flex items-center text-sm font-semibold text-[#42526e] cursor-pointer transition-colors ${
                      modalState.fieldId === `storyPoints-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('storyPoints', group.issues, `${group.assignee.name} - Story Points Analysis`, e, `storyPoints-${group.assignee.id}`)}
                  >
                    {stats.totalStoryPoints}
                  </div>
                  <div 
                    className={`w-32 px-3 py-3 flex items-center text-sm text-[#42526e] cursor-pointer transition-colors ${
                      modalState.fieldId === `timeTracking-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('timeTracking', group.issues, `${group.assignee.name} - Time Usage Analysis`, e, `timeTracking-${group.assignee.id}`)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className={`font-semibold ${
                        (stats.totalTimeSpent / Math.max(stats.totalOriginalEstimate, 1)) > 1.2 ? 'text-[#de350b]' :
                        (stats.totalTimeSpent / Math.max(stats.totalOriginalEstimate, 1)) > 1.0 ? 'text-[#ffab00]' :
                        'text-[#00875a]'
                      }`}>
                        {Math.round((stats.totalTimeSpent / Math.max(stats.totalOriginalEstimate, 1)) * 100)}%
                      </span>
                      <span className="text-[#6b778c] text-xs">used</span>
                    </div>
                  </div>
                  <div 
                    className={`w-28 px-3 py-3 flex items-center text-sm text-[#42526e] cursor-pointer transition-colors ${
                      modalState.fieldId === `slippage-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('slippage', group.issues, `${group.assignee.name} - Date Slippage Analysis`, e, `slippage-${group.assignee.id}`)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className={`font-semibold ${
                        stats.avgSlippageDays > 3 ? 'text-[#de350b]' :
                        stats.avgSlippageDays > 0 ? 'text-[#ffab00]' :
                        stats.avgSlippageDays < 0 ? 'text-[#00875a]' :
                        'text-[#6b778c]'
                      }`}>
                        {stats.avgSlippageDays > 0 ? '+' : ''}{Math.round(stats.avgSlippageDays)}d
                      </span>
                    </div>
                  </div>
                  <div 
                    className={`w-32 px-3 py-3 flex items-center space-x-1 cursor-pointer transition-colors ${
                      modalState.fieldId === `comments-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('comments', group.issues, `${group.assignee.name} - Comments Analysis`, e, `comments-${group.assignee.id}`)}
                  >
                    <MessageCircle className="w-4 h-4 text-[#6b778c]" />
                    <span className="text-sm font-semibold text-[#42526e]">
                      {stats.totalComments}
                    </span>
                  </div>
                  <div 
                    className={`w-32 px-3 py-3 flex items-center cursor-pointer transition-colors ${
                      modalState.fieldId === `dependencies-${group.assignee.id}` ? 'bg-[#e9f2ff] ring-2 ring-[#0052cc] ring-opacity-20' : 'hover:bg-[#f1f2f4]'
                    }`}
                    onClick={(e) => handleFieldClick('dependencies', group.issues, `${group.assignee.name} - Dependencies Analysis`, e, `dependencies-${group.assignee.id}`)}
                  >
                    <div className="flex items-center space-x-1">
                      <GitBranch className="w-4 h-4 text-[#6b778c]" />
                      <span className="text-sm font-semibold text-[#42526e]">
                        {group.issues.reduce((sum, issue) => sum + issue.dependencies.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Issues */}
                {expandedItems.has(group.assignee.id) && group.issues.map((issue) => {
                  const tracking = calculateTrackingStatus(issue.targetDate, issue.dueDate);
                  const slippage = calculateSlippage(issue);
                  const timeEfficiency = calculateTimeEfficiency(issue);
                  
                  return (
                    <div 
                      key={issue.id}
                      className="flex hover:bg-[#fafbfc] transition-colors"
                    >
                      <div className="w-10 px-3 py-3 flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-[#dfe1e6] text-[#0052cc] focus:ring-[#0052cc] focus:ring-offset-0 focus:ring-1" 
                        />
                      </div>
                      <div className="w-80 px-3 py-3 flex items-center space-x-2 pl-8 sticky left-0 z-19 bg-white border-r border-[#dfe1e6]">
                        <span className="text-[#0052cc] font-mono text-xs font-medium hover:underline cursor-pointer">
                          {issue.key}
                        </span>
                        <span className="text-sm text-[#42526e] truncate">
                          {issue.summary}
                        </span>
                      </div>
                      <div className="w-36 px-3 py-3 flex items-center">
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          issue.status === 'TO DO' ? 'bg-[#dfe1e6] text-[#42526e]' :
                          issue.status === 'IN PROGRESS' ? 'bg-[#deebff] text-[#0052cc]' :
                          'bg-[#e3fcef] text-[#00875a]'
                        }`}>
                          {issue.status === 'TO DO' ? 'To do' : 
                           issue.status === 'IN PROGRESS' ? 'In progress' : 
                           'Done'}
                        </span>
                      </div>
                      <div 
                        className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] selectable-cell transition-colors ${
                          isCellSelected(issue.id, 'startDate') ? 'selected-cell' : 'hover:bg-[#f8f9fa]'
                        }`}
                        onClick={(e) => handleCellClick(issue, 'startDate', e)}
                      >
                        {issue.actualStartDate ? formatDate(issue.actualStartDate) : 'None'}
                      </div>
                      <div 
                        className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] selectable-cell transition-colors ${
                          isCellSelected(issue.id, 'targetDate') ? 'selected-cell' : 'hover:bg-[#f8f9fa]'
                        }`}
                        onClick={(e) => handleCellClick(issue, 'targetDate', e)}
                      >
                        {formatDate(issue.targetDate)}
                      </div>
                      <div 
                        className={`w-32 px-3 py-3 flex items-center text-sm text-[#6b778c] selectable-cell transition-colors ${
                          isCellSelected(issue.id, 'dueDate') ? 'selected-cell' : 'hover:bg-[#f8f9fa]'
                        }`}
                        onClick={(e) => handleCellClick(issue, 'dueDate', e)}
                      >
                        {formatDate(issue.dueDate)}
                      </div>
                      <div 
                        className={`w-28 px-3 py-3 flex items-center text-sm text-[#42526e] selectable-cell transition-colors ${
                          isCellSelected(issue.id, 'budget') ? 'selected-cell' : 'hover:bg-[#f8f9fa]'
                        }`}
                        onClick={(e) => handleCellClick(issue, 'budget', e)}
                      >
                        {issue.budget ? formatCurrency(issue.budget) : '-'}
                      </div>
                      <div 
                        className={`w-24 px-3 py-3 flex items-center text-sm font-semibold text-[#42526e] selectable-cell transition-colors ${
                          isCellSelected(issue.id, 'storyPoints') ? 'selected-cell' : 'hover:bg-[#f8f9fa]'
                        }`}
                        onClick={(e) => handleCellClick(issue, 'storyPoints', e)}
                      >
                        {issue.storyPoints || '-'}
                      </div>
                      <div 
                        className={`w-32 px-3 py-3 flex items-center text-sm text-[#42526e] selectable-cell transition-colors ${
                          isCellSelected(issue.id, 'timeTracking') ? 'selected-cell' : 'hover:bg-[#f8f9fa]'
                        }`}
                        onClick={(e) => handleCellClick(issue, 'timeTracking', e)}
                      >
                        {timeEfficiency !== null ? (
                          <div className="flex items-center space-x-1">
                            <span className={`font-semibold ${
                              (issue.timeSpent || 0) / (issue.originalEstimate || 1) > 1.2 ? 'text-[#de350b]' :
                              (issue.timeSpent || 0) / (issue.originalEstimate || 1) > 1.0 ? 'text-[#ffab00]' :
                              'text-[#00875a]'
                            }`}>
                              {Math.round(((issue.timeSpent || 0) / (issue.originalEstimate || 1)) * 100)}%
                            </span>
                            <span className="text-[#6b778c] text-xs">({issue.timeSpent || 0}h)</span>
                          </div>
                        ) : (
                          <span className="text-[#8993a4]">-</span>
                        )}
                      </div>
                      <div 
                        className={`w-28 px-3 py-3 flex items-center text-sm text-[#42526e] selectable-cell transition-colors ${
                          isCellSelected(issue.id, 'slippage') ? 'selected-cell' : 'hover:bg-[#f8f9fa]'
                        }`}
                        onClick={(e) => handleCellClick(issue, 'slippage', e)}
                      >
                        {slippage ? (
                          <div className="flex items-center space-x-1">
                            <span className={`font-semibold ${
                              slippage.isLate ? 'text-[#de350b]' :
                              slippage.isEarly ? 'text-[#00875a]' :
                              'text-[#6b778c]'
                            }`}>
                              {slippage.days > 0 ? '+' : ''}{slippage.days}d
                            </span>
                            <span className="text-[#6b778c] text-xs">
                              ({slippage.percentage > 0 ? '+' : ''}{slippage.percentage}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#8993a4]">-</span>
                        )}
                      </div>
                      <div 
                        className="w-32 px-3 py-3 flex items-center space-x-1"
                      >
                        <MessageCircle className="w-4 h-4 text-[#6b778c]" />
                        <span className="text-sm text-[#42526e]">
                          {issue.comments > 0 ? `${issue.comments} comments` : 'Add comment'}
                        </span>
                      </div>
                      <div className="w-32 px-3 py-3 flex items-center">
                        {issue.dependencies.length > 0 ? (
                          <div className="flex items-center space-x-1">
                            <GitBranch className="w-4 h-4 text-[#6b778c]" />
                            <span className="text-sm text-[#42526e]">
                              {issue.dependencies.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#8993a4]">None</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculator Button */}
      {selectedCells.length >= 2 && calculatorPosition && (
        <div
          className="calculator-button fixed z-30 transition-all duration-200"
          style={{
            top: calculatorPosition.top + 6, // Slightly closer to cell
            left: calculatorPosition.left
          }}
        >
          <button
            onClick={handleCalculatorClick}
            className="bg-white shadow-lg border border-[#dfe1e6] rounded p-2 hover:shadow-xl transition-all duration-200 group"
            style={{ borderRadius: '3px' }}
          >
            <div className="w-5 h-5 bg-white border border-[#dfe1e6] rounded flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Calculator className="w-4 h-4 text-[#172b4d]" />
            </div>
          </button>
        </div>
      )}

      {/* Computation Panel - Floating */}
      {showComputationPanel && computationPanelPosition && (
        <div
          className="computation-panel fixed bg-white rounded-lg shadow-xl border border-[#dfe1e6] w-[320px] z-40 max-h-[80vh] overflow-hidden flex flex-col"
          style={{
            top: computationPanelPosition.top,
            left: computationPanelPosition.left
          }}
        >
          <div className="flex-1 p-4 overflow-y-auto">
            <ComputationPanel 
              selectedCells={selectedCells}
              onClearSelections={handleClearSelections}
            />
          </div>
        </div>
      )}

      {/* Chart Modal */}
      <ChartModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        position={modalState.position}
        chartType={modalState.type}
      >
        {renderModalContent()}
      </ChartModal>
    </div>
    </div>
  );
};

export default ListView;