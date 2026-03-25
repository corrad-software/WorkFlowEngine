<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Clock, Variable, ListChecks, CircleDot } from "lucide-vue-next";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import {
  getProcessInstance,
  getProcessInstanceVariables,
  getProcessDefinition,
  getHistoricActivityInstances,
  getTasks,
} from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import type { ProcessInstance, TaskItem } from "@/types";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const canvas = ref<HTMLDivElement | null>(null);
let viewer: BpmnViewer | null = null;

const instance = ref<ProcessInstance | null>(null);
const variables = ref<{ name: string; type: string; value: unknown }[]>([]);
const activities = ref<{ id: string; activityId: string; activityName: string; activityType: string; startTime: string; endTime: string | null; durationInMillis: number | null; assignee: string | null }[]>([]);
const tasks = ref<TaskItem[]>([]);
const loading = ref(true);
const activeTab = ref<"diagram" | "variables" | "activities" | "tasks">("diagram");
const processName = ref("");
const activeStepNames = ref<string[]>([]);
let bpmnXml = "";

async function mountDiagram() {
  await nextTick();
  if (!canvas.value || !bpmnXml) return;

  viewer = new BpmnViewer({ container: canvas.value });
  await viewer.importXML(bpmnXml);
  const c = viewer.get("canvas") as any;
  c.zoom("fit-viewport");

  const elementRegistry = viewer.get("elementRegistry") as any;
  const overlays = viewer.get("overlays") as any;

  const completedIds = [...new Set(
    activities.value.filter((a) => a.endTime && a.activityType !== "sequenceFlow").map((a) => a.activityId)
  )] as string[];

  const activeIds = [...new Set(
    activities.value.filter((a) => !a.endTime && a.activityType !== "sequenceFlow").map((a) => a.activityId)
  )] as string[];

  for (const actId of completedIds) {
    if (activeIds.includes(actId)) continue;
    const el = elementRegistry.get(actId);
    if (el) { try { c.addMarker(actId, "fl-completed"); } catch {} }
  }

  for (const actId of activeIds) {
    const el = elementRegistry.get(actId);
    if (el) {
      try {
        c.addMarker(actId, "fl-active");
        overlays.add(actId, {
          position: { top: -12, right: -12 },
          html: '<div class="fl-pulse-dot"></div>',
        });
      } catch {}
    }
  }

  const completedFlows = [...new Set(
    activities.value.filter((a) => a.endTime && a.activityType === "sequenceFlow").map((a) => a.activityId)
  )] as string[];
  for (const flowId of completedFlows) {
    const el = elementRegistry.get(flowId);
    if (el) { try { c.addMarker(flowId, "fl-flow-done"); } catch {} }
  }
}

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const [inst, vars, acts, taskRes] = await Promise.all([
      getProcessInstance(id),
      getProcessInstanceVariables(id).catch(() => []),
      getHistoricActivityInstances(id).then((r) => r.data || []).catch(() => []),
      getTasks(`processInstanceId=${id}`).then((r) => r.data || []).catch(() => []),
    ]);

    instance.value = inst;
    variables.value = Array.isArray(vars) ? vars : [];
    activities.value = acts;
    tasks.value = taskRes;

    activeStepNames.value = acts
      .filter((a: any) => !a.endTime && a.activityType !== "sequenceFlow")
      .map((a: any) => a.activityName || a.activityId);

    const def = await getProcessDefinition(inst.processDefinitionId);
    processName.value = def.name || def.key;

    const xmlRes = await fetch(`/api/repository/process-definitions/${inst.processDefinitionId}/resourcedata`, {
      headers: {
        Authorization: localStorage.getItem("flowable-auth") || "",
        Accept: "application/xml",
      },
    });
    bpmnXml = await xmlRes.text();
  } catch (e) {
    console.error("Instance detail error:", e);
    toast.error("Failed", "Could not load process instance.");
  } finally {
    loading.value = false;
  }

  // Mount diagram after DOM updates with loading=false
  await nextTick();
  try {
    await mountDiagram();
  } catch (e) {
    console.error("Diagram mount error:", e);
  }
});

onBeforeUnmount(() => {
  viewer?.destroy();
});

