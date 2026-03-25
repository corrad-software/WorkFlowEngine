<script setup lang="ts">
import { useRoute } from "vue-router";
import AdminLayout from "@/layouts/AdminLayout.vue";
import AppConfirmDialog from "@/components/AppConfirmDialog.vue";

const route = useRoute();
</script>

<template>
  <AdminLayout v-if="route.name !== 'login'">
    <router-view />
  </AdminLayout>
  <router-view v-else />
  <AppConfirmDialog />
</template>
