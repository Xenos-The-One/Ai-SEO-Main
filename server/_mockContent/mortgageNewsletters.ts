/**
 * Monthly "Mortgage Minute" newsletter bodies for the loan-officer demo clients (#31-45).
 *
 * One per month of the engagement (July / August / September 2026), each rendered through the
 * client's locale so the market talk is about their metro. Same house rules as the blog library:
 * no rate quotes, no invented figures, no pressure.
 */
import type { Ctx } from "./mortgageBlogs";
import { list } from "./mortgageBlogs";

const signoff = (c: Ctx) => `\n\nTalk soon,\n${c.name}\n${c.company}`;

// ---------------------------------------------------------------------------
// July — mid-summer market, rate-lock thinking, documents
// ---------------------------------------------------------------------------

export function julyMinute(c: Ctx): string {
  const { L } = c;
  return `Hi there,

Welcome to the ${c.city} Mortgage Minute for July. Two minutes, no jargon, no hype — just what I am actually seeing on files crossing my desk this month.

## Where the market sits

Summer in ${c.city} has behaved about how I expected. Homes priced correctly still move, homes priced on hope sit and then reduce, and the gap between those two outcomes is wider than it was a couple of years ago. That is a healthier market than the one where everything sold in a weekend, even though it feels slower.

${L.market}

The practical read for you: sellers are negotiating again. Not on everything, and not desperately — but repair requests, closing cost help and rate buy-downs are all back on the table in a way they were not recently.

## If you are buying

The buyers doing well right now share one trait: they were ready before they fell in love with a house. Pre-approval done, documents gathered, price range honest.

Two things worth knowing this month:

**Ask about a seller-paid buy-down.** On a home that has been sitting, a seller is often more willing to contribute toward lowering your rate for the first years of the loan than to cut the price further. It can do more for your monthly payment than an equivalent price reduction — worth running both ways before you counter.

**Watch the full payment, not the sticker.** ${L.quirk}

## If you already own

Two things I would check this month.

First, your homeowners insurance. Premiums have moved a lot, and loyalty is not being rewarded — the spread between carriers on the same house has gotten wide enough that an hour of shopping is genuinely worth it. Your escrow will adjust accordingly.

Second, whether you are still paying mortgage insurance you no longer need. If you bought with a conventional loan and have built equity — through payments, appreciation, or an improvement you made — it may be removable. That is a phone call, not a refinance. I will happily tell you whether you are close.

## The document habit that saves weeks

Almost every delayed closing I have seen this year traced back to the same thing: a document request sitting in somebody's inbox for three days.

If you are thinking about buying this fall, do this now, before you need it:

- Save your last two pay stubs and last two years of W-2s to one folder.
- Download the last two months of statements for every account — every page, including the blank last page.
- If you are self-employed, pull two full years of returns with all schedules.
- Leave large deposits alone, or write down where each one came from.

Twenty minutes today removes the most common source of closing-week stress.

## One question I answered a lot this month

*"Should I wait for rates to drop before I buy?"*

My honest answer has not changed. Nobody knows where rates go, including the people who sound most confident about it. What I do know is that a lower rate on a higher price is not automatically a better deal, that you can refinance a rate and cannot refinance a purchase price, and that the buyers who have waited the longest for a perfect moment are generally the ones who have gained the least.

If the payment works for you today and you are staying put for years, the timing conversation matters less than people think. If the payment does not work, no rate movement is going to fix that — and I will say so.

## Here when you need me

If you want a straight answer about what you would qualify for, whether a refinance pencils out, or just what a specific house would actually cost you monthly, reply to this email. I answer every one personally, and there is never any pressure attached.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// August — end-of-summer inventory, credit prep, fall planning
// ---------------------------------------------------------------------------

export function augustMinute(c: Ctx): string {
  const { L } = c;
  return `Hi there,

Here is your ${c.city} Mortgage Minute for August. Short as always, and worth the two minutes if you are thinking about a move in the next year.

## What August looks like locally

Late summer has a rhythm here. Families who wanted to be settled before school started are done, which pulls a chunk of buyers out of the market right as the listings that did not sell in June are getting realistic about price.

${L.season}

That combination is why I like late summer and fall for the buyers I work with. Less competition, more negotiating room, and sellers who have been through one or two price reductions and are ready to make a deal work.

## If you are buying this fall

Start now rather than in October. The gap between "I am thinking about it" and "I can write an offer this weekend" is about a week of preparation, and that week is the whole difference when the right house appears.

What I would do in the next fourteen days:

- **Get pre-approved properly.** Not an online estimate — a real review of income, credit and assets.
- **Pull your credit and look at it.** Errors are more common than people expect, and disputes take time. If you are just under a pricing tier, there are usually two or three targeted moves that get you across.
- **Decide your honest number**, not your maximum. The approval tells you the ceiling; your life tells you the right answer.
- **Leave your credit alone** after that. No new cards, no car, no financed furniture.

${
    L.usda
      ? `One local note: parts of our area qualify for USDA financing, which is a genuine zero-down option with its own income limits. It is worth checking the map before you assume you need a down payment at all.`
      : `One local note: if you served, a VA loan remains the strongest product available — no down payment and no monthly mortgage insurance. Tell me before we discuss anything else.`
  }

## If you already own

This is a good month to look at your escrow statement rather than filing it.

${L.quirk}

If your payment went up and you were not expecting it, that is almost always taxes or insurance rather than your rate. A refinance does not fix that — but shopping insurance, checking that every exemption you qualify for is actually applied, and reviewing your assessment sometimes does. Happy to look at it with you.

For anyone sitting on a rate they will never see again: protect it. If you need access to equity, a line of credit that leaves your first mortgage untouched is usually the smarter structure. I would rather you keep that rate than consolidate for convenience.

## The mistake I talked three clients out of this month

Buying a car during escrow.

I know how it happens — the lease is up, the timing seems fine, the dealer says it will not matter. It matters. Your file gets re-verified before funding, and a new monthly payment can change your debt-to-income ratio enough to jeopardize the approval days before closing.

Wait until you have keys. Then buy the car.

## Looking toward the fall

If a move is on your horizon for later this year or early next, the most useful thing you can do is have a conversation now, while nothing is urgent. We can look at where your credit sits, what your realistic price range is, and what — if anything — would put you in a stronger position by the time you are ready.

No timeline required, no pressure. Just reply to this email and tell me roughly what you are thinking. I answer every message myself.${signoff(c)}`;
}

// ---------------------------------------------------------------------------
// September — fall market, refinance checks, year-end planning
// ---------------------------------------------------------------------------

export function septemberMinute(c: Ctx): string {
  const { L } = c;
  return `Hi there,

Your ${c.city} Mortgage Minute for September. The fall market is opening up, and this is the stretch of the year I most like for prepared buyers.

## The fall setup

September resets the market. The summer rush is over, the listings still standing have usually had at least one price adjustment, and the sellers behind them are motivated in a way they were not in May.

${L.market}

Add the fact that fewer buyers are looking between now and the new year, and you get the least crowded window of the year. ${L.season}

## If you are buying

Three things worth doing this month:

**Look at homes that have been sitting.** Days on market is leverage. A house that has been listed for a while, especially one that has already reduced, is where seller-paid closing costs and rate buy-downs actually get agreed to.

**Get the full payment on any house you are serious about.** Not the mortgage payment — the whole thing. ${L.quirk} I will run the real number on any specific address you send me, usually the same day.

**Make sure your pre-approval is current.** They age out. If yours is from the spring, a quick refresh with updated pay stubs keeps you ready to write an offer the day you find the house.

## If you already own

Two checks, both quick.

**The refinance question.** If you bought when rates were at their highest, it is worth five minutes of math. The rule I use: total cost of the refinance divided by monthly savings equals your break-even in months. Stay longer than that and it works; move sooner and it does not. Send me your current mortgage statement and I will run it — and I will tell you honestly when the answer is to wait, which is often.

**Mortgage insurance.** If you have a conventional loan and have built enough equity, it may be removable without refinancing anything. People carry this for years past the point they need to. ${
    L.quirk2.includes("uncap") || L.quirk2.includes("exemption")
      ? `While you are at it: ${L.quirk2.charAt(0).toLowerCase()}${L.quirk2.slice(1)}`
      : `It costs nothing to ask.`
  }

## Planning for next year

If a move is on the calendar for next spring, the work that matters happens now.

Credit takes time to improve. Documentation takes time to organize. Self-employed buyers especially should be talking to me *and* their accountant before the year closes out, because how this year's return is structured directly determines what income underwriting will count next spring. That is a decision worth making on purpose rather than discovering in March.

The clients who have the easiest transactions are almost always the ones who started the conversation six months before they needed anything.

## What I am telling people this month

The same thing I have told people all year: buy the payment you can carry comfortably, not the maximum you are approved for. Keep reserves after closing. Do not try to time a market nobody can predict.

Boring advice. It is also why my clients still like their houses years later.

## Let's talk

Whether you are shopping ${list(L.hoods, 2)} this fall, wondering whether a refinance makes sense, or just want a candid read on your situation, reply to this email. It is a real conversation with me, not a call center, and there is never an obligation attached.${signoff(c)}`;
}
