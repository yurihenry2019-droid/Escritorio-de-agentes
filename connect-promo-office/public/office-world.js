'use strict';
// Shared scene geometry: rendering, picking and navigation use the same map.
(()=>{
  const width=24,height=18;
  const spawns=[['yuri','Yuri',4,5,'#28386c'],['gerencia','Gerência',12,5,'#4257d5'],['marketing','Marketing',11,11,'#8a67c2'],['comercial','Prospecção',12,16,'#319584'],['email','E-mail',14,10,'#4486cf'],['atendimento','Atendimento',4,11,'#c18a4f'],['financeiro','Financeiro',12,14,'#677b94'],['site','Site',20,12,'#5d6982']];
  const rooms=[
    {id:'yuri',name:'Diretoria · Yuri',x:0,y:0,w:8,h:7,color:'#d8d4cb',door:[4,5]},
    {id:'reuniao',name:'Sala de reunião',x:8,y:0,w:8,h:7,color:'#d9dfe8',door:[12,5]},
    {id:'lounge',name:'Lounge & jogos',x:16,y:0,w:8,h:7,color:'#c8d7cf',door:[20,5]},
    {id:'recepcao',name:'Recepção',x:0,y:7,w:8,h:11,color:'#e8dfce',door:[4,12]},
    {id:'equipe',name:'Área da equipe',x:8,y:7,w:8,h:11,color:'#dce2ec',door:[12,11]},
    {id:'showroom',name:'Showroom',x:16,y:7,w:8,h:11,color:'#dfd8ca',door:[20,12]},
  ];
  const objects=[];
  const add=(kind,x,y,w=1,h=1,color)=>objects.push({kind,x,y,w,h,color});
  add('executive',2,2,3,1);add('chair',3,1);add('chair',3,3);add('plant',1,1);add('shelf',6,1,1,3);add('plant',6,5);
  add('meeting',10,2,4,2);for(const x of [10,12,14]){add('chair',x,1);add('chair',x,4);}add('screen',10,0,4,1);add('board',14,0);add('plant',14,6);
  add('arcade',17,1,1,1,'#ed7463');add('arcade',19,1,1,1,'#5865e9');add('foosball',18,3,3,1);add('sofa',22,2,1,3);add('plant',22,5);
  add('reception',2,9,4,1);add('plant',1,10);add('plant',6,10);add('sofa',1,14,3,1);add('sofa',5,14,1,2);add('coffee',3,15,1,1);add('plant',1,17);
  for(const [x,y] of [[10,9],[13,12],[10,15]]){add('desk',x,y,2,1);add('chair',x,y+1);add('chair',x+1,y-1);}
  add('plant',9,8);add('plant',14,16);
  add('merch',17,8,1,4);add('merch',22,8,1,4);add('display',18,15,3,1);add('plant',22,16);add('shirts',20,8,1,2);
  const walls=[];
  for(const x of [8,16])for(let y=0;y<18;y++)if(![4,10,15].includes(y))walls.push({x,y,w:1,h:1});
  for(let x=0;x<24;x++)if(![4,12,20,8,16].includes(x))walls.push({x,y:7,w:1,h:1});
  const blocked=new Set();for(const o of [...walls,...objects])for(let x=o.x;x<o.x+o.w;x++)for(let y=o.y;y<o.y+o.h;y++)blocked.add(`${x},${y}`);
  const walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<width&&y<height&&!blocked.has(`${x},${y}`);
  function path(start,end){
    const [sx,sy]=start.map(Math.round),[ex,ey]=end.map(Math.round);if(!walkable(sx,sy)||!walkable(ex,ey))return [];
    const queue=[[sx,sy]],seen=new Map([[`${sx},${sy}`,null]]);
    for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(x===ex&&y===ey){const result=[];let key=`${x},${y}`;while(key){result.unshift(key.split(',').map(Number));key=seen.get(key);}return result.slice(1);}
      for(const [nx,ny] of [[x+1,y],[x,y+1],[x-1,y],[x,y-1]]){const key=`${nx},${ny}`;if(walkable(nx,ny)&&!seen.has(key)){seen.set(key,`${x},${y}`);queue.push([nx,ny]);}}
    }return [];
  }
  const project=(x,y,z=0)=>({x:550+(x-y)*24,y:130+(x+y)*12-z});
  const unproject=(x,y)=>{const a=(x-550)/24,b=(y-130)/12;return {x:(a+b)/2,y:(b-a)/2};};
  const roomAt=(x,y)=>rooms.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
  globalThis.OfficeWorld={width,height,spawns,rooms,objects,walls,walkable,path,project,unproject,roomAt};
})();
