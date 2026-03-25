<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  GitBranch,
  Inbox,
  Layers,
  Play,
  Timer,
  TrendingUp,
  Users,
} from "lucide-vue-next";
import {
  getProcessDefinitions,
  getTasks,
  getProcessInstances,
  getJobs,
  getDeadletterJobs,
  getUsers,
  getGroups,
  getHistoricProcessInstances,
  getHistoricTaskInstances,
  getDeployments,
} from "@/api/flowable";
import type { TaskItem, ProcessInstance } from "@/types";

const router = useRouter();

// Stats cards
const stats = ref([
  { label: "Process Definitions", value: "-", icon: GitBranch, color: "from-blue-500 to-blue-600", route: "/definitions" },
  { label: "Active Tasks", value: "-", icon: Inbox, color: "from-emerald-500 to-emerald-600", route: "/tasks" },
  { label: "Running Instances", value: "-", icon: Play, color: "from-violet-500 to-violet-600", route: "/instances" },
  { label: "Active Jobs", value: "-", icon: Timer, color: "from-amber-500 to-amber-600", route: "/jobs" },
]);

// Secondary stats
const secondaryStats = ref([
  { label: "Users", value: "-", icon: Users },
  { label: "Groups", value: "-", icon: Layers },
  { label: "Deployments", value: "-", icon: TrendingUp },
  { label: "Dead Letter Jobs", value: "-", icon: AlertTriangle },
  { label: "Completed Processes", value: "-", icon: CheckCircle2 },
  { label: "Completed Tasks", value: "-", icon: Clock },
]);

// Recent tasks
const recentTasks = ref<TaskItem[]>([]);
// Recent instances
const recentInstances = ref<ProcessInstance[]>([]);
// Process breakdown
const processBreakdown = ref<{ name: string; count: number; color: string }[]>([]);

const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500"];

