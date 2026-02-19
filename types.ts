export enum EmployeeStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum ProjectStatus {
  ACTIVE = 'Active',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
}

export enum TaskStatus {
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  BLOCKED = 'Blocked',
  DONE = 'Done',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  status: EmployeeStatus;
  joinedDate: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  deadline: string;
  priority: TaskPriority;
  ownerId: string;
  status: ProjectStatus;
  description: string;
}

export interface Task {
  id: string;
  projectId: string;
  assignedToId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}



export interface Blocker {
  id: string;
  employeeId: string;
  projectId: string;
  taskTitle: string;
  description: string;
  reportedDate: string;
  status: 'Open' | 'Resolved';
  resolvedDate?: string;
}

export interface MeetingMinutes {
  id: string;
  title: string;
  date: string;
  projectId: string;
  attendeeIds: string;
  agenda: string;
  notes: string;
  actionItems: string;
  decisions: string;
  createdAt: string;
}
