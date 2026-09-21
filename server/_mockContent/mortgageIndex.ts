/**
 * Registry for the mortgage demo clients (#31-45): matches a seeded content row to its body
 * renderer and its hero-image scenes.
 *
 * The 15 clients share this library, so each piece carries three scene variants and a client is
 * assigned one variant for all of its content. Neighbouring clients therefore never show the same
 * hero image, and no scene is tied to a specific city (the same image serves St. Louis and Irvine).
 */
import type { Ctx } from "./mortgageBlogs";
import * as B from "./mortgageBlogs";
import * as N from "./mortgageNewsletters";

export type Piece = {
  /** Distinct substring of the seeded title. */
  match: string;
  render: (c: Ctx) => string;
  /** Three interchangeable hero scenes, one per client variant group. */
  scenes: [string, string, string];
};

export const MORTGAGE_PIECES: Piece[] = [
  {
    match: "First-Time Home Buyer Programs",
    render: B.firstTimeBuyerPrograms,
    scenes: [
      "A young couple standing on the front porch of a modest older home, one of them holding a house key, both looking at the door rather than the camera, late afternoon golden light",
      "A first-time buyer couple at a kitchen table with an open laptop and a folder of papers, mugs of coffee, bright morning light through the window, hopeful and relaxed",
      "A young woman standing alone in the empty living room of her first house, moving boxes stacked behind her, sunlight falling across bare wood floors",
    ],
  },
  {
    match: "How Much House Can You Really Afford",
    render: B.howMuchHouse,
    scenes: [
      "A person at a kitchen table with a calculator, an open notebook of handwritten figures and a cup of coffee, warm morning light, concentrating",
      "A couple standing on the sidewalk outside a for-sale suburban house, talking quietly to each other, weighing something up, overcast afternoon",
      "Overhead view of a kitchen table with a household budget notebook, a pen, a stack of unreadable out-of-focus statements and a set of house keys",
    ],
  },
  {
    match: "Conventional vs FHA",
    render: B.conventionalVsFha,
    scenes: [
      "Two similar suburban houses side by side on the same street, one slightly older than the other, clear bright daylight, straight-on symmetrical composition",
      "A loan officer and a young couple at a desk comparing two printed documents laid side by side, papers out of focus and unreadable, soft natural office light",
      "A residential street forking into two branches with modest houses along both, early evening light, viewed from the junction",
    ],
  },
  {
    match: "VA Loans in",
    render: B.vaLoans,
    scenes: [
      "A veteran in civilian clothes standing on the front porch of a suburban home with their family, an American flag mounted by the door, warm late-day light",
      "A service member in uniform crouching to hug their child in the front yard of a newly purchased home, a moving truck parked at the curb behind them",
      "A veteran couple walking up the driveway of a modest home carrying moving boxes, a folded uniform visible in the top box, bright morning",
    ],
  },
  {
    match: "Should You Refinance",
    render: B.shouldYouRefinance,
    scenes: [
      "A homeowner at their dining table reviewing paperwork beside an open laptop, papers blurred and unreadable, calm afternoon light",
      "A couple sitting on the floor of their own living room with documents spread across the coffee table, comfortable and settled, lamp light",
      "Close view of a pair of hands comparing two out-of-focus documents on a kitchen counter beside a morning coffee, soft window light",
    ],
  },
  {
    match: "What Actually Moves Your Mortgage Rate",
    render: B.whatMovesYourRate,
    scenes: [
      "A person reading on a tablet at a kitchen counter early in the morning, screen glow on their face, quiet house around them",
      "A tidy home office desk with an out-of-focus printed report, a pen and reading glasses, soft window light falling across the surface",
      "A couple leaning in as an advisor explains something across a desk, hands mid-gesture, bright uncluttered office",
    ],
  },
  {
    match: "Home-Buying Timeline",
    render: B.homeBuyingTimeline,
    scenes: [
      "Moving day at a suburban house, cardboard boxes stacked by the open front door, a family carrying things up the walkway, bright midday",
      "A couple walking through an empty house mid-tour with an agent gesturing toward a window, afternoon light on bare floors",
      "A home inspector on a ladder examining a roofline and gutter, clear daylight, shot from the yard below",
    ],
  },
  {
    match: "Jumbo Loans in",
    render: B.jumboLoans,
    scenes: [
      "A large contemporary two-story home at dusk with warm interior lights glowing through tall windows, landscaped front yard",
      "An elegant modern living room with floor-to-ceiling windows and afternoon light pouring across pale furniture and wide plank floors",
      "Aerial view of an upscale residential neighborhood with mature trees, generous lots and larger homes, late afternoon shadows",
    ],
  },
  {
    match: "Getting Pre-Approved",
    render: B.gettingPreApproved,
    scenes: [
      "A couple shaking hands with a loan officer across a desk in a bright uncluttered office, everyone smiling naturally",
      "A person sitting in their parked car outside a house, phone to their ear and a folder on the passenger seat, smiling at good news",
      "A couple side by side at a laptop on their dining table in the evening, lamp light, photographing documents with a phone",
    ],
  },
  {
    match: "Down Payment Assistance",
    render: B.downPaymentAssistance,
    scenes: [
      "A young family standing together in front of a modest home beneath a real estate sign in the yard, warm late-day light, genuinely happy",
      "Close view of a set of house keys being passed from one hand to another across a table, soft daylight, shallow focus",
      "A first-time buyer couple unpacking dishes in a small bright kitchen, boxes open around them, sunlight through an uncovered window",
    ],
  },
  {
    match: "Self-Employed in",
    render: B.selfEmployed,
    scenes: [
      "A small-business owner in a woodworking shop with a laptop open on the workbench among tools, mid-afternoon light through high windows",
      "A woman doing paperwork at the counter of her small bakery after closing, chairs up on tables behind her, warm evening light",
      "A contractor sitting in the cab of his work truck at the end of the day with a laptop and a folder on the passenger seat, golden hour",
    ],
  },
  {
    match: "Buying vs Renting",
    render: B.buyingVsRenting,
    scenes: [
      "A young couple standing outside an apartment building beside a few moving boxes, looking down the street toward a neighborhood of houses, dusk",
      "A person looking out an apartment window at a street of single-family homes below, thoughtful, morning light across their face",
      "A couple walking a dog along a sidewalk past a row of modest houses in a residential neighborhood, warm evening light",
    ],
  },
  {
    match: "Mortgage Minute — July",
    render: N.julyMinute,
    scenes: [
      "A quiet residential street on a summer evening, mature trees, a few porch lights just coming on, long golden shadows",
      "Kids riding bikes down a suburban sidewalk in high summer, sprinklers running on a lawn, bright saturated afternoon",
      "A front porch with two chairs and a screen door in summer, potted plants, late-day sun across the boards",
    ],
  },
  {
    match: "Mortgage Minute — August",
    render: N.augustMinute,
    scenes: [
      "A suburban street in late summer with a for-sale sign in one yard, warm evening light, empty sidewalk",
      "An open-house style front walkway with the door ajar and light spilling out, late summer dusk",
      "A neighborhood of modest homes photographed from the end of the block, heat haze and deep green trees, late afternoon",
    ],
  },
  {
    match: "Mortgage Minute — September",
    render: N.septemberMinute,
    scenes: [
      "An early autumn residential street with the first turning leaves, a porch light on at dusk, calm and inviting",
      "A front yard in early fall with long low sunlight across the grass and a modest house behind, warm tones",
      "A quiet neighborhood sidewalk in early autumn morning, low sun through the trees, a house with lit windows",
    ],
  },
];

export function findPiece(title: string): Piece | undefined {
  return MORTGAGE_PIECES.find((p) => title.includes(p.match));
}
