import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronDown, BarChart3, X } from 'lucide-react';
import { Issue, WorkStream, Assignee, SelectedCell } from '../../types';
import { mockIssues, mockWorkStreams, groupIssuesByAssignee, calculateAggregatedMetrics } from '../../mock/mockData';
import StatusChart from '../Charts/StatusChart';
import StartDateChart from '../Charts/StartDateChart';
import DueDateChart from '../Charts/DueDateChart';
import TargetDueDateChart from '../Charts/TargetDueDateChart';
import BudgetChart from '../Charts/BudgetChart';
import StoryPointsChart from '../Charts/StoryPointsChart';
import TimeTrackingChart from '../Charts/TimeTrackingChart';
import SlippageChart from '../Charts/SlippageChart';
import DependencyChart from '../Charts/DependencyChart';
import CommentsAISummary from '../Charts/CommentsAISummary';
import ChartModal from '../Charts/ChartModal';
import ComputationPanel from '../ComputationPanel';

const ListView: React.FC = () => {
  const [issues] = useState<Issue[]>(mockIssues);
  const [workStreams] = useState<WorkStream[]>(mockWorkStreams);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5']));
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [chartModal, setChartModal] = useState<{
    isOpen: boolean;
    title: string;
    position: { top: number; left: number; width: number; height: number } | null;
    chartType: 'status' | 'startDate' | 'dueDate' | 'targetDueDate' | 'budget' | 'storyPoints' | 'timeTracking' | 'slippage' | 'dependencies' | 'comments' | null;
    issues: Issue[];
  }>({
    isOpen: false,
    title: '',
    position: null,
    chartType: null,
    issues: []
  });

  const groupedIssues = groupIssuesByAssignee(issues);

  const toggleGroup = (assigneeId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assigneeId)) {
        newSet.delete(assigneeId);
      } else {
        newSet.add(assigneeId);
      }
      return newSet;
    });
  };

  const handleCellClick = useCallback((event: React.MouseEvent, issueId: string, fieldName: string, value: any, dataType: 'date' | 'number' | 'currency' | 'text', displayValue: string) => {
    event.preventDefault();
    event.stopPropagation();

    const newCell: SelectedCell = {
      issueId,
      fieldName,
      value,
      dataType,
      displayValue
    };

    if (event.ctrlKey || event.metaKey) {
      // Multi-select mode
      setSelectedCells(prev => {
        const existingIndex = prev.findIndex(cell => 
          cell.issueId === issueId && cell.fieldName === fieldName
        );
        
        if (existingIndex >= 0) {
          // Remove if already selected
          return prev.filter((_, index) => index !== existingIndex);
        } else {
          // Add to selection
          return [...prev, newCell];
        }
      });
    } else {
      // Single select mode
      setSelectedCells([newCell]);
    }
  }, []);

  const isCellSelected = useCallback((issueId: string, fieldName: string) => {
    return selectedCells.some(cell => cell.issueId === issueId && cell.fieldName === fieldName);
  }, [selectedCells]);

  const clearSelections = useCallback(() => {
    setSelectedCells([]);
  }, []);

  const handleChartClick = (event: React.MouseEvent, chartType: 'status' | 'startDate' | 'dueDate' | 'targetDueDate' | 'budget' | 'storyPoints' | 'timeTracking' | 'slippage' | 'dependencies' | 'comments', title: string, issues: Issue[]) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setChartModal({
      isOpen: true,
      title,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      chartType,
      issues
    });
  };

  const closeChartModal = () => {
    setChartModal({
      isOpen: false,
      title: '',
      position: null,
      chartType: null,
      issues: []
    });
  };

  const renderChart = (chartType: string, issues: Issue[]) => {
    switch (chartType) {
      case 'status':
        const todoCount = issues.filter(i => i.status === 'TO DO').length;
        const inProgressCount = issues.filter(i => i.status === 'IN PROGRESS').length;
        const doneCount = issues.filter(i => i.status === 'DONE').length;
        return <StatusChart todoCount={todoCount} inProgressCount={inProgressCount} doneCount={doneCount} />;
      case 'startDate':
        return <StartDateChart issues={issues} />;
      case 'dueDate':
        return <DueDateChart issues={issues} />;
      case 'targetDueDate':
        return <TargetDueDateChart issues={issues} />;
      case 'budget':
        return <BudgetChart issues={issues} />;
      case 'storyPoints':
        return <StoryPointsChart issues={issues} />;
      case 'timeTracking':
        return <TimeTrackingChart issues={issues} />;
      case 'slippage':
        return <SlippageChart issues={issues} />;
      case 'dependencies':
        return <DependencyChart issues={issues} />;
      case 'comments':
        return <CommentsAISummary issues={issues} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours}h`;
  };

  const getWorkStreamColor = (workStreamId: string) => {
    const workStream = workStreams.find(ws => ws.id === workStreamId);
    if (!workStream) return 'bg-gray-100 text-gray-800';
    
    switch (workStream.color) {
      case 'pink': return 'bg-pink-100 text-pink-800';
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'orange': return 'bg-orange-100 text-orange-800';
      case 'purple': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkStreamName = (workStreamId: string) => {
    const workStream = workStreams.find(ws => ws.id === workStreamId);
    return workStream?.name || 'Unknown';
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${selectedCells.length > 0 ? 'mr-80' : ''}`}>
        <div className="bg-white rounded-lg shadow-sm border border-[#dfe1e6] overflow-hidden">
          {/* Header */}
          <div className="bg-[#f7f8f9] px-4 py-3 border-b border-[#dfe1e6]">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-[#6b778c] uppercase tracking-wider">
              <div className="col-span-3">Issue</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-center">Start</div>
              <div className="col-span-1 text-center">Due</div>
              <div className="col-span-1 text-center">Target</div>
              <div className="col-span-1 text-center">Budget</div>
              <div className="col-span-1 text-center">Points</div>
              <div className="col-span-1 text-center">Time</div>
              <div className="col-span-1 text-center">Slip</div>
              <div className="col-span-1 text-center">Deps</div>
              <div className="col-span-1 text-center">Comments</div>
            </div>
          </div>

          {/* Content */}
          <div className="divide-y divide-[#f1f2f4]">
            {groupedIssues.map(({ assignee, issues: assigneeIssues }) => {
              const isExpanded = expandedGroups.has(assignee.id);
              const metrics = calculateAggregatedMetrics(assigneeIssues);
              
              return (
                <div key={assignee.id}>
                  {/* Assignee Header Row */}
                  <div className="bg-[#fafbfc] hover:bg-[#f7f8f9] transition-colors">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                      <div className="col-span-3 flex items-center space-x-3">
                        <button
                          onClick={() => toggleGroup(assignee.id)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#6b778c]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#6b778c]" />
                          )}
                        </button>
                        <img
                          src={assignee.avatar}
                          alt={assignee.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-[#172b4d] text-sm">{assignee.name}</div>
                          <div className="text-xs text-[#6b778c]">{assigneeIssues.length} items</div>
                        </div>
                      </div>
                      
                      {/* Status Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'status', `${assignee.name} - Status`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Start Date Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'startDate', `${assignee.name} - Start Dates`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Due Date Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'dueDate', `${assignee.name} - Due Dates`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Target Date Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'targetDueDate', `${assignee.name} - Target Dates`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Budget Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'budget', `${assignee.name} - Budget`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Story Points Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'storyPoints', `${assignee.name} - Story Points`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Time Tracking Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'timeTracking', `${assignee.name} - Time Tracking`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Slippage Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'slippage', `${assignee.name} - Slippage`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Dependencies Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'dependencies', `${assignee.name} - Dependencies`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>

                      {/* Comments Chart */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => handleChartClick(e, 'comments', `${assignee.name} - Comments`, assigneeIssues)}
                          className="p-1 rounded hover:bg-[#f1f2f4] transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-[#6b778c]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Individual Issues */}
                  {isExpanded && assigneeIssues.map((issue) => (
                    <div key={issue.id} className="hover:bg-[#fafbfc] transition-colors">
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                        {/* Issue Details */}
                        <div className="col-span-3 pl-8">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-mono text-[#0052cc] font-medium">{issue.key}</span>
                                {issue.workStream && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getWorkStreamColor(issue.workStream)}`}>
                                    {getWorkStreamName(issue.workStream)}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-[#172b4d] line-clamp-2">{issue.summary}</div>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'status', issue.status, 'text', issue.status)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors selectable-cell ${
                              isCellSelected(issue.id, 'status') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            } ${
                              issue.status === 'DONE' ? 'bg-[#e3fcef] text-[#00875a]' :
                              issue.status === 'IN PROGRESS' ? 'bg-[#deebff] text-[#0052cc]' :
                              'bg-[#f4f5f7] text-[#6b778c]'
                            }`}
                          >
                            {issue.status === 'TO DO' ? 'To Do' : 
                             issue.status === 'IN PROGRESS' ? 'In Progress' : 
                             'Done'}
                          </button>
                        </div>

                        {/* Start Date */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'startDate', issue.startDate, 'date', formatDate(issue.startDate))}
                            className={`text-xs text-[#6b778c] hover:text-[#42526e] transition-colors selectable-cell px-2 py-1 rounded ${
                              isCellSelected(issue.id, 'startDate') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            }`}
                          >
                            {formatDate(issue.startDate)}
                          </button>
                        </div>

                        {/* Due Date */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'dueDate', issue.dueDate, 'date', formatDate(issue.dueDate))}
                            className={`text-xs text-[#6b778c] hover:text-[#42526e] transition-colors selectable-cell px-2 py-1 rounded ${
                              isCellSelected(issue.id, 'dueDate') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            }`}
                          >
                            {formatDate(issue.dueDate)}
                          </button>
                        </div>

                        {/* Target Date */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'targetDate', issue.targetDate, 'date', formatDate(issue.targetDate))}
                            className={`text-xs text-[#6b778c] hover:text-[#42526e] transition-colors selectable-cell px-2 py-1 rounded ${
                              isCellSelected(issue.id, 'targetDate') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            }`}
                          >
                            {formatDate(issue.targetDate)}
                          </button>
                        </div>

                        {/* Budget */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'budget', issue.budget || 0, 'currency', formatCurrency(issue.budget || 0))}
                            className={`text-xs text-[#6b778c] hover:text-[#42526e] transition-colors selectable-cell px-2 py-1 rounded ${
                              isCellSelected(issue.id, 'budget') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            }`}
                          >
                            {formatCurrency(issue.budget || 0)}
                          </button>
                        </div>

                        {/* Story Points */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'storyPoints', issue.storyPoints || 0, 'number', (issue.storyPoints || 0).toString())}
                            className={`text-xs text-[#6b778c] hover:text-[#42526e] transition-colors selectable-cell px-2 py-1 rounded ${
                              isCellSelected(issue.id, 'storyPoints') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            }`}
                          >
                            {issue.storyPoints || 0}
                          </button>
                        </div>

                        {/* Time Tracking */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'timeSpent', issue.timeSpent || 0, 'number', formatHours(issue.timeSpent || 0))}
                            className={`text-xs text-[#6b778c] hover:text-[#42526e] transition-colors selectable-cell px-2 py-1 rounded ${
                              isCellSelected(issue.id, 'timeSpent') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            }`}
                          >
                            {formatHours(issue.timeSpent || 0)}
                          </button>
                        </div>

                        {/* Slippage */}
                        <div className="col-span-1 text-center">
                          {issue.actualDueDate ? (
                            <button
                              onClick={(e) => {
                                const target = new Date(issue.targetDate);
                                const actual = new Date(issue.actualDueDate!);
                                const slippage = Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
                                handleCellClick(e, issue.id, 'slippage', slippage, 'number', `${slippage > 0 ? '+' : ''}${slippage}d`);
                              }}
                              className={`text-xs transition-colors selectable-cell px-2 py-1 rounded ${
                                isCellSelected(issue.id, 'slippage') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                              } ${
                                (() => {
                                  const target = new Date(issue.targetDate);
                                  const actual = new Date(issue.actualDueDate!);
                                  const slippage = Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
                                  return slippage > 0 ? 'text-[#de350b]' : slippage < 0 ? 'text-[#00875a]' : 'text-[#6b778c]';
                                })()
                              }`}
                            >
                              {(() => {
                                const target = new Date(issue.targetDate);
                                const actual = new Date(issue.actualDueDate!);
                                const slippage = Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
                                return `${slippage > 0 ? '+' : ''}${slippage}d`;
                              })()}
                            </button>
                          ) : (
                            <span className="text-xs text-[#6b778c]">-</span>
                          )}
                        </div>

                        {/* Dependencies */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'dependencies', issue.dependencies.length, 'number', issue.dependencies.length.toString())}
                            className={`text-xs text-[#6b778c] hover:text-[#42526e] transition-colors selectable-cell px-2 py-1 rounded ${
                              isCellSelected(issue.id, 'dependencies') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            }`}
                          >
                            {issue.dependencies.length}
                          </button>
                        </div>

                        {/* Comments */}
                        <div className="col-span-1 text-center">
                          <button
                            onClick={(e) => handleCellClick(e, issue.id, 'comments', issue.comments, 'number', issue.comments.toString())}
                            className={`text-xs text-[#6b778c] hover:text-[#42526e] transition-colors selectable-cell px-2 py-1 rounded ${
                              isCellSelected(issue.id, 'comments') ? 'selected-cell' : 'hover:bg-[#f1f2f4]'
                            }`}
                          >
                            {issue.comments}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Computation Panel */}
      {selectedCells.length > 0 && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-[#dfe1e6] shadow-lg z-40 overflow-y-auto">
          <div className="p-4">
            <ComputationPanel 
              selectedCells={selectedCells}
              onClearSelections={clearSelections}
            />
          </div>
        </div>
      )}

      {/* Chart Modal */}
      <ChartModal
        isOpen={chartModal.isOpen}
        onClose={closeChartModal}
        title={chartModal.title}
        position={chartModal.position}
        chartType={chartModal.chartType}
      >
        {chartModal.chartType && renderChart(chartModal.chartType, chartModal.issues)}
      </ChartModal>
    </div>
  );
};

export default ListView;