<template>
	<div ref="container" role="list" :aria-label="$t('config.general.dragList')">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { dragAndDrop } from "@formkit/drag-and-drop/vue";

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
		accepts: {
			type: Function as PropType<(target: unknown) => boolean>,
			default: () => true,
		},
	},
	emits: ["reorder", "transfer"],
	mounted() {
		const container = this.$refs["container"] as HTMLElement;
		if (!container) return;

		if (this.transfer) {
			dragAndDrop({
				parent: container,
				values: this.values,
				group: this.group || undefined,
				name: this.group || undefined,
				sortable: false,
				nativeDrag: true,
				dragEffectAllowed: "move",
				dragDropEffect: "move",
				accepts: (targetParent) => this.accepts(targetParent),
				onTransfer: (data) => {
					const item = data.draggedNodes[0]?.data.value;
					const from = data.sourceParent.data.config.name || "";
					const to = data.targetParent.data.config.name || "";
					if (item !== undefined) {
						this.$emit("transfer", { item, from, to });
					}
				},
			});
		} else {
			dragAndDrop({
				parent: container,
				values: this.values,
				onSort: (data) => {
					this.$emit("reorder", data.values);
				},
			});
		}
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
