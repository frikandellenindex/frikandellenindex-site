/* De Frikandellenindex: gedrag op de pagina's. Data komt uit /assets/data.js (gemaakt door build.mjs uit /content). */
(function(){
"use strict";
document.documentElement.classList.add("js");
const FI = window.FI || {};
const F = FI.F || 180;
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("nl-NL",{minimumFractionDigits:1,maximumFractionDigits:1});
const unit = n => fmt(n)==="1,0" ? "frikandel" : "frikandellen";
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function dels(n, cap){
  const full = Math.floor(n + 1e-9), frac = n - full; let h = "";
  for (let k = 0; k < Math.min(full, cap); k++) h += '<span class="del"></span>';
  if (full < cap && frac >= 0.05) h += `<span class="del part"><i style="width:${Math.round(frac*100)}%"></i></span>`;
  return h;
}
/* Telt klikken anoniem via GoatCounter, als dat aan staat. */
function track(name){ try{ if(window.goatcounter && window.goatcounter.count) window.goatcounter.count({path:name, title:name, event:true}); }catch(e){} }
function copy(txt, el){
  const done=m=>{ el.textContent=m; el.hidden=false; };
  try{ navigator.clipboard.writeText(txt).then(()=>done("Gekopieerd. Plakken maar."),()=>done(txt)); }catch(e){ done(txt); }
}

/* Nieuwe pagina altijd bovenaan beginnen, ook als de site in een kader (iframe) staat, zoals in een voorbeeldweergave */
try{ if(!location.hash && window.top!==window){ window.scrollTo(0,0); document.documentElement.scrollIntoView({block:"start"}); } }catch(e){}

/* Menu */
const menubtn=$("menubtn");
if(menubtn) menubtn.addEventListener("click",()=>{ const m=$("menu"); m.hidden=!m.hidden; menubtn.setAttribute("aria-expanded",String(!m.hidden)); });

/* Aftellen naar Nationale Frikandeldag (4 februari) */
(function(){
  const els=document.querySelectorAll("[data-days]"); if(!els.length) return;
  const now=new Date(), y=now.getMonth()>1||(now.getMonth()===1&&now.getDate()>4)?now.getFullYear()+1:now.getFullYear();
  const d=Math.round((new Date(y,1,4)-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/864e5);
  els.forEach(e=>e.textContent=d);
})();

/* Top 10 per moment: wisselen tussen lijsten (alle lijsten staan al in de HTML) */
(function(){
  const tabs=$("cattabs"); if(!tabs) return;
  tabs.hidden=false;
  tabs.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return;
    tabs.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
    document.querySelectorAll(".catlist").forEach(l=>l.classList.toggle("on", l.dataset.cat===b.dataset.cat)); });
})();

/* Calculator */
(function(){
  if(!$("mtabs") || !FI.moments) return;
  const MOMENTS=FI.moments, MO=Object.fromEntries(MOMENTS.map(m=>[m.id,m]));
  const ITEMS=Object.fromEntries(MOMENTS.map(m=>[m.id,m.producten.map(p=>[p.naam,p.kcal,p.portie])]));
  const EXTRA=(FI.extra||[]).map(p=>[p.naam,p.kcal,p.portie]);
  let moment=(function(){ try{ const q=new URLSearchParams(location.search).get("moment"); if(q && MO[q]) return q; }catch(e){} return MOMENTS[0].id; })(), counts={}, extras=[], variant=Math.floor(Math.random()*2), touched=false;
  const STATE={};
  const rows=()=>ITEMS[moment].concat(extras);
  const total=()=>rows().reduce((s,[,k],i)=>s+k*(counts[i]||0),0);
  const level=n=>n<1.5?"weinig":n<4?"flink":"koningszone";
  function load(m){
    STATE[moment]={counts,extras,variant};
    moment=m; const s=STATE[m];
    counts=s?s.counts:{}; extras=s?s.extras:[]; variant=s?s.variant:Math.floor(Math.random()*2);
    closeAdd(); renderM();
  }
  function momentTotal(m){
    const s=m===moment?{counts,extras}:STATE[m]; if(!s) return 0;
    return ITEMS[m].concat(s.extras).reduce((a,[,k],i)=>a+k*(s.counts[i]||0),0);
  }
  function renderTabs(){
    $("mtabs").innerHTML=MOMENTS.map(m=>{ const v=momentTotal(m.id); return `<button type="button" id="m-${m.id}" data-m="${m.id}" aria-pressed="${m.id===moment}">${esc(m.knop)}${v>0?` <span class="mt">· ${fmt(v/F)}</span>`:""}</button>`; }).join("");
  }
  function renderM(){
    $("tagline").textContent=MO[moment].tagline;
    $("list").innerHTML=rows().map(([name,k,g],i)=>`<div class="row"><div class="name">${esc(name)}<span>${esc(g)} · ${fmt(k/F)} frikandel</span></div><div class="step"><button type="button" id="min-${moment}-${i}" data-i="${i}" data-d="-1" aria-label="${esc(name)} min één">−</button><output id="c-${i}">${counts[i]||0}</output><button type="button" id="plus-${moment}-${i}" data-i="${i}" data-d="1" aria-label="${esc(name)} plus één">+</button></div></div>`).join("");
    render();
  }
  function joke(n){
    if(n===0) return "Nog niks geteld. Tik op + bij alles wat je pakte.";
    const L=MO[moment].grappen[level(n)]; return L[variant%L.length].replace("{n}",fmt(n));
  }
  function renderBon(){
    const r=rows().map(([name,k],i)=>[name,counts[i]||0,k]).filter(x=>x[1]>0);
    if(!r.length){ $("bon").hidden=true; return; }
    $("bon").hidden=false;
    $("bon").innerHTML=`<div class="bon-h"><b>SNACKBAR DE INDEX</b><span>${esc(MO[moment].naam)}</span></div>`+
      r.map(([name,c,k])=>`<div class="bon-r"><span>${c}× ${esc(name)}</span><span>${fmt(c*k/F)}</span></div>`).join("")+
      `<div class="bon-t"><span>TOTAAL</span><span>${fmt(total()/F)} ${unit(total()/F)}</span></div><div class="bon-f">1 frikandel = 180 kcal · Bedankt en tot ziens</div>`;
  }
  function render(){
    const k=total(), n=k/F;
    $("rmoment").textContent="Jouw "+MO[moment].naam.replace(/^(De|Het) /,"").replace(/^Koffie bij je/,"koffie bij je").toLowerCase();
    renderTabs();
    $("n").textContent=fmt(n); $("nu").textContent=unit(n); $("dels").innerHTML=dels(n,24);
    $("joke").textContent=joke(n);
    $("crown").hidden=n<4;
    $("note").hidden=!(moment==="gezond" && k>0);
    renderBon();
    $("sbn").textContent=fmt(n); $("sbdels").innerHTML=dels(n,12); updateBar();
    $("share").hidden=k===0;
    if($("sharetxt")) $("sharetxt").textContent=MO[moment].deelregel||"";
    $("bonimg").hidden=true; $("copied").hidden=true;
  }
  $("mtabs").addEventListener("click",e=>{const b=e.target.closest("button"); if(b && b.dataset.m!==moment) load(b.dataset.m);});
  $("list").addEventListener("click",e=>{const b=e.target.closest("button"); if(!b) return; const i=+b.dataset.i; counts[i]=Math.max(0,(counts[i]||0)+ +b.dataset.d); $("c-"+i).textContent=counts[i]; if(!touched){ touched=true; track("calculator-gebruikt"); } render();});
  $("reset").addEventListener("click",()=>{counts={}; extras=[]; renderM();});

  /* Staat jouw snack er niet bij? */
  function closeAdd(){ $("addbox").hidden=true; $("addbtn").setAttribute("aria-expanded","false"); $("addq").value=""; $("addres").innerHTML=""; }
  function addPool(){ const have=new Set(rows().map(r=>r[0])); const seen=new Set(), out=[];
    Object.values(ITEMS).concat([EXTRA]).forEach(L=>L.forEach(r=>{ if(!have.has(r[0]) && !seen.has(r[0])){ seen.add(r[0]); out.push(r); } })); return out; }
  let missTimer=null;
  const btn=([name,k,g])=>`<button type="button" data-name="${esc(name)}">${esc(name)}<span>${esc(g)} · ${fmt(k/F)}</span></button>`;
  function addSearch(){
    const raw=$("addq").value.trim(), q=norm(raw); const pool=addPool();
    clearTimeout(missTimer);
    if(!q){
      const sug=(MO[moment].suggesties||[]).map(n=>pool.find(r=>r[0]===n)).filter(Boolean);
      $("addres").innerHTML=sug.length?`<p class="addhint">Vaak erbij gepakt:</p>`+sug.map(btn).join(""):"";
      return;
    }
    const hits=pool.filter(r=>norm(r[0]).includes(q));
    if(hits.length){ $("addres").innerHTML=hits.slice(0,8).map(btn).join("")+(hits.length>8?`<p>En nog ${hits.length-8}. Typ verder om te zoeken.</p>`:""); return; }
    $("addres").innerHTML=`<p>Niet gevonden in onze snacks. <a class="link" href="/zoek/?q=${encodeURIComponent(raw)}" style="color:var(--mayo)">Zoek in alle 2.300 producten →</a></p><p>Mist er een echte klassieker? <a class="link" href="/contact/" style="color:var(--mayo)">Tip hem ons</a>.</p>`;
    if(q.length>=3) missTimer=setTimeout(()=>track("niet-gevonden/"+q),1500);
  }
  $("addbtn").addEventListener("click",()=>{ if(!$("addbox").hidden){ closeAdd(); return; } $("addbox").hidden=false; $("addbtn").setAttribute("aria-expanded","true"); $("addq").focus(); addSearch(); });
  $("addq").addEventListener("input",addSearch);
  $("addres").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return;
    const r=addPool().find(x=>x[0]===b.dataset.name); if(!r) return;
    extras.push(r); counts[rows().length-1]=1; closeAdd(); renderM(); });

  /* Deel je bonnetje: plaatje via canvas */
  function shareText(){ const n=total()/F, w=MO[moment].deeltekst; return `Mijn bonnetje: ${w.charAt(0).toLowerCase()+w.slice(1)} had ik ${fmt(n)} ${unit(n)}. En jij? frikandellenindex.nl`; }
  function wrap(ctx,text,maxW){ const words=text.split(" "), lines=[]; let line="";
    words.forEach(w=>{ const t=line?line+" "+w:w; if(ctx.measureText(t).width>maxW && line){ lines.push(line); line=w; } else line=t; }); if(line) lines.push(line); return lines; }
  async function bonCanvas(){
    try{ await Promise.all(['500 30px "JetBrains Mono"','40px "Bowlby One"','700 30px "Bricolage Grotesque"'].map(f=>document.fonts.load(f))); }catch(e){}
    const W=1080,H=1350,c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
    const MONO='"JetBrains Mono", ui-monospace, monospace', DISP='"Bowlby One","Arial Black",sans-serif', BODY='"Bricolage Grotesque", system-ui, sans-serif';
    x.fillStyle="#C2362B"; x.fillRect(0,0,W,H);
    x.fillStyle="#FFF5DA"; x.textAlign="center"; x.font=`54px ${DISP}`; x.fillText("De Frikandellenindex",W/2,118);
    const r=rows().map(([name,k],i)=>[name,counts[i]||0,k]).filter(z=>z[1]>0);
    const shown=r.slice(0,5), more=r.length-shown.length;
    const n=total()/F, jk=joke(n);
    const PX=150, PW=W-2*PX, L=PX+55, R=PX+PW-55;
    x.font=`600 36px ${BODY}`; const jl=wrap(x,jk,PW-110).slice(0,3);
    function content(top,draw){
      let y=top+70;
      const T=(s,xx,yy)=>{ if(draw) x.fillText(s,xx,yy); };
      const dash=yy=>{ if(!draw) return; x.save(); x.strokeStyle="#9C8F80"; x.lineWidth=3; x.setLineDash([12,10]); x.beginPath(); x.moveTo(PX+50,yy); x.lineTo(PX+PW-50,yy); x.stroke(); x.restore(); };
      const row=(a,b)=>{ x.textAlign="left"; let s=a; while(x.measureText(s).width>PW-260 && s.length>4) s=s.slice(0,-2); if(s!==a) s=s.trim()+"…"; T(s,L,y); x.textAlign="right"; T(b,R,y); y+=50; };
      x.textAlign="center"; x.fillStyle="#2A1A12"; x.font=`500 34px ${MONO}`; T("SNACKBAR DE INDEX",W/2,y); y+=44;
      x.fillStyle="#6D5C50"; x.font=`500 26px ${MONO}`; T(MO[moment].naam,W/2,y); y+=34;
      dash(y); y+=56;
      x.font=`500 30px ${MONO}`; x.fillStyle="#2A1A12";
      shown.forEach(([name,c,k])=>row(`${c}× ${name}`,fmt(c*k/F)));
      if(more){ const rest=r.slice(5).reduce((s,[,c,k])=>s+c*k,0); row(`+ ${more} andere`,fmt(rest/F)); }
      y-=14; dash(y); y+=56;
      x.font=`500 32px ${MONO}`; row("TOTAAL",`${fmt(n)} ${unit(n)}`);
      y+=120; x.textAlign="center"; x.fillStyle="#C2362B"; x.font=`150px ${DISP}`; T(fmt(n),W/2,y);
      y+=56; x.fillStyle="#2A1A12"; x.font=`700 36px ${BODY}`; T(n>=4?`${unit(n)} · Frikandellenkoning`:unit(n),W/2,y); y+=62;
      x.font=`600 36px ${BODY}`; jl.forEach(l=>{ T(l,W/2,y); y+=48; });
      y+=6; dash(y); y+=46;
      x.fillStyle="#6D5C50"; x.font=`500 24px ${MONO}`; T("1 frikandel = 180 kcal · Bedankt en tot ziens",W/2,y);
      return y+40-top;
    }
    const ph=content(0,false);
    const top=Math.max(160, Math.round(160+((H-160-150)-(ph+14))/2));
    x.save(); x.shadowColor="rgba(0,0,0,.35)"; x.shadowBlur=30; x.shadowOffsetY=12; x.fillStyle="#FBF8EF";
    x.beginPath(); x.moveTo(PX,top); x.lineTo(PX+PW,top); x.lineTo(PX+PW,top+ph);
    const zz=24; for(let px=PX+PW; px>PX; px-=zz){ x.lineTo(px-zz/2,top+ph+14); x.lineTo(Math.max(PX,px-zz),top+ph); }
    x.closePath(); x.fill(); x.restore();
    content(top,true);
    x.textAlign="center"; x.fillStyle="#FFF5DA"; x.font=`700 38px ${BODY}`; x.fillText("En jij? Reken het uit op frikandellenindex.nl",W/2,H-70);
    return c;
  }
  $("sharebon").addEventListener("click",async()=>{
    $("copied").hidden=true;
    const c=await bonCanvas();
    const blob=await new Promise(res=>c.toBlob(res,"image/png"));
    const file=new File([blob],"mijn-frikandellenbonnetje.png",{type:"image/png"});
    try{
      if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file],text:shareText()}); track("bonnetje-gedeeld"); return; }
    }catch(e){ if(e && e.name==="AbortError") return; }
    $("bonpic").src=c.toDataURL("image/png"); $("bonimg").hidden=false; track("bonnetje-plaatje");
  });
  $("copytxt").addEventListener("click",()=>{ copy(shareText(),$("copied")); track("bonnetje-tekst"); });

  /* Scorebalk onderin */
  let resultInView=false;
  function updateBar(){ $("scorebar").hidden=!(total()>0 && !resultInView); }
  try{ new IntersectionObserver(es=>{ resultInView=es[0].isIntersecting; updateBar(); },{threshold:0.2}).observe($("n")); }catch(e){}
  $("sbgo").addEventListener("click",()=>$("n").scrollIntoView({behavior:"smooth",block:"center"}));
  function setTabH(){ const t=document.querySelector(".tabbar"); if(t) document.documentElement.style.setProperty("--tabh", t.offsetHeight+"px"); }
  window.addEventListener("resize",setTabH); setTabH();

  load(moment);
})();

