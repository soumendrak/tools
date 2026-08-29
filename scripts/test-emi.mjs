/* EMI calculator test suite. Run with: pnpm test
 *
 * Two halves:
 *   1. example checks — the assertions that used to live in the page's console-only selfCheck,
 *      most of them written in response to a review finding.
 *   2. property checks — invariants asserted across generated COMBINATIONS of features. Every
 *      round of review found bugs in the seams between features (moratorium x lump sum,
 *      flat x prepayment, currency x bench), which example-based tests never probed.
 */
import { loadEngine } from "./emi-engine.mjs";

const E = loadEngine();
const {
  emiFor, amountFor, tenureFor, rateFor, flatEmi, flatSchedule, irrMonthly, simulate,
  solve, taxRelief, investCompare, moraEffect, computeBench, benchEval, bestIndex, benchSig,
  groupRows, snapshot, restore, esc, nearestSlab, endLabel, parseNum, parseMoney,
  SLABS, MAX_MONTHS, S,
} = E;

let passed = 0;
const failures = [];
const ok = (cond, name) => { if (cond) passed++; else failures.push(name); };

// ---------------------------------------------------------------- example checks
function examples() {
  const r9 = 0.09 / 12, base = { startY: 2026, startM: 0 };
  const E9 = emiFor(2.5e6, r9, 240, "arrears");
  ok(Math.abs(E9 - 22493.13) < 1, "EMI formula");
  ok(Math.abs(amountFor(E9, r9, 240, "arrears") - 2.5e6) < 100, "amount inverse");
  ok(Math.abs(tenureFor(2.5e6, E9, r9, "arrears") - 240) < 0.5, "tenure inverse");
  ok(Math.abs(rateFor(2.5e6, E9, 240, "arrears") * 1200 - 9) < 0.01, "rate inverse");

  // a plain schedule closes out in exactly n months, and its interest matches EMI×n − P
  const plain = simulate(2.5e6, 9, 240, E9, "arrears", base);
  ok(plain.rows.length === 240, "plain schedule length");
  ok(Math.abs(plain.rows.reduce((a, x) => a + x.interest, 0) - (E9 * 240 - 2.5e6)) < 5, "plain total interest");
  ok(plain.rows[239].balance < 1, "plain closes to zero");
  ok(plain.rows[0].m === 0 && plain.rows[12].y === 2027, "schedule starts at the loan start month");

  // MANISH KUMAR's case: 12,07,044 at 14% over 180 months, +5000/month -> around 96 months
  const E14 = emiFor(1207044, 0.14 / 12, 180, "arrears");
  const fast = simulate(1207044, 14, 180, E14, "arrears", Object.assign({ extraMonthly: 5000 }, base));
  ok(fast.rows.length > 90 && fast.rows.length < 105, "extra monthly shortens tenure to ~96");
  ok(fast.rows[fast.rows.length - 1].balance < 1, "prepaid loan closes to zero");

  // a lump sum lands only in its own month, and shortens the loan
  const lump = simulate(2.5e6, 9, 240, E9, "arrears", Object.assign({ lumps: [{ month: 13, amount: 5e5 }] }, base));
  ok(lump.rows[12].extra === 5e5 && lump.rows[11].extra === 0, "lump sum lands on its month");
  ok(lump.rows.length < 240, "lump sum shortens the tenure");

  // Pre-EMI moratorium: the balance is untouched and the tenure grows by the holiday
  const mora = simulate(2.5e6, 9, 240, E9, "arrears", Object.assign({ moraMonths: 12, moraType: "interest" }, base));
  ok(Math.abs(mora.rows[11].balance - 2.5e6) < 1, "Pre-EMI leaves the principal alone");
  ok(mora.rows.length === 252, "Pre-EMI adds the holiday to the tenure");

  // full moratorium capitalises the interest, so the re-struck EMI is larger
  const defer = simulate(2.5e6, 9, 240, E9, "arrears", Object.assign({ moraMonths: 12, moraType: "full" }, base));
  ok(defer.rows[11].balance > 2.5e6, "deferred interest capitalises");
  ok(defer.emiUsed > E9, "EMI re-struck after a full moratorium");
  ok(defer.rows.length === 252, "full moratorium keeps the agreed tenure after the holiday");

  // Sudharsanan's case: rate drops 8.6 -> 6.9 after 24 months, EMI held, so the loan ends sooner
  const E86 = emiFor(2.5e6, 0.086 / 12, 240, "arrears");
  const drop = simulate(2.5e6, 8.6, 240, E86, "arrears", Object.assign({ rateSteps: [{ month: 25, rate: 6.9 }] }, base));
  ok(drop.rows.length < 240, "a rate cut shortens the tenure");
  ok(Math.abs(drop.rows[23].interest - (drop.rows[23].balance + drop.rows[23].principal) * 0.086 / 12) < 1, "old rate applies before the step");
  ok(Math.abs(drop.rows[24].interest - (drop.rows[24].balance + drop.rows[24].principal) * 0.069 / 12) < 1, "new rate applies from the step");

  // "lower the EMI" mode: without prepayments it must re-derive the very same level EMI
  const noop = simulate(2.5e6, 9, 240, E9, "arrears", Object.assign({ prepayMode: "emi" }, base));
  ok(noop.rows.length === 240, "reduce-EMI mode is a no-op on a plain loan");
  ok(Math.abs(noop.emiLast - E9) < 1, "reduce-EMI mode keeps the same EMI when nothing changes");

  // with a lump sum it holds the end date and drops the instalment instead
  const keep = simulate(2.5e6, 9, 240, E9, "arrears",
    Object.assign({ prepayMode: "emi", lumps: [{ month: 13, amount: 5e5 }] }, base));
  ok(keep.rows.length === 240, "reduce-EMI mode keeps the original end date");
  ok(keep.emiLast < E9 - 1000, "reduce-EMI mode lowers the instalment after a lump sum");
  // ...and it must save less interest than finishing early with the same lump sum
  const cut = lump.rows.reduce((a, x) => a + x.interest, 0);
  ok(keep.rows.reduce((a, x) => a + x.interest, 0) > cut, "finishing early beats a lower EMI on interest");

  // tax relief: a 30% payer on a self-occupied home caps at 2L interest + 1.5L principal a year
  const tr = taxRelief(plain.rows, 30, "self", 2.5e6, "old");
  ok(tr.saved > 0 && tr.saved < 3.5e5 * 0.3 * 21, "tax relief stays inside the yearly caps");
  ok(Math.abs(tr.perMonthI.reduce((a, x) => a + x, 0) - tr.savedInterest) < 1, "monthly relief sums to the Sec 24 total");
  ok(tr.savedInterest < tr.saved, "the rate uses only the interest half of the relief");
  ok(taxRelief(plain.rows, 0, "self", 2.5e6, "old") === null, "no slab means no relief");
  // a let-out property has no Sec 24 cap, so it can never save less
  ok(taxRelief(plain.rows, 30, "letout", 2.5e6, "old").saved === tr.saved,
    "let-out is capped too while rent is unknown");

  // prepay-vs-invest: at a 0% return, prepaying must win (it saves real interest)
  const slowRows = simulate(1207044, 14, 180, E14, "arrears", base).rows;
  const ic0 = investCompare(fast.rows, slowRows, 180, E14, 5000, [], 0);
  ok(ic0.prepay > ic0.invest, "at 0% return, prepaying wins");
  // at a high enough return the ranking has to flip
  const ic20 = investCompare(fast.rows, slowRows, 180, E14, 5000, [], 0.20 / 12);
  ok(ic20.invest / ic20.prepay > ic0.invest / ic0.prepay, "a higher return favours investing");

  /* Totals must equal the cash that actually leaves your pocket. Under a full moratorium the
     deferred interest is capitalised, so summing the schedule's principal double-counts it —
     the sum repaid exceeds the sum borrowed by exactly the capitalised amount. */
  const capd = simulate(2.5e6, 9, 240, E9, "arrears",
    Object.assign({ moraMonths: 12, moraType: "full" }, base));
  const capdInterest = capd.rows.reduce((a, x) => a + x.interest, 0);
  const capdAmortised = capd.rows.reduce((a, x) => a + x.principal + x.extra, 0);
  const capdCash = capd.rows.reduce((a, x) => a + x.emi + x.extra, 0);
  ok(capdAmortised > 2.5e6 + 1, "capitalised interest inflates what the schedule amortises");
  ok(Math.abs((2.5e6 + capdInterest) - capdCash) < 5, "principal + interest equals the cash paid");
  ok(Math.abs((capdAmortised + capdInterest) - capdCash - (capdAmortised - 2.5e6)) < 5,
    "summing schedule principal would overstate by the capitalised amount");
  // and the plain case is unaffected: nothing is capitalised, so the two agree
  const plainAmortised = plain.rows.reduce((a, x) => a + x.principal + x.extra, 0);
  ok(Math.abs(plainAmortised - 2.5e6) < 1, "with no moratorium, amortised equals the amount borrowed");

  // ---- PR #6 review fixes ----
  // a lump sum dated inside a moratorium must still be applied, not silently dropped
  const lumpInHoliday = simulate(2.5e6, 9, 240, E9, "arrears",
    Object.assign({ moraMonths: 12, moraType: "full", lumps: [{ month: 6, amount: 3e5 }] }, base));
  ok(lumpInHoliday.rows[5].extra === 3e5, "a lump sum inside the holiday lands on its month");
  ok(lumpInHoliday.rows[5].balance < lumpInHoliday.rows[4].balance, "and it reduces the balance");

  // advance scheme must not charge interest on money prepaid at the start of the month
  const advNoExtra = simulate(2.5e6, 9, 240, emiFor(2.5e6, r9, 240, "advance"), "advance", base);
  const advExtra = simulate(2.5e6, 9, 240, emiFor(2.5e6, r9, 240, "advance"), "advance",
    Object.assign({ extraMonthly: 5000 }, base));
  ok(advExtra.rows[0].interest < advNoExtra.rows[0].interest, "advance prepayment cuts that month's interest");

  // a 0% flat loan is a valid answer, not an error
  ok(!solve({ mode: "rate", rateType: "flat", amount: 1e6, emi: 1e6 / 60, tenure: 60, scheme: "arrears",
    startY: 2026, startM: 0, fees: 0, moraMonths: 0, lumps: [], rateSteps: [] }).error,
    "an interest-free flat loan is accepted");

  // solving for a rate must not round itself into an extra payment
  const exactE = emiFor(2.5e6, 0.09005 / 12, 240, "arrears");
  const rSolved = solve({ mode: "rate", rateType: "reducing", amount: 2.5e6, emi: exactE, tenure: 240,
    scheme: "arrears", startY: 2026, startM: 0, fees: 0, moraMonths: 0, moraType: "interest",
    extraMonthly: 0, lumps: [], rateSteps: [], prepayMode: "tenure" });
  ok(!rSolved.error && rSolved.rows.length === 240, "a solved rate still repays in exactly its tenure");

  // Loan Amount mode must honour a full moratorium: the EMI you asked for is the EMI you get
  const amt = solve({ mode: "amount", rateType: "reducing", amount: 0, emi: 22493, tenure: 240,
    scheme: "arrears", startY: 2026, startM: 0, fees: 0, moraMonths: 12, moraType: "full",
    extraMonthly: 0, lumps: [], rateSteps: [], prepayMode: "tenure", rate: 9 });
  ok(!amt.error && Math.abs(amt.E - 22493) < 25, "loan amount solves back to the requested EMI");

  // ---- PR #7 review fixes ----
  const stBase = { mode: "emi", currency: "INR", rateType: "reducing", scheme: "arrears",
    startY: 2026, startM: 0, fees: 0, moraMonths: 0, moraType: "interest", extraMonthly: 0,
    lumps: [], rateSteps: [], prepayMode: "tenure", amount: 2.5e6, rate: 9, tenure: 240, emi: 0 };

  // the invest path keeps contributing to the original end date, not to the early payoff
  // with the budget model, path B invests its extra every month to the original end date
  const rowsB180 = new Array(180).fill(0).map(() => ({ emi: 20000, extra: 0 }));
  const rowsA96 = new Array(96).fill(0).map(() => ({ emi: 20000, extra: 5000 }));
  const icShort = investCompare(rowsA96, rowsB180, 180, 20000, 5000, [], 0.10 / 12);
  let manualB = 0;
  for (let i = 0; i < 180; i++) manualB += 5000 * Math.pow(1 + 0.10 / 12, 179 - i);
  ok(Math.abs(icShort.invest - manualB) < 1, "invest path runs to the original end date");
  ok(icShort.invest > 5000 * 96, "and is not truncated at the early payoff");

  // bench totals must not double-count capitalised interest, same as present()
  const benchMora = computeBench(Object.assign({}, stBase, { moraMonths: 12, moraType: "full" }));
  ok(Math.abs(benchMora.total - (2.5e6 + benchMora.interest)) < 2, "bench total excludes capitalised double-count");

  // a fee-free flat loan's APR is its true reducing cost, not the quoted flat number
  const benchFlat = computeBench(Object.assign({}, stBase, { rateType: "flat", rate: 8, tenure: 60 }));
  ok(benchFlat.apr > 14, "flat APR reflects the real cost, not the headline rate");

  // solving a flat rate must clear the balance exactly, not leave a residue
  const flatSolved = solve(Object.assign({}, stBase, { mode: "rate", rateType: "flat",
    amount: 1e6, tenure: 60, emi: 23333 }));
  ok(!flatSolved.error && flatSolved.rows.length === 60, "flat rate solve keeps its tenure");
  ok(flatSolved.rows[flatSolved.rows.length - 1].balance < 0.5, "and closes to zero");

  // loan amount honours a lump sum paid during the holiday
  const amtLump = solve(Object.assign({}, stBase, { mode: "amount", emi: 22493, moraMonths: 12,
    moraType: "full", lumps: [{ month: 6, amount: 3e5 }] }));
  ok(!amtLump.error && Math.abs(amtLump.E - 22493) < 25, "holiday lump sums feed the amount inversion");

  // 80C must not also claim interest that was capitalised and already relieved under Sec 24
  const moraRows = simulate(2.5e6, 9, 240, E9, "arrears",
    Object.assign({ moraMonths: 12, moraType: "full" }, base)).rows;
  const trMora = taxRelief(moraRows, 30, "self", 2.5e6, "old", true);
  // 80C may only ever relieve the principal actually borrowed, never the capitalised interest
  const amortisedMora = moraRows.reduce((a, x) => a + x.principal + x.extra, 0);
  ok(amortisedMora > 2.5e6 + 1, "the holiday really did capitalise interest");
  const principalRelief = trMora.saved - trMora.savedInterest;
  ok(principalRelief <= 2.5e6 * 0.30 + 1, "80C never relieves more than the sum borrowed");

  // a renamed scenario cannot inject markup
  ok(esc('Bank "A" <b>') === "Bank &quot;A&quot; &lt;b&gt;", "scenario names are escaped");

  // ---- PR #7 second review ----
  // a lump scheduled after the early payoff must be invested by the prepay path too
  const lateLump = [{ month: 120, amount: 4e5 }];
  const icLate = investCompare(rowsA96, rowsB180, 180, 20000, 0, lateLump, 0.10 / 12);
  const icNoLate = investCompare(rowsA96, rowsB180, 180, 20000, 0, [], 0.10 / 12);
  ok(icLate.prepay > icNoLate.prepay, "post-payoff lumps are invested on the prepay path");
  // month 120 is index 119, so it compounds for (nBase - 1 - 119) = 60 periods
  ok(Math.abs(icLate.prepay - icNoLate.prepay - 4e5 * Math.pow(1 + 0.10 / 12, 60)) < 1,
    "and are compounded from their own month");

  // an exact 0% cash flow is a 0% APR, not "no rate fits"
  ok(irrMonthly(1e6, new Array(60).fill(1e6 / 60), "arrears") === 0, "a 0% loan has a 0% APR");
  ok(isNaN(irrMonthly(1e6, new Array(60).fill(1e5 / 60), "arrears")), "a real shortfall still has none");

  // a partial tie must not crown the first of two equally good offers
  ok(bestIndex([0, 0, 25000], true) === -1, "a shared best value awards nobody");
  ok(bestIndex([0, 12000, 25000], true) === 0, "a unique best value still wins");

  // the final instalment, not the anniversary
  ok(endLabel(2026, 0, 239) === "Dec 2045", "240 payments from Jan 2026 end in Dec 2045");

  // the investment baseline keeps the holiday and rate steps, dropping only prepayments
  const npBase = solve(Object.assign({}, stBase, { moraMonths: 12, moraType: "full",
    extraMonthly: 5000, emi: 0 }));
  const holidayOnly = solve(Object.assign({}, stBase, { moraMonths: 12, moraType: "full", emi: 0 }));
  ok(npBase.noPrepayMonths === holidayOnly.rows.length,
    "prepay-vs-invest baseline retains the moratorium");

  // loading a saved chip must not alias its arrays
  const savedChip = { lumps: [{ month: 6, amount: 1e5 }], rateSteps: [] };
  const restored = restore(savedChip);
  restored.lumps[0].amount = 9e9;
  ok(savedChip.lumps[0].amount === 1e5, "restoring a chip clones its event arrays");

  // ---- PR #7 third review ----
  /* A part-payment in the payoff month leaves budget unspent, and that surplus belongs to the
     prepayer. Path A here pays only 1,000 in its final month against a 20,000 budget. */
  const rowsAshort = new Array(96).fill(0).map((_, i) =>
    i === 95 ? { emi: 1000, extra: 0 } : { emi: 20000, extra: 0 });
  const icSurplus = investCompare(rowsAshort, rowsB180, 180, 20000, 0, [], 0);
  ok(Math.abs(icSurplus.prepay - (19000 + 20000 * 84)) < 1, "payoff-month surplus is invested");

  /* A moratorium never applies extraMonthly, so both paths leave it unspent in those months and
     must be credited identically — previously only the investing path got it. */
  const moraA = [{ emi: 0, extra: 0 }, { emi: 0, extra: 0 }].concat(
    new Array(10).fill(0).map(() => ({ emi: 20000, extra: 5000 })));
  const moraB = [{ emi: 0, extra: 0 }, { emi: 0, extra: 0 }].concat(
    new Array(10).fill(0).map(() => ({ emi: 20000, extra: 0 })));
  const icMora = investCompare(moraA, moraB, 12, 20000, 5000, [], 0);
  ok(Math.abs(icMora.prepay - icMora.invest - (-5000 * 10)) < 1,
    "holiday months credit both paths the same");

  // pre-construction interest is deferred, then relieved over five years from completion
  const preConRows = simulate(2.5e6, 9, 240, E9, "arrears",
    Object.assign({ moraMonths: 24, moraType: "interest" }, base)).rows;
  const trPre = taxRelief(preConRows, 30, "self", 2.5e6, "old", true);
  const moraInterest = preConRows.filter((x) => x.mora).reduce((a, x) => a + x.interest, 0);
  ok(moraInterest > 0, "the holiday accrues interest to defer");
  // Aug 2026 - Mar 2027 is wholly pre-construction, so that FY must claim nothing at all
  ok(trPre.perMonthI.slice(0, 8).every((v) => v === 0),
    "no relief is claimed in a wholly pre-construction year");
  // deferring it past the 2L cap changes the total, so it must differ from claiming as accrued
  // the same schedule treated as a post-possession payment holiday claims as it accrues
  const trPreNoDefer = taxRelief(preConRows, 30, "self", 2.5e6, "old", false);
  ok(Math.abs(trPre.saved - trPreNoDefer.saved) > 1, "deferral changes the relief, as the caps imply");

  // new regime: nothing for a self-occupied home, but Sec 24 survives on a let-out one
  ok(taxRelief(plain.rows, 30, "self", 2.5e6, "new") === null, "new regime gives a self-occupied home nothing");
  const trNewLet = taxRelief(plain.rows, 30, "letout", 2.5e6, "new");
  ok(trNewLet && trNewLet.savedInterest > 0, "new regime still relieves let-out interest");
  ok(Math.abs(trNewLet.saved - trNewLet.savedInterest) < 1, "and grants no 80C on top of it");

  // ---- PR #7 fourth review ----
  /* A short loan after a holiday cannot claim all five pre-construction instalments within its
     own schedule. Those years must still reach the effective rate, via the tail. */
  const shortE = emiFor(2.5e6, r9, 36, "arrears");
  const shortRows = simulate(2.5e6, 9, 36, shortE, "arrears",
    Object.assign({ moraMonths: 12, moraType: "interest" }, base)).rows;
  const trShort = taxRelief(shortRows, 30, "self", 2.5e6, "old", true);
  const inSchedule = trShort.perMonthI.reduce((a, x) => a + x, 0);
  const inTail = trShort.tail.reduce((a, x) => a + (x || 0), 0);
  ok(inTail > 0, "relief past the final instalment is carried in the tail");
  ok(Math.abs(inSchedule + inTail - trShort.savedInterest) < 1,
    "schedule plus tail accounts for every rupee of interest relief");

  // each regime offers its own slabs, and only its own
  ok(SLABS.new.includes(25) && !SLABS.old.includes(25), "25% exists in the new regime only");
  ok(!SLABS.old.includes(10) && !SLABS.old.includes(15), "10% and 15% are not old-regime slabs");
  ok(nearestSlab(15, "old") === 20, "switching to the old regime snaps to a real slab");
  ok(nearestSlab(25, "old") === 20, "an exact tie rounds down rather than flattering the relief");

  // ---- PR #7 fifth review ----
  // a hair of shortfall must read as 0%, never as a negative flat rate
  const nearShort = solve(Object.assign({}, stBase, { mode: "rate", rateType: "flat",
    amount: 100, tenure: 1, emi: 99.51 }));
  ok(!nearShort.error, "a near-equal flat cash flow is accepted");
  ok((nearShort.solved.rate ?? 0) >= 0, "and never yields a negative flat rate");
  ok(nearShort.rows.every((x) => x.interest >= -1e-9), "nor a negative interest row");

  // foreclosure terms and the investment assumption are part of a scenario's identity
  const sigA = benchSig(Object.assign({}, stBase, { closeFeePct: 0, investReturn: 0 }));
  ok(benchSig(Object.assign({}, stBase, { closeFeePct: 2, investReturn: 0 })) !== sigA,
    "a different foreclosure charge is a different scenario");
  ok(benchSig(Object.assign({}, stBase, { closeFeePct: 0, investReturn: 12 })) !== sigA,
    "a different investment assumption is a different scenario");
  ok(Object.keys(snapshot()).includes("moraPhase"), "the holiday's nature is snapshotted");

  // a payment holiday after possession is claimed as it accrues; only pre-possession defers
  const holidayRows = simulate(2.5e6, 9, 240, E9, "arrears",
    Object.assign({ moraMonths: 24, moraType: "interest" }, base)).rows;
  const asPrecon = taxRelief(holidayRows, 30, "self", 2.5e6, "old", true);
  const asHoliday = taxRelief(holidayRows, 30, "self", 2.5e6, "old", false);
  ok(Math.abs(asPrecon.saved - asHoliday.saved) > 1,
    "deferring pre-construction interest changes the relief");
  ok(asHoliday.perMonthI.slice(0, 8).some((v) => v > 0),
    "a post-possession holiday claims relief in the year it accrues");

  // 80C is split by the balance mix at the time of each repayment, not one lifetime ratio
  const capRows = simulate(2.5e6, 9, 240, E9, "arrears",
    Object.assign({ moraMonths: 12, moraType: "full", lumps: [{ month: 2, amount: 4e5 }] }, base)).rows;
  const trEarly = taxRelief(capRows, 30, "self", 2.5e6, "old", true);
  ok((trEarly.saved - trEarly.savedInterest) <= 2.5e6 * 0.30 + 1,
    "80C still cannot exceed the sum borrowed with an early holiday lump");

  // the bench must agree with the main panel exactly — it runs the same solve()
  const snapA = Object.assign(snapshot(), { amount: 2.5e6, rate: 9, tenure: 240, fees: 0, mode: "emi",
    rateType: "reducing", scheme: "arrears", startY: 2026, startM: 0, moraMonths: 0, extraMonthly: 0,
    lumps: [], rateSteps: [], prepayMode: "tenure" });
  const evA = benchEval(snapA);
  ok(Math.abs(evA.emi - E9) < 1, "bench EMI matches the calculator");
  ok(evA.months === 240 && Math.abs(evA.total - (2.5e6 + evA.interest)) < 1, "bench totals add up");
  // a cheaper rate must win on total outgo, and fees must show up in the APR
  const snapB = Object.assign({}, snapA, { rate: 8.4, fees: 25000 });
  const evB = benchEval(snapB);
  ok(evB.total < evA.total, "the cheaper rate wins on total outgo");
  ok(evB.apr > 8.4, "fees push the APR above the headline rate");
  ok(bestIndex([evA.total, evB.total], true) === 1, "bestIndex picks the cheaper scenario");
  ok(bestIndex([100, 100, 100], true) === -1, "bestIndex refuses to crown a tie");
  ok(bestIndex([evA.months, evB.months], true) === -1, "equal tenures are not a win");
  // a fraction of a percentage point is a real difference, not float noise
  ok(bestIndex([9, 8.54, 8.68], true) === 1, "small rate gaps still pick a winner");

  // flat-rate loan: total repayment is P + P·f·years, and it is far dearer than the same reducing rate
  const fe = flatEmi(1e6, 8, 60);
  ok(Math.abs(fe * 60 - (1e6 + 1e6 * 0.08 * 5)) < 1, "flat total repayment");
  const fs = flatSchedule(1e6, 8, 60, fe, 2026, 0);
  ok(fs.length === 60 && fs[59].balance < 1e-6, "flat schedule closes to zero");
  ok(fs.every((x) => Math.abs(x.emi - fe) < 0.01), "a level flat schedule pays the same every month");
  // solving for tenure keeps the EMI the user typed, with a smaller final instalment
  const fsT = flatSchedule(1e6, 8, 55, 20000, 2026, 0);
  ok(fsT.slice(0, -1).every((x) => Math.abs(x.emi - 20000) < 0.01), "entered flat EMI is preserved");
  ok(fsT[fsT.length - 1].emi <= 20000 + 0.01, "the last flat instalment is a part payment");
  ok(irrMonthly(1e6, fs.map((x) => x.emi), "arrears") * 1200 > 14, "flat 8% is over 14% reducing");

  // IRR agrees with the nominal rate when there are no fees, whatever reshapes the payments
  const flowsOf = (s) => s.rows.map((x) => x.emi + x.extra);
  ok(Math.abs(irrMonthly(2.5e6, flowsOf(plain), "arrears") * 1200 - 9) < 0.01, "IRR of a plain loan is the nominal rate");
  ok(Math.abs(irrMonthly(2.5e6, flowsOf(lump), "arrears") * 1200 - 9) < 0.01, "prepayment doesn't change the IRR");
  ok(Math.abs(irrMonthly(2.5e6, flowsOf(mora), "arrears") * 1200 - 9) < 0.01, "a Pre-EMI holiday doesn't change the IRR");
  // fees are money you never receive, so they push the APR above the headline rate
  ok(irrMonthly(2.5e6 - 5e4, flowsOf(plain), "arrears") * 1200 > 9.1, "fees lift the APR above the nominal rate");
  ok(isNaN(irrMonthly(2.5e6, [100, 100], "arrears")), "no rate fits payments that never repay the principal");

  // negative amortisation is caught rather than looped on
  ok(simulate(1e6, 12, 240, 100, "arrears", base).negAm, "negative amortisation detected");}

