<script setup lang="ts">
import { ref, computed } from "vue";
import { ChevronDown, Copy, ExternalLink, Play, Loader2 } from "lucide-vue-next";
import { useToast } from "@/composables/useToast";

const toast = useToast();

type Endpoint = {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  label: string;
  description: string;
  category: string;
  params?: { name: string; type: string; required: boolean; default?: string }[];
  body?: string;
};

const endpoints: Endpoint[] = [
  { id: "pd-list", method: "GET", path: "/repository/process-definitions", label: "List Process Definitions", description: "Get all deployed process definitions", category: "Process Definitions", params: [{ name: "latest", type: "boolean", required: false, default: "true" }, { name: "sort", type: "string", required: false, default: "name" }] },
  { id: "pd-get", method: "GET", path: "/repository/process-definitions/{id}", label: "Get Process Definition", description: "Get a single process definition by ID", category: "Process Definitions", params: [{ name: "id", type: "path", required: true }] },
  { id: "pd-xml", method: "GET", path: "/repository/process-definitions/{id}/resourcedata", label: "Get BPMN XML", description: "Get the BPMN 2.0 XML of a process definition", category: "Process Definitions", params: [{ name: "id", type: "path", required: true }] },

  { id: "dep-list", method: "GET", path: "/repository/deployments", label: "List Deployments", description: "Get all deployments", category: "Deployments", params: [{ name: "sort", type: "string", required: false, default: "deploymentTime" }] },
  { id: "dep-del", method: "DELETE", path: "/repository/deployments/{id}", label: "Delete Deployment", description: "Delete a deployment and its resources", category: "Deployments", params: [{ name: "id", type: "path", required: true }] },

  { id: "pi-list", method: "GET", path: "/runtime/process-instances", label: "List Instances", description: "Get all running process instances", category: "Process Instances", params: [{ name: "processDefinitionKey", type: "string", required: false }, { name: "sort", type: "string", required: false, default: "startTime" }] },
  { id: "pi-start", method: "POST", path: "/runtime/process-instances", label: "Start Instance", description: "Start a new process instance", category: "Process Instances", body: '{\n  "processDefinitionKey": "myProcess",\n  "variables": [\n    { "name": "key", "value": "value" }\n  ]\n}' },
  { id: "pi-get", method: "GET", path: "/runtime/process-instances/{id}", label: "Get Instance", description: "Get a single process instance", category: "Process Instances", params: [{ name: "id", type: "path", required: true }] },
  { id: "pi-vars", method: "GET", path: "/runtime/process-instances/{id}/variables", label: "Get Instance Variables", description: "Get variables for a process instance", category: "Process Instances", params: [{ name: "id", type: "path", required: true }] },
  { id: "pi-del", method: "DELETE", path: "/runtime/process-instances/{id}", label: "Delete Instance", description: "Delete (cancel) a running process instance", category: "Process Instances", params: [{ name: "id", type: "path", required: true }] },

  { id: "task-list", method: "GET", path: "/runtime/tasks", label: "List Tasks", description: "Get all active tasks", category: "Tasks", params: [{ name: "assignee", type: "string", required: false }, { name: "candidateGroup", type: "string", required: false }, { name: "processInstanceId", type: "string", required: false }] },
  { id: "task-get", method: "GET", path: "/runtime/tasks/{id}", label: "Get Task", description: "Get a single task by ID", category: "Tasks", params: [{ name: "id", type: "path", required: true }] },
  { id: "task-complete", method: "POST", path: "/runtime/tasks/{id}", label: "Complete Task", description: "Complete a task with optional variables", category: "Tasks", params: [{ name: "id", type: "path", required: true }], body: '{\n  "action": "complete",\n  "variables": [\n    { "name": "approved", "value": true }\n  ]\n}' },
  { id: "task-form", method: "GET", path: "/form/form-data", label: "Get Task Form", description: "Get form properties for a task", category: "Tasks", params: [{ name: "taskId", type: "string", required: true }] },

  { id: "hist-pi", method: "GET", path: "/history/historic-process-instances", label: "Historic Instances", description: "Get completed process instances", category: "History", params: [{ name: "finished", type: "boolean", required: false, default: "true" }, { name: "sort", type: "string", required: false, default: "startTime" }] },
  { id: "hist-task", method: "GET", path: "/history/historic-task-instances", label: "Historic Tasks", description: "Get completed tasks", category: "History", params: [{ name: "finished", type: "boolean", required: false, default: "true" }] },
  { id: "hist-act", method: "GET", path: "/history/historic-activity-instances", label: "Historic Activities", description: "Get activity instances for a process", category: "History", params: [{ name: "processInstanceId", type: "string", required: true }] },

  { id: "job-list", method: "GET", path: "/management/jobs", label: "Active Jobs", description: "Get active jobs", category: "Jobs & Management" },
  { id: "job-timer", method: "GET", path: "/management/timer-jobs", label: "Timer Jobs", description: "Get timer jobs", category: "Jobs & Management" },
  { id: "job-dead", method: "GET", path: "/management/deadletter-jobs", label: "Dead Letter Jobs", description: "Get failed jobs", category: "Jobs & Management" },
  { id: "engine", method: "GET", path: "/management/engine", label: "Engine Info", description: "Get engine name and version", category: "Jobs & Management" },

  { id: "user-list", method: "GET", path: "/identity/users", label: "List Users", description: "Get all users", category: "Identity" },
  { id: "user-create", method: "POST", path: "/identity/users", label: "Create User", description: "Create a new user", category: "Identity", body: '{\n  "id": "john",\n  "firstName": "John",\n  "lastName": "Doe",\n  "email": "john@example.com",\n  "password": "secret"\n}' },
  { id: "user-del", method: "DELETE", path: "/identity/users/{id}", label: "Delete User", description: "Delete a user", category: "Identity", params: [{ name: "id", type: "path", required: true }] },
  { id: "group-list", method: "GET", path: "/identity/groups", label: "List Groups", description: "Get all groups", category: "Identity" },
  { id: "group-create", method: "POST", path: "/identity/groups", label: "Create Group", description: "Create a new group", category: "Identity", body: '{\n  "id": "managers",\n  "name": "Managers",\n  "type": "assignment"\n}' },
];

