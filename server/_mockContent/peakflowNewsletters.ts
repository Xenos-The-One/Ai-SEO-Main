/**
 * Newsletter bodies for the Peakflow SaaS demo client (#5).
 *
 * Two formats: "Peakflow Monthly", a product-and-practice digest, and "New in Peakflow", a single
 * feature announcement. Voice is the same as the blog library - first-person plural, practical,
 * no superlatives - and each one carries at least one idea worth reading even if the reader never
 * touches the feature.
 */

const SIGNOFF = "\n\nThanks for building with us,\nThe Peakflow Team";

// ---------------------------------------------------------------------------
// Peakflow Monthly
// ---------------------------------------------------------------------------

export function monthlyFebruary(): string {
  return `Hi there,

Welcome to the February edition of Peakflow Monthly — what shipped, one habit worth stealing, and what we are working on next. Two minutes, as always.

## What shipped

**Async approvals** are live in every workspace. Reviewers can now approve or leave a comment directly on the item, without a meeting and without an email thread that nobody can find later. The approval is timestamped and stays attached to the work, which turns out to matter most about three months after the fact when someone asks who signed off on what.

We also cleared a batch of smaller annoyances you reported: keyboard navigation on boards, a date-picker bug on Safari, and notification settings that were, frankly, confusing. The full list lives under **What's New** in the app.

## One habit to steal

If you try one thing this month, make it a **thirty-minute weekly review** on the same day every week.

Pull up everything in flight. Confirm each item still has an owner and a realistic date. Ask what is blocked and who is chasing it. That is the entire agenda.

It sounds too simple to matter. It is consistently the highest-leverage habit we see, because projects do not fail in one dramatic moment — they drift a day at a time until the drift is a month. A weekly check catches drift while it is still a nudge instead of a rescue.

The rule that makes it work: the board must be current *before* the meeting. If the first fifteen minutes are spent updating statuses, you are running a data entry session with an audience.

## From the teams we talk to

A six-person product team told us they had cut their standing meeting load roughly in half by replacing three status meetings with one written update and one weekly review.

Their takeaway was not "meetings are bad." It was that most of their meetings were transmitting information, which writing does better — and that protecting the two genuinely collaborative meetings became much easier once the status ones were gone.

## A question we got a lot this month

*"How many things should we have in progress at once?"*

Fewer than you do now, almost certainly. The intuition that starting more work gets more done is wrong in a way that compounds — every item in flight carries a switching cost, and each additional concurrent item slows all the others.

The experiment costs nothing: agree as a team not to start anything new until something finishes. Most teams who try it find things finishing noticeably faster within a few weeks, without anyone working harder. The work simply stops queueing inside people's heads.

If you want a number to watch, count the items in progress per person. If it is more than two, that is where your cycle time is going.

## What we are working on

Faster boards. Some of you are running boards with a great many items and telling us, politely, that they feel sluggish. That is fair and we are fixing it properly rather than papering over it.

## One ask

What is the single thing that most slows your team down right now? Not about Peakflow necessarily — about how your work moves.

Reply to this email. A real person reads every response, and these replies genuinely shape what we build.${SIGNOFF}`;
}

export function monthlyMarch(): string {
  return `Hi there,

March's Peakflow Monthly. Shorter than usual, because the main news speaks for itself.

## What shipped

**Boards are substantially faster.** If you run large boards, you should notice it immediately — switching between projects, filtering, and loading a board with a lot of items are all meaningfully quicker.

This was not a glamorous project. It was several weeks of unglamorous work on how we load and render data, prompted entirely by people telling us it was slow. We would rather spend a month on that than ship something new on top of a foundation that irritates you daily.

Also shipped: bulk editing on selected items, and a fix for the recurring-task edge case a few of you hit at month boundaries.

## One habit to steal

**Cut your work in progress.**

The intuition that starting more things gets more done is wrong, and it is wrong in a way that compounds. Every item in flight carries a switching cost, and each additional concurrent item slows everything else down.

Try this for two weeks: agree as a team not to start anything new until something finishes. No new tool, no new process, no cost at all.

Most teams that do this see things finishing noticeably faster within a few weeks — not because anyone worked harder, but because the work stopped queueing inside people's heads.

## From the teams we talk to

An agency told us the most useful change they made last quarter was making "waiting on client" a visible status that the client could also see.

Internally it meant that work stopped occupying anyone's mental foreground. Externally it meant that when a client asked why something was late, the answer was a dated record rather than a disagreement about who said what. They described the effect on their client conversations as "immediate."

## A small thing worth fixing this week

Look at your board and find anything that has been sitting in the same column for more than two weeks.

There will be some. In most teams they fall into three categories: work that is actually blocked but not marked as blocked, work that nobody owns despite having a name on it, and work that everyone has quietly agreed is not happening but nobody has deleted.

All three are worth resolving today. The first needs a named person and an ask. The second needs a real owner or a decision to drop it. The third just needs deleting — an item nobody intends to do is a small tax on everyone's attention every time they scan the board.

Ten minutes, and the board becomes something people trust again.

## What we are working on

Reporting for agencies — specifically, a view that answers "what is due this week across every client" without anyone building it by hand. That is the question we hear most from teams juggling multiple engagements, and it is next.

## One ask

If you run client work: what is the report you currently build manually? Reply and tell us. We would like to make that one unnecessary.${SIGNOFF}`;
}

