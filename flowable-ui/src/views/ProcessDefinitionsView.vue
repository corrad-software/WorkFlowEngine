<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Play } from "lucide-vue-next";
import { getProcessDefinitions, startProcessInstance } from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import type { ProcessDefinition } from "@/types";

const toast = useToast();
const definitions = ref<ProcessDefinition[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await getProcessDefinitions("latest=true&sort=name&order=asc");
    definitions.value = res.data || [];
  } catch {
    toast.error("Failed to load", "Could not fetch process definitions.");
  } finally {
    loading.value = false;
  }
});

async function start(def: ProcessDefinition) {
  try {
    await startProcessInstance(def.key);
    toast.success("Started", `Process "${def.name}" started.`);
  } catch {
    toast.error("Failed", `Could not start "${def.name}".`);
  }
}
</script>

<template>
  <div>
    <h1 class="page-title mb-6">Process Definitions</h1>
    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>
    <p v-else-if="definitions.length === 0" class="text-sm text-slate-500">No process definitions deployed yet.</p>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-600">Name</th>
            <th class="px-4 py-3 font-medium text-slate-600">Key</th>
            <th class="px-4 py-3 font-medium text-slate-600">Version</th>
            <th class="px-4 py-3 font-medium text-slate-600">Category</th>
            <th class="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="def in definitions" :key="def.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-900">{{ def.name || def.key }}</td>
            <td class="px-4 py-3 text-slate-600">{{ def.key }}</td>
            <td class="px-4 py-3 text-slate-600">v{{ def.version }}</td>
            <td class="px-4 py-3 text-slate-600">{{ def.category || '-' }}</td>
            <td class="px-4 py-3 text-right">
              <button
                @click="start(def)"
                class="inline-flex items-center gap-1 rounded-md bg-[var(--accent-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-700)]"
              >
                <Play class="h-3 w-3" /> Start
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
