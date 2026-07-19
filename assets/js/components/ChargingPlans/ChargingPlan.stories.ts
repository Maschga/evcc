import ChargingPlan from "./ChargingPlan.vue";
import type { Meta, StoryFn } from "@storybook/vue3";

const hoursFromNow = (hours: number) => {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now.toISOString();
};

export default {
  title: "ChargingPlans/ChargingPlan",
  component: ChargingPlan,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    id: { control: "text" },
    effectivePlanTime: { control: "text" },
    effectivePlanSoc: { control: "number" },
    planEnergy: { control: "number" },
    socBasedCharging: { control: "boolean" },
    socBasedPlanning: { control: "boolean" },
    vehicleSoc: { control: "number" },
  },
} as Meta<typeof ChargingPlan>;

const Template: StoryFn<typeof ChargingPlan> = (args) => ({
  components: { ChargingPlan },
  setup() {
    return { args };
  },
  template: '<ChargingPlan v-bind="args" />',
});

export const None = Template.bind({});

export const SocBasedCharging = Template.bind({});
SocBasedCharging.args = {
  effectivePlanTime: hoursFromNow(4),
  effectivePlanSoc: 77,
  socBasedPlanning: true,
};

export const EnergyBasedCharging = Template.bind({});
EnergyBasedCharging.args = {
  effectivePlanTime: hoursFromNow(12),
  planEnergy: 77,
  socBasedPlanning: false,
};
