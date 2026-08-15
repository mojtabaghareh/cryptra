import { colors } from '../tokens/colors';

export const lightTheme = colors.light;

export const lightCSSVariables = Object.entries(colors.light)
  .map(([key, value]) => `--cryptra-${key}: ${value};`)
  .join('\n');

