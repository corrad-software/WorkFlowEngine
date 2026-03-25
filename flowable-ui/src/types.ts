export type ThemeColor = "violet" | "blue" | "green" | "red" | "black-white" | "grey";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
};

export type ProcessDefinition = {
  id: string;
  key: string;
  name: string;
  version: number;
  category: string;
  description: string;
  deploymentId: string;
  suspended: boolean;
  tenantId: string;
};

export type Deployment = {
  id: string;
  name: string;
  deploymentTime: string;
  category: string;
  tenantId: string;
};

export type TaskItem = {
  id: string;
  name: string;
  description: string;
  assignee: string;
  createTime: string;
  dueDate: string | null;
  priority: number;
  processInstanceId: string;
  processDefinitionId: string;
  taskDefinitionKey: string;
  suspended: boolean;
};

export type ProcessInstance = {
  id: string;
  businessKey: string;
  processDefinitionId: string;
  processDefinitionName: string;
  startTime: string;
  startUserId: string;
  suspended: boolean;
  ended: boolean;
  tenantId: string;
};

export type Job = {
  id: string;
  processInstanceId: string;
  executionId: string;
  retries: number;
  exceptionMessage: string | null;
  dueDate: string;
  createTime: string;
  tenantId: string;
};

export type EngineInfo = {
  name: string;
  version: string;
};
