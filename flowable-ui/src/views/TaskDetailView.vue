<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, CheckCircle2, Send } from "lucide-vue-next";
import { getTask, getTaskFormData, completeTask } from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import type { TaskItem } from "@/types";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const task = ref<TaskItem | null>(null);
const formFields = ref<{ id: string; name: string; type: string; value: string | null; writable: boolean; required: boolean }[]>([]);
const formValues = ref<Record<string, string>>({});
const loading = ref(true);
const submitting = ref(false);

onMounted(async () => {
  const id = route.params.id as string;
  try {
    task.value = await getTask(id);

    // Try to load form properties
    try {
      const formData = await getTaskFormData(id);
      if (formData.formProperties && formData.formProperties.length > 0) {
        formFields.value = formData.formProperties;
        for (const field of formFields.value) {
          formValues.value[field.id] = field.value || "";
        }
      }
    } catch {
      // No form data available - that's fine
    }
  } catch {
    toast.error("Failed", "Could not load task.");
  } finally {
    loading.value = false;
  }
});

async function handleComplete() {
  if (!task.value) return;
  submitting.value = true;
  try {
    const vars: Record<string, unknown> = {};
    for (const field of formFields.value) {
      if (field.writable) {
        const val = formValues.value[field.id];
        if (field.type === "long" || field.type === "double") {
          vars[field.id] = Number(val);
        } else if (field.type === "boolean") {
          vars[field.id] = val === "true";
        } else {
          vars[field.id] = val;
        }
      }
    }
    await completeTask(task.value.id, Object.keys(vars).length > 0 ? vars : undefined);
    toast.success("Completed", `Task "${task.value.name}" completed.`);
    router.push("/tasks");
  } catch {
    toast.error("Failed", "Could not complete task.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <button @click="router.push('/tasks')" class="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50">
        <ArrowLeft class="h-4 w-4" />
      </button>
      <div>
        <h1 class="page-title">{{ task?.name || 'Task' }}</h1>
        <p v-if="task" class="text-xs text-slate-500">ID: {{ task.id }}</p>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>

    <template v-else-if="task">
      <!-- Task Info -->
      <div class="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-4">
        <div>
          <p class="text-xs font-medium uppercase text-slate-400">Assignee</p>
          <p class="mt-1 text-sm font-medium text-slate-900">{{ task.assignee || 'Unassigned' }}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-slate-400">Priority</p>
          <p class="mt-1 text-sm font-medium text-slate-900">{{ task.priority }}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-slate-400">Created</p>
          <p class="mt-1 text-sm font-medium text-slate-900">{{ new Date(task.createTime).toLocaleString() }}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-slate-400">Due Date</p>
          <p class="mt-1 text-sm font-medium text-slate-900">{{ task.dueDate ? new Date(task.dueDate).toLocaleString() : 'None' }}</p>
        </div>
      </div>

      <!-- Description -->
      <div v-if="task.description" class="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="mb-1 text-xs font-medium uppercase text-slate-400">Description</p>
        <p class="text-sm text-slate-700">{{ task.description }}</p>
      </div>

      <!-- Dynamic Form -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-slate-900">
          {{ formFields.length > 0 ? 'Complete Task' : 'No Form Fields' }}
        </h2>

        <form @submit.prevent="handleComplete" class="space-y-4">
          <div v-for="field in formFields" :key="field.id">
            <label class="mb-1 block text-sm font-medium text-slate-700">
              {{ field.name || field.id }}
              <span v-if="field.required" class="text-rose-500">*</span>
            </label>

            <select
              v-if="field.type === 'boolean'"
              v-model="formValues[field.id]"
              :disabled="!field.writable"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] disabled:bg-slate-50"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>

            <textarea
              v-else-if="field.type === 'string' && (field.name || '').toLowerCase().includes('comment')"
              v-model="formValues[field.id]"
              :disabled="!field.writable"
              :required="field.required"
              rows="3"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] disabled:bg-slate-50"
            />

            <input
              v-else
              v-model="formValues[field.id]"
              :type="field.type === 'long' || field.type === 'double' ? 'number' : field.type === 'date' ? 'date' : 'text'"
              :disabled="!field.writable"
              :required="field.required"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] disabled:bg-slate-50"
            />
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              :disabled="submitting"
              class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 class="h-4 w-4" />
              {{ submitting ? 'Completing...' : 'Complete Task' }}
            </button>
            <router-link
              v-if="task.processInstanceId"
              :to="`/instances/${task.processInstanceId}`"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Send class="h-4 w-4" /> View Process
            </router-link>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>
