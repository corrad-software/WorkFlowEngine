import type { Component } from "vue";
import {
  BookOpen,
  Cable,
  Clock,
  FileText,
  Gauge,
  GitBranch,
  Inbox,
  Layers,
  PenTool,
  Play,
  Settings,
  Shield,
  Timer,
  Upload,
  Users,
} from "lucide-vue-next";

export type MenuNode = {
  id: string;
  label: string;
  to: string;
  children?: MenuNode[];
};

export type MenuItemDef = MenuNode & {
  icon: Component;
};

export type MenuGroupDef = {
  id: string;
  label: string;
  items: MenuItemDef[];
};

export const DEFAULT_MENU: MenuGroupDef[] = [
  {
    id: "overview",
    label: "",
    items: [
      { id: "dashboard", label: "Dashboard", to: "/", icon: Gauge },
    ],
  },
  {
    id: "design",
    label: "Design",
    items: [
      { id: "models", label: "Process Models", to: "/models", icon: PenTool },
      { id: "definitions", label: "Process Definitions", to: "/definitions", icon: GitBranch },
      { id: "deployments", label: "Deployments", to: "/deployments", icon: Upload },
      { id: "forms", label: "Form Designer", to: "/forms", icon: FileText },
      { id: "dmn", label: "Decision Tables", to: "/dmn", icon: Layers },
    ],
  },
  {
    id: "runtime",
    label: "Runtime",
    items: [
      { id: "tasks", label: "Task Inbox", to: "/tasks", icon: Inbox },
      { id: "instances", label: "Process Instances", to: "/instances", icon: Play },
      { id: "history", label: "History", to: "/history", icon: Clock },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "jobs",
        label: "Jobs",
        to: "/jobs",
        icon: Timer,
        children: [
          { id: "jobs-active", label: "Active Jobs", to: "/jobs" },
          { id: "jobs-timer", label: "Timer Jobs", to: "/jobs/timer" },
          { id: "jobs-deadletter", label: "Dead Letter Jobs", to: "/jobs/deadletter" },
        ],
      },
      { id: "users", label: "Users", to: "/users", icon: Users },
      { id: "groups", label: "Groups", to: "/groups", icon: Shield },
      {
        id: "engine",
        label: "Engine Info",
        to: "/engine",
        icon: Settings,
        children: [
          { id: "engine-overview", label: "Overview", to: "/engine" },
          { id: "engine-tech", label: "Tech Stack", to: "/engine/tech-stack" },
          { id: "engine-db", label: "Database Stats", to: "/engine/db-stats" },
          { id: "engine-schema", label: "DB Schema", to: "/engine/schema" },
        ],
      },
      { id: "api-explorer", label: "API Explorer", to: "/api-explorer", icon: Cable },
      { id: "manual", label: "User Manual", to: "/manual", icon: BookOpen },
    ],
  },
];
