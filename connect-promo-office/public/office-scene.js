'use strict';
const OfficeScene=(()=>{
  const W=OfficeWorld;
  const roster=W.spawns;
  let active=null;
  const skin=['#d9a47e','#b9825e','#e9b794','#aa7558','#e5b08b','#c88d69','#e3b792','#bf8a6b'];
  function mount(){
    active?.destroy();const canvas=document.querySelector('#office-world');if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx){canvas.replaceWith(Object.assign(document.createElement('p'),{textContent:'Seu navegador não conseguiu abrir o ambiente. Use os botões das salas abaixo.'}));return;}
    let frame=0,dead=false,last=performance.now(),elapsed=0,selected='yuri',zoom=1,panX=0,panY=0,scale=1,ox=0,oy=0,labels=true;
    let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;try{const pref=(localStorage.getItem('connect-promo-world-motion')||localStorage.getItem('connect-promo-motion'));if(pref)motion=pref==='on';}catch{}
    let movingMessage='',hover=null,selectionRoom=null,drag=null;
    const actors=roster.map(([id,name,x,y,color],i)=>({id,name,x,y,color,skin:skin[i],route:[],wait:i*.55+.5,manual:false,step:0,face:1,target:null}));
    const selectedActor=()=>actors.find(a=>a.id===selected);
    const message=text=>{movingMessage=text;const el=document.querySelector('#world-message');if(el)el.textContent=text;};
    const pos=(x,y,z=0)=>W.project(x,y,z);
    function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke();}}
    function box(x,y,w,h,z,color,top=color,side='#91a2b5',base=0){
      const a=pos(x,y,base+z),b=pos(x+w,y,base+z),c=pos(x+w,y+h,base+z),d=pos(x,y+h,base+z);
      poly([d,c,pos(x+w,y+h,base),pos(x,y+h,base)],color,'#34486733');
      poly([b,c,pos(x+w,y+h,base),pos(x+w,y,base)],side,'#34486733');poly([a,b,c,d],top,'#ffffff55');
    }
    function line(a,b,color='#6b8198',width=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
    function text(label,x,y,size=12,color='#344561',align='center'){ctx.font=`${size<11?500:600} ${size}px ui-sans-serif,system-ui,sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(label,x,y);}
    function plant(x,y){
      box(x+.25,y+.25,.5,.5,12,'#b5c0c9','#d0d7dc','#8899ab');const p=pos(x+.5,y+.5,12);
      line(p,{x:p.x,y:p.y-30},'#568467',3);
      for(let i=0;i<5;i++){const px=p.x+(i%2?7:-7),py=p.y-10-i*5;poly([{x:p.x,y:py+8},{x:px-5,y:py},{x:px+2,y:py-8},{x:p.x+4,y:py+2}],i%2?'#6ca887':'#3c856b');}
    }
    function chair(x,y){box(x+.24,y+.24,.52,.52,12,'#293c59','#435777','#20314c');box(x+.2,y+.18,.6,.15,26,'#354867','#4b607e','#243653');const p=pos(x+.5,y+.5);line({x:p.x-9,y:p.y+3},{x:p.x+9,y:p.y+3},'#65778a',2);}
    function monitor(x,y,color='#4156d3'){
      box(x+.35,y+.35,.35,.26,3,'#536478','#6f7c8c','#45576b',25);const p=pos(x+.5,y+.5,28);
      ctx.fillStyle='#1e304d';ctx.fillRect(p.x-12,p.y-19,25,19);ctx.fillStyle=color;ctx.fillRect(p.x-10,p.y-17,21,14);
      for(let i=0;i<3;i++){ctx.fillStyle=i===0?'#aabfff':'#dce8ff';ctx.fillRect(p.x-7,p.y-13+i*3,9+i*3,1);}ctx.fillStyle='#e5eafa';ctx.fillRect(p.x-10,p.y+2,22,3);
    }
    function drawObject(o){const {x,y,w,h,kind}=o;
      if(kind==='plant')return plant(x,y);
      if(kind==='chair')return chair(x,y);
      if(['desk','executive','meeting','coffee','display','foosball'].includes(kind)){
        const tabletop=kind==='meeting'?'#d2b789':kind==='foosball'?'#3a9a75':kind==='display'?'#f1f3fa':'#d1b68f';
        for(const [dx,dy] of [[.15,.15],[w-.3,.15],[.15,h-.3],[w-.3,h-.3]])box(x+dx,y+dy,.14,.14,22,'#708297','#8596a9','#566b81');
        box(x,y,w,h,4,'#b19b7e',tabletop,'#a68e71',22);
        if(kind==='desk'||kind==='executive'){monitor(x+.2,y);if(w>1.5)monitor(x+w-1,y,'#3c8da3');plant(x+w-.65,y-.05);}
        if(kind==='meeting'){for(let i=0;i<3;i++)box(x+.4+i,y+.35,.6,.65,1,'#f8fafc','#fff','#cad5e3',27);}
        if(kind==='foosball'){for(let i=0;i<4;i++){line(pos(x+.35+i*.6,y-.18,31),pos(x+.35+i*.6,y+h+.18,31),'#dbe3e9',2);for(let j=0;j<2;j++)box(x+.3+i*.6,y+.2+j*.45,.15,.13,4,i%2?'#f1ca67':'#344fe0',undefined,undefined,28);}}
        if(kind==='display'){for(let i=0;i<5;i++){box(x+.2+i*.5,y+.25,.28,.35,12,'#293fbd','#6380ec','#1e2f8d',26);const p=pos(x+.34+i*.5,y+.5,30);text('CP',p.x,p.y,5,'#fff');}}
        if(kind==='coffee'){const p=pos(x+.5,y+.5,28);ctx.fillStyle='#fff';ctx.fillRect(p.x-5,p.y-4,8,5);}
        return;
      }
      if(kind==='reception'){
        box(x,y,w,h,30,'#ae9271','#f9f8f4','#8e775c');for(let i=0;i<w*6;i++)line(pos(x+i/6,y+h,4),pos(x+i/6,y+h,27),'#ddc7a0',1);
        const p=pos(x+w/2,y+h+.01,16);ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,.5,0,1,0,0);ctx.fillStyle='#fff';ctx.fillRect(-39,-17,78,27);text('connect',0,0,17,'#18263c');text('promo',0,7,7,'#18263c');ctx.restore();monitor(x+.3,y);return;
      }
      if(kind==='sofa'){box(x,y,w,h,15,'#697d9e','#92a7c4','#4f6585');box(x,y,w,.22,28,'#526b91','#7c95b4','#435f84');for(let i=0;i<w;i++)box(x+i+.1,y+.3,.75,Math.max(.45,h-.45),3,'#a4b4cb','#b1c2da','#8c9fbc',15);return;}
      if(kind==='arcade'){box(x,y,1,1,47,o.color,'#f1cd7d','#344568');const p=pos(x+.5,y+1,29);ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,.5,0,1,0,0);ctx.fillStyle='#152442';ctx.fillRect(-11,-17,22,21);ctx.fillStyle='#69d7ce';ctx.fillRect(-8,-14,16,15);ctx.fillStyle='#fff1a6';ctx.fillRect(-4,-9,4,4);ctx.fillStyle='#fff';ctx.fillRect(-8,8,3,3);ctx.fillRect(4,8,3,3);ctx.restore();return;}
      if(kind==='shelf'||kind==='merch'){
        box(x,y,w,h,46,'#8d7962','#c5b698','#7b6c59');
        for(let row=0;row<3;row++)for(let j=0;j<h;j++){box(x+.15,y+j+.12,.78,.7,1,'#d7c8b0','#e8dbc4','#a99b81',10+row*13);box(x+.6,y+j+.25,.32,.33,8,kind==='merch'?'#3149c7':'#8193a1','#c2d1ef','#263b90',11+row*13);}
        return;
      }
      if(kind==='shirts'){box(x+.45,y,.08,h,46,'#74869c','#c2cbd4','#425a77');for(let j=0;j<3;j++){const p=pos(x+.5,y+j*.6,34);ctx.fillStyle=j%2?'#fcfcff':'#304ad0';ctx.beginPath();ctx.moveTo(p.x-11,p.y-10);ctx.lineTo(p.x-17,p.y-4);ctx.lineTo(p.x-11,p.y+1);ctx.lineTo(p.x-7,p.y-1);ctx.lineTo(p.x-7,p.y+16);ctx.lineTo(p.x+7,p.y+16);ctx.lineTo(p.x+7,p.y-1);ctx.lineTo(p.x+11,p.y+1);ctx.lineTo(p.x+17,p.y-4);ctx.lineTo(p.x+11,p.y-10);ctx.closePath();ctx.fill();text('CP',p.x,p.y+4,7,j%2?'#293fe9':'#fff');}return;}
      if(kind==='screen'||kind==='board'){
        const p=pos(x+w/2,y+.65,52);ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,.5,0,1,0,0);const width=w*23;ctx.fillStyle='#354865';ctx.fillRect(-width/2,-31,width,41);ctx.fillStyle=kind==='screen'?'#dae6ff':'#fcf8e9';ctx.fillRect(-width/2+3,-28,width-6,35);
        for(let i=0;i<4;i++){ctx.fillStyle=['#4560dc','#7794dc','#419b9c','#f2bd62'][i];ctx.fillRect(-width/2+7+i*(width-14)/4,-10-i*3,Math.max(3,(width-24)/4),14+i*3);}ctx.restore();
      }
    }
    function drawActor(a){
      const p=pos(a.x+.5,a.y+.5),walking=a.route.length>0,bob=walking?Math.sin(a.step*11)*1.2:0;
      ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#263f6b28';ctx.beginPath();ctx.ellipse(0,1,12,5,0,0,Math.PI*2);ctx.fill();
      if(a.id===selected){ctx.strokeStyle='#4560f2';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,1,15,7,0,0,Math.PI*2);ctx.stroke();}
      ctx.translate(0,bob);const leg=walking?Math.sin(a.step*11)*4:0;ctx.fillStyle='#1b2d4b';ctx.fillRect(-6,-14+leg,5,14);ctx.fillRect(1,-14-leg,5,14);ctx.fillStyle='#12213c';ctx.fillRect(-7,-2+leg,7,4);ctx.fillRect(0,-2-leg,7,4);
      ctx.fillStyle=a.id==='yuri'?'#334569':'#fbfcff';ctx.fillRect(-8,-30,16,18);ctx.fillStyle=a.color;ctx.fillRect(-8,-18,16,3);ctx.fillStyle=a.skin;ctx.fillRect(-11,-28-leg*.4,4,15);ctx.fillRect(7,-28+leg*.4,4,15);ctx.fillRect(-6,-43,13,14);ctx.fillStyle='#2b2832';ctx.fillRect(-7,-46,14,7);ctx.fillRect(a.face>0?-7:4,-40,4,6);ctx.fillStyle='#182b4a';ctx.fillRect(a.face>0?3:-4,-36,2,2);text(a.id==='yuri'?'Y':'CP',0,-23,6,a.id==='yuri'?'#fff':a.color);
      const event=a.id==='yuri'?null:OfficeLive.latest(a.id);const st=OfficeLive.state(event);ctx.fillStyle=st==='running'?'#1aa77c':st==='failed'?'#d55d4f':st==='succeeded'?'#5166d8':'#a4b1c3';ctx.beginPath();ctx.arc(11,-43,3,0,Math.PI*2);ctx.fill();
      if(labels||a.id===selected){ctx.font='600 10px ui-sans-serif,system-ui';const tw=ctx.measureText(a.name).width;ctx.fillStyle=a.id===selected?'#2d45d4':'#fffffff2';ctx.fillRect(-tw/2-6,-65,tw+12,15);text(a.name,0,-54,10,a.id===selected?'#fff':'#354666');}
      ctx.restore();a.screen=p;
    }
    function draw(){
      const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(rect.width<1)return;
      const pw=Math.round(rect.width*dpr),ph=Math.round(rect.height*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);const sky=ctx.createLinearGradient(0,0,0,rect.height);sky.addColorStop(0,'#c8dfed');sky.addColorStop(1,'#edf2f5');ctx.fillStyle=sky;ctx.fillRect(0,0,rect.width,rect.height);
      scale=Math.min(rect.width/1200,rect.height/790)*zoom;ox=(rect.width-1200*scale)/2+panX;oy=(rect.height-790*scale)/2+panY;ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
      // A skyline drawn from independent shapes, not a background photograph.
      for(let i=0;i<25;i++){const bx=20+i*49,by=215+(i%4)*16,bh=60+(i*43%125);ctx.fillStyle=i%2?'#a2bcd1':'#b2c9da';ctx.fillRect(bx,by-bh,38,bh);ctx.fillStyle='#d9e9f3';for(let row=0;row<bh/13;row++)for(let col=0;col<3;col++)ctx.fillRect(bx+5+col*10,by-bh+6+row*12,4,5);}
      const floor=[pos(0,0),pos(24,0),pos(24,18),pos(0,18)];poly(floor.map(p=>({x:p.x+7,y:p.y+30})),'#597a9b26');box(0,0,24,18,10,'#8196b1','#dae2eb','#617c9c',-10);
      for(let x=0;x<24;x++)for(let y=0;y<18;y++){const r=W.roomAt(x,y);const p=[pos(x,y),pos(x+1,y),pos(x+1,y+1),pos(x,y+1)];poly(p,(x+y)%2?r.color:r.id==='equipe'?'#e2e7f0':r.color+'ed','#ffffff65');}
      // Panoramic glass along both back edges.
      for(let x=0;x<24;x++){poly([pos(x,0),pos(x+1,0),pos(x+1,0,72),pos(x,0,72)],'#d8edf87d','#7794ac');line(pos(x,0),pos(x,0,72),'#657f99',2);line(pos(x,0,72),pos(x+1,0,72),'#4b657e',3);}
      for(let y=0;y<18;y++){poly([pos(0,y),pos(0,y+1),pos(0,y+1,72),pos(0,y,72)],'#c0e0f36d','#7794ac');line(pos(0,y),pos(0,y,72),'#657f99',2);line(pos(0,y,72),pos(0,y+1,72),'#4b657e',3);}
      if(hover&&W.walkable(hover.x,hover.y))poly([pos(hover.x,hover.y),pos(hover.x+1,hover.y),pos(hover.x+1,hover.y+1),pos(hover.x,hover.y+1)],'#536bed33','#536bed');
      const a=selectedActor();if(a.route.length){ctx.setLineDash([4,6]);let prior=pos(a.x+.5,a.y+.5);for(const [x,y] of a.route){const next=pos(x+.5,y+.5);line(prior,next,'#4c64df',2);prior=next;}ctx.setLineDash([]);}
      const items=[...W.objects.map(o=>({depth:o.x+o.y+(o.w+o.h)/2,draw:()=>drawObject(o)})),...W.walls.map(w=>({depth:w.x+w.y+1,draw:()=>{
        const vertical=w.x===8||w.x===16;box(w.x,w.y,vertical?.08:1,vertical?1:.08,39,'#bfd4e47a','#edf6fa9c','#9cb5c77a');line(pos(w.x,w.y),pos(w.x,w.y,39),'#8aa2b6',1);}})),...actors.map(a=>({depth:a.x+a.y+1,draw:()=>drawActor(a)}))];
      items.sort((a,b)=>a.depth-b.depth);items.forEach(o=>o.draw());
      if(labels)for(const r of W.rooms){const p=pos(r.x+r.w/2,r.y+r.h-.75,0);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#ffffffeb';const tw=ctx.measureText(r.name).width;ctx.fillRect(-tw/2-12,-10,tw+24,20);text(r.name,0,4,11,'#4a5d78');ctx.restore();}
      text('CONNECT PROMO  /  ESCRITÓRIO INTERATIVO',600,720,12,'#667f97');
    }
    function setDestination(a,dest,manual=true){
      // Finish the current edge before replanning to avoid diagonal corner cuts.
      const head=a.route.length?a.route[0]:[Math.round(a.x),Math.round(a.y)];const route=W.path(head,dest);
      if(!route.length&&(head[0]!==dest[0]||head[1]!==dest[1])){if(manual)message('Esse ponto está ocupado. Escolha um espaço livre no chão.');return false;}
      a.route=a.route.length?[head,...route]:route;a.manual=manual;a.target=dest;a.wait=8;
      if(manual){const room=W.roomAt(...dest);message(`${a.name} caminhando até ${room?.name||'o destino'}…`);}return true;
    }
    function choose(id){selected=id;selectionRoom=null;const a=selectedActor();a.manual=true;a.route=a.route.slice(0,1);document.querySelector('#world-actor').value=id;inspector();message(`${a.name} selecionado. Clique no chão para caminhar.`);}
    function inspector(room){
      if(room)selectionRoom=room;const a=selectedActor(),r=selectionRoom||W.roomAt(a.x,a.y),target=document.querySelector('#world-inspector');
      if(!target)return;const e=a.id==='yuri'?null:OfficeLive.latest(a.id);
      target.innerHTML=`<div><strong>${esc(r?.name||'Escritório')} <span aria-hidden="true">·</span> ${esc(a.name)}</strong><p>${e?esc(e.label):a.id==='yuri'?'Você está no comando. Explore as salas e acompanhe sua operação.':'Sem execução registrada para esta função.'}</p></div><button class="button" data-world-detail>Ver atividade</button>${r?`<button class="button primary" data-world-open="${r.id}">Abrir ambiente ${icon('arrow')}</button>`:''}`;
      target.querySelector('[data-world-detail]')?.addEventListener('click',()=>a.id==='yuri'?go('atividade'):OfficeLive.detail(a.id));
      target.querySelector('[data-world-open]')?.addEventListener('click',()=>openRoom(r.id,false,true));
    }
    function visit(id){const room=W.rooms.find(r=>r.id===id);if(!room)return;selectionRoom=room;setDestination(selectedActor(),room.door);inspector(room);document.querySelectorAll('[data-world-room]').forEach(b=>b.classList.toggle('active',b.dataset.worldRoom===id));}
    function coordinate(event){const b=canvas.getBoundingClientRect();return {x:(event.clientX-b.left-ox)/scale,y:(event.clientY-b.top-oy)/scale};}
    function click(event){const p=coordinate(event);const actor=[...actors].reverse().find(a=>{const c=pos(a.x+.5,a.y+.5);return Math.abs(p.x-c.x)<16&&p.y<c.y+7&&p.y>c.y-65;});if(actor){choose(actor.id);return;}
      const q=W.unproject(p.x,p.y),x=Math.floor(q.x),y=Math.floor(q.y);setDestination(selectedActor(),[x,y]);}
    canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,px:panX,py:panY,moved:false};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;if(drag.moved){panX=drag.px+dx;panY=drag.py+dy;}}else{const p=coordinate(e),q=W.unproject(p.x,p.y);hover={x:Math.floor(q.x),y:Math.floor(q.y)};}});
    canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved)click(e);drag=null;});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('pointerleave',()=>hover=null);
    const directions={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
    function step(key){const vector=directions[key];if(!vector)return;const a=selectedActor(),base=a.route[0]||[Math.round(a.x),Math.round(a.y)];setDestination(a,[base[0]+vector[0],base[1]+vector[1]]);}
    canvas.addEventListener('keydown',e=>{if(directions[e.key]){e.preventDefault();step(e.key);}if(e.key==='Enter'){e.preventDefault();inspector();document.querySelector('[data-world-detail]')?.focus();}});
    document.querySelector('#world-actor').addEventListener('change',e=>choose(e.target.value));
    document.querySelectorAll('[data-world-room]').forEach(b=>b.addEventListener('click',()=>visit(b.dataset.worldRoom)));
    document.querySelectorAll('[data-world-step]').forEach(b=>b.addEventListener('click',()=>step(b.dataset.worldStep)));
    document.querySelector('[data-world-meeting]').addEventListener('click',()=>{for(let i=0;i<actors.length;i++){const dest=[[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[12,6]][i];setDestination(actors[i],dest);}message('Equipe a caminho da sala de reunião. Isso movimenta os avatares; o briefing real continua às 15h.');});
    document.querySelector('[data-world-reset]').addEventListener('click',()=>{zoom=1;panX=panY=0;});
    document.querySelectorAll('[data-world-zoom]').forEach(b=>b.addEventListener('click',()=>zoom=Math.max(.7,Math.min(2.8,zoom+Number(b.dataset.worldZoom)))));
    const toggle=document.querySelector('#office-motion');toggle.checked=motion;toggle.addEventListener('change',()=>{motion=toggle.checked;if(motion)for(const a of actors)if(a.id!==selected)a.manual=false;try{localStorage.setItem('connect-promo-world-motion',motion?'on':'off');}catch{}message(motion?'Circulação automática ativada.':'Circulação pausada. Você ainda pode comandar um personagem.');});
    document.querySelector('#world-labels').addEventListener('change',e=>labels=e.target.checked);
    function loop(now){
      if(dead||!canvas.isConnected)return;const dt=Math.min(.05,(now-last)/1000);last=now;
      if(!document.hidden&&!document.querySelector('#dialog')?.open){elapsed+=dt;for(const a of actors){
        const canMove=motion||a.manual;if(a.route.length&&canMove){const [tx,ty]=a.route[0],dx=tx-a.x,dy=ty-a.y,dist=Math.hypot(dx,dy),speed=dt*1.6;a.face=dx-dy>=0?1:-1;a.step+=dt;
          if(dist<=speed){a.x=tx;a.y=ty;a.route.shift();if(!a.route.length){a.wait=4+Math.random()*8;if(a.id===selected){const r=W.roomAt(a.x,a.y);selectionRoom=r;message(`${a.name} chegou a ${r.name}.`);inspector(r);}}}else{a.x+=dx/dist*speed;a.y+=dy/dist*speed;}
        }else if(motion&&a.id!==selected&&!a.manual){a.wait-=dt;if(a.wait<=0){const rooms=W.rooms;setDestination(a,rooms[Math.floor(Math.random()*rooms.length)].door,false);a.wait=3;}}
      }}
      draw();frame=requestAnimationFrame(loop);
    }
    const onActivity=()=>inspector();document.addEventListener('office-activity-updated',onActivity);
    active={visit,destroy(){dead=true;cancelAnimationFrame(frame);document.removeEventListener('office-activity-updated',onActivity);},canvas};
    choose('yuri');draw();frame=requestAnimationFrame(loop);
  }
  function markup(){return `<section class="office-card" aria-label="Escritório interativo"><div class="stage-toolbar"><div class="stage-title">${icon('grid')}Escritório interativo</div><div class="world-toolbar"><label class="toggle-markers"><input id="office-motion" type="checkbox">Circulação</label><label class="toggle-markers"><input id="world-labels" type="checkbox" checked>Nomes</label><button class="icon-button" data-world-zoom="-.2" aria-label="Diminuir zoom">−</button><button class="icon-button" data-world-zoom=".2" aria-label="Aumentar zoom">+</button><button class="icon-button" data-world-reset aria-label="Centralizar escritório">⌂</button><button class="icon-button" data-action="fullscreen" aria-label="Ampliar escritório">${icon('expand')}</button></div></div><div class="stage world-stage"><canvas id="office-world" tabindex="0" role="application" aria-label="Escritório interativo. Selecione um personagem abaixo. Clique no chão ou use as setas para andar. Arraste para mover a vista." aria-describedby="world-message">Use os controles abaixo para selecionar personagens e visitar as seis salas.</canvas><div class="world-help"><b>Clique no chão para andar.</b> Selecione os personagens · Arraste para explorar · + para aproximar</div></div><div class="world-controls"><label>Controlar <select id="world-actor" aria-label="Personagem controlado">${roster.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><button class="button" data-world-meeting>Reunir avatares ${icon('meeting')}</button><div class="world-keyboard" aria-label="Direções">${[['ArrowLeft','←'],['ArrowUp','↑'],['ArrowDown','↓'],['ArrowRight','→']].map(([key,label])=>`<button data-world-step="${key}" aria-label="Andar ${label}">${label}</button>`).join('')}</div><span class="world-message" id="world-message" role="status" aria-live="polite"></span></div><div class="world-destinations" aria-label="Caminhar até uma sala">${W.rooms.map(r=>`<button data-world-room="${r.id}">Ir para ${r.name}</button>`).join('')}</div><div id="world-inspector" class="world-inspector"></div><p class="world-footnote">A circulação é visual. Respostas, envios e verificações reais aparecem no histórico da aba Atividade.</p></section>`;}
  return {mount,markup,visit:id=>{if(active?.canvas.isConnected){active.visit(id);return true;}return false;}};
})();