export function monthlyApril(): string {
  return `Hi there,

April's edition. A significant one for anyone running client work.

## What shipped

**The agency reporting view** is live. One screen showing what is due this week across every client, what is waiting on someone external, and who is over capacity.

That combination is deliberate. Those are the three questions that cannot be answered from any single project — the conflict that hurts you is always cross-project, and no individual project board will ever show you that two clients' delivery weeks land on the same designer.

It generates itself from the work you are already tracking. Nothing to assemble, nothing to maintain.

## One habit to steal

**Plan to real capacity, not theoretical capacity.**

A full-time person does not have forty hours of project work in a week. Subtract meetings, admin, support, and the standing tax of interruptions, and the real number is often closer to twenty-five or thirty. Senior people with management duties have less.

Nearly every failed plan we have seen traces back to this — a plan built for a team that does not exist. Plan to about seventy-five percent of real availability and the rest of the quarter becomes possible rather than aspirational.

Teams that plan to a hundred percent do not hit a hundred percent. They hit sixty and feel like they failed.

## From the teams we talk to

A studio ran the exercise of comparing hours against fees for each client last quarter. They found what most agencies find: their most prestigious client was their least profitable, and a quiet, undemanding one was carrying the quarter.

That did not lead to dropping anyone. It led to a pricing conversation that should have happened a year earlier. You cannot fix what you cannot see.

## The mistake we see most in capacity planning

Related to the habit above, and worth its own paragraph: teams plan for the work they intend to do and not for the work that reliably arrives anyway.

Support requests, escalations, the urgent thing from another team, rework on something that was supposedly finished. In most teams this consumes somewhere between a fifth and a third of capacity, every single cycle — and almost nobody accounts for it in the plan.

The result is predictable. The plan assumes a team with no interruptions, the interruptions arrive as usual, and everyone treats the overrun as a surprise for the fourth quarter running.

The fix is not discipline. It is subtracting the unplanned work from capacity before you plan, based on what actually happened the last three cycles. If you are not tracking it, start — one tag on unplanned items is enough to find the number.

## What we are working on

Custom dashboards — so the specific three or four numbers your team steers by are on one screen, rather than the twenty we think you might want.

## One ask

Which numbers does your team actually make decisions from? Not the ones you feel you should track — the ones you genuinely look at. Reply and tell us; it is shaping what we build next.${SIGNOFF}`;
}

export function monthlyMay(): string {
  return `Hi there,

May's Peakflow Monthly.

## What shipped

**Custom dashboards.** Pick the handful of numbers your team steers by and put them on one screen — cycle time, work in progress, what is blocked, milestone variance, whatever matters for how you work.

A deliberate design note: we made it easy to build a small dashboard and slightly awkward to build an enormous one. A dashboard with twenty metrics is decoration, because nobody acts on twenty numbers. If we had to pick four for a delivery team, we would take work in progress, cycle time, blocked items with age, and milestone variance.

## One habit to steal

**Measure the gap between lead time and cycle time.**

Cycle time is how long work takes once it starts. Lead time is how long from the request arriving to delivery. The gap between them is queue time, and in most teams it is much larger than anyone expects.

Why it matters: if a request takes three days of work but is delivered five weeks after it was made, speeding up the three days is nearly pointless. The opportunity is in the queue — which is a prioritisation and work-in-progress problem, not an execution one.

Teams that measure only cycle time optimise the small part and cannot understand why stakeholders still complain.

## From the teams we talk to

A team told us their most valuable quarterly ritual is ninety minutes comparing what they estimated against what actually happened, segmented by type of work.

They found a systematic bias: anything touching a third-party integration took roughly twice their estimate, consistently. Once they knew that, every subsequent plan got better without anyone estimating more carefully.

Almost every team has a bias like this. Very few have looked.

## Four numbers, not twenty

Since we shipped dashboards this month, here is our opinion on what belongs on one.

**Work in progress.** The most actionable number available, because you can change it today.

**Cycle time, with the spread.** Not just the average — the range is what lets you make promises you can keep.

**Blocked items, with their age.** Waiting time dominates working time in most teams, and age is what turns a list into an action.

**Milestone variance.** Whether your binary checkpoints are landing when planned. The earliest reliable warning of a late final date.

That is it. A dashboard with twenty metrics is decoration, because nobody acts on twenty numbers. Four, looked at every week in the same meeting, will tell you most of what you need to know about whether the next date holds.

One caution: keep them for steering, not for evaluating people. The moment a metric is used to compare individuals, it stops measuring what it measured.

## What we are working on

Automations — the second version, built after watching how people actually used the first. Mostly this is about making it obvious what an automation will do before you turn it on.

## One ask

Have you ever built an automation you later could not explain? We would genuinely like to hear about it — those stories are shaping how we are designing this.${SIGNOFF}`;
}

