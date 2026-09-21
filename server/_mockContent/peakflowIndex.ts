/**
 * Registry for the Peakflow SaaS demo client (#5): matches a seeded content row to its body
 * renderer and its hero-image scene. One client, so every piece gets its own unique image.
 *
 * Scenes avoid legible screens and whiteboards - anything the image model would try to render as
 * text comes out as garbled lettering, so surfaces are described as out of focus or unreadable.
 */
import * as B from "./peakflowBlogs";
import * as N from "./peakflowNewsletters";

export type PeakflowPiece = {
  /** Distinct substring of the seeded title. */
  match: string;
  render: () => string;
  scene: string;
};

/** Shared look for this client's heroes. */
export const PEAKFLOW_STYLE =
  "Modern workplace editorial photography, bright natural light, candid real people, clean uncluttered composition, muted contemporary colour palette.";

export const PEAKFLOW_PIECES: PeakflowPiece[] = [
  // --- Cluster A: remote and async ---
  {
    match: "How Remote Teams Stay Aligned",
    render: B.remoteAlignment,
    scene:
      "Four people on a video call visible on a laptop screen from behind, the screen glow out of focus, a bright home office with a window and plants",
  },
  {
    match: "Async-First Playbook",
    render: B.asyncFirstPlaybook,
    scene:
      "A person typing thoughtfully at a tidy desk early in the morning, coffee steaming, empty quiet office behind them, low sun through blinds",
  },
  {
    match: "Running Effective Standups",
    render: B.asyncStandups,
    scene:
      "A wall of clocks showing different times above a shared workspace, people working below at their own pace, warm daylight",
  },
  {
    match: "Building Team Trust",
    render: B.remoteTrust,
    scene:
      "Two colleagues on a video call laughing, seen over the shoulder of one of them in a sunlit kitchen-turned-office, screen deliberately out of focus",
  },

  // --- Cluster B: choosing and outgrowing tools ---
  {
    match: "Asana vs Monday vs Peakflow",
    render: B.toolComparison,
    scene:
      "Three laptops open side by side on a long wooden table, screens blurred beyond recognition, a person leaning in to compare, bright studio light",
  },
  {
    match: "Graduate From Spreadsheets",
    render: B.spreadsheetsToTool,
    scene:
      "A cluttered desk with printed spreadsheets spilling across it, the paper out of focus and unreadable, a person rubbing their eyes in the afternoon light",
  },
  {
    match: "Choosing Project Management Software",
    render: B.choosingSoftware,
    scene:
      "A small team gathered around one laptop in a meeting room, one person pointing at the blurred screen, others considering, natural window light",
  },
  {
    match: "Trello Alternatives",
    render: B.trelloAlternatives,
    scene:
      "A glass wall densely covered in overlapping blank coloured sticky notes, a person standing back with arms folded assessing the sprawl",
  },

  // --- Cluster C: agile practice ---
  {
    match: "Sprint Planning for Small Teams",
    render: B.sprintPlanning,
    scene:
      "Five people seated around a small table mid-discussion, blank index cards spread between them, bright modern office, engaged body language",
  },
  {
    match: "Story Points Without the Arguments",
    render: B.storyPoints,
    scene:
      "Several hands laying down blank estimation cards simultaneously on a table, shallow focus on the cards, daylight from a side window",
  },
  {
    match: "Retrospective Your Team Won't Dread",
    render: B.retrospectives,
    scene:
      "A small team sitting in a relaxed circle of chairs, one person speaking while others listen, blank sticky notes clustered on the wall behind them",
  },
  {
    match: "Backlog Grooming",
    render: B.backlogGrooming,
    scene:
      "Two people sorting a long column of blank cards on a wall, removing some and moving others up, focused and methodical, clear daylight",
  },

  // --- Cluster D: planning and dates ---
  {
    match: "Gantt Chart Best Practices",
    render: B.ganttBestPractices,
    scene:
      "An abstract arrangement of horizontal coloured bars of varying lengths arranged as a timeline on a pale surface, overhead view, no lettering anywhere",
  },
  {
    match: "Managing Project Dependencies",
    render: B.projectDependencies,
    scene:
      "Coloured string connecting pins across a large corkboard in a web of relationships, blank cards at the nodes, side light raking across the surface",
  },
  {
    match: "Buffer Time",
    render: B.bufferTime,
    scene:
      "A line of dominoes on a desk with one deliberate gap left in the middle, shallow depth of field, soft directional light",
  },
  {
    match: "Milestones vs Deadlines",
    render: B.milestonesVsDeadlines,
    scene:
      "A running track with distance markers stretching into the distance, early morning light and long shadows, no signage or numbers visible",
  },

  // --- Cluster E: attention and priorities ---
  {
    match: "Weekly Review That Keeps Projects",
    render: B.weeklyReview,
    scene:
      "A small group standing in a brief informal meeting beside a wall of blank cards, coffee cups in hand, Monday morning light through tall windows",
  },
  {
    match: "Cutting Meeting Load",
    render: B.cuttingMeetings,
    scene:
      "An empty meeting room with chairs neatly pushed in and sunlight falling across the table, seen through an open glass door",
  },
  {
    match: "Deep Work for Delivery Teams",
    render: B.deepWork,
    scene:
      "A single person working with complete concentration at a desk by a large window, headphones on, the rest of the office soft and out of focus behind them",
  },
  {
    match: "Prioritization Frameworks",
    render: B.prioritizationFrameworks,
    scene:
      "A person's hands arranging blank cards into two distinct piles on a desk, one noticeably larger than the other, overhead view, crisp daylight",
  },

  // --- Cluster F: agencies ---
  {
    match: "Built for Marketing Agencies",
    render: B.agencyProjectManagement,
    scene:
      "A busy creative agency studio with several people working at a long shared desk, mood boards of blank swatches on the wall, warm afternoon light",
  },
  {
    match: "How Agencies Keep 12 Clients Straight",
    render: B.agencyClientManagement,
    scene:
      "A wall of twelve neatly arranged project boards with blank cards, a person walking past scanning them, bright open-plan studio",
  },
  {
    match: "Client Approvals That Don't Stall",
    render: B.clientApprovals,
    scene:
      "A person reviewing work on a tablet in a bright café, finger hovering to tap approval, screen deliberately out of focus, morning light",
  },
  {
    match: "Capacity Planning for Agencies",
    render: B.agencyCapacityPlanning,
    scene:
      "An overhead view of a studio floor with several desks, some occupied and some empty, clean geometric composition, natural light from skylights",
  },

  // --- Cluster G: measurement ---
  {
    match: "Metrics That Actually Predict",
    render: B.deliveryMetrics,
    scene:
      "An abstract arrangement of coloured blocks forming a rising and falling pattern on a pale desk, macro perspective, soft shadows, no labels",
  },
  {
    match: "Weekly Status Report",
    render: B.weeklyStatusReport,
    scene:
      "A person reading a single printed page at their desk with full attention, the page blurred and unreadable, quiet office, morning light",
  },
  {
    match: "Cycle Time vs Lead Time",
    render: B.cycleTimeLeadTime,
    scene:
      "A stopwatch resting on a pale surface beside a short queue of identical blank cards, shallow focus, clean directional light",
  },
  {
    match: "Turning Project Data Into Decisions",
    render: B.projectDataDecisions,
    scene:
      "Two people in conversation in front of a large display showing an out-of-focus chart, one gesturing at a trend, dim room lit by the screen and a window",
  },

  // --- Cluster H: goals, kickoffs, scope, stakeholders ---
  {
    match: "Setting Quarterly Goals",
    render: B.quarterlyGoals,
    scene:
      "Three large blank cards pinned prominently and alone on an otherwise empty wall, a person standing back looking at them, bright minimal room",
  },
  {
    match: "Kickoff Meeting Checklist",
    render: B.kickoffChecklist,
    scene:
      "A team at the start of a project meeting, notebooks open and untouched coffee, energetic and attentive, bright meeting room with a big window",
  },
  {
    match: "Scope Creep",
    render: B.scopeCreep,
    scene:
      "A neat stack of blank cards with several extra ones balanced precariously on top, about to topple, shallow focus, dramatic side light",
  },
  {
    match: "Stakeholder Updates That Build Trust",
    render: B.stakeholderUpdates,
    scene:
      "Two people talking candidly across a desk in an executive office, one listening carefully, city visible through the window behind, warm daylight",
  },

  // --- Peakflow Monthly ---
  {
    match: "Monthly — February",
    render: N.monthlyFebruary,
    scene:
      "A quiet open-plan office in winter with low bright sunlight streaming across empty desks and one person working in the distance",
  },
  {
    match: "Monthly — March",
    render: N.monthlyMarch,
    scene:
      "A team working at a shared table with early spring light through large windows, a plant on the sill, relaxed focused atmosphere",
  },
  {
    match: "Monthly — April",
    render: N.monthlyApril,
    scene:
      "A creative studio in spring with the windows open, people working at desks, fresh light and greenery visible outside",
  },
  {
    match: "Monthly — May",
    render: N.monthlyMay,
    scene:
      "A bright workspace with a wall of blank coloured cards and two people in conversation beside it, strong late-spring daylight",
  },
  {
    match: "Monthly — June",
    render: N.monthlyJune,
    scene:
      "An office with a view of summer trees outside, a person working calmly at an uncluttered desk, warm midday light",
  },
  {
    match: "Monthly — July",
    render: N.monthlyJuly,
    scene:
      "A half-empty summer office with a few people working, bright hard light and sharp shadows across the floor",
  },
  {
    match: "Monthly — August",
    render: N.monthlyAugust,
    scene:
      "A very quiet office in late summer, two people working far apart, long golden light through tall windows",
  },
  {
    match: "Monthly — September",
    render: N.monthlySeptember,
    scene:
      "A busy office returning to full activity in early autumn, people in motion between desks, crisp morning light",
  },

  // --- New in Peakflow ---
  {
    match: "New in Peakflow: Async Approvals",
    render: N.featureAsyncApprovals,
    scene:
      "A close view of a hand tapping a tablet screen to confirm something, screen glow on the fingers, screen content out of focus, clean desk beneath",
  },
  {
    match: "New in Peakflow: Faster Boards",
    render: N.featureFasterBoards,
    scene:
      "Motion-blurred coloured cards sweeping across a pale surface suggesting speed, crisp focus on one settled card, studio lighting",
  },
  {
    match: "New in Peakflow: Agency Reporting View",
    render: N.featureAgencyReporting,
    scene:
      "A person standing before a large wall display of several out-of-focus dashboards, taking it in at a glance, modern studio, cool daylight",
  },
  {
    match: "New in Peakflow: Custom Dashboards",
    render: N.featureCustomDashboards,
    scene:
      "An arrangement of four simple abstract gauge shapes on a pale surface, macro view, soft shadows, no numbers or lettering",
  },
  {
    match: "New in Peakflow: Automations 2.0",
    render: N.featureAutomations,
    scene:
      "A row of small mechanical dominos and gears arranged in a neat chain on a pale desk, precise and orderly, directional light",
  },
  {
    match: "New in Peakflow: Time Tracking",
    render: N.featureTimeTracking,
    scene:
      "A simple analogue stopwatch beside a laptop on a bright desk, hand reaching toward it, shallow depth of field, morning light",
  },
  {
    match: "New in Peakflow: Calendar Sync",
    render: N.featureCalendarSync,
    scene:
      "A blank monthly wall planner grid beside a laptop on a tidy desk, no writing on it, clean composition, bright daylight",
  },
  {
    match: "New in Peakflow: AI Standups",
    render: N.featureAiStandups,
    scene:
      "A person reading a morning digest on a phone while standing at a kitchen counter with coffee, screen out of focus, soft window light",
  },
];

export function findPeakflowPiece(title: string): PeakflowPiece | undefined {
  return PEAKFLOW_PIECES.find((p) => title.includes(p.match));
}
