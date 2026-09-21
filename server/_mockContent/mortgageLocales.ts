/**
 * Per-market detail for the 15 mortgage loan-officer demo clients (#31-45).
 *
 * The 15 clients share one library of article topics, so what makes each portal's content read
 * as genuinely local lives here: real neighborhoods, the actual state housing finance agency and
 * its programs, and the one or two quirks a buyer in that metro really does run into (Michigan's
 * taxable-value uncapping, Massachusetts Title V, Florida insurance and roof age, Colorado metro
 * districts, California Mello-Roos, and so on).
 *
 * Deliberately no dollar figures, rates or percentages - those go stale and a loan officer's blog
 * should not quote them anyway.
 */

export type Locale = {
  clientId: number;
  /** Neighborhoods and suburbs a local would actually name, entry-level first. */
  hoods: string[];
  /** Two or three markets a step up in price, used for move-up and jumbo pieces. */
  upmarket: string[];
  /** State housing finance agency, short form. */
  hfa: string;
  /** Its flagship first-time-buyer loan program. */
  hfaProgram: string;
  /** Its down payment assistance, described the way the agency describes it. */
  hfaDpa: string;
  /** One sentence on the character of the metro's housing market. */
  market: string;
  /** The local cost-of-ownership quirk that surprises buyers. Full sentence. */
  quirk: string;
  /** A second local wrinkle, used to vary which article mentions what. */
  quirk2: string;
  /** How the inventory/season tends to behave locally. */
  season: string;
  /** True where USDA rural eligibility is genuinely in play near the metro. */
  usda: boolean;
  /** True where jumbo financing is routine rather than exceptional. */
  jumboNormal: boolean;
};

