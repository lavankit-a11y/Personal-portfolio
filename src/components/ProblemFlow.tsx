type ProblemFlowProps = {
  isPlaying?: boolean;
  className?: string;
};

// Authored in a 1250 × 540 viewBox; scales with the container width.
const VIEW_W = 1250;
const VIEW_H = 540;
const CY = 248;
const GAP = 8;
const ELBOW_R = 14;
const ARROW = 5;
const START = { cx: 85, r: 14 };
const NURSE = { x: 163, w: 564, h: 136 };
const DOWN = { x: 783, w: 396, h: 112 };
const NURSE_TOP = CY - NURSE.h / 2;
const NURSE_BOTTOM = CY + NURSE.h / 2;
const DOWN_TOP = CY - DOWN.h / 2;
const DOWN_BOTTOM = CY + DOWN.h / 2;
const BAR = { x: DOWN.x, y: DOWN_BOTTOM + 44, w: DOWN.w, h: 10 };
const BAR_CY = BAR.y + BAR.h / 2;

type NodeDef = { title: string; sub?: string; x: number };
const NURSE_NODES: NodeDef[] = [
  { title: "Capture", sub: "Vitals · Labs · ECG", x: 187 },
  { title: "Record", sub: "EDC entry", x: 375 },
  { title: "Submit", x: 563 },
];
const NURSE_NODE = { w: 140, h: 56 };
const DOWN_NODES: NodeDef[] = [
  { title: "Monitor review", x: 807 },
  { title: "Investigator sign-off", x: 1005 },
];
const DOWN_NODE = { w: 150, h: 48 };
type Dir = "right" | "up";
type Connector = { d: string; tip: { x: number; y: number }; dir: Dir };
const h = (x1: number, x2: number, y = CY): Connector => ({
  d: `M ${x1} ${y} H ${x2}`,
  tip: { x: x2, y },
  dir: "right",
});
const FOUNDATION_X = NURSE_NODES[1].x + NURSE_NODE.w / 2;
const CONNECTORS: Connector[] = [
  h(START.cx + START.r + GAP, NURSE_NODES[0].x - GAP),
  h(NURSE_NODES[0].x + NURSE_NODE.w + GAP, NURSE_NODES[1].x - GAP),
  h(NURSE_NODES[1].x + NURSE_NODE.w + GAP, NURSE_NODES[2].x - GAP),
  h(NURSE_NODES[2].x + NURSE_NODE.w + GAP, DOWN_NODES[0].x - GAP),
  h(DOWN_NODES[0].x + DOWN_NODE.w + GAP, DOWN_NODES[1].x - GAP),
  {
    d: `M ${FOUNDATION_X} ${NURSE_BOTTOM + GAP} V ${BAR_CY - ELBOW_R} Q ${FOUNDATION_X} ${BAR_CY} ${FOUNDATION_X + ELBOW_R} ${BAR_CY} H ${BAR.x - GAP}`,
    tip: { x: BAR.x - GAP, y: BAR_CY },
    dir: "right",
  },
  ...DOWN_NODES.map<Connector>((node) => {
    const x = node.x + DOWN_NODE.w / 2;
    return { d: `M ${x} ${BAR.y - GAP} V ${DOWN_BOTTOM + GAP}`, tip: { x, y: DOWN_BOTTOM + GAP }, dir: "up" };
  }),
];

function arrowPath({ tip, dir }: Connector) {
  const { x, y } = tip;
  return dir === "right"
    ? `M ${x - ARROW} ${y - ARROW} L ${x} ${y} L ${x - ARROW} ${y + ARROW}`
    : `M ${x - ARROW} ${y + ARROW} L ${x} ${y} L ${x + ARROW} ${y + ARROW}`;
}

function tabPath(x: number, top: number, w: number, th: number, closed: boolean) {
  const r = 6;
  const d = `M ${x} ${top} V ${top - th + r} Q ${x} ${top - th} ${x + r} ${top - th} H ${x + w - r} Q ${x + w} ${top - th} ${x + w} ${top - th + r} V ${top}`;
  return closed ? `${d} Z` : d;
}

