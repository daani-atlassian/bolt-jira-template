import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Target, AlertTriangle, CheckCircle2, ExternalLink, Calendar } from 'lucide-react';
import { Issue } from '../../types';

interface TargetDueDateChartProps {
  issues: Issue[];
}

const TargetDueDateChart: React.FC<TargetDueDateChartProps> = ({ issues }) => {
  const [displayedCount, setDisplayedCount] = useState(3);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  // Find the latest target date to display
  const latestTargetDate = useMemo(() => {
    if (issues.length === 0) return null;
    
    const latestDate = issues.reduce((latest, issue) => {
      const targetDate = new Date(issue.targetDate);
      return targetDate > latest ? targetDate : latest;
    }, new Date(issues[0].targetDate));
    
    return latestDate;
  }, [issues]);

  // Calculate on-track vs off-track status
  const trackingData = useMemo(() => {
    const itemsWithTargets = issues.filter(issue => issue.targetDate);
    
    const analysisResults = itemsWithTargets.map(issue => {
      const startDate = new Date(issue.startDate);
      const targetDate = new Date(issue.targetDate);
      const dueDate = new Date(issue.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const plannedDuration = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalDuration = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate typical duration needed based on story points (2 days per point baseline)
      const typicalDaysPerPoint = 2;
      const expectedDuration = (issue.storyPoints || 1) * typicalDaysPerPoint;
      
      // Determine if on-track or off-track
      let status: 'on-track' | 'off-track' = 'on-track';
      let reason = 'On target';
      let daysOverdue = 0;
      
      // Check for compressed timeline
      if (plannedDuration < expectedDuration * 0.8) {
        status = 'off-track';
        reason = `Compressed timeline`;
      }
      
      // Check if target date is in the past and not completed
      if (targetDate < today && issue.status !== 'DONE') {
        status = 'off-track';
        daysOverdue = Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
        reason = `+${daysOverdue}d`;
      }
      
      // Check if no assignee
      if (!issue.assignee || !issue.assignee.id) {
        status = 'off-track';
        reason = 'No assignee';
      }
      
      return {
        issue,
        status,
        reason,
        daysOverdue,
        plannedDuration,
        expectedDuration,
        targetDate: issue.targetDate
      };
    });
    
    const onTrackCount = analysisResults.filter(item => item.status === 'on-track').length;
    const offTrackCount = analysisResults.filter(item => item.status === 'off-track').length;
    const totalTracked = analysisResults.length;
    const missingTargets = issues.length - totalTracked;
    
    return {
      onTrackCount,
      offTrackCount,
      totalTracked,
      missingTargets,
      items: analysisResults,
      onTrackPercentage: totalTracked > 0 ? Math.round((onTrackCount / totalTracked) * 100) : 0
    };
  }, [issues]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleItemClick = (issueKey: string) => {
    // Simulate opening in new tab - in a real app this would navigate to the issue
    const url = `https://company.atlassian.net/browse/${issueKey}`;
    window.open(url, '_blank');
  };

  // Get sorted off-track items for display
  const offTrackItems = trackingData.items
    .filter(item => item.status === 'off-track')
    .sort((a, b) => {
      // Sort by days overdue (highest first), then by target date
      if (a.daysOverdue !== b.daysOverdue) {
        return b.daysOverdue - a.daysOverdue;
      }
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });

  // Infinite scroll implementation
  const loadMoreItems = useCallback(() => {
    if (loadingMoreRef.current) return;
    
    loadingMoreRef.current = true;
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 8, offTrackItems.length));
      loadingMoreRef.current = false;
    }, 100);
  }, [offTrackItems.length]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || loadingMoreRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20px threshold

    if (isNearBottom && displayedCount < offTrackItems.length) {
      loadMoreItems();
    }
  }, [displayedCount, offTrackItems.length, loadMoreItems]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const displayedItems = offTrackItems.slice(0, displayedCount);
  const hasMoreItems = displayedCount < offTrackItems.length;

  return (
    <div className="w-full space-y-4">
      {/* Unified Tracking Chart with Pie Chart */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[#172b4d]">Target Status</div>
        <div className="flex items-center space-x-4">
          {/* Pie Chart */}
          <div className="flex-shrink-0">
            <svg width="70" height="70" viewBox="0 0 70 70">
              {trackingData.totalTracked > 0 && (
                <>
                  <path
                    d={`M 35 35 L 35 7 A 28 28 0 ${trackingData.onTrackCount / trackingData.totalTracked > 0.5 ? 1 : 0} 1 ${35 + 28 * Math.cos(2 * Math.PI * trackingData.onTrackCount / trackingData.totalTracked - Math.PI/2)} ${35 + 28 * Math.sin(2 * Math.PI * trackingData.onTrackCount / trackingData.totalTracked - Math.PI/2)} Z`}
                    fill="#00875a"
                    className="transition-all duration-300 hover:opacity-80"
                  />
                  {trackingData.offTrackCount > 0 && (
                    <path
                      d={`M 35 35 L ${35 + 28 * Math.cos(2 * Math.PI * trackingData.onTrackCount / trackingData.totalTracked - Math.PI/2)} ${35 + 28 * Math.sin(2 * Math.PI * trackingData.onTrackCount / trackingData.totalTracked - Math.PI/2)} A 28 28 0 ${trackingData.offTrackCount / trackingData.totalTracked > 0.5 ? 1 : 0} 1 35 7 Z`}
                      fill="#de350b"
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  )}
                </>
              )}
              {/* Center circle for donut effect */}
              <circle cx="35" cy="35" r="18" fill="white" />
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-[#00875a] rounded-full"></div>
                <span className="text-xs text-[#6b778c]">On track</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[#42526e]">
                  {trackingData.onTrackCount}
                </div>
                <div className="text-xs text-[#6b778c]">
                  {trackingData.totalTracked > 0 ? Math.round((trackingData.onTrackCount / trackingData.totalTracked) * 100) : 0}%
                </div>
              </div>
            </div>
            
            {trackingData.offTrackCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-[#de350b] rounded-full"></div>
                  <span className="text-xs text-[#6b778c]">Off track</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#42526e]">
                    {trackingData.offTrackCount}
                  </div>
                  <div className="text-xs text-[#6b778c]">
                    {Math.round((trackingData.offTrackCount / trackingData.totalTracked) * 100)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delayed Items List with Pagination */}
      {offTrackItems.length > 0 && (
        <div className="space-y-2 border-t border-[#f1f2f4] pt-3">
          <div className="text-xs font-semibold text-[#172b4d]">
            Delayed work items ({offTrackItems.length})
          </div>
          <div 
            ref={scrollContainerRef}
            className="space-y-1 max-h-80 overflow-y-auto hide-scrollbar"
          >
            {displayedItems.map((item, index) => (
              <div 
                key={item.issue.id} 
                className="bg-white p-2 rounded border border-[#f1f2f4] hover:border-[#de350b] cursor-pointer transition-all group"
                onClick={() => handleItemClick(item.issue.key)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-[#de350b] flex-shrink-0 mt-1"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-mono text-[#0052cc] font-medium group-hover:text-[#de350b] transition-colors">
                          {item.issue.key}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#6b778c] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <div className="text-xs text-[#42526e] line-clamp-2 leading-relaxed">
                        {item.issue.summary}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <span className="text-xs text-[#de350b] font-medium">
                      {item.reason}
                    </span>
                    <img
                      src={item.issue.assignee.avatar}
                      alt={item.issue.assignee.name}
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      title={item.issue.assignee.name}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Show message if no delayed items */}
      {offTrackItems.length === 0 && (
        <div className="text-center py-4 border-t border-[#f1f2f4]">
          <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-[#00875a] opacity-50" />
          <div className="text-sm text-[#42526e]">No delayed items</div>
          <div className="text-xs text-[#6b778c]">All work is on track for target dates</div>
        </div>
      )}

      {/* Summary */}
      <div className="text-center pt-1 border-t border-[#f1f2f4]">
        <div className="text-xs text-[#6b778c]">
          {trackingData.totalTracked} items tracked • {trackingData.offTrackCount} delayed • {trackingData.missingTargets} missing targets
        </div>
      </div>
    </div>
  );
};

export default TargetDueDateChart;