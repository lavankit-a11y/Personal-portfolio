import {
  Block,
  Body,
  BreadcrumbPill,
  Caption,
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
import ProblemFlow from "../components/ProblemFlow";
import { nurseProject } from "../content/nurseProject";

const chapters: Chapter[] = [
  { id: "problem", label: "Problem" },
  { id: "insights", label: "Insights" },
  { id: "solution", label: "Solution" },
  { id: "design-decisions", label: "Design decisions" },
  { id: "impact", label: "Impact" },
];
const chapterIds = chapters.map((c) => c.id);
const oldInterfaceVideo =
  "https://res.cloudinary.com/vwlr2h8r/video/upload/v1794765266/Old_Interface_UI.mp4";
const edcVisitInterface =
  "https://res.cloudinary.com/vwlr2h8r/image/upload/v1794768620/EDC_Sandbox_Visit_1_Interface.png";
const edcVisitSource = "https://youtu.be/MCBiKEMz53A?si=McaI2YR5dFlCECth&t=525";
const delayCostImage =
  "https://res.cloudinary.com/vwlr2h8r/image/upload/v1794850773/Screenshot_2026-11-16_at_11.09.23_PM.png";
const delayCostSource =
  "https://csdd.tufts.edu/sites/default/files/2025-02/Aug2024%20Day%20of%20Delay%20White%20Paper%20Final.pdf?1794415908";
const insight1Image = "https://res.cloudinary.com/vwlr2h8r/image/upload/v1794853909/Insight_1.png";
const insight2Image = "https://res.cloudinary.com/vwlr2h8r/image/upload/v1794853911/Insight_2.png";
const insight3Image = "https://res.cloudinary.com/vwlr2h8r/image/upload/v1794851116/Insight_3.png";
const dashboardVideo = "https://res.cloudinary.com/vwlr2h8r/video/upload/v1794851166/Dashboard.mp4";
const statusVideo = "https://res.cloudinary.com/vwlr2h8r/video/upload/v1794851131/Status.mp4";
const extractionVideo =
  "https://res.cloudinary.com/vwlr2h8r/video/upload/v1794851177/Source_Extraction.mp4";
const translationVideo =
  "https://res.cloudinary.com/vwlr2h8r/video/upload/v1794851181/Translation_Flow.mp4";
const outOfRangeVideo = "https://res.cloudinary.com/vwlr2h8r/video/upload/v1794851656/Final_Video.mp4";
const limelightVideo =
  "https://res.cloudinary.com/vwlr2h8r/video/upload/v1794851804/Limelight-1792496336612.mp4";

const impact = [
  { value: "~55%", label: "Less time on data entry per visit" },
  { value: "~65%", label: "Fewer transcription errors" },
  { value: "~30%", label: "Fewer monitor queries sent back" },
];

export default function CaseStudy({ animateEntrance = true }: { animateEntrance?: boolean }) {
  const active = useScrollSpy(chapterIds);
  const [dark, toggleTheme] = useTheme();

  return (
    <div id="top" className="relative isolate min-h-screen font-sans">
      <NoiseTexture />
      <BreadcrumbPill parent="Projects" current="Nurse Workflow">
        <ThemeToggle dark={dark} onToggle={toggleTheme} />
      </BreadcrumbPill>
      <Sidebar chapters={chapters} active={active} />

      <main className="relative z-10 mx-auto w-full px-5 pt-[130px] pb-32 md:w-[60%] md:px-0">
        <div className="mb-6">
          <MediaBox label="VIDEO" video={limelightVideo} cropBottom={0.04} alt="Clinical trial dashboard overview" />
        </div>
        {/* A. Header */}
        <header>
          <div data-fade className="flex flex-col gap-8 sm:flex-row sm:gap-0">
            <div className="flex flex-col gap-4 sm:w-[70%] sm:pr-12">
              <h1 className="text-[20px] leading-[1.3] font-medium text-ink">
                {nurseProject.title}
              </h1>
              <Body>
                {nurseProject.description}
              </Body>
            </div>
            <dl className="flex flex-col gap-1 text-[13px] sm:w-[30%]">
              <dt className="font-semibold text-ink">Akyrian Systems</dt>
              <dd className="text-label">Clinical Trial Platform</dd>
              <dd className="text-label">Solo Product Designer</dd>
              <dd className="mt-4 text-body">2026</dd>
            </dl>
          </div>
        </header>

        {/* PROBLEM */}
        <TextMedia
          id="problem"
          eyebrow={<span className="text-accent">Problem</span>}
          heading="Nurses are the first and most important part of a clinical trial"
          body="Every patient visit produces data. A nurse captures it, records it, and submits it. What she records becomes the foundation for everything that comes after."
          media={<div className="overflow-hidden rounded-[14px] border border-card-border"><ProblemFlow /></div>}
        />

        <TextMedia
          heading="But the tool they used every day was working against them"
          body="No overview. No priority. A flat list of patients, visits inside each one, forms inside each visit. To know what needed attention, she had to open everything one by one."
          media={<MediaBox label="VIDEO" video={oldInterfaceVideo} />}
          caption="Before."
        />

        <TextMedia
          heading="On top of that, every single value was typed by hand"
          body="Lab report open in one window. Form open in another. Copy each number across, field by field, under time pressure. After that, a monitor spent days checking every value matched the source document."
          media={<MediaBox image={edcVisitInterface} alt="EDC Sandbox Visit 1 interface" />}
          caption={
            <a
              href={edcVisitSource}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-card-border bg-pill px-3 py-1.5 text-[12px] text-ink transition-opacity hover:opacity-70"
            >
              Source ↗
            </a>
          }
        />

        <TextMedia
          heading="And one wrong value could put the whole study on hold, at $540,000 a day"
          body="Every day of delay costs the pharmaceutical sponsor in lost sales and operating costs. A mistyped value triggers a query. A query triggers a correction. A correction delays the study."
          media={<MediaBox image={delayCostImage} alt="Cost of one day of clinical trial delay" />}
          caption={
            <a
              href={delayCostSource}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-card-border bg-pill px-3 py-1.5 text-[12px] text-ink transition-opacity hover:opacity-70"
            >
              Source ↗
            </a>
          }
        />

        {/* INSIGHTS */}
        {/* E. Two-column pair */}
        <section id="insights" className="mt-12 grid scroll-mt-28 gap-x-5 gap-y-16 sm:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="sm:pr-6">
              <TextBlock eyebrow={<span className="text-accent">Insight 1</span>} heading="Nurses almost never finish a form in one go">
                <Body>
                  Some lab values arrive right away. Some take hours. Leaving a form half-done and
                  coming back is not the exception. It is how every shift works.
                </Body>
              </TextBlock>
            </div>
            <MediaBox className="mt-auto" ratio="aspect-[4/3]" image={insight1Image} alt="Insight 1" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="sm:pr-6">
              <TextBlock
                eyebrow={<span className="text-accent">Insight 2</span>}
                heading="The platform is one of fifteen tools open in a nurse’s shift"
              >
                <Body style={{ borderColor: "var(--box)" }}>
                  Any new way of doing things meant one more thing to learn in a shift that already
                  had no room for it.
                </Body>
              </TextBlock>
            </div>
            <MediaBox className="mt-auto" ratio="aspect-[4/3]" image={insight2Image} alt="Insight 2" />
          </div>
        </section>

        <TextMedia
          eyebrow={<span className="text-accent">Insight 3</span>}
          heading="A calendar shows what is coming, not what is unfinished"
          body="I built a calendar-first dashboard. KPI cards at the top, the week laid out below. It made sense with what I knew at that point. Insights 1 and 2 made it the wrong answer."
          media={<MediaBox image={insight3Image} alt="Insight 3" />}
          caption="First approach. Wrong question."
        />

        {/* SOLUTION */}
        <TextMedia
          id="solution"
          eyebrow={<span className="text-accent">Solution</span>}
          heading="One workflow built around what is unfinished, not only what is scheduled"
          body="Everything a nurse needs sits in one workflow. A dashboard that shows what is unfinished, overdue, and flagged. Status at every level. Lab values filled in from the source document. Original and translated values side by side. Flagged values that lead straight to an adverse event."
          media={<MediaBox label="VIDEO" video={dashboardVideo} ratio="aspect-[4/3] sm:aspect-[16/9]" />}
        />

        {/* DESIGN DECISIONS */}
        <TextMedia
          id="design-decisions"
          eyebrow={<span className="text-accent">Design decisions</span>}
          heading="A dashboard that shows what needs attention now"
          body="Pending queries, overdue visits, and incomplete forms in one view. Today’s scheduled visits sit below as a supporting section. No opening patient after patient."
          media={<MediaBox label="VIDEO" video={dashboardVideo} />}
        />

        <TextMedia
          heading="Status that means something at every level"
          body="Before it was colored dots. No explanation. No next step. Now every question has a status. Questions roll up into form status. Forms roll up into visit status. Standard icons. Nothing new to learn."
          media={<MediaBox label="VIDEO" video={statusVideo} />}
        />

        <TextMedia
          heading="Upload the lab PDF, review instead of type"
          body="The system reads the document and fills in the values. Extracted fields are clearly marked. The source document stays visible the whole time. The monitor verifies against the document directly."
          media={<MediaBox label="VIDEO" video={extractionVideo} />}
        />

        <TextMedia
          heading="Original and translation in the same field"
          body="When a lab report arrives in another language, the original and the translated value sit one below the other. Both visible. Both clearly marked."
          media={<MediaBox label="VIDEO" video={translationVideo} />}
        />

        <TextMedia
          heading="Out-of-range values flagged on the spot"
          body="A value outside the protocol range is flagged with a plain explanation. She records the true value. From the flag she can create an adverse event already linked to that patient, visit, and value."
          media={<MediaBox label="VIDEO" video={outOfRangeVideo} />}
        />

        {/* IMPACT */}
        {/* C. Media row, 1:1:1 */}
        <Block id="impact">
          <Eyebrow><span className="text-accent">Impact</span></Eyebrow>
          <div data-fade className="mt-6 grid gap-2 sm:grid-cols-3">
            {impact.map((s) => (
              <div
                data-impact-card
                key={s.value}
                className="flex flex-col justify-between gap-10 rounded-[14px] border border-card-border bg-card p-6 sm:aspect-[4/5]"
              >
                <p className="text-[36px] leading-none font-semibold tracking-tight text-ink">
                  {s.value}
                </p>
                <p className="max-w-[22ch] text-[18px] leading-[1.45] text-body">{s.label}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* H. Callout with button */}
        <Block>
          <a
            href="#"
            data-fade
            className="group flex flex-col gap-5 rounded-[14px] border border-card-border bg-card p-5 sm:min-h-[104px] sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-5"
          >
            <Placeholder label="ICON" className="size-16 shrink-0 px-0" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[18px] font-semibold text-ink">Want the full process?</p>
              <p className="text-[16px] leading-[1.5] text-label">
                Research, wireframes, rejected directions, and every decision documented.
              </p>
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
