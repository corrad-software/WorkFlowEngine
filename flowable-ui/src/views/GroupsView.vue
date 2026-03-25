<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Plus, Trash2, X } from "lucide-vue-next";
import { getGroups, createGroup, deleteGroup } from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import { useConfirmDialog } from "@/composables/useConfirmDialog";

const toast = useToast();
const dialog = useConfirmDialog();
const groups = ref<{ id: string; name: string; type: string }[]>([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({ id: "", name: "", type: "assignment" });

async function load() {
  loading.value = true;
  try {
    const res = await getGroups();
    groups.value = res.data || [];
  } catch {
    toast.error("Failed", "Could not load groups.");
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function openForm() {
  form.value = { id: "", name: "", type: "assignment" };
  showForm.value = true;
}

async function handleCreate() {
  if (!form.value.id || !form.value.name) return;
  try {
    await createGroup(form.value);
    toast.success("Created", `Group "${form.value.name}" created.`);
    showForm.value = false;
    await load();
  } catch {
    toast.error("Failed", "Could not create group.");
  }
}

async function remove(g: { id: string; name: string }) {
  const ok = await dialog.confirm({
    title: "Delete Group",
    message: `Delete group "${g.name}"?`,
    confirmText: "Delete",
    destructive: true,
  });
  if (!ok) return;
  try {
    await deleteGroup(g.id);
    toast.success("Deleted", `Group "${g.name}" removed.`);
    await load();
  } catch {
    toast.error("Failed", "Could not delete group.");
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="page-title">Groups</h1>
      <button
        @click="openForm"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
      >
        <Plus class="h-4 w-4" /> Add Group
      </button>
    </div>

    <!-- Create Form Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">New Group</h2>
          <button @click="showForm = false" class="text-slate-400 hover:text-slate-600"><X class="h-5 w-5" /></button>
        </div>
        <form @submit.prevent="handleCreate" class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Group ID *</label>
            <input v-model="form.id" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <input v-model="form.name" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select v-model="form.type" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]">
              <option value="assignment">Assignment</option>
              <option value="security-role">Security Role</option>
            </select>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="showForm = false" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" class="rounded-lg bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]">Create</button>
          </div>
        </form>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>
    <p v-else-if="groups.length === 0" class="text-sm text-slate-500">No groups found.</p>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-600">ID</th>
            <th class="px-4 py-3 font-medium text-slate-600">Name</th>
            <th class="px-4 py-3 font-medium text-slate-600">Type</th>
            <th class="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="g in groups" :key="g.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-900">{{ g.id }}</td>
            <td class="px-4 py-3 text-slate-600">{{ g.name }}</td>
            <td class="px-4 py-3 text-slate-600">{{ g.type || '-' }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="remove(g)" class="text-rose-500 hover:text-rose-700">
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
