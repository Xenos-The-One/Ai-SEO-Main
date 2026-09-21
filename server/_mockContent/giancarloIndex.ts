/**
 * Registry for the Miami real-estate demo client (#6): matches a seeded content row to its body
 * renderer and its hero-image scene. One client, so every piece gets its own unique image.
 */
import * as B from "./giancarloBlogs";
import * as N from "./giancarloNewsletters";

export type GiancarloPiece = {
  /** Distinct substring of the seeded title. */
  match: string;
  render: () => string;
  scene: string;
};

/** Shared look for this client's heroes: bright, architectural, unmistakably South Florida. */
export const GIANCARLO_STYLE =
  "Editorial architectural photography, bright tropical daylight, saturated blues and greens, clean modern composition.";

export const GIANCARLO_PIECES: GiancarloPiece[] = [
  {
    match: "Waterfront Condo",
    render: B.waterfrontCondo,
    scene:
      "The sunlit balcony of a high-floor Miami condominium looking out over Biscayne Bay at golden hour, glass railing, two lounge chairs, palm-lined shoreline and boats far below",
  },
  {
    match: "Miami Real Estate Market Update",
    render: B.marketUpdate,
    scene:
      "Aerial view of the Brickell and downtown Miami skyline at dusk with Biscayne Bay in the foreground, boat wakes on the water, city lights just coming on",
  },
  {
    match: "5 Neighborhoods",
    render: B.fiveNeighborhoods,
    scene:
      "A banyan-shaded residential street in Coconut Grove lined with Mediterranean-style homes, dappled late afternoon light across the road",
  },
  {
    match: "Selling Your Miami Home",
    render: B.pricingToSell,
    scene:
      "An elegantly staged Miami living room with floor-to-ceiling windows, pale furnishings and bay light flooding across the floor, styled for a listing photograph",
  },
  {
    match: "First-Time Homebuyer",
    render: B.firstTimeMiamiBeach,
    scene:
      "A young couple walking a Miami Beach sidewalk past pastel art deco buildings and tall palms, bright clear morning light",
  },
  {
    match: "What $1M Buys",
    render: B.whatMillionBuys,
    scene:
      "A bright contemporary two-bedroom Miami condo interior with balcony doors open to a city and water view, warm modern furnishings, midday light",
  },
  {
    match: "Condo HOA Fees",
    render: B.condoHoaFees,
    scene:
      "The pool deck and facade of a well-kept mid-century Miami condominium building with a maintenance worker tending the deck, palms, clean bright daylight",
  },
  {
    match: "Relocating to Miami",
    render: B.relocatingToMiami,
    scene:
      "A moving van parked outside a Miami home framed by palm trees while a family carries boxes up the walkway, sunny morning",
  },
  {
    match: "Short-Term Rentals",
    render: B.shortTermRentals,
    scene:
      "A stylish furnished Miami condo living area prepared for arriving guests, fresh linens visible through an open bedroom door, afternoon light across pale floors",
  },
  {
    match: "Staging Secrets",
    render: B.stagingSecrets,
    scene:
      "A staged Miami condo balcony with two chairs, a small table and an unobstructed bay view, styled and lit at golden hour",
  },
  {
    match: "Luxury Closing Process",
    render: B.luxuryClosing,
    scene:
      "Two pairs of hands signing paperwork at a polished table in a bright Miami office with water visible through the window, documents out of focus and unreadable",
  },
  {
    match: "New Construction vs Resale",
    render: B.newConstructionVsResale,
    scene:
      "A new glass condominium tower under construction standing beside an established older residential building in Miami, cranes overhead, clear blue sky",
  },
  {
    match: "Anduray Report — July",
    render: N.reportJuly,
    scene:
      "The Miami skyline across Biscayne Bay in high summer with towering afternoon clouds building over the city, brilliant light on the water",
  },
  {
    match: "Anduray Report — August",
    render: N.reportAugust,
    scene:
      "A quiet Miami waterfront residential street in late summer, tall palms, boats moored at private docks, warm evening light",
  },
  {
    match: "Anduray Report — September",
    render: N.reportSeptember,
    scene:
      "Early evening over the Miami Beach coastline with the Intracoastal waterway, low sun and the first city lights across the towers",
  },
  {
    match: "Note: Miami condo HOA fees",
    render: N.noteHoaFees,
    scene:
      "The facade of a Miami condominium building with scaffolding over one section and workers carrying out restoration, palms in the foreground, bright daylight",
  },
  {
    match: "Pricing your home right",
    render: N.notePricingRight,
    scene:
      "A real estate sign standing in the front garden of a Mediterranean-style Miami home framed by palms, warm late afternoon light",
  },
  {
    match: "Waterfront closing timelines",
    render: N.noteWaterfrontTimelines,
    scene:
      "A private dock behind a Miami waterfront home with a boat moored alongside, seawall and calm water catching golden hour light",
  },
];

/**
 * A note and a blog can share subject matter ("The Truth About Miami Condo HOA Fees" vs
 * "Buyer & Seller Note: Miami condo HOA fees"), so match strings must be distinct both as
 * substrings and as slugs - the slug is what keys the hero image.
 */
export function findGiancarloPiece(title: string): GiancarloPiece | undefined {
  return GIANCARLO_PIECES.find((p) => title.includes(p.match));
}
