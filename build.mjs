// Bouwt De Frikandellenindex van /content + /pages naar /dist.
// Gebruik: node build.mjs   (Netlify doet dit automatisch bij elke wijziging)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, "dist");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const json = f => JSON.parse(read(f));

const site = json("content/site.json");
const nieuwsRaw = json("content/nieuws.json");
const ix = json("content/index-pagina.json");
const cats = json("content/top10-per-moment.json");
const mom = json("content/momenten.json");
const quiz = json("content/quiz.json");
const nevo = json("content/nevo.json");
const snacks = json("content/snacks-tabel.json");
const wist = json("content/wist-je-dat.json");

const F = site.frikandel_kcal || 180;
// Socials pas tonen als ze actief zijn: zet "socials_zichtbaar" in content/site.json op true.
const SOC = site.socials_zichtbaar === true;
const URL_ = site.url.replace(/\/$/, "");
const now = new Date();
const MAANDEN = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
const BUILDDATE = `${now.getDate()} ${MAANDEN[now.getMonth()]} ${now.getFullYear()}`;
const ISODATE = now.toISOString().slice(0, 10);
const V = now.getTime().toString(36);

const MOMBY = Object.fromEntries(mom.momenten.map(m => [m.id, m]));
// Knoptekst naar de calculator: eigen tekst (veld "cta") of "Reken je <knop met kleine letter> uit"
const ctaTekst = m => m.cta || `Reken je ${m.knop.charAt(0).toLowerCase() + m.knop.slice(1)} uit`;
const LAUNCH = site.lanceerdatum ? new Date(site.lanceerdatum + "T12:00:00") : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
// Datum per artikel: "datum" (bijv. "2026-11-21") als die er staat, anders lanceerdatum min "terug" dagen.
const nieuws = nieuwsRaw.map(n => {
  const d = n.datum ? new Date(n.datum + "T12:00:00") : new Date(LAUNCH.getTime() - (n.terug || 0) * 864e5);
  const m = MOMBY[n.moment];
  const kcal = n.bon.reduce((t, b) => t + b.kcal, 0);
  return { ...n, url: `/nieuws/${n.slug}/`, iso: d.toISOString().slice(0, 10), datum: `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`,
    rub: m ? m.knop : "Onderzoek", rubLink: m ? `/reken/?moment=${m.id}` : "/reken/",
    cta: m ? `${ctaTekst(m)} →` : "Reken het zelf uit →",
    frik: kcal ? kcal / (site.frikandel_kcal || 180) : null, _t: d.getTime() };
}).filter(n => n._t <= Date.now() + 864e5).sort((a, b) => b._t - a._t);

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => n.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function dels(n, cap) {
  const full = Math.floor(n + 1e-9), frac = n - full; let h = "";
  for (let k = 0; k < Math.min(full, cap); k++) h += '<span class="del"></span>';
  if (full < cap && frac >= 0.05) h += `<span class="del part"><i style="width:${Math.round(frac * 100)}%"></i></span>`;
  return h;
}
const trow = (i, what, sub, n) => `<div class="trow"><span class="rank">${String(i + 1).padStart(2, "0")}</span><span class="what">${esc(what)}${sub ? `<span>${esc(sub)}</span>` : ""}</span><span class="num">${fmt(n)}</span><div class="dels" aria-hidden="true">${dels(n, 6)}</div></div>`;
// Regel zonder rangnummer (index: geen ranglijst)
const vrow = (what, sub, n) => `<div class="trow norank"><span class="what">${esc(what)}${sub ? `<span>${esc(sub)}</span>` : ""}</span><span class="num">${fmt(n)}</span><div class="dels" aria-hidden="true">${dels(n, 6)}</div></div>`;
const eenTegel = o => `<div class="one"><span class="onum">${esc(o.aantal)}</span><b>${esc(o.wat)}</b><span class="sub">${esc(o.hoeveel)}</span><span class="eq">= 1 <span class="del" aria-hidden="true"></span></span></div>`;
const bonHTML = b => { const t = b.regels.reduce((s, r) => s + r.kcal, 0); return `<div class="bon ix-bon" role="group" aria-label="Voorbeeldbonnetje: ${esc(b.titel)}"><div class="bon-h"><b>SNACKBAR DE INDEX</b><span>${esc(b.titel)}</span></div>${b.regels.map(r => `<div class="bon-r"><span>${esc(r.wat)}</span><span>${fmt(r.kcal / F)}</span></div>`).join("")}<div class="bon-t"><span>TOTAAL</span><span>${fmt(t / F)} FRIKANDELLEN</span></div><div class="bon-f">${Math.round(t)} kcal · 1 frikandel = 180 kcal</div></div>`; };
const beeld = (n, small) => n.beeld ? `<img src="/assets/img/nieuws/${small ? n.beeld.replace(/\.jpg$/, "-klein.jpg") : n.beeld}" alt="${small ? "" : esc(n.beeld_alt || "")}" width="${small ? 480 : 1600}" height="${small ? 270 : 900}"${small ? ' loading="lazy"' : ""} class="${small ? "thumb" : "art-img"}">` : "";
const stempel = (n, small) => n.frik != null ? `<span class="stempel${small ? " stempel-s" : ""}" aria-hidden="true"><b>${fmt(n.frik)}</b>${small ? "" : " frikandel"}</span>` : "";
const foto = (n, small) => `<span class="beeld-w">${beeld(n, small)}${stempel(n, small)}</span>`;
const kaart = (n, small) => `<span class="kaart${small ? " kaart-s" : ""}" aria-hidden="true">${small ? "" : `<span class="k-rub">${esc(n.rub)}</span>`}${n.frik != null ? `<b class="k-n">${fmt(n.frik)}</b><span class="k-u">frikandel</span>` : `<b class="k-n k-q">?</b><span class="k-u">telt mee</span>`}</span>`;
const newsItem = n => `<article class="item"><a class="item-a" href="${n.url}"><span class="item-t"><span class="rub">${esc(n.rub)}</span><h3 class="kop">${esc(n.kop)}</h3><span class="feit"><time datetime="${n.iso}">${esc(n.datum)}</time></span></span>${n.beeld ? foto(n, true) : kaart(n, true)}</a></article>`;
const newsGroot = n => `<article class="item item-groot"><a class="item-a" href="${n.url}">${n.beeld ? foto(n, false) : kaart(n, false)}<span class="item-t"><span class="rub">${esc(n.rub)}</span><h3 class="kop">${esc(n.kop)}</h3><span class="feit"><time datetime="${n.iso}">${esc(n.datum)}</time></span></span></a></article>`;
function daysToFrikandeldag() {
  const y = now.getMonth() > 1 || (now.getMonth() === 1 && now.getDate() > 4) ? now.getFullYear() + 1 : now.getFullYear();
  return Math.round((new Date(y, 1, 4) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
}

const ICON = (cls, size) => `<svg class="${cls}" width="${size}" height="${size}" aria-hidden="true" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#C2362B"/><g transform="translate(100 106) rotate(-20)"><path d="M-84,14 L84,14 L76,36 L-76,36 Z" fill="#E6E1D6" stroke="#2A1A12" stroke-width="9" stroke-linejoin="round"/><rect x="-94" y="-32" width="188" height="50" rx="13" fill="#FFFFFF" stroke="#2A1A12" stroke-width="9"/><rect x="-78" y="-18" width="156" height="28" rx="14" fill="#7A4425"/></g></svg>`;

const POSTS = [
  ["/blog/hoeveel-frikandellen-eet-jij/", "Hoeveel frikandellen eet jij zonder dat je het doorhebt?", "Het idee achter De Frikandellenindex. Over borrelnoten, schoonmoeders en stroopwafels om vier uur.", "5,9"],
  ["/blog/avondje-sinterklaas/", "Hoeveel frikandellen zitten er in een avondje Sinterklaas?", "Kruidnoten, een stukje letter en de schaal die maar niet leeg raakt. Het heerlijk avondje, omgerekend.", "3,2"],
  ["/blog/grote-zak-chips/", "Waarom je uit een grote zak chips meer eet dan uit een schaaltje", "De chips zijn hetzelfde, alleen de zak is groter. Wat onderzoek zegt over verpakkingen.", "6,8"],
  ["/blog/millennials-snacken/", "Nederlandse millennials snacken gemiddeld 4,5 keer per dag", "Onderzoek van WUR. En waarom snacken niet automatisch ongezond is.", "3,9"],
  ["/blog/vier-op-de-tien/", "Vier op de tien Nederlanders eten elke dag iets wat ze niet van plan waren", "Wat onderzoek zegt over ongepland snacken. En waarom we per moment rekenen."],
  ["/blog/waarom-de-frikandel/", "Waarom uitgerekend de frikandel?", "De snack met de slechtste naam, en waarom dat werkt.", "3,0"],
  ["/zo-rekenen-we/", "Zo rekenen we", "Bronnen, porties en wat niet in de index komt."],
];

const BLOCKS = {
  IX_INTRO: () => esc(ix.intro),
  EEN_T: () => esc(ix.een.titel), EEN_V: () => esc(ix.een.vraag), EEN_K: () => esc(ix.een.knipoog), EEN_N: () => esc(ix.een.noot),
  EEN: () => ix.een.items.map(eenTegel).join(""),
  STUK_T: () => esc(ix.stuk.titel), STUK_V: () => esc(ix.stuk.vraag), STUK_K: () => esc(ix.stuk.knipoog),
  STUK: () => ix.stuk.groepen.map(g => `<h3 class="grp-h">${esc(g.naam)}</h3><div class="top">${g.items.map(r => vrow(r.wat, r.hoeveel, r.kcal / F)).join("")}</div>`).join("\n"),
  OPT_T: () => esc(ix.optellen.titel), OPT_V: () => esc(ix.optellen.vraag), OPT_K: () => esc(ix.optellen.knipoog),
  BONNEN: () => `<div class="cats" role="group" aria-label="Kies een voorbeeld" id="bontabs" hidden>${ix.optellen.bonnetjes.map((b, i) => `<button type="button" class="chip" data-bon="${i}" aria-pressed="${i === 0}">${esc(b.titel)}</button>`).join("")}</div>\n` +
    ix.optellen.bonnetjes.map((b, i) => `<div class="bonvb${i === 0 ? " on" : ""}" data-bon="${i}"><h3 class="h3">${esc(b.titel)}</h3><p class="small">${esc(b.situatie)} <i>${esc(b.zo)}</i></p>${bonHTML(b)}<a class="cta" href="/reken/?moment=${b.moment}">Maak jouw eigen bonnetje →</a></div>`).join("\n"),
  PM_E: () => esc(ix.permoment.eyebrow), PM_T: () => esc(ix.permoment.titel), PM_V: () => esc(ix.permoment.vraag),
  CATS5: () => `<div class="cats" role="group" aria-label="Kies een moment" id="cattabs" hidden>${cats.map((c, i) => `<button type="button" class="chip" data-cat="${i}" aria-pressed="${i === 0}">${esc(c.moment)}</button>`).join("")}</div>\n` +
    cats.map((c, i) => { const m = mom.momenten.find(x => x.knop === c.moment); return `<div class="catlist${i === 0 ? " on" : ""}" data-cat="${i}"><h3 class="cat-h">${esc(c.moment)}</h3><div class="top">${c.lijst.slice().sort((p, q) => q.frikandellen - p.frikandellen).map((r, j) => trow(j, r.wat, r.hoeveel, r.frikandellen).replace('class="trow"', j >= 5 ? 'class="trow more"' : 'class="trow"')).join("")}</div><button type="button" class="meerbtn" aria-expanded="false">Toon de hele top 10 ↓</button>${m ? `<a class="cta cta-s" href="/reken/?moment=${m.id}">${esc(ctaTekst(m))} →</a>` : ""}</div>`; }).join("\n"),
  NEWS3: () => nieuws.slice(0, 3).map(newsItem).join(""),
  NEWSALL: () => nieuws.map((n, i) => i === 0 ? newsGroot(n) : newsItem(n)).join(""),
  POSTS: () => POSTS.map(([h, t, s, n]) => `<a class="post" href="${h}">${n ? `<span class="post-n"><b>${n}</b>frikandel</span>` : ""}<b>${esc(t)}</b><span>${esc(s)}</span></a>`).join(""),
  CATS: () => `<div class="cats" role="group" aria-label="Kies een moment" id="cattabs" hidden>${cats.map((c, i) => `<button type="button" class="chip" data-cat="${i}" aria-pressed="${i === 0}">${esc(c.moment)}</button>`).join("")}</div>\n` +
    cats.map((c, i) => `<h3 class="cat-h">${esc(c.moment)}</h3><div class="top catlist${i === 0 ? " on" : ""}" data-cat="${i}">${c.lijst.slice().sort((p, q) => q.frikandellen - p.frikandellen).map((r, j) => trow(j, r.wat, r.hoeveel, r.frikandellen)).join("")}</div>`).join("\n"),
  DAYS: () => String(daysToFrikandeldag()),
  BUILDDATE: () => BUILDDATE,
  SOCIALS: () => SOC ? `<a class="fact clink" href="${esc(site.instagram)}" target="_blank" rel="noopener"><span class="fnum">IG</span><div><b>Instagram</b><br><span class="small">@frikandellenindex</span></div></a>
      <a class="fact clink" href="${esc(site.tiktok)}" target="_blank" rel="noopener"><span class="fnum">TT</span><div><b>TikTok</b><br><span class="small">@frikandellenindex</span></div></a>` : "",
  SNACKS: () => `<div class="tablewrap"><table class="snacks"><thead><tr><th>Snack</th><th>kcal</th><th>Frikandel</th></tr></thead><tbody>${snacks.map(r => `<tr${r.wat === "Frikandel" ? ' class="ref"' : ""}><td>${esc(r.wat)}<span class="bron">${esc(r.portie)} · ${esc(r.bron)}</span></td><td>${r.kcal}</td><td><b>${fmt(r.kcal / F)}</b></td></tr>`).join("")}</tbody></table></div>`,
};

const MENU = [
  ["/", "Home", "Het begin"],
  ["/reken/", "Reken het uit", "Hoeveel frikandellen was dat?"],
  ["/quiz/", "Meer of minder?", "De frikandellenquiz"],
  ["/de-index/", "De Frikandellenindex", "Zoveel is één frikandel"],
  ["/nieuws/", "Nieuws en blogs", "Frikandellennieuws en verhalen"],
  ["/zoek/", "Zoek je snack", "Alle producten, in frikandellen"],
  ["/over/", "Over", "Wat het is en hoe het begon"],
  ["/zo-rekenen-we/", "Zo rekenen we", "Bronnen en porties"],
  ["/contact/", "Contact", "Tip, vraag of een stiekeme frikandel?"],
];
const TABS = [
  ["/", "home", "Home", '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>'],
  ["/reken/", "reken", "Reken", '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 13h2M13 13h2M9 17h2M13 17h2"/>'],
  ["/de-index/", "top-10", "Index", '<path d="M4 20V13h4v7M10 20V8h4v12M16 20v-5h4v5"/>'],
  ["/nieuws/", "nieuws", "Nieuws", '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2"/><path d="M7 9h7M7 12h7M7 15h4"/>'],
  ["/zoek/", "zoek", "Zoek", '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>'],
];
const FOOTLINKS = [["/over/", "Over"], ["/zo-rekenen-we/", "Zo rekenen we"], ["/calorieen-snacks/", "Wist je dat…?"], ["/nationale-frikandeldag/", "Nationale Frikandeldag"], ["/boek/", "Het boek"], ["/contact/", "Contact"], ["/privacy/", "Privacy"]];

const cur = (href, p) => href === p ? ' aria-current="page"' : "";
const header = p => `<div class="topbar">
  <div class="wrap">
    <a class="mark" href="/" aria-label="De Frikandellenindex, naar de homepage">${ICON("mark-ic", 30)}<span class="mark-t">De Frikandellenindex</span></a>
    <div class="right"><button class="menubtn" id="menubtn" type="button" aria-expanded="false" aria-controls="menu">Menu</button></div>
  </div>
  <nav class="menu" id="menu" hidden aria-label="Menu">
    <div class="wrap">
${MENU.map(([h, t, s]) => `      <a href="${h}"${cur(h, p)}>${esc(t)}<span>${esc(s)}</span></a>`).join("\n")}
    </div>
  </nav>
</div>`;
const footer = () => `<footer class="src">
  <div class="f-brand">${ICON("f-ic", 36)}<div><b>${esc(site.naam)}</b><span>${esc(site.tagline)}</span></div></div>
  <nav class="flinks" aria-label="Meer">${FOOTLINKS.map(([h, t]) => `<a href="${h}">${esc(t)}<span aria-hidden="true">→</span></a>`).join("")}</nav>
  <div class="f-small"><p>Energie: NEVO-online versie 2025/9.0, RIVM, Bilthoven. Porties: RIVM Portie-online of het winkelgewicht.</p><p>Indicatieve waarden. Een knipoog, geen voedingsadvies.</p></div>
  <p class="f-copy">© ${now.getFullYear()} ${esc(site.naam)} · Delen mag, graag met bronvermelding</p>
</footer>`;
const tabbar = tab => `<nav class="tabbar" aria-label="Hoofdmenu">
  <div class="wrap">
${TABS.map(([h, id, label, ic]) => `    <a href="${h}" data-tab="${id}"${tab === id ? ' aria-current="page"' : ""}><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ic}</svg>${label}</a>`).join("\n")}
  </div>
</nav>`;
const SCOREBAR = `<div class="scorebar" id="scorebar" hidden aria-hidden="true">
  <div class="wrap">
    <span class="sb-n" id="sbn">0</span><span class="sb-u">frikandellen</span>
    <span class="dels sb-dels" id="sbdels"></span>
    <button type="button" class="sb-go" id="sbgo">Bekijk</button>
  </div>
</div>`;

// Gestructureerde gegevens voor Google en AI-zoekmachines
const ORG = { "@type": "Organization", "@id": URL_ + "/#org", name: site.naam, url: URL_ + "/", logo: URL_ + "/assets/img/icon-512.png", email: site.email, ...(SOC ? { sameAs: [site.instagram, site.tiktok] } : {}), description: site.beschrijving };
const WEBSITE = { "@type": "WebSite", "@id": URL_ + "/#website", name: site.naam, url: URL_ + "/", inLanguage: "nl-NL", description: site.beschrijving, publisher: { "@id": URL_ + "/#org" } };
const satire = list => list.map(n => ({ "@type": "SatiricalArticle", headline: n.kop, url: URL_ + n.url, datePublished: n.iso, articleSection: n.rub, ...(n.beeld ? { image: URL_ + "/assets/img/nieuws/" + n.beeld } : {}), articleBody: `${n.plaats} — ${n.tekst.join(" ")} (Satire: verzonnen verhaal. Echt getal: ${n.bon.map(b => b.wat).join(", ") || "geen"}${n.frik != null ? ` = ${fmt(n.frik)} frikandel` : ""}.)`, inLanguage: "nl-NL", publisher: { "@id": URL_ + "/#org" }, isPartOf: { "@id": URL_ + "/#website" } }));
function jsonld(meta) {
  const g = [];
  if (meta.path === "/") g.push(WEBSITE, ORG, ...satire(nieuws.slice(0, 3)));
  else if (meta.art) g.push(...satire([meta.art]));
  else g.push({ "@type": "WebPage", name: meta.title, url: URL_ + meta.path, inLanguage: "nl-NL", isPartOf: { "@id": URL_ + "/#website" } });
  if (meta.path === "/nieuws/") g.push(...satire(nieuws));
  if (meta.faq) g.push({ "@type": "FAQPage", mainEntity: meta.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  if (meta.path !== "/") g.push(ORG, WEBSITE);
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": g })}</script>`;
}

function head(meta) {
  const canon = URL_ + (meta.path === "/404.html" ? "/" : meta.path);
  const gc = site.goatcounter ? `\n<script data-goatcounter="https://${esc(site.goatcounter)}.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>` : "";
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
${meta.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canon}">`}
<meta name="theme-color" content="#C2362B">
<meta property="og:type" content="${meta.art ? "article" : "website"}">
<meta property="og:locale" content="nl_NL">
<meta property="og:site_name" content="${esc(site.naam)}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${URL_}${meta.og ? meta.og : meta.art && meta.art.beeld ? "/assets/img/nieuws/" + meta.art.beeld : "/assets/img/og.png"}">
<meta property="og:image:width" content="${!meta.og && meta.art && meta.art.beeld ? 1600 : 1200}">
<meta property="og:image:height" content="${!meta.og && meta.art && meta.art.beeld ? 900 : 630}">
<meta property="og:image:alt" content="${meta.og ? esc(meta.title.replace(/ \| De Frikandellenindex$/, "")) : meta.art && meta.art.beeld ? esc(meta.art.beeld_alt || meta.art.kop) : "De Frikandellenindex: wat je ongemerkt eet, in frikandellen"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/img/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/bowlby-one.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="/assets/fonts/bricolage-grotesque.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v=${V}">
${jsonld(meta)}${gc}
</head>`;
}

function page(file) {
  const raw = read("pages/" + file);
  const m = raw.match(/^<!--meta (\{[\s\S]*?\}) -->\n/);
  if (!m) throw new Error("Geen meta in " + file);
  const meta = JSON.parse(m[1]);
  const body = raw.slice(m[0].length).replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!BLOCKS[k]) throw new Error(`Onbekend blok {{${k}}} in ${file}`); return BLOCKS[k](); });
  return render(meta, body);
}
function render(meta, body) {
  const needsData = ["/reken/", "/quiz/", "/zoek/"].includes(meta.path);
  const scripts = (needsData ? `<script src="/assets/data.js?v=${V}"></script>\n` : "") + (meta.path === "/zoek/" ? `<script src="/assets/nevo.js?v=${V}"></script>\n` : "") + `<script src="/assets/app.js?v=${V}"></script>`;
  const html = `${head(meta)}
<body>
${header(meta.path)}
<main class="wrap">
<div class="view">
${body.trim()}
</div>
${footer()}
</main>
${meta.path === "/reken/" ? SCOREBAR + "\n" : ""}${tabbar(meta.tab)}
${scripts}
</body>
</html>
`;
  const out = meta.path === "/" ? "index.html" : meta.path.endsWith(".html") ? meta.path.slice(1) : meta.path.slice(1) + "index.html";
  fs.mkdirSync(path.join(DIST, path.dirname(out)), { recursive: true });
  fs.writeFileSync(path.join(DIST, out), html);
  return meta;
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

// Nieuwsartikelen: één pagina per artikel uit content/nieuws.json
function artikel(n) {
  const rows = n.bon.length ? n.bon.map(b => `<div class="bon-r"><span>${esc(b.wat)}</span><span>${fmt(b.kcal / F)}</span></div>`).join("") + (n.bon.length > 1 ? `<div class="bon-t"><span>TOTAAL</span><span>${fmt(n.frik)} FRIKANDEL</span></div>` : `<div class="bon-t"><span>TOTAAL</span><span>${fmt(n.frik)} FRIKANDEL</span></div>`)
    : `<div class="bon-r"><span>Eten van andermans bord</span><span>telt mee</span></div>`;
  const zelfde = nieuws.filter(x => x.slug !== n.slug && x.moment === n.moment);
  const meer = zelfde.concat(nieuws.filter(x => x.slug !== n.slug && x.moment !== n.moment)).slice(0, 3);
  const body = `<article class="nieuws-art">
  <a class="link" href="/nieuws/">← Laatste nieuws</a>
  <header class="art-head"><a class="rub" href="${n.rubLink}">${esc(n.rub)}</a><h1 class="h2">${esc(n.kop)}</h1><p class="art-meta"><time datetime="${n.iso}">${esc(n.datum)}</time></p></header>
  <figure class="art-beeld">${n.beeld ? foto(n, false) + `<figcaption>${esc(n.beeld_bron || "Beeld: AI")}</figcaption>` : kaart(n, false)}</figure>
  <div class="art-tekst">${n.tekst.map((p, i) => `<p>${i === 0 ? `<b class="plaats">${esc(n.plaats)}</b> — ` : ""}${esc(p)}</p>`).join("")}</div>
  <div class="bon art-bon" role="group" aria-label="Bonnetje bij dit bericht"><div class="bon-h"><b>SNACKBAR DE INDEX</b><span>${esc(n.bon_titel || n.rub)}</span></div>${rows}<div class="bon-f">${esc(n.noot)}</div></div>
  <div class="art-acties"><a class="cta" href="${n.rubLink}">${esc(n.cta)}</a><button type="button" class="deel" data-deel="${esc(n.slug)}">Deel dit bericht</button><span class="deel-ok small" role="status"></span></div>
  <section class="stack meer" aria-labelledby="h-meer"><div class="sechead"><span class="eyebrow">Laatste nieuws</span><h2 id="h-meer">${zelfde.length ? `Meer over: ${esc(n.rub.toLowerCase())}` : "Meer nieuws"}</h2></div><div class="news">${meer.map(newsItem).join("")}</div></section>
</article>`;
  return render({ title: n.kop, description: n.tekst[0].slice(0, 155), path: n.url, tab: "nieuws", art: n }, body);
}

// Wist je dat-pagina's: één pagina per snack uit content/wist-je-dat.json
const plat = h => h.replace(/<[^>]+>/g, "");
function wistPage(w) {
  const m = MOMBY[w.moment];
  const vraag = w.vraag || `Hoeveel calorieën heeft ${w.naam}?`;
  const body = `<article class="blog">
    <a class="link" href="/calorieen-snacks/">← Wist je dat…?</a>
    <span class="eyebrow">Calorieën</span>
    <h1 class="h2">${esc(vraag)}</h1>
    <div class="antwoord"><p>${w.antwoord}</p></div>
    <p class="lead">${esc(w.knipoog)}</p>
    <div class="tablewrap"><table class="letters"><thead><tr><th>${esc(w.kop)}</th><th>Frikandel</th></tr></thead><tbody>${w.rijen.map(([l, k]) => `<tr${l === "Samen" ? ' class="ref"' : ""}><td>${esc(l)}</td><td><b>${fmt(k / F)}</b><span>${k} kcal</span></td></tr>`).join("")}</tbody></table></div>
    ${w.tekst.map(t => `<p>${esc(t)}</p>`).join("")}
    ${w.extra.map(([q, a]) => `<h2 class="h3">${esc(q)}</h2><p>${esc(a)}</p>`).join("")}
    <a class="cta" href="/reken/?moment=${m.id}">${esc(ctaTekst(m))} →</a>
    ${w.links.map(([h, t]) => `<a class="link" href="${h}">${esc(t)} →</a>`).join("")}
    <a class="link" href="/calorieen-snacks/">Meer weetjes: alle snacks in frikandellen →</a>
    <p class="small">Energie volgens NEVO-online 2025/9.0 (RIVM). Porties volgens RIVM Portie-online of het winkelgewicht. De index meet hoeveel, niet hoe gezond. <a class="link" href="/zo-rekenen-we/">Zo rekenen we →</a><br>Bijgewerkt: oktober 2026</p>
  </article>`;
  return render({ title: `${vraag} | ${site.naam}`, description: plat(w.antwoord).slice(0, 155), path: `/calorieen-${w.slug}/`, tab: "", faq: [[vraag, plat(w.antwoord)], ...w.extra] }, body);
}

// --- bouwen ---
fs.rmSync(DIST, { recursive: true, force: true });
copyDir(path.join(ROOT, "assets"), path.join(DIST, "assets"));
fs.copyFileSync(path.join(ROOT, "assets/img/favicon.ico"), path.join(DIST, "favicon.ico"));
fs.writeFileSync(path.join(DIST, "assets/data.js"), "window.FI=" + JSON.stringify({ F, moments: mom.momenten, extra: mom.extra_producten, quiz }) + ";");
fs.writeFileSync(path.join(DIST, "assets/nevo.js"), "window.FI_NEVO=" + JSON.stringify(nevo) + ";");

const metas = fs.readdirSync(path.join(ROOT, "pages")).filter(f => f.endsWith(".html")).map(page).concat(nieuws.map(artikel)).concat(wist.map(wistPage));

// Oud adres /top-10/ stuurt door naar /de-index/ (GitHub Pages kent geen server-redirects)
fs.mkdirSync(path.join(DIST, "top-10"), { recursive: true });
fs.writeFileSync(path.join(DIST, "top-10/index.html"), `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><title>De Frikandellenindex</title>
<link rel="canonical" href="${URL_}/de-index/"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=/de-index/">
</head><body><p>De Frikandellenindex is verhuisd: <a href="/de-index/">naar de nieuwe pagina</a>.</p></body></html>
`);
const pub = metas.filter(m => !m.noindex);
fs.writeFileSync(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pub.map(m => `  <url><loc>${URL_}${m.path}</loc><lastmod>${ISODATE}</lastmod></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(DIST, "robots.txt"), `# Iedereen welkom, ook AI-zoekmachines.
User-agent: *
Allow: /

Sitemap: ${URL_}/sitemap.xml
`);
fs.writeFileSync(path.join(DIST, "llms.txt"), `# ${site.naam}

> ${site.beschrijving}

- 1 frikandel = ${F} kcal: een gefrituurde frikandel van 72 gram (NEVO-online 2025, RIVM; Voedingscentrum 181 kcal).
- De index meet hoeveel energie een snack bevat, niet hoe gezond die is.
- De nieuwsberichten op deze site (onder /nieuws/) zijn verzonnen satire: de personen, plaatsen, onderzoeken en citaten bestaan niet. De getallen op het bonnetje eronder zijn echt.
- Nationale Frikandeldag is elk jaar op 4 februari.
- Contact: ${site.email}${SOC ? " · Instagram en TikTok: @frikandellenindex" : ""}

## De index: dit is óók één frikandel (ongeveer 180 kcal)
${ix.een.items.map(o => `- ${o.aantal} ${o.wat} (${o.hoeveel})`).join("\n")}

## Eén stuk, in frikandellen
${ix.stuk.groepen.flatMap(g => g.items).map(r => `- ${r.wat} (${r.hoeveel}): ${fmt(r.kcal / F)}`).join("\n")}

## Pagina's
${pub.map(m => `- [${m.title.replace(/ \| De Frikandellenindex$/, "")}](${URL_}${m.path}): ${m.description}`).join("\n")}
`);
console.log(`Klaar: ${metas.length} pagina's in dist/ (${BUILDDATE})`);
