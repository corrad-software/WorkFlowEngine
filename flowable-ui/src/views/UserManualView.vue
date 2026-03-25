<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown } from "lucide-vue-next";

type Section = {
  id: string;
  title: string;
  content: string;
};

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `<h3>Welcome to Flowable Workspace</h3>
<p>Flowable is a workflow and Business Process Management (BPM) platform. This UI lets you design, deploy, run, and monitor workflows powered by the Flowable v8 engine.</p>
<h4>Quick Start</h4>
<ol>
  <li><strong>Design</strong> a process in the <em>Process Modeler</em></li>
  <li><strong>Deploy</strong> it to the engine</li>
  <li><strong>Start</strong> an instance from <em>Process Definitions</em></li>
  <li><strong>Complete tasks</strong> in the <em>Task Inbox</em></li>
  <li><strong>Monitor</strong> progress in <em>Process Instances</em></li>
</ol>
<h4>Login Credentials</h4>
<p>Default: <code>rest-admin</code> / <code>test</code></p>`,
  },
  {
    id: "process-modeler",
    title: "Process Modeler",
    content: `<h3>Designing BPMN Processes</h3>
<p>The Process Modeler is a visual drag-and-drop editor for creating BPMN 2.0 process definitions.</p>
<h4>BPMN Elements</h4>
<table>
  <tr><td><strong>Start Event</strong> (thin circle)</td><td>Where the process begins</td></tr>
  <tr><td><strong>End Event</strong> (thick circle)</td><td>Where the process ends</td></tr>
  <tr><td><strong>User Task</strong> (rounded rectangle)</td><td>A step requiring human action</td></tr>
  <tr><td><strong>Service Task</strong> (rectangle + gear)</td><td>An automated step</td></tr>
  <tr><td><strong>Exclusive Gateway</strong> (diamond)</td><td>Decision point — one path taken (if/else)</td></tr>
  <tr><td><strong>Parallel Gateway</strong> (diamond + plus)</td><td>Split into multiple parallel paths</td></tr>
  <tr><td><strong>Sequence Flow</strong> (arrow)</td><td>Connects elements in order</td></tr>
</table>
<h4>How to Use</h4>
<ol>
  <li>Click an element on the canvas → a context pad appears → select what to connect next</li>
  <li>Or drag from the left palette onto the canvas</li>
  <li>Click any element to select it and edit its properties</li>
  <li>Click <strong>Save</strong> to save as a draft</li>
  <li>Click <strong>Deploy</strong> to push to the Flowable engine</li>
</ol>
<h4>Adding Form Fields to User Tasks</h4>
<p>Use the <em>Form Designer</em> to create forms, then copy the XML snippet and paste it into the BPMN XML of your user task's <code>&lt;extensionElements&gt;</code>.</p>
<h4>Assigning Tasks</h4>
<p>In the BPMN XML, you can set:</p>
<ul>
  <li><code>flowable:assignee="userId"</code> — assign to a specific user</li>
  <li><code>flowable:candidateGroups="groupId"</code> — assign to a group (any member can claim)</li>
  <li><code>flowable:assignee="\${variableName}"</code> — dynamic assignment from a process variable</li>
</ul>`,
  },
  {
    id: "process-models",
    title: "Process Models",
    content: `<h3>Managing Process Models</h3>
<p>The Process Models page shows all your saved process drafts.</p>
<h4>Actions</h4>
<ul>
  <li><strong>New Process</strong> — create a blank process in the modeler</li>
  <li><strong>Import from Engine</strong> — pull deployed process definitions into your models list</li>
  <li><strong>Edit</strong> (pencil) — open in the modeler</li>
  <li><strong>Duplicate</strong> — create a copy</li>
  <li><strong>Download</strong> — export as .bpmn file</li>
  <li><strong>Deploy</strong> — send directly to the Flowable engine</li>
  <li><strong>Delete</strong> — remove the draft</li>
</ul>
<p>Models are saved in your browser's local storage. They are drafts — deploying pushes them to the engine where they become runnable.</p>`,
  },
  {
    id: "deployments",
    title: "Deployments & Definitions",
    content: `<h3>Deployments</h3>
<p>A deployment is a package of process definitions uploaded to the engine. Each deploy creates a new version.</p>
<h4>Deploying</h4>
<ul>
  <li>From the <strong>Process Modeler</strong> — click Deploy</li>
  <li>From the <strong>Deployments</strong> page — click "Deploy BPMN" to upload a .bpmn file</li>
  <li>From the <strong>Process Models</strong> list — click the Deploy button on a card</li>
</ul>
<h3>Process Definitions</h3>
<p>After deploying, your process appears in <em>Process Definitions</em>. Each has a key, name, and version number. Deploying the same key again increments the version.</p>
<p>Click <strong>Start</strong> to create a new running instance of that process.</p>`,
  },
  {
    id: "tasks",
    title: "Task Inbox",
    content: `<h3>Working with Tasks</h3>
<p>The Task Inbox shows all active user tasks. Tasks appear here when a process reaches a user task element.</p>
<h4>Task Actions</h4>
<ul>
  <li><strong>Open</strong> — view task details and form fields</li>
  <li><strong>Complete</strong> — mark the task as done (quick complete from the list)</li>
</ul>
<h4>Task Detail Page</h4>
<p>Shows task info (assignee, priority, dates) and renders dynamic form fields defined in the BPMN. Fill in the form and click <strong>Complete Task</strong>.</p>
<p>If the process has a gateway after the task, the variables you submit determine which path is taken.</p>`,
  },
  {
    id: "instances",
    title: "Process Instances",
    content: `<h3>Monitoring Running Processes</h3>
<p>The Process Instances page lists all currently running process instances.</p>
<h4>Instance Detail</h4>
<p>Click the <strong>eye icon</strong> to open the detail page with:</p>
<ul>
  <li><strong>Diagram</strong> — live BPMN diagram with highlighted steps:
    <ul>
      <li>🟢 <strong>Green + pulse</strong> = currently active step</li>
      <li>⚪ <strong>Grey</strong> = completed step</li>
      <li>⬜ <strong>Default</strong> = not yet reached</li>
    </ul>
  </li>
  <li><strong>Variables</strong> — all process variables with their current values</li>
  <li><strong>Activities</strong> — timeline of every step executed (with duration)</li>
  <li><strong>Tasks</strong> — active tasks for this instance with links to complete them</li>
</ul>`,
  },
  {
    id: "history",
    title: "History",
    content: `<h3>Viewing Completed Work</h3>
<p>The History page shows finished processes and tasks.</p>
<h4>Completed Processes</h4>
<p>Shows process name, business key, start/end time, duration, and whether it was completed normally or cancelled.</p>
<h4>Completed Tasks</h4>
<p>Shows task name, assignee, timing, and duration. Useful for auditing who did what and how long it took.</p>`,
  },
  {
    id: "forms",
    title: "Form Designer",
    content: `<h3>Building Task Forms</h3>
<p>The Form Designer lets you create reusable form definitions for user tasks.</p>
<h4>Field Types</h4>
<table>
  <tr><td><strong>Text</strong></td><td>Free-text input</td></tr>
  <tr><td><strong>Number</strong></td><td>Integer input</td></tr>
  <tr><td><strong>Decimal</strong></td><td>Floating-point input</td></tr>
  <tr><td><strong>Yes/No</strong></td><td>Boolean dropdown</td></tr>
  <tr><td><strong>Date</strong></td><td>Date picker</td></tr>
  <tr><td><strong>Dropdown</strong></td><td>Select from predefined options</td></tr>
</table>
<h4>Workflow</h4>
<ol>
  <li>Add fields from the palette</li>
  <li>Click a field to configure: ID, label, type, required, editable, default value</li>
  <li>Use <strong>Preview</strong> to see how it will look</li>
  <li>Click <strong>Copy XML</strong> to get the BPMN snippet</li>
  <li>Paste the XML into your BPMN process inside a <code>&lt;userTask&gt;</code> element</li>
</ol>`,
  },
  {
    id: "dmn",
    title: "Decision Tables (DMN)",
    content: `<h3>Business Rules with DMN</h3>
<p>Decision Model and Notation (DMN) lets you define business rules as decision tables separate from your process logic.</p>
<h4>Usage</h4>
<ol>
  <li>Create a <code>.dmn</code> file with your decision table</li>
  <li>Upload it on the <em>Decision Tables</em> page</li>
  <li>Reference it from your BPMN process using a Decision Task</li>
</ol>
<p>DMN tables evaluate input variables and produce output variables based on matching rules.</p>`,
  },
  {
    id: "users-groups",
    title: "Users & Groups",
    content: `<h3>Identity Management</h3>
<h4>Users</h4>
<p>Create, list, and delete users. Users can be assigned to tasks directly or through group membership.</p>
<h4>Groups</h4>
<p>Groups organize users for task assignment. When a task is assigned to a <code>candidateGroup</code>, any member of that group can see and claim the task.</p>
<h4>Group Types</h4>
<ul>
  <li><strong>assignment</strong> — used for task routing (e.g., "managers", "hr", "finance")</li>
  <li><strong>security-role</strong> — used for access control (e.g., "admin")</li>
</ul>`,
  },
  {
    id: "api",
    title: "REST API",
    content: `<h3>Flowable REST API</h3>
<p>The Flowable v8 REST API is available at <code>http://localhost:8080/flowable-rest/service/</code>. All endpoints use HTTP Basic Authentication.</p>
<h4>Key Endpoints</h4>
<table>
  <tr><td><code>GET /repository/process-definitions</code></td><td>List process definitions</td></tr>
  <tr><td><code>POST /runtime/process-instances</code></td><td>Start a process</td></tr>
  <tr><td><code>GET /runtime/tasks</code></td><td>List tasks</td></tr>
  <tr><td><code>POST /runtime/tasks/{id}</code></td><td>Complete a task</td></tr>
  <tr><td><code>GET /history/historic-process-instances</code></td><td>Query history</td></tr>
</table>
<p>Use the <strong>API Explorer</strong> to try endpoints interactively.</p>`,
  },
];

