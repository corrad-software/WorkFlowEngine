<script setup lang="ts">
import { useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";

const router = useRouter();

const techStack = [
  { category: "Engine", items: [
    { name: "Flowable", version: "8.0.0", description: "BPMN, CMMN, DMN workflow engine" },
    { name: "Spring Boot", version: "4.0.2", description: "Application framework" },
    { name: "Apache Tomcat", version: "11.x", description: "Embedded servlet container" },
    { name: "MyBatis", version: "3.x", description: "SQL mapping framework" },
  ]},
  { category: "Database", items: [
    { name: "PostgreSQL", version: "16 (Alpine)", description: "Primary database" },
    { name: "HikariCP", version: "5.x", description: "Connection pool" },
    { name: "Liquibase", version: "4.x", description: "Schema migrations (identity tables)" },
  ]},
  { category: "Runtime", items: [
    { name: "Java", version: "21 (Eclipse Temurin)", description: "JVM runtime" },
    { name: "Docker", version: "29.x", description: "Container runtime" },
    { name: "Docker Compose", version: "5.x", description: "Multi-container orchestration" },
  ]},
  { category: "Frontend", items: [
    { name: "Vue.js", version: "3.5", description: "UI framework (Composition API)" },
    { name: "TypeScript", version: "5.9", description: "Type-safe JavaScript" },
    { name: "Vite", version: "8.0", description: "Build tool & dev server" },
    { name: "Tailwind CSS", version: "3.4", description: "Utility-first CSS framework" },
    { name: "bpmn-js", version: "latest", description: "BPMN diagram modeler & viewer (bpmn.io)" },
    { name: "Pinia", version: "3.x", description: "State management" },
    { name: "Vue Router", version: "4.x", description: "Client-side routing" },
    { name: "Lucide Icons", version: "latest", description: "Open-source icon library" },
  ]},
];
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <button @click="router.push('/engine')" class="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50">
        <ArrowLeft class="h-4 w-4" />
      </button>
      <h1 class="page-title">Tech Stack</h1>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div v-for="group in techStack" :key="group.category" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{{ group.category }}</h3>
        <div class="space-y-3">
          <div v-for="item in group.items" :key="item.name" class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-900">{{ item.name }}</p>
              <p class="text-[11px] text-slate-400">{{ item.description }}</p>
            </div>
            <span class="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">{{ item.version }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