/* Quiz: meer of minder? */
(function(){
  if(!$("qbox") || !FI.quiz) return;
  const QUIZ=FI.quiz.map(q=>[q.snack,q.portie,q.grens,q.kcal,q.knipoog]);
  let qi=0, qscore=0, qres=[], qorder=QUIZ.map((_,i)=>i);
  const qn=k=>Math.round(k/F*10)/10;
  function start(shuffle){
    qi=0; qscore=0; qres=[];
    if(shuffle){ for(let i=qorder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [qorder[i],qorder[j]]=[qorder[j],qorder[i]];} }
    question();
  }
  const segs=cur=>QUIZ.map((_,i)=>`<span class="${i<qres.length?(qres[i]?"ok":"no"):(i===cur?"cur":"")}"></span>`).join("");
  const grid=()=>qres.map(o=>o?"🟩":"🟥").join("");
  function question(){
    const [s,sub,g]=QUIZ[qorder[qi]];
    $("qbox").innerHTML=`<div class="qprog"><span>Vraag ${qi+1} van ${QUIZ.length}</span><span>${qscore} goed</span></div>
    <div class="qsegs" aria-hidden="true">${segs(qi)}</div>
    <div class="qsnack">${esc(s)}<span>${esc(sub)}</span></div>
    <p class="qask">Meer of minder dan <b>${fmt(g)} frikandel</b>?</p>
    <div id="qslot" aria-live="polite"><div class="qbtns"><button type="button" id="q-meer" data-a="meer">Meer</button><button type="button" id="q-minder" data-a="minder">Minder</button></div></div>`;
  }
  function answer(a){
    const [,,g,k,wink]=QUIZ[qorder[qi]], v=qn(k), right=v>g?"meer":"minder", ok=a===right;
    if(ok) qscore++;
    qres[qi]=ok;
    const sg=document.querySelector(".qsegs"); if(sg) sg.innerHTML=segs(-1);
    const pr=document.querySelector(".qprog span:last-child"); if(pr) pr.textContent=qscore+" goed";
    const last=qi===QUIZ.length-1;
    const intro=$("qintro"); if(intro) intro.hidden=true;
    $("qslot").innerHTML=`<div class="qres2"><div class="qline"><span class="qok${ok?"":" no"}">${ok?"✓ Goed":"✗ Mis, "+right}</span><span class="n">${fmt(v)}</span><span class="u">frikandel</span><span class="dels" aria-hidden="true">${dels(v,6)}</span></div>
    <button type="button" class="qnext qnext2" id="qnext">${last?"Bekijk je score →":"Volgende →"}</button>
    <p class="qwink">${esc(wink)}</p></div>`;
    $("qnext").focus({preventScroll:true});
  }
  function rank(){
    const n=qscore;
    return n>=10?["Frikandellenprofessor","Jij ziet frikandellen waar anderen koekjes zien."]:
      n>=8?["Snackbarsommelier","Verdacht veel verstand van borrelnoten."]:
      n>=6?["Koektrommelkenner","Je schoonmoeder kan je niks meer wijsmaken."]:
      n>=3?["Gelegenheidsgokker","Vaak ernaast. Net als bijna iedereen."]:
      ["Ongemerkte snacker","Ongemerkt snacken bestaat, en jij bent het bewijs."];
  }
  const shareTxt=()=>`Ik ben ${rank()[0]}: ${qscore} van de ${QUIZ.length} goed bij Meer of minder?\n${grid()}\nWat ben jij? frikandellenindex.nl/quiz`;
  function end(){
    track("quiz-afgemaakt");
    const [title,line]=rank();
    const soft=t=>esc(t).replace(/(Frikandellen|Snackbar|Koektrommel|Gelegenheids)(?=[a-z])/,"$1&shy;");
    $("qbox").innerHTML=`<div class="qend" aria-live="polite">
    <span class="qok">Jij bent</span>
    <h2 class="qtitle">${soft(title)}</h2>
    <div class="qsegs qsegs-end" aria-hidden="true">${segs(-1)}</div>
    <p class="verdict">${qscore} van de ${QUIZ.length} goed. ${esc(line)}</p>
    <div class="share"><h3>Wat ben jij?</h3>
    <div class="cardprev"><span class="big">${soft(title)}</span><span class="smalltxt">${qscore} van de ${QUIZ.length} goed bij Meer of minder? Wat ben jij?</span><span class="qsegs qsegs-card" aria-hidden="true">${segs(-1)}</span><span class="row2"><span class="small">frikandellenindex.nl/quiz</span><span class="del"></span></span></div>
    <button class="copy" id="qshare" type="button">Daag iemand uit</button><span class="copied" id="qcopied" hidden></span></div>
    <button class="reset" id="qagain" type="button">Nog een keer, andere volgorde</button>
    <a class="link" href="/reken/" style="color:var(--mayo)">Hoeveel frikandellen was jouw laatste borrel? →</a></div>`;
  }
  $("qbox").addEventListener("click",e=>{
    const b=e.target.closest("button"); if(!b) return;
    if(b.dataset.a && !b.disabled) answer(b.dataset.a);
    else if(b.id==="qnext"){ if(qi<QUIZ.length-1){ qi++; question(); } else { end(); const r=$("qbox").getBoundingClientRect(); if(r.top<0) $("qbox").scrollIntoView({block:"start"}); } }
    else if(b.id==="qagain") start(true);
    else if(b.id==="qshare"){ (async()=>{
      try{ if(navigator.share){ await navigator.share({text:shareTxt()}); track("quiz-gedeeld"); return; } }catch(err){ if(err && err.name==="AbortError") return; }
      copy(shareTxt(),$("qcopied")); track("quiz-gedeeld"); })(); }
  });
  start(false);
})();

