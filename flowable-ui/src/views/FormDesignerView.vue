<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-vue-next";
import { useToast } from "@/composables/useToast";

const route = useRoute();
const router = useRouter();
const toast = useToast();

export type FieldType = "string" | "long" | "double" | "boolean" | "date" | "enum";

export type FormField = {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  writable: boolean;
  defaultValue: string;
  options: { label: string; value: string }[]; // for enum type
};

export type FormDefinition = {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
};

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: "string", label: "Text", icon: "Aa" },
  { value: "long", label: "Number", icon: "#" },
  { value: "double", label: "Decimal", icon: ".0" },
  { value: "boolean", label: "Yes/No", icon: "?" },
  { value: "date", label: "Date", icon: "D" },
  { value: "enum", label: "Dropdown", icon: "v" },
];

// Load existing form or create new
const formId = computed(() => (route.params.id as string) || null);
const isEditing = computed(() => !!formId.value && formId.value !== "new");

const formName = ref("");
const formDescription = ref("");
const fields = ref<FormField[]>([]);
const selectedFieldIndex = ref<number | null>(null);
const showPreview = ref(false);
const previewValues = reactive<Record<string, string>>({});

// Load form from localStorage
function loadForms(): FormDefinition[] {
  try {
    return JSON.parse(localStorage.getItem("flowable-forms") || "[]");
  } catch {
    return [];
  }
}

function saveForms(forms: FormDefinition[]) {
  localStorage.setItem("flowable-forms", JSON.stringify(forms));
}

if (isEditing.value) {
  const forms = loadForms();
  const existing = forms.find((f) => f.id === formId.value);
  if (existing) {
    formName.value = existing.name;
    formDescription.value = existing.description;
    fields.value = existing.fields;
  }
}

function generateId() {
  return "field_" + Math.random().toString(36).slice(2, 8);
}

function addField(type: FieldType) {
  const field: FormField = {
    id: generateId(),
    name: "",
    type,
    required: false,
    writable: true,
    defaultValue: "",
    options: [],
  };
  fields.value.push(field);
  selectedFieldIndex.value = fields.value.length - 1;
}

function removeField(index: number) {
  fields.value.splice(index, 1);
  if (selectedFieldIndex.value === index) {
    selectedFieldIndex.value = null;
  } else if (selectedFieldIndex.value !== null && selectedFieldIndex.value > index) {
    selectedFieldIndex.value--;
  }
}

function duplicateField(index: number) {
  const original = fields.value[index];
  const copy: FormField = {
    ...JSON.parse(JSON.stringify(original)),
    id: generateId(),
    name: original.name + " (copy)",
  };
  fields.value.splice(index + 1, 0, copy);
}

function moveField(index: number, direction: -1 | 1) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= fields.value.length) return;
  const temp = fields.value[index];
  fields.value[index] = fields.value[newIndex];
  fields.value[newIndex] = temp;
  if (selectedFieldIndex.value === index) selectedFieldIndex.value = newIndex;
  else if (selectedFieldIndex.value === newIndex) selectedFieldIndex.value = index;
}

function addOption(field: FormField) {
  field.options.push({ label: "", value: "" });
}

function removeOption(field: FormField, index: number) {
  field.options.splice(index, 1);
}

function saveForm() {
  if (!formName.value.trim()) {
    toast.error("Required", "Form name is required.");
    return;
  }
  if (fields.value.length === 0) {
    toast.error("Required", "Add at least one field.");
    return;
  }
  // Validate field names
  for (const f of fields.value) {
    if (!f.id.trim() || !f.name.trim()) {
      toast.error("Required", "All fields must have an ID and name.");
      return;
    }
  }

  const forms = loadForms();
  const now = new Date().toISOString();

  if (isEditing.value) {
    const idx = forms.findIndex((f) => f.id === formId.value);
    if (idx >= 0) {
      forms[idx] = { ...forms[idx], name: formName.value, description: formDescription.value, fields: fields.value, updatedAt: now };
    }
  } else {
    const newForm: FormDefinition = {
      id: "form_" + Math.random().toString(36).slice(2, 10),
      name: formName.value,
      description: formDescription.value,
      fields: fields.value,
      createdAt: now,
      updatedAt: now,
    };
    forms.push(newForm);
  }

  saveForms(forms);
  toast.success("Saved", `Form "${formName.value}" saved.`);
  router.push("/forms");
}

