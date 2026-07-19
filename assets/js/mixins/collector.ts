import type { ComponentProps } from "vue-component-type-helpers";
import { defineComponent, type AllowedComponentProps, type VNodeProps } from "vue";

type CollectorProps<T> = Omit<ComponentProps<T>, keyof (VNodeProps & AllowedComponentProps)>;
export function getProps<T>(
  component: T
): (keyof CollectorProps<T>)[] {
  return Object.keys((component as any).props) as (keyof CollectorProps<T>)[]
}

export default defineComponent({
  methods: {
    collectProps<T>(
      this: CollectorProps<T>,
      component: T,
    ): CollectorProps<T> {
      const result = {} as CollectorProps<T>;

      for (const prop of getProps(component)) {
        result[prop] = this[prop];
      }

      return result;
    },
  },
});