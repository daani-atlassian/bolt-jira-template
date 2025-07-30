export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Dependency {
  id: string;
  type: 'blocks' | 'is-blocked-by' | 'relates-to';
  targetIssueId: string;
  targetIssueKey: string;
  targetIssueStatus: 'TO DO' | 'IN PROGRESS' | 'DONE';
  targetIssueSummary: string;
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  status: 'TO DO' | 'IN PROGRESS' | 'DONE';
  assignee: Assignee;
  effort: number; // in hours
  effortRemaining: number; // in hours
  startDate: string;
  dueDate: string;
  targetDate: string;
  actualStartDate?: string;
  actualDueDate?: string; // For tracking actual completion date vs target/due date
  comments: number;
  parentId?: string;
  children?: Issue[];
  issueType: 'story' | 'task' | 'epic';
  workStream?: string;
  dependencies: Dependency[];
  
  // New fields for enhanced tracking
  budget?: number; // Monetary budget in USD
  storyPoints?: number; // Agile estimation points
  originalEstimate?: number; // Original time estimate in hours
  remainingEstimate?: number; // Remaining time estimate in hours  
  timeSpent?: number; // Actual time spent in hours
}

export interface WorkStream {
  id: string;
  name: string;
  color: 'pink' | 'blue' | 'orange' | 'purple';
  issues: Issue[];
}

export interface RollupData {
  totalIssues: number;
  statusBreakdown: {
    todo: number;
    inProgress: number;
    done: number;
  };
  uniqueAssignees: Assignee[];
  totalEffort: number;
  totalEffortRemaining: number;
  trackingStatus: 'on-track' | 'at-risk' | 'off-track';
}

export interface ListViewState {
  issues: Issue[];
  workStreams: WorkStream[];
  expandedItems: Set<string>;
  rollupData: Map<string, RollupData>;
}

export interface SelectedCell {
  issueId: string;
  fieldName: string;
  value: any;
  dataType: 'date' | 'number' | 'currency' | 'text';
  displayValue: string;
}