function exportBpmnSnippet() {
  const lines = fields.value.map((f) => {
    let attrs = `id="${f.id}" name="${f.name}" type="${f.type}"`;
    if (f.required) attrs += ` required="true"`;
    if (!f.writable) attrs += ` writable="false"`;
    if (f.defaultValue) attrs += ` default="${f.defaultValue}"`;
    if (f.type === "enum" && f.options.length > 0) {
      const inner = f.options.map((o) => `          <flowable:value id="${o.value}" name="${o.label}" />`).join("\n");
      return `        <flowable:formProperty ${attrs}>\n${inner}\n        </flowable:formProperty>`;
    }
    return `        <flowable:formProperty ${attrs} />`;
  });

  const xml = `      <extensionElements>\n${lines.join("\n")}\n      </extensionElements>`;

  navigator.clipboard.writeText(xml).then(() => {
    toast.success("Copied", "BPMN XML snippet copied to clipboard. Paste it inside a <userTask> element.");
  }).catch(() => {
    // Fallback: show in alert
    toast.info("XML Snippet", "Check console for the XML snippet.");
    console.log(xml);
  });
}

function togglePreview() {
  showPreview.value = !showPreview.value;
  if (showPreview.value) {
    for (const f of fields.value) {
      previewValues[f.id] = f.defaultValue || "";
    }
  }
}

const selectedField = computed(() =>
  selectedFieldIndex.value !== null ? fields.value[selectedFieldIndex.value] : null,
);

function fieldTypeLabel(type: FieldType) {
  return FIELD_TYPES.find((t) => t.value === type)?.label || type;
}
</script>

