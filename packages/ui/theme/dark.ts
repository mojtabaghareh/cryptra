import { colors } from '../tokens/colors';

export const darkTheme = colors.dark;

export const darkCSSVariables = Object.entries(colors.dark)
  .map(([key, value]) => `--cryptra-${key}: ${value};`)
  .join('\n');

