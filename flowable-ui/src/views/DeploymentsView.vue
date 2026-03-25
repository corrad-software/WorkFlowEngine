<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Trash2, Upload } from "lucide-vue-next";
import { getDeployments, createDeployment, deleteDeployment } from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import type { Deployment } from "@/types";

const toast = useToast();
const dialog = useConfirmDialog();
const deployments = ref<Deployment[]>([]);
const loading = ref(true);
const fileInput = ref<HTMLInputElement | null>(null);

async function load() {
  loading.value = true;
  try {
    const res = await getDeployments("sort=deploymentTime&order=desc");
    deployments.value = res.data || [];
  } catch {
    toast.error("Failed", "Could not load deployments.");
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function triggerUpload() {
  fileInput.value?.click();
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    const form = new FormData();
    form.append("file", file);
    await createDeployment(form);
    toast.success("Deployed", `"${file.name}" deployed successfully.`);
    await load();
  } catch {
    toast.error("Failed", "Deployment failed.");
  }
  target.value = "";
}

async function remove(dep: Deployment) {
  const ok = await dialog.confirm({
    title: "Delete Deployment",
    message: `Delete "${dep.name}"? This will remove all associated process definitions.`,
    confirmText: "Delete",
    destructive: true,
  });
  if (!ok) return;
  try {
    await deleteDeployment(dep.id);
    toast.success("Deleted", `"${dep.name}" removed.`);
    await load();
  } catch {
    toast.error("Failed", "Could not delete deployment.");
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="page-title">Deployments</h1>
      <button
        @click="triggerUpload"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
      >
        <Upload class="h-4 w-4" /> Deploy BPMN
      </button>
      <input ref="fileInput" type="file" accept=".bpmn,.bpmn20.xml,.bar,.zip" class="hidden" @change="handleUpload" />
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>
    <p v-else-if="deployments.length === 0" class="text-sm text-slate-500">No deployments yet.</p>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-600">Name</th>
            <th class="px-4 py-3 font-medium text-slate-600">Deployed At</th>
            <th class="px-4 py-3 font-medium text-slate-600">Category</th>
            <th class="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="dep in deployments" :key="dep.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-900">{{ dep.name }}</td>
            <td class="px-4 py-3 text-slate-600">{{ new Date(dep.deploymentTime).toLocaleString() }}</td>
            <td class="px-4 py-3 text-slate-600">{{ dep.category || '-' }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="remove(dep)" class="text-rose-500 hover:text-rose-700">
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