function formatDuration(ms: number | null) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center gap-3">
      <button @click="router.push('/instances')" class="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50">
        <ArrowLeft class="h-4 w-4" />
      </button>
      <div>
        <h1 class="page-title">{{ processName || 'Process Instance' }}</h1>
        <p v-if="instance" class="text-xs text-slate-500">ID: {{ instance.id }}</p>
      </div>
      <span
        v-if="instance"
        class="rounded-full px-2 py-0.5 text-xs font-medium"
        :class="instance.suspended ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
      >
        {{ instance.suspended ? 'Suspended' : 'Active' }}
      </span>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>

    <template v-else>
      <!-- Tabs -->
      <div class="mb-4 flex gap-1 border-b border-slate-200">
        <button
          v-for="tab in (['diagram', 'variables', 'activities', 'tasks'] as const)"
          :key="tab"
          class="flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === tab ? 'border-[var(--accent-600)] text-[var(--accent-700)]' : 'border-transparent text-slate-500 hover:text-slate-700'"
          @click="activeTab = tab"
        >
          <component
            :is="tab === 'diagram' ? CircleDot : tab === 'variables' ? Variable : tab === 'activities' ? Clock : ListChecks"
            class="h-4 w-4"
          />
          {{ tab === 'diagram' ? 'Diagram' : tab === 'variables' ? `Variables (${variables.length})` : tab === 'activities' ? `Activities (${activities.length})` : `Tasks (${tasks.length})` }}
        </button>
      </div>

      <!-- Diagram Tab -->
      <div :style="{ display: activeTab === 'diagram' ? 'block' : 'none' }">
        <!-- Legend -->
        <div class="mb-3 flex items-center gap-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
          <span class="text-xs font-medium text-slate-500">Legend:</span>
          <span class="flex items-center gap-1.5 text-xs text-slate-600">
            <span class="inline-block h-3 w-3 rounded-sm border-2 border-emerald-500 bg-emerald-100"></span>
            Active
          </span>
          <span class="flex items-center gap-1.5 text-xs text-slate-600">
            <span class="inline-block h-3 w-3 rounded-sm border-2 border-slate-400 bg-slate-100"></span>
            Completed
          </span>
          <span class="flex items-center gap-1.5 text-xs text-slate-600">
            <span class="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-white"></span>
            Not reached
          </span>
          <span v-if="activeStepNames.length > 0" class="ml-auto text-xs text-emerald-700">
            Current: <strong>{{ activeStepNames.join(', ') }}</strong>
          </span>
        </div>
        <div ref="canvas" class="h-[500px] rounded-xl border border-slate-200 bg-white" />
      </div>

      <!-- Variables Tab -->
      <div v-if="activeTab === 'variables'">
        <p v-if="variables.length === 0" class="text-sm text-slate-500">No variables.</p>
        <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50">
              <tr>
                <th class="px-4 py-3 font-medium text-slate-600">Name</th>
                <th class="px-4 py-3 font-medium text-slate-600">Type</th>
                <th class="px-4 py-3 font-medium text-slate-600">Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="v in variables" :key="v.name" class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium text-slate-900">{{ v.name }}</td>
                <td class="px-4 py-3 text-slate-500">{{ v.type }}</td>
                <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ JSON.stringify(v.value) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Activities Tab -->
      <div v-if="activeTab === 'activities'">
        <p v-if="activities.length === 0" class="text-sm text-slate-500">No activity history.</p>
        <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50">
              <tr>
                <th class="px-4 py-3 font-medium text-slate-600">Activity</th>
                <th class="px-4 py-3 font-medium text-slate-600">Type</th>
                <th class="px-4 py-3 font-medium text-slate-600">Start</th>
                <th class="px-4 py-3 font-medium text-slate-600">End</th>
                <th class="px-4 py-3 font-medium text-slate-600">Duration</th>
                <th class="px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="a in activities" :key="a.id" class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium text-slate-900">{{ a.activityName || a.activityId }}</td>
                <td class="px-4 py-3 text-slate-500">{{ a.activityType }}</td>
                <td class="px-4 py-3 text-slate-600">{{ new Date(a.startTime).toLocaleString() }}</td>
                <td class="px-4 py-3 text-slate-600">{{ a.endTime ? new Date(a.endTime).toLocaleString() : '-' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ formatDuration(a.durationInMillis) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="a.endTime ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'"
                  >
                    {{ a.endTime ? 'Completed' : 'Active' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tasks Tab -->
      <div v-if="activeTab === 'tasks'">
        <p v-if="tasks.length === 0" class="text-sm text-slate-500">No active tasks for this instance.</p>
        <div v-else class="space-y-3">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p class="font-medium text-slate-900">{{ task.name || 'Unnamed Task' }}</p>
              <p class="text-xs text-slate-500">
                Assignee: {{ task.assignee || 'Unassigned' }} | Created: {{ new Date(task.createTime).toLocaleString() }}
              </p>
            </div>
            <router-link
              :to="`/tasks/${task.id}`"
              class="rounded-md bg-[var(--accent-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-700)]"
            >
              Open
            </router-link>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
@import "bpmn-js/dist/assets/diagram-js.css";
@import "bpmn-js/dist/assets/bpmn-js.css";
@import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

/* Active activity: green border + fill with animated pulse */
.fl-active .djs-visual > :nth-child(1) {
  stroke: #16a34a !important;
  stroke-width: 3px !important;
  fill: #dcfce7 !important;
}
.fl-active .djs-visual > text {
  font-weight: bold !important;
}

/* Completed activity: grey */
.fl-completed .djs-visual > :nth-child(1) {
  stroke: #94a3b8 !important;
  stroke-width: 1.5px !important;
  fill: #f1f5f9 !important;
}
.fl-completed .djs-visual > text {
  fill: #94a3b8 !important;
}

/* Completed sequence flows: grey */
.fl-flow-done .djs-visual > :nth-child(1) {
  stroke: #94a3b8 !important;
}
.fl-flow-done .djs-visual > path {
  stroke: #94a3b8 !important;
}

/* Pulsing dot for active activities */
.fl-pulse-dot {
  width: 14px;
  height: 14px;
  background: #16a34a;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
  animation: fl-pulse 1.5s infinite;
}

@keyframes fl-pulse {
  0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
  70% { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
  100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
}
</style>
