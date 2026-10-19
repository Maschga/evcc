<template>
	<div data-testid="circuit-node">
		<DragDropList
			transfer
			group="loadpoints"
			:name="circuitsTree?.name"
			:label="circuitsTree?.deviceTitle"
			:values="assignedLoadpoints()"
			@transfer="handleTransfer"
			class="circuit-drop-target"
		>
			<div class="d-flex align-items-stretch row-spacing">
				<template v-if="depth > 0">
					<span v-for="i in depth - 1" :key="i" class="tree-col">
						<span class="tree-line" />
					</span>
					<span class="tree-col">
						<span class="tree-line" />
						<span class="tree-knick" />
					</span>
				</template>
				<DeviceRefBox
					compact
					role="button"
					:aria-label="circuitsTree?.deviceTitle"
					tabindex="0"
					@keydown.enter.self.prevent="activateCircuit"
					@keydown.space.self.prevent="activateCircuit"
					class="flex-grow-1 min-w-0"
					:selectable="selectedLoadpoint !== undefined"
					@select="selectCircuit"
					@edit="editCircuit"
				>
					<span class="d-flex align-items-center gap-2 min-w-0">
						<span class="fw-bold text-truncate">{{ circuitsTree?.deviceTitle }}</span>
						<span class="circuit-drop-hint text-success small">{{
							$t("config.circuits.dropToAssign")
						}}</span>
						<span class="ms-auto me-2 evcc-gray small tabular d-flex gap-1 min-w-0">
							<span class="text-nowrap">{{ limitsLabel }}</span>
							<span v-if="limitsLabel && meterLabel" aria-hidden="true">·</span>
							<span class="text-truncate">{{ meterLabel }}</span>
						</span>
					</span>
				</DeviceRefBox>
			</div>

			<DragDropItem
				v-for="lp in assignedLoadpoints()"
				:key="lp.id"
				:data-id="String(lp.id)"
				:title="lp.title"
				:icon="loadpointIcon(lp)"
				:value="lp"
				:selected="selectedLoadpoint === lp.id"
				@click="$emit('select-loadpoint', $event)"
			/>
		</DragDropList>

		<CircuitsTree
			v-for="child in circuitsTree?.children"
			:key="child.name"
			:circuits-tree="child"
			:depth="depth + 1"
			:grid-meter="gridMeter"
			:loadpoints="loadpoints"
			:chargers="chargers"
			:selected-loadpoint="selectedLoadpoint"
			@select-loadpoint="$emit('select-loadpoint', $event)"
			@select-circuit="$emit('select-circuit', $event)"
			@assign-loadpoint="$emit('assign-loadpoint', $event)"
		/>

		<div class="d-flex align-items-stretch row-spacing">
			<span v-for="i in depth" :key="i" class="tree-col">
				<span class="tree-line" />
			</span>
			<span class="tree-col">
				<span class="tree-line tree-line--half" />
				<span class="tree-knick" />
			</span>
			<button
				type="button"
				class="d-flex btn btn-sm btn-outline-secondary border-0 align-items-center gap-2 evcc-gray"
				data-testid="circuit-add-sub"
				tabindex="0"
				@click="addSub"
			>
				<AddIcon :size="ICON_SIZE.XS" class="flex-shrink-0" />

				{{ $t("config.circuits.addSubCircuit") }}
			</button>
		</div>
	</div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import DeviceRefBox from "./DeviceRefBox.vue";
import AddIcon from "../MaterialIcon/Add.vue";
import DragDropItem from "@/components/Helper/DragDropItem.vue";
import DragDropList from "@/components/Helper/DragDropList.vue";
import formatter from "@/mixins/formatter.ts";
import { openModal } from "@/configModal.ts";
import type { ConfigCircuitNode } from "@/utils/circuits.ts";
import {
	ICON_SIZE,
	type ConfigMeter,
	type AssignmentLoadpoint,
	type ConfigCharger,
} from "@/types/evcc";
import "@h2d2/shopicons/es/regular/car1";
import "@h2d2/shopicons/es/regular/thermometerhalf";

