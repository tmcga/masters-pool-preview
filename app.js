// ════════════════════════════════════════════════════════
// ██  CONFIG  ██
// ════════════════════════════════════════════════════════
//
// JSDoc typedefs for the structures we move around the app. Editors (VS Code)
// pick these up for IntelliSense and inline error hints without any build step.
// Add `// @ts-check` to the very top of this file to upgrade to full type checking.

/**
 * @typedef {Object} Score - One golfer's live state from ESPN
 * @property {string|number|null} tp - Score to par (numeric, "WD"/"CUT" sentinel, or null pre-round)
 * @property {string} st - Status: '' (active), 'WD', or 'CUT'
 * @property {string} thru - Display status like "F" or "Round 1 - In Progress"
 * @property {string} pos - Position string like "T5" or "1"
 * @property {number} mv - Movement (positive = moved up the board)
 * @property {?number} hole - Current hole if playing, else null
 * @property {string} headshot
 * @property {string} flag
 * @property {string} country
 * @property {Array<{rd:number,score:number,toPar:string,front:?number,back:?number}>} rounds
 * @property {string} teeTime - ISO timestamp
 * @property {number} startHole - 1 or 10
 * @property {boolean} amateur
 * @property {number} earnings - Official prize money from ESPN (0 until STATUS_FINAL)
 */

/**
 * @typedef {Object} Participant - One pool entry
 * @property {string} name
 * @property {string} winner
 * @property {string} alternate
 * @property {string[]} picks - Length 21
 */

// Entry form: Google-Form embed is being replaced by a Firebase-backed form.
// The iframe wiring below is a no-op until the new form is built.
const FORM_EMBED_URL = "";

// Picks lock at first tee
const REVEAL_DATE = new Date('2026-06-18T06:45:00-04:00');
const FORCE_REVEAL = true;  // set true to bypass lock for testing
const FORCE_LIVE = true;    // set true to force the Forecast view with demo data when ESPN reports pre-tournament (preview repo only)

// ════════════════════════════════════════════════════════
// Odds — Polymarket live + hardcoded fallback
// ════════════════════════════════════════════════════════
// TODO: verify the Polymarket event slug once their 2026 U.S. Open market goes live.
// Markets typically open ~6 weeks out. Visit polymarket.com, search "US Open golf",
// and grab the event slug from the URL (events/<slug>).
const POLYMARKET_SLUG = 'us-open-golf-winner-2026';
const GAMMA_API = 'https://gamma-api.polymarket.com';
let oddsSource = 'static';  // 'static' | 'polymarket'

// Fallback odds (American format) — used pre-Polymarket-launch and as the source of the
// golfer LIST that the entry form picker shows.
// ⚠️ The numerical odds below are stale 2026 Masters DraftKings values and are NOT
// representative of U.S. Open futures. Polymarket auto-overrides once that market opens
// (~6 weeks out), at which point the odds become real. For now, the values are wrong but
// the LIST (which is what matters for the entry form picker) has been pruned to plausible
// U.S. Open contenders.
// TODO: paste a fresh DraftKings 2026 U.S. Open futures snapshot here when lines drop.
// REMOVED in cleanup: Masters past-champion exemption-only players (Couples, Weir,
// Olazábal, Schwartzel, V. Singh, Bubba, Z. Johnson, Cabrera, D. Willett) and the
// Masters-only amateur invitees (Latin America Amateur, Asia-Pacific Amateur, US
// Mid-Am, etc.: Howell, Pulcini, Herrington, Holtz, Fang, Laopakdee, Kataoka, Jarvis).
const FALLBACK_ODDS = {
  "Scottie Scheffler":"+410","Jon Rahm":"+850","Rory McIlroy":"+1025",
  "Bryson DeChambeau":"+1100","Ludvig Åberg":"+1750","Xander Schauffele":"+1850",
  "Cameron Young":"+2350","Tommy Fleetwood":"+2500","Matt Fitzpatrick":"+2600",
  "Collin Morikawa":"+3100","Justin Rose":"+3600","Jordan Spieth":"+3800",
  "Brooks Koepka":"+3800","Hideki Matsuyama":"+3900","Robert MacIntyre":"+4000",
  "Russell Henley":"+4200","Chris Gotterup":"+4300","Patrick Reed":"+4500",
  "Viktor Hovland":"+4600","Si Woo Kim":"+4700","Min Woo Lee":"+5400",
  "Justin Thomas":"+5500","Patrick Cantlay":"+5700","Adam Scott":"+6200",
  "Akshay Bhatia":"+6500","Sepp Straka":"+6700","Jason Day":"+6900",
  "Jake Knapp":"+6900","Tyrrell Hatton":"+6900","Shane Lowry":"+7000",
  "Sam Burns":"+7200","Corey Conners":"+8200","Nicolai Hojgaard":"+8400",
  "Kurt Kitayama":"+8800","Jacob Bridgeman":"+9400","Maverick McNealy":"+9800",
  "Cameron Smith":"+10000","Harris English":"+10500","Gary Woodland":"+11000",
  "Ben Griffin":"+11000","Daniel Berger":"+11000","Max Homa":"+11500",
  "Im Sung-jae":"+12000","J.J. Spaun":"+12000","Rasmus Højgaard":"+13000",
  "Keegan Bradley":"+14000","Harry Hall":"+16000","Marco Penge":"+16000",
  "Alex Noren":"+16000","Ryan Gerard":"+17000","Nick Taylor":"+19500",
  "Aaron Rai":"+19500","Brian Harman":"+20000","Sam Stevens":"+21000",
  "Ryan Fox":"+22000","Sergio García":"+22500","Wyndham Clark":"+22500",
  "Max Greyserman":"+23000","Dustin Johnson":"+24000",
  "Carlos Ortiz":"+26000","Tom McKibbin":"+27500","Haotong Li":"+28000",
  "Nico Echavarría":"+31000","Kristoffer Reitan":"+31000",
  "Rasmus Neergaard-Petersen":"+32500","Johnny Keefer":"+34000",
  "Michael Kim":"+40000","Andrew Novak":"+40000","Aldrich Potgieter":"+41000",
  "Michael Brennan":"+42500","Sami Välimäki":"+52500","Davis Riley":"+57500",
  "Brian Campbell":"+250000"
};
let ODDS = {...FALLBACK_ODDS};
// Sync odds for name variants
if(!ODDS["Sungjae Im"]&&ODDS["Im Sung-jae"])ODDS["Sungjae Im"]=ODDS["Im Sung-jae"];
if(!ODDS["Nicolai Højgaard"]&&ODDS["Nicolai Hojgaard"])ODDS["Nicolai Højgaard"]=ODDS["Nicolai Hojgaard"];

/**
 * Convert a decimal probability (0..1) to American odds string ("+410", "-120").
 * @param {number} p
 * @returns {string}
 */
function probToAmerican(p){
  if(!p||p<=0||p>=1)return'+99999';
  // American odds: underdog (p<0.5) = +((1/p - 1) * 100), favorite (p>=0.5) = -(p/(1-p) * 100)
  if(p>=0.5){const v=Math.round((p/(1-p))*100);return'-'+v;}
  const v=Math.round(((1-p)/p)*100);return'+'+v;
}
/**
 * Convert American odds (string like "+410" or "-120", or number) to implied probability (0..1).
 * Returns 0 for null/empty/malformed input.
 * @param {string|number|null|undefined} a
 * @returns {number}
 */
function americanToProb(a){
  if(a===null||a===undefined||a==='')return 0;
  const n=parseInt(String(a).replace(/[^\d-]/g,''));
  if(isNaN(n)||n===0)return 0;
  if(String(a).trim().startsWith('-')||n<0)return Math.abs(n)/(Math.abs(n)+100);
  return 100/(n+100);
}
// Opening odds snapshot — captured from FALLBACK_ODDS at page load, used as baseline for Δ Odds
const OPENING_ODDS={...FALLBACK_ODDS};
// Sync alias entries into opening snapshot
if(!OPENING_ODDS["Sungjae Im"]&&OPENING_ODDS["Im Sung-jae"])OPENING_ODDS["Sungjae Im"]=OPENING_ODDS["Im Sung-jae"];
if(!OPENING_ODDS["Nicolai Højgaard"]&&OPENING_ODDS["Nicolai Hojgaard"])OPENING_ODDS["Nicolai Højgaard"]=OPENING_ODDS["Nicolai Hojgaard"];
function getOpeningOdds(name){
  if(OPENING_ODDS[name])return OPENING_ODDS[name];
  const norm=normName(name);
  for(const k of Object.keys(OPENING_ODDS)){if(normName(k)===norm)return OPENING_ODDS[k];}
  return'';
}

async function fetchPolymarket(){
  // Cache-buster prevents stale CDN responses on repeated polls
  const cb=Date.now();
  const urls=[
    `${GAMMA_API}/events?slug=${POLYMARKET_SLUG}&_t=${cb}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`${GAMMA_API}/events?slug=${POLYMARKET_SLUG}&_t=${cb}`)}`
  ];
  for(const url of urls){
    try{
      const r=await fetch(url,{cache:'no-store'});if(!r.ok)continue;
      const data=await r.json();
      if(!Array.isArray(data)||data.length===0)continue;
      const evt=data[0];
      if(!evt.markets||evt.markets.length===0)continue;
      const newOdds={};
      for(const m of evt.markets){
        const name=m.groupItemTitle;
        if(!name||name==='Other'||m.negRiskOther)continue;
        const prices=JSON.parse(m.outcomePrices||'[]');
        const prob=parseFloat(prices[0])||0;
        if(prob>0)newOdds[name]=probToAmerican(prob);
      }
      if(Object.keys(newOdds).length>5){
        ODDS=newOdds;oddsSource='polymarket';
        // Sync name variants in polymarket odds
        if(!ODDS["Im Sung-jae"]&&ODDS["Sungjae Im"])ODDS["Im Sung-jae"]=ODDS["Sungjae Im"];
        if(!ODDS["Sungjae Im"]&&ODDS["Im Sung-jae"])ODDS["Sungjae Im"]=ODDS["Im Sung-jae"];
        if(!ODDS["Nicolai Hojgaard"]&&ODDS["Nicolai Højgaard"])ODDS["Nicolai Hojgaard"]=ODDS["Nicolai Højgaard"];
        if(!ODDS["Nicolai Højgaard"]&&ODDS["Nicolai Hojgaard"])ODDS["Nicolai Højgaard"]=ODDS["Nicolai Hojgaard"];
        console.log(`[US Open Pool] Polymarket odds loaded: ${Object.keys(newOdds).length} golfers`);
        return true;
      }
    }catch(e){continue;}
  }
  return false;
}

function oddsColor(o){ const n=parseInt(o); if(isNaN(n))return'odds-field'; if(Math.abs(n)<=1200)return'odds-fav'; if(Math.abs(n)<=5000)return'odds-mid'; if(Math.abs(n)<=20000)return'odds-long'; return'odds-field'; }
// Fuzzy odds lookup — tries direct, then normalized match against all odds keys
function getOdds(name){
  if(ODDS[name])return ODDS[name];
  const norm=normName(name);
  for(const k of Object.keys(ODDS)){if(normName(k)===norm)return ODDS[k];}
  return'';
}

// ════════════════════════════════════════════════════════
// State
// ════════════════════════════════════════════════════════
let scores={}, tourneyStatus='idle', roundLabel='', currentRound=0, expanded=new Set(), expandedGolfers=new Set(), liveParts=[], espnCutScore=null;

// ── HTML escape (prevent XSS from user-submitted names) ──
// Escapes everything that could break out of either HTML attribute contexts (double-quoted)
// or JS string literals inside on* handlers (single-quoted or backtick). Don't be tempted
// to drop the single-quote escape — Firestore-doc-ID flows into onclick="...('${esc(id)}')".
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;');

// ── Tab nav ──────────────────────────────────────────────
function showTab(name,btn){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  btn.classList.add('active');
  if(name==='odds') renderOdds();
  if(name==='stats') renderStats();
}

// ── Name normalization ───────────────────────────────────
// Strip diacritics, ø, dots, and hyphens; lowercase; collapse whitespace.
// "J.J. Spaun" / "J. J. Spaun" → "jj spaun" / "j j spaun" (the latter handled by aliases below).
// "Hao-Tong Li" / "Haotong Li" → both → "haotong li".
const normName=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[øØ]/g,'o').toLowerCase().replace(/[.\-]/g,'').replace(/\s+/g,' ').trim();
// Alias groups: all normalized variants of the same golfer (post-normName form).
// Used to bridge ESPN <-> Polymarket <-> picks.json name differences.
const NAME_ALIAS_GROUPS=[
  ['sungjae im','im sungjae'],                    // ESPN/picks vs polymarket word order
  ['fifa laopakdee','pongsapak laopakdee'],       // nickname vs legal name
  ['nicolai hojgaard','nicolai højgaard'],        // ø handled by normName, kept defensively
  ['nico echavarria','nicolas echavarria'],       // polymarket uses long form
  ['alex noren','alexander noren'],               // polymarket uses long form
  ['jj spaun','j j spaun'],                       // polymarket "J. J. Spaun" → "j j spaun"
];
const nameMap={};
function buildNameMap(){
  for(const k of Object.keys(scores))nameMap[normName(k)]=k;
  // For each alias group, find the ESPN name and map all variants to it
  for(const group of NAME_ALIAS_GROUPS){
    const espnKey=group.find(g=>nameMap[g]);
    if(!espnKey)continue;
    const espnName=nameMap[espnKey];
    for(const alias of group){if(!nameMap[alias])nameMap[alias]=espnName;}
  }
}
function resolveName(n){const norm=normName(n);return nameMap[norm]||n;}
function warnUnmatched(){
  if(!hasScores())return;
  for(const p of liveParts){
    for(const g of [p.alternate,...p.picks]){
      if(g&&!scores[g]&&!scores[resolveName(g)])console.warn(`[US Open Pool] No ESPN match for pick: "${g}"`);
    }
  }
}

// ── Score helpers ────────────────────────────────────────
function fmt(v){
  if(v===null||v===undefined) return '<span class="sna">—</span>';
  const s=String(v).trim().toUpperCase();
  if(s==='WD') return '<span class="swd">WD</span>';
  if(s==='CUT'||s==='MC') return '<span class="scut">CUT</span>';
  const n=parseInt(v);
  if(!isNaN(n)){if(n<0)return`<span class="su">${n}</span>`;if(n>0)return`<span class="so">+${n}</span>`;return'<span class="se">E</span>';}
  if(s==='E') return '<span class="se">E</span>';
  return`<span class="se">${v}</span>`;
}
function getScore(n){return scores[n]||scores[resolveName(n)]||null;}
const isWD=n=>{const s=getScore(n);return s&&(s.st==='WD'||String(s.tp).toUpperCase()==='WD');};
const isCut=n=>{const s=getScore(n);return s&&s.st==='CUT';};
const isAmateur=n=>{const s=getScore(n);return!!(s&&s.amateur);};
function fmtGolfer(n){
  if(!hasScores())return'—';const s=getScore(n);if(!s)return'<span class="sna">—</span>';
  if(!isTourneyActive())return'<span class="sna">—</span>';
  const money=calcPrizeMoney(n);
  const parVal=parseTp(s.tp);const parStr=isWD(n)?'WD':isCut(n)?'CUT':isNaN(parVal)?'—':parVal<0?''+parVal:parVal===0?'E':'+'+parVal;
  if(money>0)return`<span class="smoney">$${money.toLocaleString()}</span> <span class="sq-score-par">(${parStr})</span>`;
  if(isWD(n))return'<span class="swd">WD</span>';
  if(isCut(n))return isAmateur(n)?'<span class="scut">CUT · $0 (am)</span>':'<span class="scut">CUT · $0</span>';
  return`${fmt(s.tp)} <span class="sq-score-par">$0</span>`;
}
function fmtMoney(v){if(v===null||v===undefined)return'<span class="sna">—</span>';if(typeof v==='number'){if(v===0)return'<span class="scut">$0</span>';return`<span class="smoney">$${v.toLocaleString()}</span>`;}return`<span class="se">${v}</span>`;}
function fmtTeamTotal(v){if(v===null||v===undefined)return'<span class="sna">—</span>';if(v===0)return'<span class="sna">$0</span>';return`<span class="smoney">$${Number(v).toLocaleString()}</span>`;}
function numScore(n){const s=getScore(n);if(!s||isWD(n))return 0;const v=parseTp(s.tp);return isNaN(v)?0:v;}
function num(n){return calcPrizeMoney(n);}
/**
 * Sum a team's prize money. If any pick W/D'd, the alternate substitutes in once.
 * (Two or more W/Ds = the surplus contributes $0; alternate only ever subs once.)
 * @param {Participant} p
 * @returns {{t: number, ua: boolean}} total prize money + whether alternate was used
 */
function calcTeam(p){const sc=[...p.picks];let t=0,ua=false;for(const g of sc){if(isWD(g)&&!ua){t+=num(p.alternate);ua=true;}else t+=num(g);}return{t,ua};}
/**
 * Sum a team's score-to-par across picks (same WD/alt substitution rule).
 * @param {Participant} p
 * @returns {number}
 */
function calcTeamScore(p){let t=0,ua=false;for(const g of p.picks){if(isWD(g)&&!ua){t+=numScore(p.alternate);ua=true;}else t+=numScore(g);}return t;}
const hasScores=()=>Object.keys(scores).length>0;
const isTourneyActive=()=>tourneyStatus==='live'||tourneyStatus==='final'||tourneyStatus==='demo';

