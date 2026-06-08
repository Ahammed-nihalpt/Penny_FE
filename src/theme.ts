import { createTheme, type MantineColorsTuple } from '@mantine/core';

// "Penny" is a coin — a warm copper/amber ramp gives the app its identity.
// Teal stays the primary (buttons, links, trust); copper is the accent
// (the wordmark, money emphasis, overdue). Mantine needs exactly 10 shades,
// lightest (0) → darkest (9); index 6 is the default solid shade.
const copper: MantineColorsTuple = [
  '#fbf3e9',
  '#f1e0cb',
  '#e3c09b',
  '#d59f68',
  '#c9833d',
  '#c37222',
  '#c06a15',
  '#a9590f',
  '#974e0a',
  '#844103',
];

// Neutrals tinted a hair toward copper (very low chroma) so borders, dimmed
// text, and striped rows read warm instead of clinical-cool. Subtle on purpose.
const gray: MantineColorsTuple = [
  '#f8f7f5',
  '#f1efec',
  '#e8e5e1',
  '#ddd9d4',
  '#cbc6bf',
  '#a8a29a',
  '#837d74',
  '#4d4842',
  '#353029',
  '#211d17',
];

export const theme = createTheme({
  primaryColor: 'teal',
  colors: { copper, gray },
  // Warm near-white for surfaces (cards/inputs). The app canvas behind them is
  // set a touch warmer via --mantine-color-body in index.css, so cards lift.
  white: '#fffdfa',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: { fontFamily: 'Inter, system-ui, sans-serif', fontWeight: '600' },
});
