import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Target, Clock, TrendingUp, Calendar, AlertTriangle, Users } from 'lucide-react';
import { Issue } from '../../types';
import DateLineChart from './DateLineChart';

interface DueDateChartProps {
  issues: Issue[];
}

const DueDateChart: React.FC<DueDateChartProps> = ({ issues }) => {
  const [viewMode, setViewMode] = useState<'insights' | 'calendar'>('insights');
  
  // Count issues without actual due dates
  const missingDueDates = useMemo(() => {
    return issues.filter(issue => !issue.dueDate || issue.dueDate === '').length;
  }, [issues]);

  // Calculate executive insights
  const executiveInsights = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const missingDueDates = issues.filter(issue => !issue.dueDate || issue.dueDate === '').length;
    const missingAssignee = issues.filter(issue => !issue.assignee || !issue.assignee.id).length;
    const overdue = issues.filter(issue => {
      const dueDate = new Date(issue.dueDate);
      return dueDate < today && issue.status !== 'DONE';
    }).length;
    
    const dueThisWeek = issues.filter(issue => {
      const dueDate = new Date(issue.dueDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);
      return dueDate >= today && dueDate <= weekFromNow && issue.status !== 'DONE';
    }).length;
    
    const atRisk = issues.filter(issue => {
      const dueDate = new Date(issue.dueDate);
      const targetDate = new Date(issue.targetDate);
      return dueDate <= targetDate && issue.status === 'IN PROGRESS';
    }).length;
    
    // Calculate story points for overdue items
    const overdueStoryPoints = issues
      .filter(issue => {
        const dueDate = new Date(issue.dueDate);
        return dueDate < today && issue.status !== 'DONE';
      })
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    
    // Calculate effort for overdue items
    const overdueEffort = issues
      .filter(issue => {
        const dueDate = new Date(issue.dueDate);
        return dueDate < today && issue.status !== 'DONE';
      })
      .reduce((sum, issue) => sum + (issue.effort || 0), 0);
    
    // Team risk analysis
    const assigneeRisk = issues.reduce((acc, issue) => {
      if (!issue.assignee?.id) return acc;
      if (!acc[issue.assignee.id]) {
        acc[issue.assignee.id] = {
          assignee: issue.assignee,
          totalItems: 0,
          overdue: 0,
          dueThisWeek: 0,
          atRisk: 0,
          storyPoints: 0
        };
      }
      acc[issue.assignee.id].totalItems++;
      acc[issue.assignee.id].storyPoints += issue.storyPoints || 0;
      
      const dueDate = new Date(issue.dueDate);
      const targetDate = new Date(issue.targetDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);
      
      if (dueDate < today && issue.status !== 'DONE') {
        acc[issue.assignee.id].overdue++;
      } else if (dueDate >= today && dueDate <= weekFromNow && issue.status !== 'DONE') {
        acc[issue.assignee.id].dueThisWeek++;
      }
      
      if (dueDate <= targetDate && issue.status === 'IN PROGRESS') {
        acc[issue.assignee.id].atRisk++;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return {
      missingAssignee,
      missingDueDates,
      overdue,
      dueThisWeek,
      atRisk,
      overdueStoryPoints,
      overdueEffort,
      assigneeRisk: Object.values(assigneeRisk),
      healthScore: Math.round((1 - (overdue + atRisk + missingAssignee) / issues.length) * 100)
    };
  }, [issues]);

  // Find the latest due date to focus on by default
  const defaultMonth = useMemo(() => {
    if (issues.length === 0) return new Date();
    
    const latestDate = issues.reduce((latest, issue) => {
      const dueDate = new Date(issue.dueDate);
      return dueDate > latest ? dueDate : latest;
    }, new Date(issues[0].dueDate));
    
    return new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
  }, [issues]);

  const [currentMonth, setCurrentMonth] = useState(defaultMonth);

  // Process issues into daily distribution and find absolute latest
  const distributionData = useMemo(() => {
    const dueDates: Record<string, Issue[]> = {};
    const overdueDates: Record<string, Issue[]> = {};
    const lineChartData: Array<{
      day: number;
      date: string;
      count: number;
      overdueCount: number;
      isMonthStart?: boolean;
      monthLabel?: string;
    }> = [];
    const overdueInfo: { count: number; totalDays: number; maxDays: number } = { count: 0, totalDays: 0, maxDays: 0 };
    let absoluteLatest = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (issues.length > 0) {
      // Find absolute latest date
      const latestDate = issues.reduce((latest, issue) => {
        const dueDate = new Date(issue.dueDate);
        return dueDate > latest ? dueDate : latest;
      }, new Date(issues[0].dueDate));
      
      absoluteLatest = latestDate.toDateString();

      // Group by due date
      issues.forEach(issue => {
        const dueDate = new Date(issue.dueDate);
        const dateStr = dueDate.toDateString();
        
        if (!dueDates[dateStr]) dueDates[dateStr] = [];
        dueDates[dateStr].push(issue);

        // Check if overdue
        if (dueDate < today && issue.status !== 'DONE') {
          if (!overdueDates[dateStr]) overdueDates[dateStr] = [];
          overdueDates[dateStr].push(issue);
          
          // Calculate overdue days
          const overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          overdueInfo.count++;
          overdueInfo.totalDays += overdueDays;
          overdueInfo.maxDays = Math.max(overdueInfo.maxDays, overdueDays);
        }
      });
      
      // Prepare line chart data
      const startDate = new Date(Math.min(...issues.map(i => new Date(i.startDate).getTime())));
      const endDate = new Date(latestDate);
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toDateString();
        
        const isMonthStart = currentDate.getDate() === 1;
        const monthLabel = isMonthStart ? currentDate.toLocaleDateString('en-US', { month: 'short' }) : undefined;
        
        lineChartData.push({
          day: i + 1,
          dayOfMonth: currentDate.getDate(),
          date: currentDate.toISOString().split('T')[0],
          count: dueDates[dateStr]?.length || 0,
          overdueCount: overdueDates[dateStr]?.length || 0,
          isMonthStart,
          monthLabel
        });
      }
    }

    return { dueDates, overdueDates, absoluteLatest, overdueInfo, lineChartData };
  }, [issues]);

  // Generate calendar days for current month
  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  }, [currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDayData = (date: Date) => {
    const dateStr = date.toDateString();
    const issues = distributionData.dueDates[dateStr] || [];
    const overdueIssues = distributionData.overdueDates[dateStr] || [];
    const isAbsoluteLatest = dateStr === distributionData.absoluteLatest;
    
    // Calculate overdue days for this specific date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueDays = overdueIssues.length > 0 ? Math.ceil((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return { 
      issues, 
      overdueIssues,
      count: issues.length, 
      overdueCount: overdueIssues.length,
      isAbsoluteLatest,
      overdueDays
    };
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatMonth = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateToLatestDate = () => {
    if (distributionData.absoluteLatest) {
      const latestDate = new Date(distributionData.absoluteLatest);
      setCurrentMonth(new Date(latestDate.getFullYear(), latestDate.getMonth(), 1));
    }
  };

  const totalOverdue = Object.values(distributionData.overdueDates).reduce((sum, issues) => sum + issues.length, 0);

  return (
    <div className="w-full">
      {/* Modern Calendar Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        

        {/* View Mode Tabs */}
        <div className="px-3 py-2 bg-white border-b border-gray-100">
          <div className="flex space-x-1">
            <button
              onClick={() => setViewMode('insights')}
              className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'insights'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Target className="w-3 h-3" />
              <span>Insights</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Navigation - Only show for calendar view */}
        {viewMode === 'calendar' && (
          <div className="px-3 py-2 bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 rounded hover:bg-white hover:shadow-sm transition-all duration-200 group"
                >
                  <ChevronLeft className="w-3 h-3 text-gray-600 group-hover:text-gray-800" />
                </button>
                <span className="font-semibold text-gray-800 text-xs min-w-[100px] text-center">
                  <span className="text-sm">{formatMonth()}</span>
                </span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 rounded hover:bg-white hover:shadow-sm transition-all duration-200 group"
                >
                  <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-gray-800" />
                </button>
              </div>
              
              {/* Simple Legend */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={navigateToLatestDate}
                  className="flex items-center space-x-1.5 hover:bg-gray-50 rounded px-1 py-0.5 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 text-xs font-medium hover:text-gray-800">Latest</span>
                </button>
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full"></div>
                  <span className="text-gray-600 text-xs font-medium">Other</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-gradient-to-br from-red-500 to-red-600 rounded-full"></div>
                  <span className="text-gray-600 text-xs font-medium">Overdue</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-2">
          {viewMode === 'insights' ? (
            <div className="space-y-3">
              {/* Overdue Summary Insights Card */}
              {executiveInsights.overdue > 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          +{distributionData.overdueInfo.totalDays} days late
                        </div>
                        <div className="text-xs text-gray-600">
                          {distributionData.overdueInfo.count} item{distributionData.overdueInfo.count === 1 ? '' : 's'} past due date
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Simplified Action Cards */}
              {executiveInsights.overdue > 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Overdue Items</div>
                        <div className="text-xs text-gray-600">{executiveInsights.overdue} items past due date</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                      Show Overdue
                    </button>
                  </div>
                </div>
              )}
              
              {executiveInsights.missingDueDates > 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Missing Due Dates</div>
                        <div className="text-xs text-gray-600">{executiveInsights.missingDueDates} are missing due dates</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                      Request assignees to schedule
                    </button>
                  </div>
                </div>
              )}
              
              {executiveInsights.dueThisWeek > 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Due This Week</div>
                        <div className="text-xs text-gray-600">{executiveInsights.dueThisWeek} items due soon</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                      Notify Assignees
                    </button>
                  </div>
                </div>
              )}
              
              {executiveInsights.atRisk > 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">At Risk Items</div>
                        <div className="text-xs text-gray-600">{executiveInsights.atRisk} items may slip</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                      Review Status
                    </button>
                  </div>
                </div>
              )}
              
              {executiveInsights.missingAssignee > 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center">
                        <Users className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Unassigned Work</div>
                        <div className="text-xs text-gray-600">{executiveInsights.missingAssignee} items need owners</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                      Assign Items
                    </button>
                  </div>
                </div>
              )}
              
              {executiveInsights.overdue === 0 && executiveInsights.missingDueDates === 0 && executiveInsights.dueThisWeek === 0 && executiveInsights.atRisk === 0 && executiveInsights.missingAssignee === 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                        <Target className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">On Track</div>
                        <div className="text-xs text-gray-600">All deliveries are on schedule</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                      View Calendar
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {/* Weekday headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center py-1 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  {day.substring(0, 3)}
                </div>
              ))}

              {/* Calendar days */}
              {monthDays.map((date, index) => {
                const { count, overdueCount, isAbsoluteLatest, overdueDays } = getDayData(date);
                const isInCurrentMonth = isCurrentMonth(date);
                const isTodayDate = isToday(date);
                const isPast = isPastDate(date);
                const hasData = count > 0;
                const hasOverdue = overdueCount > 0;

                return (
                  <div
                    key={index}
                    className={`relative h-8 rounded transition-all duration-200 group cursor-pointer ${
                      isInCurrentMonth 
                        ? 'hover:bg-gray-50 hover:shadow-sm' 
                        : ''
                    } ${isTodayDate ? 'bg-blue-50 ring-2 ring-blue-200' : ''} ${
                      isPast && isInCurrentMonth ? 'bg-gray-50/50' : ''
                    }`}
                  >
                    {/* Date number */}
                    <div className={`absolute top-1 left-2 text-xs font-medium transition-colors ${
                      isTodayDate 
                        ? 'text-blue-600 font-bold' 
                        : isInCurrentMonth 
                          ? isPast ? 'text-gray-500 group-hover:text-gray-700' : 'text-gray-700 group-hover:text-gray-900'
                          : 'text-gray-400'
                    }`}>
                      {date.getDate()}
                    </div>

                    {/* Issue count indicator */}
                    {hasData && (
                      <div className="absolute inset-0 flex items-center justify-center pt-2">
                        <div className="relative">
                          <div
                            className={`rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 hover:scale-110 hover:shadow-lg transform ${
                              hasOverdue 
                                ? 'bg-gray-400' 
                                : isAbsoluteLatest 
                                  ? 'bg-blue-500 shadow-md' 
                                  : 'bg-gray-400'
                            }`}
                            style={{
                              width: `${Math.max(14, Math.min(20, 12 + (count * 2)))}px`,
                              height: `${Math.max(14, Math.min(20, 12 + (count * 2)))}px`,
                            }}
                          >
                            <span className="text-xs font-bold drop-shadow-sm">
                              {count}
                            </span>
                          </div>
                          
                          {/* Overdue indicator */}
                          {hasOverdue && (
                            <div className="absolute -top-1 -right-1">
                              <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                <AlertCircle className="w-2 h-2 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Modern hover tooltip */}
                    {hasData && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <div 
                          className="absolute bg-gray-900 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap"
                          style={{
                            top: '-48px',
                            left: index % 7 < 2 ? '0px' : index % 7 > 4 ? 'auto' : '50%',
                            right: index % 7 > 4 ? '0px' : 'auto',
                            transform: index % 7 >= 2 && index % 7 <= 4 ? 'translateX(-50%)' : 'none'
                          }}
                        >
                          <div className="font-medium">{count} item{count === 1 ? '' : 's'} due</div>
                          {hasOverdue && (
                            <div className="text-orange-300 text-xs font-medium">
                              {overdueCount} overdue by +{overdueDays} day{overdueDays === 1 ? '' : 's'}
                            </div>
                          )}
                          {isAbsoluteLatest && (
                            <div className="text-blue-300 text-xs">Project deadline</div>
                          )}
                          {/* Tooltip arrow */}
                          <div 
                            className="absolute top-full w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-900"
                            style={{
                              left: index % 7 < 2 ? '12px' : index % 7 > 4 ? 'auto' : '50%',
                              right: index % 7 > 4 ? '12px' : 'auto',
                              transform: index % 7 >= 2 && index % 7 <= 4 ? 'translateX(-50%)' : 'none'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DueDateChart;