const openSections = ref<Record<string, boolean>>({ "getting-started": true });

function toggle(id: string) {
  openSections.value[id] = !openSections.value[id];
}
</script>

<template>
  <div>
    <h1 class="page-title mb-2">User Manual</h1>
    <p class="mb-6 text-sm text-slate-500">Everything you need to know about using Flowable Workspace</p>

    <div class="space-y-2">
      <div
        v-for="section in sections"
        :key="section.id"
        class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <button
          class="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
          @click="toggle(section.id)"
        >
          <span class="text-base font-semibold text-slate-900">{{ section.title }}</span>
          <ChevronDown
            class="h-5 w-5 text-slate-400 transition-transform"
            :class="{ 'rotate-180': openSections[section.id] }"
          />
        </button>
        <div
          v-if="openSections[section.id]"
          class="border-t border-slate-100 px-5 py-4 prose prose-sm prose-slate max-w-none"
          v-html="section.content"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.prose h3) { @apply text-base font-bold text-slate-900 mb-2; }
:deep(.prose h4) { @apply text-sm font-semibold text-slate-800 mt-4 mb-1; }
:deep(.prose p) { @apply text-sm text-slate-600 mb-2 leading-relaxed; }
:deep(.prose ol), :deep(.prose ul) { @apply text-sm text-slate-600 pl-5 mb-2 space-y-1; }
:deep(.prose ol) { @apply list-decimal; }
:deep(.prose ul) { @apply list-disc; }
:deep(.prose code) { @apply bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-800; }
:deep(.prose table) { @apply w-full text-sm border-collapse mb-3; }
:deep(.prose td) { @apply border border-slate-200 px-3 py-1.5 text-slate-600; }
:deep(.prose em) { @apply text-[var(--accent-700)] not-italic font-medium; }
:deep(.prose strong) { @apply font-semibold text-slate-900; }
</style>
