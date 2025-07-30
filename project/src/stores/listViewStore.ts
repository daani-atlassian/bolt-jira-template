import { create } from 'zustand';
import { Issue, WorkStream, RollupData } from '../types';

interface ListViewStore {
  issues: Issue[];
  workStreams: WorkStream[];
  expandedItems: Set<string>;
  rollupData: Map<string, RollupData>;
  
  // Actions
  setIssues: (issues: Issue[]) => void;
  setWorkStreams: (workStreams: WorkStream[]) => void;
  toggleExpanded: (itemId: string) => void;
  setRollupData: (itemId: string, data: RollupData) => void;
  calculateRollupData: () => void;
}

export const useListViewStore = create<ListViewStore>((set, get) => ({
  issues: [],
  workStreams: [],
  expandedItems: new Set(),
  rollupData: new Map(),

  setIssues: (issues) => set({ issues }),
  
  setWorkStreams: (workStreams) => set({ workStreams }),
  
  toggleExpanded: (itemId) => set((state) => {
    const newExpanded = new Set(state.expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    return { expandedItems: newExpanded };
  }),
  
  setRollupData: (itemId, data) => set((state) => {
    const newRollupData = new Map(state.rollupData);
    newRollupData.set(itemId, data);
    return { rollupData: newRollupData };
  }),
  
  calculateRollupData: () => {
    // This will be implemented in Phase 2 with the roll-up calculations
    console.log('Roll-up calculations will be implemented in Phase 2');
  },
}));