const TAB_H = 22;
const TAB_INSET = 16;
const styles = `
.pf-root {
  --pf-orange: #E55A25;
  --pf-on-orange: #FFFFFF;
  --pf-neutral: var(--ink);
  --pf-tab: var(--label);
  width: 100%;
  aspect-ratio: ${VIEW_W} / ${VIEW_H};
  background: var(--box);
  font-family: "Open Runde", ui-sans-serif, system-ui, sans-serif;
}
.pf-root svg { display: block; width: 100%; height: 100%; overflow: visible; }
.pf-root text { font-family: inherit; }
.pf-dots {
  fill: none;
  stroke: var(--pf-orange);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 6 6;
  animation: pf-flow 1s linear infinite;
}
@keyframes pf-flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -12; } }
.pf-root.is-paused .pf-dots { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .pf-dots { animation: none; } }
`;

export default function ProblemFlow({ isPlaying = true, className }: ProblemFlowProps) {
  const nurseTabW = 58;
  const downTabW = 190;
  return (
    <div
      className={`pf-root ${isPlaying ? "is-playing" : "is-paused"}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label="Animated flow from patient visit through nurse capture, record and submit, then monitor review and investigator sign-off."
    >
      <style>{styles}</style>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden focusable="false">
        <rect x={NURSE.x} y={NURSE_TOP} width={NURSE.w} height={NURSE.h} rx={16} fill="var(--pf-orange)" fillOpacity={0.06} stroke="var(--pf-orange)" strokeWidth={1.5} />
        <path d={tabPath(NURSE.x + TAB_INSET, NURSE_TOP, nurseTabW, TAB_H, true)} fill="var(--pf-orange)" stroke="var(--pf-orange)" strokeWidth={1.5} strokeLinejoin="round" />
        <text x={NURSE.x + TAB_INSET + nurseTabW / 2} y={NURSE_TOP - TAB_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="var(--pf-on-orange)">Nurse</text>

        <rect x={DOWN.x} y={DOWN_TOP} width={DOWN.w} height={DOWN.h} rx={16} fill="none" stroke="var(--pf-neutral)" strokeWidth={1} />
        <path d={tabPath(DOWN.x + TAB_INSET, DOWN_TOP, downTabW, TAB_H, false)} fill="none" stroke="var(--pf-neutral)" strokeWidth={1} strokeLinejoin="round" />
        <text x={DOWN.x + TAB_INSET + downTabW / 2} y={DOWN_TOP - TAB_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500} fill="var(--pf-tab)">Everything that comes after</text>

        {CONNECTORS.map((connector, index) => <path key={`d${index}`} className="pf-dots" d={connector.d} />)}
        <g fill="none" stroke="var(--pf-orange)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          {CONNECTORS.map((connector, index) => <path key={`a${index}`} d={arrowPath(connector)} />)}
        </g>

        <circle cx={START.cx} cy={CY} r={START.r} fill="var(--pf-orange)" />
        <text x={START.cx} y={CY + START.r + 22} textAnchor="middle" fontSize={12} fontWeight={500} fill="var(--pf-neutral)">Patient visit</text>

        {NURSE_NODES.map((node) => {
          const cx = node.x + NURSE_NODE.w / 2;
          return (
            <g key={node.title}>
              <rect x={node.x} y={CY - NURSE_NODE.h / 2} width={NURSE_NODE.w} height={NURSE_NODE.h} rx={8} fill="var(--pf-orange)" />
              <text x={cx} y={node.sub ? CY - 8 : CY} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={500} fill="var(--pf-on-orange)">{node.title}</text>
              {node.sub && <text x={cx} y={CY + 11} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="var(--pf-on-orange)" fillOpacity={0.8}>{node.sub}</text>}
            </g>
          );
        })}

        {DOWN_NODES.map((node) => (
          <g key={node.title}>
            <rect x={node.x} y={CY - DOWN_NODE.h / 2} width={DOWN_NODE.w} height={DOWN_NODE.h} rx={8} fill="none" stroke="var(--pf-neutral)" strokeWidth={1.25} />
            <text x={node.x + DOWN_NODE.w / 2} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={500} fill="var(--pf-neutral)">{node.title}</text>
          </g>
        ))}

        <rect x={BAR.x} y={BAR.y} width={BAR.w} height={BAR.h} rx={BAR.h / 2} fill="var(--pf-orange)" />
        <text x={BAR.x + BAR.w / 2} y={BAR.y + BAR.h + 22} textAnchor="middle" fontSize={12} fontWeight={500} fill="var(--pf-orange)">Built on what the nurse records</text>
      </svg>
    </div>
  );
}
