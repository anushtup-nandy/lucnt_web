/* lucnt — behavior: SPA hash router, hero line-untangle into ledger rules, platform scenes, ledger loop. */
(function () {
  'use strict';

  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  /* black-and-white book spines — weighted toward dark, a few pale for contrast */
  const BK_VARIANTS=['bk-black','bk-ink','bk-ink','bk-slate','bk-slate','bk-gray','bk-pale','bk-paper'];
  const pickBk=()=>BK_VARIANTS[Math.random()*BK_VARIANTS.length|0];

  /* nav */
  addEventListener('scroll',()=>$('#nav').classList.toggle('solid',scrollY>40),{passive:true});

  /* reveal */
  const rvIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rvIO.unobserve(e.target);}}),{threshold:.2});
  $$('.rv').forEach(el=>rvIO.observe(el));

  /* capture */
  $$('[data-cap]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();
    f.innerHTML='<span class="cap-done">&#10003;&nbsp; You are on the list. We will write soon.</span>';}));

  /* waitlist section */
  const waitForm=$('#waitForm'),waitDone=$('#waitDone');
  if(waitForm){waitForm.addEventListener('submit',e=>{
    e.preventDefault();
    waitForm.classList.add('hide');
    waitDone.classList.add('show');
  });}

  /* ================= SPA PAGE ROUTER ================= */
  const PAGE_MAP={
    'blog':'page-blog',
    'post-agent-economy':'page-post-agent-economy',
    'post-policy':'page-post-policy',
    'post-books':'page-post-books'
  };
  function showPage(id){
    $$('.spaPage').forEach(p=>p.classList.remove('active'));
    const target=document.getElementById(id);
    if(target)target.classList.add('active');
  }
  function route(){
    const h=location.hash.replace('#','');
    if(PAGE_MAP[h]){
      showPage(PAGE_MAP[h]);
      window.scrollTo({top:0,behavior:'instant'});
    }else{
      showPage('page-home');
      if(h){const el=document.getElementById(h);if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth'}),60);}
      else window.scrollTo({top:0,behavior:'instant'});
    }
  }
  addEventListener('hashchange',route);
  route();

  /* ============ HERO: a dense skein of agent spend combs itself out, thread by thread, into a balanced ledger ============ */
  (function(){
    const svg=$('#weave');if(!svg)return;
    const NS='http://www.w3.org/2000/svg';
    const mk=(tag,a,txt)=>{const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;return e;};
    const clamp=(v,a,b)=>v<a?a:v>b?b:v;
    const lerp=(a,b,t)=>a+(b-a)*t;
    const gLines=$('#wLines',svg),gChaos=$('#wChaos',svg),gOrder=$('#wOrder',svg),bal=$('#wBal',svg);

    /* canvas + ledger geometry (viewBox 0 0 1280 470) */
    const W=1280,H=470,mX=96,runW=W-mX*2,cy=H/2;
    const STR=13,topY=42,botY=418,rGap=(botY-topY)/(STR-1),M=56; // 13 ruled lines, 56 samples per thread
    const rowY=s=>topY+rGap*s;
    const memoX=mX+380;
    const ENTRY_RULES=[0,2,4,6,8,10,12];               // header + 6 entries on alternating rules; the rest stay blank

    /* deterministic PRNG — the knot is byte-identical on every replay */
    const prng=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
    const rnd=(r,lo,hi)=>lo+(hi-lo)*r();

    /* ordered target: every thread is one dead-straight ruled line */
    const ordPts=[];
    for(let s=0;s<STR;s++){const y=rowY(s),row=[];for(let i=0;i<M;i++){row.push({x:mX+(i/(M-1))*runW,y});}ordPts.push(row);}

    /* chaos target: each thread wanders the whole field on three harmonics, looping and crossing the others */
    const chaPts=[],ycArr=[];
    for(let s=0;s<STR;s++){
      const r=prng(0x9E37+s*0x61C8);
      const HX=[{f:2+((r()*4)|0),a:rnd(r,150,235),p:r()*6.283},{f:3+((r()*4)|0),a:rnd(r,80,145),p:r()*6.283},{f:5+((r()*3)|0),a:rnd(r,34,74),p:r()*6.283}];
      const HY=[{f:2+((r()*3)|0),a:rnd(r,100,160),p:r()*6.283},{f:3+((r()*4)|0),a:rnd(r,50,92),p:r()*6.283},{f:6+((r()*3)|0),a:rnd(r,22,48),p:r()*6.283}];
      const yc=cy+(rowY(s)-cy)*0.45;ycArr.push(yc);      // spread across the sheet, pulled toward centre so lanes overlap
      const row=[];
      for(let i=0;i<M;i++){
        const t=i/(M-1),th=t*6.283;
        const envX=Math.pow(Math.sin(Math.PI*t),0.6);   // threads gather at the ledger margins, bulge in the belly
        const envY=0.45+0.55*Math.sin(Math.PI*t);       // roams top-to-bottom, even near the ends
        let x=mX+t*runW,y=yc;
        for(const h of HX)x+=h.a*Math.sin(h.f*th+h.p)*envX;
        for(const h of HY)y+=h.a*Math.sin(h.f*th+h.p)*envY;
        row.push({x:clamp(x,6,W-6),y:clamp(y,10,H-10)});
      }
      chaPts.push(row);
    }

    /* per-thread stroke: entry rules a touch stronger, blank rules faint; varied while tangled for depth */
    const style=[];
    for(let s=0;s<STR;s++){
      const r=prng(0x1F3+s*0x9E39);
      const entry=ENTRY_RULES.indexOf(s)>=0;
      style.push({chaosOp:rnd(r,0.5,0.9),restOp:entry?0.6:0.3,w:entry?1.5:1.2});
    }

    /* the strand paths */
    const paths=[];
    for(let s=0;s<STR;s++){const p=mk('path',{class:'wline','stroke-width':style[s].w});gLines.appendChild(p);paths.push(p);}

    /* the disorganized reality — receipts, invoices and slips scattered across the whole field */
    const PAPERS=[
      {v:'OpenAI',s:'GPT-5 · 2.1M tok',a:'$18,053'},
      {v:'AWS',s:'compute · us-east',a:'$110'},
      {v:'Figma',s:'4 seats · monthly',a:'$180'},
      {v:'Datadog',s:'logs · ingest',a:'$342'},
      {v:'Canva',s:'auto-renewed',a:'$119',f:'OFF-POLICY'},
      {v:'Slack',s:'30 seats',a:'$240'},
      {v:'Notion',s:'+12 seats',a:'$96'},
      {v:'Vercel',s:'usage · overage',a:'$61'},
      {v:'Contractor',s:'invoice · net-30',a:'$1,200',f:'NO PO'},
      {v:'GitHub',s:'Copilot · biz',a:'$228'},
      {v:'Stripe',s:'processing fee',a:'$47'},
      {v:'Zoom',s:'Pro · annual',a:'$150',f:'DUPLICATE'},
      {v:'Anthropic',s:'Claude · API',a:'₹15,299'}
    ];
    /* a receipt outline: clean top and sides, torn/perforated bottom edge */
    function receiptPath(w,h){
      const hw=w/2,hh=h/2,teeth=Math.max(5,Math.round(w/18)),tw=w/teeth;
      let d='M'+(-hw)+' '+(-hh)+' L'+hw+' '+(-hh)+' L'+hw+' '+(hh-3);
      for(let i=0;i<teeth;i++){d+=' L'+(hw-(i+0.5)*tw).toFixed(1)+' '+hh+' L'+(hw-(i+1)*tw).toFixed(1)+' '+(hh-3);}
      return d+' Z';
    }
    const COLX=[190,410,635,860,1080],ROWY=[112,238,362];
    const rcpts=[];
    PAPERS.forEach((d,i)=>{
      const r=prng(0x51ED+i*0x2E31);
      const w=118+Math.round(rnd(r,0,54)),h=60+Math.round(rnd(r,0,28)),hw=w/2,hh=h/2,padX=-hw+12;
      const g=mk('g',{class:'rcpt'});
      g.appendChild(mk('path',{class:'rc-paper',d:receiptPath(w,h)}));
      g.appendChild(mk('text',{x:padX,y:-hh+19,class:'rc-vendor'},d.v));
      if(d.s&&!d.f)g.appendChild(mk('text',{x:padX,y:-hh+33,class:'rc-sub'},d.s)); // flag takes the sub-line's place
      g.appendChild(mk('rect',{x:padX,y:-hh+41,width:(w*0.5).toFixed(0),height:2,class:'rc-line'}));
      g.appendChild(mk('rect',{x:padX,y:-hh+49,width:(w*0.34).toFixed(0),height:2,class:'rc-line'}));
      g.appendChild(mk('text',{x:hw-12,y:hh-13,class:'rc-amt','text-anchor':'end'},d.a));
      if(d.f){const fx=hw-14,fy=-hh+17;g.appendChild(mk('text',{x:fx,y:fy,class:'rc-flag','text-anchor':'end',transform:'rotate(-9 '+fx+' '+fy+')'},d.f));}
      gChaos.appendChild(g);
      const cx=clamp(COLX[i%5]+rnd(r,-46,46),128,W-128),cy=clamp(ROWY[(i/5|0)%3]+rnd(r,-42,42),74,H-74);
      rcpts.push({g,cx,cy,rot:rnd(r,-16,16),rule:i,      // one paper per rule — flutters in, hangs in the knot, then files onto its line
        y0:-(470+rnd(r,0,340)),fd:(i/(STR-1))*0.16+rnd(r,0,0.03), // start above the page top; rain down staggered
        swA:rnd(r,34,82),swC:rnd(r,3,6),swP:r()*6.283,   // wide lateral glide, damping to rest
        roA:rnd(r,8,22),roC:rnd(r,3,7),roP:r()*6.283});  // rocking tumble, damping to its resting tilt
    });

    /* the sheer volume of raw spend: extra slips rain down across the full width, scatter into the tangle, then dissolve */
    const RAIN=[{a:'$12'},{v:'Uber',a:'$44'},{a:'$8'},{v:'Loom'},{a:'$320'},{v:'Airtable',a:'$60'},{},{a:'$5'},{v:'Retool',a:'$210'},{a:'$1,024'},{v:'Sentry'},{a:'$73'},{},{a:'$96'},{v:'Linear'},{a:'$19'}];
    const rainX=[];
    RAIN.forEach((d,i)=>{
      const r=prng(0xBEEF+i*0x2545F5);
      const w=74+Math.round(rnd(r,0,44)),hh=(44+Math.round(rnd(r,0,20)))/2,hw=w/2,padX=-hw+10;
      const g=mk('g',{class:'rcpt rain'});
      g.appendChild(mk('path',{class:'rc-paper',d:receiptPath(w,hh*2)}));
      if(d.v)g.appendChild(mk('text',{x:padX,y:-hh+15,class:'rc-vendor'},d.v));
      g.appendChild(mk('rect',{x:padX,y:-hh+(d.v?25:15),width:(w*0.5).toFixed(0),height:2,class:'rc-line'}));
      g.appendChild(mk('rect',{x:padX,y:-hh+(d.v?33:23),width:(w*0.32).toFixed(0),height:2,class:'rc-line'}));
      if(d.a)g.appendChild(mk('text',{x:hw-10,y:hh-10,class:'rc-amt','text-anchor':'end'},d.a));
      gChaos.insertBefore(g,gChaos.firstChild);          // behind the real receipts
      rainX.push({g,cx:clamp(70+rnd(r,0,1140),60,1220),cy:clamp(rnd(r,88,412),70,H-70),rot:rnd(r,-22,22),
        y0:-(440+rnd(r,0,420)),fd:rnd(r,0,0.30),          // rain in over a long window
        swA:rnd(r,30,84),swC:rnd(r,3,6),swP:r()*6.283,roA:rnd(r,10,26),roC:rnd(r,3,7),roP:r()*6.283});
    });

    /* the ledger it becomes — three columns on the ruled lines, debits equal credits */
    gOrder.appendChild(mk('text',{x:mX+6,y:rowY(0)-8,class:'wo whead','data-rule':0},'LEDGER · JUL'));
    gOrder.appendChild(mk('text',{x:memoX,y:rowY(0)-8,class:'wo whead memo','data-rule':0},'MEMO'));
    gOrder.appendChild(mk('text',{x:mX+runW-6,y:rowY(0)-8,class:'wo whead','data-rule':0,'text-anchor':'end'},'IND AS · ₹'));
    const ENTRIES=[
      ['Dr','R&D Software','OpenAI · GPT-5','15,299'],
      ['Dr','Input IGST 18%','reverse charge','2,754'],
      ['Dr','Cloud Infrastructure','AWS · compute','8,900'],
      ['Cr','OpenAI payable','INV-OA-4471','15,299'],
      ['Cr','AWS payable','INV-AWS-3392','8,900'],
      ['Cr','IGST payable · RCM','filed automatically','2,754']
    ];
    ENTRIES.forEach((en,i)=>{
      const rule=ENTRY_RULES[i+1],y=rowY(rule)-8;
      const left=mk('text',{x:mX+6,y,class:'wo','data-rule':rule});
      left.appendChild(mk('tspan',{class:'tag'},en[0]+'  '));
      left.appendChild(mk('tspan',null,en[1]));
      gOrder.appendChild(left);
      gOrder.appendChild(mk('text',{x:memoX,y,class:'wmemo','data-rule':rule},en[2]));
      gOrder.appendChild(mk('text',{x:mX+runW-6,y,class:'wo','data-rule':rule,'text-anchor':'end'},en[3]));
    });
    const orderEls=[...gOrder.querySelectorAll('text')].map(el=>({el,rule:+el.getAttribute('data-rule')}));

    const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    /* Catmull-Rom -> cubic bezier: collinear points stay straight, only the turns curve */
    function crPath(p){
      let d='M'+p[0].x.toFixed(1)+' '+p[0].y.toFixed(1);
      for(let i=0;i<p.length-1;i++){
        const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p[i+1];
        const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6,c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
        d+='C'+c1x.toFixed(1)+' '+c1y.toFixed(1)+' '+c2x.toFixed(1)+' '+c2y.toFixed(1)+' '+p2.x.toFixed(1)+' '+p2.y.toFixed(1);
      }
      return d;
    }
    /* three phases along gt: FALL (papers flutter in) -> ENTANGLE (knot weaves in around them) -> COMB (straighten to ruled lines) */
    const SSTAG=0.30,PSTAG=0.16,SPAN=1-SSTAG-PSTAG,RFLY=0.42,homeX=mX+90;
    const ENT0=0.30,COMB0=0.54,FALLD=0.30;             // entangle start, comb start, per-paper fall duration (long, floaty descent)
    const cur=new Array(M);
    function frame(gt){
      const combT=clamp((gt-COMB0)/(1-COMB0),0,1);
      const eP=ease(clamp((gt-ENT0)/(COMB0-ENT0),0,1)); // the tangle weaves in around the fallen papers
      for(let s=0;s<STR;s++){
        const sd=(s/(STR-1))*SSTAG,a=chaPts[s],b=ordPts[s];
        if(combT<=0){                                   // pre-comb: grow the knot out of calm, near-flat threads
          const y0=ycArr[s];
          for(let i=0;i<M;i++){const t=i/(M-1);cur[i]={x:lerp(mX+t*runW,a[i].x,eP),y:lerp(y0,a[i].y,eP)};}
          paths[s].setAttribute('d',crPath(cur));
          paths[s].style.opacity=(style[s].chaosOp*eP).toFixed(3);
        }else{                                          // comb cascade: top thread settles first, left-to-right along each
          for(let i=0;i<M;i++){const e=ease(clamp((combT-sd-(i/(M-1))*PSTAG)/SPAN,0,1));cur[i]={x:lerp(a[i].x,b[i].x,e),y:lerp(a[i].y,b[i].y,e)};}
          paths[s].setAttribute('d',crPath(cur));
          const so=ease(clamp((combT-sd-PSTAG)/SPAN,0,1));
          paths[s].style.opacity=lerp(style[s].chaosOp,style[s].restOp,so).toFixed(3);
        }
      }
      for(const rc of rcpts){                           // flutter down into the knot, hang, then file onto the line
        const sd=(rc.rule/(STR-1))*SSTAG;
        const fRaw=clamp((gt-rc.fd)/FALLD,0,1),fP=ease(fRaw);           // graceful glide down from the top
        const bx=rc.cx+rc.swA*Math.sin(fRaw*rc.swC+rc.swP)*(1-fRaw);    // lateral glide, damping to rest
        const by=lerp(rc.y0,rc.cy,fP),brot=rc.rot+rc.roA*Math.sin(fRaw*rc.roC+rc.roP)*(1-fRaw);
        const ce=ease(clamp((combT-(sd+SPAN-RFLY))/RFLY,0,1));          // fly to rule + flatten
        const x=lerp(bx,homeX,ce),y=lerp(by,rowY(rc.rule),ce),rot=lerp(brot,0,ce),sx=lerp(1,.55,ce),sy=lerp(1,.06,ce);
        rc.g.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+rot.toFixed(1)+') scale('+sx.toFixed(3)+' '+sy.toFixed(3)+')');
        rc.g.style.opacity=(clamp(fRaw/0.28,0,1)*(1-clamp((ce-.55)/.45,0,1))).toFixed(3); // fade in as it drops, out as it files
      }
      for(const rc of rainX){                           // extra spend just rains down and dissolves into the tangle
        const fRaw=clamp((gt-rc.fd)/FALLD,0,1),fP=ease(fRaw);
        const x=rc.cx+rc.swA*Math.sin(fRaw*rc.swC+rc.swP)*(1-fRaw);
        const y=lerp(rc.y0,rc.cy,fP),rot=rc.rot+rc.roA*Math.sin(fRaw*rc.roC+rc.roP)*(1-fRaw);
        rc.g.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+rot.toFixed(1)+')');
        const fadeOut=1-clamp((gt-ENT0)/(COMB0-ENT0),0,1); // absorbed as the knot weaves in
        rc.g.style.opacity=(clamp(fRaw/0.28,0,1)*fadeOut*0.9).toFixed(3);
      }
      for(const o of orderEls){                         // each entry writes itself just after its paper is filed
        const sd=(o.rule/(STR-1))*SSTAG;
        const e=ease(clamp((combT-(sd+SPAN+0.04))/0.16,0,1));
        o.el.style.opacity=e;o.el.style.transform='translateY('+((1-e)*7).toFixed(1)+'px)';
      }
      bal.classList.toggle('on',combT>0.95);
    }
    const DUR=4800;let raf=null,startT=0,running=false,enterT=null;
    function play(now){if(!startT)startT=now;const gt=Math.min(1,(now-startT)/DUR);frame(gt);if(gt<1)raf=requestAnimationFrame(play);else running=false;}
    function start(){if(running)return;running=true;startT=0;if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(play);}
    function reset(){clearTimeout(enterT);if(raf)cancelAnimationFrame(raf);running=false;frame(0);}
    if(reduced){frame(1);return;}
    frame(0);                                           // begin empty — the papers then flutter in from above
    new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting)enterT=setTimeout(start,350);else reset(); // replays each time the hero returns
    }),{threshold:.35}).observe(svg);
  })();

  /* ================= SHELF ENGINE — spring physics, pure objects ================= */
  const STIFF=0.14, DAMP=0.72; // underdamped on purpose: settles with a small overshoot, like real mass
  function mkShelf(el,opts){
    const O=Object.assign({min:70,max:0.82,baseCount:6,pileMax:6,gap:9},opts||{});
    let books=[],idc=0,phase='grow',running=false,rafId=null,narrTimer=null;
    const H=()=>el.clientHeight, CW=()=>el.clientWidth;
    function springProp(v){return {c:v,v:0,t:v};}
    function randSpec(scale){
      scale=scale||1;
      const variant=pickBk();
      const w=(24+Math.random()*42)*scale;
      const h=O.min+Math.random()*(H()*O.max-O.min);
      return {variant,w:Math.max(16,Math.round(w)),h:Math.round(h)};
    }
    function addBook(spec,stacked,startX){
      const bEl=document.createElement('div');
      bEl.className='book '+spec.variant;
      el.appendChild(bEl);
      const b={
        el:bEl,variant:spec.variant,w:spec.w,stacked:!!stacked,id:idc++,
        x:springProp(startX!==undefined?startX:CW()/2),
        h:springProp(4),
        rot:springProp(0),
        y:springProp(0)
      };
      b.h.t=spec.h;
      books.push(b);
      return b;
    }
    function layoutTargets(){
      const row=books.filter(b=>!b.stacked);
      const totalW=row.reduce((s,b)=>s+b.w,0)+O.gap*Math.max(0,row.length-1);
      let x=Math.max(12,(CW()-totalW)/2);
      row.forEach(b=>{b.x.t=x;b.rot.t=0;b.y.t=0;x+=b.w+O.gap;});
      const pile=books.filter(b=>b.stacked);
      pile.forEach((b,i)=>{
        b.x.t=CW()-46-i*11;
        b.rot.t=(i%2===0?1:-1)*(7+i*3.2);
        b.y.t=-(8+i*6);
      });
    }
    function wouldOverflow(newW){
      const row=books.filter(b=>!b.stacked);
      const totalW=row.reduce((s,b)=>s+b.w,0)+O.gap*row.length;
      return (totalW+newW)>CW()-20;
    }
    function tick(){
      for(const b of books){
        for(const k of ['x','h','rot','y']){
          const p=b[k];
          const f=(p.t-p.c)*STIFF;
          p.v=(p.v+f)*DAMP;
          p.c+=p.v;
        }
        b.el.style.left=b.x.c+'px';
        b.el.style.width=b.w+'px';
        b.el.style.height=Math.max(4,b.h.c)+'px';
        b.el.style.transform='translateY('+b.y.c+'px) rotate('+b.rot.c+'deg)';
        b.el.style.zIndex=b.stacked?(20+Math.round(-b.y.t)):1;
      }
      if(running)rafId=requestAnimationFrame(tick);
    }
    function removeBook(b){
      b.h.t=0;b.el.style.opacity='0';
      books=books.filter(x=>x!==b);
      setTimeout(()=>b.el.remove(),600);
    }
    function compress(){
      phase='pause';
      clearTimeout(narrTimer);
      setTimeout(()=>{
        const keep=[...books].sort(()=>Math.random()-.5).slice(0,O.baseCount);
        const drop=books.filter(b=>keep.indexOf(b)<0);
        drop.forEach(removeBook);
        keep.forEach(b=>{
          b.stacked=false;
          const s=randSpec(.92);
          b.variant=s.variant;b.el.className='book '+s.variant;b.w=s.w;b.h.t=s.h;
        });
        books=keep;
        layoutTargets();
        setTimeout(()=>{phase='grow';if(running)narrLoop();},1500);
      },1000);
    }
    function narrLoop(){
      if(phase==='grow'){
        const spec=randSpec();
        const stacked=wouldOverflow(spec.w);
        addBook(spec,stacked,CW()/2);
        layoutTargets();
        if(books.filter(b=>b.stacked).length>=O.pileMax){phase='compress';compress();return;}
      }
      if(running)narrTimer=setTimeout(narrLoop,650+Math.random()*450);
    }
    function init(){
      books.forEach(b=>b.el.remove());books=[];idc=0;phase='grow';
      for(let i=0;i<O.baseCount;i++)addBook(randSpec(),false);
      layoutTargets();
      books.forEach(b=>{b.x.c=b.x.t;});
    }
    function start(){if(running||reduced)return;running=true;tick();narrLoop();}
    function stop(){running=false;if(rafId)cancelAnimationFrame(rafId);clearTimeout(narrTimer);}
    function grow(spec){
      spec=spec||{};
      const b=addBook({variant:spec.variant||pickBk(),w:spec.w||44,h:spec.h||160},false,CW()/2);
      layoutTargets();
      return b;
    }
    init();
    addEventListener('resize',layoutTargets);
    new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?start():stop()),{threshold:.15}).observe(el);
    return {el,grow,get books(){return books}};
  }
  const shelfBooks=mkShelf($('#shelfBooks'),{baseCount:7,pileMax:7,min:80});

  /* ================= PLATFORM: chapters + scene timelines ================= */
  const plat=$('#plat'),scenes=$$('.scene'),pills=$$('.pill'),chapters=$$('.chapter'),dots=$$('.dotRail .dot');
  let chIdx=-1,sceneTimers=[];
  function clearScene(){sceneTimers.forEach(clearTimeout);sceneTimers=[];}
  function st(fn,t){sceneTimers.push(setTimeout(fn,t));}
  function runScene(i){
    clearScene();
    const s=scenes[i];
    const F=[runGovern,runReconcile,runRemember][i];
    F(s);
  }
  function resetRows(s){$$('.frow',s).forEach(r=>{if(!r.classList.contains('in'))r.classList.remove('in','dissolve');});}
  function runGovern(s){
    resetRows(s);
    $('#goBtn',s).classList.remove('in','press');$('#goStamp',s).classList.remove('on');
    st(()=>$('.frow[data-r="1"]',s).classList.add('in'),700);
    st(()=>$('.frow[data-r="2"]',s).classList.add('in'),1500);
    st(()=>$('.frow[data-r="3"]',s).classList.add('in'),2300);
    st(()=>$('#goBtn',s).classList.add('in'),3100);
    st(()=>$('#goBtn',s).classList.add('press'),4600);
    st(()=>{$('#goBtn',s).classList.remove('press','in');$('#goStamp',s).classList.add('on');},4820);
    st(()=>runGovern(s),7600);
  }
  function runReconcile(s){
    resetRows(s);
    $('#rcTag',s).classList.remove('on');
    st(()=>$('.frow[data-r="1"]',s).classList.add('in'),700);
    st(()=>$('.frow[data-r="2"]',s).classList.add('in'),1500);
    st(()=>$('.frow[data-r="3"]',s).classList.add('in'),2300);
    st(()=>$('#rcTag',s).classList.add('on'),2500);
    st(()=>{$('.frow[data-r="3"]',s).classList.add('dissolve');},3700);
    st(()=>$('.frow[data-r="4"]',s).classList.add('in'),4000);
    st(()=>runReconcile(s),7400);
  }
  function runRemember(s){
    resetRows(s);
    $('#meBtn',s).classList.remove('in','press');$('#meStamp',s).classList.remove('on');
    st(()=>$('.frow[data-r="1"]',s).classList.add('in'),700);
    st(()=>$('.frow[data-r="2"]',s).classList.add('in'),1500);
    st(()=>$('.frow[data-r="3"]',s).classList.add('in'),2400);
    st(()=>$('#meBtn',s).classList.add('in'),3300);
    st(()=>$('#meBtn',s).classList.add('press'),4900);
    st(()=>{$('#meBtn',s).classList.remove('press','in');$('#meStamp',s).classList.add('on');},5120);
    st(()=>runRemember(s),8000);
  }
  function setChapter(i){
    if(i===chIdx)return;chIdx=i;
    scenes.forEach(sc=>sc.classList.toggle('on',+sc.dataset.s===i));
    pills.forEach(p=>p.classList.toggle('on',+p.dataset.t===i));
    chapters.forEach(c=>c.classList.toggle('on',+c.dataset.c===i));
    dots.forEach(d=>d.classList.toggle('on',+d.dataset.d===i));
    if(!reduced)runScene(i);
  }
  pills.forEach(p=>p.addEventListener('click',()=>{
    const i=+p.dataset.t;
    const span=plat.offsetHeight-innerHeight;
    const top=plat.getBoundingClientRect().top+scrollY;
    scrollTo({top:top+span*(i/3+0.12),behavior:'smooth'});
  }));
  dots.forEach(d=>d.addEventListener('click',()=>{
    const i=+d.dataset.d;
    const span=plat.offsetHeight-innerHeight;
    const top=plat.getBoundingClientRect().top+scrollY;
    scrollTo({top:top+span*(i/3+0.12),behavior:'smooth'});
  }));
  function platProgress(){
    const r=plat.getBoundingClientRect();
    const span=plat.offsetHeight-innerHeight;
    if(span<=0)return 0;
    return Math.min(1,Math.max(0,-r.top/span));
  }
  let raf=false;
  addEventListener('scroll',()=>{if(!raf){raf=true;requestAnimationFrame(()=>{
    if(!mobile()){const p=platProgress();setChapter(p<1/3?0:p<2/3?1:2);}
    raf=false;});}},{passive:true});
  /* pause scene timers when panel offscreen */
  new IntersectionObserver(es=>es.forEach(e=>{
    if(mobile())return;
    if(e.isIntersecting){if(chIdx<0)setChapter(0);else if(!reduced)runScene(chIdx);}
    else clearScene();
  }),{threshold:.2}).observe($('#canvasPanel'));

  /* mobile: run scene 0 only, statically advance through all three on tap of panel */
  if(mobile()&&!reduced){setChapter(0);
    let mi=0;$('#canvasPanel').addEventListener('click',()=>{mi=(mi+1)%3;setChapter(mi);});}

  /* ================= BOOKS: write -> close -> shelve loop ================= */
  const page=$('#ledgerPage');
  const CYCLE=[['\u20B9 INDIA \u00B7 JUL','IND AS','\u20B9 IND \u00B7 JUL'],['$ US \u00B7 JUL','US GAAP','$ US \u00B7 JUL'],['S$ SINGAPORE \u00B7 JUL','SFRS','S$ SG \u00B7 JUL'],['\u20AC EUROPE \u00B7 JUL','IFRS','\u20AC EU \u00B7 JUL']];
  let cyc=0;
  let bookTimers=[];
  function bt(fn,t){bookTimers.push(setTimeout(fn,t));}
  function runLedgerLoop(){
    bookTimers.forEach(clearTimeout);bookTimers=[];
    page.classList.remove('w1','w2','w3','w4','closing');
    page.style.opacity='1';
    const [ph,std]=CYCLE[cyc%4];
    const spans=page.querySelectorAll('.ph span');
    spans[0].textContent=ph;spans[1].textContent=std;
    void page.offsetWidth;
    bt(()=>page.classList.add('w1'),600);
    bt(()=>page.classList.add('w2'),1250);
    bt(()=>page.classList.add('w3'),1900);
    bt(()=>page.classList.add('w4'),2550);
    bt(()=>page.classList.add('closing'),4100);
    bt(()=>{ /* a new volume joins the shelf, no label, pure object */
      shelfBooks.grow({w:44,h:200});
      cyc++;
    },4800);
    bt(runLedgerLoop,8200);
  }
  if(!reduced){
    let ledgerOn=false;
    new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting&&!ledgerOn){ledgerOn=true;runLedgerLoop();}
      if(!e.isIntersecting&&ledgerOn){ledgerOn=false;bookTimers.forEach(clearTimeout);bookTimers=[];}
    }),{threshold:.3}).observe($('#books'));
  }else{page.classList.add('w1','w2','w3','w4');}
})();
