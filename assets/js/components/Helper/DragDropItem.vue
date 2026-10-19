<template>
	<div
		class="drag-drop-item d-flex align-items-center p-2 mb-2 border rounded"
		:class="{
			'drag-drop-item--hidden': !visible,
			'drag-drop-item--selected': selected,
		}"
		role="listitem"
		:data-id="dataId"
		:aria-label="$t('config.general.dragItem', { title })"
		tabindex="0"
		:aria-selected="selected"
		@click.stop="$emit('click', value)"
		@keydown.enter.self.stop.prevent="$emit('click', value)"
		@keydown.space.self.stop.prevent="$emit('click', value)"
	>
		<div class="drag-handle me-2" aria-hidden="true">
			<shopicon-regular-menu></shopicon-regular-menu>
		</div>
		<component :is="icon" v-if="icon" class="flex-shrink-0 me-2" />
		<div class="flex-grow-1">
			<slot>
				{{ title }}
			</slot>
		</div>
		<div v-if="$slots['actions']" class="drag-drop-item__actions">
			<slot name="actions"></slot>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import "@h2d2/shopicons/es/regular/menu";

export default defineComponent({
	name: "DragDropItem",
	props: {
		title: { type: String, default: "" },
		visible: { type: Boolean, default: true },
		selected: { type: Boolean, default: false },
		icon: { type: String, default: "" },
		dataId: { type: String, default: "" },
		value: { type: Object, default: () => undefined },
	},
	emits: ["click"],
});
</script>

<style scoped>
.drag-drop-item {
	cursor: grab;
	user-select: none;
	background-color: var(--evcc-box);
	border-color: var(--bs-border-color-translucent) !important;
	transition: all var(--evcc-transition-fast) ease-in-out;
	transform: translate(0, 0);
}

.drag-drop-item:active {
	cursor: grabbing;
}

.drag-drop-item--selected {
	border-color: var(--bs-success) !important;
	background-color: rgba(15, 222, 65, 0.12);
}

.drag-drop-item--hidden {
	opacity: 0.6;
}

.drag-handle {
	color: var(--bs-secondary);
	opacity: 0.7;
	transition: opacity var(--evcc-transition-fast) ease-in-out;
	cursor: inherit;
}

.drag-handle > * {
	pointer-events: none;
}

.drag-drop-item:hover .drag-handle {
	opacity: 1;
}

.drag-drop-item__actions {
	display: flex;
	align-items: center;
}
</style>
