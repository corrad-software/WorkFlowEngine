<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Download, FolderOpen, Plus, Rocket, Save, Upload, ZoomIn, ZoomOut, Maximize } from "lucide-vue-next";
import BpmnModeler from "bpmn-js/lib/Modeler";
import { createDeployment } from "@/api/flowable";
import { useToast } from "@/composables/useToast";

type SavedModel = {
  id: string;
  name: string;
  key: string;
  xml: string;
  updatedAt: string;
};

const route = useRoute();
const router = useRouter();
const toast = useToast();
const canvas = ref<HTMLDivElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
let modeler: BpmnModeler | null = null;
let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

const currentModelId = ref<string | null>(null);
const currentModelName = ref("New Process");
const hasUnsaved = ref(false);

const NEW_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             id="Definitions_1"
             targetNamespace="http://flowable.org/bpmn">
  <process id="Process_1" name="New Process" isExecutable="true">
    <startEvent id="StartEvent_1" name="Start" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="160" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

// ── Storage helpers ──
function loadModels(): SavedModel[] {
  try { return JSON.parse(localStorage.getItem("flowable-models") || "[]"); }
  catch { return []; }
}
function saveModels(models: SavedModel[]) {
  localStorage.setItem("flowable-models", JSON.stringify(models));
}

// ── Extract process name/key from XML ──
function extractProcessInfo(xml: string): { name: string; key: string } {
  const keyMatch = xml.match(/process\s+id="([^"]+)"/);
  const nameMatch = xml.match(/process\s+[^>]*name="([^"]+)"/);
  return { key: keyMatch?.[1] || "Process_1", name: nameMatch?.[1] || "New Process" };
}

// ── Save draft ──
async function saveDraft() {
  if (!modeler) return;
  const { xml } = await modeler.saveXML({ format: true });
  if (!xml) return;

  const info = extractProcessInfo(xml);
  currentModelName.value = info.name;

  const models = loadModels();
  const now = new Date().toISOString();

  if (currentModelId.value) {
    const idx = models.findIndex((m) => m.id === currentModelId.value);
    if (idx >= 0) {
      models[idx] = { ...models[idx], name: info.name, key: info.key, xml, updatedAt: now };
    } else {
      models.push({ id: currentModelId.value, name: info.name, key: info.key, xml, updatedAt: now });
    }
  } else {
    currentModelId.value = "model_" + Math.random().toString(36).slice(2, 10);
    models.push({ id: currentModelId.value, name: info.name, key: info.key, xml, updatedAt: now });
  }

  saveModels(models);
  hasUnsaved.value = false;
  toast.success("Saved", `"${info.name}" saved as draft.`);

  // Update URL if it was /modeler (new)
  if (!route.params.id) {
    router.replace(`/modeler/${currentModelId.value}`);
  }
}

// ── Auto-save ──
async function autoSave() {
  if (!modeler || !hasUnsaved.value || !currentModelId.value) return;
  const { xml } = await modeler.saveXML({ format: true });
  if (!xml) return;

  const info = extractProcessInfo(xml);
  const models = loadModels();
  const idx = models.findIndex((m) => m.id === currentModelId.value);
  const now = new Date().toISOString();

  if (idx >= 0) {
    models[idx] = { ...models[idx], name: info.name, key: info.key, xml, updatedAt: now };
  }
  saveModels(models);
  hasUnsaved.value = false;
}

// ── Init ──
onMounted(async () => {
  if (!canvas.value) return;

  modeler = new BpmnModeler({
    container: canvas.value,
    keyboard: { bindTo: document },
  });

  // Track changes
  modeler.on("commandStack.changed", () => {
    hasUnsaved.value = true;
  });

  // Load existing model or new
  const modelId = route.params.id as string | undefined;
  let xmlToLoad = NEW_DIAGRAM;

  if (modelId) {
    const models = loadModels();
    const existing = models.find((m) => m.id === modelId);
    if (existing) {
      currentModelId.value = existing.id;
      currentModelName.value = existing.name;
      xmlToLoad = existing.xml;
    }
  }

  try {
    await modeler.importXML(xmlToLoad);
    const c = modeler.get("canvas") as any;
    c.zoom("fit-viewport");
  } catch (e) {
    console.error("Failed to load diagram", e);
  }

  // Auto-save every 30s
  autoSaveInterval = setInterval(autoSave, 30000);
});

onBeforeUnmount(() => {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  modeler?.destroy();
});

// ── Actions ──
async function newDiagram() {
  if (!modeler) return;
  currentModelId.value = null;
  currentModelName.value = "New Process";
  hasUnsaved.value = false;
  await modeler.importXML(NEW_DIAGRAM);
  const c = modeler.get("canvas") as any;
  c.zoom("fit-viewport");
  router.replace("/modeler");
}

function triggerOpen() {
  fileInput.value?.click();
}

async function handleOpen(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !modeler) return;
  const xml = await file.text();
  try {
    currentModelId.value = null;
    await modeler.importXML(xml);
    const info = extractProcessInfo(xml);
    currentModelName.value = info.name;
    const c = modeler.get("canvas") as any;
    c.zoom("fit-viewport");
    hasUnsaved.value = true;
    router.replace("/modeler");
    toast.success("Loaded", `"${file.name}" loaded.`);
  } catch {
    toast.error("Failed", "Could not parse BPMN file.");
  }
  target.value = "";
}

