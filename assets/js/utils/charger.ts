import { ConfigType, type ConfigCharger } from "@/types/evcc";

const HEATER_TYPES = new Set([
  ConfigType.Heatpump,
  ConfigType.SgReady,
  ConfigType.SgReadyRelay,
  ConfigType.SgReadyBoost,
  ConfigType.SwitchSocket,
]);

// isHeaterCharger returns whether a charger configuration represents a heating device.
export function isHeaterCharger(charger?: ConfigCharger): boolean {
  return charger !== undefined && HEATER_TYPES.has(charger.type);
}
