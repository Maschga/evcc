<template>
	<div ref="container" role="list" :aria-label="label || $t('config.general.dragList')">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { dragAndDrop, tearDown } from "@formkit/drag-and-drop";

export interface TransferEvent<T> {
	item: T;
	from: string;
	to: string;
}

export default defineComponent({
	name: "DragDropList",
	props: {
		values: { type: Array, required: true },
		transfer: { type: Boolean, default: false },
		group: { type: String, default: "" },
		name: { type: String, default: "" },
		label: { type: String, default: "" },
		accepts: {
			type: Function as PropType<(target: unknown) => boolean>,
			default: () => true,
		},
	},
	emits: ["reorder", "transfer"],
	mounted() {
		const container = this.$refs["container"] as HTMLElement;
		dragAndDrop({
			parent: container,
			getValues: () => [...this.values],
			// The parent owns values and updates them after persistence succeeds.
			setValues: () => {},
			config: this.transfer
				? {
						group: this.group || undefined,
						name: this.name || undefined,
						draggable: (child) => child.classList.contains("drag-drop-item"),
						dropZoneParentClass: "drag-drop-list--over",
						synthDropZoneParentClass: "drag-drop-list--over",
						sortable: false,
						dragEffectAllowed: "move",
						dragDropEffect: "move",
						accepts: (targetParent) => this.accepts(targetParent),
						onTransfer: (data) => {
							if (data.targetParent.el !== container) return;
							const item = data.draggedNodes[0]?.data.value;
							if (item !== undefined) {
								this.$emit("transfer", {
									item,
									from: data.sourceParent.data.config.name || "",
									to: data.targetParent.data.config.name || "",
								});
							}
						},
					}
				: {
						onSort: (data) => this.$emit("reorder", data.values),
					},
		});
	},
	beforeUnmount() {
		tearDown(this.$refs["container"] as HTMLElement);
	},
});
</script>

<style>
/* Overwrites Animation for Drag-Elements */
.drag-drop-item[style*="position: fixed"],
.drag-drop-item[style*="z-index: 9999"] {
	transition: none !important;
	animation: none !important;
}
</style>
