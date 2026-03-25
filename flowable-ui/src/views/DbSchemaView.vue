<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, ChevronDown, Search } from "lucide-vue-next";

const router = useRouter();
const searchQuery = ref("");

type SchemaGroup = { name: string; description: string; tables: { name: string; description: string }[] };

const schemaGroups: SchemaGroup[] = [
  {
    name: "Repository (act_re_*)",
    description: "Process definitions, deployments, and models",
    tables: [
      { name: "act_re_deployment", description: "Deployment packages containing process resources" },
      { name: "act_re_procdef", description: "Process definition metadata (key, version, name)" },
      { name: "act_re_model", description: "Model metadata for editor-saved models" },
    ],
  },
  {
    name: "Runtime (act_ru_*)",
    description: "Running instances, tasks, variables, and jobs",
    tables: [
      { name: "act_ru_execution", description: "Process executions — each instance has a root execution + child executions per active path" },
      { name: "act_ru_task", description: "Active user tasks waiting for completion" },
      { name: "act_ru_variable", description: "Process and task variables (name, type, value)" },
      { name: "act_ru_job", description: "Async continuation jobs waiting to execute" },
      { name: "act_ru_timer_job", description: "Timer jobs — scheduled to fire at a specific time" },
      { name: "act_ru_deadletter_job", description: "Failed jobs moved to dead letter queue after max retries" },
      { name: "act_ru_suspended_job", description: "Jobs belonging to suspended process instances" },
      { name: "act_ru_external_job", description: "Jobs for external worker pattern" },
      { name: "act_ru_history_job", description: "Async history data processing jobs" },
      { name: "act_ru_event_subscr", description: "Event subscriptions (signal, message, conditional)" },
      { name: "act_ru_identitylink", description: "Task candidates, assignees, and owners" },
      { name: "act_ru_entitylink", description: "Links between process instances (parent-child, etc)" },
      { name: "act_ru_actinst", description: "Currently running activity instances" },
    ],
  },
  {
    name: "History (act_hi_*)",
    description: "Audit trail of completed work",
    tables: [
      { name: "act_hi_procinst", description: "Historic process instances — start, end, duration, delete reason" },
      { name: "act_hi_actinst", description: "Every activity execution — start, end, duration, assignee" },
      { name: "act_hi_taskinst", description: "Historic tasks — who completed what and when" },
      { name: "act_hi_varinst", description: "Historic variable values at process completion" },
      { name: "act_hi_identitylink", description: "Historic task participants" },
      { name: "act_hi_entitylink", description: "Historic entity relationships" },
      { name: "act_hi_detail", description: "Fine-grained variable update tracking" },
      { name: "act_hi_comment", description: "User comments on tasks and process instances" },
      { name: "act_hi_attachment", description: "File attachments linked to tasks/instances" },
      { name: "act_hi_tsk_log", description: "Task audit log (claim, complete, delegate events)" },
    ],
  },
  {
    name: "Identity (act_id_*)",
    description: "Users, groups, memberships, and privileges",
    tables: [
      { name: "act_id_user", description: "User accounts (id, name, email, password hash)" },
      { name: "act_id_group", description: "Groups (id, name, type)" },
      { name: "act_id_membership", description: "User-to-group membership links" },
      { name: "act_id_info", description: "Extended user info key-value pairs" },
      { name: "act_id_priv", description: "Privileges (named permissions)" },
      { name: "act_id_priv_mapping", description: "Privilege assignments to users and groups" },
      { name: "act_id_token", description: "Authentication tokens" },
      { name: "act_id_bytearray", description: "Binary data for identity module" },
      { name: "act_id_property", description: "Identity engine properties (schema version)" },
    ],
  },
  {
    name: "General (act_ge_*, act_evt_*)",
    description: "Shared resources, properties, and event logs",
    tables: [
      { name: "act_ge_bytearray", description: "Binary resources — BPMN XML, images, serialized variables" },
      { name: "act_ge_property", description: "Engine properties — schema version, next ID block" },
      { name: "act_evt_log", description: "Engine event log entries" },
      { name: "act_procdef_info", description: "Process definition info cache" },
    ],
  },
  {
    name: "App Engine (act_app_*)",
    description: "App engine definitions and deployments",
    tables: [
      { name: "act_app_appdef", description: "App definitions" },
      { name: "act_app_deployment", description: "App deployments" },
      { name: "act_app_deployment_resource", description: "App deployment resources" },
    ],
  },
  {
    name: "CMMN (act_cmmn_*)",
    description: "Case Management Model and Notation",
    tables: [
      { name: "act_cmmn_casedef", description: "Case definitions" },
      { name: "act_cmmn_deployment", description: "CMMN deployments" },
      { name: "act_cmmn_deployment_resource", description: "CMMN deployment resources" },
      { name: "act_cmmn_ru_case_inst", description: "Running case instances" },
      { name: "act_cmmn_ru_plan_item_inst", description: "Running plan item instances" },
      { name: "act_cmmn_ru_mil_inst", description: "Running milestone instances" },
      { name: "act_cmmn_ru_sentry_part_inst", description: "Sentry part evaluations" },
      { name: "act_cmmn_hi_case_inst", description: "Historic case instances" },
      { name: "act_cmmn_hi_plan_item_inst", description: "Historic plan item instances" },
      { name: "act_cmmn_hi_mil_inst", description: "Historic milestones" },
    ],
  },
  {
    name: "DMN (act_dmn_*)",
    description: "Decision Model and Notation",
    tables: [
      { name: "act_dmn_decision", description: "Decision table definitions" },
      { name: "act_dmn_deployment", description: "DMN deployments" },
      { name: "act_dmn_deployment_resource", description: "DMN deployment resources" },
      { name: "act_dmn_hi_decision_execution", description: "Historic decision executions with results" },
    ],
  },
  {
    name: "Event Registry (flw_*)",
    description: "Event definitions, channels, and batches",
    tables: [
      { name: "flw_event_definition", description: "Event definitions" },
      { name: "flw_event_deployment", description: "Event deployments" },
      { name: "flw_event_resource", description: "Event resources" },
      { name: "flw_channel_definition", description: "Channel definitions (Kafka, JMS, etc)" },
      { name: "flw_ru_batch", description: "Running batch operations" },
      { name: "flw_ru_batch_part", description: "Batch part executions" },
    ],
  },
];