// ── Prize money (placeholder baseline — UPDATE when 2026 U.S. Open purse + breakdown announced) ──
// U.S. Open structure: top 60 + ties make the cut; flat MC payout to professional non-qualifiers.
// 2024 (Pinehurst) / 2025 (Oakmont) purse was $21.5M with ~$4.3M to the winner.
// TODO Friday/Saturday 2026-06-19→20: USGA publishes the official 2026 purse + 60-position
// payout breakdown after R2. Update USOPEN_PURSE, USOPEN_MC_PAYOUT, and every entry in
// USOPEN_PAYOUTS below. ESPN's c.earnings field overrides this at STATUS_FINAL anyway,
// so the table only matters for in-tournament projections.
// Numbers below are scaled placeholders — VERIFY against the official 2025 U.S. Open
// payout table (Oakmont) before play begins.
const USOPEN_PURSE=21500000;
// U.S. Open: flat ~$10,000 to professionals who miss the cut. Amateurs get $0.
const USOPEN_MC_PAYOUT=10000;
const USOPEN_PAYOUTS=[
  4300000,2322000,1461365,1016138,848290,756400,703900,651400,609400,567400,   // 1-10
  525400,483400,441400,399400,378400,357400,336400,315400,294400,273400,        // 11-20
  252400,235600,218800,202000,185200,168400,162100,155800,149500,143200,        // 21-30
  136900,130600,124300,119050,113800,108550,103300,99100,94900,90700,           // 31-40
  86500,82300,78100,73900,69700,65500,61300,57940,55000,53320,                  // 41-50
  51000,49000,47500,46000,44500,43000,41500,40000,38500,37000                   // 51-60
];
/**
 * Parse an ESPN position string ("T5", "12", "-") into structured form.
 * @param {string} posStr
 * @returns {{pos: number, tied: boolean} | null}
 */
function parsePos(posStr){
  if(!posStr)return null;
  const s=String(posStr).trim();
  const tied=s.startsWith('T');
  const n=parseInt(tied?s.slice(1):s);
  if(isNaN(n)||n<1)return null;
  return{pos:n,tied};
}
/**
 * Compute prize money for a single golfer.
 * Cascade: WD → $0; CUT pro → flat MC payout, amateur → $0; ESPN earnings at FINAL → use that;
 * else look up by position in USOPEN_PAYOUTS, splitting ties evenly.
 * @param {string} name
 * @returns {number}
 */
function calcPrizeMoney(name){
  const s=getScore(name);
  if(!s)return 0;
  if(isWD(name))return 0;
  // U.S. Open rule: missed-cut professionals get a flat MC payout (~$10k); amateurs are ineligible.
  if(isCut(name))return isAmateur(name)?0:USOPEN_MC_PAYOUT;
  // Prefer ESPN's own earnings field when it's populated (happens at STATUS_FINAL
  // Sunday evening). This guarantees exact 2026 numbers even if our hand-maintained
  // USOPEN_PAYOUTS hasn't been updated. Falls through to position-based lookup
  // during play when earnings=0.
  if(s.earnings>0)return s.earnings;
  const parsed=parsePos(s.pos);
  if(!parsed)return 0;
  const{pos,tied}=parsed;
  if(pos>USOPEN_PAYOUTS.length)return 0;
  if(!tied)return USOPEN_PAYOUTS[pos-1];
  // Ties: count golfers sharing this position, average their payout slots
  let numTied=0;
  for(const[,sc]of Object.entries(scores)){
    if(sc.st==='WD'||sc.st==='CUT')continue;
    const p=parsePos(sc.pos);
    if(p&&p.pos===pos)numTied++;
  }
  if(numTied<2)numTied=2;
  let totalPayout=0;
  for(let i=pos-1;i<pos-1+numTied&&i<USOPEN_PAYOUTS.length;i++)totalPayout+=USOPEN_PAYOUTS[i];
  return Math.round(totalPayout/numTied);
}

// ── Win probability ─────────────────────────────────────
function normalCDF(x){
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign=x<0?-1:1;x=Math.abs(x)/Math.SQRT2;
  const t=1/(1+p*x);const y=1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5*(1+sign*y);
}
// Parse a score-to-par value that could be "-5", "+3", "E", 0, or null → numeric strokes
function parseTp(tp){
  if(tp===null||tp===undefined)return NaN;
  if(typeof tp==='number')return tp;
  const s=String(tp).trim().toUpperCase();
  if(s==='E')return 0;
  if(s==='WD'||s==='CUT'||s==='MC')return NaN;
  const n=parseInt(s);
  return isNaN(n)?NaN:n;
}

// ── Monte Carlo win-probability model ───────────────────
// One unified simulation populates BOTH per-golfer and per-team win probabilities,
// guaranteeing they're internally consistent (computed from the same draws).
//
// Model:
//   For each remaining round, each golfer's score = skill bonus + N(0, σ).
//   Skill bonus is derived from OPENING odds (Polymarket/DraftKings before play),
//   so a +400 favorite is expected to play ~1 stroke/round better than the field
//   median, and a 1000:1 longshot is expected to play ~0.4 strokes/round worse.
//   Final score = current ESPN score + Σ (skill + noise) over remaining rounds.
//   In each sim we rank by final score, compute prize money via USOPEN_PAYOUTS,
//   sum per team, and tally both the golfer winner and the team winner.
let golferWinProbMap={};
let teamWinProbMap={};
const GOLFER_ROUND_SIGMA=3;     // strokes-per-round stdev (PGA Tour empirical ~2.7-3.5)
const MC_SIMULATIONS=2000;      // monte carlo iterations per refresh
const SKILL_SCALE=0.7;          // strokes/round per logit unit above the field median (calibrated to match market odds for top favorites)

// Per-round skill bonus (negative = better than field) derived from opening odds
function golferSkillBonus(name){
  const o=getOpeningOdds(name);
  if(!o)return 0;
  const p=americanToProb(o);
  if(p<=0||p>=1)return 0;
  // logit transform spreads the implied probabilities into a near-linear skill scale.
  // Median PGA pro is roughly p ≈ 0.012 (~1% to win). Use that as the zero point.
  const logit=Math.log(p/(1-p));
  const medianLogit=Math.log(0.012/(1-0.012)); // ≈ -4.40
  return -SKILL_SCALE*(logit-medianLogit);
}