export default {
	name: "CircuitsTree",
	mixins: [formatter],
	components: { DeviceRefBox, AddIcon, DragDropItem, DragDropList },
	props: {
		circuitsTree: {
			type: Object as PropType<ConfigCircuitNode>,
		},
		/** Nesting depth from root (0 = root, no indentation/lines). */
		depth: { type: Number, default: 0 },
		gridMeter: { type: Object as PropType<ConfigMeter> },
		loadpoints: { type: Array as PropType<AssignmentLoadpoint[]>, default: () => [] },
		chargers: { type: Array as PropType<ConfigCharger[]>, default: () => [] },
		selectedLoadpoint: { type: Number },
	},
	methods: {
		activateCircuit() {
			if (this.selectedLoadpoint !== undefined) this.selectCircuit();
			else this.editCircuit();
		},
		addSub() {
			openModal("circuit", { parent: this.circuitsTree?.id });
		},
		editCircuit() {
			openModal("circuit", { id: this.circuitsTree?.id });
		},
		selectCircuit() {
			this.$emit("select-circuit", this.circuitsTree?.name || "");
		},
		assignedLoadpoints(): AssignmentLoadpoint[] {
			const circuitName = this.circuitsTree?.name;
			return this.loadpoints.filter((lp) => lp.circuit === circuitName);
		},
		loadpointIcon(lp: AssignmentLoadpoint): string {
			return lp.isHeater ? "shopicon-regular-thermometerhalf" : "shopicon-regular-car1";
		},

		handleTransfer(event: { item: AssignmentLoadpoint; from: string; to: string }) {
			if (event.to === event.from) return;
			if (event.to === this.circuitsTree?.name) {
				this.$emit("assign-loadpoint", {
					loadpointId: event.item.id,
					circuit: this.circuitsTree?.name,
				});
			}
		},
	},
	emits: ["select-circuit", "select-loadpoint", "assign-loadpoint"],
	data() {
		return { ICON_SIZE };
	},
	computed: {
		limitsLabel(): string {
			if (!this.circuitsTree) return "";
			const maxpower = Number(this.circuitsTree.config.maxpower);
			const maxcurrent = Number(this.circuitsTree.config.maxcurrent);
			const parts: string[] = [];
			if (maxpower > 0) parts.push(this.fmtW(maxpower, this.POWER_UNIT.AUTO));
			if (maxcurrent > 0) parts.push(`${this.fmtNumber(maxcurrent, 0)} A`);
			return parts.join(" · ");
		},
		meterLabel(): string {
			if (!this.circuitsTree) return "";
			const meterRef = this.circuitsTree.config.meter;
			if (!meterRef) return "";
			return this.$t(
				meterRef === this.gridMeter?.name
					? "config.circuits.meterGrid"
					: "config.circuits.meterDedicated"
			);
		},
	},
};
</script>

<style scoped>
.circuit-drop-target {
	min-height: 48px;
	border-radius: var(--bs-border-radius);
}
.circuit-drop-target.drag-drop-list--over {
	background-color: rgba(15, 222, 65, 0.12);
}
.circuit-drop-hint {
	display: none;
}
.drag-drop-list--over .circuit-drop-hint {
	display: inline;
}
.row-spacing {
	margin-bottom: 8px;
}

.tree-col {
	width: 22px;
	position: relative;
	flex: 0 0 auto;
}

.tree-line {
	position: absolute;
	left: 10px;
	top: -8px;
	bottom: -8px;
	width: 1px;
	background: var(--evcc-gray-25);
}

.tree-line--half {
	bottom: auto;
	height: calc(50% + 8px);
}

.tree-knick {
	position: absolute;
	left: 10px;
	top: 50%;
	width: 12px;
	height: 1px;
	background: var(--evcc-gray-25);
}
</style>
