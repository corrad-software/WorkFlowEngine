<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getHistoricProcessInstances, getHistoricTaskInstances } from "@/api/flowable";
import { useToast } from "@/composables/useToast";

const toast = useToast();
const activeTab = ref<"processes" | "tasks">("processes");

const processes = ref<{
  id: string; processDefinitionName: string; startTime: string;
  endTime: string | null; durationInMillis: number | null;
  startUserId: string; deleteReason: string | null; businessKey: string;
}[]>([]);

const tasks = ref<{
  id: string; name: string; assignee: string; processInstanceId: string;
  startTime: string; endTime: string | null; durationInMillis: number | null;
  taskDefinitionKey: string;
}[]>([]);

const loading = ref(true);

onMounted(async () => {
  try {
    const [p, t] = await Promise.all([
      getHistoricProcessInstances("finished=true&sort=startTime&order=desc&size=50"),
      getHistoricTaskInstances("finished=true&sort=startTime&order=desc&size=50"),
    ]);
    processes.value = p.data || [];
    tasks.value = t.data || [];
  } catch {
    toast.error("Failed", "Could not load history.");
  } finally {
    loading.value = false;
  }
});

function formatDuration(ms: number | null) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
</script>

<template>
  <div>
    <h1 class="page-title mb-6">History</h1>

    <div class="mb-4 flex gap-1 border-b border-slate-200">
      <button
        v-for="tab in (['processes', 'tasks'] as const)"
        :key="tab"
        class="border-b-2 px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === tab ? 'border-[var(--accent-600)] text-[var(--accent-700)]' : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="activeTab = tab"
      >
        {{ tab === 'processes' ? `Completed Processes (${processes.length})` : `Completed Tasks (${tasks.length})` }}
      </button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>

    <!-- Processes -->
    <div v-else-if="activeTab === 'processes'">
      <p v-if="processes.length === 0" class="text-sm text-slate-500">No completed processes.</p>
      <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50">
            <tr>
              <th class="px-4 py-3 font-medium text-slate-600">Process</th>
              <th class="px-4 py-3 font-medium text-slate-600">Business Key</th>
              <th class="px-4 py-3 font-medium text-slate-600">Started</th>
              <th class="px-4 py-3 font-medium text-slate-600">Ended</th>
              <th class="px-4 py-3 font-medium text-slate-600">Duration</th>
              <th class="px-4 py-3 font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="p in processes" :key="p.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium text-slate-900">{{ p.processDefinitionName || p.id }}</td>
              <td class="px-4 py-3 text-slate-600">{{ p.businessKey || '-' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ new Date(p.startTime).toLocaleString() }}</td>
              <td class="px-4 py-3 text-slate-600">{{ p.endTime ? new Date(p.endTime).toLocaleString() : '-' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatDuration(p.durationInMillis) }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="p.deleteReason ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
                >
                  {{ p.deleteReason ? 'Cancelled' : 'Completed' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tasks -->
    <div v-else>
      <p v-if="tasks.length === 0" class="text-sm text-slate-500">No completed tasks.</p>
      <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50">
            <tr>
              <th class="px-4 py-3 font-medium text-slate-600">Task</th>
              <th class="px-4 py-3 font-medium text-slate-600">Assignee</th>
              <th class="px-4 py-3 font-medium text-slate-600">Started</th>
              <th class="px-4 py-3 font-medium text-slate-600">Ended</th>
              <th class="px-4 py-3 font-medium text-slate-600">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="t in tasks" :key="t.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium text-slate-900">{{ t.name || t.taskDefinitionKey }}</td>
              <td class="px-4 py-3 text-slate-600">{{ t.assignee || '-' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ new Date(t.startTime).toLocaleString() }}</td>
              <td class="px-4 py-3 text-slate-600">{{ t.endTime ? new Date(t.endTime).toLocaleString() : '-' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatDuration(t.durationInMillis) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
