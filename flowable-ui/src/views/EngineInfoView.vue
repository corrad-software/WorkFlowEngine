<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Server, Database, Box, Code2, ArrowRight } from "lucide-vue-next";
import { getEngineInfo } from "@/api/flowable";

const router = useRouter();
const info = ref<{ name: string; version: string } | null>(null);

onMounted(async () => {
  try { info.value = await getEngineInfo(); } catch {}
});

const cards = [
  { title: "Tech Stack", description: "Technologies powering this platform — engine, database, runtime, frontend", icon: Box, color: "from-violet-500 to-violet-600", route: "/engine/tech-stack" },
  { title: "Database Stats", description: "Live row counts from key tables across all engine modules", icon: Database, color: "from-emerald-500 to-emerald-600", route: "/engine/db-stats" },
  { title: "DB Schema", description: "Complete schema reference — 62 tables across 9 modules", icon: Code2, color: "from-amber-500 to-amber-600", route: "/engine/schema" },
];
</script>

<template>
  <div>
    <h1 class="page-title mb-6">Engine Info</h1>

    <!-- Engine Card -->
    <div class="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <Server class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-slate-900">Flowable Engine</h2>
          <p class="text-xs text-slate-400">Process automation platform</p>
        </div>
      </div>
      <div v-if="info" class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-lg bg-slate-50 p-3">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Engine</p>
          <p class="text-lg font-bold text-slate-900">{{ info.name }}</p>
        </div>
        <div class="rounded-lg bg-slate-50 p-3">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Version</p>
          <p class="text-lg font-bold text-slate-900">{{ info.version }}</p>
        </div>
        <div class="rounded-lg bg-slate-50 p-3">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Database</p>
          <p class="text-lg font-bold text-slate-900">PostgreSQL 16</p>
        </div>
        <div class="rounded-lg bg-slate-50 p-3">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Java</p>
          <p class="text-lg font-bold text-slate-900">JDK 21</p>
        </div>
      </div>
      <p v-else class="text-sm text-slate-500">Loading...</p>
    </div>

    <!-- Sub-page cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <button
        v-for="card in cards"
        :key="card.route"
        @click="router.push(card.route)"
        class="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-left transition hover:border-[var(--accent-300)] hover:shadow-md"
      >
        <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white" :class="card.color">
          <component :is="card.icon" class="h-5 w-5" />
        </div>
        <h3 class="text-base font-semibold text-slate-900">{{ card.title }}</h3>
        <p class="mt-1 flex-1 text-sm text-slate-500">{{ card.description }}</p>
        <div class="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--accent-600)] group-hover:text-[var(--accent-700)]">
          View <ArrowRight class="h-3 w-3" />
        </div>
      </button>
    </div>
  </div>
</template>
