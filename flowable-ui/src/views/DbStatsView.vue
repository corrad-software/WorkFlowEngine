<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, RefreshCw } from "lucide-vue-next";
import { getProcessDefinitions, getProcessInstances, getTasks, getJobs, getTimerJobs, getDeadletterJobs, getUsers, getGroups, getDeployments, getHistoricProcessInstances, getHistoricTaskInstances } from "@/api/flowable";

const router = useRouter();
const loading = ref(true);
const lastRefresh = ref("");

type DbStat = { table: string; description: string; rows: number; category: string };
const dbStats = ref<DbStat[]>([]);

async function load() {
  loading.value = true;
  const results = await Promise.allSettled([
    getProcessDefinitions("size=0"),
    getDeployments("size=0"),
    getProcessInstances("size=0"),
    getTasks("size=0"),
    getJobs("size=0"),
    getTimerJobs("size=0"),
    getDeadletterJobs("size=0"),
    getUsers("size=0"),
    getGroups("size=0"),
    getHistoricProcessInstances("size=0"),
    getHistoricTaskInstances("size=0"),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value?.total ?? 0) : 0;

  dbStats.value = [
    { table: "act_re_procdef", description: "Process Definitions", rows: val(results[0]), category: "Repository" },
    { table: "act_re_deployment", description: "Deployments", rows: val(results[1]), category: "Repository" },
    { table: "act_ru_execution", description: "Running Instances", rows: val(results[2]), category: "Runtime" },
    { table: "act_ru_task", description: "Active Tasks", rows: val(results[3]), category: "Runtime" },
    { table: "act_ru_job", description: "Active Jobs", rows: val(results[4]), category: "Runtime" },
    { table: "act_ru_timer_job", description: "Timer Jobs", rows: val(results[5]), category: "Runtime" },
    { table: "act_ru_deadletter_job", description: "Dead Letter Jobs", rows: val(results[6]), category: "Runtime" },
    { table: "act_id_user", description: "Users", rows: val(results[7]), category: "Identity" },
    { table: "act_id_group", description: "Groups", rows: val(results[8]), category: "Identity" },
    { table: "act_hi_procinst", description: "Historic Instances", rows: val(results[9]), category: "History" },
    { table: "act_hi_taskinst", description: "Historic Tasks", rows: val(results[10]), category: "History" },
  ];

  lastRefresh.value = new Date().toLocaleTimeString();
  loading.value = false;
}

onMounted(load);

const totalRows = () => dbStats.value.reduce((s, d) => s + d.rows, 0);
const maxRows = () => Math.max(...dbStats.value.map((d) => d.rows), 1);

function categoryColor(cat: string) {
  if (cat === "Repository") return "bg-blue-500";
  if (cat === "Runtime") return "bg-emerald-500";
  if (cat === "Identity") return "bg-violet-500";
  if (cat === "History") return "bg-amber-500";
  return "bg-slate-500";
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="router.push('/engine')" class="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50">
          <ArrowLeft class="h-4 w-4" />
        </button>
        <div>
          <h1 class="page-title">Database Stats</h1>
          <p v-if="lastRefresh" class="text-[11px] text-slate-400">Last refreshed: {{ lastRefresh }}</p>
        </div>
      </div>
      <button
        @click="load"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" /> Refresh
      </button>
    </div>

    <!-- Summary -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total Rows</p>
        <p class="text-2xl font-bold text-slate-900">{{ totalRows().toLocaleString() }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tables Tracked</p>
        <p class="text-2xl font-bold text-slate-900">{{ dbStats.length }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Largest Table</p>
        <p class="text-2xl font-bold text-slate-900">{{ dbStats.sort((a, b) => b.rows - a.rows)[0]?.description || '-' }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Database</p>
        <p class="text-2xl font-bold text-slate-900">PostgreSQL</p>
      </div>
    </div>

    <!-- Bar chart -->
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="space-y-3">
        <div v-for="stat in dbStats" :key="stat.table" class="flex items-center gap-4">
          <div class="w-40 shrink-0">
            <p class="text-sm font-medium text-slate-900">{{ stat.description }}</p>
            <p class="font-mono text-[10px] text-slate-400">{{ stat.table }}</p>
          </div>
          <div class="flex-1">
            <div class="h-6 w-full overflow-hidden rounded-md bg-slate-100">
              <div
                class="flex h-full items-center rounded-md px-2 text-[10px] font-bold text-white transition-all"
                :class="categoryColor(stat.category)"
                :style="{ width: `${Math.max((stat.rows / maxRows()) * 100, stat.rows > 0 ? 8 : 0)}%` }"
              >
                <span v-if="stat.rows > 0">{{ stat.rows }}</span>
              </div>
            </div>
          </div>
          <span class="w-16 shrink-0 text-right text-sm font-bold text-slate-900">{{ stat.rows }}</span>
          <span class="w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-medium" :class="categoryColor(stat.category).replace('bg-', 'bg-') + '/10 ' + categoryColor(stat.category).replace('bg-', 'text-')">
            {{ stat.category }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