// Box-Muller normal sampler
function _rnorm(){
  let u=0,v=0;
  while(u===0)u=Math.random();
  while(v===0)v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

function runSimulations(){
  golferWinProbMap={};
  teamWinProbMap={};
  if(!hasScores()||!isTourneyActive())return;
  // Active = golfers still capable of earning prize money.
  // Unstarted golfers (tp = "-" / null → NaN) are treated as score=0 (par, all rounds ahead),
  // not 99 over par — otherwise they'd never win in any sim and silently penalize teams that picked them.
  const active=Object.entries(scores).filter(([,s])=>s.st!=='WD'&&s.st!=='CUT').map(([n,s])=>{const v=parseTp(s.tp);return{n,score:isNaN(v)?0:v,skill:golferSkillBonus(n)};});
  if(active.length===0)return;

  // Final state — deterministic, no randomness needed
  if(tourneyStatus==='final'){
    const sorted=active.slice().sort((a,b)=>a.score-b.score);
    if(sorted.length>0)golferWinProbMap[sorted[0].n]=1;
    let bestTeam=null,bestTotal=-1;
    for(const p of liveParts){
      const{t}=calcTeam(p);
      if(t>bestTotal){bestTotal=t;bestTeam=p.name;}
    }
    if(bestTeam)teamWinProbMap[bestTeam]=1;
    return;
  }

  const remRounds=Math.max(4-currentRound+0.5,0.5);
  const noiseSigma=Math.sqrt(remRounds)*GOLFER_ROUND_SIGMA;
  const A=active.length;
  const N=MC_SIMULATIONS;

  // Build name → active-index map and pre-compute per-team contribution plans.
  // Each plan is the list of active-indices that count toward this team's prize total
  // (with WD substitution and CUT-as-zero already resolved from current ESPN data).
  const nameIdx={};
  active.forEach((g,i)=>{nameIdx[g.n]=i;});
  const teamPlans=liveParts.map(p=>{
    let altUsed=false;
    const liveIdxs=[];
    for(const g of (p.picks||[])){
      if(isWD(g)){
        if(!altUsed){
          const ai=nameIdx[resolveName(p.alternate||'')];
          if(ai!==undefined)liveIdxs.push(ai);
          altUsed=true;
        }
        // else: no second sub allowed → contributes 0
      }else if(isCut(g)){
        // CUT golfers earn $0 → skip
      }else{
        const i=nameIdx[resolveName(g)];
        if(i!==undefined)liveIdxs.push(i);
      }
    }
    return{name:p.name,liveIdxs};
  });

  // Pre-allocate scratch buffers reused across sims for speed
  const finalScores=new Float64Array(A);
  const sortedIdxs=new Int32Array(A);
  for(let i=0;i<A;i++)sortedIdxs[i]=i;
  const prize=new Float64Array(A);
  const golferWins=new Int32Array(A);
  const teamWins=new Int32Array(teamPlans.length);

  // Baseline expected score after remaining play (current + skill drift)
  const expected=new Float64Array(A);
  for(let i=0;i<A;i++)expected[i]=active[i].score+remRounds*active[i].skill;

  for(let sim=0;sim<N;sim++){
    // Sample each golfer's final score
    for(let i=0;i<A;i++){
      finalScores[i]=expected[i]+_rnorm()*noiseSigma;
    }
    // Sort active indices by final score ascending (lowest = best)
    // Convert to plain array for .sort closure
    const idx=Array.from(sortedIdxs);
    idx.sort((a,b)=>finalScores[a]-finalScores[b]);
    // Tally golfer winner
    golferWins[idx[0]]++;
    // Compute prize per golfer based on this sim's ranking
    prize.fill(0);
    const cap=Math.min(idx.length,USOPEN_PAYOUTS.length);
    for(let r=0;r<cap;r++)prize[idx[r]]=USOPEN_PAYOUTS[r];
    // Compute each team's total and find the team winner.
    // Random tiebreaker prevents earlier-team-in-iteration-order bias when totals tie.
    let bestTeam=-1,bestTotal=-1;
    for(let t=0;t<teamPlans.length;t++){
      const lp=teamPlans[t].liveIdxs;
      let total=0;
      for(let k=0;k<lp.length;k++)total+=prize[lp[k]];
      if(total>bestTotal||(total===bestTotal&&Math.random()<0.5)){bestTotal=total;bestTeam=t;}
    }
    if(bestTeam>=0)teamWins[bestTeam]++;
  }

  // Materialize results into the maps
  for(let i=0;i<A;i++)golferWinProbMap[active[i].n]=golferWins[i]/N;
  for(let t=0;t<teamPlans.length;t++)teamWinProbMap[teamPlans[t].name]=teamWins[t]/N;
}

// ── ODDS canonicalization ───────────────────────────────
// Rebuild ODDS as a merge of OPENING_ODDS (FALLBACK baseline) + live Polymarket,
// keyed by canonical ESPN names. This:
//   • Drops stale Polymarket markets (Tiger Woods, "Player AJ", etc.)
//   • Unifies Polymarket name variants (J. J. Spaun, Sung-Jae Im, ...) onto ESPN-canonical keys
//   • Ensures every ESPN-field golfer gets SOME odds (Polymarket live > FALLBACK static)
//   • Idempotent and pre-tournament safe (no-ops when scores is empty)
function syncOddsToField(){
  if(!hasScores())return;
  // Snapshot the current live ODDS (which is either Polymarket data or FALLBACK if Polymarket failed)
  const liveOdds=oddsSource==='polymarket'?{...ODDS}:{};
  const cleaned={};
  // 1. Seed with OPENING_ODDS (FALLBACK April 4 DraftKings snapshot) — every match becomes a baseline entry
  for(const[name,odds]of Object.entries(OPENING_ODDS)){
    const canonical=nameMap[normName(name)];
    if(canonical&&scores[canonical])cleaned[canonical]=odds;
  }
  // 2. Overlay live Polymarket odds where available (canonical-keyed) — drops stale, unifies variants
  let liveApplied=0,stale=0;
  for(const[name,odds]of Object.entries(liveOdds)){
    const canonical=nameMap[normName(name)];
    if(canonical&&scores[canonical]){cleaned[canonical]=odds;liveApplied++;}
    else stale++;
  }
  ODDS=cleaned;
  if(liveApplied||stale){
    console.log(`[US Open Pool] ODDS sync: ${Object.keys(cleaned).length} canonical entries (${liveApplied} live Polymarket, ${stale} stale dropped)`);
  }
}

// ── ESPN fetch ───────────────────────────────────────────
async function fetchESPN(){
  for(const url of['https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga','https://corsproxy.io/?url=https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga']){
    try{const r=await fetch(url,{cache:'no-store'});if(!r.ok)continue;parseESPN(await r.json());return true;}catch(e){continue;}
  }
  return false;
}
function parseESPN(data){
  const evts=data.events||[];
  // ESPN's PGA feed names this event "U.S. Open" (with dots) — match on "u.s. open" and "us open" defensively
  const evt=evts.find(e=>{const n=(e.name||'').toLowerCase();return n.includes('u.s. open')||n.includes('us open');});
  if(!evt){console.log('[US Open Pool] U.S. Open not found in ESPN feed yet — skipping');return;}
  const comp=(evt.competitions||[])[0]||{};
  // Tournament lifecycle comes from the EVENT-level status, not the competition-level status.
  // ESPN sets comp.status.type.state='post' between rounds (e.g. "Round 1 - Play Complete"),
  // while evt.status.type stays 'in' / STATUS_IN_PROGRESS for the whole tournament duration.
  // Using comp.status here would incorrectly flip us to 'final' mid-tournament and force
  // runSimulations() into deterministic mode (leader = 100%).
  const evtSt=(evt.status||{}).type||{};
  const compSt=(comp.status||{}).type||{};
  if(evtSt.state==='in'||evtSt.name==='STATUS_IN_PROGRESS'){
    tourneyStatus='live';
    currentRound=comp.status?.period||1;
    // Use competition-level detail ("Round 1 - In Progress" or "Round 1 - Play Complete")
    // because it correctly reflects the micro-state within the current tournament window.
    roundLabel=compSt.detail||`Round ${currentRound} · Live`;
  }
  else if(evtSt.name?.includes('FINAL')||evtSt.state==='post'){tourneyStatus='final';currentRound=4;roundLabel='Final';}
  else{tourneyStatus='pre';currentRound=0;roundLabel=(evtSt.name||'').replace('STATUS_','').replace(/_/g,' ');}
  // ESPN-provided projected cut line (top 50 + ties, recomputed server-side per refresh).
  // evt.tournament.cutScore is the score-to-par of the current 50th-place bubble.
  // Null until ESPN populates it. renderCutTracker + Forecast header prefer this over our local estimate.
  espnCutScore=(typeof evt.tournament?.cutScore==='number')?evt.tournament.cutScore:null;
  const ns={};
  for(const c of(comp.competitors||[])){
    const name=c.athlete?.displayName||'';if(!name)continue;
    const detail=(c.status?.type?.detail||'').toUpperCase();
    let st2='';
    if(detail.includes('WITHDRAW')||detail.includes(' WD'))st2='WD';
    else if(detail.includes('MISSED CUT')||detail.includes('CUT'))st2='CUT';
    let tp=c.statistics?.find(s=>s.name==='scoreToPar')?.displayValue??null;
    if(tp===null)tp=c.score?.displayValue??c.score?.value??null;
    if(st2==='WD')tp=st2;
    const rounds=(c.linescores||[]).filter(l=>l.value).map(l=>({rd:l.period,score:l.value,toPar:l.displayValue||'',front:l.outScore??null,back:l.inScore??null}));
    const pos=c.status?.position?.displayName||'';
    const mv=c.movement||0;
    const hole=c.status?.hole??null;
    const headshot=c.athlete?.headshot?.href||'';
    const flag=c.athlete?.flag?.href||'';
    const country=c.athlete?.flag?.alt||'';
    const teeTime=c.status?.teeTime||'';
    const startHole=c.status?.startHole||1;
    const amateur=!!(c.amateur||c.athlete?.amateur);
    // ESPN populates c.earnings (number) at STATUS_FINAL with the official purse breakdown.
    // ESPN populates official US Open payouts at STATUS_FINAL — overrides USOPEN_PAYOUTS
    // including tie averaging. 0 during play, does NOT include the $25k MC payment.
    const earnings=(typeof c.earnings==='number'&&c.earnings>0)?c.earnings:0;
    ns[name]={tp,st:st2,thru:c.status?.type?.shortDetail||'',pos,mv,hole,headshot,flag,country,rounds,teeTime,startHole,amateur,earnings};
  }
  if(Object.keys(ns).length>0){scores=ns;buildNameMap();}
}
function loadDemo(){
  const pl=["Scottie Scheffler","Rory McIlroy","Collin Morikawa","Viktor Hovland","Justin Thomas","Brooks Koepka","Jon Rahm","Xander Schauffele","Hideki Matsuyama","Jordan Spieth","Tommy Fleetwood","Shane Lowry","Patrick Cantlay","Sam Burns","Tyrrell Hatton","Russell Henley","Ludvig Åberg","Bryson DeChambeau","Wyndham Clark","Cameron Young","Adam Scott","Max Homa","Matt Fitzpatrick"];
  const sc=[-12,-10,-9,-8,-7,-6,-6,-5,-4,-4,-3,-3,-2,-2,-1,-1,0,0,1,2,3,4,5];
  // Assign positions (handling ties for demo)
  let pos=1;
  for(let i=0;i<pl.length;i++){
    if(i>0&&sc[i]!==sc[i-1])pos=i+1;
    const tied=i<pl.length-1&&sc[i]===sc[i+1]||i>0&&sc[i]===sc[i-1];
    scores[pl[i]]={tp:sc[i]??5,st:'',thru:'F',pos:(tied?'T':'')+pos};
  }
  tourneyStatus='demo';roundLabel='Sample Data';buildNameMap();
}

// ── Picks (Firestore-primary, picks.json fallback) ───────
// Primary source: Firestore `entries` collection (written by the entry form).
// Fallback: data/picks.json (the legacy Google-Sheet sync path — kept for emergency rollback).
async function fetchPicks(){
  // 1. Try Firestore first
  if(db){
    try{
      const snap = await db.collection('entries').get();
      if(!snap.empty){
        const parts = snap.docs.map(d=>{
          const x = d.data();
          return {
            name: x.name || d.id,
            winner: x.winner || '',
            alternate: x.alternate || '',
            picks: Array.isArray(x.picks) ? x.picks : [],
          };
        }).filter(p=>p.winner && p.picks.length>0);
        if(parts.length > 0){
          liveParts = parts;
          return true;
        }
      }
    }catch(e){
      console.warn('[US Open Pool] Firestore fetchPicks failed, falling back to picks.json:', e);
    }
  }
  // 2. Fallback to legacy JSON
  try{
    const r=await fetch('data/picks.json?_t='+Date.now(),{cache:'no-store'});
    if(!r.ok)return false;
    const data=await r.json();
    if(!data.participants||data.participants.length===0)return false;
    liveParts=data.participants;
    return true;
  }catch(e){return false;}
}

// Live snapshot listener — leaderboard updates instantly as entries arrive.
function listenToEntries(){
  if(!db) return;
  db.collection('entries').onSnapshot(snap=>{
    const parts = snap.docs.map(d=>{
      const x = d.data();
      return {
        name: x.name || d.id,
        winner: x.winner || '',
        alternate: x.alternate || '',
        picks: Array.isArray(x.picks) ? x.picks : [],
      };
    }).filter(p=>p.winner && p.picks.length>0);
    if(parts.length === 0) return; // keep prior data rather than blanking the board
    liveParts = parts;
    if(isRevealed()){ renderStandings(); renderStats(); }
    else updateLockedNames();
  }, err=>{
    console.warn('[US Open Pool] Firestore entries listener error:', err);
  });
}


// ── Render standings ─────────────────────────────────────
// Track previous ranking + totals so we can show position-change indicators
// and flash rows whose prize total just went up.
let _lastRanking = {};
let _lastTotals  = {};

function renderStandings(){
  const el=document.getElementById('standings-container');
  const ranked=liveParts.map(p=>{const{t,ua}=calcTeam(p);return{...p,total:t,ua};}).sort((a,b)=>b.total-a.total);
  document.getElementById('entry-count').textContent=ranked.length;
  const pot=ranked.length*75;const payout1st=pot-500;const payout2nd=500;
  document.getElementById('pot-total').textContent=ranked.length>0?'$'+pot:'—';
  document.getElementById('payout-1st').textContent=ranked.length>0?'$'+payout1st.toLocaleString():'—';
  const myName=getSavedTalkName();
  const firstRender = Object.keys(_lastRanking).length === 0;
  let h='<table class="t"><thead><tr><th style="width:50px">Pos</th><th class="L">Participant</th><th>Prize $</th><th>Score</th><th>Win %</th></tr></thead><tbody>';
  ranked.forEach((p,i)=>{
    const pos=i+1,medal=pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':`<span class="rank-n">${pos}</span>`,exp=expanded.has(i);
    const wp=teamWinProbMap[p.name]||0;
    const wpTxt=isTourneyActive()?`<span class="wp${wp>=0.25?' wp-hot':wp>=0.10?' wp-warm':''}">${(wp*100).toFixed(1)}%</span>`:'<span class="sna">—</span>';
    const payoutTag=pos===1?`<span class="payout-tag">$${payout1st.toLocaleString()}</span>`:pos===2?`<span class="payout-tag">$${payout2nd}</span>`:'';
    const teamScore=isTourneyActive()?calcTeamScore(p):null;
    const scoreTxt=teamScore!==null?fmt(teamScore):'<span class="sna">—</span>';
    const isMine=myName&&p.name===myName;
    // Position change indicator
    const lastPos = _lastRanking[p.name];
    const posDelta = (lastPos && !firstRender) ? lastPos - pos : 0;
    let posChange = '';
    if (posDelta > 0) posChange = `<span class="pos-chg up" title="Up ${posDelta} since last refresh">↑${posDelta}</span>`;
    else if (posDelta < 0) posChange = `<span class="pos-chg down" title="Down ${Math.abs(posDelta)} since last refresh">↓${Math.abs(posDelta)}</span>`;
    // Money-up flash trigger
    const lastTotal = _lastTotals[p.name] || 0;
    const moneyUp = (!firstRender && p.total > lastTotal && lastTotal > 0) ? ' money-up' : '';
    h+=`<tr class="pr${exp?' expanded':''}${isMine?' pr-mine':''}${moneyUp}" onclick="toggleRow(${i})">`;
    h+=`<td>${medal}</td><td class="L"><span class="p-name">${esc(p.name)}</span>${posChange}${payoutTag}<span class="chev${exp?' open':''}">▼</span></td>`;
    h+=`<td><span class="tot${pos===1&&isTourneyActive()?' lead':''}">${isTourneyActive()?fmtTeamTotal(p.total):'<span class="sna">—</span>'}</span>${p.ua?'<span class="alt-in">ALT IN</span>':''}</td>`;
    h+=`<td>${scoreTxt}</td>`;
    h+=`<td>${wpTxt}</td></tr>`;
    if(exp)h+=`<tr class="squad-tr"><td colspan="5">${buildSquad(p)}</td></tr>`;
  });
  h+='</tbody></table>';
  el.innerHTML=h;
  // Snapshot for next diff
  _lastRanking = Object.fromEntries(ranked.map((p, i) => [p.name, i+1]));
  _lastTotals  = Object.fromEntries(ranked.map(p => [p.name, p.total]));
  // Live indicator on the "Leaderboard" section header
  const secLbl = document.getElementById('standings-section-label');
  if (secLbl) {
    if (isTourneyActive() && tourneyStatus === 'live') {
      secLbl.innerHTML = '<span class="live-dot"></span>Leaderboard <span style="color:#66BB6A;font-weight:700">· LIVE</span>';
    } else if (tourneyStatus === 'final') {
      secLbl.innerHTML = 'Leaderboard <span style="color:var(--gold)">· FINAL</span>';
    } else {
      secLbl.textContent = 'Leaderboard';
    }
  }
}
function buildGolferDetail(g){
  const s=getScore(g);
  if(!s||!hasScores())return'<div class="sq-detail"><span class="sq-status-line">No scoring data available yet.</span></div>';
  let h='<div class="sq-detail"><div class="sq-detail-hdr">';
  if(s.headshot)h+=`<img class="sq-headshot" src="${s.headshot}" alt="" loading="lazy">`;
  h+=`<div><div class="sq-detail-name">${esc(g)}${isAmateur(g)?' <span class="amateur-tag">(a)</span>':''}`;
  if(s.flag)h+=` <img class="sq-flag" src="${s.flag}" alt="${esc(s.country||'')}" loading="lazy">`;
  h+='</div><div>';
  if(s.pos)h+=`<span class="sq-pos-badge">${esc(s.pos)}</span> `;
  if(s.mv>0)h+=`<span class="sq-mv up">↑${s.mv}</span>`;
  else if(s.mv<0)h+=`<span class="sq-mv down">↓${Math.abs(s.mv)}</span>`;
  else if(s.pos)h+=`<span class="sq-mv flat">—</span>`;
  h+='</div></div></div>';
  if(s.rounds&&s.rounds.length>0){
    h+='<table class="sq-rounds"><thead><tr><th></th><th>Score</th><th>To Par</th><th>Front</th><th>Back</th></tr></thead><tbody>';
    for(let i=0;i<4;i++){
      const r=s.rounds[i];
      if(r)h+=`<tr><td>R${r.rd}</td><td>${r.score}</td><td>${fmt(r.toPar)}</td><td>${r.front??'—'}</td><td>${r.back??'—'}</td></tr>`;
      else h+=`<tr><td>R${i+1}</td><td>—</td><td><span class="sna">—</span></td><td>—</td><td>—</td></tr>`;
    }
    h+='</tbody></table>';
  }
  // Tee time (pre-tournament)
  const tee=fmtTeeTime(s.teeTime);
  if(tee&&!isTourneyActive())h+=`<div class="sq-status-line">Tee Time: <strong>${tee} ET</strong></div>`;
  // Prize money
  const pm=calcPrizeMoney(g);
  if(isTourneyActive()&&pm>0)h+=`<div class="sq-status-line">Prize Money: <strong>$${pm.toLocaleString()}</strong></div>`;
  // Status
  let status='';
  if(s.st==='WD')status='Withdrawn';
  else if(s.st==='CUT')status='Missed Cut';
  else if(s.hole)status=`On hole ${s.hole}`;
  else if(tourneyStatus==='final')status='Tournament Complete';
  else if(isTourneyActive())status=s.thru||'';
  if(status)h+=`<div class="sq-status-line">${esc(status)}</div>`;
  return h+'</div>';
}
function buildSquad(p){
  let ua=false;
  const ws=getScore(p.winner);
  const wo=getOdds(p.winner);
  let wCard='<div class="squad-winner">';
  if(ws&&ws.headshot)wCard+=`<img class="squad-winner-img" src="${ws.headshot}" alt="" loading="lazy">`;
  else wCard+='<div class="squad-winner-img" style="background:var(--green-dark);display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:1.2rem;font-weight:700">🏆</div>';
  wCard+=`<div class="squad-winner-info"><div class="squad-winner-label">Winner Pick</div><div class="squad-winner-name">${esc(p.winner)}${isAmateur(p.winner)?' <span class="amateur-tag">(a)</span>':''}`;
  if(ws&&ws.flag)wCard+=` <img class="sq-flag" src="${ws.flag}" alt="${esc(ws.country||'')}" loading="lazy">`;
  const wTee=ws?fmtTeeTime(ws.teeTime):'';
  wCard+=`</div><div class="squad-winner-meta">${esc(wo)}${ws&&ws.pos&&ws.pos!=='-'?' · '+esc(ws.pos):''}${wTee&&!isTourneyActive()?' · '+wTee+' ET':''}</div></div>`;
  wCard+=`<div class="squad-winner-score"><div class="squad-winner-tp">${hasScores()?fmtGolfer(p.winner):'—'}</div>${ws&&ws.thru&&isTourneyActive()?`<div class="squad-winner-pos">${esc(ws.thru)}</div>`:''}</div>`;
  wCard+='</div>';
  let h=`<div class="squad-p"><div class="squad-ttl">Squad</div>${wCard}<div class="squad-grid">`;
  p.picks.forEach(g=>{
    const isWinner=normName(g)===normName(p.winner);
    const gwd=isWD(g);let cls=isWinner?'win':'',badge=isWinner?'<span class="sq-badge w">Win</span>':'';
    if(gwd&&!ua){cls='wdc';badge='<span class="sq-badge s">→Alt</span>';ua=true;}
    const go=getOdds(g);
    const gs=getScore(g);const gTee=gs?fmtTeeTime(gs.teeTime):'';
    const gKey=normName(g),isExp=expandedGolfers.has(gKey);
    h+=`<div><div class="sq ${cls}" onclick="toggleGolfer('${gKey.replace(/'/g,"\\'")}',event)"><span>${badge}${esc(g)}${isAmateur(g)?' <span class="amateur-tag">(a)</span>':''}</span><div class="sq-right"><span class="sq-score">${fmtGolfer(g)}</span><span class="sq-odds">${!isTourneyActive()&&gTee?gTee:esc(go)}</span></div></div>`;
    if(isExp)h+=buildGolferDetail(g);
    h+='</div>';
  });
  const ao=getOdds(p.alternate);
  const as=getScore(p.alternate);const aTee=as?fmtTeeTime(as.teeTime):'';
  const aKey=normName(p.alternate),aExp=expandedGolfers.has(aKey);
  h+=`<div><div class="sq alt" onclick="toggleGolfer('${aKey.replace(/'/g,"\\'")}',event)"><span><span class="sq-badge a">Alt</span>${esc(p.alternate)}${isAmateur(p.alternate)?' <span class="amateur-tag">(a)</span>':''}</span><div class="sq-right"><span class="sq-score">${fmtGolfer(p.alternate)}</span><span class="sq-odds">${!isTourneyActive()&&aTee?aTee:esc(ao)}</span></div></div>`;
  if(aExp)h+=buildGolferDetail(p.alternate);
  h+='</div>';
  return h+'</div></div>';
}
function toggleGolfer(key,evt){evt.stopPropagation();if(expandedGolfers.has(key))expandedGolfers.delete(key);else expandedGolfers.add(key);renderStandings();}
function toggleRow(idx){if(expanded.has(idx))expanded.delete(idx);else expanded.add(idx);renderStandings();}

// ── Live field (standings tab) ────────────────────────────
function fmtTeeTime(iso){
  if(!iso)return'';
  try{const d=new Date(iso);return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}).replace(' ','');}catch(e){return'';}
}
function renderFieldLive(){
  const load=document.getElementById('field-live-loading'),bd=document.getElementById('field-live');
  if(!hasScores()){load.style.display='block';bd.innerHTML='';return;}
  load.style.display='none';
  const sorted=Object.entries(scores).map(([n,s])=>({n,...s})).sort((a,b)=>{
    if(isWD(a.n)&&!isWD(b.n))return 1;if(!isWD(a.n)&&isWD(b.n))return-1;
    const av=parseTp(a.tp),bv=parseTp(b.tp);return(isNaN(av)?999:av)-(isNaN(bv)?999:bv);
  });
  const isLive=isTourneyActive();
  let h='<table class="field-lb"><thead><tr><th>Pos</th><th class="L">Player</th><th>Score</th>';
  h+=isLive?'<th>Thru</th>':'<th>Tee Time</th>';
  h+='<th class="hide-m">Odds</th></tr></thead><tbody>';
  sorted.forEach((g,i)=>{
    const o=getOdds(g.n);
    const img=g.headshot?`<img class="field-lb-photo" src="${g.headshot}" alt="" loading="lazy">`:'';
    const fl=g.flag?`<img class="field-lb-flag" src="${g.flag}" alt="${esc(g.country||'')}" title="${esc(g.country||'')}" loading="lazy">`:'';
    const tee=fmtTeeTime(g.teeTime);
    h+=`<tr>`;
    h+=`<td class="field-lb-pos">${g.pos&&g.pos!=='-'?esc(g.pos):(i+1)}</td>`;
    h+=`<td class="L">${img} <span class="field-lb-name">${esc(g.n)}${g.amateur?' <span class="amateur-tag">(a)</span>':''}</span>${fl}</td>`;
    h+=`<td class="field-lb-score">${fmt(g.tp)}</td>`;
    // When live: show hole if playing, tee time if not started yet, else thru text
    const notStarted = !g.hole && (parseTp(g.tp)===null||isNaN(parseTp(g.tp))) && (!g.thru || /scheduled|teeing/i.test(g.thru));
    const liveCell = g.hole ? 'Hole '+g.hole : (notStarted && tee ? tee+' ET' : esc(g.thru||'—'));
    h+=isLive?`<td class="field-lb-thru">${liveCell}</td>`:`<td class="field-lb-tee">${tee||esc(g.thru||'')}</td>`;
    h+=`<td class="field-lb-odds hide-m ${oddsColor(o)}">${o||'—'}</td>`;
    h+=`</tr>`;
  });
  bd.innerHTML=h+'</tbody></table>';
}

// ── Odds / Forecast tab ──────────────────────────────────
// State
let oddsFilter='all'; // 'all' | 'contenders' | 'mine' | 'cut'
function setOddsFilter(f){oddsFilter=f;renderOdds();}
// Whose picks to highlight — checks an explicit Forecast-tab selection first, then falls back to the auth name
function getSavedTalkName(){
  try{
    const explicit = localStorage.getItem('usopen-my-name');
    if(explicit) return explicit;
    return localStorage.getItem('usopen-name') || authedName || '';
  }catch(e){ return authedName || ''; }
}
function setMyName(name){
  try{
    if(name)localStorage.setItem('usopen-my-name',name);
    else localStorage.removeItem('usopen-my-name');
  }catch(e){}
  renderOdds();
}
// Pick ownership map (normName → {count, pct, owners[]})
function computeOwnership(){
  const m={};
  if(!isRevealed())return m;
  const total=liveParts.length;
  for(const p of liveParts){
    for(const g of (p.picks||[])){
      const k=normName(g);
      if(!m[k])m[k]={count:0,owners:[]};
      m[k].count++;m[k].owners.push(p.name);
    }
  }
  for(const k of Object.keys(m))m[k].pct=total>0?m[k].count/total:0;
  return m;
}
// Format Δ odds (live implied prob - opening implied prob) as a signed % in implied prob points
function fmtOddsDelta(curOdds,openOdds){
  if(!curOdds||!openOdds)return'<span class="fc-delta flat">—</span>';
  const cp=americanToProb(curOdds),op=americanToProb(openOdds);
  if(!cp||!op)return'<span class="fc-delta flat">—</span>';
  const d=cp-op; // positive = shortening (more likely to win)
  const pct=(d*100);
  if(Math.abs(pct)<0.2)return'<span class="fc-delta flat">±0</span>';
  const cls=pct>0?'shorten':'drift';
  const arrow=pct>0?'▲':'▼';
  return`<span class="fc-delta ${cls}">${arrow}${Math.abs(pct).toFixed(1)}pp</span>`;
}

