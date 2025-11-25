export interface DashboardStats {
  activeAgents: number;
  tasksCompleted: number;
  hoursSaved: number;
}

export interface DashboardAgent {
  id: string;
  name: string;
  initials: string;
  color: string;
  message: string;
  time: string;
  active: boolean;
  status: string;
  role: string;
  conversation: any[]; // simplified for now
}

export interface DashboardEvent {
  id: string;
  title: string;
  time: string;
  type: string;
}

export interface DashboardData {
  stats: DashboardStats;
  agents: DashboardAgent[];
  events: DashboardEvent[];
}

