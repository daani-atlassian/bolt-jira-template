import { Issue, Assignee, RollupData } from '../types';

/**
 * Calculate roll-up data for a group of issues
 */
export function calculateRollupData(issues: Issue[]): RollupData {
  const totalIssues = issues.length;
  
  // Calculate status breakdown
  const statusBreakdown = {
    todo: issues.filter(issue => issue.status === 'TO DO').length,
    inProgress: issues.filter(issue => issue.status === 'IN PROGRESS').length,
    done: issues.filter(issue => issue.status === 'DONE').length,
  };
  
  // Get unique assignees
  const uniqueAssignees = Array.from(
    new Map(issues.map(issue => [issue.assignee.id, issue.assignee])).values()
  );
  
  // Calculate effort totals
  const totalEffort = issues.reduce((sum, issue) => sum + issue.effort, 0);
  const totalEffortRemaining = issues.reduce((sum, issue) => sum + issue.effortRemaining, 0);
  
  // Determine tracking status based on effort remaining vs total effort
  const completionPercentage = totalEffort > 0 ? (totalEffort - totalEffortRemaining) / totalEffort : 0;
  let trackingStatus: 'on-track' | 'at-risk' | 'off-track' = 'on-track';
  
  if (completionPercentage < 0.5) {
    trackingStatus = 'off-track';
  } else if (completionPercentage < 0.8) {
    trackingStatus = 'at-risk';
  }
  
  return {
    totalIssues,
    statusBreakdown,
    uniqueAssignees,
    totalEffort,
    totalEffortRemaining,
    trackingStatus,
  };
}

/**
 * Calculate roll-up data for hierarchical issues (parent-child relationships)
 */
export function calculateHierarchicalRollup(parentIssue: Issue): RollupData {
  const allChildIssues = getAllChildIssues(parentIssue);
  return calculateRollupData(allChildIssues);
}

/**
 * Recursively get all child issues from a parent issue
 */
function getAllChildIssues(issue: Issue): Issue[] {
  const children: Issue[] = [];
  
  if (issue.children) {
    for (const child of issue.children) {
      children.push(child);
      children.push(...getAllChildIssues(child));
    }
  }
  
  return children;
}