function renderOdds(){
  const lbl=document.getElementById('odds-label');
  const sumEl=document.getElementById('forecast-summary');
  const chipEl=document.getElementById('forecast-chips');
  const valueEl=document.getElementById('forecast-value-card');
  const tabBtn=document.getElementById('tbtn-odds');
  const live=isTourneyActive();
  // Dynamic tab label
  if(tabBtn){
    const full=tabBtn.querySelector('.tab-full'),short=tabBtn.querySelector('.tab-short');
    if(live){if(full)full.innerHTML='📊 Forecast';if(short)short.innerHTML='📊 Forecast';}
    else{if(full)full.innerHTML='🎯 Field &amp; Odds';if(short)short.innerHTML='🎯 Field &amp; Odds';}
  }
  // Dynamic heading
  if(live){
    lbl.textContent=`Forecast · ${roundLabel||'Live'}`+(oddsSource==='polymarket'?' · Live odds via Polymarket':'');
  }else if(oddsSource==='polymarket'){
    lbl.textContent='2026 U.S. Open Field — Live Odds via Polymarket';
  }else{
    lbl.textContent='2026 U.S. Open Field — Odds to Win (static fallback)';
  }

  const q=(document.getElementById('odds-search').value||'').toLowerCase();
  let sortBy=document.getElementById('odds-sort').value;
  // Default-flip: pre→odds, live→winprob (only on first live render; respect explicit user selection otherwise)
  if(live&&sortBy==='odds'&&!renderOdds._userTouched)sortBy='winprob';

  // Pre-tournament → keep the original simple grid layout, hide summary/chips/value-card
  if(!live){
    if(sumEl)sumEl.innerHTML='';
    if(chipEl)chipEl.innerHTML='';
    if(valueEl)valueEl.innerHTML='';
    let entries=Object.entries(ODDS).map(([n,o])=>{const s=getScore(n);return{n,o,score:s?.tp??null,thru:s?.thru||'',headshot:s?.headshot||'',flag:s?.flag||'',country:s?.country||''};});
    if(q)entries=entries.filter(e=>e.n.toLowerCase().includes(q));
    if(sortBy==='name')entries.sort((a,b)=>a.n.localeCompare(b.n));
    else if(sortBy==='score')entries.sort((a,b)=>{const av=parseTp(a.score),bv=parseTp(b.score);return(isNaN(av)?999:av)-(isNaN(bv)?999:bv);});
    else entries.sort((a,b)=>(isNaN(parseInt(a.o))?9999:parseInt(a.o))-(isNaN(parseInt(b.o))?9999:parseInt(b.o)));
    let h='<div class="odds-grid">';
    entries.forEach((e,i)=>{
      const img=e.headshot?`<img class="odds-headshot" src="${e.headshot}" alt="" loading="lazy">`:'';
      const fl=e.flag?`<img class="odds-flag" src="${e.flag}" alt="${esc(e.country)}" title="${esc(e.country)}" loading="lazy">`:'';
      h+=`<div class="odds-item"><span class="odds-pos">${i+1}</span>${img}<span class="odds-name">${esc(e.n)}</span>${fl}<span class="odds-thru">${esc(e.thru||'')}</span><span class="odds-val ${oddsColor(e.o)}">${esc(e.o)}</span>${e.score!==null?`<span style="margin-left:8px">${fmt(e.score)}</span>`:''}</div>`;
    });
    document.getElementById('odds-board').innerHTML=h+'</div>';
    return;
  }

  // ── LIVE / FINAL forecast view ──
  // Win-prob maps (golferWinProbMap, teamWinProbMap) are populated by runSimulations() in doRefresh.
  const own=computeOwnership();
  const myName=getSavedTalkName();
  const myPicksSet=new Set();
  if(myName){
    const me=liveParts.find(p=>p.name===myName);
    if(me){for(const g of me.picks||[])myPicksSet.add(normName(g));if(me.alternate)myPicksSet.add(normName(me.alternate));}
  }

  // ── Header summary strip ──
  const active=Object.entries(scores).filter(([,s])=>s.st!=='WD'&&s.st!=='CUT');
  const underPar=active.filter(([,s])=>{const v=parseTp(s.tp);return!isNaN(v)&&v<0;}).length;
  const allScores=active.map(([,s])=>parseTp(s.tp)).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
  // Prefer ESPN's server-side cut projection when available, else local estimate (top 60 + ties for U.S. Open)
  const localCutLine=allScores.length>=60?allScores[59]:(allScores[allScores.length-1]||0);
  const cutLine=(espnCutScore!==null)?espnCutScore:localCutLine;
  const cutTxt=cutLine>=0?(cutLine===0?'E':'+'+cutLine):String(cutLine);
  // Find leader and any tied co-leaders
  const ranked=active.map(([n,s])=>{const v=parseTp(s.tp);return{n,s,v:isNaN(v)?99:v};}).sort((a,b)=>a.v-b.v);
  const leaderEntry=ranked[0];
  const tiedLeaders=leaderEntry?ranked.filter(g=>g.v===leaderEntry.v):[];
  let leaderDisplay='—',leaderScore='—';
  if(leaderEntry){
    leaderScore=leaderEntry.v<0?''+leaderEntry.v:leaderEntry.v===0?'E':'+'+leaderEntry.v;
    if(tiedLeaders.length===1)leaderDisplay=esc(leaderEntry.n);
    else if(tiedLeaders.length===2)leaderDisplay=esc(tiedLeaders[0].n)+' &amp; '+esc(tiedLeaders[1].n);
    else leaderDisplay=esc(tiedLeaders[0].n)+' &amp; '+(tiedLeaders.length-1)+' more';
  }
  // User's own team rank + win % + best in-money pick (only if name is selected)
  let myStatHtml='';
  if(myName){
    const teamRanking=liveParts.map(p=>{const{t,ua}=calcTeam(p);return{...p,total:t,ua};}).sort((a,b)=>b.total-a.total);
    const myIdx=teamRanking.findIndex(p=>p.name===myName);
    if(myIdx>=0){
      const me=teamRanking[myIdx];
      const myWp=teamWinProbMap[myName]||0;
      const wpTxt=(myWp*100).toFixed(1)+'%';
      myStatHtml+=`<div class="forecast-stat"><div class="forecast-stat-icon">👤</div><div class="forecast-stat-body"><div class="forecast-stat-lbl">Your Rank</div><div class="forecast-stat-val">${myIdx+1}/${teamRanking.length} · <span class="smoney">${wpTxt}</span></div></div></div>`;
      // Best in-money pick — highest current prize $ across the user's roster
      let bestPick=null,bestMoney=0;
      for(const g of (me.picks||[])){
        const m=calcPrizeMoney(g);
        if(m>bestMoney){bestMoney=m;bestPick=g;}
      }
      if(bestPick){
        const moneyFmt=bestMoney>=1000000?'$'+(bestMoney/1000000).toFixed(2)+'M':'$'+(bestMoney/1000).toFixed(0)+'K';
        myStatHtml+=`<div class="forecast-stat"><div class="forecast-stat-icon">💰</div><div class="forecast-stat-body"><div class="forecast-stat-lbl">Your Top Pick</div><div class="forecast-stat-val">${esc(bestPick.split(' ').slice(-1)[0])} <span class="smoney">${moneyFmt}</span></div></div></div>`;
      }
    }
  }
  const refreshTxt=lastSuccessfulRefresh?new Date(lastSuccessfulRefresh).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'—';
  if(sumEl){
    sumEl.className='forecast-summary';
    sumEl.innerHTML=
      `<div class="forecast-stat"><div class="forecast-stat-icon">👑</div><div class="forecast-stat-body"><div class="forecast-stat-lbl">Leader${tiedLeaders.length>1?'s':''}</div><div class="forecast-stat-val">${leaderDisplay} <span class="smoney">(${leaderScore})</span></div></div></div>`+
      `<div class="forecast-stat"><div class="forecast-stat-icon">🎯</div><div class="forecast-stat-body"><div class="forecast-stat-lbl">Round</div><div class="forecast-stat-val">${esc(roundLabel||'—')}</div></div></div>`+
      `<div class="forecast-stat"><div class="forecast-stat-icon">📉</div><div class="forecast-stat-body"><div class="forecast-stat-lbl">Under Par</div><div class="forecast-stat-val">${underPar} golfers</div></div></div>`+
      `<div class="forecast-stat"><div class="forecast-stat-icon">✂️</div><div class="forecast-stat-body"><div class="forecast-stat-lbl">Proj. Cut</div><div class="forecast-stat-val">${cutTxt}</div></div></div>`+
      myStatHtml+
      `<div class="forecast-stat"><div class="forecast-stat-icon">⏱️</div><div class="forecast-stat-body"><div class="forecast-stat-lbl">Updated</div><div class="forecast-stat-val">${refreshTxt}</div></div></div>`;
  }

  // ── Value picks strip ──
  if(valueEl){
    const vHtml=renderValuePicksStrip();
    valueEl.innerHTML=vHtml;
  }

  // ── Filter chips + "highlight my picks" selector ──
  if(chipEl){
    chipEl.className='forecast-chips';
    // Selector: lets the user pick their name (saved per-device) so ⭐ highlights their golfers.
    // Falls back to Clubhouse PIN auth if they're already logged in there.
    const explicitName=(()=>{try{return localStorage.getItem('usopen-my-name')||'';}catch(e){return'';}})();
    let selectorHtml='';
    if(explicitName){
      selectorHtml=`<span class="forecast-mine-row">📌 Highlighting picks for: <strong>${esc(explicitName)}</strong> <button class="forecast-mine-clear" onclick="setMyName('')" title="Clear">✕</button></span>`;
    }else if(!myName){
      // No explicit selection AND no chat auth → show a dropdown with all participants
      const opts=liveParts.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
      selectorHtml=`<span class="forecast-mine-row">📌 <select class="forecast-mine-sel" onchange="setMyName(this.value)"><option value="">Select your name to highlight your picks…</option>${opts}</select></span>`;
    }else{
      // Auto-detected from Clubhouse auth
      selectorHtml=`<span class="forecast-mine-row">📌 Highlighting picks for: <strong>${esc(myName)}</strong> <span class="forecast-mine-hint">(from Clubhouse)</span></span>`;
    }
    const chips=[
      {id:'all',label:'All'},
      {id:'contenders',label:'Contenders'},
    ];
    if(myName&&myPicksSet.size>0)chips.push({id:'mine',label:'⭐ My Picks'});
    chips.push({id:'cut',label:'Cut / WD'});
    const chipsHtml=chips.map(c=>`<button class="forecast-chip${oddsFilter===c.id?' active':''}" onclick="setOddsFilter('${c.id}')">${c.label}</button>`).join('');
    chipEl.innerHTML=selectorHtml+chipsHtml;
  }

  // ── Build entries — one row per golfer in ESPN scores (union with ODDS for pre-rounds) ──
  const seen=new Set();
  const entries=[];
  // Start from ESPN scores (they have positions and live data)
  for(const [n,s] of Object.entries(scores)){
    seen.add(normName(n));
    entries.push({
      n,
      s,
      o:getOdds(n),
      opening:getOpeningOdds(n),
      score:parseTp(s.tp),
      wp:golferWinProbMap[n]||0,
      own:own[normName(n)]||null,
      mine:myPicksSet.has(normName(n)),
    });
  }
  // Add any odds-only entries (golfers on the odds list but not yet in ESPN data — rare)
  for(const [n,o] of Object.entries(ODDS)){
    if(seen.has(normName(n)))continue;
    entries.push({n,s:null,o,opening:getOpeningOdds(n),score:NaN,wp:0,own:own[normName(n)]||null,mine:myPicksSet.has(normName(n))});
  }

  // Filters
  let rows=entries;
  if(q)rows=rows.filter(e=>e.n.toLowerCase().includes(q));
  if(oddsFilter==='contenders'){
    // Top 20 by position, or within 10 strokes of leader
    const lead=leaderEntry?leaderEntry.v:0;
    rows=rows.filter(e=>{
      if(!e.s||e.s.st==='WD'||e.s.st==='CUT')return false;
      const v=parseTp(e.s.tp);if(isNaN(v))return false;
      if(v-lead<=10)return true;
      const p=parsePos(e.s.pos);return p&&p.pos<=20;
    });
  }else if(oddsFilter==='mine'){
    rows=rows.filter(e=>e.mine);
  }else if(oddsFilter==='cut'){
    rows=rows.filter(e=>e.s&&(e.s.st==='WD'||e.s.st==='CUT'));
  }

  // Sort
  const scoreKey=e=>{if(!e.s||e.s.st==='WD')return 9999;if(e.s.st==='CUT')return 998;const v=parseTp(e.s.tp);return isNaN(v)?999:v;};
  const oddsKey=e=>{const n=parseInt(String(e.o||'').replace(/[^\d-]/g,''));return isNaN(n)?99999:n;};
  const todayKey=e=>{if(!e.s)return 999;const rd=(e.s.rounds||[]).find(r=>r.rd===currentRound);if(!rd)return 999;const tp=parseTp(rd.toPar);return isNaN(tp)?999:tp;};
  const prizeKey=e=>-calcPrizeMoney(e.n);
  const ownKey=e=>-(e.own?e.own.count:0);
  if(sortBy==='name')rows.sort((a,b)=>a.n.localeCompare(b.n));
  else if(sortBy==='score')rows.sort((a,b)=>scoreKey(a)-scoreKey(b));
  else if(sortBy==='today')rows.sort((a,b)=>todayKey(a)-todayKey(b));
  else if(sortBy==='prize')rows.sort((a,b)=>prizeKey(a)-prizeKey(b));
  else if(sortBy==='own')rows.sort((a,b)=>ownKey(a)-ownKey(b)||scoreKey(a)-scoreKey(b));
  else if(sortBy==='winprob')rows.sort((a,b)=>(b.wp||0)-(a.wp||0)||scoreKey(a)-scoreKey(b));
  else rows.sort((a,b)=>oddsKey(a)-oddsKey(b));

  // Render table
  let h=`<table class="forecast-table"><thead><tr>`+
    `<th style="width:40px">Pos</th>`+
    `<th class="hide-tab" style="width:28px">Δ</th>`+
    `<th class="L">Player</th>`+
    `<th class="hide-m">Own%</th>`+
    `<th>Score</th>`+
    `<th>Today</th>`+
    `<th>Thru</th>`+
    `<th class="hide-tab">R1</th><th class="hide-tab">R2</th><th class="hide-tab">R3</th><th class="hide-tab">R4</th>`+
    `<th>Win%</th>`+
    `<th class="hide-m">Prize</th>`+
    `<th>Odds</th>`+
    `<th class="hide-m">Δ Odds</th>`+
    `</tr></thead><tbody>`;
  if(rows.length===0){
    h+=`<tr><td colspan="14" class="fc-empty">No golfers match this filter.</td></tr>`;
  }
  rows.forEach((e,i)=>{
    const s=e.s;
    const isOut=s&&(s.st==='WD'||s.st==='CUT');
    const pos=s&&s.pos&&s.pos!=='-'?esc(s.pos):(i+1);
    const mv=s?s.mv||0:0;
    const mvHtml=mv>0?`<span class="fc-mv up">↑${mv}</span>`:mv<0?`<span class="fc-mv down">↓${Math.abs(mv)}</span>`:`<span class="fc-mv flat">—</span>`;
    const img=s&&s.headshot?`<img class="fc-photo" src="${s.headshot}" alt="" loading="lazy">`:'<div class="fc-photo" style="background:#eee"></div>';
    const fl=s&&s.flag?`<img class="fc-flag" src="${s.flag}" alt="${esc(s.country||'')}" title="${esc(s.country||'')}" loading="lazy">`:'';
    const star=e.mine?`<span class="fc-own-star" title="On your team">⭐</span>`:'';
    const ownPct=e.own?Math.round(e.own.pct*100):0;
    const ownCls=ownPct>=50?'hot':'';
    const ownTxt=e.own?`<span class="fc-own ${ownCls}"><span class="fc-own-pct">${ownPct}%</span> <span style="font-size:0.62rem;color:#aaa">(${e.own.count})</span></span>`:'<span class="fc-own">—</span>';
    const scoreHtml=s?fmt(s.tp):'<span class="sna">—</span>';
    // Today
    let todayHtml='<span class="sna">—</span>';
    if(s&&!isOut&&currentRound>=1){
      const rd=(s.rounds||[]).find(r=>r.rd===currentRound);
      if(rd)todayHtml=`<span class="fc-today">${fmt(rd.toPar)}</span>`;
    }
    // Thru — show hole if playing, tee time if not started, else status text
    let thruHtml='<span class="sna">—</span>';
    if(s){
      if(isOut)thruHtml=s.st==='WD'?'<span class="swd">WD</span>':'<span class="scut">CUT</span>';
      else if(s.hole)thruHtml=`<span class="fc-thru">H${s.hole}</span>`;
      else {
        const notStarted = (parseTp(s.tp)===null||isNaN(parseTp(s.tp))) && (!s.thru || /scheduled|teeing/i.test(s.thru));
        const tee = fmtTeeTime(s.teeTime);
        if(notStarted && tee) thruHtml=`<span class="fc-thru">${tee} ET</span>`;
        else thruHtml=`<span class="fc-thru">${esc(s.thru||'—')}</span>`;
      }
    }
    // Rounds R1-R4
    const rdCells=[1,2,3,4].map(r=>{
      const rd=s&&(s.rounds||[]).find(x=>x.rd===r);
      if(rd&&rd.score)return`<span class="fc-rd done" title="To par: ${esc(rd.toPar||'')}">${esc(String(rd.score))}</span>`;
      return`<span class="fc-rd">—</span>`;
    }).map(c=>`<td class="hide-tab">${c}</td>`).join('');
    // Win %
    let wpHtml='<span class="fc-winprob">—</span>';
    if(!isOut&&e.wp>0){
      const pct=e.wp*100;
      const cls=pct>=20?'hot':pct>=5?'warm':'';
      wpHtml=`<span class="fc-winprob ${cls}">${pct<1?pct.toFixed(1):pct.toFixed(1)}%</span>`;
    }
    // Prize
    const money=s?calcPrizeMoney(e.n):0;
    const prizeHtml=money>0?`<span class="fc-prize smoney">$${money>=1000000?(money/1000000).toFixed(2)+'M':(money/1000).toFixed(0)+'K'}</span>`:'<span class="sna">—</span>';
    // Odds + Δ
    const oddsHtml=`<span class="fc-odds ${oddsColor(e.o)}">${esc(e.o||'—')}</span>`;
    const deltaHtml=fmtOddsDelta(e.o,e.opening);

    h+=`<tr class="${e.mine?'fc-mine':''} ${isOut?'fc-cut':''}">`;
    h+=`<td class="fc-pos">${pos}</td>`;
    h+=`<td class="hide-tab">${mvHtml}</td>`;
    const amTag=s&&s.amateur?' <span class="amateur-tag">(a)</span>':'';
    h+=`<td class="L"><div class="fc-player">${img}<span class="fc-name">${esc(e.n)}${star}${amTag}</span>${fl}</div></td>`;
    h+=`<td class="hide-m">${ownTxt}</td>`;
    h+=`<td class="fc-score">${scoreHtml}</td>`;
    h+=`<td>${todayHtml}</td>`;
    h+=`<td>${thruHtml}</td>`;
    h+=rdCells;
    h+=`<td>${wpHtml}</td>`;
    h+=`<td class="hide-m">${prizeHtml}</td>`;
    h+=`<td>${oddsHtml}</td>`;
    h+=`<td class="hide-m">${deltaHtml}</td>`;
    h+=`</tr>`;
  });
  h+='</tbody></table>';
  document.getElementById('odds-board').innerHTML=h;
}

