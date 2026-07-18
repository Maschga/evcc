import { defineComponent, type ComponentPropsOptions } from "vue";
import type { State } from "@/types/evcc";

type PropsComponent = {
  new (...args: never[]): { $props: object };
  props?: ComponentPropsOptions;
};

type ComponentProps<T extends PropsComponent> = InstanceType<T>["$props"];

const propNames = <T extends PropsComponent>(component: T) => {
  const props = component.props;
  return (Array.isArray(props) ? props : Object.keys(props ?? {})) as (keyof ComponentProps<T>)[];
};

export default defineComponent({
  methods: {
    // collect all target component properties from current instance
    collectProps<T extends PropsComponent>(
      component: T,
      state?: State
    ): Partial<ComponentProps<T>> {
      const data: Partial<ComponentProps<T>> = {};
      const instance = this as Partial<ComponentProps<T>>;
      for (const prop of propNames(component)) {
        // check in optional state
        if (state && prop in state) {
          data[prop] = (state as Partial<ComponentProps<T>>)[prop];
        }
        // check in current instance
        if (prop in instance) {
          data[prop] = instance[prop];
        }
      }
      return data;
    },
  },
});