/* Eén quizvraag op de homepage */
(function(){
  const box=$("miniq"); if(!box) return;
  box.addEventListener("click",e=>{
    const b=e.target.closest("button[data-pick]"); if(!b || b.disabled) return;
    const d=box.dataset, ok=b.dataset.pick===d.right;
    box.querySelector(".qbtns").outerHTML=`<div class="qres2"><div class="qline"><span class="qok${ok?"":" no"}">${ok?"✓ Goed":"✗ Mis, "+d.right}</span><span class="n">${esc(d.v)}</span><span class="u">frikandel</span></div><p class="qwink">${esc(d.wink)}</p></div>`;
    track("home-quizvraag");
  });
})();

/* Zoeken */
(function(){
  if(!$("q") || !window.FI_NEVO || !FI.moments) return;
  const POP=[], seen=new Set();
  FI.moments.forEach(m=>m.producten.forEach(p=>{ if(!seen.has(p.naam)){ seen.add(p.naam); POP.push([norm(p.naam),p.naam,p.kcal]); } }));
  (FI.extra||[]).forEach(p=>{ if(!seen.has(p.naam)){ seen.add(p.naam); POP.push([norm(p.naam),p.naam,p.kcal]); } });
  const IDX=window.FI_NEVO.map(([n,k])=>[norm(n),n,k]);
  function search(){
    const q=norm($("q").value.trim()), g=Math.max(1,+$("g").value||100);
    if(q.length<2){ $("results").innerHTML=""; $("hint").textContent=`Zoek in onze bekende snacks en in ${IDX.length.toLocaleString("nl-NL")} producten uit de Nederlandse voedingsmiddelentabel.`; return; }
    const w=q.split(/\s+/), match=s=>w.every(x=>s.includes(x));
    const p=POP.filter(([s])=>match(s)), h=IDX.filter(([s])=>match(s));
    let html="";
    if(p.length) html+=`<div class="group">Bekende snacks, per portie</div>`+p.map(([,n,k])=>`<div class="res"><div class="nm">${esc(n)}<span>per portie</span></div><b>${fmt(k/F)}</b></div>`).join("");
    if(h.length) html+=`<div class="group">NEVO-tabel, voor ${g} gram</div>`+h.slice(0,30).map(([,n,k])=>`<div class="res"><div class="nm">${esc(n)}<span>NEVO-product</span></div><b>${fmt(k*g/100/F)}</b></div>`).join("");
    $("results").innerHTML=html;
    $("hint").textContent=(p.length||h.length)?(h.length>30?`NEVO: eerste 30 van ${h.length}. Zoek specifieker.`:""):"Niets gevonden. Probeer een ander woord.";
  }
  $("q").addEventListener("input",search); $("g").addEventListener("input",search);
  try{ const pq=new URLSearchParams(location.search).get("q"); if(pq) $("q").value=pq; }catch(e){}
  search();
})();
})();

/* Nieuws: deelknop onder een artikel */
(function(){
  document.querySelectorAll("[data-deel]").forEach(b=>{
    b.addEventListener("click",async()=>{
      const url=location.href.split("#")[0], title=document.querySelector("h1")?.textContent||document.title, ok=b.parentNode.querySelector(".deel-ok");
      try{ if(window.goatcounter && window.goatcounter.count) window.goatcounter.count({path:(b.dataset.deel.startsWith("blog-")?"blog-gedeeld/":"nieuws-gedeeld/")+b.dataset.deel, title:(b.dataset.deel.startsWith("blog-")?"blog-gedeeld":"nieuws-gedeeld"), event:true}); }catch(e){}
      try{ if(navigator.share){ await navigator.share({title, url}); return; } }catch(e){ if(e && e.name==="AbortError") return; }
      try{ await navigator.clipboard.writeText(title+" "+url); if(ok) ok.textContent="Link gekopieerd. Plak hem waar je wilt."; }
      catch(e){ if(ok) ok.textContent=url; }
    });
  });
})();
