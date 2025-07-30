import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Target, Clock, TrendingUp, Calendar, AlertTriangle, Users } from 'lucide-react';
import { Issue } from '../../types';
import DateLineChart from './DateLineChart';

interface StartDateChartProps {
  issues: Issue[];
}

const StartDateChart: React.FC<StartDateChartProps> = ({ issues }) => {
  const [viewMode, setViewMode] = useState<'insights' | 'calendar'>('insights');
  
  // Count issues without actual start dates
  const missingStartDates = useMemo(() => {
    return issues.filter(issue => !issue.actualStartDate || issue.actualStartDate === '').length;
  }, [issues]);

  // Calculate executive insights
  const executiveInsights = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const missingAssignee = issues.filter(issue => !issue.assignee || !issue.assignee.id).length;
    const missingStartDates = issues.filter(issue => !issue.actualStartDate || issue.actualStartDate === '').length;
    const notStartedYet = issues.filter(issue => {
      const startDate = new Date(issue.startDate);
      return startDate > today && issue.status === 'TO DO';
    }).length;
    
    const delayedStart = issues.filter(issue => {
      const startDate = new Date(issue.startDate);
      return startDate < today && issue.status === 'TO DO' && (!issue.actualStartDate || issue.actualStartDate === '');
    }).length;
    
    // Calculate story points for delayed items
    const delayedStoryPoints = issues
      .filter(issue => {
        const startDate = new Date(issue.startDate);
        return startDate < today && issue.status === 'TO DO' && (!issue.actualStartDate || issue.actualStartDate === '');
      })
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    
    // Calculate effort for delayed items
    const delayedEffort = issues
      .filter(issue => {
        const startDate = new Date(issue.startDate);
        return startDate < today && issue.status === 'TO DO' && (!issue.actualStartDate || issue.actualStartDate === '');
      })
      .reduce((sum, issue) => sum + (issue.effort || 0), 0);
    
    // Team capacity analysis
    const assigneeWorkload = issues.reduce((acc, issue) => {
      if (!issue.assignee?.id) return acc;
      if (!acc[issue.assignee.id]) {
        acc[issue.assignee.id] = {
          assignee: issue.assignee,
          totalItems: 0,
          notStarted: 0,
          delayed: 0,
          storyPoints: 0
        };
      }
      acc[issue.assignee.id].totalItems++;
      acc[issue.assignee.id].storyPoints += issue.storyPoints || 0;
      
      const startDate = new Date(issue.startDate);
      if (startDate < today && issue.status === 'TO DO' && (!issue.actualStartDate || issue.actualStartDate === '')) {
        acc[issue.assignee.id].delayed++;
      } else if (issue.status === 'TO DO') {
        acc[issue.assignee.id].notStarted++;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return {
      missingAssignee,
      missingStartDates,
      notStartedYet,
      delayedStart,
      delayedStoryPoints,
      delayedEffort,
      assigneeWorkload: Object.values(assigneeWorkload),
      healthScore: Math.round((1 - (delayedStart + missingStartDates + missingAssignee) / issues.length) * 100)
    };
  }, [issues]);

  // Find the earliest start date to focus on by default
  const defaultMonth = useMemo(() => {
    if (issues.length === 0) return new Date();
    
    const earliestDate = issues.reduce((earliest, issue) => {
      const startDate = new Date(issue.startDate);
      return startDate < earliest ? startDate : earliest;
    }, new Date(issues[0].startDate));
    
    return new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
  }, [issues]);

  const [currentMonth, setCurrentMonth] = useState(defaultMonth);

  // Process issues into daily distribution and find absolute earliest
  const distributionData = useMemo(() => {
    const startDates: Record<string, Issue[]> = {};
    const lineChartData: Array<{
      day: number;
      date: string;
      count: number;
      isMonthStart?: boolean;
      monthLabel?: string;
    }> = [];
    let absoluteEarliest = '';

    if (issues.length > 0) {
      // Find absolute earliest date
      const earliestDate = issues.reduce((earliest, issue) => {
        const startDate = new Date(issue.startDate);
        return startDate < earliest ? startDate : earliest;
      }, new Date(issues[0].startDate));
      
      absoluteEarliest = earliestDate.toDateString();

      // Group by start date
      issues.forEach(issue => {
        const startDate = new Date(issue.startDate);
        const dateStr = startDate.toDateString();
        
        if (!startDates[dateStr]) startDates[dateStr] = [];
        startDates[dateStr].push(issue);
      });
      
      // Prepare line chart data
      const startDate = new Date(earliestDate);
      const today = new Date();
      const endDate = new Date(Math.max(today.getTime(), ...issues.map(i => new Date(i.dueDate).getTime())));
      
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
          count: startDates[dateStr]?.length || 0,
          isMonthStart,
          monthLabel
        });
      }
    }

    return { startDates, absoluteEarliest, lineChartData };
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
    const issues = distributionData.startDates[dateStr] || [];
    const isAbsoluteEarliest = dateStr === distributionData.absoluteEarliest;
    return { issues, count: issues.length, isAbsoluteEarliest };
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatMonth = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateToEarliestDate = () => {
    if (distributionData.absoluteEarliest) {
      const earliestDate = new Date(distributionData.absoluteEarliest);
      setCurrentMonth(new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1));
    }
  };

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
                  onClick={navigateToEarliestDate}
                  className="flex items-center space-x-1.5 hover:bg-gray-50 rounded px-1 py-0.5 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 text-xs font-medium hover:text-gray-800">Earliest</span>
                </button>
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full"></div>
                  <span className="text-gray-600 text-xs font-medium">Other</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-2">
          {viewMode === 'insights' ? (
            <div className="space-y-3">
              {/* Simplified Action Cards */}
              {executiveInsights.missingStartDates > 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Missing Start Dates</div>
                        <div className="text-xs text-gray-600">{executiveInsights.missingStartDates} items need scheduling</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                      Request assignees to schedule
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
                      Assign Work
                    </button>
                  </div>
                </div>
              )}
              
              {executiveInsights.missingStartDates === 0 && executiveInsights.missingAssignee === 0 && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                        <Target className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">All Clear</div>
                        <div className="text-xs text-gray-600">All items are ready to start</div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                      View Timeline
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
                const { count, isAbsoluteEarliest } = getDayData(date);
                const isInCurrentMonth = isCurrentMonth(date);
                const isTodayDate = isToday(date);
                const hasData = count > 0;

                return (
                  <div
                    key={index}
                    className={`relative h-8 rounded transition-all duration-200 group cursor-pointer ${
                      isInCurrentMonth 
                        ? 'hover:bg-gray-50 hover:shadow-sm' 
                        : ''
                    } ${isTodayDate ? 'bg-blue-50 ring-2 ring-blue-200' : ''}`}
                  >
                    {/* Date number */}
                    <div className={`absolute top-1 left-2 text-xs font-medium transition-colors ${
                      isTodayDate 
                        ? 'text-blue-600 font-bold' 
                        : isInCurrentMonth 
                          ? 'text-gray-700 group-hover:text-gray-900' 
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
                              isAbsoluteEarliest 
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
                        </div>
                      </div>
                    )}

                    {/* Modern hover tooltip */}
                    {hasData && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <div 
                          className="absolute bg-gray-900 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap"
                          style={{
                            top: '-40px',
                            left: index % 7 < 2 ? '0px' : index % 7 > 4 ? 'auto' : '50%',
                            right: index % 7 > 4 ? '0px' : 'auto',
                            transform: index % 7 >= 2 && index % 7 <= 4 ? 'translateX(-50%)' : 'none'
                          }}
                        >
                          <div className="font-medium">{count} item{count === 1 ? '' : 's'} start{count === 1 ? 's' : ''}</div>
                          {isAbsoluteEarliest && (
                            <div className="text-blue-300 text-xs">Project earliest</div>
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

export default StartDateChart;