export function monthlyJune(): string {
  return `Hi there,

June's edition, and the summer slowdown is a good moment for the kind of process change nobody has time for in a busy month.

## What shipped

**Automations 2.0.** Rules that run when something happens — an item moves, a date passes, an approval lands.

The thing we changed from the first version: you can now see exactly what a rule will do before you enable it, and there is a plain-language log of everything automations have done in your workspace. The failure mode we kept seeing was teams accumulating rules nobody could explain, until the system did something surprising and nobody knew which rule caused it.

Our honest advice on automation: wait. Observe your process for a while before encoding it. Teams that automate early automate the wrong thing, and an automated bad process is harder to change than a manual one.

## One habit to steal

**Write down what you are not doing this quarter.**

Most teams set goals. Very few write the explicit "not doing" list that goes with them.

That list is what gives your team the confidence to decline work mid-quarter without escalating every request, and it is what makes goals real rather than decorative. An unstated "not doing" list gets overridden by whoever asks most insistently.

Three goals, and a written list of what is explicitly out of scope. Ten minutes in planning, and it changes how the whole quarter goes.

## From the teams we talk to

A team described their retro rule to us: **one change per cycle, with a named owner.**

Their reasoning was that leaving a retro with six action items produced none of them, because nobody owns six things. One, owned and specific, gets done about as often as anything else on the list — and one change per cycle compounds to twenty-six a year.

We have started doing this ourselves.

## The summer project worth doing

Quieter months are when process changes actually stick, because there is slack to absorb the awkward fortnight in the middle.

If you have some room this summer, the highest-return project we know is unglamorous: go back through the last quarter and compare what you estimated against what actually happened, grouped by type of work.

Almost every team finds one category that is consistently and substantially underestimated. It is usually anything involving a third party, an unfamiliar part of the system, or a handover between people. Once you know which, every plan you make afterwards is better — with nobody estimating more carefully.

It takes about ninety minutes. Most teams have never done it once.

## What we are working on

Time tracking, rebuilt. The requirement we set for ourselves is that logging time has to take seconds and happen next to the work. Anything more effortful gets filled in from memory on a Friday, and memory-based data is worse than none — because it is confidently wrong and people make pricing decisions from it.

## One ask

If you track time: what makes you not do it on the day? Reply and tell us. We are trying to design that objection out rather than nag you past it.${SIGNOFF}`;
}

