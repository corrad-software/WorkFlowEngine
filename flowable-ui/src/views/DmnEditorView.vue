<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Upload, Trash2 } from "lucide-vue-next";
import { getDmnDefinitions, getDmnDeployments, createDmnDeployment } from "@/api/flowable";
import { useToast } from "@/composables/useToast";

const toast = useToast();
const definitions = ref<{ id: string; key: string; name: string; version: number; deploymentId: string }[]>([]);
const loading = ref(true);
const fileInput = ref<HTMLInputElement | null>(null);

async function load() {
  loading.value = true;
  try {
    const res = await getDmnDefinitions("sort=name&order=asc");
    definitions.value = res.data || [];
  } catch {
    // DMN might not be available
    definitions.value = [];
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
    await createDmnDeployment(form);
    toast.success("Deployed", `"${file.name}" deployed.`);
    await load();
  } catch {
    toast.error("Failed", "DMN deployment failed.");
  }
  target.value = "";
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="page-title">Decision Tables (DMN)</h1>
      <button
        @click="triggerUpload"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
      >
        <Upload class="h-4 w-4" /> Deploy DMN
      </button>
      <input ref="fileInput" type="file" accept=".dmn,.dmn.xml,.xml" class="hidden" @change="handleUpload" />
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>
    <p v-else-if="definitions.length === 0" class="text-sm text-slate-500">
      No decision tables deployed yet. Upload a .dmn file to get started.
    </p>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-600">Name</th>
            <th class="px-4 py-3 font-medium text-slate-600">Key</th>
            <th class="px-4 py-3 font-medium text-slate-600">Version</th>
            <th class="px-4 py-3 font-medium text-slate-600">Deployment ID</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="d in definitions" :key="d.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-900">{{ d.name || d.key }}</td>
            <td class="px-4 py-3 text-slate-600">{{ d.key }}</td>
            <td class="px-4 py-3 text-slate-600">v{{ d.version }}</td>
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ d.deploymentId }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