const openGroups = ref<Record<string, boolean>>({});
const totalTables = schemaGroups.reduce((s, g) => s + g.tables.length, 0);

function filteredGroups() {
  if (!searchQuery.value) return schemaGroups;
  const q = searchQuery.value.toLowerCase();
  return schemaGroups
    .map((g) => ({
      ...g,
      tables: g.tables.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
    }))
    .filter((g) => g.tables.length > 0);
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="router.push('/engine')" class="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50">
          <ArrowLeft class="h-4 w-4" />
        </button>
        <div>
          <h1 class="page-title">Database Schema</h1>
          <p class="text-xs text-slate-400">{{ totalTables }} tables across {{ schemaGroups.length }} modules — PostgreSQL</p>
        </div>
      </div>

      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          placeholder="Search tables..."
          class="rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
        />
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="divide-y divide-slate-100">
        <div v-for="group in filteredGroups()" :key="group.name">
          <button
            class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50"
            @click="openGroups[group.name] = !openGroups[group.name]"
          >
            <div>
              <span class="text-sm font-semibold text-slate-900">{{ group.name }}</span>
              <span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{{ group.tables.length }}</span>
              <p class="mt-0.5 text-xs text-slate-400">{{ group.description }}</p>
            </div>
            <ChevronDown class="h-4 w-4 shrink-0 text-slate-400 transition-transform" :class="{ 'rotate-180': openGroups[group.name] }" />
          </button>
          <div v-if="openGroups[group.name]" class="border-t border-slate-100 bg-slate-50/50">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left">
                  <th class="px-6 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">Table</th>
                  <th class="px-6 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="t in group.tables" :key="t.name" class="hover:bg-white">
                  <td class="px-6 py-2 font-mono text-xs text-slate-700">{{ t.name }}</td>
                  <td class="px-6 py-2 text-xs text-slate-500">{{ t.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