// ---------------------------------------------------------------- property checks
/* A deterministic sweep over feature COMBINATIONS. Every review round found bugs where two
   features met, so these assert invariants that must hold for any of them rather than checking
   one worked example. Seeded, so a failure is reproducible. */

const BASE = {
  mode: "emi", currency: "INR", rateType: "reducing", scheme: "arrears",
  startY: 2026, startM: 0, amount: 2.5e6, rate: 9, tenure: 240, emi: 0, fees: 0,
  moraMonths: 0, moraType: "interest", extraMonthly: 0, lumps: [], rateSteps: [],
  prepayMode: "tenure", taxSlab: 0, propType: "self", taxRegime: "old",
};

const AXES = {
  rateType: ["reducing", "flat"],
  scheme: ["arrears", "advance"],
  moratorium: [
    { moraMonths: 0 },
    { moraMonths: 12, moraType: "interest" },
    { moraMonths: 12, moraType: "full" },
  ],
  prepay: [
    { extraMonthly: 0, lumps: [] },
    { extraMonthly: 5000, lumps: [] },
    { extraMonthly: 0, lumps: [{ month: 6, amount: 3e5 }] },     // inside a holiday
    { extraMonthly: 2000, lumps: [{ month: 60, amount: 5e5 }] },
  ],
  prepayMode: ["tenure", "emi"],
  rateSteps: [[], [{ month: 25, rate: 11 }], [{ month: 25, rate: 7 }]],
  fees: [0, 25000],
  tenure: [36, 240],
};

