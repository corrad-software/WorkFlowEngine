<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Copy, Database, Download, Pencil, Plus, Rocket, Trash2 } from "lucide-vue-next";
import { createDeployment, getProcessDefinitions } from "@/api/flowable";
import { api } from "@/api/client";
import { useToast } from "@/composables/useToast";
import { useConfirmDialog } from "@/composables/useConfirmDialog";

type SavedModel = {
  id: string;
  name: string;
  key: string;
  xml: string;
  updatedAt: string;
};

const router = useRouter();
const toast = useToast();
const dialog = useConfirmDialog();
const models = ref<SavedModel[]>([]);

function load() {
  try {
    models.value = JSON.parse(localStorage.getItem("flowable-models") || "[]")
      .sort((a: SavedModel, b: SavedModel) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    models.value = [];
  }
}

function saveAll(list: SavedModel[]) {
  localStorage.setItem("flowable-models", JSON.stringify(list));
  load();
}

onMounted(load);

async function remove(model: SavedModel) {
  const ok = await dialog.confirm({
    title: "Delete Model",
    message: `Delete "${model.name}"? This cannot be undone.`,
    confirmText: "Delete",
    destructive: true,
  });
  if (!ok) return;
  saveAll(models.value.filter((m) => m.id !== model.id));
  toast.success("Deleted", `"${model.name}" removed.`);
}

function duplicate(model: SavedModel) {
  const copy: SavedModel = {
    ...JSON.parse(JSON.stringify(model)),
    id: "model_" + Math.random().toString(36).slice(2, 10),
    name: model.name + " (copy)",
    updatedAt: new Date().toISOString(),
  };
  saveAll([...models.value, copy]);
  toast.success("Duplicated", `"${copy.name}" created.`);
}

function downloadXml(model: SavedModel) {
  const blob = new Blob([model.xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${model.key}.bpmn`;
  a.click();
  URL.revokeObjectURL(url);
}

async function deploy(model: SavedModel) {
  const form = new FormData();
  const blob = new Blob([model.xml], { type: "application/xml" });
  form.append("file", blob, `${model.key}.bpmn`);
  try {
    await createDeployment(form);
    toast.success("Deployed", `"${model.name}" deployed to Flowable engine.`);
  } catch {
    toast.error("Failed", "Deployment failed.");
  }
}

const seeding = ref(false);

async function seedFromEngine() {
  seeding.value = true;
  try {
    const res = await getProcessDefinitions("latest=true&sort=name&order=asc");
    const defs = res.data || [];
    if (defs.length === 0) {
      toast.info("No definitions", "Deploy some processes first, then import them as models.");
      return;
    }

    const existing: SavedModel[] = JSON.parse(localStorage.getItem("flowable-models") || "[]");
    const existingKeys = new Set(existing.map((m: SavedModel) => m.key));
    let imported = 0;

    for (const def of defs) {
      if (existingKeys.has(def.key)) continue;
      try {
        // Fetch raw BPMN XML
        const xmlRes = await fetch(`/api/repository/process-definitions/${def.id}/resourcedata`, {
          headers: {
            Authorization: localStorage.getItem("flowable-auth") || "",
            Accept: "application/xml",
          },
        });
        if (!xmlRes.ok) continue;
        const xml = await xmlRes.text();

        existing.push({
          id: "model_" + Math.random().toString(36).slice(2, 10),
          name: def.name || def.key,
          key: def.key,
          xml,
          updatedAt: new Date().toISOString(),
        });
        imported++;
      } catch {
        // skip
      }
    }

    saveAll(existing);
    toast.success("Imported", `${imported} process model(s) imported from engine.`);
  } catch {
    toast.error("Failed", "Could not fetch process definitions.");
  } finally {
    seeding.value = false;
  }
}

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
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="page-title">Process Models</h1>
      <div class="flex gap-2">
        <button
          @click="seedFromEngine"
          :disabled="seeding"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Database class="h-4 w-4" /> {{ seeding ? 'Importing...' : 'Import from Engine' }}
        </button>
        <button
          @click="router.push('/modeler')"
          class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
        >
          <Plus class="h-4 w-4" /> New Process
        </button>
      </div>
    </div>

    <div v-if="models.length === 0" class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Plus class="h-8 w-8 text-slate-400" />
      </div>
      <p class="text-lg font-semibold text-slate-900">No saved models yet</p>
      <p class="mt-1 text-sm text-slate-500">Create a new process or import from the engine</p>
      <div class="mt-4 flex gap-3">
        <button
          @click="seedFromEngine"
          :disabled="seeding"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Database class="h-4 w-4" /> {{ seeding ? 'Importing...' : 'Import from Engine' }}
        </button>
        <button
          @click="router.push('/modeler')"
          class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
        >
          <Plus class="h-4 w-4" /> Create Process
        </button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="model in models"
        :key="model.id"
        class="group rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-[var(--accent-300)] hover:shadow-md"
      >
        <!-- Card header -->
        <div
          class="cursor-pointer border-b border-slate-100 px-5 py-4"
          @click="router.push(`/modeler/${model.id}`)"
        >
          <div class="mb-1 flex items-center justify-between">
            <h3 class="truncate text-base font-semibold text-slate-900">{{ model.name }}</h3>
            <span class="shrink-0 text-[11px] text-slate-400">{{ timeAgo(model.updatedAt) }}</span>
          </div>
          <p class="text-xs font-mono text-slate-400">{{ model.key }}</p>
        </div>

        <!-- Card preview: show element counts from XML -->
        <div class="px-5 py-3">
          <div class="flex gap-3 text-[11px] text-slate-500">
            <span>{{ (model.xml.match(/<userTask /g) || []).length }} user tasks</span>
            <span>&middot;</span>
            <span>{{ (model.xml.match(/<serviceTask /g) || []).length }} service tasks</span>
            <span>&middot;</span>
            <span>{{ (model.xml.match(/Gateway /g) || []).length }} gateways</span>
          </div>
        </div>

        <!-- Card actions -->
        <div class="flex items-center justify-between border-t border-slate-100 px-5 py-2.5">
          <div class="flex gap-1">
            <button
              @click="router.push(`/modeler/${model.id}`)"
              class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[var(--accent-600)]"
              title="Edit"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              @click="duplicate(model)"
              class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Duplicate"
            >
              <Copy class="h-4 w-4" />
            </button>
            <button
              @click="downloadXml(model)"
              class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Download BPMN"
            >
              <Download class="h-4 w-4" />
            </button>
            <button
              @click="remove(model)"
              class="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              title="Delete"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
          <button
            @click="deploy(model)"
            class="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-700)]"
          >
            <Rocket class="h-3 w-3" /> Deploy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