export function monthlyJuly(): string {
  return `Hi there,

July's Peakflow Monthly.

## What shipped

**Time tracking, reimagined.** Start and stop from the item you are working on, log a block after the fact in a couple of clicks, and see the week at a glance.

The design constraint was the one we wrote about last month: if it takes more than a few seconds, it gets filled in on Friday from memory, and then your capacity model and your pricing are built on fiction. Everything about the feature follows from that.

For agencies, this closes the loop with the reporting view — hours against fees per engagement, without anyone exporting anything.

## One habit to steal

**Compare allocated hours against actual hours, once a month.**

You allocated thirty hours to a piece of work; it took forty-five. Why? Scope grew, the estimate was optimistic, or the client consumed more account time than assumed.

All three are fixable, in completely different ways — and none of them are visible without the comparison. Teams that do this quarterly find their estimates improve permanently. Teams that skip it repeat the same error on every engagement of that type.

## From the teams we talk to

An agency told us the change that most reduced their slipped deadlines was not internal at all. It was attaching a consequence to client approval requests.

Instead of "let us know your thoughts," they now write: "Feedback by Thursday keeps us on the 20th; after that the date moves."

Their observation was that most client delay is not indifference — it is that nobody told the client what the delay costs. Once they knew, they prioritised.

## Where deadlines actually go

We have been collecting answers to a question we asked here a while ago — what caused the last deadline you missed — and the pattern is lopsided enough to be worth reporting.

Overwhelmingly, the answer is not "the work took longer than expected." It is waiting: for a review, for an approval, for an environment, for an answer from someone outside the team.

That is encouraging, because waiting is much cheaper to fix than capacity. It needs attention rather than people.

The single habit we would recommend on the back of it: add one question to your weekly review — **what are we waiting on, and who owns chasing it?** Every external dependency gets a name and a next chase date. Two minutes, and it catches most of what would otherwise surface a fortnight later.

Polite silent waiting is the most expensive habit in professional work, and it is invisible until somebody asks out loud.

## What we are working on

Calendar sync, so that dates in Peakflow and dates in your calendar stop disagreeing with each other.

## One ask

What is the last deadline you missed, and what actually caused it? We have been collecting these, and the pattern so far is overwhelmingly "waiting on someone else" rather than "the work took longer." Reply if yours fits that, or especially if it does not.${SIGNOFF}`;
}

export function monthlyAugust(): string {
  return `Hi there,

August's edition. Quiet month for most teams, which makes it a good one for the changes that need a little slack to land.

## What shipped

**Calendar sync.** Milestones and due dates from Peakflow now appear in your calendar, kept in step automatically. Two-way where it makes sense, one-way where two-way would create confusion.

This is a small feature that removes a specific recurring annoyance: your calendar and your project tool disagreeing about when something is due, and nobody knowing which to believe.

## One habit to steal

**Separate milestones from deadlines, and say which is which.**

A milestone is a checkpoint — something observable is either true or it is not. A deadline is a commitment to someone outside the work, with consequences you cannot absorb.

Most dates in a plan are milestones. Most teams present all of them as deadlines, and the result is that everything sounds urgent, so nothing is. Then when a genuine deadline arrives, the team has no signal that this one is different.

The test: if you cannot articulate what happens when a date is missed, it is a milestone. Present it as one.

## From the teams we talk to

A distributed team described their rule for written standups: **blockers must name a person and an ask.**

"Blocked on the API contract" goes into the void. "Blocked on the API contract — Sam, can you confirm the response shape today?" gets resolved.

They also named one person responsible for making sure every blocker gets a response the same day. That second part, they said, is what made the first part work.

## Getting ready for a busy autumn

Most teams head into their heaviest quarter in September, and the preparation that helps is worth doing while things are still quiet.

**Check your real capacity.** Not headcount — actual available hours per person after meetings, support and holidays. Plan the autumn against that number rather than the theoretical one.

**Groom the backlog properly, once.** Delete anything untouched for six months. A list people can read is worth more than a list that is complete, and the deletions are the point.

**Write down what you are not doing this quarter.** Three goals and an explicit "not doing" list. That second list is what lets your team decline work in October without escalating every request.

**Fix the one process irritation everyone complains about.** You know which one. There is rarely a better moment than a quiet August.

An afternoon on those four in the next fortnight changes how the following three months go.

## What we are working on

We have been experimenting with automatic summarisation of written standups — pulling the blockers out of a week of updates so nothing sits unanswered.

We are being careful here. Summarisation of stale data just produces confident nonsense, so the feature is only worth building if the underlying updates are current. More next month.

## One ask

Do you run written standups? If so, what makes people skip them? That is the design problem we are actually trying to solve.${SIGNOFF}`;
}

