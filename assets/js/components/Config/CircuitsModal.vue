<template>
	<JsonModal
		id="circuitsModal"
		name="circuits"
		:title="$t('config.circuits.title')"
		:description="$t('config.circuits.description')"
		docs="/features/loadmanagement"
		endpoint="/config/circuits"
		state-key="circuits"
		data-testid="circuits-modal"
		no-buttons
		:autofocus="false"
		@changed="$emit('changed')"
		@open="resetSelection"
		@keydown.esc="resetSelection"
	>
		<template #default>
			<NewDeviceButton
				v-if="circuits.length === 0"
				:title="$t('config.circuits.addMainCircuit')"
				@click="openCircuit()"
			/>
			<div v-else>
				<AssignmentPool
					class="mb-3"
					:title="$t('config.circuits.notAssigned')"
					:hint="$t('config.circuits.dropToRemove')"
					:empty-text="$t('config.circuits.notAssignedEmpty')"
					group="loadpoints"
					:items="unassignedLoadpoints"
					:selected-loadpoint="selectedLoadpoint"
					@transfer="handlePoolTransfer"
					@assign="assignLoadpoint({ loadpointId: selectedLoadpoint, circuit: null })"
					@click="handlePoolClick"
				/>
				<CircuitsTree
					class="mb-3"
					:circuits-tree="configCircuitTree(circuits)"
					:grid-meter="gridMeter"
					:loadpoints="assignmentLoadpoints"
					:selected-loadpoint="selectedLoadpoint"
					@select-loadpoint="handlePoolClick"
					@select-circuit="selectCircuit"
					@assign-loadpoint="assignLoadpoint"
				/>
				<span class="evcc-gray">
					{{ $t("config.circuits.chargingPointsNote") }}
				</span>
			</div>
			<div class="d-flex justify-content-end mt-4">
				<button
					type="button"
					class="btn btn-outline-primary px-4"
					data-bs-dismiss="modal"
					@click="resetSelection"
				>
					{{ $t("config.general.close") }}
				</button>
			</div>
		</template>
	</JsonModal>
</template>

<script lang="ts">
import JsonModal from "./JsonModal.vue";
import type {
	ConfigCircuit,
	ConfigLoadpoint,
	ConfigCharger,
	ConfigMeter,
	AssignmentLoadpoint,
} from "@/types/evcc";
import CircuitsTree from "./CircuitsTree.vue";
import AssignmentPool from "./AssignmentPool.vue";
import NewDeviceButton from "./NewDeviceButton.vue";
import { openModal } from "@/configModal.ts";
import { configCircuitTree } from "@/utils/circuits.ts";
import { assignCircuit } from "./DeviceModal/index.ts";

import type { PropType } from "vue";

export default {
	name: "CircuitsModal",
	components: { JsonModal, CircuitsTree, AssignmentPool, NewDeviceButton },
	emits: ["changed"],
	props: {
		circuits: { type: Array as PropType<ConfigCircuit[]>, required: true },
		gridMeter: { type: Object as PropType<ConfigMeter> },
		loadpoints: { type: Array as PropType<ConfigLoadpoint[]>, default: () => [] },
		chargers: { type: Array as PropType<ConfigCharger[]>, default: () => [] },
		chargerValues: {
			type: Object as PropType<Record<string, { heating?: { value?: boolean } }>>,
			default: () => ({}),
		},
	},
	data() {
		return {
			selectedLoadpoint: undefined as number | undefined,
			assignmentOverrides: {} as Record<number, string | null>,
			saving: false,
		};
	},
	computed: {
		assignmentLoadpoints(): AssignmentLoadpoint[] {
			return this.loadpoints.map((lp) => {
				return {
					id: lp.id,
					name: lp.name,
					title: lp.title || lp.name || String(lp.id),
					circuit:
						lp.id !== undefined && lp.id in this.assignmentOverrides
							? this.assignmentOverrides[lp.id] || undefined
							: lp.circuit,
					charger: lp.charger,
					isHeater: this.chargerValues[lp.charger]?.heating?.value === true,
				};
			});
		},
		unassignedLoadpoints(): AssignmentLoadpoint[] {
			return this.assignmentLoadpoints.filter((lp) => !lp.circuit);
		},
	},
	methods: {
		configCircuitTree,
		async openCircuit() {
			await openModal("circuit");
		},
		selectCircuit(name: string) {
			void this.assignLoadpoint({ loadpointId: this.selectedLoadpoint, circuit: name });
		},
		resetSelection() {
			this.selectedLoadpoint = undefined;
		},
		async assignLoadpoint({
			loadpointId,
			circuit,
		}: {
			loadpointId?: number;
			circuit: string | null;
		}) {
			if (loadpointId === undefined || this.saving) return;
			const lp = this.assignmentLoadpoints.find((lp) => lp.id === loadpointId);
			if (!lp || (lp.circuit || null) === (circuit || null)) return;
			this.saving = true;
			try {
				await assignCircuit(loadpointId, circuit);
				this.assignmentOverrides[loadpointId] = circuit;
				this.resetSelection();
				this.$emit("changed");
			} catch {
				// The API interceptor reports failures through global notifications.
			} finally {
				this.saving = false;
			}
		},
		async handlePoolTransfer(event: { item: AssignmentLoadpoint; from: string; to: string }) {
			if (event.from === event.to) return;
			await this.assignLoadpoint({ loadpointId: event.item.id, circuit: null });
		},
		async handlePoolClick(lp: AssignmentLoadpoint) {
			if (this.saving) return;
			this.selectedLoadpoint = this.selectedLoadpoint === lp.id ? undefined : lp.id;
		},
	},
};
</script>