const categories = computed(() => [...new Set(endpoints.map((e) => e.category))]);
const openCategories = ref<Record<string, boolean>>({});
const selected = ref<Endpoint | null>(null);
const paramValues = ref<Record<string, string>>({});
const bodyValue = ref("");
const response = ref("");
const responseStatus = ref(0);
const executing = ref(false);

// Init open categories
for (const cat of [...new Set(endpoints.map((e) => e.category))]) {
  openCategories.value[cat] = true;
}

function selectEndpoint(ep: Endpoint) {
  selected.value = ep;
  paramValues.value = {};
  if (ep.params) {
    for (const p of ep.params) {
      paramValues.value[p.name] = p.default || "";
    }
  }
  bodyValue.value = ep.body || "";
  response.value = "";
  responseStatus.value = 0;
}

function methodColor(m: string) {
  if (m === "GET") return "bg-emerald-100 text-emerald-700";
  if (m === "POST") return "bg-blue-100 text-blue-700";
  if (m === "PUT") return "bg-amber-100 text-amber-700";
  if (m === "DELETE") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function buildUrl(): string {
  if (!selected.value) return "";
  let p = selected.value.path;
  const query: string[] = [];

  for (const [key, val] of Object.entries(paramValues.value)) {
    if (!val) continue;
    const param = selected.value.params?.find((pr) => pr.name === key);
    if (param?.type === "path") {
      p = p.replace(`{${key}}`, encodeURIComponent(val));
    } else {
      query.push(`${key}=${encodeURIComponent(val)}`);
    }
  }

  return query.length > 0 ? `${p}?${query.join("&")}` : p;
}

async function execute() {
  if (!selected.value) return;
  executing.value = true;
  const url = buildUrl();

  try {
    const headers = new Headers();
    headers.set("Authorization", localStorage.getItem("flowable-auth") || "");
    headers.set("Accept", "application/json");

    const opts: RequestInit = { method: selected.value.method, headers };

    if (bodyValue.value && (selected.value.method === "POST" || selected.value.method === "PUT")) {
      headers.set("Content-Type", "application/json");
      opts.body = bodyValue.value;
    }

    const res = await fetch(`/api${url}`, opts);
    responseStatus.value = res.status;
    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("json")) {
      response.value = JSON.stringify(await res.json(), null, 2);
    } else {
      response.value = await res.text();
    }
  } catch (e) {
    response.value = String(e);
    responseStatus.value = 0;
  } finally {
    executing.value = false;
  }
}

function copyResponse() {
  navigator.clipboard.writeText(response.value).then(() => {
    toast.success("Copied", "Response copied to clipboard.");
  });
}

function copyUrl() {
  const url = `/api${buildUrl()}`;
  navigator.clipboard.writeText(url).then(() => {
    toast.success("Copied", "URL copied.");
  });
}
</script>

