import CircuitsModal from "./CircuitsModal.vue";
import {
  ConfigType,
  type ConfigCircuit,
  type ConfigMeter,
  type ConfigLoadpoint,
  type ConfigCharger,
} from "@/types/evcc";
import type { Meta, StoryFn } from "@storybook/vue3";

export default {
  title: "Config/CircuitsModal",
  component: CircuitsModal,
} as Meta<typeof CircuitsModal>;

const gridMeter: ConfigMeter = {
  id: 1,
  name: "grid",
  type: ConfigType.Template,
  deviceProduct: "Demo meter",
  config: {},
};

let id = 0;
const circuit = (
  name: string,
  title: string,
  config: Partial<ConfigCircuit["config"]> = {}
): ConfigCircuit => ({
  id: ++id,
  name,
  type: ConfigType.Template,
  deviceProduct: "Circuit",
  deviceTitle: title,
  config: { parent: "", title, ...config },
});

const circuits: ConfigCircuit[] = [
  circuit("home", "Home", { maxpower: 20000, maxcurrent: 32, meter: "grid" }),
  circuit("carport", "Carport", { parent: "home", maxpower: 5000 }),
  circuit("workshop", "Workshop in the basement", {
    parent: "home",
    maxpower: 22000,
    maxcurrent: 10,
    meter: "workshop",
  }),
  circuit("garage", "Garage", { parent: "home", maxpower: 11000, maxcurrent: 16 }),
  circuit("corner", "Corner", { parent: "garage", maxcurrent: 16 }),
  circuit("garden", "Garden", { parent: "home" }),
];

const chargers: ConfigCharger[] = [
  {
    id: 1,
    name: "car-charger",
    type: ConfigType.Template,
    deviceProduct: "Demo charger",
    config: {},
  },
  { id: 2, name: "heatpump", type: ConfigType.Heatpump, deviceProduct: "Heatpump", config: {} },
];

const loadpoint = (
  id: number,
  title: string,
  charger: string,
  circuit?: string
): ConfigLoadpoint => ({
  id,
  name: `loadpoint${id}`,
  title,
  charger,
  circuit,
  meter: "",
  vehicle: "",
  defaultMode: "",
  priority: 0,
  phasesConfigured: 0,
  minCurrent: 6,
  maxCurrent: 16,
  smartCostLimit: null,
  thresholds: { enable: { delay: 0, threshold: 0 }, disable: { delay: 0, threshold: 0 } },
  soc: { poll: { mode: "", interval: 0 }, estimate: false },
  ui: { minTemp: 0, maxTemp: 40 },
});

const loadpoints: ConfigLoadpoint[] = [
  loadpoint(1, "Garage", "car-charger", "garage"),
  loadpoint(2, "Carport", "car-charger", "carport"),
  loadpoint(3, "Heat pump", "heatpump"),
  loadpoint(4, "Garden", "car-charger"),
];

const Template: StoryFn<typeof CircuitsModal> = (args) => ({
  components: { CircuitsModal },
  setup() {
    return { args };
  },
  template: '<CircuitsModal v-bind="args" />',
  mounted() {
    const el = document.getElementById("circuitsModal");
    if (el) {
      import("bootstrap/js/dist/modal").then(({ default: Modal }) => {
        Modal.getOrCreateInstance(el).show();
      });
    }
  },
});

export const Empty = Template.bind({});
Empty.args = { circuits: [], gridMeter, loadpoints: [], chargers: [] };

export const MainOnly = Template.bind({});
MainOnly.args = { circuits: circuits.slice(0, 1), gridMeter, loadpoints: [], chargers: [] };

export const Tree = Template.bind({});
Tree.args = {
  circuits,
  gridMeter,
  loadpoints,
  chargers,
  chargerValues: { heatpump: { heating: { value: true } } },
};
