/**
 * Long-form blog bodies for the mortgage loan-officer demo clients (#31-45).
 *
 * One library of twelve articles, each rendered through a client's `Ctx` so the piece names that
 * officer's real neighborhoods, their state housing finance agency and the cost-of-ownership
 * quirks buyers in that metro actually hit. Written in the officer's first-person voice.
 *
 * House rules for this library: no rate quotes, no APRs, no invented statistics or dollar figures,
 * no promises of approval. Trade-offs are stated honestly, including when the answer is "wait".
 */
import type { Locale } from "./mortgageLocales";

export type Ctx = {
  first: string;
  name: string;
  company: string;
  city: string;
  stateFull: string;
  website: string;
  L: Locale;
};

/** "Affton, Maplewood and Florissant" */
export function list(items: string[], n = 3, conj = "and"): string {
  const picked = items.slice(0, n);
  if (picked.length <= 1) return picked[0] ?? "";
  return `${picked.slice(0, -1).join(", ")} ${conj} ${picked[picked.length - 1]}`;
}

const signoff = (c: Ctx) => `\n\n— ${c.name}, ${c.company}`;

// ---------------------------------------------------------------------------
// 1. First-Time Home Buyer Programs in {City}
// ---------------------------------------------------------------------------

export function firstTimeBuyerPrograms(c: Ctx): string {
  const { L } = c;
  return `If you are renting in ${list(L.hoods, 2)} and quietly wondering whether you could own something for close to what you hand a landlord every month, the answer is more often yes than people expect. What decides it is not whether you have twenty percent saved — almost nobody does — but which program fits your income, your credit and the part of ${c.city} you are actually trying to buy in.

I have sat across enough kitchen tables to know the expensive mistake first-time buyers make. It is not choosing the wrong loan. It is not knowing what they qualify for before they start looking, falling for a house that does not fit the program that would have saved them the most, and then discovering the mismatch when they are already emotionally committed.

So here is the honest tour of what is available to ${c.city}-area buyers in 2026: state assistance, the federal loan types, and the practical realities nobody mentions until you are three weeks from closing.

## What "first-time buyer" actually means

This trips up more people than any other definition in my business. Most programs — including ${L.hfa} and most county-level assistance — treat you as a first-time buyer if you have not owned a home in the past three years. Not never. Three years.

So if you owned a place, sold it, and have been renting since, you are very likely eligible again. Some programs also waive the rule entirely in designated target areas. If you have been assuming you are disqualified, that assumption is worth five minutes of checking rather than another year of renting.

## ${L.hfa.replace(/^the /, "The ").replace(/^MassHousing$/, "MassHousing")} and what it offers

The flagship here is ${L.hfaProgram}. Pair it with ${L.hfaDpa}.

A few things I want you to understand about state assistance before you get excited:

- **There are income and purchase-price limits**, and they vary by county and household size. They are more generous than most people assume — these are not poverty programs — but they are real ceilings.
- **Most assistance is a second lien, not a gift.** Some versions are forgiven if you stay long enough, some are repaid when you sell or refinance. Both are fine. Neither is free money, and you should know which one you signed.
- **Funding is finite.** Some programs run in rounds and close when the money is committed. Timing genuinely matters.
- **Homebuyer education is usually required**, and it is a few hours online. Do it early so it never becomes the thing holding up your closing.

## The federal loan types, in plain language

**FHA** is the workhorse for buyers with thinner credit or a smaller down payment. It is forgiving on credit history and flexible about where your down payment came from. The trade-off is mortgage insurance that, in most cases now, stays for the life of the loan unless you refinance out of it later.

**Conventional** loans allow a lower down payment than their reputation suggests, and the private mortgage insurance comes off once you have built enough equity. Stronger credit gets rewarded more here than it does on an FHA file.

**VA**, if you or your spouse served, is the best loan in the country and it is not close: no down payment, no monthly mortgage insurance, and competitive pricing. If you have any military service at all, tell me before we discuss anything else.

**USDA** ${
    L.usda
      ? `is genuinely usable around ${c.city} — the eligibility maps reach closer to the metro than most buyers realize, and it is a zero-down loan with its own income limits.`
      : `is worth knowing about, though the eligibility maps do not reach the ${c.city} market in any practical way. I mention it so you can stop wondering.`
  }

## What this costs you in ${c.city} specifically

${L.market}

${L.quirk}

That last point matters more than the program you choose. I would rather put you in a slightly smaller house with a payment you can carry through a job change than max you out on the biggest number the approval allows.

## The documents to gather this week

You can do this before you talk to anyone, and having it ready is most of what separates a two-day pre-approval from a two-week one:

- Your last 30 days of pay stubs.
- W-2s and tax returns for the past two years — and if you are self-employed, two full years of returns with all schedules.
- Two months of statements for every account you would pull the down payment from. Every page, including the blank ones.
- Photo ID, and your DD-214 or Certificate of Eligibility if you are a veteran.
- A written account of any large recent deposit that did not come from your employer. Underwriting will ask. Having the answer ready keeps it from becoming a delay.

## Common questions I get

**Will applying hurt my credit?** A mortgage inquiry has a small, temporary effect, and multiple mortgage pulls in a short shopping window count as one. Shopping responsibly is not what damages your credit — carrying new debt you took on right before closing is.

**Can I use a gift from family?** Yes, for most programs. It has to be documented properly as a gift rather than a loan, which means a signed letter and a clear paper trail. Start that conversation with your family early; it is slower than people think.

**What credit score do I need?** Less than the internet told you. The bigger question is usually what is *on* the report, not the number itself — a single collection handled correctly can matter more than thirty points.

**How long does this take?** With documents in hand, a real pre-approval takes days, not weeks. The closing itself typically runs a few weeks from accepted offer${
    L.quirk2.includes("occupancy permit") || L.quirk2.includes("Title V")
      ? ", though local inspection requirements can add to that — which is why we plan for them up front."
      : "."
  }

## Where I would start if I were you

Get a real pre-approval before you tour a single house. Not an online estimate, not a calculator — an actual review of your income, credit and assets that produces a number you can write an offer behind. It costs you nothing, and it changes how every conversation after it goes.

Then look at homes slightly below that number. The buyers who stay happy are the ones who left themselves room.

${L.season}

If you want to know what you would qualify for and which ${c.stateFull} program fits your situation, reach out and we will run it together. If the honest answer is that waiting six months puts you in a much better position, I will tell you that too — I would rather have your trust than your application.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 2. How Much House Can You Really Afford in {City}?
// ---------------------------------------------------------------------------

export function howMuchHouse(c: Ctx): string {
  const { L } = c;
  return `There are two answers to this question and they are rarely the same number. One is what a lender will approve you for. The other is what you can carry comfortably through a car repair, a slow quarter at work, or a winter where the furnace gives up. My job is to show you both and then help you pick the one you can live with.

Most online calculators give you neither. They take your income, apply a ratio, and hand back a number that ignores your actual life — the student loan, the daycare bill, the fact that ${c.city} property taxes and insurance are doing something very specific to your payment.

Here is how the math really works.

## Start with the payment, not the price

Buyers shop by purchase price. Lenders underwrite a monthly payment. Learning to think in payments is the single most useful shift you can make.

Your payment has four parts, and people consistently underestimate the last two:

- **Principal and interest** — the loan itself, the part every calculator shows you.
- **Property taxes** — collected monthly into escrow and paid on your behalf.
- **Homeowners insurance** — same arrangement.
- **Mortgage insurance**, if your down payment is under twenty percent, plus HOA dues if the home has them.

${L.quirk}

That is not a footnote. In this market it is often the difference between two houses at the same list price having noticeably different monthly costs.

## The ratio lenders actually use

Underwriting looks at your debt-to-income ratio: your total monthly debt payments, including the new mortgage, divided by your gross monthly income. Car loans, student loans, minimum credit card payments and child support all count. Your groceries, utilities and retirement contributions do not.

The ceiling depends on the loan program and the strength of the rest of your file — strong reserves and good credit buy you flexibility. What I will tell you plainly is that approval at the top of that range and comfort at the top of that range are different things.

## The number I actually want you to use

Take your gross monthly income. Write down what you are paying in rent today. Then ask yourself an honest question: over the past year, did that rent feel easy, tight, or like the reason you have not saved anything?

If it felt easy, you have room. If it felt tight, the answer is not a bigger mortgage — it is the same payment with equity attached, which is still a meaningful upgrade.

Then subtract, in writing:

- Retirement contributions you are not willing to stop.
- Childcare, which for many families is a second mortgage already.
- The maintenance a landlord used to handle. Owners spend real money on this every year, and the older the house, the more it is.
- Whatever you need to keep saving so that a bad month is an inconvenience and not a crisis.

Whatever is left is your honest payment. It is usually somewhat below the approval, and buyers who respect that gap are the ones who still like their house in year three.

## What a bigger down payment actually buys you

More than a smaller loan. A larger down payment can remove mortgage insurance, improve your pricing, and make your offer more credible to a seller weighing multiple bids.

But do not drain yourself to get there. I would rather see you close with a smaller down payment and a few months of reserves in the bank than close with nothing left and a water heater that fails in March. Reserves are not wasted money; they are the thing that keeps a hard month from becoming a missed payment.

## Three buyers, same income, different answers

Consider three hypothetical households earning the same amount in ${c.city}:

The first has no debt and eight months of savings. They can comfortably sit near the upper end of their approval, and if they want a ${list(L.upmarket, 1)} house with a longer commute, the math supports it.

The second has a car payment and student loans. Their approval is lower, and pushing it means no margin at all. ${list(L.hoods, 2)} is the honest hunting ground, and there is nothing second-best about that.

The third is self-employed with strong but uneven income. Their qualifying income is based on what their returns show after deductions, which is frequently lower than what they actually take home. For them the real work is planning the file a year ahead.

Same income. Three genuinely different answers. This is why the calculator lies.

## Questions worth asking before you shop

**Should I pay off my car to qualify for more?** Sometimes. If the loan has only a few payments left, some programs will overlook it. Otherwise, paying off debt to qualify while draining your down payment is usually a wash. Let me run both versions before you move money.

**Does a bigger down payment beat a lower price?** A lower price wins on taxes, insurance and the loan amount all at once. Negotiating well is more powerful than most buyers assume.

**What if rates change after I lock?** We talk through lock timing when you are under contract, and there are usually options if the market moves meaningfully in your favor.

## How I run this with clients

I will give you the approval number because you need it to shop. Then I will show you the payment at three different price points, with ${c.city} taxes and insurance built in rather than estimated loosely, so you can see what each one actually feels like against your paycheck.

${L.market}

If you want to see those numbers for your own situation, reach out. No pressure and no obligation — just a clear picture of what you can carry, so you can go look at houses knowing exactly where the line is.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 3. Conventional vs FHA
// ---------------------------------------------------------------------------

export function conventionalVsFha(c: Ctx): string {
  const { L } = c;
  return `This is the fork in the road for most ${c.city} buyers, and the internet answers it badly. FHA is not "the loan for people with bad credit." Conventional is not automatically better because it sounds more official. They are two different tools, and which one wins depends on details specific to your file.

Let me walk you through how I actually decide, and then you can see where you land.

## The short version

**FHA** is government-insured and built to be forgiving. Lower credit thresholds, a small down payment, and more tolerance for a bumpy credit history or a higher debt load. In exchange, you pay an upfront mortgage insurance premium plus a monthly premium that in most cases stays for the life of the loan.

**Conventional** follows Fannie Mae and Freddie Mac guidelines. It rewards strong credit with better pricing, allows a low down payment for qualified buyers, and — this is the big one — its private mortgage insurance comes off once you have built enough equity.

The pattern is straightforward: **stronger credit tends to favor conventional; a thinner file or a tighter budget often favors FHA.** The interesting cases live in the middle.

## Where FHA genuinely wins

- **Your credit is rebuilding.** FHA's thresholds are meaningfully lower, and it takes a more forgiving view of a past bankruptcy or foreclosure once enough time has passed.
- **Your debt-to-income is stretched.** FHA regularly allows higher ratios than conventional, especially with compensating factors like reserves or a long stable job history.
- **The down payment is a gift.** FHA is flexible about gifted funds.
- **You are buying an older ${c.city} home and the numbers are tight.** The pricing advantage on a thinner credit file can be substantial.

## Where conventional wins

- **Your credit is strong.** Pricing improves as scores rise, and at the top of the range conventional usually beats FHA outright.
- **You plan to build equity and drop the insurance.** Being able to eliminate PMI is worth real money over the years you own the home.
- **You are buying a condo.** ${
    L.quirk2.includes("HOA") || L.quirk2.includes("condo") || L.quirk.includes("condo")
      ? "Around here that matters — FHA requires the project itself to be approved, and plenty of buildings are not."
      : "FHA requires project approval for the building, and many are not on the list. Conventional has more room."
  }
- **You want a competitive offer.** Some sellers, rightly or not, read a conventional offer as less likely to snag on appraisal conditions. It is not always fair, but in a multiple-offer situation it is real.

## The mortgage insurance question, honestly

This is where most of the lifetime cost difference sits.

Conventional PMI is temporary. Once you have enough equity — through payments, appreciation, or both — it comes off, and your payment drops without refinancing anything.

FHA mortgage insurance, under current rules, generally stays for the life of the loan when you put down less than ten percent. The only way out is to refinance into a conventional loan later, which is a real and common path, but it depends on where rates are when you get there.

So the question is not only "which payment is lower today." It is "which payment is lower today, and what is my exit."

## The ${c.city} wrinkle

${L.market}

${L.quirk}

${
    L.jumboNormal
      ? `There is also a ceiling to be aware of: both FHA and conventional have loan limits, and in our market plenty of perfectly ordinary houses sit above them. Cross that line and you are in jumbo territory with different rules entirely — worth knowing before you fall for a listing.`
      : `Loan limits are rarely the binding constraint at our price points, which keeps both options genuinely open for most of the homes my clients are looking at in ${list(L.hoods, 3)}.`
  }

## How I decide with a client

I price both. Same purchase price, same down payment, side by side, with your actual credit profile and our local taxes and insurance built in. Then we look at three numbers together: the monthly payment, the cash needed at closing, and the total cost over the years you realistically expect to stay.

That last one changes answers. A buyer planning to move in four years and a buyer planning to stay twenty should often choose differently, even with identical files.

## Questions I get constantly

**Can I switch later?** Yes. Refinancing from FHA to conventional once your credit and equity improve is one of the most common moves I help clients make. The FHA streamline refinance is also worth knowing about.

**Is FHA slower to close?** Not meaningfully, in my experience. The appraisal has a few extra property condition requirements, which matters more on an older home than on newer construction.

**Will a seller reject my FHA offer?** It happens, though less than buyers fear. A strong pre-approval letter and a clean, uncomplicated offer do more to reassure a seller than the loan type does.

**What if my credit is right at the line?** Then we spend thirty days improving it before applying. Small, targeted moves at the right moment can shift your pricing, and I will tell you exactly which ones are worth making.

## The part that matters more than the choice

Whichever way you go, the loan is only as good as the file behind it. Get your documents together, keep your balances steady, and do not open new credit between pre-approval and closing — not for furniture, not for a car, not for the store card that saves you fifteen percent at checkout.

If you want to see both options priced for your situation, reach out and I will put them side by side. It is a short conversation, and it makes a decision that feels complicated look obvious.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 4. VA Loans in {State}
// ---------------------------------------------------------------------------

export function vaLoans(c: Ctx): string {
  const { L } = c;
  return `If you served, the VA loan is the best mortgage product available in this country, and most of the veterans I meet are underusing it — or have been talked out of it by someone who did not understand it. Let me fix that.

No down payment. No monthly mortgage insurance. Competitive pricing. A benefit you earned, that you can use more than once, and that does not expire.

Here is how it works in ${c.stateFull}, and where the real-world friction actually shows up.

## Who is eligible

Eligibility generally covers veterans, active-duty service members, National Guard and Reserve members with qualifying service, and surviving spouses who have not remarried. Service requirements vary by era and by whether you served active duty or in the Guard or Reserve.

You will need a Certificate of Eligibility. I pull these for clients routinely and it usually takes minutes rather than days. If you are not sure whether your service qualifies, do not guess and do not let an old rumor decide for you — let me check it.

## What makes it genuinely better

**No down payment.** Not "as little as." None, in most cases, up to your entitlement. That is the whole ballgame for buyers who have income but not a pile of savings.

**No monthly mortgage insurance.** FHA and low-down-payment conventional loans both charge it. VA does not. On a typical ${c.city} purchase, that difference compounds every single month you own the home.

**Competitive pricing.** VA loans consistently price well, and the guaranty behind them is why.

**A funding fee, not insurance.** There is a one-time VA funding fee that can be rolled into the loan. It varies with your down payment and whether you have used the benefit before — and if you receive VA disability compensation, it is typically waived entirely. That waiver is worth real money and it is missed more often than you would believe.

**Reusable.** This is not a one-time benefit. You can restore entitlement after selling, and in some situations carry two VA loans at once.

## The friction, stated honestly

I am not going to pretend there is none.

**The appraisal has minimum property requirements.** A VA appraiser checks that the home is safe, sound and sanitary — working systems, a sound roof, no peeling paint on older homes, functioning utilities. On new construction this is a non-event. ${
    L.quirk.includes("old") || L.quirk.includes("older") || L.quirk.includes("postwar") || L.quirk.includes("brick")
      ? `On our older ${c.city} housing stock it deserves attention, and I would rather flag a likely repair issue before you write the offer than discover it two weeks in.`
      : `On older homes it deserves attention, and I would rather flag a likely repair issue before you write the offer than discover it two weeks in.`
  }

**Some sellers hesitate.** Usually because a listing agent had one rough VA transaction years ago. The cure is a strong pre-approval and a lender the other side can actually reach on a Sunday. I answer my phone; it closes more deals than any clever term sheet.

**Condos need project approval.** The building has to be on the VA-approved list. Worth checking before you tour.

## Using it in ${c.city}

${L.market}

Where I see ${c.stateFull} veterans get the most out of this benefit:

- **Buying in ${list(L.hoods, 3)}** with no down payment, and keeping their savings as reserves instead of handing all of it over at closing.
- **Moving up** to ${list(L.upmarket, 2)} later using restored entitlement, rather than assuming the benefit was spent.
- **Refinancing** through the VA Interest Rate Reduction Refinance Loan, which is about as streamlined as a refinance gets when the market moves your way.

${
    L.usda
      ? `Worth noting: parts of the ${c.city} area also qualify for USDA financing, which is the other true zero-down option. For an eligible veteran, VA almost always wins — but it is a useful backup if entitlement is tied up in another property.`
      : `Worth noting: USDA, the other zero-down loan, is not practically available in our market. For veterans here, VA is the zero-down option.`
  }

## What to gather

- Your DD-214, or a statement of service if you are currently serving.
- Your VA disability award letter, if you receive compensation — this is what gets the funding fee waived.
- The usual income and asset documentation: pay stubs, two years of W-2s or returns, two months of bank statements.

## Questions veterans ask me

**Do I have to be a first-time buyer?** No. There is no such requirement.

**Can I use it more than once?** Yes, and you can sometimes hold two VA loans simultaneously depending on your remaining entitlement. This is a conversation, not a form.

**What about my credit?** VA does not set a single national minimum score the way people assume. Lenders apply their own overlays, and the standards are generally more forgiving than conventional.

**Can I buy a multi-unit property?** Yes, up to four units, as long as you live in one of them. For the right veteran this is one of the smartest wealth-building moves available.

**Is the funding fee worth it?** Compare it against years of mortgage insurance you will never pay. It usually is not close.

## One thing I want you to take away

The benefit only helps if you use it, and use it correctly. I have met veterans who put twenty percent down on a conventional loan because nobody told them the VA option was stronger — money that could have stayed in their account, working for them.

If you served, tell me before we talk about anything else. Let me pull your Certificate of Eligibility, check whether the funding fee is waived in your case, and show you what this actually looks like on a ${c.city} purchase.

Thank you for your service — and let me make sure you get every dollar of what you earned.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 5. Should You Refinance in 2026?
// ---------------------------------------------------------------------------

export function shouldYouRefinance(c: Ctx): string {
  const { L } = c;
  return `Refinancing is one of the few financial decisions where the math is genuinely knowable in advance. There is a break-even point. Either you will reach it or you will not, and everything else is noise.

Most of the ${c.city} homeowners who call me about this fall into one of three groups: people who bought when rates were high and have been waiting, people who have built equity and want to do something with it, and people who saw an ad and are not sure whether it applies to them. Let me sort out which one you are.

## The only calculation that matters

Add up every dollar it costs to refinance: lender fees, title, appraisal, recording, prepaid escrow adjustments. Then divide that by your monthly savings. The result is how many months it takes to break even.

If you will stay in the home comfortably longer than that number, the refinance makes sense. If you are thinking about moving before then, it does not — no matter how much better the new rate sounds.

That is the whole framework. Be suspicious of anyone who walks you through a refinance without doing this arithmetic in front of you.

## Four reasons a refinance is genuinely worth it

**Your rate is meaningfully higher than what you would get today.** This is the obvious one. How much of a gap you need depends on your loan size — a larger balance justifies a refinance on a smaller rate improvement, because the monthly savings are bigger relative to fixed closing costs.

**You are paying FHA mortgage insurance and have built equity.** This one gets overlooked constantly. If you bought with FHA, you are likely paying mortgage insurance for the life of that loan. Refinancing into a conventional loan once you have enough equity can drop it entirely — and that saving is real even if your interest rate barely improves.

**You need to get out of an adjustable rate or a balloon.** Certainty has value. If your loan is about to adjust, do not wait to find out where it lands.

**You want to use equity deliberately.** A cash-out refinance to consolidate high-interest debt or fund a real improvement can be smart. The word doing the work there is *deliberately* — you are converting unsecured debt into debt secured by your house, and that deserves a clear-eyed conversation.

## Three reasons to leave it alone

**You are moving soon.** If a job change or a growing family is likely within a couple of years, the break-even math almost never works.

**You would be restarting a loan you have been paying down for years.** Going back to a fresh thirty-year term lowers the payment but can raise what you pay over time. Sometimes the right answer is a shorter term instead — a payment that stays similar while the payoff date moves years closer.

**You are chasing a number rather than solving a problem.** "Rates dropped a little" is not a reason by itself. What is the actual problem you are trying to solve?

## What has changed for ${c.city} homeowners

${L.market}

${L.quirk}

Here is the local angle people miss: if your escrow has climbed since you bought — and around here it very often has — your payment went up even though your rate never changed. Refinancing does not fix a tax or insurance increase. Do not let anyone sell you a refinance as the solution to an escrow problem, because it is not one.

What can help is shopping your homeowners insurance${
    L.quirk.includes("nsurance") || L.quirk2.includes("nsurance")
      ? " — which in our market is worth doing every single year, because the spread between carriers has gotten wide"
      : ", reviewing your assessment, and making sure any exemptions you qualify for are actually applied"
  }.

## The equity conversation

A lot of ${c.city} homeowners have more equity than they realize, especially anyone who bought before the last run-up. That opens options beyond a straight refinance:

- **A home equity line** leaves your first mortgage alone, which matters enormously if your existing rate is one you will never see again. For most homeowners in that situation, this is the better tool.
- **A cash-out refinance** replaces the whole loan. It makes sense when your current rate is not worth protecting, or when you need a larger amount at a fixed rate.
- **Doing nothing** is a legitimate strategy. Equity is not idle money — it is the reason a hard year does not become a catastrophe.

If your existing rate is low, I will usually steer you away from touching the first mortgage. Protecting a good rate is worth more than the convenience of one loan payment.

## What the process looks like

A refinance is simpler than a purchase — no seller, no agents, no inspection contingency, no moving truck. Expect an appraisal in most cases, a fresh look at income and credit, and a few weeks from application to closing. There is a mandatory rescission period on a primary residence refinance, which means a few days after signing before the funds move.

You will need current pay stubs, recent tax returns, your mortgage statement, your homeowners insurance declaration page, and your most recent tax bill.

## Questions I get

**Can I skip a payment?** Sort of, and it is not free money. The way a refinance closes often means you skip a month, but the interest is accounted for. Nobody is giving you a month.

**Will I lose my escrow account?** Your existing escrow balance gets refunded after your old loan pays off, and you set up a new escrow account with the new loan. Watch the timing so both accounts do not surprise you in the same month.

**How often can I refinance?** There is no legal limit. There is a practical one — each round has closing costs, and each round restarts the break-even clock.

**Does a refinance hurt my credit?** A small, temporary effect from the inquiry and the new account. Nothing that should drive the decision.

## My honest offer

Send me your current mortgage statement and I will run the break-even math and tell you plainly whether it is worth doing. About half the time I tell people to wait. That is not me being coy — it is what the numbers say, and I would rather be the person you call in eight months when it does make sense.

${L.season}

If you want that five-minute answer, reach out. No obligation, and no sales pitch if the math is not there.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 6. What Actually Moves Your Mortgage Rate
// ---------------------------------------------------------------------------

export function whatMovesYourRate(c: Ctx): string {
  const { L } = c;
  return `Every week someone sends me a screenshot of a rate they saw advertised and asks why I did not quote them that. It is a fair question, and the answer is genuinely useful: the rate in an ad is a rate for a specific person, on a specific property, with a specific file. Almost never yours.

So let me open the hood. Here is what actually determines the rate you are offered, roughly in order of how much control you have over it.

## What you control

**Your credit score.** This is the biggest lever you personally hold. Pricing improves in tiers, and the jumps between tiers are not subtle. A buyer sitting just below a threshold is leaving money on the table every month for as long as they own the home. The good news: if you are close, targeted moves over thirty to sixty days can get you across. I will tell you exactly which ones.

**Your down payment.** More equity means less risk to the lender, and pricing reflects it. The thresholds matter more than the exact percentage — crossing one changes your pricing, while a little extra in between mostly does not.

**Your debt-to-income ratio.** A stretched ratio can affect pricing and, at the extreme, whether the loan works at all.

**The loan type and term.** A shorter term generally prices better than a longer one. Government-backed loans price differently from conventional, and VA prices well for those who qualify.

**Points.** You can pay money upfront to lower your rate. Whether that is smart is the same break-even question as a refinance: how long until the savings exceed the cost, and will you still be in the loan then?

## What you partly control

**The property type.** A single-family primary residence is the baseline. A condo, a multi-unit, an investment property or a second home each price differently — sometimes substantially. ${
    L.quirk2.includes("HOA") || L.quirk2.includes("condo")
      ? `Around ${c.city} this comes up often, and it belongs in the conversation before you fall for a specific building.`
      : `It is worth knowing before you decide what kind of property to shop for.`
  }

**Your loan amount.** Very small loans and loans above the conforming limit both carry their own pricing. ${
    L.jumboNormal
      ? `In our market, crossing into jumbo territory is routine rather than exotic, and jumbo pricing follows its own logic — sometimes better than conforming, sometimes worse, depending on the week and your reserves.`
      : `At our typical ${c.city} price points, most buyers sit comfortably inside conforming limits.`
  }

**Timing your lock.** Once you are under contract, you choose when to lock. Longer lock periods cost slightly more. Floating can help you or hurt you, and I will give you my honest read rather than a prediction I cannot back up.

## What nobody controls

Here is the part that surprises people: your mortgage rate is not set by the Federal Reserve. The Fed sets a short-term rate that influences credit cards, auto loans and home equity lines. Thirty-year mortgage pricing tracks the bond market — specifically the demand for mortgage-backed securities — and that market moves on inflation data, employment reports, and investors' expectations about the future.

Which is why you will sometimes see the Fed cut and mortgage rates rise the same week. It is not a conspiracy and it is not a mistake. They are different instruments responding to different things. Bond investors price in expectations ahead of the announcement; by the time the news is official, the move already happened.

The practical upshot: nobody knows where rates go next. Anyone who tells you otherwise is selling something. What we can do is make sure your file is strong enough to get the best available version of whatever the market is offering when you are ready.

## The spread between two buyers

Take two ${c.city} buyers looking at the same house in ${list(L.hoods, 1)}, same price, same month. One has excellent credit, meaningful savings and no other debt. The other has a fair score, a smaller down payment and a car loan.

They will be quoted noticeably different rates. Not because one is a better person, but because the loan carries different risk. Over the life of the loan the difference is not trivial — it is the reason I care so much about file preparation before you shop, rather than after you are under contract.

## How to actually get the best rate available to you

1. **Check your credit early** — three to six months before you buy, not the week you start touring homes. Errors take time to correct, and they are more common than you would hope.
2. **Stop opening new accounts.** Every new card or car loan resets part of the picture.
3. **Keep balances low** relative to limits. This moves scores faster than almost anything else.
4. **Document your income cleanly.** Bonus, commission and self-employment income all have rules about how they are counted; how your file is presented matters.
5. **Shop lenders in a short window.** Mortgage inquiries within a compressed period count as one for scoring purposes. Shop deliberately, not casually over six months.
6. **Compare the whole offer, not just the rate.** Fees, points and the lock period all change the real cost. A rate that looks better with three points attached usually is not.

## The advertised-rate trap

When you see a rate in an ad, look for what comes with it: a large down payment, an excellent score, a shortened term, discount points baked in, or an owner-occupied single-family assumption. It is a real rate for a real scenario. It just may not be yours.

${L.market}

## Where I come in

I will pull your credit, look at the actual file, and tell you where you sit and what would move you into better pricing. If waiting sixty days and fixing two things saves you money every month for the next decade, that is worth knowing before you write an offer — not after.

Reach out whenever you want that read. It costs nothing, and it is the same conversation whether you buy next month or next year.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 7. The {City} Home-Buying Timeline, Step by Step
// ---------------------------------------------------------------------------

export function homeBuyingTimeline(c: Ctx): string {
  const { L } = c;
  return `Most of the stress in buying a home comes from not knowing what happens next. The process is genuinely manageable once you can see the whole shape of it, so here is the ${c.city} timeline the way it actually runs — with the places things slow down, and what you can do about each one.

## Weeks before you start: get your file ready

This is the stage everybody skips and the one that determines how the rest goes.

Pull your credit and look at it properly. Gather two years of tax returns, recent pay stubs, and two months of statements for every account holding your down payment. Stop opening new credit. Leave large deposits alone or be ready to document where they came from.

If you do nothing else: **do not buy a car right now.** I have watched a car payment taken on three weeks before closing sink an approved file. It is the single most common self-inflicted wound in this business.

## Step 1: Pre-approval (a few days)

Not a prequalification — a real pre-approval, where I review your income, credit and assets and issue a letter you can write an offer behind.

With documents in hand this takes days. Without them, it takes as long as it takes you to find them. You will come out with a number, a payment estimate, and a clear sense of what you are shopping for.

## Step 2: House hunting (the unpredictable part)

This is the stage with no fixed length. Some clients find it in a weekend; others look for months. ${L.season}

Shop below your maximum. Look at the total payment, not the list price — ${
    L.quirk.includes("tax") || L.quirk.includes("Tax")
      ? "two houses at the same price can carry very different tax bills around here"
      : "two houses at the same price can carry very different monthly costs around here"
  }, and I would rather you learn that before you are attached.

${L.market}

## Step 3: The offer and acceptance

Your agent writes the offer; my pre-approval letter goes with it. In a competitive situation, the strength of that letter and the responsiveness of your lender genuinely matter — listing agents call to check, and I answer.

Once accepted, the clock starts on everything else.

## Step 4: Inspection (first week or so)

You hire the inspector. Go to the inspection if you possibly can — an hour walking the house with a professional teaches you more than the report will.

${L.quirk}

Inspection findings are negotiable. Repairs, credits, price adjustments: all normal. This is also your last comfortable exit if something serious turns up.

## Step 5: Appraisal (roughly one to two weeks in)

The lender orders an appraisal to confirm the home supports the loan amount. Most come in fine. When one comes in low, the options are renegotiating the price, bringing more cash, disputing with better comparable sales, or walking away if your contract protects you.

## Step 6: Underwriting (the middle stretch)

Your file goes to an underwriter who verifies everything. Expect follow-up questions — a letter explaining a deposit, an updated pay stub, clarification on an address from six years ago. These requests are routine and not a sign of trouble.

**Answer them the same day.** Nearly every delayed closing I have seen traces back to documents sitting in somebody's inbox.

## Step 7: Clear to close, and the final days

Once underwriting signs off, you get your Closing Disclosure at least three business days before closing. Read it. Compare it to the Loan Estimate from the start. Ask me about anything that changed.

In that window: do not move money between accounts, do not change jobs if you can avoid it, and do not buy furniture on credit. Your file gets re-verified right before funding.

${
    L.quirk2.includes("occupancy permit") || L.quirk2.includes("Title V") || L.quirk2.includes("exemption") || L.quirk2.includes("uncap")
      ? `One local item for your calendar: ${L.quirk2.charAt(0).toLowerCase()}${L.quirk2.slice(1)}`
      : L.quirk2
  }

## Step 8: Closing day

You will sign more paper than seems reasonable. Bring your ID and your wired funds — arranged in advance, and **verify wire instructions by phone using a number you already have.** Wire fraud in real estate is real, sophisticated, and devastating. Never trust wire instructions that arrive by email without calling to confirm.

Then you get keys.

## Where the timeline actually slips

In my experience, in this order:

1. **Slow document responses.** Entirely in your control.
2. **Appraisal scheduling** in busy stretches.
3. **Inspection renegotiation** dragging on.
4. **Title issues** — an old lien, an unclear survey, a probate wrinkle. Rare, but they take time.
5. **Buyer-caused credit changes.** See: the car.

## Questions about the process

**Can I close faster?** Sometimes, if your file is clean and every party moves quickly. Ask before you promise a seller a short timeline.

**What if I lose my job mid-process?** Tell me immediately. Hiding it is far worse — employment gets re-verified before funding, and finding out then is the worst possible version of that conversation.

**Can I back out?** Depending on your contingencies, yes, though you may risk earnest money. Your agent will walk you through exactly what you are protected on.

**When do I get my rate locked?** Typically once you are under contract. We will talk through timing.

## What I do through all of this

I keep the parts you cannot see moving: ordering the appraisal, pushing underwriting, coordinating with title and your agent, and telling you what is happening before you have to ask. You get me on the phone, not a queue.

If you are somewhere on this timeline right now — or thinking about starting it — reach out. I will tell you exactly what the next step looks like for your situation.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 8. Jumbo Loans in {City}
// ---------------------------------------------------------------------------

export function jumboLoans(c: Ctx): string {
  const { L } = c;
  return `A jumbo loan is simply a mortgage larger than the conforming limit for your county — the ceiling on what Fannie Mae and Freddie Mac will buy. Above that line, the loan stays with the lender or gets sold into a different market, and the rules change.

${
    L.jumboNormal
      ? `Around ${c.city}, this is not an exotic conversation. Plenty of perfectly ordinary houses in ${list(L.upmarket, 2)} sit above the limit, and buyers are often surprised to learn the home they consider modest requires jumbo financing.`
      : `Around ${c.city}, most purchases sit comfortably below the limit — but buyers moving up to ${list(L.upmarket, 2)}, or relocating from a more expensive market, cross the line more often than they expect.`
  }

Here is what changes above that line, and how to prepare for it.

## What is actually different

**Reserves matter more than anything.** This is the biggest shift from conforming lending. Jumbo underwriting wants to see months of payments still sitting in your accounts after closing. Retirement accounts often count at a discount. Buyers who spend everything on the down payment are the ones who struggle, even with strong income.

**Credit standards are higher.** The score thresholds are tighter and the tolerance for recent blemishes is lower.

**Debt-to-income ratios are tighter.** Less room to stretch than an FHA or even a conventional file allows.

**Documentation is heavier.** Expect full tax returns, verification of every asset account, and questions about the source of large deposits. If you are self-employed, expect two full years of returns plus business documentation.

**Appraisal requirements can be stricter.** Some lenders want two appraisals above certain loan amounts. Unique or very high-end properties take longer to appraise well, because genuine comparable sales are scarcer.

## What is not different

Jumbo does not automatically mean a worse rate. Depending on the week and the lender, jumbo pricing is sometimes better than conforming. Lenders compete hard for these borrowers, because a jumbo client is usually a strong client with other business.

Nor does jumbo require twenty percent down universally. Lower down payment jumbo programs exist for strong files — the trade-off is steeper reserve and credit requirements.

## The ${c.city} picture

${L.market}

${L.quirk}

${
    L.jumboNormal
      ? `One structural note specific to higher-priced buyers here: the gap between the conforming limit and your purchase price determines your options. Sometimes the smartest structure is a conforming first mortgage plus a second, rather than a single jumbo — it depends on pricing that week, and it is worth pricing both.`
      : `If you are only slightly above the limit, there is often a choice: a jumbo loan, or a conforming first with a second mortgage covering the gap. The right answer changes with pricing, and I price both before recommending either.`
  }

## How to prepare, starting now

- **Season your assets.** Move money into the account you will draw from at least a couple of months before applying, and leave it there. Transfers on the eve of underwriting create work and delay.
- **Leave reserves alone.** Do not plan a down payment that empties your accounts. Underwriting will notice, and so will your stress level.
- **Keep your tax returns clean and filed on time.** Extensions complicate jumbo files more than they complicate conforming ones.
- **Expect to explain things.** Large deposits, business income, a rental property, equity compensation — all normal, all requiring documentation. Having the story ready makes it painless.
- **Talk to me before you write an offer.** Jumbo pre-approvals take more work up front, which is exactly why a solid one carries weight with a listing agent.

## What underwriting is really asking

It helps to understand the question behind the paperwork. A conforming loan gets sold into a market with standardized rules, so the underwriter is mostly confirming you fit the box. A jumbo loan often stays on the lender's own balance sheet, which means someone at that institution is making a judgment call about you specifically.

That changes what matters. Reserves matter because they answer "what happens if income stops for six months." Clean tax returns matter because they answer "is this income durable." A stable employment history matters more than a high income with a short track record.

It also means the story you tell has weight. A borrower with an unusual but well-documented financial picture — equity compensation, a business sale, income across several entities — will do better with a lender who understands the file than with the cheapest advertised rate. Presentation is not spin; it is making sure the strengths of your position are visible rather than buried.

## The structure decision

Above the conforming limit you usually have more than one way to finance the same house, and the right one is not obvious from the rate alone:

- **A single jumbo loan.** Simplest, one payment, one set of closing costs.
- **A conforming first plus a second mortgage** covering the gap. Sometimes prices better, and it can keep the first loan inside limits that make a later refinance easier.
- **A larger down payment to land just under the limit.** Worth pricing if you are close and have the cash — though not if it drains the reserves the file needs anyway.
- **An adjustable-rate jumbo.** Priced lower than a fixed in many markets, and genuinely sensible if you have a realistic horizon shorter than the fixed period.

I price the relevant ones side by side before recommending anything, because the answer moves with the market and with how long you plan to keep the loan.

## If your income is complicated

Many higher-price buyers do not have a simple two-line pay stub. Equity compensation, bonus and commission structures, partnership income, rental portfolios — these are all workable, but how they are documented and averaged determines your qualifying income.

There are also programs that qualify a borrower on assets rather than employment income, which occasionally solves a file that looks impossible on paper. Those are specialist products with their own trade-offs, and worth a conversation if standard documentation does not reflect your actual financial position.

## Questions higher-price buyers ask

**Is the process slower?** Modestly. More documentation and sometimes a second appraisal. A well-prepared file closes on a normal timeline.

**Can I put less than twenty percent down?** Often yes, with strong credit and reserves. It may mean mortgage insurance or a slightly different structure.

**Does a jumbo loan affect my offer's competitiveness?** A strong jumbo pre-approval from a lender who picks up the phone is competitive. A vague one is not, and listing agents can tell the difference.

**Can I refinance later?** Yes, with the same underwriting standards applied again.

## The short version

Jumbo lending rewards preparation more than any other kind. Strong credit, documented income, and real reserves after closing will get you a good outcome. Trying to stretch on all three at once will not.

If you are shopping ${list(L.upmarket, 2)} or anything above the conforming limit, let us map out your structure before you are under contract and racing a clock. Reach out and I will show you what the options look like side by side.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 9. Getting Pre-Approved
// ---------------------------------------------------------------------------

export function gettingPreApproved(c: Ctx): string {
  const { L } = c;
  return `Before you tour a single house in ${list(L.hoods, 2)}, get pre-approved. Not because I want your application — because touring without one wastes your weekends and, in a competitive situation, costs you the house.

A pre-approval is not a formality. It is the difference between "I think I can afford this" and "here is a lender who reviewed my finances and will fund this purchase." Sellers know the difference. So do listing agents, and they are the ones advising the seller on which offer to take.

## Pre-qualification vs pre-approval

These get used interchangeably and they are not the same thing.

A **pre-qualification** is a conversation. You tell someone your income and debts, they do quick arithmetic, and you get an estimate. No documents, no verification. It is worth roughly what it costs, which is nothing.

A **pre-approval** means a lender has looked at your actual pay stubs, tax returns, bank statements and credit report, and issued a letter based on verified information. It carries weight because somebody put their name on it.

When a listing agent calls me to ask about a buyer's letter — and around here they do call — they can tell within thirty seconds which kind they are holding.

## What I actually look at

**Income.** Pay stubs and W-2s for salaried borrowers. Two years of returns if you are self-employed, commissioned, or have significant variable income. How bonus and overtime get counted depends on consistency and history.

**Assets.** Two months of statements for every account your down payment and closing costs will come from. I need every page. Underwriting will ask for the blank one too, which feels absurd and is nonetheless true.

**Credit.** A full report, not a score from an app. What matters is often what is on it — a collection, a late payment, an account that is not yours — more than the number.

**Debts.** Car loans, student loans, credit card minimums, child support, anything with a monthly obligation.

## What comes out of it

A letter with a purchase price you are approved up to. But the more useful outputs are the two things that letter does not show:

**A payment you have actually seen.** I will show you the monthly cost at a few different price points, with ${c.city} taxes and insurance built in properly rather than guessed at. ${L.quirk}

**A list of anything that needs fixing.** If your credit sits just under a pricing threshold, if a paystub raises a question, if a deposit needs documenting — better to learn it now than during a thirty-day escrow.

## How long it takes

With documents ready, days. Genuinely.

Most of the delay I see is on the front end, waiting for a buyer to track down last year's tax return or get statements from an account they rarely use. Start gathering before you apply and the rest moves quickly.

Pre-approval letters typically stay valid for a couple of months. They are easy to refresh — updated pay stubs and a fresh credit check — so do not panic if your search runs longer than you planned.

## The rules while you are pre-approved

This is where good files go wrong, and it is worth being blunt about:

- **Do not buy a car.** Not before closing. Not the week of. A new payment changes your debt-to-income ratio and your file gets re-verified before funding.
- **Do not open new credit**, including store cards at checkout.
- **Do not close old accounts either** — it can move your score in unhelpful ways.
- **Do not change jobs** if you can avoid it. If you must, tell me first; some changes are fine and some are not, and the difference matters.
- **Do not move large sums between accounts** without telling me where it came from.
- **Do not make large cash deposits.** Cash that cannot be traced to a documented source generally cannot be used.

None of this is permanent. It is a few weeks of financial boredom in exchange for a house.

## Why this matters more in a competitive offer

${L.market}

${L.season}

When multiple offers land on a seller's desk, price is not the only variable. The listing agent is weighing which deal will actually close. A verified pre-approval, a lender who answers the phone, and a clean offer structure can beat a slightly higher bid from a buyer nobody can vouch for. I have seen it happen repeatedly.

## Questions people ask before applying

**Does it cost anything?** No. Not with me.

**Will it hurt my credit?** A small, temporary dip from the inquiry. Multiple mortgage inquiries in a short window count as one, so shopping does not compound the effect.

**What if I am declined?** Then we find out why and build a plan to fix it. Most of the people I decline in spring are buying by the following winter. A "no" with a roadmap is more useful than a vague maybe.

**Can I get pre-approved before I have a house picked out?** That is exactly the point. Do this first.

**What if I am self-employed?** Very doable — it just needs more planning, and how your returns are structured matters enormously.

## Start here

Send me your documents, or just call and I will tell you what to gather. A pre-approval takes a couple of days, costs you nothing, and turns house hunting from guesswork into something you can act on.

And if the review shows you would be better off waiting a few months, I will tell you that plainly. The goal is you in the right house with a payment that still feels fine in year five — not you in any house this quarter.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 10. Down Payment Assistance in {State}
// ---------------------------------------------------------------------------

export function downPaymentAssistance(c: Ctx): string {
  const { L } = c;
  return `The most expensive myth in my business is that you need twenty percent down. It keeps people renting for years while they save toward a number that most buyers never actually reach — and while home prices keep moving.

${c.stateFull} has real down payment assistance, and plenty of buyers who qualify for it never find out. Here is what exists, who it is for, and the fine print that decides whether it is right for you.

## Start with the state

${L.hfa.replace(/^the /, "The ")} runs the primary program here. The core offering is ${L.hfaProgram}, and the assistance comes as ${L.hfaDpa}.

What you need to know before you get attached to the idea:

- **Income limits apply**, varying by county and household size. They are more generous than people assume — these programs serve ordinary working households, not just the lowest incomes.
- **Purchase price limits apply too**, which may shape where you shop.
- **You will need homebuyer education.** A few hours, usually online. Knock it out early.
- **Most assistance is a second lien.** Forgivable after enough time in some versions, repayable on sale or refinance in others. Neither is bad — but know which one you have, because it affects what happens when you move.
- **Funding is not unlimited.** Some programs work in rounds. When the money is committed, the round closes until it is replenished.

## The layers most buyers miss

State programs are the headline. They are rarely the only option.

**County and city programs.** Local governments around ${c.city} run their own assistance, sometimes targeted to specific neighborhoods or price bands. These are genuinely obscure — they do not advertise, and the rules change. Ask me to check what is currently funded in the areas you are shopping.

**Employer assistance.** Hospitals, universities and large employers sometimes offer homebuyer help, especially for purchases near their campuses. Check your benefits portal. I have had clients find thousands of dollars there that they had no idea existed.

**Profession-specific programs.** ${
    L.hfaDpa.includes("PEN") || L.hfaDpa.includes("Heroes") || L.hfaDpa.includes("Brave") || L.hfaDpa.includes("Grads")
      ? "Our state program has tiers for teachers, nurses, first responders, military members and recent graduates — larger assistance amounts for the same purchase. If you are in one of those fields, say so early."
      : "Teachers, first responders, nurses and military members qualify for enhanced terms under a number of programs. If you are in one of those fields, say so early."
  }

**Lender credits and grants.** Some lenders run their own community programs, often tied to specific census tracts. These can be layered on top of state assistance.

**Gift funds.** Not assistance exactly, but worth stating: most loan programs allow a documented family gift for the entire down payment. It needs a proper gift letter and a clean paper trail, so start that conversation early.

## What assistance costs you

Nothing is free, and you should go in clear-eyed.

Assistance programs sometimes come with a slightly higher interest rate on the first mortgage than you would get on a standard loan. Whether that trade is worth it depends on how long you stay: if the assistance gets you into a home years earlier than saving would have, it usually is. If you have the down payment already and are just curious, it usually is not.

There can also be a recapture provision on some programs if you sell within a few years and realize a significant gain. This is less common than people fear, and I will tell you whether it applies to yours.

## Using it in the ${c.city} market

${L.market}

${L.quirk}

Practically, assistance tends to work best on homes in ${list(L.hoods, 3)} — inside the price limits, with enough inventory to actually find something. ${
    L.usda
      ? `And do not overlook USDA financing around the edges of the metro: zero down, with its own income limits, and the eligibility maps reach closer in than most buyers expect.`
      : `Just know that price limits will steer you away from ${list(L.upmarket, 1)}, which is worth understanding before you start touring.`
  }

## The application reality

Assistance adds a layer to the transaction. There is more paperwork, occasionally an extra review step, and a timeline that can run a little longer than a standard loan. Sellers in a hot multiple-offer situation sometimes prefer the simpler file.

None of that should stop you. It just means we plan for it: apply early, complete your education course up front, and write offers with a realistic closing date rather than an aggressive one.

## Questions I get

**Do I have to be a first-time buyer?** For most programs, yes — but remember that means not having owned in three years. ${
    L.hfaProgram.includes("Homes for Iowans") || L.hfaProgram.includes("HOME Plus")
      ? "Our state also has an option open to repeat buyers, which is unusual and useful."
      : "Some local and employer programs have no such requirement at all."
  }

**Can I combine programs?** Sometimes. Layering state assistance with a local grant or employer benefit is possible when the rules allow it. This is exactly the kind of thing worth having someone check properly.

**Does assistance affect my offer's strength?** It can, slightly. A clean pre-approval and a realistic timeline offset most of it.

**What if I do not qualify?** Then we look at low-down-payment conventional, FHA${L.usda ? ", USDA" : ""}, and VA if you served. Twenty percent is still not the requirement.

## What to do this week

Let me check what you qualify for. It takes one conversation, and the programs change often enough that last year's answer may be wrong.

The buyers who miss out on assistance are almost never the ones who did not qualify. They are the ones who assumed they did not and never asked. Do not be that person — reach out and let us find out for certain.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 11. Self-Employed in {City}?
// ---------------------------------------------------------------------------

export function selfEmployed(c: Ctx): string {
  const { L } = c;
  return `If you are self-employed, you have probably heard that getting a mortgage is hard. It is not hard. It is *different* — and the difference catches people off guard because it works backwards from how you have been taught to run your business.

Here is the central tension: your accountant's job is to minimize your taxable income. My job is to document enough income to qualify you. Those two goals point in opposite directions, and the year you plan to buy a house is the year they need to be coordinated.

Let me show you how underwriting actually reads your returns, so you can plan rather than get surprised.

## What counts as your income

Not your revenue. Not your deposits. Not what you take home.

For most self-employed borrowers, qualifying income is based on the **net income on your tax returns**, averaged over two years, with certain deductions added back.

That last part is where people get relief. Depreciation, depletion, business use of home, and amortization are typically added back, because they are paper expenses rather than cash leaving your account. One-time expenses can sometimes be added back with documentation.

But the aggressive equipment write-off, the generous mileage deduction, the meals — those genuinely reduce your qualifying income. Every dollar you deducted is a dollar underwriting does not count.

## The two-year rule, and its exceptions

The standard is two years of self-employment history in the same line of work, documented with filed returns.

There are exceptions. A borrower with a shorter history sometimes qualifies with a strong track record in the same field beforehand — say, someone who spent eight years as a salaried electrician and then went out on their own. The documentation requirements are heavier, but it is workable.

If your income declined year over year, underwriting typically uses the lower figure rather than the average, and will want an explanation. A consistent or rising trend is much easier.

## Plan the year before you buy

This is the single most valuable thing in this article: **talk to me a year before you want to buy, and bring your accountant into the conversation.**

There is a real trade-off between deducting aggressively and qualifying comfortably. If you know you are buying next year, you and your accountant can make an informed decision about that trade for a single tax year, rather than discovering the consequence in the middle of an escrow.

I have had clients save meaningfully on taxes and lose the house they wanted. I have also had clients pay somewhat more tax in one year and get into a ${c.city} home that appreciated well past the difference. Neither outcome is automatically right — but the choice should be deliberate.

## What to expect to provide

- Two years of personal tax returns, complete with every schedule.
- Two years of business returns if you file separately, plus a K-1 for partnership or S-corp income.
- A year-to-date profit and loss statement, sometimes with business bank statements to support it.
- A business license, or a letter from your CPA confirming the business is active.
- Two months of personal bank statements, and often business statements as well.
- An explanation for anything unusual, written plainly.

Underwriting will also check that pulling funds from the business for your down payment does not damage the business. If the down payment comes from a business account, expect questions.

## Alternative documentation, honestly assessed

There are programs that qualify borrowers on bank statement deposits rather than tax returns. They are legitimate and they solve real problems for business owners whose returns genuinely do not reflect their cash flow.

The trade-off is pricing. These loans generally carry higher rates and require larger down payments, because the lender is taking more risk on less verification.

My honest advice: try the conventional path first. If your returns support the loan, take the better pricing. Alternative documentation is a good tool when it is the right tool — not a shortcut to avoid gathering paperwork.

## The ${c.city} context

${L.market}

${L.quirk}

One thing I see often with self-employed buyers here: they are so used to being told no by big institutions that they stop asking. ${list(L.hoods, 3)} is full of people running businesses out of their trucks and their spare bedrooms who assumed homeownership was closed to them. In most cases it simply required planning.

## Questions business owners ask

**I write off almost everything. Am I out of luck?** Not necessarily, but your qualifying income will be lower than your lifestyle suggests. Let me run the actual numbers from your returns before you assume.

**What if I just started my business?** If you were in the same field before, there may be a path. If you started from scratch six months ago, waiting is usually the honest answer.

**Can I use business funds for the down payment?** Often yes, with documentation showing it does not harm the business.

**Does an S-corp salary help?** It can simplify things considerably, since W-2 wages from your own corporation are documented like any other employment income. Worth discussing with your accountant well before you buy.

**My spouse is W-2. Does that help?** Significantly, yes. A combined file with one stable salaried income is much easier to structure.

## Where to start

Send me your last two years of returns and I will tell you what underwriting will actually count. That number is the beginning of every other decision, and knowing it early is worth far more than guessing.

If the answer is that a year of planning puts you in a much better position, I will show you exactly what to change — and then I will be here when you are ready.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// 12. Buying vs Renting in {City}
// ---------------------------------------------------------------------------

export function buyingVsRenting(c: Ctx): string {
  const { L } = c;
  return `I am a mortgage loan officer, so you might expect me to say buying is always better. It is not. For some of the people who call me, renting is genuinely the right answer this year, and I tell them so.

What I do want is for you to make the decision with real numbers instead of the two bad arguments that dominate this conversation — "renting is throwing money away" and "you will never afford a house." Both are slogans. Neither is analysis.

Here is how I would actually think it through for ${c.city} in 2026.

## The comparison people get wrong

Most rent-versus-buy comparisons put rent next to a mortgage payment and declare a winner. That is not the comparison.

Owning costs more per month than the mortgage payment alone:

- Property taxes and homeowners insurance, collected in escrow.
- Mortgage insurance if your down payment is under twenty percent.
- Maintenance — a real, recurring number, larger on older homes.
- The occasional large item: a roof, a furnace, a water heater. They arrive whether or not you budgeted.
- HOA dues, where applicable.

${L.quirk}

Against all that, owning builds equity in two ways: the loan balance falls every month, and the home may appreciate. Renting builds neither — but renting also has no closing costs, no maintenance, and no exposure if values fall.

## The number that decides it: how long you will stay

Buying carries transaction costs on both ends. Closing costs going in, and selling costs going out. Those have to be overcome by equity and appreciation before you come out ahead.

Which is why my honest rule is simple: **if you are confident you will be in ${c.city} for at least five years, buying usually wins. Under three, renting usually does.** In between, it depends on the specific deal.

Anyone who tells you buying is always better is not accounting for the cost of selling.

## Where ${c.city} sits right now

${L.market}

${L.season}

${
    L.quirk2.includes("nsurance") || L.quirk.includes("nsurance")
      ? `The local variable I would watch closest is the cost of insuring the home, which has moved more than rates in recent years. Get a real quote on a specific address before you decide what you can afford — an estimate will not do.`
      : `The local variable most buyers underestimate is the tax and escrow side of the payment, which can differ meaningfully between two houses at the same price. Always compare the full monthly cost, not the list price.`
  }

## The case for renting a while longer

I would tell you to keep renting if:

- Your job or your city might change within a couple of years.
- You have high-interest debt that is costing you more than a mortgage would.
- You have no reserves. Buying with nothing left over is how a broken furnace becomes a crisis.
- Your credit is close to a better pricing tier and a few months of work would move you there.
- The only homes in your budget are ones you would resent living in. A house you dislike is not an investment; it is a house you dislike.

There is no shame in any of this. Renting while you fix one specific thing is a plan, not a failure.

## The case for buying now

I would tell you to buy if:

- You are staying put for the foreseeable future.
- Your payment at your target price would be comparable to or modestly above your rent — and comfortable either way.
- You have the down payment plus a few months of reserves left over.
- Your credit and debt are in reasonable shape.
- You want the control. Not everything is financial: painting a wall, keeping a dog, and never getting a renewal letter with a higher number have real value that no spreadsheet captures.

## A fair way to run your own numbers

1. Get an actual pre-approval so you know your real price range rather than a guess.
2. Pick two or three specific listings in ${list(L.hoods, 2)} and get the **full** monthly cost for each — payment, taxes, insurance, mortgage insurance, HOA.
3. Add a realistic monthly maintenance figure. Older home, bigger number.
4. Compare that total to your rent — including what your rent will likely be in three years, not just today.
5. Ask how confident you are about staying five years.

If owning costs somewhat more per month but you are staying and you have reserves, the equity usually makes up the difference. If owning costs dramatically more and you are unsure about staying, rent and revisit next year.

## Questions worth sitting with

**Will prices drop if I wait?** Nobody knows, and anyone who says they do is guessing. What I can tell you is that trying to time the market keeps more people renting than any other single factor.

**What about rates?** They move. If they fall meaningfully after you buy, refinancing exists. You cannot refinance a purchase price you never locked in.

**Is a starter home a waste?** Not at all. Most of my long-term clients started with something modest in ${list(L.hoods, 1)} and moved up using the equity.

## How I would help

Let me run your real numbers, both sides. If the honest answer is to keep renting for now, I will tell you and give you a specific list of what to work on. If the numbers say buy, you will know exactly what you can carry.

Either way you will be deciding with facts instead of slogans — and that is worth a short conversation whichever way it lands.${signoff(c)}`;
}