function* combos() {
  for (const rateType of AXES.rateType)
    for (const scheme of AXES.scheme)
      for (const mora of AXES.moratorium)
        for (const prepay of AXES.prepay)
          for (const prepayMode of AXES.prepayMode)
            for (const rateSteps of AXES.rateSteps)
              for (const fees of AXES.fees)
                for (const tenure of AXES.tenure)
                  yield Object.assign({}, BASE, mora, prepay,
                    { rateType, scheme, prepayMode, rateSteps, fees, tenure });
}

function properties() {
  let checked = 0, skipped = 0;
  const fail = (name, st) => failures.push(`${name} :: ${JSON.stringify({
    rateType: st.rateType, scheme: st.scheme, mora: st.moraMonths, moraType: st.moraType,
    extra: st.extraMonthly, lumps: st.lumps.length, prepayMode: st.prepayMode,
    steps: st.rateSteps.length, fees: st.fees, tenure: st.tenure,
  })}`);

  for (const st of combos()) {
    const r = solve(st);
    if (r.error) { skipped++; continue; }        // a refused combination is a valid outcome
    checked++;
    const rows = r.rows;
    const interest = rows.reduce((a, x) => a + x.interest, 0);
    const cash = rows.reduce((a, x) => a + x.emi + x.extra, 0);
    const amortised = rows.reduce((a, x) => a + x.principal + x.extra, 0);

    // 1. the money you hand over is the money you borrowed plus the interest you were charged.
    //    This one invariant covers the capitalised-interest double count in every guise.
    if (Math.abs(cash - (r.P + interest)) > 2) fail("cash != principal + interest", st);

    // 2. the schedule must actually clear the debt
    if (rows[rows.length - 1].balance > 0.5) fail("loan does not close", st);

    // 3. no row may invent money: what is paid is interest + principal + prepayment
    for (const x of rows) {
      if (Math.abs(x.emi - (x.interest + x.principal)) > 0.01 && !x.mora) {
        fail("row emi != interest + principal", st); break;
      }
      if (x.principal < -1e-6 || x.extra < -1e-6 || x.interest < -1e-6) {
        fail("negative component in a row", st); break;
      }
    }

    // 4. amortised >= borrowed, and they differ only when a full holiday capitalises interest
    if (amortised < r.P - 1) fail("amortised less than borrowed", st);
    if (!(st.moraMonths > 0 && st.moraType === "full") && Math.abs(amortised - r.P) > 2) {
      fail("amortised drifted from borrowed without capitalisation", st);
    }

    // 5. keeping the end date must not finish early, and finishing early must not run late
    if (st.prepayMode === "emi" && st.rateType === "reducing" && !st.rateSteps.length
        && rows.filter((x) => !x.mora).length > st.tenure + 1) {
      fail("reduce-EMI mode overran its term", st);
    }

    // 6. APR is a real number and at least the nominal rate once fees are charged
    const flows = rows.map((x) => x.emi + x.extra);
    const apr = irrMonthly(r.P - st.fees, flows, st.rateType === "flat" ? "arrears" : st.scheme) * 1200;
    if (Number.isNaN(apr)) fail("APR came back NaN", st);
    else if (st.fees > 0 && st.rateType === "reducing" && !st.rateSteps.length && apr < st.rate - 0.01) {
      fail("fees did not raise the APR", st);
    }

    // 7. the bench must report exactly what the main panel computes
    const b = computeBench(st);
    if (b.error) fail("bench refused what solve accepted", st);
    else {
      if (Math.abs(b.total - (r.P + interest + st.fees)) > 2) fail("bench total disagrees", st);
      if (b.months !== rows.length) fail("bench tenure disagrees", st);
    }

    // 8. a flat snapshot must not advertise terms the flat branch ignores
    const snapKeys = benchSig(st);
    if (typeof snapKeys !== "string") fail("benchSig is not stable", st);

    // 9. tax relief never exceeds the statutory ceilings, and its two halves reconcile
    for (const regime of ["old", "new"]) {
      const tr = taxRelief(rows, 30, "self", r.P, regime, st.moraMonths > 0);
      if (!tr) continue;
      const inSched = tr.perMonthI.reduce((a, x) => a + x, 0);
      const inTail = tr.tail.reduce((a, x) => a + (x || 0), 0);
      if (Math.abs(inSched + inTail - tr.savedInterest) > 1) {
        fail(`relief leaks (${regime})`, st);
      }
      if (tr.savedInterest > tr.saved + 1) fail(`interest relief exceeds total (${regime})`, st);
      const years = Math.ceil(rows.length / 12) + 6;
      if (tr.savedInterest > 2e5 * 0.30 * years + 1) fail(`Sec 24 exceeded its cap (${regime})`, st);
    }
  }

  // 10. prepay-vs-invest: both paths must commit identical cash, whatever the features
  for (const st of combos()) {
    if (st.rateType === "flat") continue;                 // flat ignores prepayments by design
    if (!(st.extraMonthly > 0 || st.lumps.length)) continue;
    const r = solve(st);
    if (r.error || !r.noPrepayRows) continue;
    /* Mirror the guard in prepayVsInvest(): the comparison is only meaningful, and only shown,
       when prepaying actually shortens the loan. In "lower the EMI" mode the end date is fixed by
       design, so there is no freed period to invest and the panel stays hidden. */
    /* A prepayment must never make the loan longer or dearer. It need not always save a whole
       month though — ₹2,000 against an ₹80,000 instalment on a 3-year term saves real interest
       without clearing a full period, which is why this asserts direction rather than a month. */
    const interestWith = r.rows.reduce((a, x) => a + x.interest, 0);
    const interestWithout = r.noPrepayRows.reduce((a, x) => a + x.interest, 0);
    if (r.noPrepayMonths < r.rows.length) fail("a prepayment made the loan longer", st);
    if (interestWith > interestWithout + 1) fail("a prepayment increased the interest", st);
    if (r.noPrepayMonths <= r.rows.length) continue;   // no freed period, so nothing to compare
    const nBase = r.noPrepayMonths;
    const budgetOf = (rows) => {
      let t = 0;
      for (let i = 0; i < nBase; i++) {
        const lump = st.lumps.reduce((a, l) => a + (l.month === i + 1 ? l.amount : 0), 0);
        const budget = r.noPrepayEmi + st.extraMonthly + lump;
        const paid = i < rows.length ? rows[i].emi + rows[i].extra : 0;
        t += Math.max(0, budget - paid) + Math.min(budget, paid);
      }
      return t;
    };
    if (Math.abs(budgetOf(r.rows) - budgetOf(r.noPrepayRows)) > 2) {
      fail("prepay and invest paths commit different cash", st);
    }
    // and at a 0% return prepaying can never lose, since it saves real interest
    const ic = investCompare(r.rows, r.noPrepayRows, nBase, r.noPrepayEmi, st.extraMonthly, st.lumps, 0);
    if (ic.prepay < ic.invest - 2) fail("prepaying loses at a 0% return", st);
  }

  // 11. money round-trips through every locale it is displayed in
  for (const code of ["INR", "USD", "EUR", "GBP"]) {
    S.currency = code;
    for (const v of [0, 1, 999, 1000, 250000, 2500000, 12345678]) {
      const shown = new Intl.NumberFormat(
        { INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB" }[code],
        { maximumFractionDigits: 0 }).format(v);
      if (parseMoney(shown) !== v) failures.push(`${code}: "${shown}" parsed as ${parseMoney(shown)}, want ${v}`);
    }
  }
  S.currency = "INR";

  // 12. a winner is only ever awarded to a strictly unique best value
  const draws = [[1, 1], [0, 0, 5], [3, 3, 3], [2, 1, 1], [5, 5, 1, 5]];
  for (const d of draws) {
    const i = bestIndex(d, true);
    if (i >= 0) {
      const w = d[i];
      if (d.filter((v) => Math.abs(v - w) <= Math.max(Math.abs(w) * 1e-9, 1e-9)).length > 1) {
        failures.push(`bestIndex crowned a shared value in [${d}]`);
      }
    }
  }
  return { checked, skipped };
}

examples();
const { checked, skipped } = properties();

const width = 62;
console.log("─".repeat(width));
console.log(`EMI engine — ${passed} example assertions, ${checked} combinations checked (${skipped} refused)`);
if (failures.length) {
  console.log("─".repeat(width));
  for (const f of [...new Set(failures)]) console.log("  FAIL  " + f);
  console.log("─".repeat(width));
  console.log(`${new Set(failures).size} distinct failure(s), ${failures.length} total`);
  process.exit(1);
}
console.log("all green");
console.log("─".repeat(width));