// Value Picks as a horizontally-scrollable strip for the Forecast tab (moved from Stats tab)
function renderValuePicksStrip(){
  if(!isTourneyActive())return'';
  // Build both rankings keyed by ESPN canonical names — getOpeningOdds() handles all alias resolution
  const moneyList=Object.entries(scores).filter(([,s])=>s.st!=='WD'&&s.st!=='CUT').map(([n])=>({name:n,money:calcPrizeMoney(n)})).filter(g=>g.money>0).sort((a,b)=>b.money-a.money);
  const moneyRank={};moneyList.forEach((e,i)=>moneyRank[e.name]=i+1);
  const oddsList=Object.keys(scores).map(n=>({name:n,odds:parseInt(getOpeningOdds(n))||99999})).sort((a,b)=>a.odds-b.odds);
  const oddsRank={};oddsList.forEach((e,i)=>oddsRank[e.name]=i+1);
  const values=moneyList.map(g=>{
    const oRank=oddsRank[g.name]||moneyList.length+50;
    const mRank=moneyRank[g.name]||moneyList.length;
    const delta=oRank-mRank;
    return{...g,oddsRank:oRank,moneyRank:mRank,delta};
  }).filter(g=>g.oddsRank>15&&g.delta>10).sort((a,b)=>b.delta-a.delta).slice(0,6);
  if(values.length===0)return'';
  let h='<div class="forecast-value-strip"><div class="forecast-value-hdr">🔥 Value Picks — Outperforming Their Opening Line</div><div class="forecast-value-row">';
  for(const v of values){
    const moneyFmt=v.money>=1000000?'$'+(v.money/1000000).toFixed(2)+'M':'$'+(v.money/1000).toFixed(0)+'K';
    h+=`<div class="forecast-value-chip"><div class="forecast-value-name">${esc(v.name)}</div><div class="forecast-value-meta">Opened #${v.oddsRank} · Now #${v.moneyRank} (+${v.delta})</div><div class="forecast-value-money">${moneyFmt}</div></div>`;
  }
  return h+'</div></div>';
}

// ── Statistics tab ───────────────────────────────────────
function renderStats(){
  const el=document.getElementById('stats-container');
  if(!el)return;
  if(liveParts.length===0){el.innerHTML='<div class="loading">No participant data yet.</div>';return;}
  if(!isRevealed()){el.innerHTML='<div class="lock-box"><div class="lock-icon">🔒</div><div class="lock-h">Statistics Revealed at First Tee</div><div class="lock-sub">Pick analysis will appear here once the tournament begins.</div></div>';return;}

  const totalParts=liveParts.length;

  // ── Frequency map ──
  const freq={};
  for(const p of liveParts) for(const g of p.picks) freq[g]=(freq[g]||0)+1;
  const uniqueGolfers=Object.keys(freq).length;
  // Prefer ESPN field count; fall back to ODDS only pre-tournament (U.S. Open field is 156 typically)
  const totalField=Object.keys(scores).length||Object.keys(ODDS).length||156;

  // ── 1. Field Coverage donut ──
  const pct=totalField>0?uniqueGolfers/totalField:0;
  const R=52,SW=10,C=2*Math.PI*R,off=C*(1-pct);
  const teamKeys=new Set(liveParts.map(p=>[...p.picks].sort().join('|')));
  const uniqueTeams=teamKeys.size;
  let coverageHtml=`<div class="coverage-body"><div class="coverage-ring"><svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="${R}" fill="none" stroke="#e0e0e0" stroke-width="${SW}"/><circle cx="65" cy="65" r="${R}" fill="none" stroke="#0A2240" stroke-width="${SW}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" stroke-linecap="round"/></svg><div class="coverage-ring-label"><span class="coverage-num">${uniqueGolfers}</span><span class="coverage-denom">of ${totalField}</span></div></div><div class="coverage-sub">${totalParts} participants · ${uniqueGolfers} unique golfers · <strong>${uniqueTeams}/${totalParts}</strong> unique teams</div></div>`;

  // ── 2. Winner predictions ──
  const winnerMap={};
  for(const p of liveParts){if(!winnerMap[p.winner])winnerMap[p.winner]=[];winnerMap[p.winner].push(p.name);}
  const winners=Object.entries(winnerMap).sort((a,b)=>b[1].length-a[1].length||(parseInt(getOdds(a[0]))||9999)-(parseInt(getOdds(b[0]))||9999));
  let winnerHtml='<div class="winner-grid">';
  for(const[g,pickers]of winners){
    const o=getOdds(g);
    winnerHtml+=`<div class="winner-card"><div class="winner-name">${esc(g)}</div><div class="winner-odds ${oddsColor(o)}">${esc(o)}</div>${isTourneyActive()?`<div style="margin-top:4px">${fmtGolfer(g)}</div>`:''}`;
    winnerHtml+=`<div class="winner-pickers">${pickers.map(n=>esc(n)).join('<br>')}</div>`;
    if(pickers.length>1)winnerHtml+=`<div class="winner-count">${pickers.length} picks</div>`;
    winnerHtml+='</div>';
  }
  winnerHtml+='</div>';

  // ── 3. Pick popularity bars ──
  const sorted=Object.entries(freq).sort((a,b)=>b[1]-a[1]||(parseInt(getOdds(a[0]))||9999)-(parseInt(getOdds(b[0]))||9999));
  let popHtml='<div class="pop-list">';
  for(const[g,count]of sorted){
    const pctBar=(count/totalParts*100).toFixed(0);
    const tier=count>=totalParts*0.75?'tier-high':count>=totalParts*0.25?'tier-mid':'tier-low';
    const o=getOdds(g);
    popHtml+=`<div class="pop-row"><span class="pop-name">${esc(g)}</span><span class="pop-odds ${oddsColor(o)}">${esc(o)}</span><div class="pop-bar-wrap"><div class="pop-bar ${tier}" style="width:${pctBar}%"></div></div><span class="pop-count">${count}/${totalParts}</span>${isTourneyActive()?`<span class="pop-score-wrap">${fmtGolfer(g)}</span>`:''}</div>`;
  }
  popHtml+='</div>';

  // ── 4. Contrarian picks ──
  const contrarians=Object.entries(freq).filter(([,c])=>c===1).map(([g])=>{
    const owner=liveParts.find(p=>p.picks.includes(g));
    return{golfer:g,owner:owner?owner.name:'?'};
  }).sort((a,b)=>(parseInt(getOdds(a.golfer))||9999)-(parseInt(getOdds(b.golfer))||9999));
  let contHtml='<div class="cont-grid">';
  for(const c of contrarians){
    const o=getOdds(c.golfer);
    contHtml+=`<div class="cont-item"><div class="cont-golfer">${esc(c.golfer)} <span class="cont-odds ${oddsColor(o)}">${esc(o)}</span></div><div class="cont-owner">Only ${esc(c.owner)}</div>${isTourneyActive()?`<div class="cont-score">${fmtGolfer(c.golfer)}</div>`:''}</div>`;
  }
  contHtml+='</div>';

  // ── 5. Overlap matrix ──
  const n=liveParts.length;
  const ov=Array.from({length:n},()=>Array(n).fill(0));
  let ovMin=21,ovMax=0;
  for(let i=0;i<n;i++){const si=new Set(liveParts[i].picks);for(let j=i+1;j<n;j++){const s=liveParts[j].picks.filter(g=>si.has(g)).length;ov[i][j]=s;ov[j][i]=s;if(s<ovMin)ovMin=s;if(s>ovMax)ovMax=s;}}
  const ovRange=ovMax-ovMin||1;
  function heatCls(v){const lv=Math.round((v-ovMin)/ovRange*5);return'heat-'+Math.min(5,Math.max(0,lv));}
  const firstName=nm=>{const p=nm.split(' ');return p[0]+(p.length>1?' '+p[p.length-1][0]+'.':'');};
  let matHtml='<div class="matrix-wrap"><table class="matrix"><thead><tr><th></th>';
  for(const p of liveParts) matHtml+=`<th class="rotate">${esc(firstName(p.name))}</th>`;
  matHtml+='</tr></thead><tbody>';
  for(let i=0;i<n;i++){
    matHtml+=`<tr><th style="text-align:right;white-space:nowrap">${esc(firstName(liveParts[i].name))}</th>`;
    for(let j=0;j<n;j++){
      if(i===j)matHtml+=`<td class="diag">21</td>`;
      else matHtml+=`<td class="${heatCls(ov[i][j])}">${ov[i][j]}</td>`;
    }
    matHtml+='</tr>';
  }
  matHtml+='</tbody></table></div>';

  // ── 6. Live tournament stats (conditional) ──
  let liveHtml='';
  if(isTourneyActive()){
    const golferVal=Object.entries(freq).filter(([g])=>!isWD(g)).map(([g,count])=>{const s=num(g);return{golfer:g,count,score:s,impact:s*count};});
    const best=golferVal.slice().sort((a,b)=>b.impact-a.impact)[0];
    const worst=golferVal.slice().sort((a,b)=>a.impact-b.impact)[0];
    const outlier=golferVal.filter(g=>g.count===1).sort((a,b)=>b.score-a.score)[0];
    liveHtml='<div class="stats-full"><div class="sec-lbl">Live Tournament Stats</div><div class="live-stats-grid">';
    if(best)liveHtml+=`<div class="live-stat-card"><div class="live-stat-label">Most Valuable Pick</div><div class="live-stat-golfer">${esc(best.golfer)}</div><div class="live-stat-score">${fmtMoney(best.score)}</div><div class="live-stat-detail">Picked by ${best.count}/${totalParts} · Total impact: ${fmtMoney(best.impact)}</div></div>`;
    if(worst)liveHtml+=`<div class="live-stat-card"><div class="live-stat-label">Least Valuable Pick</div><div class="live-stat-golfer">${esc(worst.golfer)}</div><div class="live-stat-score">${fmtMoney(worst.score)}</div><div class="live-stat-detail">Picked by ${worst.count}/${totalParts} · Total impact: ${fmtMoney(worst.impact)}</div></div>`;
    if(outlier)liveHtml+=`<div class="live-stat-card"><div class="live-stat-label">Most Valuable Outlier</div><div class="live-stat-golfer">${esc(outlier.golfer)}</div><div class="live-stat-score">${fmtMoney(outlier.score)}</div><div class="live-stat-detail">Only picked by ${esc(liveParts.find(p=>p.picks.includes(outlier.golfer))?.name||'?')}</div></div>`;
    liveHtml+='</div></div>';
  }

  // ── Assemble ──
  const popHint=isTourneyActive()?'<div style="font-size:0.68rem;color:var(--muted);font-family:Arial,sans-serif;padding:2px 4px 8px">Tip: use the <strong>📊 Forecast</strong> tab to sort golfers by ownership alongside live scores, win % and prize money.</div>':'';
  el.innerHTML=`<div class="stats-grid"><div><div class="sec-lbl">Field Coverage</div><div class="card">${coverageHtml}</div></div><div class="stats-full"><div class="sec-lbl">Winner Predictions</div><div class="card">${winnerHtml}</div></div><div class="stats-full"><div class="sec-lbl">Pick Popularity</div>${popHint}<div class="card">${popHtml}</div></div><div><div class="sec-lbl">Contrarian Picks</div><div class="card">${contHtml}</div></div><div class="stats-full"><div class="sec-lbl">Pick Overlap</div><div class="card">${matHtml}</div></div>${liveHtml}</div>`;
}

// ── Countdown ────────────────────────────────────────────
function updateCD(){
  const diff=REVEAL_DATE-new Date();if(diff<=0)return;
  document.getElementById('cd-d').textContent=String(Math.floor(diff/86400000)).padStart(2,'0');
  document.getElementById('cd-h').textContent=String(Math.floor((diff%86400000)/3600000)).padStart(2,'0');
  document.getElementById('cd-m').textContent=String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
  document.getElementById('cd-s').textContent=String(Math.floor((diff%60000)/1000)).padStart(2,'0');
}
const isRevealed=()=>FORCE_REVEAL||new Date()>=REVEAL_DATE;

function updateLockedNames(){
  const el=document.getElementById('locked-names');if(!el||liveParts.length===0)return;
  el.innerHTML='<div style="font-size:0.66rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:8px">Entries Locked In</div>'+liveParts.map(p=>`<span class="lname">${esc(p.name)}</span>`).join('');
  document.getElementById('entry-count').textContent=liveParts.length;
  const pot=liveParts.length*75;
  document.getElementById('pot-total').textContent='$'+pot;
  document.getElementById('payout-1st').textContent='$'+(pot-500).toLocaleString();
}

// ── Main refresh ─────────────────────────────────────────
let lastSuccessfulRefresh=0; // ms since epoch of last refresh where ESPN OR cached scores were available
let refreshInFlight=false;   // guards visibilitychange handler from racing the interval timer
async function doRefresh(){
  if(refreshInFlight)return;
  refreshInFlight=true;
  try{
    const[,espnRes]=await Promise.all([fetchPicks(),fetchESPN(),fetchPolymarket()]);
    if(!espnRes&&!hasScores())loadDemo();
    // Preview/test override: force the Forecast view with demo data even when ESPN says pre-tournament
    if(FORCE_LIVE&&(tourneyStatus==='pre'||tourneyStatus==='idle'))loadDemo();
    if(espnRes&&liveParts.length>0)warnUnmatched();
    // Canonicalize ODDS to match the ESPN field — drops stale Polymarket markets and unifies name variants
    syncOddsToField();
    // Run Monte Carlo simulations once per refresh to populate per-golfer + per-team win probabilities
    runSimulations();
    if(isRevealed()){renderStandings();renderFieldLive();renderStats();}else{updateLockedNames();}
    renderOdds();
    if(espnRes||hasScores())lastSuccessfulRefresh=Date.now();
    updateRefreshLabel();
  }finally{
    refreshInFlight=false;
  }
}
// Render the "Updated X ago" label, with a warning prefix when data is stale (>10 min)
function updateRefreshLabel(){
  const lr=document.getElementById('last-refresh');
  if(!lr)return;
  if(!lastSuccessfulRefresh){lr.textContent='';return;}
  const ageMs=Date.now()-lastSuccessfulRefresh;
  const stale=ageMs>10*60*1000;
  const time=new Date(lastSuccessfulRefresh).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  lr.textContent=(stale?'⚠️ Data may be stale · ':'')+'Updated '+time;
  lr.style.color=stale?'#FF6B6B':'';
}

