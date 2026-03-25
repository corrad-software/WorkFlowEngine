<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Eye, Trash2 } from "lucide-vue-next";
import { getProcessInstances, deleteProcessInstance } from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import type { ProcessInstance } from "@/types";

const toast = useToast();
const dialog = useConfirmDialog();
const instances = ref<ProcessInstance[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const res = await getProcessInstances("sort=startTime&order=desc");
    instances.value = res.data || [];
  } catch {
    toast.error("Failed", "Could not load instances.");
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function remove(inst: ProcessInstance) {
  const ok = await dialog.confirm({
    title: "Delete Instance",
    message: `Delete process instance ${inst.id}?`,
    confirmText: "Delete",
    destructive: true,
  });
  if (!ok) return;
  try {
    await deleteProcessInstance(inst.id);
    toast.success("Deleted", "Process instance removed.");
    await load();
  } catch {
    toast.error("Failed", "Could not delete instance.");
  }
}
</script>

<template>
  <div>
    <h1 class="page-title mb-6">Process Instances</h1>
    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>
    <p v-else-if="instances.length === 0" class="text-sm text-slate-500">No running process instances.</p>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-600">ID</th>
            <th class="px-4 py-3 font-medium text-slate-600">Process</th>
            <th class="px-4 py-3 font-medium text-slate-600">Business Key</th>
            <th class="px-4 py-3 font-medium text-slate-600">Started</th>
            <th class="px-4 py-3 font-medium text-slate-600">Status</th>
            <th class="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="inst in instances" :key="inst.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ inst.id }}</td>
            <td class="px-4 py-3 font-medium text-slate-900">{{ inst.processDefinitionName || inst.processDefinitionId }}</td>
            <td class="px-4 py-3 text-slate-600">{{ inst.businessKey || '-' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ new Date(inst.startTime).toLocaleString() }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="inst.suspended ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ inst.suspended ? 'Suspended' : 'Active' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right flex justify-end gap-2">
              <router-link :to="`/instances/${inst.id}`" class="text-[var(--accent-600)] hover:text-[var(--accent-700)]">
                <Eye class="h-4 w-4" />
              </router-link>
              <button @click="remove(inst)" class="text-rose-500 hover:text-rose-700">
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