async function downloadXml() {
  if (!modeler) return;
  const { xml } = await modeler.saveXML({ format: true });
  if (!xml) return;
  const info = extractProcessInfo(xml);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${info.key}.bpmn`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadSvg() {
  if (!modeler) return;
  const { svg } = await modeler.saveSVG();
  if (!svg) return;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "process.svg";
  a.click();
  URL.revokeObjectURL(url);
}

async function deploy() {
  if (!modeler) return;
  const { xml } = await modeler.saveXML({ format: true });
  if (!xml) return;

  const info = extractProcessInfo(xml);
  const form = new FormData();
  const blob = new Blob([xml], { type: "application/xml" });
  form.append("file", blob, `${info.key}.bpmn`);

  try {
    await createDeployment(form);
    toast.success("Deployed", `"${info.name}" deployed to Flowable engine.`);
  } catch {
    toast.error("Failed", "Deployment failed.");
  }
}

function zoomIn() {
  if (!modeler) return;
  const c = modeler.get("canvas") as any;
  c.zoom(c.zoom() * 1.2);
}

function zoomOut() {
  if (!modeler) return;
  const c = modeler.get("canvas") as any;
  c.zoom(c.zoom() / 1.2);
}

function fitViewport() {
  if (!modeler) return;
  const c = modeler.get("canvas") as any;
  c.zoom("fit-viewport");
}

// ── Saved models list ──
const showSavedList = ref(false);
const savedModels = computed(() => loadModels().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

function openSaved(model: SavedModel) {
  showSavedList.value = false;
  router.push(`/modeler/${model.id}`);
  // Force reload if already on modeler
  if (route.params.id === model.id) {
    window.location.reload();
  }
}

function deleteSaved(model: SavedModel) {
  const models = loadModels().filter((m) => m.id !== model.id);
  saveModels(models);
  if (currentModelId.value === model.id) {
    currentModelId.value = null;
    newDiagram();
  }
  toast.success("Deleted", `"${model.name}" removed.`);
}
</script>

<template>
  <div class="flex h-[calc(100vh-40px-2rem)] flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between border-b border-slate-200 pb-3">
      <div class="flex items-center gap-3">
        <h1 class="page-title">{{ currentModelName }}</h1>
        <span v-if="hasUnsaved" class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">Unsaved</span>
        <span v-else-if="currentModelId" class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Saved</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="newDiagram"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Plus class="h-4 w-4" /> New
        </button>
        <button
          @click="triggerOpen"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Upload class="h-4 w-4" /> Open File
        </button>
        <input ref="fileInput" type="file" accept=".bpmn,.bpmn20.xml,.xml" class="hidden" @change="handleOpen" />

        <div class="relative">
          <button
            @click="showSavedList = !showSavedList"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FolderOpen class="h-4 w-4" /> Drafts
            <span v-if="savedModels.length > 0" class="ml-0.5 rounded-full bg-slate-200 px-1.5 text-[11px]">{{ savedModels.length }}</span>
          </button>

          <!-- Saved models dropdown -->
          <div
            v-if="showSavedList"
            class="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div class="border-b border-slate-100 px-3 py-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Saved Drafts</p>
            </div>
            <div v-if="savedModels.length === 0" class="p-4 text-center text-sm text-slate-400">No saved drafts</div>
            <div v-else class="max-h-64 overflow-y-auto divide-y divide-slate-100">
              <div
                v-for="m in savedModels"
                :key="m.id"
                class="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50"
              >
                <button class="min-w-0 flex-1 text-left" @click="openSaved(m)">
                  <p class="truncate text-sm font-medium text-slate-900">{{ m.name }}</p>
                  <p class="text-[11px] text-slate-400">{{ m.key }} &middot; {{ new Date(m.updatedAt).toLocaleString() }}</p>
                </button>
                <button @click.stop="deleteSaved(m)" class="ml-2 shrink-0 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                  <span class="text-xs">x</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <span class="mx-1 h-5 w-px bg-slate-200" />

        <button @click="zoomIn" class="rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50" title="Zoom in">
          <ZoomIn class="h-4 w-4" />
        </button>
        <button @click="zoomOut" class="rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50" title="Zoom out">
          <ZoomOut class="h-4 w-4" />
        </button>
        <button @click="fitViewport" class="rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50" title="Fit to viewport">
          <Maximize class="h-4 w-4" />
        </button>

        <span class="mx-1 h-5 w-px bg-slate-200" />

        <button
          @click="downloadXml"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download class="h-4 w-4" /> BPMN
        </button>
        <button
          @click="downloadSvg"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download class="h-4 w-4" /> SVG
        </button>
        <button
          @click="saveDraft"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-300)] bg-[var(--accent-50)] px-3 py-1.5 text-sm font-medium text-[var(--accent-700)] hover:bg-[var(--accent-100)]"
        >
          <Save class="h-4 w-4" /> Save
        </button>
        <button
          @click="deploy"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
        >
          <Rocket class="h-4 w-4" /> Deploy
        </button>
      </div>
    </div>

    <!-- Canvas -->
    <div ref="canvas" class="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white" />
  </div>
</template>

<style>
@import "bpmn-js/dist/assets/diagram-js.css";
@import "bpmn-js/dist/assets/bpmn-js.css";
@import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

.djs-palette {
  top: 10px !important;
  left: 10px !important;
}
</style>