// ── Init ─────────────────────────────────────────────────
async function init(){
  // Form iframe was removed; the Firebase entry form will mount into #entry-form-mount.
  renderOdds();
  await fetchPicks();
  updateLockedNames();

  // Sign-up tab visibility tracks real time (not FORCE_REVEAL preview flag) — picks are
  // submittable until first tee, then the tab hides.
  document.getElementById('tbtn-signup').style.display = isPickLocked() ? 'none' : '';

  // Always populate ODDS/scores at startup so the entry form has a golfer list to render,
  // even pre-reveal when the leaderboard is locked behind a countdown.
  await doRefresh();
  setInterval(doRefresh, 5*60*1000);

  if(isRevealed()){
    document.getElementById('lock-screen').style.display='none';
    document.getElementById('live-board').style.display='block';
  } else {
    document.getElementById('lock-screen').style.display='block';
    document.getElementById('live-board').style.display='none';
    updateCD();
    const cdInterval=setInterval(()=>{
      updateCD();
      // Hide the Sign Up tab the moment first tee arrives
      if(isPickLocked()) document.getElementById('tbtn-signup').style.display='none';
      if(isRevealed()){
        clearInterval(cdInterval);
        document.getElementById('lock-screen').style.display='none';
        document.getElementById('live-board').style.display='block';
      }
    },1000);
  }
  // Refresh as soon as user returns to the tab if our last successful fetch was >60s ago
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)return;
    if(Date.now()-lastSuccessfulRefresh>60*1000)doRefresh();
  });
  // Update the "Updated X · Stale" label every minute so the warning appears without waiting for next refresh
  setInterval(updateRefreshLabel,60*1000);
}

// ════════════════════════════════════════════════════════
// ██  DARK MODE  ██
// ════════════════════════════════════════════════════════
function toggleDarkMode(){
  const on=document.body.classList.toggle('dark-mode');
  document.getElementById('dark-toggle').textContent=on?'☀️ Light':'🌙 Dark';
  try{localStorage.setItem('usopen-dark',on?'1':'0');}catch(e){}
}
(function(){try{if(localStorage.getItem('usopen-dark')==='1'){document.body.classList.add('dark-mode');document.getElementById('dark-toggle').textContent='☀️ Light';}}catch(e){}})();

// ════════════════════════════════════════════════════════
// ██  MOMENTUM CHART  ██
// ════════════════════════════════════════════════════════
const CHART_COLORS=['#F2C55C','#1A4A8C','#c8102e','#90CAF9','#FF9800','#AB47BC','#26A69A','#EF5350','#42A5F5','#66BB6A','#FFA726','#EC407A','#8D6E63','#78909C','#FFEE58','#7E57C2','#29B6F6','#D4E157','#FF7043','#5C6BC0'];

function renderMomentumChart(){
  if(!hasScores()||liveParts.length===0||currentRound<1) return'<div class="momentum-empty">Momentum chart will appear once Round 1 scoring begins.</div>';
  // Calculate per-round cumulative standings
  const rounds=[];
  for(let r=1;r<=currentRound;r++){
    const standings=liveParts.map(p=>{
      let total=0;
      for(const g of p.picks){
        const s=getScore(g);
        if(!s||isWD(g))continue;
        let cumScore=0;
        for(const rd of(s.rounds||[])){if(rd.rd<=r){const tp=parseTp(rd.toPar);if(!isNaN(tp))cumScore+=tp;}}
        total+=cumScore;
      }
      return{name:p.name,total};
    }).sort((a,b)=>a.total-b.total);
    const ranked={};
    standings.forEach((s,i)=>ranked[s.name]=i+1);
    rounds.push(ranked);
  }
  if(rounds.length===0) return'<div class="momentum-empty">No round data available yet.</div>';

  const dark=document.body.classList.contains('dark-mode');
  const W=Math.max(600,liveParts.length*40);
  const H=320;
  const pad={t:30,r:20,b:40,l:44};
  const cw=W-pad.l-pad.r;
  const ch=H-pad.t-pad.b;
  const n=liveParts.length;
  const numRounds=rounds.length;

  let svg=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block" xmlns="http://www.w3.org/2000/svg">`;
  // Grid
  const gridColor=dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)';
  const textColor=dark?'#aaa':'#888';
  for(let i=1;i<=n;i++){
    const y=pad.t+(i-1)/(n-1||1)*ch;
    svg+=`<line x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>`;
    if(i<=10||i===n||i%5===0) svg+=`<text x="${pad.l-8}" y="${y+4}" text-anchor="end" fill="${textColor}" font-size="11" font-family="Arial">${i}</text>`;
  }
  // Round labels
  const xPoints=[];
  // Add "Start" column
  for(let r=0;r<=numRounds;r++){
    const x=pad.l+r/(numRounds||1)*cw;
    xPoints.push(x);
    const label=r===0?'Start':`R${r}`;
    svg+=`<text x="${x}" y="${H-pad.b+20}" text-anchor="middle" fill="${textColor}" font-size="11" font-family="Arial">${label}</text>`;
  }
  // Lines
  liveParts.forEach((p,pi)=>{
    const color=CHART_COLORS[pi%CHART_COLORS.length];
    const points=[];
    // Start: everyone at tied (middle position)
    const startY=pad.t+((n+1)/2-1)/(n-1||1)*ch;
    points.push(`${xPoints[0]},${startY}`);
    for(let r=0;r<numRounds;r++){
      const pos=rounds[r][p.name]||n;
      const y=pad.t+(pos-1)/(n-1||1)*ch;
      points.push(`${xPoints[r+1]},${y}`);
    }
    svg+=`<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`;
    // End dot + label
    const lastPt=points[points.length-1].split(',');
    svg+=`<circle cx="${lastPt[0]}" cy="${lastPt[1]}" r="4" fill="${color}"/>`;
    const lastPos=rounds[numRounds-1][p.name]||n;
    svg+=`<text x="${parseFloat(lastPt[0])+8}" y="${parseFloat(lastPt[1])+4}" fill="${color}" font-size="10" font-family="Arial" font-weight="700">${p.name.split(' ')[0]}</text>`;
  });
  // Y-axis label
  svg+=`<text x="12" y="${pad.t+ch/2}" text-anchor="middle" fill="${textColor}" font-size="10" font-family="Arial" transform="rotate(-90,12,${pad.t+ch/2})">Position</text>`;
  svg+='</svg>';
  // Legend
  let legend='<div class="momentum-legend">';
  liveParts.forEach((p,i)=>{
    const color=CHART_COLORS[i%CHART_COLORS.length];
    legend+=`<div class="momentum-leg-item"><span class="momentum-leg-dot" style="background:${color}"></span>${esc(p.name)}</div>`;
  });
  legend+='</div>';
  return`<div class="momentum-wrap">${svg}${legend}</div>`;
}

// ════════════════════════════════════════════════════════
// ██  CUT TRACKER  ██
// ════════════════════════════════════════════════════════
function renderCutTracker(){
  if(!isTourneyActive()||liveParts.length===0) return'';
  // Prefer ESPN's official projected cut line (tournament.cutScore — top 60 + ties at U.S. Open,
  // recomputed server-side). Fall back to our local estimate if ESPN hasn't populated it yet.
  const allScores=Object.entries(scores).filter(([,s])=>s.st!=='WD'&&s.st!=='CUT').map(([,s])=>parseTp(s.tp)).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
  const localCut=allScores.length>=60?allScores[59]:allScores[allScores.length-1]||0;
  const cutLine=(espnCutScore!==null)?espnCutScore:localCut;
  const hasCuts=Object.values(scores).some(s=>s.st==='CUT');
  const qualifier=hasCuts?' (official)':(espnCutScore!==null)?' (ESPN projection, top 60 + ties)':currentRound>=2?' (T60 after R2)':' (R1 estimate, noisy)';
  let html=`<div class="cut-projected">Projected cut line: <strong>${cutLine>=0?(cutLine===0?'E':'+'+cutLine):cutLine}</strong>${qualifier}</div>`;
  html+='<div class="cut-tracker-grid">';
  const ranked=liveParts.map(p=>{
    let safe=0,danger=0,cut=0,wd=0;
    for(const g of p.picks){
      if(isWD(g)){wd++;continue;}
      if(isCut(g)){cut++;continue;}
      const s=getScore(g);if(!s)continue;
      const v=parseTp(s.tp);
      if(isNaN(v))continue;
      if(v>cutLine)danger++;
      else safe++;
    }
    return{name:p.name,safe,danger,cut,wd,total:p.picks.length};
  }).sort((a,b)=>b.safe-a.safe);
  for(const p of ranked){
    const safePct=(p.safe/p.total*100).toFixed(0);
    const dangerPct=(p.danger/p.total*100).toFixed(0);
    const cutPct=((p.cut+p.wd)/p.total*100).toFixed(0);
    html+=`<div class="cut-card"><div class="cut-card-name">${esc(p.name)}</div>`;
    html+=`<div class="cut-bar-track"><div style="display:flex;height:100%"><div class="cut-bar-fill cut-bar-safe" style="width:${safePct}%"></div><div class="cut-bar-fill cut-bar-danger" style="width:${dangerPct}%"></div><div class="cut-bar-fill cut-bar-cut" style="width:${cutPct}%"></div></div></div>`;
    html+=`<div class="cut-stats"><span class="cut-stat"><span class="cut-dot cut-dot-safe"></span>${p.safe} safe</span><span class="cut-stat"><span class="cut-dot cut-dot-danger"></span>${p.danger} bubble</span><span class="cut-stat"><span class="cut-dot cut-dot-cut"></span>${p.cut+p.wd} out</span></div>`;
    html+='</div>';
  }
  return html+'</div>';
}

// ════════════════════════════════════════════════════════
// ██  VALUE PICKS  ██
// ════════════════════════════════════════════════════════
function renderValuePicks(){
  if(!isTourneyActive()) return'';
  // Find golfers earning much more prize money than their odds implied
  const oddsEntries=Object.entries(ODDS).map(([n,o])=>({name:n,odds:parseInt(o)||99999})).sort((a,b)=>a.odds-b.odds);
  const oddsRank={};oddsEntries.forEach((e,i)=>oddsRank[e.name]=i+1);
  const moneyList=Object.entries(scores).filter(([n,s])=>s.st!=='WD'&&s.st!=='CUT').map(([n])=>({name:n,money:calcPrizeMoney(n)})).filter(g=>g.money>0).sort((a,b)=>b.money-a.money);
  const moneyRank={};moneyList.forEach((e,i)=>moneyRank[e.name]=i+1);

  const values=moneyList.filter(g=>oddsRank[g.name]&&oddsRank[g.name]>15).map(g=>{
    const oRank=oddsRank[g.name]||moneyList.length;
    const mRank=moneyRank[g.name]||moneyList.length;
    const delta=oRank-mRank;
    return{...g,oddsRank:oRank,moneyRank:mRank,delta,odds:getOdds(g.name)};
  }).filter(g=>g.delta>10).sort((a,b)=>b.delta-a.delta).slice(0,8);

  if(values.length===0) return'<div class="value-empty">No standout value picks yet — check back as the tournament progresses.</div>';
  let html='<div class="value-grid">';
  for(const v of values){
    const owners=liveParts.filter(p=>p.picks.includes(v.name)).map(p=>p.name);
    html+=`<div class="value-card"><div class="value-golfer">${esc(v.name)}</div>`;
    html+=`<div class="value-odds ${oddsColor(v.odds)}">${esc(v.odds)} (ranked #${v.oddsRank} in odds)</div>`;
    html+=`<div class="value-score">${fmtMoney(v.money)}</div>`;
    html+=`<div class="value-detail">Prize money rank: #${v.moneyRank} · Outperforming by ${v.delta} spots</div>`;
    if(owners.length>0) html+=`<div class="value-detail">Picked by: ${owners.map(n=>esc(n)).join(', ')}</div>`;
    else html+=`<div class="value-detail" style="color:var(--red)">Not picked by anyone!</div>`;
    html+=`<div class="value-badge">🔥 Value Pick</div></div>`;
  }
  return html+'</div>';
}

