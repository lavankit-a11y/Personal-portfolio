import {
  Block,
  Body,
  BreadcrumbPill,
  Eyebrow,
  MediaBox,
  Placeholder,
  Sidebar,
  TextBlock,
  TextMedia,
  ThemeToggle,
  useScrollSpy,
  useTheme,
  type Chapter,
} from "../components/blocks";
import { NoiseTexture } from "../components/NoiseTexture";

const chapters: Chapter[] = [
  { id: "problem", label: "Problem" },
  { id: "insights", label: "Insights" },
  { id: "solution", label: "Solution" },
  { id: "design-decisions", label: "Design decisions" },
  { id: "impact", label: "Impact" },
];
const chapterIds = chapters.map((c) => c.id);

const impact = [
  { value: "94.5%", label: "Fewer AI calls than a per-field approach, making it viable across large multi-site trials" },
  { value: "< 5 sec", label: "From saving a flagged value to the alert, while the patient may still be in the building" },
  { value: "2 layers", label: "Emergencies and slow deterioration both covered. Not redundancy, complete coverage" },
];

const Accent = ({ children }: { children: string }) => <span className="text-accent">{children}</span>;

export default function AeSaeCaseStudy({ animateEntrance = true }: { animateEntrance?: boolean }) {
  const active = useScrollSpy(chapterIds);
  const [dark, toggleTheme] = useTheme();

  return (
    <div id="top" className="relative isolate min-h-screen font-sans">
      <NoiseTexture />
      <BreadcrumbPill parent="Projects" current="AE/SAE Prediction">
        <ThemeToggle dark={dark} onToggle={toggleTheme} />
      </BreadcrumbPill>
      <Sidebar chapters={chapters} active={active} />

      <main className="relative z-10 mx-auto w-full px-5 pt-[130px] pb-32 md:w-[60%] md:px-0">
        <header>
          <div data-fade className="w-fit">
            <Placeholder label="LOGO" className="size-16 px-0" />
          </div>
          <div data-fade className="mt-8 flex flex-col gap-8 sm:flex-row sm:gap-0">
            <div className="flex flex-col gap-4 sm:w-[70%] sm:pr-12">
              <h1 className="text-[20px] leading-[1.3] font-medium text-ink">AE/SAE Prediction</h1>
              <Body>94.5% fewer AI calls · Alert within 5 seconds · 2 detection layers</Body>
            </div>
            <dl className="flex flex-col gap-1 text-[13px] sm:w-[30%]">
              <dt className="font-semibold text-ink">Akyrian Systems</dt>
              <dd className="text-label">Clinical Trial Platform</dd>
              <dd className="text-label">Solo Product Designer</dd>
              <dd className="mt-4 text-body">2026</dd>
            </dl>
          </div>
        </header>

        <div className="mt-12">
          <MediaBox hint="Hero shot of the final banner inside the form, alert state. Full width." />
        </div>

        <TextMedia
          id="problem"
          eyebrow={<Accent>Problem</Accent>}
          heading="A Serious Adverse Event can put an entire clinical trial at risk"
          body="When a Serious Adverse Event (SAE) occurs, the sponsor must notify the FDA. The study may be paused, or suspended entirely. For a pharmaceutical company that means millions of dollars lost and a drug’s approval pushed back by months or years."
          media={
            <div className="grid gap-2 rounded-[14px] border border-card-border bg-card p-5 sm:grid-cols-2 sm:p-10">
              <div className="flex min-h-48 flex-col justify-between rounded-[14px] border border-card-border bg-box p-6">
                <p className="text-[15px] font-medium text-ink">SAE caught late.</p>
                <p className="text-[14px] leading-[1.5] text-body">
                  FDA notified after the fact, patient hospitalized, trial at risk of suspension.
                </p>
              </div>
              <div className="flex min-h-48 flex-col justify-between rounded-[14px] border border-card-border bg-box p-6">
                <p className="text-[15px] font-medium text-ink">SAE caught early.</p>
                <p className="text-[14px] leading-[1.5] text-body">
                  Nurse alerted, sponsor notified proactively, patient treated, trial continues.
                </p>
              </div>
            </div>
          }
        />

        <TextMedia
          heading="But most SAEs do not happen suddenly. They build across visits"
          body="A value slightly off at visit one. The same value worse at visit two. Each reading looks acceptable on its own. Together they are a pattern."
          media={
            <MediaBox hint="Three-visit timeline. Same vital reading worsening slightly each visit. Personal baseline line running below. No single reading looks alarming. The pattern across all three is unmistakable." />
          }
        />

        <TextMedia
          heading="And the data that shows the pattern was already in the system, unread"
          body="At every visit, a nurse records blood pressure, heart rate, and lab results. All of it is stored. But it was only ever reviewed one visit at a time, never across visits."
          media={<MediaBox hint='Stack of visit records, each one highlighted separately. Label: "Reviewed one at a time."' />}
        />

        <TextMedia
          heading="So the signal only surfaced at monitor review, days or weeks after the visit"
          body="By then, the moment where it could have changed anything had passed."
          media={<MediaBox hint="Timeline. Visit → data stored → days or weeks → monitor review → signal found. Gap highlighted." />}
        />

        <Block id="insights">
          <TextBlock eyebrow={<Accent>Insights</Accent>} heading="Not what a single reading shows. What the pattern shows." />
        </Block>

        <section className="mt-12 grid gap-x-5 gap-y-16 sm:grid-cols-2">
          <div className="flex flex-col gap-6">
            <TextBlock eyebrow={<Accent>Insight 1</Accent>} heading="An alert is only worth building if the nurse trusts it">
              <Body>
                Too early, and nurses start ignoring alerts. The system becomes noise. Too late, and the signal arrives after it could have mattered. Both failures end the same way: the feature stops doing its one job.
              </Body>
            </TextBlock>
            <MediaBox className="mt-auto" ratio="aspect-[4/3]" hint="Insight card 1." />
          </div>
          <div className="flex flex-col gap-6">
            <TextBlock eyebrow={<Accent>Insight 2</Accent>} heading="One reading is rarely alarming. The trend is">
              <Body>
                A heart rate of 130 across three consecutive visits never crosses a hard threshold. The trajectory is still unmistakable.
              </Body>
            </TextBlock>
            <MediaBox className="mt-auto" ratio="aspect-[4/3]" hint="Insight card 2. Flat line under threshold, rising trend line over it." />
          </div>
        </section>

        <TextMedia
          eyebrow={<Accent>Insight 3</Accent>}
          heading="Normal is personal, not a population average"
          body="A patient with documented hypertension has a naturally high blood pressure baseline. Measured against a population average, that patient looks permanently at risk."
          media={<MediaBox hint="Insight card 3. Same reading shown against two baselines." />}
        />

        <TextMedia
          id="solution"
          eyebrow={<Accent>Solution</Accent>}
          heading="A signal that builds across visits and reaches the nurse before she leaves her desk"
          body="Each patient is measured against their own baseline. Evidence builds visit by visit into a confidence score. Hard rules catch emergencies. Pattern recognition catches slow deterioration. When the score crosses 75 out of 100, a small banner appears in the form she is already working in. She accepts or rejects. Nothing else changes in her workflow."
          media={
            <MediaBox
              ratio="aspect-[4/3] sm:aspect-[16/9]"
              hint="Montage. Baseline → visit-by-visit confidence build → banner in the form → accept path and reject path. Full width."
            />
          }
        />

        <TextMedia
          id="design-decisions"
          eyebrow={<Accent>Design decisions</Accent>}
          heading="Each patient is measured against their own normal"
          body="The baseline visit happens before any drug is given. Every value recorded becomes that patient’s personal normal. Every later visit is compared against it."
          media={<MediaBox hint="Baseline visit with values captured. Two patients, two different baselines." />}
        />

        <TextMedia
          heading="The alert fires only when the confidence score crosses 75 out of 100"
          body="The score is internal and never shown to the nurse. Below 75, the false positive rate was too high. Above 75, early signals were being missed. 75 is where a pattern has earned the right to ask for a human’s attention."
          media={
            <MediaBox hint="Confidence band bar. 0 Baseline. 1-39 Monitoring. 40-64 Watch State. 65-74 Elevated Watch. 75+ Alert fires. What the system does at each band. Numbers shown to the reader only, never in the nurse's interface." />
          }
        />

        <TextMedia
          heading="Evidence builds visit by visit, and flagged values are watched first"
          body="The score is cumulative, not recalculated each visit. Visit 1 compares against baseline and flags which parameters to watch. Visit 2 tracks the same parameters, and a repeat deviation raises the score sharply. From visit 3, for patients in elevated watch, the moment she saves a flagged value a targeted check fires. If it pushes the score past 75, the alert appears within five seconds."
          media={<MediaBox hint="Visit-by-visit flow. Baseline to Visit 3. Standard path and elevated watch path branching. Five-second alert moment highlighted." />}
        />

        <TextMedia
          heading="Two detection layers, because emergencies and slow deterioration are different problems"
          body="Layer one is rule-based. Heart rate above 150, blood oxygen below 88%, systolic pressure below 80 fire on any visit, no history needed. Layer two is pattern recognition, which catches what thresholds miss. Neither is sufficient alone."
          media={<MediaBox hint="Two boxes. Layer 1: acute single-visit emergencies. Layer 2: progressive deterioration. Below: a patient trajectory Layer 1 misses and Layer 2 catches." />}
        />

        <TextMedia
          heading="AI calls scale with risk, not with fields saved"
          body="Calling the AI on every saved field means 40,000 calls per study (200 patients, 10 visits, 20 fields). One call per completed visit plus targeted calls for elevated watch patients is about 2,200. Low-confidence patients get lightweight calls. Only elevated watch patients send full history."
          media={
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex aspect-[4/3] flex-col justify-between rounded-[14px] border border-card-border bg-card p-6">
                <p className="text-[15px] text-label">Per-field</p>
                <p className="text-[36px] leading-none font-semibold tracking-tight text-ink">40,000</p>
                <p className="text-[15px] text-body">calls</p>
              </div>
              <div className="flex aspect-[4/3] flex-col justify-between rounded-[14px] border border-card-border bg-card p-6">
                <p className="text-[15px] text-label">Per-visit with targeting</p>
                <p className="text-[36px] leading-none font-semibold tracking-tight text-ink">~2,200</p>
                <p className="text-[15px] text-body">94.5% reduction</p>
              </div>
            </div>
          }
        />

        <TextMedia
          heading="A small banner in the form she is already working in"
          body="Plain-language description of what the system has observed, a likelihood indicator, two actions. Accept opens the SAE flow already linked to the patient, visit, and values that triggered it. Reject asks why, and the reason is stored in the audit trail for whoever reviews the next signal."
          media={<MediaBox hint="Banner at top of form with likelihood indicator. Below: accept path with pre-filled SAE form, reject path with reason input and audit trail confirmation." />}
        />

        <TextMedia
          heading="The model learns from every confirmed SAE"
          body="At launch, pattern recognition is trained on FAERS, the FDA’s public adverse event database. Every SAE confirmed through the platform becomes a new labeled example, so accuracy improves automatically."
          media={<MediaBox hint="One clean loop. Patient data → pattern detected → nurse acts → outcome confirmed → back into model." />}
        />

        <Block id="impact">
          <Eyebrow><Accent>Impact</Accent></Eyebrow>
          <div data-fade className="mt-6 grid gap-2 sm:grid-cols-3">
            {impact.map((s) => (
              <div data-impact-card key={s.value} className="flex flex-col justify-between gap-10 rounded-[14px] border border-card-border bg-card p-6 sm:aspect-[4/5]">
                <p className="text-[32px] leading-none font-semibold tracking-tight text-ink">{s.value}</p>
                <p className="text-[16px] leading-[1.45] text-body">{s.label}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block>
          <a href="#" data-fade className="group flex flex-col gap-5 rounded-[14px] border border-card-border bg-card p-5 sm:min-h-[104px] sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-5">
            <Placeholder label="ICON" className="size-16 shrink-0 px-0" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[18px] font-semibold text-ink">Want the full process?</p>
              <p className="text-[16px] leading-[1.5] text-label">Research, wireframes, rejected directions, and every decision documented.</p>
            </div>
            <span className="inline-flex h-9 shrink-0 items-center self-start rounded-full bg-btn px-4 text-[13px] font-semibold text-btn-text transition-opacity group-hover:opacity-85 sm:self-center">
              View full process →
            </span>
          </a>
        </Block>
      </main>
    </div>
  );
}
