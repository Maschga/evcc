import { mount, flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import CircuitsModal from "./CircuitsModal.vue";
import DragDropItem from "../Helper/DragDropItem.vue";
import DeviceRefBox from "./DeviceRefBox.vue";
import type { ConfigCircuit, ConfigLoadpoint } from "@/types/evcc";

const { assignCircuit, openModal } = vi.hoisted(() => ({
  assignCircuit: vi.fn(),
  openModal: vi.fn(),
}));
vi.mock("./DeviceModal/index.ts", () => ({ assignCircuit }));
vi.mock("@/configModal.ts", () => ({ openModal }));
const circuits = [
  { id: 1, name: "main", deviceTitle: "Main", config: {} },
  { id: 2, name: "garage", deviceTitle: "Garage", config: { parent: "main" } },
] as ConfigCircuit[];
const loadpoints = [{ id: 10, name: "car", title: "Car", charger: "charger" }] as ConfigLoadpoint[];
const create = () =>
  mount(CircuitsModal, {
    props: { circuits, loadpoints },
    global: {
      mocks: { $t: (key: string) => key, $i18n: { locale: "en" } },
      stubs: { JsonModal: { template: "<div><slot /></div>" } },
    },
  });
beforeEach(() => {
  vi.clearAllMocks();
  assignCircuit.mockResolvedValue(undefined);
});

describe("circuit assignment", () => {
  test("selects the device first and keeps saved assignment visible despite stale props", async () => {
    const wrapper = create();
    await wrapper.findComponent(DragDropItem).trigger("click");
    expect(assignCircuit).not.toHaveBeenCalled();
    expect(wrapper.findComponent(DragDropItem).attributes("aria-selected")).toBe("true");
    await wrapper.findAllComponents(DeviceRefBox)[1]!.trigger("click");
    await flushPromises();
    expect(assignCircuit).toHaveBeenCalledWith(10, "garage");

    expect(wrapper.findComponent(DragDropItem).attributes("aria-selected")).toBe("false");
    expect(wrapper.findComponent({ name: "AssignmentPool" }).props("items")).toEqual([]);
    await wrapper.setProps({ loadpoints: loadpoints.map((lp) => ({ ...lp })) });
    expect(wrapper.findComponent({ name: "AssignmentPool" }).props("items")).toEqual([]);
    expect(wrapper.emitted("changed")).toHaveLength(1);
    wrapper.unmount();
  });
  test("moves an assigned device using keyboard destinations and removes it through the pool", async () => {
    const wrapper = create();
    await wrapper.setProps({ loadpoints: [{ ...loadpoints[0]!, circuit: "main" }] });
    await wrapper.findComponent(DragDropItem).trigger("keydown", { key: "Enter" });
    const destination = wrapper.find('[role="button"][aria-label="Garage"]');
    expect(destination.exists()).toBe(true);
    await destination.trigger("keydown", { key: " " });
    await flushPromises();
    expect(assignCircuit).toHaveBeenLastCalledWith(10, "garage");
    await wrapper.findComponent(DragDropItem).trigger("keydown", { key: " " });
    const pool = wrapper.find('[role="region"]');
    expect(pool.attributes("aria-label")).toBe("config.circuits.notAssigned");
    await pool.find("button").trigger("click");
    await flushPromises();
    expect(assignCircuit).toHaveBeenLastCalledWith(10, null);
    expect(wrapper.findComponent({ name: "AssignmentPool" }).props("items")).toHaveLength(1);
    wrapper.unmount();
  });
  test("circuit rows are part of their named drop list while headers are not draggable", () => {
    const wrapper = create();
    const row = wrapper.find('[role="button"][aria-label="Garage"]');
    const list = row.element.closest('[role="list"]');
    expect(list?.getAttribute("aria-label")).toBe("Garage");
    wrapper.unmount();
  });
  test("clears selection on escape and modal close", async () => {
    const wrapper = create();
    await wrapper.findComponent(DragDropItem).trigger("click");
    await wrapper.trigger("keydown", { key: "Escape" });
    expect(wrapper.findComponent(DragDropItem).attributes("aria-selected")).toBe("false");
    await wrapper.findComponent(DragDropItem).trigger("click");
    await wrapper.find("button[data-bs-dismiss]").trigger("click");
    expect(wrapper.findComponent(DragDropItem).attributes("aria-selected")).toBe("false");
    wrapper.unmount();
  });
  test("ignores duplicate transfers while saving and same-circuit assignments", async () => {
    const wrapper = create();
    let resolve!: () => void;
    assignCircuit.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      })
    );
    const list = wrapper.findAllComponents({ name: "DragDropList" })[2]!;
    list.vm.$emit("transfer", { item: loadpoints[0], from: "__unassigned__", to: "garage" });
    list.vm.$emit("transfer", { item: loadpoints[0], from: "__unassigned__", to: "garage" });
    expect(assignCircuit).toHaveBeenCalledTimes(1);
    resolve();
    await flushPromises();
    await wrapper.findComponent(DragDropItem).trigger("click");
    await wrapper.find('[aria-label="Garage"][role="button"]').trigger("click");
    expect(assignCircuit).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
  test("keeps assignment and selection on failure then permits retry", async () => {
    const wrapper = create();
    assignCircuit.mockRejectedValueOnce(new Error("failed"));
    await wrapper.findComponent(DragDropItem).trigger("click");
    await wrapper.find('[aria-label="Garage"][role="button"]').trigger("click");
    await flushPromises();
    expect(wrapper.findComponent({ name: "AssignmentPool" }).props("items")).toHaveLength(1);
    expect(wrapper.findComponent(DragDropItem).attributes("aria-selected")).toBe("true");
    expect(wrapper.emitted("changed")).toBeUndefined();
    await wrapper.find('[aria-label="Garage"][role="button"]').trigger("click");
    await flushPromises();
    expect(wrapper.emitted("changed")).toHaveLength(1);
    wrapper.unmount();
  });
  test("edits circuit title when no device is selected", async () => {
    const wrapper = create();
    await wrapper.find('[aria-label="Garage"][role="button"]').trigger("click");
    expect(openModal).toHaveBeenCalledWith("circuit", { id: 2 });
    expect(assignCircuit).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  test("pool background removes selection without treating device clicks as destinations", async () => {
    const wrapper = create();
    await wrapper.setProps({ loadpoints: [{ ...loadpoints[0]!, circuit: "main" }] });
    await wrapper.findComponent(DragDropItem).trigger("click");
    await wrapper.find('[role="region"]').trigger("click");
    await flushPromises();
    expect(assignCircuit).toHaveBeenCalledWith(10, null);
    wrapper.unmount();
  });
  test("uses charger heating capability instead of configuration type", async () => {
    const wrapper = create();
    await wrapper.setProps({ chargerValues: { charger: { heating: { value: true } } } });
    expect(wrapper.findComponent(DragDropItem).props("icon")).toBe(
      "shopicon-regular-thermometerhalf"
    );
    await wrapper.setProps({ chargerValues: { charger: { heating: { value: false } } } });
    expect(wrapper.findComponent(DragDropItem).props("icon")).toBe("shopicon-regular-car1");
    wrapper.unmount();
  });
});