// ════════════════════════════════════════════════════════
// ██  SHARE CARD  ██
// ════════════════════════════════════════════════════════
function generateShareCard(pIndex){
  const ranked=liveParts.map(p=>{const{t,ua}=calcTeam(p);return{...p,total:t,ua};}).sort((a,b)=>b.total-a.total);
  const p=ranked[pIndex];if(!p)return;
  const pos=pIndex+1;
  const W=600;
  const rowH=20; // height per golfer row
  const cols=3; // 3-column layout for picks
  const rows=Math.ceil(p.picks.length/cols);
  const squadH=rows*rowH+40; // picks section height
  const H=230+squadH+70; // header(190)+divider+squad+winner+alt+footer
  const canvas=document.createElement('canvas');canvas.width=W*2;canvas.height=H*2;
  const ctx=canvas.getContext('2d');ctx.scale(2,2);
  // Background
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#061427');grad.addColorStop(1,'#04101F');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // Gold border
  ctx.strokeStyle='#F2C55C';ctx.lineWidth=3;ctx.strokeRect(8,8,W-16,H-16);
  // Header
  ctx.fillStyle='#F2C55C';ctx.font='bold 11px Arial';ctx.textAlign='center';
  ctx.fillText("BRIAN SULLIVAN'S U.S. OPEN POOL 2026",W/2,36);
  // Position + Name
  const ordinal=pos===1?'st':pos===2?'nd':pos===3?'rd':'th';
  ctx.fillStyle='#fff';ctx.font='bold 26px Georgia';
  ctx.fillText(`${pos}${ordinal} Place`,W/2,72);
  ctx.font='bold 20px Arial';ctx.fillStyle='#F2C55C';
  ctx.fillText(p.name,W/2,100);
  // Total prize money
  ctx.font='bold 36px Georgia';
  const scoreStr=hasScores()?'$'+p.total.toLocaleString():'—';
  ctx.fillStyle=p.total>0?'#66BB6A':'#fff';
  ctx.fillText(scoreStr,W/2,152);
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='10px Arial';
  ctx.fillText('TOTAL PRIZE MONEY',W/2,168);
  // Divider
  ctx.strokeStyle='rgba(242,197,92,0.3)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(30,182);ctx.lineTo(W-30,182);ctx.stroke();

  // Winner pick (prominent)
  let y=200;
  ctx.textAlign='left';
  ctx.fillStyle='#F2C55C';ctx.font='bold 10px Arial';
  ctx.fillText('WINNER PICK',30,y);
  y+=16;
  const ws=getScore(p.winner);const wo=getOdds(p.winner);
  const wMoney=calcPrizeMoney(p.winner);
  ctx.fillStyle='#F2C55C';ctx.font='bold 14px Arial';
  ctx.fillText(`🏆  ${p.winner}`,30,y);
  if(wo){ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='11px Arial';ctx.fillText(wo,ctx.measureText(`🏆  ${p.winner}`).width+40,y);}
  if(hasScores()){ctx.textAlign='right';ctx.fillStyle=wMoney>0?'#66BB6A':'#999';ctx.font='bold 13px Arial';ctx.fillText(wMoney>0?'$'+wMoney.toLocaleString():'$0',W-30,y);ctx.textAlign='left';}
  y+=20;

  // Divider
  ctx.strokeStyle='rgba(242,197,92,0.15)';ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(W-30,y);ctx.stroke();
  y+=16;

  // Full squad - 3 columns
  ctx.fillStyle='rgba(242,197,92,0.6)';ctx.font='bold 10px Arial';
  ctx.fillText('FULL SQUAD (21 PICKS)',30,y);
  y+=14;
  const colW=(W-60)/cols;
  const allPicks=[...p.picks].map(g=>{const isW=normName(g)===normName(p.winner);return{name:g,score:num(g),isWinner:isW,wd:isWD(g),cut:isCut(g),amateur:isAmateur(g)};});
  allPicks.forEach((g,i)=>{
    const col=i%cols;
    const row=Math.floor(i/cols);
    const x=30+col*colW;
    const py=y+row*rowH;
    // Name (truncate if needed)
    let displayName=g.name;
    ctx.font='12px Arial';
    if(ctx.measureText(displayName).width>colW-50){
      const parts=displayName.split(' ');
      displayName=parts[0][0]+'. '+parts.slice(1).join(' ');
    }
    ctx.fillStyle=g.wd?'#FF4444':g.cut?'#999':g.isWinner?'#F2C55C':'#d0d0d0';
    ctx.textAlign='left';
    ctx.fillText(displayName,x,py);
    // Prize money
    if(hasScores()){
      ctx.textAlign='right';ctx.font='bold 10px Arial';
      if(g.wd){ctx.fillStyle='#FF4444';ctx.fillText('WD',x+colW-8,py);}
      else if(g.cut&&g.amateur){ctx.fillStyle='#999';ctx.fillText('CUT',x+colW-8,py);}
      else{const m=g.score;ctx.fillStyle=m>0?'#66BB6A':'#999';ctx.fillText(m>0?'$'+(m>=1000000?(m/1000000).toFixed(1)+'M':(m/1000).toFixed(0)+'K'):'$0',x+colW-8,py);}
      ctx.textAlign='left';
    }
  });
  y+=rows*rowH+10;

  // Alternate
  ctx.strokeStyle='rgba(242,197,92,0.15)';ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(W-30,y);ctx.stroke();
  y+=16;
  ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='bold 10px Arial';ctx.textAlign='left';
  ctx.fillText('ALTERNATE',30,y);
  y+=16;
  const altMoney=hasScores()?num(p.alternate):null;
  ctx.fillStyle='#aaa';ctx.font='12px Arial';
  ctx.fillText(p.alternate,30,y);
  const ao=getOdds(p.alternate);
  if(ao){ctx.fillStyle='rgba(255,255,255,0.25)';ctx.font='11px Arial';ctx.fillText(ao,ctx.measureText(p.alternate).width+40,y);}
  if(altMoney!==null){ctx.textAlign='right';ctx.fillStyle=altMoney>0?'#66BB6A':'#999';ctx.font='bold 11px Arial';ctx.fillText(altMoney>0?'$'+altMoney.toLocaleString():'$0',W-30,y);ctx.textAlign='left';}

  // Footer
  ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,0.15)';ctx.font='9px Arial';
  ctx.fillText('SHINNECOCK HILLS · JUNE 18-21, 2026',W/2,H-14);

  canvas.toBlob(blob=>{
    if(!blob)return;
    if(navigator.clipboard&&window.ClipboardItem){
      navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>{showToast('Image copied to clipboard!');}).catch(()=>{downloadBlob(blob,p.name);});
    }else{downloadBlob(blob,p.name);}
  },'image/png');
}
function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`usopen-pool-${name.replace(/\s+/g,'-').toLowerCase()}.png`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  showToast('Share card downloaded!');
}
function showToast(msg){
  const t=document.getElementById('share-toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

// ════════════════════════════════════════════════════════
// ██  PATCH: Wire new features into existing renders  ██
// ════════════════════════════════════════════════════════

// Patch buildSquad to add share button
const _origBuildSquad=buildSquad;
buildSquad=function(p){
  let html=_origBuildSquad(p);
  const ranked=liveParts.map(pp=>{const{t,ua}=calcTeam(pp);return{...pp,total:t,ua};}).sort((a,b)=>b.total-a.total);
  const idx=ranked.findIndex(r=>r.name===p.name);
  if(idx>=0) html+=`<div style="padding:0 18px 14px"><button class="share-btn" onclick="event.stopPropagation();generateShareCard(${idx})">📤 Share Card</button></div>`;
  return html;
};

// Patch renderStats to add new sections
const _origRenderStats=renderStats;
renderStats=function(){
  _origRenderStats();
  const el=document.getElementById('stats-container');
  if(!el||liveParts.length===0||!isRevealed())return;
  const grid=el.querySelector('.stats-grid');
  if(!grid)return;
  // Add Momentum Chart
  const momentumSection=document.createElement('div');
  momentumSection.className='stats-full';
  momentumSection.innerHTML=`<div class="sec-lbl">Momentum Chart</div><div class="card">${renderMomentumChart()}</div>`;
  grid.appendChild(momentumSection);
  // Add Pick Compare (side-by-side)
  const compareSection=document.createElement('div');
  compareSection.className='stats-full';
  compareSection.innerHTML=`<div class="sec-lbl">Pick Compare — Two Teams Side-by-Side</div><div class="card" id="pick-compare-card">${renderPickCompare()}</div>`;
  grid.appendChild(compareSection);
  // Value Picks lives on the Forecast tab — not duplicated here.
  // Add Cut Tracker
  const cutHtml=renderCutTracker();
  if(cutHtml){
    const cutSection=document.createElement('div');
    cutSection.className='stats-full';
    cutSection.innerHTML=`<div class="sec-lbl">Cut Tracker</div><div class="card">${cutHtml}</div>`;
    grid.appendChild(cutSection);
  }
};

// ══════════════════════════════════════════════════════════
// ██  PICK COMPARE — side-by-side two-team overlap view  ██
// ══════════════════════════════════════════════════════════
// Lets a user pick two entries and see which picks they share, with prize $ /
// score / win % broken out per side. Default Team A to the signed-in user's entry.
let _compareA = null;  // participant name
let _compareB = null;  // participant name

function renderPickCompare(){
  if(liveParts.length < 2) return '<div class="loading" style="padding:24px">Need at least two entries to compare. Check back once people start submitting.</div>';
  // Sensible defaults: signed-in user as A, leader as B
  const me = getSavedTalkName();
  if(!_compareA) _compareA = (me && liveParts.find(p=>p.name===me)) ? me : liveParts[0].name;
  if(!_compareB){
    const ranked = liveParts.map(p=>{const{t}=calcTeam(p);return{name:p.name,t};}).sort((a,b)=>b.t-a.t);
    _compareB = ranked.find(r=>r.name !== _compareA)?.name || liveParts[1].name;
  }
  if(_compareA === _compareB) _compareB = liveParts.find(p=>p.name !== _compareA)?.name || _compareB;
  const opts = liveParts.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
  const a = liveParts.find(p=>p.name === _compareA);
  const b = liveParts.find(p=>p.name === _compareB);
  if(!a || !b) return '<div class="loading" style="padding:24px">Pick two participants to compare.</div>';
  return `
    <div class="compare-pickers">
      <div class="compare-picker"><label class="compare-picker-lbl">Team A</label><select onchange="setComparePick('A', this.value)">${opts.replace(`value="${esc(_compareA)}"`, `value="${esc(_compareA)}" selected`)}</select></div>
      <div class="compare-vs">vs</div>
      <div class="compare-picker"><label class="compare-picker-lbl">Team B</label><select onchange="setComparePick('B', this.value)">${opts.replace(`value="${esc(_compareB)}"`, `value="${esc(_compareB)}" selected`)}</select></div>
    </div>
    ${buildCompareBody(a, b)}
  `;
}

function setComparePick(side, name){
  if(side === 'A') _compareA = name;
  else _compareB = name;
  const card = document.getElementById('pick-compare-card');
  if(card) card.innerHTML = renderPickCompare();
}
window.setComparePick = setComparePick;

function buildCompareBody(a, b){
  // Normalize picks for set comparison
  const aSet = new Set(a.picks.map(g=>normName(g)));
  const bSet = new Set(b.picks.map(g=>normName(g)));
  const sharedKeys = new Set([...aSet].filter(k => bSet.has(k)));
  const aTotal = calcTeam(a);
  const bTotal = calcTeam(b);
  const aWp = teamWinProbMap[a.name] || 0;
  const bWp = teamWinProbMap[b.name] || 0;
  const aScore = isTourneyActive() ? calcTeamScore(a) : null;
  const bScore = isTourneyActive() ? calcTeamScore(b) : null;

  const summary = `
    <div class="compare-summary">
      <div class="compare-summary-item"><div class="compare-summary-lbl">Shared picks</div><div class="compare-summary-val">${sharedKeys.size} / 21</div></div>
      <div class="compare-summary-item"><div class="compare-summary-lbl">A unique</div><div class="compare-summary-val">${aSet.size - sharedKeys.size}</div></div>
      <div class="compare-summary-item"><div class="compare-summary-lbl">B unique</div><div class="compare-summary-val">${bSet.size - sharedKeys.size}</div></div>
    </div>
  `;

  // Stat strip — totals, score, win %
  const statRow = (label, av, bv) => `<tr><td class="compare-stat-lbl">${esc(label)}</td><td class="compare-stat-val">${av}</td><td class="compare-stat-val">${bv}</td></tr>`;
  const stats = `
    <table class="compare-stats">
      <thead><tr><th></th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr></thead>
      <tbody>
        ${statRow('Winner pick', `${esc(a.winner)} <span class="compare-odds">${esc(getOdds(a.winner)||'')}</span>`, `${esc(b.winner)} <span class="compare-odds">${esc(getOdds(b.winner)||'')}</span>`)}
        ${statRow('Alternate', esc(a.alternate||'—'), esc(b.alternate||'—'))}
        ${statRow('Prize $', isTourneyActive()?fmtTeamTotal(aTotal.t):'<span class="sna">—</span>', isTourneyActive()?fmtTeamTotal(bTotal.t):'<span class="sna">—</span>')}
        ${statRow('Score', aScore!==null?fmt(aScore):'<span class="sna">—</span>', bScore!==null?fmt(bScore):'<span class="sna">—</span>')}
        ${statRow('Win %', isTourneyActive()?(aWp*100).toFixed(1)+'%':'<span class="sna">—</span>', isTourneyActive()?(bWp*100).toFixed(1)+'%':'<span class="sna">—</span>')}
      </tbody>
    </table>
  `;

  // Side-by-side picks list
  // Sort A's picks: shared first (alphabetical), then unique. Same for B.
  const partition = (set, otherSet) => {
    const arr = [...set];
    const shared = arr.filter(k => otherSet.has(k)).sort();
    const unique = arr.filter(k => !otherSet.has(k)).sort();
    return [...shared, ...unique];
  };
  // Map normalized keys back to original picks
  const findOriginal = (entry, normKey) => entry.picks.find(g => normName(g) === normKey) || normKey;
  const aOrder = partition(aSet, bSet).map(k => findOriginal(a, k));
  const bOrder = partition(bSet, aSet).map(k => findOriginal(b, k));

  const pickCell = (entry, golfer, otherSet) => {
    const isShared = otherSet.has(normName(golfer));
    const isWinner = normName(golfer) === normName(entry.winner);
    const score = getScore(golfer);
    const pm = calcPrizeMoney(golfer);
    const tpStr = score && isTourneyActive() ? fmt(score.tp) : '';
    const moneyStr = pm > 0 ? `<span class="smoney">$${pm >= 1000000 ? (pm/1000000).toFixed(2)+'M' : (pm/1000).toFixed(0)+'K'}</span>` : '';
    return `<div class="compare-pick ${isShared?'shared':''}">${isWinner?'<span class="compare-w-badge">W</span>':''}<span class="compare-pick-name">${esc(golfer)}</span>${moneyStr || tpStr ? `<span class="compare-pick-meta">${moneyStr||tpStr}</span>` : ''}</div>`;
  };

  const picksList = `
    <div class="compare-picks-grid">
      <div class="compare-col">
        <div class="compare-col-hdr">${esc(a.name)}'s 21 picks</div>
        ${aOrder.map(g => pickCell(a, g, bSet)).join('')}
      </div>
      <div class="compare-col">
        <div class="compare-col-hdr">${esc(b.name)}'s 21 picks</div>
        ${bOrder.map(g => pickCell(b, g, aSet)).join('')}
      </div>
    </div>
    <div class="compare-legend">Shared picks (gold border) are sorted to the top of each list. <span class="compare-w-badge">W</span> = that team's winner pick.</div>
  `;

  return `<div class="compare-body">${summary}${stats}${picksList}</div>`;
}

// ════════════════════════════════════════════════════════
// ██  ENTRY FORM (Firebase-backed pick submission)  ██
// ════════════════════════════════════════════════════════
// Trust model: same as Clubhouse — name+PIN claim is verified client-side against
// pins/{name}.pin. Firestore rules then constrain WHEN writes are allowed (locked at
// REVEAL_DATE) but do not enforce per-user ownership. Acceptable for the friend-pool
// context. Upgrade to Firebase Auth + auth.uid checks if multi-pool scale is ever needed.

let currentEntry = null;        // the authed user's current entry doc, or null
let entryPicksSet = new Set();  // normName-keyed set of the 21 currently selected picks

// Picks are submittable until first tee. (FORCE_REVEAL only controls the leaderboard preview.)
const isPickLocked = () => new Date() >= REVEAL_DATE;

// ── Shared auth bridge — Email Link (passwordless) sign-in ─────────────
// Why email link: anonymous auth fails in private/incognito mode and on
// privacy-focused browsers (DuckDuckGo, Brave with aggressive Shields) because
// they clear IndexedDB on tab/window close. Email link persists across all of
// these because the email IS the durable identity — Firebase looks up the same
// auth.uid for the same email address every time, regardless of device or
// browser state.
let currentUid = null;
let currentEmail = null;

function setAuthed(name){
  authedName = name;
  try{ localStorage.setItem('usopen-name', name); }catch(e){}
  refreshEntryAuthUI();
  refreshChatAuthUI();
}

// Wire reactive auth-state listener. Fires on initial load + after every sign-in
// or sign-out. Driving the UI off this means we never have to thread currentUid
// through multiple promise chains.
function wireAuthStateListener(){
  if(!firebase.auth) return;
  firebase.auth().onAuthStateChanged(async user => {
    if(user){
      currentUid = user.uid;
      currentEmail = user.email || null;
      // If they already claimed a name in a prior session, restore it.
      await restoreClaimedName();
    }else{
      currentUid = null;
      currentEmail = null;
      authedName = '';
      try{ localStorage.removeItem('usopen-name'); }catch(e){}
    }
    refreshEntryAuthUI();
    refreshChatAuthUI();
  });
}

// Look up the user's previously claimed display name by their auth.uid.
// Two paths: (1) localStorage hint, (2) Firestore lookup as fallback.
async function restoreClaimedName(){
  if(!db || !currentUid) return;
  // Fast path: check the saved name and verify its pins doc still points at us.
  let savedName = '';
  try{ savedName = localStorage.getItem('usopen-name') || ''; }catch(e){}
  if(savedName){
    try{
      const doc = await db.collection('pins').doc(savedName).get();
      if(doc.exists && doc.data().uid === currentUid){
        authedName = savedName;
        return;
      }
    }catch(e){ /* fall through to slow path */ }
  }
  // Slow path: scan pins for our uid (handles cross-device case where
  // localStorage is empty but the user has a name claimed under their email).
  try{
    const snap = await db.collection('pins').where('uid', '==', currentUid).limit(1).get();
    if(!snap.empty){
      authedName = snap.docs[0].id;
      try{ localStorage.setItem('usopen-name', authedName); }catch(e){}
    }
  }catch(e){
    console.warn('[Auth] Restore failed:', e);
  }
}

// Step 1 of email-link sign-in: user types email, we send a magic link.
async function sendEmailLink(){
  if(!firebase.auth){ setEntryPinMsg('Firebase Auth not loaded.', 'err'); return; }
  const emailInput = document.getElementById('entry-email-input');
  const email = (emailInput?.value || '').trim();
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    setEntryPinMsg('Enter a valid email address.', 'err'); return;
  }
  const btn = document.getElementById('entry-email-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Sending…'; }
  try{
    const actionCodeSettings = {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true,
    };
    await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
    try{ localStorage.setItem('usopen-emailForSignIn', email); }catch(e){}
    // Swap UI into "check your inbox" state
    document.getElementById('entry-email-form').style.display = 'none';
    const sent = document.getElementById('entry-email-sent');
    sent.style.display = 'block';
    document.getElementById('entry-email-sent-addr').textContent = email;
  }catch(e){
    console.error('[Auth] Send sign-in link failed:', e);
    setEntryPinMsg(e?.message || 'Failed to send link. Try again.', 'err');
    if(btn){ btn.disabled = false; btn.textContent = 'Send sign-in link'; }
  }
}

// Step 2 of email-link sign-in: called once on page load. If the current URL is
// a sign-in completion link, finish the auth handshake and clean up the URL.
async function completeEmailSignInIfReturning(){
  if(!firebase.auth) return;
  if(!firebase.auth().isSignInWithEmailLink(window.location.href)) return;
  let email = '';
  try{ email = localStorage.getItem('usopen-emailForSignIn') || ''; }catch(e){}
  if(!email){
    // Fallback: user clicked the link from a different browser than where they
    // started the flow. Ask them to retype the email.
    email = window.prompt('Confirm the email you used to start sign-in:') || '';
  }
  if(!email){ return; }
  try{
    await firebase.auth().signInWithEmailLink(email, window.location.href);
    try{ localStorage.removeItem('usopen-emailForSignIn'); }catch(e){}
    // Strip the auth params from the URL so a refresh doesn't try to re-auth.
    history.replaceState({}, '', window.location.pathname);
  }catch(e){
    console.error('[Auth] Email-link sign-in failed:', e);
    showToast('Sign-in failed: ' + (e?.code || 'unknown error'));
  }
}

function signOutCurrentUser(){
  try{ firebase.auth().signOut(); }catch(e){}
  // onAuthStateChanged will fire and clear UI state
}

// ── Golfer source ─────────────────────────────────────────
// Pre-event: pull from ODDS keys (populated by Polymarket once live, or FALLBACK_ODDS).
// Once ESPN has the field, union both. Sorted A-Z by last name for selection UX.
function getGolferField(){
  const set = new Map(); // canonical → display name
  for(const n of Object.keys(scores||{})) set.set(normName(n), n);
  for(const n of Object.keys(ODDS||{})){
    const k = normName(n);
    if(!set.has(k)) set.set(k, n);
  }
  const lastNameKey = n => {
    const parts = n.trim().split(/\s+/);
    return (parts[parts.length-1] + ' ' + parts[0]).toLowerCase();
  };
  return [...set.values()].sort((a,b)=>lastNameKey(a).localeCompare(lastNameKey(b)));
}

// ── Auth UI for entry form ────────────────────────────────
// Reactive name lookup — as the user types, check Firestore for an existing pins/{name}
// doc to decide whether the name is claimable, already owned by this device, or taken
// by someone else. Identity is the Firebase auth.uid; there is no PIN.
let _entryNameLookupTO = null;
let _entryNameClaimable = false;  // true → button enabled, false → name is taken or empty

function onEntryNameInput(){
  const input = document.getElementById('entry-name-input');
  const status = document.getElementById('entry-name-status');
  const claimField = document.getElementById('entry-claim-field');
  const claimBtn = document.getElementById('entry-claim-btn');
  const name = (input.value||'').trim();

  clearTimeout(_entryNameLookupTO);
  _entryNameClaimable = false;
  if(name.length < 2){
    status.textContent = '';
    status.className = 'entry-name-status';
    claimField.style.display = 'none';
    return;
  }
  status.textContent = 'Checking…';
  status.className = 'entry-name-status';

  _entryNameLookupTO = setTimeout(async () => {
    if(!db){ status.textContent = 'Database not configured yet.'; return; }
    if(!currentUid){
      status.textContent = 'Signing you in… retry in a sec.';
      return;
    }
    try{
      const doc = await db.collection('pins').doc(name).get();
      claimField.style.display = 'block';
      if(doc.exists){
        if(doc.data().uid === currentUid){
          // This device already owns this name → "sign in"
          status.innerHTML = `Welcome back, <strong>${esc(name)}</strong>.`;
          status.className = 'entry-name-status exists';
          claimBtn.textContent = 'Continue as ' + name;
          _entryNameClaimable = true;
        }else{
          // Some other device owns this name
          status.innerHTML = `<strong>${esc(name)}</strong> is already claimed by another device. Pick a different name.`;
          status.className = 'entry-name-status';
          claimBtn.textContent = 'Claim this name';
          _entryNameClaimable = false;
        }
      }else{
        // Available
        status.innerHTML = `<strong>${esc(name)}</strong> is available.`;
        status.className = 'entry-name-status avail';
        claimBtn.textContent = 'Claim this name';
        _entryNameClaimable = true;
      }
      claimBtn.disabled = !_entryNameClaimable;
    }catch(e){
      console.warn('[Entry] Name lookup failed:', e);
      status.textContent = 'Could not reach the database. Try again.';
    }
  }, 350);
}

async function claimEntryName(){
  if(!db || !currentUid){ setEntryPinMsg('Not signed in yet. Refresh the page.', 'err'); return; }
  if(!_entryNameClaimable){ setEntryPinMsg('This name is not available.', 'err'); return; }
  const name = (document.getElementById('entry-name-input').value||'').trim();
  if(!name){ return; }
  try{
    const ref = db.collection('pins').doc(name);
    const doc = await ref.get();
    if(doc.exists){
      // Existing doc — verify ownership matches our uid
      if(doc.data().uid !== currentUid){
        setEntryPinMsg('This name is already claimed by another device.', 'err');
        return;
      }
      // Already ours — just sign in
      setAuthed(name);
    }else{
      // Fresh claim — write pins doc with our uid
      await ref.set({
        uid: currentUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      setAuthed(name);
      showToast(`"${name}" is yours. Make your picks.`);
    }
    setEntryPinMsg('', '');
  }catch(e){
    console.error('[Entry] Claim failed:', e);
    setEntryPinMsg('Error claiming name. Try again.', 'err');
  }
}

function setEntryPinMsg(text, cls){
  const m = document.getElementById('entry-pin-msg');
  if(!m) return;
  m.textContent = text;
  m.className = 'talk-pin-msg' + (cls ? ' ' + cls : '');
}

function entrySignOut(){
  authedName = '';
  try{ localStorage.removeItem('usopen-name'); }catch(e){}
  currentEntry = null;
  entryPicksSet.clear();
  refreshEntryAuthUI();
}

// ── Render form state ─────────────────────────────────────
// Three states:
//   (1) No auth          → show Step 1 (email sign-in)
//   (2) Auth, no name    → show Step 2 (pick display name)
//   (3) Auth + name      → hide auth box, show the picks form
function refreshEntryAuthUI(){
  const authBox = document.getElementById('entry-auth');
  const form    = document.getElementById('entry-form');
  if(!authBox || !form) return;

  if(authedName){
    // State 3: fully set up — show picks form
    authBox.style.display = 'none';
    form.style.display = 'block';
    const authedLbl = document.getElementById('entry-authed-name');
    if(authedLbl) authedLbl.textContent = authedName;
    loadEntryForAuthedUser();
    return;
  }

  // States 1 & 2: auth box visible
  authBox.style.display = 'block';
  form.style.display = 'none';

  const emailStep = document.getElementById('entry-email-step');
  const nameStep  = document.getElementById('entry-name-step');
  if(currentUid){
    // State 2: signed in, just need to claim a display name
    if(emailStep) emailStep.style.display = 'none';
    if(nameStep)  nameStep.style.display  = 'block';
    const emailLbl = document.getElementById('entry-signed-in-email');
    if(emailLbl) emailLbl.textContent = currentEmail || '(signed in)';
  }else{
    // State 1: not signed in
    if(emailStep) emailStep.style.display = 'block';
    if(nameStep)  nameStep.style.display  = 'none';
  }
}

// An entry is locked from edits as soon as it's submitted — no take-backs.
// Returns the reason it's locked (or null if editable).
function entryLockReason(){
  if(currentEntry) return 'submitted';     // already submitted → permanently locked
  if(isPickLocked()) return 'first-tee';   // first tee has passed → window closed
  return null;
}

async function loadEntryForAuthedUser(){
  if(!db || !authedName) return;
  const body  = document.getElementById('entry-form-body');
  const empty = document.getElementById('entry-empty-field');
  const lockedNotice = document.getElementById('entry-locked-notice');
  const modeLabel = document.getElementById('entry-mode-label');

  // Check golfer field availability
  const field = getGolferField();
  if(field.length === 0){
    body.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  body.style.display = 'block';

  // Load existing entry (if any). If one exists, it's PERMANENTLY locked —
  // we render the picks read-only.
  try{
    const doc = await db.collection('entries').doc(authedName).get();
    if(doc.exists){
      currentEntry = doc.data();
      entryPicksSet = new Set((currentEntry.picks||[]).map(g=>normName(g)));
      modeLabel.textContent = 'Your entry is locked';
    }else{
      currentEntry = null;
      entryPicksSet.clear();
      modeLabel.textContent = 'Building a new entry';
    }
  }catch(e){
    console.warn('[Entry] Load failed:', e);
    currentEntry = null;
    entryPicksSet.clear();
  }

  // Apply lock state based on reason
  const reason = entryLockReason();
  const submitRow = body.querySelector('.entry-submit-row');
  if(reason){
    if(reason === 'submitted'){
      lockedNotice.innerHTML = '🔒 Your picks are locked in. Submissions are final — no edits after submit.';
    }else{
      lockedNotice.innerHTML = '🔒 Picks are locked — first tee has passed. Your entry is final.';
    }
    lockedNotice.style.display = 'block';
    body.querySelectorAll('input,select,button').forEach(el=>{ el.disabled = true; });
    body.classList.add('entry-form-locked');
    if(submitRow) submitRow.style.display = 'none';
  }else{
    lockedNotice.style.display = 'none';
    body.querySelectorAll('input,select,button').forEach(el=>{ el.disabled = false; });
    body.classList.remove('entry-form-locked');
    if(submitRow) submitRow.style.display = '';
  }

  renderEntryFieldList();
  renderEntryWinnerAlt();
  updateEntryValidation();
}

function renderEntryFieldList(){
  const listEl = document.getElementById('entry-field-list');
  if(!listEl) return;
  const q = (document.getElementById('entry-search').value||'').toLowerCase();
  const field = getGolferField();
  const rows = q ? field.filter(n=>n.toLowerCase().includes(q)) : field;
  if(rows.length === 0){
    listEl.innerHTML = '<div class="entry-field-empty">No golfers match this search.</div>';
    return;
  }
  let h = '';
  for(const n of rows){
    const isPicked = entryPicksSet.has(normName(n));
    const o = ODDS[n] || getOdds(n) || '';
    h += `<div class="entry-field-item ${isPicked?'picked':''}" onclick="toggleEntryPick(${JSON.stringify(n).replace(/"/g,'&quot;')})"><span>${esc(n)}</span><span class="entry-field-odds">${esc(o)}</span></div>`;
  }
  listEl.innerHTML = h;
  document.getElementById('entry-pick-count').textContent = entryPicksSet.size;
}

function toggleEntryPick(name){
  if(entryLockReason()) return;
  const k = normName(name);
  if(entryPicksSet.has(k)) entryPicksSet.delete(k);
  else {
    if(entryPicksSet.size >= 21){
      showToast('You already have 21 picks. Remove one first.');
      return;
    }
    entryPicksSet.add(k);
  }
  renderEntryFieldList();
  renderEntryWinnerAlt();
  updateEntryValidation();
}

function renderEntryWinnerAlt(){
  const winnerSel = document.getElementById('entry-winner');
  const altSel    = document.getElementById('entry-alternate');
  if(!winnerSel || !altSel) return;
  const field = getGolferField();
  const pickedNames = field.filter(n=>entryPicksSet.has(normName(n)));
  const nonPickedNames = field.filter(n=>!entryPicksSet.has(normName(n)));

  const prevWinner = winnerSel.value || (currentEntry?.winner || '');
  const prevAlt    = altSel.value    || (currentEntry?.alternate || '');

  winnerSel.innerHTML = '<option value="">— select winner —</option>'
    + pickedNames.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  altSel.innerHTML = '<option value="">— select alternate —</option>'
    + nonPickedNames.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');

  // Restore previous selections if still valid
  if(prevWinner && pickedNames.some(n=>normName(n)===normName(prevWinner))) winnerSel.value = pickedNames.find(n=>normName(n)===normName(prevWinner));
  if(prevAlt    && nonPickedNames.some(n=>normName(n)===normName(prevAlt)))    altSel.value    = nonPickedNames.find(n=>normName(n)===normName(prevAlt));
}

/**
 * Validate the in-progress entry form. Returns a list of human-readable error strings;
 * empty array = ready to submit.
 * @returns {string[]}
 */
function validateEntry(){
  const errors = [];
  const winner = document.getElementById('entry-winner').value;
  const alt    = document.getElementById('entry-alternate').value;
  if(entryPicksSet.size !== 21) errors.push(`You have ${entryPicksSet.size} picks — need exactly 21.`);
  if(!winner) errors.push('Pick a winner.');
  else if(!entryPicksSet.has(normName(winner))) errors.push('Winner must be one of your 21 picks.');
  if(!alt) errors.push('Pick an alternate.');
  else if(entryPicksSet.has(normName(alt))) errors.push('Alternate must NOT be one of your 21 picks.');
  return errors;
}

function updateEntryValidation(){
  const vEl = document.getElementById('entry-validation');
  const btn = document.getElementById('entry-submit-btn');
  if(!vEl || !btn) return;
  const errors = validateEntry();
  if(errors.length === 0){
    vEl.className = 'entry-validation ok';
    vEl.innerHTML = '<strong>✓ Ready to submit.</strong> Submissions are <strong>final</strong> — you can\'t edit after this.';
    btn.disabled = !!entryLockReason();
  }else{
    vEl.className = 'entry-validation warn';
    vEl.innerHTML = '<strong>Still to do:</strong><ul>' + errors.map(e=>`<li>${esc(e)}</li>`).join('') + '</ul>';
    btn.disabled = true;
  }
}

async function submitEntry(){
  if(!db || !authedName) return;
  if(entryLockReason()){ showToast('Your entry is already locked.'); return; }
  const errors = validateEntry();
  if(errors.length > 0) return;
  // Hard confirmation — picks are final. Native confirm() keeps this dead-simple
  // and intentionally a little jarring; the lock is irreversible.
  const ok = window.confirm('Submit your picks?\n\nThis is final — once submitted, your picks are LOCKED and cannot be edited.');
  if(!ok) return;
  const winner = document.getElementById('entry-winner').value;
  const alt    = document.getElementById('entry-alternate').value;
  const picks  = getGolferField().filter(n=>entryPicksSet.has(normName(n)));
  const msg = document.getElementById('entry-submit-msg');
  const btn = document.getElementById('entry-submit-btn');
  btn.disabled = true;
  msg.textContent = 'Submitting…'; msg.className = 'entry-submit-msg';
  try{
    // Use create() semantics — Firestore rules will reject any subsequent update,
    // and we explicitly avoid the {merge:true} path that previously allowed edits.
    const payload = {
      name: authedName,
      winner, alternate: alt, picks,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('entries').doc(authedName).set(payload);
    currentEntry = { ...payload, submittedAt: new Date() };
    msg.textContent = '✓ Your picks are locked in. Good luck.';
    msg.className = 'entry-submit-msg ok';
    // Swap UI into locked mode immediately
    loadEntryForAuthedUser();
  }catch(e){
    console.error('[Entry] Submit failed:', e);
    msg.textContent = 'Submit failed — check console and try again.';
    msg.className = 'entry-submit-msg err';
    btn.disabled = false;
  }
}

// ════════════════════════════════════════════════════════
// ██  TRASH TALK (Firebase + PIN Auth)  ██
// ════════════════════════════════════════════════════════
// Firebase project: us-open-bs-pool (dedicated to the 2026 U.S. Open pool).
// The 2026 Masters project (brian-sullivan-s-masters-pool) is preserved separately as archive.
// firestore.rules must be deployed to this project — see Firestore Database → Rules in the Console.
// The apiKey is intentionally public — Firestore rules enforce access, not the key.
const firebaseConfig={
  apiKey:"AIzaSyBOmPwFlFskaaKRFLNRckRjYr5TWnphw8Q",
  authDomain:"us-open-bs-pool.firebaseapp.com",
  projectId:"us-open-bs-pool",
  storageBucket:"us-open-bs-pool.firebasestorage.app",
  messagingSenderId:"522018697716",
  appId:"1:522018697716:web:49175d1f32f295335dc9a1",
  measurementId:"G-WQ5KRYTKTV"
};
let db=null;
const REACTIONS=['🔥','😂','💀','👍','👎','🤡'];
let authedName='';
try{
  firebase.initializeApp(firebaseConfig);
  db=firebase.firestore();
}catch(e){console.warn('[Trash Talk] Firebase init failed:',e);}

// Chat auth is now derived from the entry-form name claim (authedName + currentUid).
// Refreshes the Clubhouse compose UI based on whether the user has claimed a name.
function refreshChatAuthUI(){
  const authBox = document.getElementById('talk-auth');
  const inputRow = document.getElementById('talk-input-row');
  const authedLbl = document.getElementById('talk-authed-name');
  if(!authBox || !inputRow) return;
  if(authedName){
    authBox.style.display = 'none';
    inputRow.style.display = 'flex';
    if(authedLbl) authedLbl.textContent = 'Posting as ' + authedName;
  }else{
    authBox.style.display = 'block';
    inputRow.style.display = 'none';
  }
}

function sendMessage(){
  if(!db) return showToast('Chat unavailable');
  if(!authedName){ showToast('Claim a display name in the Enter Picks tab first.'); return; }
  if(!currentUid){ showToast('Not signed in yet — try again.'); return; }
  const inputEl = document.getElementById('talk-input');
  const text = inputEl.value.trim();
  if(!text) return;
  // Firestore auto-generated IDs match ^[A-Za-z0-9_-]+$ and satisfy the rule's msgId check.
  db.collection('messages').add({
    uid: currentUid,
    name: authedName,
    text: text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    reactions: {},
  }).then(()=>{ inputEl.value = ''; }).catch(e=>{ console.error(e); showToast('Failed to send'); });
}

function toggleReaction(msgId,emoji){
  if(!db||!authedName){showToast('Sign in to react');return;}
  const ref=db.collection('messages').doc(msgId);
  ref.get().then(doc=>{
    if(!doc.exists)return;
    const reactions=doc.data().reactions||{};
    const users=reactions[emoji]||[];
    if(users.includes(authedName)){
      reactions[emoji]=users.filter(u=>u!==authedName);
      if(reactions[emoji].length===0)delete reactions[emoji];
    }else{
      reactions[emoji]=[...users,authedName];
    }
    ref.update({reactions});
  });
}

function renderTalkFeed(messages){
  const feed=document.getElementById('talk-feed');if(!feed)return;
  if(messages.length===0){feed.innerHTML='<div class="talk-empty">The clubhouse is quiet. Be the first to speak up. 🏌️</div>';return;}
  let h='';
  for(const m of messages){
    const d=m.timestamp?.toDate?m.timestamp.toDate():new Date();
    const timeStr=d.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    h+=`<div class="talk-msg"><div class="talk-msg-hdr"><span class="talk-msg-name">${esc(m.name)}</span><span class="talk-msg-time">${timeStr}</span></div>`;
    h+=`<div class="talk-msg-body">${esc(m.text)}</div>`;
    h+=`<div class="talk-reactions">`;
    const reactions=m.reactions||{};
    for(const emoji of REACTIONS){
      const users=reactions[emoji]||[];
      const active=users.includes(authedName)?' active':'';
      const count=users.length;
      h+=`<button class="talk-react-btn${active}" onclick="toggleReaction('${esc(m.id)}','${emoji}')" title="${esc(users.join(', '))}">${emoji}${count?`<span class="talk-react-count">${count}</span>`:''}</button>`;
    }
    h+=`</div></div>`;
  }
  feed.innerHTML=h;
}

function listenToMessages(){
  if(!db)return;
  db.collection('messages').orderBy('timestamp','desc').limit(100).onSnapshot(snap=>{
    const messages=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderTalkFeed(messages);
  },err=>{
    console.error('[Trash Talk] Listen error:',err);
    const feed=document.getElementById('talk-feed');
    if(feed)feed.innerHTML='<div class="talk-empty">Could not load messages. Try refreshing.</div>';
  });
}

// Enter key sends a chat message
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('talk-input');
  if(input) input.addEventListener('keydown', e => { if(e.key === 'Enter') sendMessage(); });
});

// Start listening once picks load
const _origInit = init;
init = async function(){
  await _origInit();
  // Auth bootstrap (email link):
  //   1. Wire the reactive auth listener — drives all UI state off auth changes.
  //   2. If the current URL is an incoming sign-in link, complete the handshake.
  // No anonymous fallback — email is the durable identity, works across
  // browser clears, privacy modes, and devices.
  wireAuthStateListener();
  await completeEmailSignInIfReturning();
  listenToMessages();
  refreshEntryAuthUI();
  refreshChatAuthUI();
  // Live Firestore listener for entries → updates leaderboard as picks arrive
  listenToEntries();
  // Re-render entry form when ODDS/scores populate so the golfer source is fresh
  const origDoRefresh = doRefresh;
  doRefresh = async function(){
    await origDoRefresh.apply(this, arguments);
    if(authedName) refreshEntryAuthUI();
  };
};

init();