export function monthlySeptember(): string {
  return `Hi there,

September's Peakflow Monthly. The quiet of summer is over and most teams are heading into their busiest quarter, so this one is deliberately practical.

## What shipped

**AI standups.** Written updates get summarised into one digest per team, with blockers pulled out into a list that shows how long each has been waiting.

The thing we care about most here is the blocker list. Almost every team we talk to has blockers that sit for days because they scrolled out of view, not because nobody was willing to help. Surfacing them with an age attached turns out to change behaviour quickly.

As we said last month, we were cautious about this. A summary of stale updates is worse than no summary, so it only surfaces what is genuinely current.

## One habit to steal

**Add one question to your weekly review: what are we waiting on, and who owns chasing it?**

Two minutes. In most teams, waiting time dominates working time — and unlike capacity, waiting is cheap to fix, because the fix is attention rather than people.

Every external dependency needs a name and a next chase date. Polite silent waiting is the most expensive habit in professional work, and it is entirely invisible until someone asks the question out loud.

## From the teams we talk to

Heading into a heavy quarter, one team told us they set three goals and a written list of what they were explicitly not doing — then referred to that second list more often than the first.

It became their answer to mid-quarter requests: not "no," but "here is what we agreed we would not do this quarter; do you want to change that?" The requests mostly stopped.

## One number for the busy quarter

If you track one thing between now and the end of the year, make it **work in progress per person**.

It is the number that most reliably predicts whether a heavy quarter goes well or badly, and it is the one you can change immediately without anyone's permission.

When things get busy, the instinct is to start more — take on the new request, begin the next thing while waiting on a review, keep every plate spinning so nothing looks neglected. It feels responsive. What it produces is a team where everything is eighty percent done in December.

The counter-discipline is simple to state and hard to hold: finish before you start. If a piece of work is blocked, chase the blocker rather than opening a new front.

Teams that hold that line through a busy quarter come out having shipped noticeably more, and having had a considerably less unpleasant time doing it.

## What we are working on

Nothing new this month, on purpose. We are spending the quarter on performance, reliability and a long tail of small annoyances you have reported.

Shipping features on a foundation that irritates people daily is a bad trade, and we would rather tell you plainly that we are doing maintenance than invent news.

## One ask

What is the smallest thing in Peakflow that irritates you most often? Not the big feature request — the tiny recurring friction. Those are exactly what we are working on right now, and a surprising number of them are quick to fix once we know.${SIGNOFF}`;
}

// ---------------------------------------------------------------------------
// New in Peakflow — feature announcements
// ---------------------------------------------------------------------------

export function featureAsyncApprovals(): string {
  return `Hi there,

We just shipped something we have wanted for a long time: **async approvals**. Here is what it does, why we built it, and how to get value from it in about five minutes.

## The problem

Approvals are where work goes to wait.

In most teams, getting a sign-off means either booking a meeting or starting an email thread. The meeting costs everyone an hour and happens whenever the calendar allows. The email thread produces a decision that lives in one person's inbox, which is a problem about three months later when somebody asks who approved what.

For teams doing client work, this is worse. Approval delay is the single largest cause of slipped deadlines we hear about — not the work taking longer, but waiting for someone to say yes.

## What shipped

Reviewers can now approve or leave a comment directly on the item.

- **The request goes to a named person** with a due date, not to a group in the hope someone picks it up.
- **Comments attach to the specific thing** being reviewed, rather than describing it in prose.
- **The decision is timestamped and stays with the work**, permanently.
- **It works on a phone**, because a surprising number of approvals happen on a train.
- **"Awaiting approval" is a visible status** with the date it entered that state, so nothing sits unnoticed.

That last point is doing more work than it sounds like. When everyone can see that something has been waiting nine days, it usually stops waiting.

## What it does not do

It will not make a slow approver fast. No software does that.

What it does is remove the friction and the ambiguity — the reviewer has one click rather than a meeting to attend, and nobody has to argue later about what was agreed. If your approvals are slow because the request is vague or because three stakeholders give contradictory feedback, this will help a little and your process will help a lot more.

## Getting started

1. Open any item and choose **Request approval**.
2. Pick the approver and a date.
3. That is it.

Nothing to configure, nothing to migrate, and it works with the boards and projects you already have.

## One thing worth doing alongside it

Attach a consequence to the request. Not "let us know your thoughts" but "approval by Thursday keeps us on the 20th."

Most approval delay is not indifference — it is that nobody told the approver what the delay costs. Once they know, they prioritise.

## Tell us how it goes

Features get better when real teams put them through a real week. Once you have used it a few times, reply and tell us what is working and what is missing.

We read every message, and this one in particular came almost entirely from replies to this newsletter.${SIGNOFF}`;
}

