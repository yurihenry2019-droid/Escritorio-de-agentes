'use strict';
const OfficeScene=(()=>{
  const W=OfficeWorld;
  const roster=W.spawns;
  let active=null;
  let motionEnabled=true;
  const skin=['#d9a47e','#b9825e','#e9b794','#aa7558','#e5b08b','#c88d69','#e3b792','#bf8a6b'];
  function mount(){
    active?.destroy();const canvas=document.querySelector('#office-world');if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx){canvas.replaceWith(Object.assign(document.createElement('p'),{textContent:'Seu navegador não conseguiu abrir o ambiente. Use os botões das salas abaixo.'}));return;}
    const brandLogo=new Image();brandLogo.src='assets/logo.jpeg';
    let frame=0,dead=false,last=performance.now(),elapsed=0,selected='yuri',zoom=1.65,panX=0,panY=0,scale=1,ox=0,oy=0,labels=false,follow=true,overview=false;
    // A new visit starts with the team circulating. The visible toggle pauses it.
    let motion=motionEnabled;
    let hover=null,hoverObject=null,selectionRoom=null,drag=null,objectHits=[];
    const actors=roster.map(([id,name,x,y,color],i)=>({id,name,x,y,color,index:i,skin:skin[i],route:[],wait:i*.35+.2,manual:false,step:0,direction:'se',target:null,pose:'stand',poseUntil:0,interaction:null,seat:null,bubble:null,tour:i}));
    const selectedActor=()=>actors.find(a=>a.id===selected);
    const message=text=>{const el=document.querySelector('#world-message');if(el)el.textContent=text;};
    const anchor=a=>a.seat?pos(a.seat.x+.5,a.seat.y+.5,-2):pos(a.x+.5,a.y+.5);
    const speak=(a,value)=>{a.bubble={text:value.slice(0,90),until:elapsed+7};};
    const pos=(x,y,z=0)=>W.project(x,y,z);
    function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke();}}
    function box(x,y,w,h,z,color,top=color,side='#91a2b5',base=0){
      const a=pos(x,y,base+z),b=pos(x+w,y,base+z),c=pos(x+w,y+h,base+z),d=pos(x,y+h,base+z);
      poly([d,c,pos(x+w,y+h,base),pos(x,y+h,base)],color,'#263548b0');
      poly([b,c,pos(x+w,y+h,base),pos(x+w,y,base)],side,'#263548b0');poly([a,b,c,d],top,'#263548b0');
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
      if(W.actions[kind]){const points=[pos(x,y),pos(x+w,y),pos(x+w,y+h),pos(x,y+h)];objectHits.push({o,left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y))-(kind==='chair'?28:kind==='sofa'?30:kind==='merch'?48:kind==='arcade'?49:30),bottom:Math.max(...points.map(p=>p.y))});}
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
        const p=pos(x+w/2,y+h+.01,16);ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,.5,0,1,0,0);ctx.fillStyle='#fff';ctx.fillRect(-39,-17,78,27);if(brandLogo.complete&&brandLogo.naturalWidth)ctx.drawImage(brandLogo,230,315,820,290,-36,-16,72,25);else{text('connect',0,0,17,'#18263c');text('promo',0,7,7,'#18263c');}ctx.restore();monitor(x+.3,y);return;
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
      const p=anchor(a);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
      poly([{x:-15,y:0},{x:0,y:-7},{x:15,y:0},{x:0,y:7}],'#1b293638',a.id===selected?'#ffe284':undefined);
      OfficeAvatars.draw(ctx,a,elapsed,a.id===selected);
      if(labels||a.id===selected){const name=a.id===selected?`${a.name} ▼`:a.name;ctx.font='bold 10px monospace';const tw=ctx.measureText(name).width;ctx.fillStyle=a.id===selected?'#ffdf81':'#ffffffed';ctx.fillRect(-tw/2-5,-79,tw+10,16);text(name,0,-67,10,'#27354c');}
      ctx.restore();
    }
    function bubble(a){if(!a.bubble||a.bubble.until<elapsed)return;const p=anchor(a),words=a.bubble.text.match(/.{1,27}(?:\s|$)|.{1,27}/g)||[a.bubble.text];const lines=words.slice(0,4);ctx.font='11px monospace';const width=Math.max(...lines.map(t=>ctx.measureText(t).width))+18,height=lines.length*15+10;
      ctx.fillStyle='#ffffff';ctx.strokeStyle='#25354b';ctx.lineWidth=1.5;ctx.fillRect(p.x-width/2,p.y-90-height,width,height);ctx.strokeRect(p.x-width/2,p.y-90-height,width,height);poly([{x:p.x-4,y:p.y-90},{x:p.x+3,y:p.y-84},{x:p.x+3,y:p.y-90}],'#fff','#25354b');lines.forEach((line,i)=>text(line.trim(),p.x,p.y-90-height+17+i*15,11,'#25354b'));
    }
    function draw(){
      const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(rect.width<1)return;
      const pw=Math.round(rect.width*dpr),ph=Math.round(rect.height*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);ctx.fillStyle='#537795';ctx.fillRect(0,0,rect.width,rect.height);
      scale=(overview?Math.min(rect.width/1200,rect.height/790):Math.max(rect.width/1200,rect.height/790))*zoom;
      if(follow){const focus=anchor(selectedActor());panX=(600-focus.x)*scale;panY=(395-focus.y+35)*scale;}
      ox=(rect.width-1200*scale)/2+panX;oy=(rect.height-790*scale)/2+panY;ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;objectHits=[];
      // A skyline drawn from independent shapes, not a background photograph.
      for(let i=-15;i<45;i++){const bx=20+i*49,by=215+Math.abs(i%4)*16,bh=60+Math.abs(i*43%125);ctx.fillStyle=i%2?'#385b79':'#446784';ctx.fillRect(bx,by-bh,38,bh+800);ctx.fillStyle='#95bac9';for(let row=0;row<(bh+800)/15;row++)for(let col=0;col<3;col++)ctx.fillRect(bx+5+col*10,by-bh+6+row*15,4,6);}
      const floor=[pos(0,0),pos(24,0),pos(24,18),pos(0,18)];poly(floor.map(p=>({x:p.x+7,y:p.y+30})),'#597a9b26');box(0,0,24,18,10,'#8196b1','#dae2eb','#617c9c',-10);
      for(let x=0;x<24;x++)for(let y=0;y<18;y++){const r=W.roomAt(x,y);const p=[pos(x,y),pos(x+1,y),pos(x+1,y+1),pos(x,y+1)];poly(p,(x+y)%2?r.color:r.id==='equipe'?'#cbd5e5':r.id==='recepcao'?'#e0caad':r.color,'#8b939369');if(['yuri','recepcao','showroom'].includes(r.id))line(pos(x+.5,y),pos(x+.5,y+1),'#ad937051',.7);}
      // Panoramic glass along both back edges.
      for(let x=0;x<24;x++){poly([pos(x,0),pos(x+1,0),pos(x+1,0,72),pos(x,0,72)],'#d8edf87d','#7794ac');line(pos(x,0),pos(x,0,72),'#657f99',2);line(pos(x,0,72),pos(x+1,0,72),'#4b657e',3);}
      for(let y=0;y<18;y++){poly([pos(0,y),pos(0,y+1),pos(0,y+1,72),pos(0,y,72)],'#c0e0f36d','#7794ac');line(pos(0,y),pos(0,y,72),'#657f99',2);line(pos(0,y,72),pos(0,y+1,72),'#4b657e',3);}
      if(hover&&W.walkable(hover.x,hover.y))poly([pos(hover.x,hover.y),pos(hover.x+1,hover.y),pos(hover.x+1,hover.y+1),pos(hover.x,hover.y+1)],'#536bed33','#536bed');
      const a=selectedActor();if(a.route.length){ctx.setLineDash([4,6]);let prior=pos(a.x+.5,a.y+.5);for(const [x,y] of a.route){const next=pos(x+.5,y+.5);line(prior,next,'#4c64df',2);prior=next;}ctx.setLineDash([]);}
      const items=[...W.objects.map(o=>({depth:o.x+o.y+(o.w+o.h)/2,draw:()=>drawObject(o)})),...W.walls.map(w=>({depth:w.x+w.y+1,draw:()=>{
        const vertical=w.x===8||w.x===16;box(w.x,w.y,vertical?.08:1,vertical?1:.08,33,'#b0d9df62','#e4f4f1b0','#72a0b174');line(pos(w.x,w.y),pos(w.x,w.y,33),'#32475a',1.3);}})),...actors.map(a=>({depth:a.seat?a.seat.x+a.seat.y+1.6:a.x+a.y+1,draw:()=>drawActor(a)}))];
      items.sort((a,b)=>a.depth-b.depth);items.forEach(o=>o.draw());
      if(labels)for(const r of W.rooms){const p=pos(r.x+r.w/2,r.y+r.h-.75,0);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#ffffffeb';const tw=ctx.measureText(r.name).width;ctx.fillRect(-tw/2-12,-10,tw+24,20);text(r.name,0,4,11,'#4a5d78');ctx.restore();}
      actors.forEach(bubble);
      if(hoverObject){const p=pos(hoverObject.x+hoverObject.w/2,hoverObject.y+hoverObject.h/2,65);const label=W.actions[hoverObject.kind];ctx.font='bold 11px monospace';const width=ctx.measureText(label).width+16;ctx.fillStyle='#ffe18b';ctx.fillRect(p.x-width/2,p.y-15,width,21);text(label,p.x,p.y,11,'#27354c');}
    }
    function setDestination(a,dest,manual=true){
      // Finish the current edge before replanning to avoid diagonal corner cuts.
      const head=a.route.length?a.route[0]:[Math.round(a.x),Math.round(a.y)];const route=W.path(head,dest);
      if(!route.length&&(head[0]!==dest[0]||head[1]!==dest[1])){if(manual)message('Esse ponto está ocupado. Escolha um espaço livre no chão.');return false;}
      a.route=a.route.length?[head,...route]:route;a.manual=manual;a.target=dest;a.wait=8;a.pose='stand';a.seat=null;a.interaction=null;
      if(manual&&a.id===selected){follow=true;overview=false;}
      if(manual){const room=W.roomAt(...dest);message(`${a.name} caminhando até ${room?.name||'o destino'}…`);}return true;
    }
    function interact(a,o,manual=true){
      if(!o||!W.actions[o.kind])return false;
      if((o.kind==='chair'||o.kind==='sofa')&&actors.some(other=>other!==a&&(other.seat?.id===o.id||other.interaction?.id===o.id))){if(manual)message('Esse assento está ocupado. Escolha outro.');return false;}
      const from=a.route[0]||[Math.round(a.x),Math.round(a.y)],dest=W.approach(from,o);if(!dest)return false;
      if(!setDestination(a,dest,manual))return false;a.interaction=o;
      if(manual)message(`${a.name}: ${W.actions[o.kind].toLowerCase()}…`);
      if(!a.route.length)arrive(a);return true;
    }
    function arrive(a){
      const o=a.interaction;a.interaction=null;a.wait=5+Math.random()*5;
      if(o){if(o.kind==='chair'||o.kind==='sofa'){a.pose='sit';a.seat=o;a.direction=W.roomAt(o.x,o.y)?.id==='reuniao'?(o.y===1?'sw':o.y===4?'ne':o.x<10?'se':'nw'):'se';}else if(['desk','executive','arcade','foosball'].includes(o.kind)){a.pose='work';a.direction=o.x<a.x?'nw':'ne';}else a.pose='stand';
        if(a.id===selected)message(`${a.name} · ${W.actions[o.kind]}. Clique no chão para sair.`);
      }else if(a.id===selected){const r=W.roomAt(a.x,a.y);selectionRoom=r;message(`${a.name} chegou a ${r.name}.`);}
      if(a.id===selected)inspector();
    }
    function choose(id){const previous=selectedActor();if(previous.id!==id){previous.manual=false;previous.wait=3;}selected=id;selectionRoom=null;follow=true;overview=false;const a=selectedActor();a.manual=true;a.route=a.route.slice(0,1);document.querySelector('#world-actor').value=id;inspector();message(`${a.name} selecionado. Clique no chão ou em um móvel.`);}
    function inspector(room){
      if(room)selectionRoom=room;const a=selectedActor(),r=selectionRoom||W.roomAt(a.x,a.y),target=document.querySelector('#world-inspector');
      if(!target)return;const e=a.id==='yuri'?null:OfficeLive.latest(a.id);
      target.innerHTML=`<div><strong>${esc(a.name)} <span aria-hidden="true">/</span> ${esc(r?.name||'Escritório')}</strong><p>${a.pose==='sit'?'Sentado · clique no chão para levantar.':a.pose==='work'?'Interagindo com o móvel.':a.id==='yuri'?'Seu personagem. Clique no chão para andar.':'Personagem virtual da Connect Promo.'}</p></div><button class="button" data-world-detail>Atividade real</button>${r?`<button class="button primary" data-world-open="${r.id}">Abrir sala ${icon('arrow')}</button>`:''}`;
      target.querySelector('[data-world-detail]')?.addEventListener('click',()=>a.id==='yuri'?go('atividade'):OfficeLive.detail(a.id));
      target.querySelector('[data-world-open]')?.addEventListener('click',()=>openRoom(r.id,false,true));
    }
    function visit(id){const room=W.rooms.find(r=>r.id===id);if(!room)return;selectionRoom=room;setDestination(selectedActor(),room.door);inspector(room);document.querySelectorAll('[data-world-room]').forEach(b=>b.classList.toggle('active',b.dataset.worldRoom===id));}
    function coordinate(event){const b=canvas.getBoundingClientRect();return {x:(event.clientX-b.left-ox)/scale,y:(event.clientY-b.top-oy)/scale};}
    function objectAt(p){return [...objectHits].reverse().find(h=>p.x>h.left&&p.x<h.right&&p.y>h.top&&p.y<h.bottom)?.o;}
    function click(event){const p=coordinate(event);const actor=[...actors].sort((a,b)=>(b.x+b.y)-(a.x+a.y)).find(a=>{const c=anchor(a);return Math.abs(p.x-c.x)<16&&p.y<c.y+7&&p.y>c.y-66;});if(actor){choose(actor.id);return;}
      const object=objectAt(p);if(object){interact(selectedActor(),object);return;}
      const q=W.unproject(p.x,p.y),x=Math.floor(q.x),y=Math.floor(q.y);setDestination(selectedActor(),[x,y]);}
    canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,px:panX,py:panY,moved:false};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;if(drag.moved){follow=false;panX=drag.px+dx;panY=drag.py+dy;}}else{const p=coordinate(e),q=W.unproject(p.x,p.y);hoverObject=objectAt(p);hover={x:Math.floor(q.x),y:Math.floor(q.y)};canvas.style.cursor=hoverObject?'pointer':'crosshair';}});
    canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved)click(e);drag=null;});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('pointerleave',()=>{hover=null;hoverObject=null;});
    const directions={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
    function step(key){const vector=directions[key];if(!vector)return;const a=selectedActor(),base=a.route[0]||[Math.round(a.x),Math.round(a.y)];setDestination(a,[base[0]+vector[0],base[1]+vector[1]]);}
    canvas.addEventListener('keydown',e=>{if(directions[e.key]){e.preventDefault();step(e.key);}if(e.key==='Enter'){e.preventDefault();inspector();document.querySelector('[data-world-detail]')?.focus();}});
    document.querySelector('#world-actor').addEventListener('change',e=>choose(e.target.value));
    document.querySelectorAll('[data-world-room]').forEach(b=>b.addEventListener('click',()=>visit(b.dataset.worldRoom)));
    document.querySelectorAll('[data-world-step]').forEach(b=>b.addEventListener('click',()=>step(b.dataset.worldStep)));
    document.querySelector('[data-world-meeting]').addEventListener('click',()=>{const chairs=W.objects.filter(o=>o.kind==='chair'&&W.roomAt(o.x,o.y)?.id==='reuniao');actors.forEach(a=>{a.seat=null;a.interaction=null;});actors.forEach((a,i)=>interact(a,chairs[i]));follow=true;message('Os oito personagens estão indo se sentar na reunião.');});
    document.querySelector('[data-world-reset]').addEventListener('click',()=>{follow=true;overview=false;zoom=1.65;});
    document.querySelector('[data-world-overview]').addEventListener('click',()=>{follow=false;overview=true;zoom=1;panX=panY=0;message('Vista de todo o andar. Clique em um personagem para acompanhá-lo.');});
    document.querySelectorAll('[data-world-zoom]').forEach(b=>b.addEventListener('click',()=>{overview=false;zoom=Math.max(.7,Math.min(3.8,zoom+Number(b.dataset.worldZoom)));}));
    const toggle=document.querySelector('#office-motion');toggle.checked=motion;toggle.addEventListener('change',()=>{motionEnabled=motion=toggle.checked;if(motion)for(const a of actors)if(a.id!==selected){a.manual=false;a.wait=.3;}message(motion?'Equipe circulando pelas salas.':'Equipe em pausa. Você ainda pode andar e interagir.');});
    document.querySelector('#world-labels').addEventListener('change',e=>labels=e.target.checked);
    document.querySelectorAll('[data-world-emote]').forEach(button=>button.addEventListener('click',()=>{
      const a=selectedActor(),pose=button.dataset.worldEmote;
      if(pose==='sit'){const from=a.route[0]||[Math.round(a.x),Math.round(a.y)];const seats=W.objects.filter(o=>['chair','sofa'].includes(o.kind)&&!actors.some(other=>other!==a&&(other.seat?.id===o.id||other.interaction?.id===o.id))).map(o=>({o,p:W.approach(from,o)})).filter(s=>s.p).sort((a,b)=>W.path(from,a.p).length-W.path(from,b.p).length);if(seats[0])interact(a,seats[0].o);return;}
      a.route=a.route.slice(0,1);a.interaction=null;a.seat=null;a.pose=pose;a.poseUntil=elapsed+(pose==='wave'?5:12);message(`${a.name} ${pose==='wave'?'acenando':'dançando'}.`);
    }));
    document.querySelector('#world-chat').addEventListener('submit',e=>{e.preventDefault();const input=document.querySelector('#world-say'),value=input.value.trim();if(!value)return;speak(selectedActor(),value);message(`${selectedActor().name}: ${value}`);input.value='';});
    const poses={stand:'em pé',sit:'sentado',work:'no móvel',wave:'acenando',dance:'dançando'};
    let presenceTick=-1;
    function loop(now){
      if(dead||!canvas.isConnected)return;const dt=Math.min(.05,(now-last)/1000);last=now;
      if(!document.hidden&&!document.querySelector('#dialog')?.open){elapsed+=dt;for(const a of actors){
        if(a.poseUntil&&elapsed>a.poseUntil){a.pose='stand';a.poseUntil=0;}
        const canMove=motion||a.manual;if(a.route.length&&canMove){const [tx,ty]=a.route[0],dx=tx-a.x,dy=ty-a.y,dist=Math.hypot(dx,dy),speed=dt*2.6;a.direction=dx>.01?'se':dx<-.01?'nw':dy>0?'sw':'ne';a.step+=dt;
          if(dist<=speed){a.x=tx;a.y=ty;a.route.shift();if(!a.route.length)arrive(a);}else{a.x+=dx/dist*speed;a.y+=dy/dist*speed;}
        }else if(motion&&a.id!==selected&&!a.manual){a.wait-=dt;if(a.wait<=0){
          const destinations=['desk-10-9','coffee-3-15','chair-12-4','arcade-17-1','display-18-15','desk-13-12','reception-2-9','chair-10-16'];
          const o=W.objects.find(o=>o.id===destinations[a.tour++%destinations.length]);if(!interact(a,o,false))setDestination(a,W.rooms[a.tour%W.rooms.length].door,false);a.wait=3;
        }}
      }}
      if(Math.floor(elapsed)!==presenceTick){presenceTick=Math.floor(elapsed);const list=document.querySelector('#world-presence');if(list){list.innerHTML=actors.map(a=>`<button data-world-person="${a.id}" class="${a.id===selected?'selected':''}"><i style="--person:${a.color}">${esc(a.name.slice(0,1))}</i><span>${esc(a.name)}<small>${a.route.length&&(motion||a.manual)?'caminhando':poses[a.pose]||'em pé'}</small></span></button>`).join('');list.querySelectorAll('[data-world-person]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.worldPerson)));}const mode=document.querySelector('#world-mode');if(mode)mode.textContent=motion?'Equipe em movimento':'Equipe em pausa';}
      draw();frame=requestAnimationFrame(loop);
    }
    const onActivity=()=>inspector();document.addEventListener('office-activity-updated',onActivity);
    active={visit,destroy(){dead=true;cancelAnimationFrame(frame);document.removeEventListener('office-activity-updated',onActivity);},canvas};
    choose('yuri');speak(selectedActor(),'Bem-vindo à Connect Promo!');draw();frame=requestAnimationFrame(loop);
  }
  function markup(){return `<section class="office-card room-client" aria-label="Escritório interativo"><div class="stage-toolbar"><div class="stage-title"><span class="pixel-building" aria-hidden="true">▦</span><span>CONNECT PROMO<small>ANDAR EXECUTIVO · 8 PERSONAGENS</small></span></div><div class="world-toolbar"><label class="toggle-markers"><input id="office-motion" type="checkbox">Movimento</label><label class="toggle-markers"><input id="world-labels" type="checkbox">Nomes</label><button class="icon-button" data-world-zoom="-.25" aria-label="Diminuir zoom">−</button><button class="icon-button" data-world-zoom=".25" aria-label="Aumentar zoom">+</button><button class="icon-button" data-world-reset aria-label="Seguir meu personagem">◎</button><button class="icon-button" data-action="fullscreen" aria-label="Ampliar escritório">${icon('expand')}</button></div></div><div class="stage world-stage"><canvas id="office-world" tabindex="0" role="application" aria-label="Escritório interativo. Clique no chão para andar; clique em um móvel para usá-lo. Use as setas do teclado para caminhar." aria-describedby="world-message">Selecione personagens e salas pelos controles abaixo.</canvas><div class="world-help"><span class="world-live-dot"></span><b id="world-mode">Equipe em movimento</b><span>Clique para andar · Clique nos móveis para usar</span></div><button class="world-map" data-world-overview>▦ Ver todo o andar</button><div class="world-people"><span>NA SALA</span><div id="world-presence"></div></div></div><div class="world-controls"><label>Você controla <select id="world-actor" aria-label="Personagem controlado">${roster.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><div class="world-actions"><button class="button" data-world-emote="wave">Acenar</button><button class="button" data-world-emote="dance">Dançar</button><button class="button" data-world-emote="sit">Sentar</button><button class="button" data-world-meeting>Reunir equipe</button></div><div class="world-keyboard" aria-label="Direções">${[['ArrowLeft','←'],['ArrowUp','↑'],['ArrowDown','↓'],['ArrowRight','→']].map(([key,label])=>`<button data-world-step="${key}" aria-label="Andar ${label}">${label}</button>`).join('')}</div></div><form id="world-chat" class="world-chat"><label for="world-say">FALAR</label><input id="world-say" maxlength="90" autocomplete="off" placeholder="Escreva um balão para seu personagem…" aria-label="Fala local do personagem"><button type="submit">Falar ↵</button><small>Balão local</small></form><div class="world-destinations" aria-label="Caminhar até uma sala">${W.rooms.map(r=>`<button data-world-room="${r.id}">${r.name}</button>`).join('')}</div><div id="world-inspector" class="world-inspector"></div><div class="world-status"><span class="world-message" id="world-message" role="status" aria-live="polite"></span><span>Arraste para explorar · Setas para andar</span></div><p class="world-footnote">As ações e os balões desta sala são locais. Trabalho confirmado com e-mails e sistemas aparece em Atividade.</p></section>`;}
  return {mount,markup,visit:id=>{if(active?.canvas.isConnected){active.visit(id);return true;}return false;}};
})();
