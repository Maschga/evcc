<template>
	<div
		class="assignment-pool card p-3 mb-3"
		role="region"
		:aria-label="title"
		@click="$emit('assign')"
		:class="{ 'assignment-pool--drop-active': dropActive }"
		@dragenter="dropActive = true"
		@dragleave="leaveHover"
		@drop="resetHover"
	>
		<DragDropList
			transfer
			:group="group"
			name="__unassigned__"
			:label="title"
			:values="items"
			:accepts="accepts"
			class="assignment-pool__target"
			@transfer="$emit('transfer', $event)"
		>
			<div class="d-flex justify-content-between align-items-center mb-2">
				<button
					v-if="selectedLoadpoint !== undefined"
					type="button"
					class="btn btn-link p-0 fw-bold text-body"
					@click.stop="$emit('assign')"
				>
					{{ title }}
				</button>
				<strong v-else>{{ title }}</strong>
				<span class="text-success small">{{ hint }}</span>
			</div>

			<DragDropItem
				v-for="item in items"
				:key="item.id"
				:data-id="String(item.id)"
				:title="item.title"
				:icon="icon(item)"
				:value="item"
				:selected="selectedLoadpoint === item.id"
				@click="$emit('click', $event)"
			/>
			<div v-if="items.length === 0" class="text-muted small">
				{{ emptyText }}
			</div>
		</DragDropList>
	</div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { AssignmentLoadpoint } from "@/types/evcc";
import DragDropItem from "@/components/Helper/DragDropItem.vue";
import DragDropList from "@/components/Helper/DragDropList.vue";
import "@h2d2/shopicons/es/regular/car1";
import "@h2d2/shopicons/es/regular/thermometerhalf";

export default defineComponent({
	name: "AssignmentPool",
	components: { DragDropItem, DragDropList },
	props: {
		title: { type: String, required: true },
		hint: { type: String, default: "" },
		emptyText: { type: String, required: true },
		group: { type: String, default: "loadpoints" },
		selectedLoadpoint: { type: Number },
		items: { type: Array as PropType<AssignmentLoadpoint[]>, required: true },
		accepts: { type: Function as PropType<(target: unknown) => boolean>, default: () => true },
	},
	emits: ["transfer", "click", "assign"],
	data() {
		return {
			dropActive: false,
		};
	},
	methods: {
		leaveHover(event: DragEvent) {
			if (event.relatedTarget instanceof Node && this.$el.contains(event.relatedTarget))
				return;
			this.resetHover();
		},
		resetHover() {
			this.dropActive = false;
		},
		icon(item: AssignmentLoadpoint): string {
			return item.isHeater ? "shopicon-regular-thermometerhalf" : "shopicon-regular-car1";
		},
	},
	mounted() {
		document.addEventListener("dragend", this.resetHover);
	},
	beforeUnmount() {
		document.removeEventListener("dragend", this.resetHover);
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
.assignment-pool__target {
	min-height: 64px;
}
.assignment-pool:has(.drag-drop-list--over) {
	background-color: rgba(15, 222, 65, 0.12);
	border-color: var(--bs-success);
}
</style>