export function featureFasterBoards(): string {
  return `Hi there,

This month's release is not a new feature. **Boards are substantially faster**, and for a lot of you that will matter more than anything new we could have shipped.

## Why we spent a month on this

Because you told us, repeatedly and politely, that large boards felt sluggish.

Switching between projects had a pause. Filtering a big board had a pause. Loading a board with a lot of items had a longer one. None of it was broken; all of it was irritating, several times a day, forever.

We take that seriously for a specific reason: a tool people find irritating stops getting updated. And a project tool that is not current is not just less useful — it is actively misleading, because people make decisions from it anyway.

## What actually changed

We rebuilt how boards load and render. Data now arrives incrementally instead of all at once, rendering only touches what changed, and filtering happens without a round trip.

The practical effect: large boards open quickly, switching between projects feels immediate, and filtering is instant.

If you run boards with a lot of items, you should notice it the moment you log in. If your boards are small, you may not notice much — which is fine. This was for the teams at the heavy end.

## Also in this release

- **Bulk editing.** Select multiple items and change owner, date or status in one go.
- A fix for the recurring-task edge case that misbehaved at month boundaries.
- Keyboard navigation on boards, which several of you asked for and which we now use constantly ourselves.

## Nothing to do

No setup, no migration, no new setting. Open a board and it is faster.

## A note on how we choose this work

It is tempting to always ship something new, because new things are easier to write a newsletter about. But performance work compounds — every day, for every person, on every board.

We would rather spend a month making the thing you use constantly feel good than add a feature on top of a foundation that annoys you. We expect to do this again.

## Tell us where it still drags

If there is anywhere in Peakflow that still feels slow, we want to know specifically: which screen, roughly how many items, and what you were doing.

Reply to this email. Those reports are exactly what drove this release, and they are the most useful kind of message we get.${SIGNOFF}`;
}

export function featureAgencyReporting(): string {
  return `Hi there,

New this month: the **agency reporting view**, built for teams running many client engagements at once.

## The problem

If you run client work, the questions that matter most cannot be answered from any single project:

- What is due this week, across every client?
- What are we waiting on from someone outside the team?
- Who is over capacity in the next two weeks?

Those are cross-project questions by definition. The conflict that hurts an agency is two clients' delivery weeks landing on the same designer — and no individual project board will ever show you that.

So most agencies answer these by building a spreadsheet on Monday morning, which is accurate until roughly Wednesday.

## What shipped

One screen with all three answers, generated from the work you are already tracking.

- **Due this week, every client**, sorted so the tightest dates surface first.
- **Waiting on external input**, with the age of each item and who owns chasing it.
- **Capacity by person** across the next few weeks, so overload is visible before it becomes a missed date.

Nothing to assemble. Nothing to maintain. It reflects whatever state your boards are in right now.

## What it does not do

It will not fix an inaccurate board. If people are not updating their work, this view will confidently show you a clean picture of a situation that is not true.

It also will not forecast unsigned pipeline work. We looked hard at this and concluded that guessing at probability-weighted capacity produces a number that feels authoritative and is mostly invention. We would rather show you what is real.

## Getting started

1. Open **Reports** in the sidebar.
2. Choose **Agency view**.
3. Optionally, pick which clients to include.

If you have client work in Peakflow already, it will populate immediately.

## One thing worth doing alongside it

Add a weekly cross-client triage — thirty to forty-five minutes, every client at once, going through exactly those three questions.

That meeting is where cross-client problems become visible: the two deadlines colliding on one person, the client who has been quiet for ten days, the approval pending since last month. Project-by-project reviews will never surface any of it.

## Tell us what is missing

This came directly from replies to this newsletter — several of you described the manual report you build every Monday, and we tried to make that report unnecessary.

If it is not quite your report yet, reply and tell us what is missing. That is how this one got built in the first place.${SIGNOFF}`;
}

export function featureCustomDashboards(): string {
  return `Hi there,

New this month: **custom dashboards** — the handful of numbers your team steers by, on one screen.

## The problem

Every project tool, including ours, can show you a great many metrics. That turns out to be the problem rather than the solution.

A dashboard with twenty numbers is decoration. Nobody acts on twenty numbers. What teams actually need is the three or four measures that tell them whether the next date holds, visible without assembling anything.

Which three or four depends entirely on how you work, which is why we stopped guessing and made it yours.

## What shipped

Build a dashboard from the measures that matter to you:

- **Work in progress**, which is the most actionable number on this list because you can change it today.
- **Cycle time**, with the spread rather than just the average.
- **Blocked items with age**, so nothing sits quietly for a fortnight.
- **Milestone variance**, which is the best early warning you will get for a late final date.
- Throughput, workload by person, and the rest.

One deliberate design decision: we made it easy to build a small dashboard and slightly awkward to build an enormous one. That friction is intentional.

## What we would put on it

If you want our opinion: work in progress, cycle time, blocked items with age, milestone variance. Four numbers, reviewed weekly, will tell you most of what you need to know.

And one caution — the moment a metric is used to evaluate individuals, it stops measuring what it measured. If cycle time becomes a performance target, work gets split into artificially small pieces. If blocked time is punished, people stop marking things blocked and sit on them silently, which is strictly worse. Dashboards are for the team to steer with.

## Getting started

1. Open **Dashboards** and choose **New**.
2. Add the metrics you want.
3. Share it with your team, or keep it to yourself.

Everything is calculated from work you are already tracking. There is nothing to log and nothing to maintain.

## The principle behind it

Any metric that requires separate data entry gets abandoned within about two months, and the abandonment is rational — the person entering the data rarely benefits from it.

So everything here is a byproduct of people moving cards. If the boards are current, the numbers are current. If they are not, no dashboard can save you.

## Tell us what you are tracking

We would genuinely like to know which numbers your team makes decisions from — not the ones you feel you should track, the ones you actually look at.

Reply and tell us. Those answers shape what we add next.${SIGNOFF}`;
}

