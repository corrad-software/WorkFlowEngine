import { createRouter, createWebHistory } from "vue-router";

import LoginView from "@/views/LoginView.vue";
import DashboardView from "@/views/DashboardView.vue";
import ProcessDefinitionsView from "@/views/ProcessDefinitionsView.vue";
import DeploymentsView from "@/views/DeploymentsView.vue";
import TasksView from "@/views/TasksView.vue";
import TaskDetailView from "@/views/TaskDetailView.vue";
import ProcessInstancesView from "@/views/ProcessInstancesView.vue";
import InstanceDetailView from "@/views/InstanceDetailView.vue";
import HistoryView from "@/views/HistoryView.vue";
import JobsView from "@/views/JobsView.vue";
import UsersView from "@/views/UsersView.vue";
import GroupsView from "@/views/GroupsView.vue";
import EngineInfoView from "@/views/EngineInfoView.vue";
import TechStackView from "@/views/TechStackView.vue";
import DbStatsView from "@/views/DbStatsView.vue";
import DbSchemaView from "@/views/DbSchemaView.vue";
import ModelsListView from "@/views/ModelsListView.vue";
import ModelerView from "@/views/ModelerView.vue";
import DmnEditorView from "@/views/DmnEditorView.vue";
import FormsListView from "@/views/FormsListView.vue";
import FormDesignerView from "@/views/FormDesignerView.vue";
import ApiExplorerView from "@/views/ApiExplorerView.vue";
import UserManualView from "@/views/UserManualView.vue";
import { useAuthStore } from "@/stores/auth";
import { useSiteStore } from "@/stores/site";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true, title: "Login" } },
    { path: "/", name: "dashboard", component: DashboardView, meta: { requiresAuth: true, title: "Dashboard" } },
    { path: "/models", name: "models", component: ModelsListView, meta: { requiresAuth: true, title: "Process Models" } },
    { path: "/modeler", name: "modeler", component: ModelerView, meta: { requiresAuth: true, title: "Process Modeler" } },
    { path: "/modeler/:id", name: "modeler-edit", component: ModelerView, meta: { requiresAuth: true, title: "Process Modeler" } },
    { path: "/definitions", name: "definitions", component: ProcessDefinitionsView, meta: { requiresAuth: true, title: "Process Definitions" } },
    { path: "/deployments", name: "deployments", component: DeploymentsView, meta: { requiresAuth: true, title: "Deployments" } },
    { path: "/dmn", name: "dmn", component: DmnEditorView, meta: { requiresAuth: true, title: "Decision Tables" } },
    { path: "/forms", name: "forms", component: FormsListView, meta: { requiresAuth: true, title: "Forms" } },
    { path: "/forms/new", name: "form-new", component: FormDesignerView, meta: { requiresAuth: true, title: "New Form" } },
    { path: "/forms/:id", name: "form-edit", component: FormDesignerView, meta: { requiresAuth: true, title: "Edit Form" } },
    { path: "/tasks", name: "tasks", component: TasksView, meta: { requiresAuth: true, title: "Task Inbox" } },
    { path: "/tasks/:id", name: "task-detail", component: TaskDetailView, meta: { requiresAuth: true, title: "Task" } },
    { path: "/instances", name: "instances", component: ProcessInstancesView, meta: { requiresAuth: true, title: "Process Instances" } },
    { path: "/instances/:id", name: "instance-detail", component: InstanceDetailView, meta: { requiresAuth: true, title: "Process Instance" } },
    { path: "/history", name: "history", component: HistoryView, meta: { requiresAuth: true, title: "History" } },
    { path: "/jobs", name: "jobs", component: JobsView, meta: { requiresAuth: true, title: "Active Jobs" } },
    { path: "/jobs/timer", name: "jobs-timer", component: JobsView, meta: { requiresAuth: true, title: "Timer Jobs" } },
    { path: "/jobs/deadletter", name: "jobs-deadletter", component: JobsView, meta: { requiresAuth: true, title: "Dead Letter Jobs" } },
    { path: "/users", name: "users", component: UsersView, meta: { requiresAuth: true, title: "Users" } },
    { path: "/groups", name: "groups", component: GroupsView, meta: { requiresAuth: true, title: "Groups" } },
    { path: "/engine", name: "engine", component: EngineInfoView, meta: { requiresAuth: true, title: "Engine Info" } },
    { path: "/engine/tech-stack", name: "tech-stack", component: TechStackView, meta: { requiresAuth: true, title: "Tech Stack" } },
    { path: "/engine/db-stats", name: "db-stats", component: DbStatsView, meta: { requiresAuth: true, title: "Database Stats" } },
    { path: "/engine/schema", name: "db-schema", component: DbSchemaView, meta: { requiresAuth: true, title: "DB Schema" } },
    { path: "/api-explorer", name: "api-explorer", component: ApiExplorerView, meta: { requiresAuth: true, title: "API Explorer" } },
    { path: "/manual", name: "manual", component: UserManualView, meta: { requiresAuth: true, title: "User Manual" } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.initialize();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login" };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: "dashboard" };
  }
  return true;
});

router.afterEach((to) => {
  const site = useSiteStore();
  site.setDocumentTitle((to.meta.title as string) || "Flowable");
});

export default router;
