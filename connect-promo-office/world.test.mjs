import test from 'node:test';
import assert from 'node:assert/strict';
await import('./public/office-world.js');
const W=globalThis.OfficeWorld;
test('todos os personagens começam em espaço livre e conseguem entrar nas seis salas',()=>{
  for(const [id,,x,y] of W.spawns){assert.ok(W.walkable(x,y),id);for(const room of W.rooms){if(x===room.door[0]&&y===room.door[1])continue;assert.ok(W.path([x,y],room.door).length,`${id} -> ${room.id}`);}}
});
test('os seis ambientes são alcançáveis por portas, sem atravessar móveis ou paredes',()=>{
  for(const from of W.rooms)for(const to of W.rooms){if(from===to)continue;const route=W.path(from.door,to.door);assert.ok(route.length,`${from.id} -> ${to.id}`);let previous=from.door;for(const point of route){assert.ok(W.walkable(...point));assert.equal(Math.abs(point[0]-previous[0])+Math.abs(point[1]-previous[1]),1);previous=point;}assert.deepEqual(previous,to.door);}
});
test('pontos fora do andar e móveis não aceitam destinos; seleção isométrica conserva coordenadas',()=>{
  assert.deepEqual(W.path([4,12],[2,9]),[]);assert.deepEqual(W.path([4,12],[-1,12]),[]);
  for(const [x,y] of [[4.5,12.5],[20.5,5.5],[0.5,0.5]]){const p=W.project(x,y),q=W.unproject(p.x,p.y);assert.ok(Math.abs(q.x-x)<1e-9);assert.ok(Math.abs(q.y-y)<1e-9);}
});