onMounted(async () => {
  const [defs, tasks, instances, jobs, deadJobs, users, groups, deployments, histProc, histTask, taskList, instanceList] = await Promise.allSettled([
    getProcessDefinitions("size=0&latest=true"),
    getTasks("size=0"),
    getProcessInstances("size=0"),
    getJobs("size=0"),
    getDeadletterJobs("size=0"),
    getUsers("size=0"),
    getGroups("size=0"),
    getDeployments("size=0"),
    getHistoricProcessInstances("finished=true&size=0"),
    getHistoricTaskInstances("finished=true&size=0"),
    getTasks("sort=createTime&order=desc&size=8"),
    getProcessInstances("sort=startTime&order=desc&size=8"),
  ]);

  // Primary stats
  if (defs.status === "fulfilled") stats.value[0].value = String(defs.value.total ?? 0);
  if (tasks.status === "fulfilled") stats.value[1].value = String(tasks.value.total ?? 0);
  if (instances.status === "fulfilled") stats.value[2].value = String(instances.value.total ?? 0);
  if (jobs.status === "fulfilled") stats.value[3].value = String(jobs.value.total ?? 0);

  // Secondary stats
  if (users.status === "fulfilled") secondaryStats.value[0].value = String(users.value.total ?? 0);
  if (groups.status === "fulfilled") secondaryStats.value[1].value = String(groups.value.total ?? 0);
  if (deployments.status === "fulfilled") secondaryStats.value[2].value = String(deployments.value.total ?? 0);
  if (deadJobs.status === "fulfilled") secondaryStats.value[3].value = String(deadJobs.value.total ?? 0);
  if (histProc.status === "fulfilled") secondaryStats.value[4].value = String(histProc.value.total ?? 0);
  if (histTask.status === "fulfilled") secondaryStats.value[5].value = String(histTask.value.total ?? 0);

  // Recent tasks
  if (taskList.status === "fulfilled") recentTasks.value = taskList.value.data || [];

  // Recent instances
  if (instanceList.status === "fulfilled") recentInstances.value = instanceList.value.data || [];

  // Process breakdown: count instances per process definition
  if (instanceList.status === "fulfilled" && instanceList.value.data) {
    const counts: Record<string, { name: string; count: number }> = {};
    for (const inst of instanceList.value.data) {
      const name = (inst as any).processDefinitionName || inst.processDefinitionId;
      if (!counts[name]) counts[name] = { name, count: 0 };
      counts[name].count++;
    }
    // Also try to get full instance list for better breakdown
    if (instances.status === "fulfilled") {
      try {
        const allInst = await getProcessInstances("size=100");
        const fullCounts: Record<string, { name: string; count: number }> = {};
        for (const inst of allInst.data || []) {
          const name = (inst as any).processDefinitionName || inst.processDefinitionId;
          if (!fullCounts[name]) fullCounts[name] = { name, count: 0 };
          fullCounts[name].count++;
        }
        processBreakdown.value = Object.values(fullCounts)
          .sort((a, b) => b.count - a.count)
          .map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }));
      } catch {
        processBreakdown.value = Object.values(counts)
          .sort((a, b) => b.count - a.count)
          .map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }));
      }
    }
  }
});

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function priorityBadge(p: number) {
  if (p >= 75) return "bg-rose-100 text-rose-700";
  if (p >= 50) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

const totalInstances = () => {
  const total = processBreakdown.value.reduce((sum, item) => sum + item.count, 0);
  return total || 1;
};
</script>

<template>
  <div>
    <h1 class="page-title mb-6">Dashboard</h1>

    <!-- Primary Stats -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <button
        v-for="stat in stats"
        :key="stat.label"
        @click="router.push(stat.route)"
        class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[var(--accent-300)] hover:shadow-md text-left"
      >
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white" :class="stat.color">
          <component :is="stat.icon" class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-900">{{ stat.value }}</p>
          <p class="text-sm text-slate-500">{{ stat.label }}</p>
        </div>
      </button>
    </div>

    <!-- Secondary Stats Bar -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="s in secondaryStats"
        :key="s.label"
        class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
      >
        <component :is="s.icon" class="h-4 w-4 shrink-0 text-slate-400" />
        <div>
          <p class="text-lg font-bold text-slate-900 leading-none">{{ s.value }}</p>
          <p class="text-[11px] text-slate-400">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Recent Tasks -->
      <div class="lg:col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 class="text-sm font-semibold text-slate-900">Recent Tasks</h2>
          <button @click="router.push('/tasks')" class="flex items-center gap-1 text-xs text-[var(--accent-600)] hover:text-[var(--accent-700)]">
            View all <ArrowRight class="h-3 w-3" />
          </button>
        </div>
        <div v-if="recentTasks.length === 0" class="p-5 text-center text-sm text-slate-400">No active tasks</div>
        <div v-else class="divide-y divide-slate-100">
          <button
            v-for="task in recentTasks"
            :key="task.id"
            @click="router.push(`/tasks/${task.id}`)"
            class="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-900">{{ task.name || 'Unnamed Task' }}</p>
              <p class="text-[11px] text-slate-400">{{ task.assignee || 'Unassigned' }} &middot; {{ timeAgo(task.createTime) }}</p>
            </div>
            <span class="ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" :class="priorityBadge(task.priority)">
              P{{ task.priority }}
            </span>
          </button>
        </div>
      </div>

      <!-- Recent Instances -->
      <div class="lg:col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 class="text-sm font-semibold text-slate-900">Recent Instances</h2>
          <button @click="router.push('/instances')" class="flex items-center gap-1 text-xs text-[var(--accent-600)] hover:text-[var(--accent-700)]">
            View all <ArrowRight class="h-3 w-3" />
          </button>
        </div>
        <div v-if="recentInstances.length === 0" class="p-5 text-center text-sm text-slate-400">No running instances</div>
        <div v-else class="divide-y divide-slate-100">
          <button
            v-for="inst in recentInstances"
            :key="inst.id"
            @click="router.push(`/instances/${inst.id}`)"
            class="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-900">{{ (inst as any).processDefinitionName || inst.processDefinitionId }}</p>
              <p class="text-[11px] text-slate-400">{{ inst.id.slice(0, 8) }}... &middot; {{ timeAgo(inst.startTime) }}</p>
            </div>
            <span
              class="ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
              :class="inst.suspended ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ inst.suspended ? 'Suspended' : 'Active' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Process Breakdown -->
      <div class="lg:col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-3">
          <h2 class="text-sm font-semibold text-slate-900">Instances by Process</h2>
        </div>
        <div v-if="processBreakdown.length === 0" class="p-5 text-center text-sm text-slate-400">No data</div>
        <div v-else class="p-5 space-y-4">
          <div v-for="item in processBreakdown" :key="item.name">
            <div class="mb-1 flex items-center justify-between">
              <span class="truncate text-sm font-medium text-slate-700">{{ item.name }}</span>
              <span class="shrink-0 text-sm font-bold text-slate-900">{{ item.count }}</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full transition-all"
                :class="item.color"
                :style="{ width: `${(item.count / totalInstances()) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="mb-3 text-sm font-semibold text-slate-900">Quick Actions</h2>
      <div class="flex flex-wrap gap-2">
        <button
          @click="router.push('/modeler')"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--accent-300)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
        >
          <GitBranch class="h-4 w-4" /> New Process
        </button>
        <button
          @click="router.push('/deployments')"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--accent-300)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
        >
          <TrendingUp class="h-4 w-4" /> Deploy BPMN
        </button>
        <button
          @click="router.push('/users')"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--accent-300)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
        >
          <Users class="h-4 w-4" /> Manage Users
        </button>
        <button
          @click="router.push('/forms')"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--accent-300)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
        >
          <Layers class="h-4 w-4" /> Form Designer
        </button>
        <button
          @click="router.push('/api-explorer')"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--accent-300)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
        >
          <Play class="h-4 w-4" /> API Explorer
        </button>
      </div>
    </div>
  </div>
</template>