export const LOCALES: Record<number, Locale> = {
  31: {
    clientId: 31,
    hoods: ["Affton", "Maplewood", "Florissant", "Tower Grove South", "Overland"],
    upmarket: ["Webster Groves", "Kirkwood", "Clayton"],
    hfa: "the Missouri Housing Development Commission (MHDC)",
    hfaProgram: "First Place",
    hfaDpa: "cash assistance tied to the First Place loan, structured as a forgivable second that goes away after you have lived in the home long enough",
    market: "St. Louis is one of the few large metros where a median household income still buys a median house, which keeps first-time buyers in the game long after they would have been priced out elsewhere.",
    quirk: "Our housing stock is old and mostly brick, so sewer laterals, knob-and-tube wiring and century-old foundations show up on inspection reports constantly - budget for the inspection you actually need, not the cheapest one.",
    quirk2: "Plenty of St. Louis County municipalities require an occupancy permit and their own point-of-sale inspection before you can move in, and that timeline belongs on your closing calendar from day one.",
    season: "Listings thin out badly between Thanksgiving and February, which is exactly when a prepared buyer faces the least competition.",
    usda: true,
    jumboNormal: false,
  },
  32: {
    clientId: 32,
    hoods: ["Green Valley Ranch", "Aurora", "Westminster", "Thornton", "Lakewood"],
    upmarket: ["Arvada", "Littleton", "Park Hill"],
    hfa: "the Colorado Housing and Finance Authority (CHFA)",
    hfaProgram: "CHFA FirstStep and SmartStep",
    hfaDpa: "down payment assistance offered as either a grant or a silent second, depending on which CHFA product your file fits",
    market: "Denver corrected from its frenzy without ever becoming cheap, so the buyers who win here are the ones who are genuinely ready rather than the ones willing to overpay.",
    quirk: "Metro districts are the line item that blindsides people: a newer home in Green Valley Ranch, Thornton or the Aurora fringe can carry a mill levy well above an older Lakewood house, and that lands in your monthly payment forever.",
    quirk2: "HOA dues and hail-driven insurance premiums move Denver payments more than most buyers expect, and both need to be real numbers in your budget before you write an offer.",
    season: "Spring brings a rush of listings and competition; the quieter stretch from late fall into January is where patient buyers get concessions.",
    usda: false,
    jumboNormal: true,
  },
  33: {
    clientId: 33,
    hoods: ["Reynoldsburg", "Grove City", "Whitehall", "Hilliard", "Gahanna"],
    upmarket: ["Clintonville", "Westerville", "Dublin", "German Village"],
    hfa: "the Ohio Housing Finance Agency (OHFA)",
    hfaProgram: "Your Choice! Down Payment Assistance",
    hfaDpa: "assistance calculated as a percentage of the purchase price, forgiven after a set number of years in the home, plus targeted programs like Grants for Grads and Ohio Heroes",
    market: "Columbus has quietly become a growth market - the chip plants and the university keep demand steady - and entry-level inventory moves faster now than longtime residents expect.",
    quirk: "Franklin County reappraisals can move an escrow payment noticeably between one year and the next, so budgeting off the seller's current tax bill sets you up for a surprise.",
    quirk2: "School district boundaries and municipal income taxes vary block to block around here, and they change both what you pay and what your home is worth later.",
    season: "The market wakes up in March and stays busy through the summer, then loosens meaningfully once school starts.",
    usda: true,
    jumboNormal: false,
  },
  34: {
    clientId: 34,
    hoods: ["Steele Creek", "University City", "Mint Hill", "Concord", "Kannapolis"],
    upmarket: ["Plaza Midwood", "NoDa", "Ballantyne", "Huntersville"],
    hfa: "the North Carolina Housing Finance Agency",
    hfaProgram: "NC Home Advantage Mortgage",
    hfaDpa: "down payment help through NC 1st Home Advantage, a deferred second that is forgiven over time, often paired with the NC Home Advantage Tax Credit",
    market: "Charlotte absorbs newcomers every month, and the practical effect is that well-priced homes inside the beltway move quickly while outlying new construction gives you room to negotiate.",
    quirk: "Mecklenburg County revaluations arrive in jumps rather than gradually, and a reval year can reset your escrow in a way the seller's old tax bill never warned you about.",
    quirk2: "A lot of the affordable inventory sits in Cabarrus, Union and Gaston counties, where the commute math and the tax rate both change - run both before you fall for the price.",
    season: "Relocation season peaks in late spring; December and January are genuinely quieter and genuinely better for buyers.",
    usda: true,
    jumboNormal: false,
  },
  35: {
    clientId: 35,
    hoods: ["Antioch", "Madison", "Hermitage", "Donelson", "Smyrna"],
    upmarket: ["East Nashville", "Bellevue", "Mt. Juliet", "Franklin"],
    hfa: "the Tennessee Housing Development Agency (THDA)",
    hfaProgram: "Great Choice Home Loan",
    hfaDpa: "Great Choice Plus, a deferred second for down payment and closing costs, with Homeownership for the Brave adding a rate reduction for military buyers",
    market: "Nashville's price growth has outrun local wage growth for years, so the affordability conversation here starts further out from downtown than most transplants expect.",
    quirk: "Tennessee has no state income tax, which helps, but Davidson County reappraisals and rising insurance premiums quietly claw back part of that advantage.",
    quirk2: "Short-term rental demand props up prices in several close-in neighborhoods, and financing a property with rental history requires a conversation before you write the offer, not after.",
    season: "Inventory peaks in early summer; the best negotiating window is the stretch from Halloween through the new year.",
    usda: true,
    jumboNormal: false,
  },
  36: {
    clientId: 36,
    hoods: ["Avondale", "Buckeye", "Litchfield Park", "Surprise", "El Mirage"],
    upmarket: ["Verrado", "Estrella", "Palm Valley", "Peoria"],
    hfa: "the Arizona Industrial Development Authority",
    hfaProgram: "HOME Plus",
    hfaDpa: "HOME Plus assistance delivered as a forgivable second alongside a fixed-rate first mortgage, available statewide rather than only to first-time buyers",
    market: "The West Valley is a builder's market, which means incentives are real and negotiable in a way resale rarely is - the trade-off is that your competition is a sales office, not another buyer.",
    quirk: "Community facilities districts in master-planned areas like Verrado and Estrella add an assessment on top of HOA dues, and both belong in your payment before you sign a builder contract.",
    quirk2: "Builder lender incentives are worth taking seriously, but compare the whole package - a buydown on a higher base price is not automatically the better deal.",
    season: "Snowbird season firms up demand from October through March; midsummer is when sellers get flexible.",
    usda: true,
    jumboNormal: false,
  },
  37: {
    clientId: 37,
    hoods: ["Raleigh", "Berclair", "Cordova", "Hickory Hill", "Frayser"],
    upmarket: ["Midtown", "Cooper-Young", "East Memphis", "Bartlett", "Collierville"],
    hfa: "the Tennessee Housing Development Agency (THDA)",
    hfaProgram: "Great Choice Home Loan",
    hfaDpa: "Great Choice Plus, a deferred second covering down payment and closing costs, with Homeownership for the Brave for military buyers",
    market: "Memphis is one of the most affordable big-city markets in the country, and the flip side is that investors compete hard for exactly the entry-level houses first-time buyers want.",
    quirk: "Combined city and county property taxes in Shelby County run high for Tennessee, so a Memphis payment leans on escrow more than the purchase price alone suggests.",
    quirk2: "A lot of entry-level inventory has been through a flip, and a cosmetic renovation over deferred maintenance is the single most common trap I talk buyers out of.",
    season: "Spring is competitive against investor cash; late fall is when an owner-occupant offer stands out most.",
    usda: true,
    jumboNormal: false,
  },
  38: {
    clientId: 38,
    hoods: ["East Point", "Douglasville", "Lawrenceville", "Stone Mountain", "Austell"],
    upmarket: ["Decatur", "Smyrna", "Kirkwood", "Grant Park", "Marietta"],
    hfa: "the Georgia Department of Community Affairs",
    hfaProgram: "Georgia Dream",
    hfaDpa: "Georgia Dream down payment assistance as a deferred second, with larger amounts through the PEN tier for protectors, educators and nurses",
    market: "Metro Atlanta is really a dozen markets stitched together, and which county you buy in changes your taxes, your schools and your commute far more than the listing photos suggest.",
    quirk: "Homestead exemptions have filing deadlines and they do not follow the previous owner, so a buyer who misses the window pays a full year at the unexempted rate.",
    quirk2: "Traffic patterns price neighborhoods here - two similar houses twenty minutes apart on the map can be forty-five minutes apart at 8am, and the market knows it.",
    season: "Spring listings move fast; the window between Thanksgiving and mid-January consistently favors buyers.",
    usda: true,
    jumboNormal: false,
  },
  39: {
    clientId: 39,
    hoods: ["Concord", "Martinez", "Pittsburg", "Antioch", "Pleasant Hill"],
    upmarket: ["Lafayette", "Danville", "Alamo", "Rossmoor"],
    hfa: "the California Housing Finance Agency (CalHFA)",
    hfaProgram: "CalPLUS with MyHome Assistance",
    hfaDpa: "MyHome, a deferred second for down payment and closing costs, alongside periodic shared-appreciation offerings when funding rounds open",
    market: "Contra Costa spans an enormous price range - a Pittsburg or Antioch purchase and a Lafayette purchase are different financial universes, and they need different loan structures.",
    quirk: "Mello-Roos assessments in newer East County developments ride along with your tax bill for decades, and buyers routinely leave them out of the affordability math.",
    quirk2: "Wildfire risk has made insurance the hardest part of some East Bay closings - get a quote early, because an unaffordable premium can undo an otherwise solid approval.",
    season: "The spring market is fierce; motivated sellers surface in the fall once the relocation wave passes.",
    usda: false,
    jumboNormal: true,
  },
  40: {
    clientId: 40,
    hoods: ["Attleboro", "Plainville", "Norton", "Seekonk", "Rehoboth"],
    upmarket: ["Mansfield", "Foxborough", "Wrentham", "Franklin"],
    hfa: "MassHousing",
    hfaProgram: "the MassHousing Mortgage",
    hfaDpa: "MassHousing down payment assistance as a subordinate loan, with the ONE Mortgage program as a strong alternative for income-eligible buyers",
    market: "North Attleboro sits in the seam between Boston and Providence, and buyers here are usually trading commute minutes for the square footage neither city center will give them.",
    quirk: "Massachusetts requires a Title V septic inspection before a sale in unsewered areas, and a failed system is a five-figure problem that reshapes the whole negotiation.",
    quirk2: "A lot of our housing stock still runs on oil heat with older systems, so ask for the tank age and the annual usage before you assume the utility budget.",
    season: "New England inventory all but disappears in deep winter and floods back in April - buying in February means less choice but far less competition.",
    usda: true,
    jumboNormal: false,
  },
  41: {
    clientId: 41,
    hoods: ["Beaverdale", "Altoona", "Norwalk", "Urbandale", "Windsor Heights"],
    upmarket: ["Ankeny", "Waukee", "West Des Moines", "Clive", "Johnston"],
    hfa: "the Iowa Finance Authority (IFA)",
    hfaProgram: "FirstHome and Homes for Iowans",
    hfaDpa: "a down payment grant or a second-mortgage option layered onto either program, with Homes for Iowans open to repeat buyers too",
    market: "Des Moines keeps landing on affordability lists for good reason, and the practical result is that first-time buyers here can still be choosy if they are genuinely pre-approved.",
    quirk: "Iowa's assessment rollback and relatively high levy rates mean your escrow is a bigger share of the payment than buyers moving in from other states expect.",
    quirk2: "Suburban new construction in Ankeny and Waukee competes directly with older Beaverdale charm, and the two carry very different maintenance and tax profiles.",
    season: "The market runs hard from March through July, then goes quiet - and quiet is where deals live.",
    usda: true,
    jumboNormal: false,
  },
  42: {
    clientId: 42,
    hoods: ["Southgate", "Taylor", "Riverview", "Wyandotte", "Flat Rock"],
    upmarket: ["Trenton", "Brownstown", "Grosse Ile", "Allen Park"],
    hfa: "the Michigan State Housing Development Authority (MSHDA)",
    hfaProgram: "the MI Home Loan",
    hfaDpa: "the MI 10K DPA Loan, a zero-interest second that is repaid only when you sell, refinance or pay off the first mortgage",
    market: "Downriver remains one of the most attainable corners of metro Detroit, and solid postwar housing stock at accessible prices is the whole reason buyers look here first.",
    quirk: "Michigan uncaps a property's taxable value when it changes hands, so the tax bill you inherit is almost never the tax bill the seller was paying - always run the uncapped number.",
    quirk2: "The principal residence exemption has to be filed after closing to get the homestead rate, and missing it is an expensive clerical error.",
    season: "Winter listings are sparse and sellers who stay on the market through January are usually motivated.",
    usda: true,
    jumboNormal: false,
  },
  43: {
    clientId: 43,
    hoods: ["Town 'n' Country", "Brandon", "Riverview", "Temple Terrace", "Gibsonton"],
    upmarket: ["Seminole Heights", "Westchase", "Carrollwood", "Wesley Chapel", "Apollo Beach"],
    hfa: "Florida Housing Finance Corporation",
    hfaProgram: "the Florida First and HFA Preferred programs",
    hfaDpa: "Florida Assist and the FL HLP second mortgage for down payment and closing costs, plus Hometown Heroes for eligible frontline and essential workers",
    market: "Tampa's price run has flattened into something more negotiable, and for the first time in a while buyers can ask for repairs and concessions without losing the house.",
    quirk: "Insurance is the deciding variable in Tampa affordability right now - roof age, a four-point inspection and wind mitigation credits can swing a premium more than your rate does.",
    quirk2: "Flood zone designation and, for condos, the post-Surfside milestone inspection and reserve requirements can change what a building is even financeable under - check both before you get attached.",
    season: "Snowbird and relocation demand firms up from January through April; late summer is the quietest stretch.",
    usda: true,
    jumboNormal: false,
  },
  44: {
    clientId: 44,
    hoods: ["Tustin", "Lake Forest", "Costa Mesa", "Anaheim Hills", "Mission Viejo"],
    upmarket: ["Woodbridge", "Turtle Rock", "Northwood", "Portola Springs"],
    hfa: "the California Housing Finance Agency (CalHFA)",
    hfaProgram: "CalPLUS with MyHome Assistance",
    hfaDpa: "MyHome, a deferred second covering down payment and closing costs, with shared-appreciation programs opening periodically when funding allows",
    market: "Irvine is a jumbo market with a school-district premium baked into every price, and buyers here are usually optimizing structure and reserves rather than hunting for a bargain.",
    quirk: "Mello-Roos in the newer villages - Portola Springs, Great Park and their neighbors - stacks on top of HOA dues, and together they can rival a second car payment.",
    quirk2: "Condo and planned-development financing in Orange County lives or dies on the HOA's budget, reserves and litigation status, which is why I review those documents before we get too far in.",
    season: "Spring brings the most inventory and the most competition; the holidays remain the least crowded time to buy.",
    usda: false,
    jumboNormal: true,
  },
  45: {
    clientId: 45,
    hoods: ["Marion Oaks", "Silver Springs Shores", "Belleview", "Summerfield", "Dunnellon"],
    upmarket: ["Northwest Ocala", "On Top of the World", "the horse farm corridor along NW 27th"],
    hfa: "Florida Housing Finance Corporation",
    hfaProgram: "the Florida First and HFA Preferred programs",
    hfaDpa: "Florida Assist and the FL HLP second mortgage, with Hometown Heroes available to eligible essential workers",
    market: "Ocala draws retirees, remote workers and horse people in roughly equal measure, and that mix keeps demand steadier here than in Florida's coastal boom-and-bust markets.",
    quirk: "Large stretches of Marion County qualify for USDA financing, which means a zero-down loan is a live option here in a way it simply is not in Tampa or Orlando.",
    quirk2: "Insurance underwriting turns on roof age and a four-point inspection, and an older roof can quietly disqualify a house you have already fallen for.",
    season: "Winter brings the out-of-state buyers; the summer heat thins the competition considerably.",
    usda: true,
    jumboNormal: false,
  },
};
