<script setup lang="ts">
import { onMounted, ref } from "vue";
import { CheckCircle2 } from "lucide-vue-next";
import { getTasks, completeTask } from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import type { TaskItem } from "@/types";

const toast = useToast();
const tasks = ref<TaskItem[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const res = await getTasks("sort=createTime&order=desc");
    tasks.value = res.data || [];
  } catch {
    toast.error("Failed", "Could not load tasks.");
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function complete(task: TaskItem) {
  try {
    await completeTask(task.id);
    toast.success("Completed", `Task "${task.name}" completed.`);
    await load();
  } catch {
    toast.error("Failed", "Could not complete task.");
  }
}

function priorityBadge(p: number) {
  if (p >= 75) return "bg-rose-100 text-rose-700";
  if (p >= 50) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}
</script>

<template>
  <div>
    <h1 class="page-title mb-6">Task Inbox</h1>
    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>
    <p v-else-if="tasks.length === 0" class="text-sm text-slate-500">No tasks in your inbox.</p>
    <div v-else class="space-y-3">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="font-medium text-slate-900">{{ task.name || 'Unnamed Task' }}</p>
          <p class="mt-0.5 text-xs text-slate-500">
            Created {{ new Date(task.createTime).toLocaleString() }}
            <span v-if="task.assignee" class="ml-2">Assignee: {{ task.assignee }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="priorityBadge(task.priority)">
            P{{ task.priority }}
          </span>
          <router-link
            :to="`/tasks/${task.id}`"
            class="inline-flex items-center gap-1 rounded-md bg-[var(--accent-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-700)]"
          >
            Open
          </router-link>
          <button
            @click="complete(task)"
            class="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <CheckCircle2 class="h-3 w-3" /> Complete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