<template>
  <div class="flex h-[calc(100vh-40px-2rem)] gap-4">
    <!-- Left: Field Palette + Field List -->
    <div class="flex w-80 flex-shrink-0 flex-col">
      <!-- Header -->
      <div class="mb-4 flex items-center gap-3">
        <button @click="router.push('/forms')" class="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50">
          <ArrowLeft class="h-4 w-4" />
        </button>
        <div class="flex-1">
          <input
            v-model="formName"
            placeholder="Form name..."
            class="w-full border-b border-transparent bg-transparent text-lg font-bold text-slate-900 focus:border-[var(--accent-500)] focus:outline-none"
          />
          <input
            v-model="formDescription"
            placeholder="Description (optional)"
            class="mt-0.5 w-full border-b border-transparent bg-transparent text-xs text-slate-500 focus:border-slate-300 focus:outline-none"
          />
        </div>
      </div>

      <!-- Add Field Palette -->
      <div class="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Add Field</p>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="ft in FIELD_TYPES"
            :key="ft.value"
            @click="addField(ft.value)"
            class="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-700 transition hover:border-[var(--accent-500)] hover:bg-[var(--accent-50)]"
          >
            <span class="flex h-7 w-7 items-center justify-center rounded-md bg-white text-sm font-bold text-[var(--accent-600)] shadow-sm">{{ ft.icon }}</span>
            {{ ft.label }}
          </button>
        </div>
      </div>

      <!-- Fields List -->
      <div class="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-3 py-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Fields ({{ fields.length }})</p>
        </div>
        <div v-if="fields.length === 0" class="p-4 text-center text-sm text-slate-400">
          Click a field type above to add fields
        </div>
        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="(field, i) in fields"
            :key="field.id"
            class="flex items-center gap-2 px-2 py-2 transition-colors cursor-pointer"
            :class="selectedFieldIndex === i ? 'bg-[var(--accent-50)]' : 'hover:bg-slate-50'"
            @click="selectedFieldIndex = i"
          >
            <GripVertical class="h-4 w-4 shrink-0 text-slate-300" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-900">{{ field.name || field.id }}</p>
              <p class="text-[11px] text-slate-400">{{ fieldTypeLabel(field.type) }}{{ field.required ? ' *' : '' }}</p>
            </div>
            <div class="flex items-center gap-0.5">
              <button @click.stop="moveField(i, -1)" class="rounded p-0.5 text-slate-400 hover:text-slate-600" :disabled="i === 0">
                <ChevronUp class="h-3.5 w-3.5" />
              </button>
              <button @click.stop="moveField(i, 1)" class="rounded p-0.5 text-slate-400 hover:text-slate-600" :disabled="i === fields.length - 1">
                <ChevronDown class="h-3.5 w-3.5" />
              </button>
              <button @click.stop="duplicateField(i)" class="rounded p-0.5 text-slate-400 hover:text-slate-600">
                <Copy class="h-3.5 w-3.5" />
              </button>
              <button @click.stop="removeField(i)" class="rounded p-0.5 text-rose-400 hover:text-rose-600">
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-3 flex gap-2">
        <button
          @click="togglePreview"
          class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Eye class="h-4 w-4" /> {{ showPreview ? 'Edit' : 'Preview' }}
        </button>
        <button
          @click="exportBpmnSnippet"
          class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Copy class="h-4 w-4" /> Copy XML
        </button>
        <button
          @click="saveForm"
          class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-700)]"
        >
          <Save class="h-4 w-4" /> Save
        </button>
      </div>
    </div>

    <!-- Right: Field Editor / Preview -->
    <div class="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <!-- Preview Mode -->
      <template v-if="showPreview">
        <h2 class="mb-1 text-lg font-bold text-slate-900">{{ formName || 'Untitled Form' }}</h2>
        <p v-if="formDescription" class="mb-6 text-sm text-slate-500">{{ formDescription }}</p>

        <div v-if="fields.length === 0" class="text-center text-sm text-slate-400 py-12">No fields to preview</div>

        <form class="space-y-4" @submit.prevent>
          <div v-for="field in fields" :key="field.id">
            <label class="mb-1 block text-sm font-medium text-slate-700">
              {{ field.name || field.id }}
              <span v-if="field.required" class="text-rose-500">*</span>
            </label>

            <select
              v-if="field.type === 'boolean'"
              v-model="previewValues[field.id]"
              :disabled="!field.writable"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">-- Select --</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>

            <select
              v-else-if="field.type === 'enum'"
              v-model="previewValues[field.id]"
              :disabled="!field.writable"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">-- Select --</option>
              <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>

            <input
              v-else
              v-model="previewValues[field.id]"
              :type="field.type === 'long' || field.type === 'double' ? 'number' : field.type === 'date' ? 'date' : 'text'"
              :disabled="!field.writable"
              :required="field.required"
              :placeholder="field.name || field.id"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </div>

          <button
            type="submit"
            class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Complete Task
          </button>
        </form>
      </template>

      <!-- Field Editor -->
      <template v-else-if="selectedField">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-slate-900">Edit Field</h2>
          <button @click="selectedFieldIndex = null" class="text-slate-400 hover:text-slate-600">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Field ID *</label>
            <input
              v-model="selectedField.id"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              placeholder="e.g. employeeName"
            />
            <p class="mt-1 text-[11px] text-slate-400">Used as the variable name in the process</p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Label *</label>
            <input
              v-model="selectedField.name"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              placeholder="e.g. Employee Name"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              v-model="selectedField.type"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
            >
              <option v-for="ft in FIELD_TYPES" :key="ft.value" :value="ft.value">{{ ft.label }}</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Default Value</label>
            <input
              v-model="selectedField.defaultValue"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              placeholder="Optional"
            />
          </div>

          <!-- Enum Options -->
          <div v-if="selectedField.type === 'enum'">
            <label class="mb-2 block text-sm font-medium text-slate-700">Dropdown Options</label>
            <div class="space-y-2">
              <div v-for="(opt, oi) in selectedField.options" :key="oi" class="flex gap-2">
                <input
                  v-model="opt.value"
                  placeholder="Value"
                  class="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono focus:border-[var(--accent-500)] focus:outline-none"
                />
                <input
                  v-model="opt.label"
                  placeholder="Label"
                  class="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-[var(--accent-500)] focus:outline-none"
                />
                <button @click="removeOption(selectedField, oi)" class="shrink-0 text-rose-400 hover:text-rose-600">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              @click="addOption(selectedField)"
              class="mt-2 inline-flex items-center gap-1 text-sm text-[var(--accent-600)] hover:text-[var(--accent-700)]"
            >
              <Plus class="h-3.5 w-3.5" /> Add option
            </button>
          </div>

          <!-- Toggles -->
          <div class="flex gap-6 pt-2">
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" v-model="selectedField.required" class="rounded border-slate-300 text-[var(--accent-600)] focus:ring-[var(--accent-ring)]" />
              Required
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" v-model="selectedField.writable" class="rounded border-slate-300 text-[var(--accent-600)] focus:ring-[var(--accent-ring)]" />
              Editable
            </label>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <template v-else>
        <div class="flex h-full items-center justify-center text-center">
          <div>
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Plus class="h-8 w-8 text-slate-400" />
            </div>
            <p class="text-lg font-semibold text-slate-900">Form Designer</p>
            <p class="mt-1 text-sm text-slate-500">Add fields from the palette on the left,<br />then click a field to edit its properties</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
