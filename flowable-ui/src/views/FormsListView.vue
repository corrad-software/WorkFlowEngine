<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Copy, Pencil, Plus, Trash2 } from "lucide-vue-next";
import { useToast } from "@/composables/useToast";
import { useConfirmDialog } from "@/composables/useConfirmDialog";

type FormDefinition = {
  id: string;
  name: string;
  description: string;
  fields: { id: string; name: string; type: string }[];
  createdAt: string;
  updatedAt: string;
};

const router = useRouter();
const toast = useToast();
const dialog = useConfirmDialog();
const forms = ref<FormDefinition[]>([]);

function load() {
  try {
    forms.value = JSON.parse(localStorage.getItem("flowable-forms") || "[]");
  } catch {
    forms.value = [];
  }
}

onMounted(load);

async function remove(form: FormDefinition) {
  const ok = await dialog.confirm({
    title: "Delete Form",
    message: `Delete "${form.name}"?`,
    confirmText: "Delete",
    destructive: true,
  });
  if (!ok) return;
  const all = forms.value.filter((f) => f.id !== form.id);
  localStorage.setItem("flowable-forms", JSON.stringify(all));
  forms.value = all;
  toast.success("Deleted", `"${form.name}" removed.`);
}

function duplicate(form: FormDefinition) {
  const copy: FormDefinition = {
    ...JSON.parse(JSON.stringify(form)),
    id: "form_" + Math.random().toString(36).slice(2, 10),
    name: form.name + " (copy)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = [...forms.value, copy];
  localStorage.setItem("flowable-forms", JSON.stringify(all));
  forms.value = all;
  toast.success("Duplicated", `"${copy.name}" created.`);
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="page-title">Forms</h1>
      <button
        @click="router.push('/forms/new')"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
      >
        <Plus class="h-4 w-4" /> New Form
      </button>
    </div>

    <p v-if="forms.length === 0" class="text-sm text-slate-500">
      No forms yet. Create one to design reusable task forms for your BPMN processes.
    </p>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="form in forms"
        :key="form.id"
        class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[var(--accent-300)] hover:shadow-md"
      >
        <div class="mb-3 flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-base font-semibold text-slate-900">{{ form.name }}</h3>
            <p v-if="form.description" class="mt-0.5 truncate text-xs text-slate-500">{{ form.description }}</p>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap gap-1.5">
          <span
            v-for="field in form.fields.slice(0, 5)"
            :key="field.id"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
          >
            {{ field.name || field.id }}
          </span>
          <span v-if="form.fields.length > 5" class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">
            +{{ form.fields.length - 5 }} more
          </span>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-[11px] text-slate-400">{{ form.fields.length }} fields &middot; {{ new Date(form.updatedAt).toLocaleDateString() }}</p>
          <div class="flex gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              @click="router.push(`/forms/${form.id}`)"
              class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[var(--accent-600)]"
              title="Edit"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              @click="duplicate(form)"
              class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Duplicate"
            >
              <Copy class="h-4 w-4" />
            </button>
            <button
              @click="remove(form)"
              class="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              title="Delete"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
