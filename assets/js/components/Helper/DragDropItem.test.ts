import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vite-plus/test";
import DragDropItem from "./DragDropItem.vue";

describe("drag item keyboard", () => {
  test("does not cancel Space on an action checkbox", () => {
    const wrapper = mount(DragDropItem, {
      global: { mocks: { $t: (key: string) => key } },
      slots: { actions: '<input type="checkbox" />' },
    });
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    wrapper.find("input").element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.emitted("click")).toBeUndefined();
    wrapper.unmount();
  });
});
