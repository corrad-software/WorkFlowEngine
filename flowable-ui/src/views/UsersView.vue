<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Plus, Trash2, X } from "lucide-vue-next";
import { getUsers, createUser, deleteUser } from "@/api/flowable";
import { useToast } from "@/composables/useToast";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import type { User } from "@/types";

const toast = useToast();
const dialog = useConfirmDialog();
const users = ref<User[]>([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({ id: "", firstName: "", lastName: "", email: "", password: "" });

async function load() {
  loading.value = true;
  try {
    const res = await getUsers();
    users.value = res.data || [];
  } catch {
    toast.error("Failed", "Could not load users.");
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function openForm() {
  form.value = { id: "", firstName: "", lastName: "", email: "", password: "" };
  showForm.value = true;
}

async function handleCreate() {
  if (!form.value.id) return;
  try {
    await createUser(form.value);
    toast.success("Created", `User "${form.value.id}" created.`);
    showForm.value = false;
    await load();
  } catch {
    toast.error("Failed", "Could not create user.");
  }
}

async function remove(user: User) {
  const ok = await dialog.confirm({
    title: "Delete User",
    message: `Delete user "${user.id}"?`,
    confirmText: "Delete",
    destructive: true,
  });
  if (!ok) return;
  try {
    await deleteUser(user.id);
    toast.success("Deleted", `User "${user.id}" removed.`);
    await load();
  } catch {
    toast.error("Failed", "Could not delete user.");
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="page-title">Users</h1>
      <button
        @click="openForm"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
      >
        <Plus class="h-4 w-4" /> Add User
      </button>
    </div>

    <!-- Create Form Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">New User</h2>
          <button @click="showForm = false" class="text-slate-400 hover:text-slate-600"><X class="h-5 w-5" /></button>
        </div>
        <form @submit.prevent="handleCreate" class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">User ID *</label>
            <input v-model="form.id" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">First Name</label>
              <input v-model="form.firstName" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
              <input v-model="form.lastName" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input v-model="form.email" type="email" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Password *</label>
            <input v-model="form.password" type="password" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]" />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="showForm = false" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" class="rounded-lg bg-[var(--accent-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]">Create</button>
          </div>
        </form>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Loading...</p>
    <p v-else-if="users.length === 0" class="text-sm text-slate-500">No users found.</p>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50">
          <tr>
            <th class="px-4 py-3 font-medium text-slate-600">ID</th>
            <th class="px-4 py-3 font-medium text-slate-600">Name</th>
            <th class="px-4 py-3 font-medium text-slate-600">Email</th>
            <th class="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-900">{{ user.id }}</td>
            <td class="px-4 py-3 text-slate-600">{{ user.firstName }} {{ user.lastName }}</td>
            <td class="px-4 py-3 text-slate-600">{{ user.email || '-' }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="remove(user)" class="text-rose-500 hover:text-rose-700">
                <Trash2 class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
