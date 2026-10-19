import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vite-plus/test";
import AssignmentPool from "./AssignmentPool.vue";

describe("assignment icons", () => {
  test.each([
    [false, "shopicon-regular-car1"],
    [true, "shopicon-regular-thermometerhalf"],
  ])("renders the registered icon for heater=%s", (isHeater, tag) => {
    const wrapper = mount(AssignmentPool, {
      props: {
        title: "Not assigned",
        emptyText: "Empty",
        items: [{ id: 1, title: "Garden", charger: "charger", isHeater }],
      },
      global: { mocks: { $t: (key: string) => key } },
    });
    expect(wrapper.find(tag as string).exists()).toBe(true);
    wrapper.unmount();
  });
  test("resets hover on drop and cancelled drag", async () => {
    const wrapper = mount(AssignmentPool, {
      props: { title: "Not assigned", emptyText: "Empty", items: [] },
      global: { mocks: { $t: (key: string) => key } },
    });
    await wrapper.trigger("dragenter");
    expect(wrapper.classes()).toContain("assignment-pool--drop-active");
    await wrapper.trigger("drop");
    expect(wrapper.classes()).not.toContain("assignment-pool--drop-active");
    await wrapper.trigger("dragenter");
    document.dispatchEvent(new Event("dragend"));
    await wrapper.vm.$nextTick();
    expect(wrapper.classes()).not.toContain("assignment-pool--drop-active");
    wrapper.unmount();
  });
  test("does not clear hover when entering a child of the pool", async () => {
    const wrapper = mount(AssignmentPool, {
      props: { title: "Not assigned", emptyText: "Empty", items: [] },
      global: { mocks: { $t: (key: string) => key } },
    });
    await wrapper.trigger("dragenter");
    await wrapper.trigger("dragleave", { relatedTarget: wrapper.find("strong").element });
    expect(wrapper.classes()).toContain("assignment-pool--drop-active");
    wrapper.unmount();
  });
});
