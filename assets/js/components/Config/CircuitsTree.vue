<template>
	<div data-testid="circuit-node">
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
				class="flex-grow-1 min-w-0"
				selectable
				:selected="selectedCircuit === circuitsTree?.name"
				@select="selectCircuit"
				@edit="editCircuit"
			>
				<span class="d-flex align-items-center gap-2 min-w-0">
					<span class="fw-bold text-truncate">{{ circuitsTree?.deviceTitle }}</span>
					<span class="ms-auto me-2 evcc-gray small tabular d-flex gap-1 min-w-0">
						<span class="text-nowrap">{{ limitsLabel }}</span>
						<span v-if="limitsLabel && meterLabel" aria-hidden="true">·</span>
						<span class="text-truncate">{{ meterLabel }}</span>
					</span>
				</span>
			</DeviceRefBox>
		</div>

		<div class="d-flex align-items-stretch row-spacing assigned-loadpoints">
			<span v-for="i in depth" :key="i" class="tree-col" />
			<span class="tree-col" />
			<div class="flex-grow-1 min-w-0">
				<div v-if="assignedLoadpoints().length" class="text-success small mb-1">
					{{ $t("config.circuits.dropToAssign") }}
				</div>
				<DragDropList
					transfer
					group="loadpoints"
					:values="assignedLoadpoints()"
					@transfer="handleTransfer"
				>
					<DragDropItem
						v-for="lp in assignedLoadpoints()"
						:key="lp.id"
						:data-id="String(lp.id)"
						:title="lp.title"
						:icon="loadpointIcon(lp)"
						:value="lp"
						@click="removeLoadpoint"
					/>
				</DragDropList>
			</div>
		</div>

		<CircuitsTree
			v-for="child in circuitsTree?.children"
			:key="child.name"
			:circuits-tree="child"
			:depth="depth + 1"
			:grid-meter="gridMeter"
			:loadpoints="loadpoints"
			:chargers="chargers"
			:selected-circuit="selectedCircuit"
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
import "@h2d2/shopicons/es/regular/car";
import "@h2d2/shopicons/es/regular/heat";

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
		selectedCircuit: { type: String, default: "" },
	},
	methods: {
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
			return lp.isHeater ? "shopicon-regular-heat" : "shopicon-regular-car";
		},
		removeLoadpoint(lp: AssignmentLoadpoint) {
			this.$emit("assign-loadpoint", { loadpointId: lp.id, circuit: null });
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
	emits: ["select-circuit", "assign-loadpoint"],
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