export function featureAutomations(): string {
  return `Hi there,

**Automations 2.0** is live. Rules that run when something happens — an item moves, a date passes, an approval lands.

## Why a second version

The first version worked. The problem was what happened after a few months of use.

Teams accumulated rules nobody could fully explain. Then the system did something unexpected, and nobody knew which rule caused it, so the general response was to stop trusting automation entirely. That is a design failure, not a user failure.

## What changed

**You can see what a rule will do before enabling it.** A plain-language preview, plus which existing items it would affect.

**There is a log.** Every action taken by an automation, in readable language, with the rule that caused it. When something surprising happens, you can find out why in about ten seconds.

**Rules can be paused.** Not deleted — paused, so you can test whether a rule is causing something without losing it.

**Conflicts are flagged.** If two rules would fight over the same item, we tell you when you create the second one instead of letting you discover it later.

## What we would automate

Honestly, less than you might expect, and later than you might expect.

The things that pay off reliably: moving an item to the right place when an approval lands, flagging items that have been blocked past a threshold, creating recurring work on a schedule, and notifying an owner when a dependency they are waiting on completes.

The things that cause trouble: anything that silently changes a date, anything that reassigns ownership, and elaborate chains where the output of one rule feeds another.

## The advice we would give

Wait. Observe your process before encoding it.

Teams that automate early automate the wrong thing, and an automated bad process is considerably harder to change than a manual one — because now nobody remembers why it works that way and everyone is slightly afraid to touch it.

Run a process manually for a couple of months. Automate the step you have done identically twenty times.

## Getting started

1. Open **Settings → Automations**.
2. Create a rule, and read the preview before you enable it.
3. Check the log after a few days to see what it actually did.

Existing rules carry over unchanged, and now appear in the log alongside everything else.

## Tell us about your worst one

We are serious about this: have you ever built an automation you later could not explain?

Those stories shaped this release more than anything else. Reply and tell us — we collect them.${SIGNOFF}`;
}

export function featureTimeTracking(): string {
  return `Hi there,

**Time tracking, rebuilt.** If you have tried ours before and gave up, this is worth another look.

## The problem with most time tracking

It takes too long, so it gets done on Friday from memory.

That matters more than it sounds. Memory-based time data is not slightly inaccurate — it is confidently wrong, and agencies then use it to decide what to charge, which clients are profitable, and how to staff the next quarter. Building pricing on remembered hours is worse than having no data, because at least without data you know you are guessing.

So we set one requirement: logging time has to take seconds and happen next to the work.

## What shipped

- **Start and stop from the item** you are working on. One click, no separate screen.
- **Log a block after the fact** in a couple of clicks, for the meeting you did not time.
- **See your week at a glance** and fix the gaps before it closes.
- **Hours roll up per project and per client** automatically.
- **It works on a phone**, for the work that does not happen at a desk.

For agencies, this closes the loop with the reporting view: hours against fees per engagement, without exporting anything anywhere.

## What it does not do

It does not monitor anyone. No screenshots, no activity tracking, no idle detection.

We considered these and decided against them deliberately. Surveillance tooling tells your team you do not trust them, and people respond by optimising for the appearance of work. You get exactly the behaviour you measured, and you lose the honest data you were trying to collect.

## The number worth looking at

Once you have a month of data, compare **allocated hours against actual hours** by type of work.

Nearly every team finds a systematic bias — one category that reliably takes twice as long as estimated. Once you know which, every future plan improves without anyone estimating more carefully.

For agencies there is a second comparison: hours against fees per client. The usual finding is that the most demanding client is the least profitable and a quiet one is carrying the quarter. That leads somewhere useful — a price conversation, usually, rather than a difficult decision about the relationship.

## Getting started

1. Open any item and press **Start**.
2. Or use **My week** to log blocks after the fact.
3. Hours appear in project and client reporting automatically.

## Tell us what stops you

If you still do not log time on the day, we would like to know precisely what gets in the way. We are trying to design that objection out rather than nag you past it.

Reply and tell us.${SIGNOFF}`;
}

