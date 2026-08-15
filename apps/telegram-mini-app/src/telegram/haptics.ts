import { useTelegram } from './telegram';

export function useHaptics() {
  const { haptic } = useTelegram();

  return {
    lightImpact: haptic.light,
    mediumImpact: haptic.medium,
    heavyImpact: haptic.heavy,
    successNotification: haptic.success,
    errorNotification: haptic.error,
    warningNotification: haptic.warning,
    selectionChanged: haptic.selection,
  };
}

