import { api } from "./client";
import type { Deployment, EngineInfo, Job, ProcessDefinition, ProcessInstance, TaskItem, User } from "@/types";

type ListResponse<T> = { data: T[]; total: number; start: number; size: number; sort: string; order: string };

// Engine
export const getEngineInfo = () => api<EngineInfo>("/management/engine");

// Process Definitions
export const getProcessDefinitions = (params = "") =>
  api<ListResponse<ProcessDefinition>>(`/repository/process-definitions?${params}`);

export const getProcessDefinition = (id: string) =>
  api<ProcessDefinition>(`/repository/process-definitions/${id}`);

export const getProcessDefinitionXml = (id: string) =>
  api<{ id: string; bpmn20Xml: string }>(`/repository/process-definitions/${id}/resourcedata`);

// Deployments
export const getDeployments = (params = "") =>
  api<ListResponse<Deployment>>(`/repository/deployments?${params}`);

export const createDeployment = (formData: FormData) =>
  api<Deployment>("/repository/deployments", { method: "POST", body: formData });

export const deleteDeployment = (id: string) =>
  api(`/repository/deployments/${id}`, { method: "DELETE" });

// Process Instances
export const getProcessInstances = (params = "") =>
  api<ListResponse<ProcessInstance>>(`/runtime/process-instances?${params}`);

export const startProcessInstance = (processDefinitionKey: string, variables?: Record<string, unknown>) =>
  api<ProcessInstance>("/runtime/process-instances", {
    method: "POST",
    body: JSON.stringify({ processDefinitionKey, variables: variables ? Object.entries(variables).map(([name, value]) => ({ name, value })) : undefined }),
  });

export const deleteProcessInstance = (id: string) =>
  api(`/runtime/process-instances/${id}`, { method: "DELETE" });

// Tasks
export const getTasks = (params = "") =>
  api<ListResponse<TaskItem>>(`/runtime/tasks?${params}`);

export const getTask = (id: string) =>
  api<TaskItem>(`/runtime/tasks/${id}`);

export const completeTask = (id: string, variables?: Record<string, unknown>) =>
  api(`/runtime/tasks/${id}`, {
    method: "POST",
    body: JSON.stringify({
      action: "complete",
      variables: variables ? Object.entries(variables).map(([name, value]) => ({ name, value })) : undefined,
    }),
  });

export const claimTask = (id: string, userId: string) =>
  api(`/runtime/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify({ assignee: userId }),
  });

// Jobs
export const getJobs = (params = "") =>
  api<ListResponse<Job>>(`/management/jobs?${params}`);

export const getTimerJobs = (params = "") =>
  api<ListResponse<Job>>(`/management/timer-jobs?${params}`);

export const getDeadletterJobs = (params = "") =>
  api<ListResponse<Job>>(`/management/deadletter-jobs?${params}`);

// Users (IDM)
export const getUsers = (params = "") =>
  api<ListResponse<User>>(`/identity/users?${params}`);

export const getUser = (id: string) =>
  api<User>(`/identity/users/${id}`);

export const createUser = (user: { id: string; firstName: string; lastName: string; email: string; password: string }) =>
  api<User>("/identity/users", { method: "POST", body: JSON.stringify(user) });

export const deleteUser = (id: string) =>
  api(`/identity/users/${id}`, { method: "DELETE" });

// Groups
export const getGroups = (params = "") =>
  api<ListResponse<{ id: string; name: string; type: string }>>(`/identity/groups?${params}`);

export const createGroup = (group: { id: string; name: string; type: string }) =>
  api("/identity/groups", { method: "POST", body: JSON.stringify(group) });

export const updateGroup = (id: string, group: { name: string; type: string }) =>
  api(`/identity/groups/${id}`, { method: "PUT", body: JSON.stringify({ ...group, id }) });

export const deleteGroup = (id: string) =>
  api(`/identity/groups/${id}`, { method: "DELETE" });

// Process Instance Detail
export const getProcessInstance = (id: string) =>
  api<ProcessInstance>(`/runtime/process-instances/${id}`);

export const getProcessInstanceVariables = (id: string) =>
  api<{ name: string; type: string; value: unknown }[]>(`/runtime/process-instances/${id}/variables`);

export const getProcessInstanceDiagram = (id: string) =>
  api<string>(`/runtime/process-instances/${id}/diagram`);

export const getProcessInstanceActivities = (id: string) =>
  api<ListResponse<{ activityId: string; activityName: string; activityType: string; startTime: string; endTime: string | null; durationInMillis: number | null }>>(`/runtime/executions/${id}/activities`);

// History
export const getHistoricProcessInstances = (params = "") =>
  api<ListResponse<{
    id: string; processDefinitionId: string; processDefinitionName: string;
    startTime: string; endTime: string | null; durationInMillis: number | null;
    startUserId: string; deleteReason: string | null; businessKey: string;
  }>>(`/history/historic-process-instances?${params}`);

export const getHistoricTaskInstances = (params = "") =>
  api<ListResponse<{
    id: string; name: string; assignee: string; processInstanceId: string;
    processDefinitionId: string; startTime: string; endTime: string | null;
    durationInMillis: number | null; deleteReason: string | null;
    taskDefinitionKey: string;
  }>>(`/history/historic-task-instances?${params}`);

export const getHistoricActivityInstances = (processInstanceId: string) =>
  api<ListResponse<{
    id: string; activityId: string; activityName: string; activityType: string;
    processInstanceId: string; startTime: string; endTime: string | null;
    durationInMillis: number | null; assignee: string | null;
  }>>(`/history/historic-activity-instances?processInstanceId=${processInstanceId}&sort=startTime&order=asc`);

// Task form properties
export const getTaskFormData = (taskId: string) =>
  api<{ formProperties: { id: string; name: string; type: string; value: string | null; readable: boolean; writable: boolean; required: boolean }[] }>(`/form/form-data?taskId=${taskId}`);

// User update
export const updateUser = (id: string, data: { firstName?: string; lastName?: string; email?: string; password?: string }) =>
  api(`/identity/users/${id}`, { method: "PUT", body: JSON.stringify({ ...data, id }) });

// DMN
export const getDmnDeployments = (params = "") =>
  api<ListResponse<Deployment>>(`/dmn-repository/deployments?${params}`);

export const getDmnDefinitions = (params = "") =>
  api<ListResponse<{ id: string; key: string; name: string; version: number; category: string; deploymentId: string; tenantId: string }>>(`/dmn-repository/decision-tables?${params}`);

export const createDmnDeployment = (formData: FormData) =>
  api<Deployment>("/dmn-repository/deployments", { method: "POST", body: formData });

export const getDmnDefinitionModel = (id: string) =>
  api<unknown>(`/dmn-repository/decision-tables/${id}/model`);

export const executeDmnDecision = (decisionKey: string, variables: Record<string, unknown>) =>
  api<unknown>("/dmn-rule/execute", {
    method: "POST",
    body: JSON.stringify({ decisionKey, inputVariables: Object.entries(variables).map(([name, value]) => ({ name, value })) }),
  });