<template>
  <div class="flex h-[calc(100vh-40px-2rem)] gap-4">
    <!-- Left: Endpoint List -->
    <div class="w-72 flex-shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Flowable REST API</h2>
            <p class="text-[11px] text-slate-400">{{ endpoints.length }} endpoints</p>
          </div>
          <a
            href="http://localhost:8080/flowable-rest/docs/"
            target="_blank"
            class="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50 hover:text-[var(--accent-600)]"
          >
            Swagger <ExternalLink class="h-3 w-3" />
          </a>
        </div>
      </div>

      <div v-for="cat in categories" :key="cat" class="border-b border-slate-100 last:border-0">
        <button
          class="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-50"
          @click="openCategories[cat] = !openCategories[cat]"
        >
          {{ cat }}
          <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="{ '-rotate-90': !openCategories[cat] }" />
        </button>
        <div v-if="openCategories[cat]" class="pb-1">
          <button
            v-for="ep in endpoints.filter((e) => e.category === cat)"
            :key="ep.id"
            class="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm transition-colors"
            :class="selected?.id === ep.id ? 'bg-[var(--accent-50)] text-[var(--accent-700)]' : 'text-slate-700 hover:bg-slate-50'"
            @click="selectEndpoint(ep)"
          >
            <span class="w-14 shrink-0 rounded px-1 py-0.5 text-center text-[10px] font-bold" :class="methodColor(ep.method)">
              {{ ep.method }}
            </span>
            <span class="truncate">{{ ep.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Request/Response -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <template v-if="selected">
        <!-- Endpoint Header -->
        <div class="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-2 flex items-center gap-3">
            <span class="rounded px-2 py-1 text-xs font-bold" :class="methodColor(selected.method)">{{ selected.method }}</span>
            <code class="text-sm font-medium text-slate-900">/service{{ selected.path }}</code>
          </div>
          <p class="text-sm text-slate-500">{{ selected.description }}</p>
        </div>

        <!-- Parameters -->
        <div v-if="selected.params && selected.params.length > 0" class="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Parameters</h3>
          <div class="space-y-2">
            <div v-for="p in selected.params" :key="p.name" class="flex items-center gap-3">
              <label class="w-40 shrink-0 text-sm font-medium text-slate-700">
                {{ p.name }}
                <span v-if="p.required" class="text-rose-500">*</span>
                <span class="ml-1 text-[10px] text-slate-400">{{ p.type }}</span>
              </label>
              <input
                v-model="paramValues[p.name]"
                class="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                :placeholder="p.default || p.name"
              />
            </div>
          </div>
        </div>

        <!-- Request Body -->
        <div v-if="selected.body" class="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Request Body</h3>
          <textarea
            v-model="bodyValue"
            rows="6"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
          />
        </div>

        <!-- Execute -->
        <div class="mb-4 flex items-center gap-3">
          <button
            @click="execute"
            :disabled="executing"
            class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)] disabled:opacity-50"
          >
            <Loader2 v-if="executing" class="h-4 w-4 animate-spin" />
            <Play v-else class="h-4 w-4" />
            {{ executing ? 'Sending...' : 'Send Request' }}
          </button>
          <code class="flex-1 truncate text-xs text-slate-400">{{ selected.method }} /api{{ buildUrl() }}</code>
          <button @click="copyUrl" class="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Copy URL">
            <Copy class="h-4 w-4" />
          </button>
        </div>

        <!-- Response -->
        <div v-if="response" class="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold uppercase text-slate-400">Response</span>
              <span
                class="rounded px-1.5 py-0.5 text-[10px] font-bold"
                :class="responseStatus >= 200 && responseStatus < 300 ? 'bg-emerald-100 text-emerald-700' : responseStatus >= 400 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ responseStatus }}
              </span>
            </div>
            <button @click="copyResponse" class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Copy response">
              <Copy class="h-4 w-4" />
            </button>
          </div>
          <pre class="max-h-[400px] overflow-auto p-4 text-xs text-slate-700">{{ response }}</pre>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-1 items-center justify-center text-center">
          <div>
            <p class="text-lg font-semibold text-slate-900">API Explorer</p>
            <p class="mt-1 text-sm text-slate-500">Select an endpoint from the left panel to try it out</p>
            <a
              href="http://localhost:8080/flowable-rest/docs/"
              target="_blank"
              class="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--accent-600)] hover:text-[var(--accent-700)]"
            >
              Or open Swagger UI <ExternalLink class="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
