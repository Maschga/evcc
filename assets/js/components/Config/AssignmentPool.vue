<template>
	<div
		class="assignment-pool card p-3 mb-3"
		:class="{ 'assignment-pool--drop-active': dropActive }"
		@dragenter="dropActive = true"
		@dragleave="dropActive = false"
	>
		<div class="d-flex justify-content-between align-items-center mb-2">
			<strong>{{ title }}</strong>
			<span class="text-success small">{{ hint }}</span>
		</div>
		<DragDropList
			transfer
			:group="group"
			:values="items"
			:accepts="accepts"
			@transfer="$emit('transfer', $event)"
		>
			<DragDropItem
				v-for="item in items"
				:key="item.id"
				:data-id="String(item.id)"
				:title="item.title"
				:icon="icon(item)"
				:value="item"
				@click="$emit('click', $event)"
			/>
		</DragDropList>
		<div v-if="items.length === 0" class="text-muted small">
			{{ emptyText }}
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { AssignmentLoadpoint } from "@/types/evcc";
import DragDropItem from "@/components/Helper/DragDropItem.vue";
import DragDropList from "@/components/Helper/DragDropList.vue";

export default defineComponent({
	name: "AssignmentPool",
	components: { DragDropItem, DragDropList },
	props: {
		title: { type: String, required: true },
		hint: { type: String, default: "" },
		emptyText: { type: String, required: true },
		group: { type: String, default: "loadpoints" },
		items: { type: Array as PropType<AssignmentLoadpoint[]>, required: true },
		accepts: { type: Function as PropType<(target: unknown) => boolean>, default: () => true },
	},
	emits: ["transfer", "click"],
	data() {
		return {
			dropActive: false,
		};
	},
	methods: {
		icon(item: AssignmentLoadpoint): string {
			return item.isHeater ? "shopicon-regular-heat" : "shopicon-regular-car";
		},
	},
});
</script>

<style scoped>
.assignment-pool {
	background-color: rgba(var(--bs-body-bg-rgb), 1);
	border: 1px dashed var(--bs-border-color);
	transition: background-color 150ms ease;
}
.assignment-pool--drop-active {
	background-color: rgba(15, 222, 65, 0.12);
	border-color: var(--bs-success);
}
</style>