export function featureCalendarSync(): string {
  return `Hi there,

A small one this month, and a genuinely useful one: **calendar sync**.

## The problem

Your calendar and your project tool disagree about when things are due, and nobody knows which to believe.

Someone moves a date in the project. The calendar invite still says the old one. A week later two people show up to a review for work that was rescheduled, or worse, nobody shows up for one that was not.

It is a small, recurring, entirely avoidable annoyance — the kind that never makes it onto a roadmap because it is nobody's biggest problem and everybody's weekly irritation.

## What shipped

Milestones and due dates from Peakflow now appear in your calendar and stay in step automatically.

- **Milestones sync as events**, with the project and owner attached.
- **Due dates appear as all-day entries**, so they sit alongside your meetings rather than blocking your day.
- **Changes flow through.** Move a date in Peakflow and the calendar updates.
- **Choose what syncs.** Everything, one project, or only milestones — whatever keeps your calendar readable.

Works with Google Calendar and Outlook.

## The deliberate limitation

Sync is one-way by default: Peakflow to your calendar, not the reverse.

We thought about this carefully. Two-way sync sounds better and creates a specific problem — someone drags an event in their calendar without realising they have just changed a project deadline that three other people are planning around.

Where two-way genuinely makes sense, you can enable it per calendar. The default is the safe one.

## One thing worth doing alongside it

While you are setting this up, look at what is actually on your calendar for the next fortnight and ask of each recurring meeting: what would break if this stopped?

Most teams find a third of their recurring meetings solved a problem that no longer exists, and another third are transmitting information that writing would handle better. Syncing your deadlines into a calendar is more useful when the calendar is not already full of meetings nobody needs.

## Getting started

1. Open **Settings → Integrations**.
2. Connect Google Calendar or Outlook.
3. Choose which projects and which item types to sync.

Takes about a minute, and you can disconnect it just as quickly.

## Tell us if it gets noisy

The main risk with a feature like this is a cluttered calendar. If you find it is syncing more than you want, tell us what you would rather see — that feedback directly shapes the defaults for everyone.${SIGNOFF}`;
}

export function featureAiStandups(): string {
  return `Hi there,

New this month: **AI standups**. Written updates, summarised into one digest per team, with blockers pulled out into a list.

## The problem

Written standups work well for distributed teams, and they have one persistent failure: blockers get posted and then scroll away.

Nobody ignores them deliberately. The update is written on Tuesday, three more arrive by Wednesday, and by Thursday the person who could have unblocked it has not seen it. The work sits for a week, and when it surfaces, the honest answer is that nobody knew.

That is the specific problem we set out to fix — not summarisation for its own sake.

## What shipped

- **A daily digest per team**, summarising what moved from everyone's written updates.
- **A blocker list**, extracted automatically, showing **how long each one has been waiting**. The age is the point.
- **Blockers link to the work** and the person who raised them, so acting on one takes a click.
- **A weekly rollup**, useful for a review or a stakeholder update.

The digest is a convenience. The blocker list with ages is the feature.

## What we were careful about

A summary of stale updates is worse than no summary. It produces something that reads authoritatively and describes a week that did not happen.

So the digest only surfaces what is genuinely current, and it tells you plainly when people have not updated rather than smoothing over the gap. We would rather show you an honest hole than a confident invention.

We also do not summarise individuals' output into anything resembling a performance signal. Standups are for coordination. The moment they are read upward as productivity evidence, people write them for the wrong audience and they stop being honest.

## Getting the most from it

Two habits make this work far better:

**Blockers must name a person and an ask.** "Blocked on the API contract" goes nowhere. "Blocked on the API contract — Sam, can you confirm the response shape today?" gets resolved.

**Someone owns the blocker list.** One named person making sure every item gets a response the same day. Without that, you have a beautifully organised list of things nobody is doing anything about.

## Getting started

1. Open **Settings → Standups**.
2. Choose your team and the daily window.
3. The digest posts automatically once people start updating.

## Tell us what makes people skip

The design problem we are actually working on is not summarisation — it is why written updates get skipped in the first place.

If your team has tried standups and stopped, we would really like to know why. Reply and tell us; that answer is worth more to us than any feature request.${SIGNOFF}`;
}
