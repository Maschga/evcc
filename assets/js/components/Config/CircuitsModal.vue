<template>
	<JsonModal
		id="circuitsModal"
		name="circuits"
		:title="$t('config.circuits.title')"
		:description="$t('config.circuits.description')"
		docs="/docs/features/loadmanagement"
		endpoint="/config/circuits"
		state-key="circuits.config"
		data-testid="circuits-modal"
		disable-remove
		@changed="$emit('changed')"
	>
		<template #default="{ values }: { values: Circuits }">
			<div class="my-4">
				<CircuitTags :nodes="circuitsNodes(values)">
					<template #default="{ node, nodeTitle }">
						<div>
							<DeviceRefBox
								:title="nodeTitle"
								:compact="true"
								@edit="openCircuit(node.name)"
							/>
						</div>
					</template>
				</CircuitTags>
			</div>
			<button
				type="button"
				class="d-flex btn btn-sm btn-outline-secondary border-0 align-items-center gap-2 evcc-gray"
				tabindex="0"
				@click="openCircuit()"
			>
				<shopicon-regular-plus size="s" class="flex-shrink-0"></shopicon-regular-plus>
				{{ $t("config.messaging.addMessenger") }}
			</button>
		</template>
	</JsonModal>
</template>

<script lang="ts">
import { type Circuits } from "@/types/evcc";
import "@h2d2/shopicons/es/regular/plus";
import JsonModal from "./JsonModal.vue";
import { openModal } from "@/configModal";
import CircuitTags from "./CircuitTags.vue";
import { circuitTree } from "@/utils/circuits";
import DeviceCardEditIcon from "./DeviceCardEditIcon.vue";
import DeviceRefBox from "./DeviceRefBox.vue";

export default {
	name: "CircuitsModal",
	components: {
		JsonModal,
		DeviceCardEditIcon,
		CircuitTags,
		DeviceRefBox,
	},
	emits: ["changed"],
	computed: {
		circuitsNodes() {
			return (circuits: Circuits) => {
				const tree = circuitTree(circuits);
				return tree ? [tree] : [];
			};
		},
	},
	methods: {
		async openCircuit(name?: string) {
			const id = name?.split("db:")[1];
			await openModal("circuit", { id: id ? parseInt(id) : undefined });
		},
	},
};
</script>
