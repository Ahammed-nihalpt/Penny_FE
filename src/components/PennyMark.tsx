// Penny's mark: a small copper coin with an inset rim and a "P". Pure SVG so it
// scales crisply and inherits theme copper via CSS variables.
export function PennyMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Penny"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="16" cy="16" r="15" fill="var(--mantine-color-copper-6)" />
      <circle
        cx="16"
        cy="16"
        r="11.5"
        fill="none"
        stroke="var(--mantine-color-copper-2)"
        strokeWidth="1.5"
        opacity="0.55"
      />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="var(--mantine-color-copper-0)"
      >
        P
      </text>
    </svg>
  );
}
