/* lucnt — behavior: SPA hash router, hero paper-flutter → book-shelf animation, platform scenes, ledger loop. */
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

  /* netlify forms: AJAX submit (static HTML already carries data-netlify + form-name for build-time detection) */
  const encodeForm=data=>Object.keys(data).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(data[k])).join('&');
  const submitToNetlify=form=>fetch('/',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:encodeForm(Object.fromEntries(new FormData(form)))
  });

  /* capture */
  $$('[data-cap]').forEach(f=>f.addEventListener('submit',e=>{
    e.preventDefault();
    submitToNetlify(f)
      .then(()=>{f.innerHTML='<span class="cap-done">&#10003;&nbsp; You are on the list. We will write soon.</span>';})
      .catch(()=>{f.innerHTML='<span class="cap-done">Something went wrong &mdash; email us instead.</span>';});
  }));

  /* waitlist section */
  const waitForm=$('#waitForm'),waitDone=$('#waitDone');
  if(waitForm){waitForm.addEventListener('submit',e=>{
    e.preventDefault();
    submitToNetlify(waitForm)
      .then(()=>{waitForm.classList.add('hide');waitDone.classList.add('show');})
      .catch(()=>{waitForm.querySelector('button').textContent='Something went wrong — try again';});
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
    const bl=$('#bookLayer');
    if(bl)bl.classList.toggle('hide',id!=='page-home');
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

  /* ================= BOOK STORY: hero chaos -> scroll-organized shelf -> platform ================= */
  (function(){
    const layer=$('#bookLayer');
    if(!layer)return;
    const plat=document.getElementById('plat');
    const COUNT=Math.max(7,Math.min(14,Math.round(window.innerWidth/74)));
    const GAP=10;
    const shelfEl=document.createElement('div');shelfEl.className='fshelf';layer.appendChild(shelfEl);
    let books=[],sorted=false,sorting=false,organizeScheduled=false,fallRaf=null,sortRaf=null,sortStart=0,t0=0,last=0;

    function mkEl(variant){
      const d=document.createElement('div');       // transform container; bkIn keyframe fades it in
      d.className='fbook';
      const paper=document.createElement('div');paper.className='skin paper';
      const book=document.createElement('div');book.className='skin book '+variant;
      d.appendChild(paper);d.appendChild(book);
      layer.appendChild(d);
      return {el:d,paperEl:paper,bookEl:book};
    }
    function layoutTidy(){
      const totalW=books.reduce((s,b)=>s+b.tidyW,0)+GAP*Math.max(0,books.length-1);
      const x0=Math.max(20,(window.innerWidth-totalW)/2);
      const baseY=window.innerHeight*0.90;        // shelf line near the base of the hero; book bottoms sit here
      let x=x0;
      books.forEach(b=>{
        b.tidy={x:x+b.tidyW/2,y:baseY-b.tidyH/2,a:0,w:b.tidyW,h:b.tidyH};
        x+=b.tidyW+GAP;
      });
      shelfEl.style.left=(x0-12)+'px';
      shelfEl.style.width=(totalW+24)+'px';
      shelfEl.style.top=baseY+'px';
    }
    function render(p){
      const n=books.length,spread=n>1?0.4:0;
      books.forEach((b,i)=>{
        // staggered sort wave: each book straightens a beat after the one before it
        let bp=n>1?(p-(i/(n-1))*spread)/(1-spread):p;
        bp=bp<0?0:bp>1?1:bp;
        bp=bp<.5?2*bp*bp:1-Math.pow(-2*bp+2,2)/2; // easeInOutQuad
        const c=b.chaos,t=b.tidy;
        const x=c.x+(t.x-c.x)*bp,y=c.y+(t.y-c.y)*bp,a=c.a+(t.a-c.a)*bp;
        const w=c.w+(t.w-c.w)*bp,h=c.h+(t.h-c.h)*bp;
        b.el.style.width=w+'px';
        b.el.style.height=h+'px';
        b.el.style.transform='translate('+(x-w/2)+'px,'+(y-h/2)+'px) rotate('+a+'deg)';
        b.bookEl.style.opacity=bp;           // page (bp=0) binds into a book spine (bp=1)
        b.paperEl.style.opacity=1-bp;
      });
      shelfEl.style.opacity=p<=0?0:Math.min(1,p*1.4); // ledge draws in as books settle onto it
    }
    /* falling-leaf flutter: slow floaty descent that PULSES, a WIDE side-to-side glide, constant rocking,
       and a 3D flex of the sheet — then a cushioned landing into a pile on the floor */
    function fallLoop(now){
      const dt=Math.min(0.033,(now-last)/1000);last=now;
      const te=(now-t0)/1000;
      let landed=0;
      for(const b of books){
        const f=b.fl,age=te-f.born;
        if(age<=0)continue;
        const gp=f.glideW*age+f.glidePh;
        // vertical: floaty; descends fastest mid-glide and stalls at each turn (the flutter cadence),
        // eased in from rest, then cushioned into the floor so it doesn't slam like a brick
        let vy=f.vyMean*(0.55+0.45*Math.abs(Math.cos(gp)))*Math.min(1,age/0.5);
        const dRest=f.restY-f.y;
        if(dRest<120)vy*=Math.max(0.06,dRest/120);
        f.y+=vy*dt;
        if(f.y>=f.restY-1){f.y=f.restY;f.settle=Math.min(1,f.settle+dt*2.4);}
        if(f.settle>=1)landed++;
        const calm=1-f.settle;
        // WIDE lateral glide (+ a faster small edge-flutter) — the horizontal travel is what reads as paper
        const x=f.x0+(f.glideA*Math.sin(gp)+f.wobA*Math.sin(f.wobW*age+f.glidePh))*calm;
        const a=(f.rotBase+f.rockA*Math.sin(gp+1.35)+f.tumble*age)*calm+f.restRot*f.settle; // constant rock / lazy tumble
        b.chaos={x,y:f.y,a,w:b.w,h:b.h};
        // the sheet itself flexes in 3D (plane tilt + shear), flattening as it settles
        const fp=f.flapW*age+f.flapPh;
        b.paperEl.style.transform='perspective(240px) rotateX('+(f.flapAX*calm*Math.sin(fp)).toFixed(2)
          +'deg) rotateY('+(f.flapAY*calm*Math.sin(fp*0.8+1.1)).toFixed(2)
          +'deg) skewX('+(f.skewA*calm*Math.sin(fp*1.3+0.5)).toFixed(2)+'deg)';
      }
      render(0);
      if(!organizeScheduled&&books.length===COUNT&&landed===COUNT){
        organizeScheduled=true;
        setTimeout(beginSort,650);   // let the paper pile rest, THEN bind into books
      }
      if(!sorted&&!sorting)fallRaf=requestAnimationFrame(fallLoop);
    }
    /* once every sheet has landed: each page stands up, binds into a book spine, and files onto the shelf */
    function beginSort(){
      if(sorted||sorting)return;
      sorting=true;
      if(fallRaf)cancelAnimationFrame(fallRaf);
      books.forEach(b=>{b.paperEl.style.transform='';}); // sheet lies flat as it binds into a book
      layoutTidy();
      sortStart=performance.now();
      (function step(now){
        const t=Math.min(1,(now-sortStart)/1500);
        render(t);
        if(t<1)sortRaf=requestAnimationFrame(step);
        else{sorted=true;sorting=false;render(1);}
      })(performance.now());
    }
    /* fade the whole shelf out as the platform ("How lucnt works") rises into view */
    function updateFade(){
      if(!plat){layer.style.opacity='1';return;}
      const top=plat.getBoundingClientRect().top;
      const start=window.innerHeight*1.3,end=window.innerHeight*0.4; // fade out as "How lucnt works" nears
      let o=(top-end)/(start-end);
      layer.style.opacity=o<0?0:o>1?1:o;
    }
    function spawnPaper(){
      const variant=pickBk();
      const {el,paperEl,bookEl}=mkEl(variant);
      const IH=window.innerHeight,cx=window.innerWidth/2;
      const stageW=Math.min(720,window.innerWidth*0.94);
      const w=52+Math.random()*46,h=36+Math.random()*22;      // page-shaped sheet while falling
      const tidyW=30+Math.random()*20,tidyH=92+Math.random()*40;
      const fl={
        x0:cx+(Math.random()-0.5)*stageW*0.38,
        y:-40-Math.random()*90,
        vyMean:IH*(0.32+Math.random()*0.12),           // slow float; scales with viewport so timing is steady
        glideA:100+Math.random()*88, glideW:2.1+Math.random()*1.7, glidePh:Math.random()*6.283, // WIDE, quick glide
        wobA:12+Math.random()*14, wobW:5.5+Math.random()*3,        // small fast edge-flutter on top
        rockA:30+Math.random()*26,                                 // strong continuous rocking
        tumble:(Math.random()<0.15?(Math.random()-0.5)*70:0),      // a couple of sheets lazily tumble over
        rotBase:(Math.random()-0.5)*24, restRot:(Math.random()-0.5)*20,
        flapAX:22+Math.random()*20, flapAY:12+Math.random()*13, skewA:4+Math.random()*5,   // 3D flex of the sheet
        flapW:3+Math.random()*2.4, flapPh:Math.random()*6.283,
        restY:IH*0.90 - h/2 - Math.random()*26,   // land in a loose pile on the floor
        settle:0, born:(performance.now()-t0)/1000
      };
      books.push({el,paperEl,bookEl,variant,w,h,tidyW,tidyH,fl,
        chaos:{x:fl.x0,y:fl.y,a:fl.rotBase,w,h},tidy:{x:0,y:0,a:0,w:tidyW,h:tidyH}});
    }
    function startFall(){
      t0=performance.now();last=t0;
      requestAnimationFrame(fallLoop);
      let spawned=0;
      (function spawnLoop(){
        spawnPaper();spawned++;
        if(spawned<COUNT)setTimeout(spawnLoop,40+Math.random()*55);
      })();   // organize is triggered from fallLoop once every sheet has landed
    }
    function staticFallback(){
      for(let i=0;i<COUNT;i++){
        const variant=pickBk();
        const {el,paperEl,bookEl}=mkEl(variant);
        const tidyW=30+Math.random()*20,tidyH=92+Math.random()*40;
        books.push({el,paperEl,bookEl,body:null,w:tidyW,h:tidyH,variant,tidyW,tidyH,chaos:{x:0,y:0,a:0,w:tidyW,h:tidyH},tidy:{x:0,y:0,a:0,w:tidyW,h:tidyH}});
      }
      layoutTidy();
      books.forEach(b=>{b.chaos=Object.assign({},b.tidy);});
      sorted=true;
      render(1);
    }
    addEventListener('resize',()=>{if(sorted){layoutTidy();render(1);}});
    if(reduced)staticFallback();else startFall();
    updateFade();
    let bsRaf=false;
    addEventListener('scroll',()=>{
      if(bsRaf)return;bsRaf=true;
      requestAnimationFrame(()=>{bsRaf=false;updateFade();});
    },{passive:true});
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
