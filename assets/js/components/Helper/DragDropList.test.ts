import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vite-plus/test";
import { parents } from "@formkit/drag-and-drop";
import DragDropList from "./DragDropList.vue";

const global = { mocks: { $t: (key: string) => key } };

describe("drag list", () => {
  test("reads refreshed props instead of its initial values", async () => {
    const wrapper = mount(DragDropList, { props: { values: [] }, global });
    await wrapper.setProps({ values: ["new"] });
    const parent = parents.get(wrapper.element as HTMLElement)!;
    expect(parent.getValues(wrapper.element as HTMLElement)).toEqual(["new"]);
    wrapper.unmount();
  });
  test("uses one shared group with distinct destination names and emits only at destination", () => {
    const source = mount(DragDropList, {
      props: { values: [], transfer: true, group: "loadpoints", name: "main" },
      global,
    });
    const target = mount(DragDropList, {
      props: { values: [], transfer: true, group: "loadpoints", name: "garage" },
      global,
    });
    const sourceData = parents.get(source.element as HTMLElement)!;
    const targetData = parents.get(target.element as HTMLElement)!;
    const item = { id: 1 };
    const event = {
      sourceParent: { el: source.element, data: sourceData },
      targetParent: { el: target.element, data: targetData },
      draggedNodes: [{ data: { value: item } }],
    };
    sourceData.config.onTransfer!(event as never);
    targetData.config.onTransfer!(event as never);
    expect(source.emitted("transfer")).toBeUndefined();
    expect(target.emitted("transfer")).toEqual([[{ item, from: "main", to: "garage" }]]);
    const header = document.createElement("div");
    expect(targetData.config.draggable!(header)).toBe(false);
    header.classList.add("drag-drop-item");
    expect(targetData.config.draggable!(header)).toBe(true);
    source.unmount();
    target.unmount();
  });
});
