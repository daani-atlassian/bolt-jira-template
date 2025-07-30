import React, { useState } from 'react';
import { MessageCircle, AlertTriangle, MessageSquare, HelpCircle, FileText } from 'lucide-react';
import { Issue } from '../../types';

interface CommentsAISummaryProps {
  issues: Issue[];
}

type TabType = 'risks' | 'updates' | 'questions' | 'other';

const CommentsAISummary: React.FC<CommentsAISummaryProps> = ({ issues }) => {
  const [activeTab, setActiveTab] = useState<TabType>('risks');
  
  const totalComments = issues.reduce((sum, issue) => sum + issue.comments, 0);
  const activeIssues = issues.filter(issue => issue.comments > 0).length;

  const generateAIContent = (category: TabType): string => {
    const commentedIssues = issues.filter(issue => issue.comments > 0);
    const highActivityIssues = commentedIssues.filter(issue => issue.comments >= 5);
    const inProgressIssues = commentedIssues.filter(issue => issue.status === 'IN PROGRESS');
    const todoIssues = commentedIssues.filter(issue => issue.status === 'TO DO');
    const doneIssues = commentedIssues.filter(issue => issue.status === 'DONE');

    switch (category) {
      case 'risks':
        if (highActivityIssues.length === 0) {
          return "No significant risks detected in current discussions. All comment activity appears to be routine clarifications and status updates.";
        }
        
        const riskIssue = highActivityIssues[0];
        return `${riskIssue.key} "${riskIssue.summary}" has ${riskIssue.comments} comments, indicating potential blockers or confusion. The high discussion volume suggests this item may need immediate attention from leadership or additional resources. Consider scheduling a focused discussion to resolve outstanding concerns and prevent delays to dependent work items.`;

      case 'updates':
        if (inProgressIssues.length === 0) {
          return "No active work items are currently generating status discussions. This could indicate good progress or lack of regular check-ins.";
        }
        
        const updateText = inProgressIssues.length === 1 
          ? `${inProgressIssues[0].key} is actively being discussed with regular progress updates.`
          : `${inProgressIssues.length} items in progress are generating regular status updates and coordination discussions.`;
        
        return `${updateText} Recent activity suggests teams are maintaining good communication cadence. Most updates focus on milestone progress, dependency coordination, and resource allocation. This healthy communication pattern indicates strong project momentum.`;

      case 'questions':
        if (todoIssues.length === 0) {
          return "No pending work items are generating clarification discussions. Requirements appear well-defined for upcoming work.";
        }
        
        const questionCount = todoIssues.reduce((sum, issue) => sum + issue.comments, 0);
        if (questionCount === 0) {
          return "Upcoming work items have clear requirements with no outstanding questions. Teams appear ready to begin execution.";
        }
        
        return `${todoIssues.length} upcoming items have generated ${questionCount} clarification requests. Most questions focus on acceptance criteria, technical approach, and resource requirements. Consider pre-work sessions to address these questions before implementation begins to avoid mid-sprint disruptions.`;

      case 'other':
        const avgComments = activeIssues > 0 ? (totalComments / activeIssues).toFixed(1) : '0';
        const completedDiscussions = doneIssues.filter(issue => issue.comments > 0).length;
        
        return `Overall comment activity shows ${avgComments} average discussions per active item. ${completedDiscussions} completed items had ongoing discussions, suggesting good collaboration through completion. Communication patterns indicate healthy team engagement with appropriate level of detail in status sharing and coordination.`;

      default:
        return "No content available.";
    }
  };

  const tabs = [
    { id: 'risks' as TabType, label: 'Risks', icon: AlertTriangle, color: 'text-[#de350b]' },
    { id: 'updates' as TabType, label: 'Updates', icon: MessageSquare, color: 'text-[#0052cc]' },
    { id: 'questions' as TabType, label: 'Questions', icon: HelpCircle, color: 'text-[#ffab00]' },
    { id: 'other' as TabType, label: 'Other', icon: FileText, color: 'text-[#6b778c]' },
  ];

  if (totalComments === 0) {
    return (
      <div className="w-full text-center py-8 text-[#6b778c]">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <div className="text-sm">No comments yet</div>
        <div className="text-xs">Start a conversation on any work item</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">

      {/* Tab Navigation */}
      <div className="flex space-x-0 border-b border-[#f1f2f4]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 px-2 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? `border-current ${tab.color} bg-[#f7f8f9]`
                  : 'border-transparent text-[#6b778c] hover:text-[#42526e] hover:bg-[#f7f8f9]'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* AI Content */}
      <div className="min-h-[120px] max-h-[150px] overflow-y-auto">
        <div className="text-sm text-[#42526e] leading-relaxed p-4 bg-[#fafbfc] rounded-lg border border-[#f1f2f4]">
          {generateAIContent(activeTab)}
        </div>
      </div>
    </div>
  );
};

export default CommentsAISummary;