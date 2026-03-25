<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getJobs, getTimerJobs, getDeadletterJobs } from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import type { Job } from "@/types";

const route = useRoute();
const toast = useToast();
const jobs = ref<Job[]>([]);
const loading = ref(true);
const total = ref(0);

const jobType = ref("active");

async function load() {
  loading.value = true;
  const path = route.path;
  if (path.includes("timer")) jobType.value = "timer";
  else if (path.includes("deadletter")) jobType.value = "deadletter";
  else jobType.value = "active";

  try {
    let res;
    if (jobType.value === "timer") res = await getTimerJobs();
    else if (jobType.value === "deadletter") res = await getDeadletterJobs();
    else res = await getJobs();
    jobs.value = res.data || [];
    total.value = res.total || 0;
  } catch {
    toast.error("Failed", "Could not load jobs.");
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <h1 class="page-title mb-6">
      {{ jobType === "timer" ? "Timer Jobs" : jobType === "deadletter" ? "Dead Letter Jobs" : "Active Jobs" }}
    </h1>
    <p class="mb-4 text-sm text-slate-500">Total: {{ total }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>
    <p v-else-if="jobs.length === 0" class="text-sm text-slate-500">No jobs found.</p>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-600">ID</th>
            <th class="px-4 py-3 font-medium text-slate-600">Process Instance</th>
            <th class="px-4 py-3 font-medium text-slate-600">Retries</th>
            <th class="px-4 py-3 font-medium text-slate-600">Due Date</th>
            <th class="px-4 py-3 font-medium text-slate-600">Exception</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="job in jobs" :key="job.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ job.id }}</td>
            <td class="px-4 py-3 text-slate-600">{{ job.processInstanceId || '-' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ job.retries }}</td>
            <td class="px-4 py-3 text-slate-600">{{ job.dueDate ? new Date(job.dueDate).toLocaleString() : '-' }}</td>
            <td class="max-w-xs truncate px-4 py-3 text-xs text-rose-600">{{ job.exceptionMessage || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
