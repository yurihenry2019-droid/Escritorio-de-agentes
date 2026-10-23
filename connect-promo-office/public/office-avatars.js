'use strict';
// Original pixel characters. Each limb is drawn separately for walking and emotes.
const OfficeAvatars=(()=>{
  const hair=['#39303a','#453028','#9d5c36','#252733','#714a32','#272535','#4e4142','#252b36'];
  function draw(ctx,a,time,selected){
    const walking=a.route.length>0,pose=walking?'walk':a.pose;
    const tick=Math.floor(a.step*9)%4,leg=walking?[0,4,0,-4][tick]:0;
    const dance=pose==='dance'?Math.floor(time*4)%2:0,blink=Math.floor(time*2+a.index)%13===0;
    const rear=a.direction==='nw'||a.direction==='ne',flip=a.direction==='sw'||a.direction==='nw'?-1:1;
    const ink='#222535',skin=a.skin,shade=a.index%2?'#9c674c':'#bc8660',hairColor=hair[a.index];
    const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
    ctx.save();ctx.scale(flip,1);ctx.translate(dance?2:0,walking&&tick%2?-1:0);
    // Shoes and trouser legs, including a distinct seated pose.
    if(pose==='sit'){
      rect(-9,-20,14,8,ink);rect(-1,-14,6,12,ink);rect(-7,-18,10,4,'#53617a');rect(0,-13,3,9,'#53617a');
      rect(1,-19,13,7,ink);rect(9,-13,5,12,ink);rect(3,-17,9,3,'#3c4963');rect(10,-12,3,9,'#3c4963');
      rect(-3,-4,10,5,ink);rect(8,-3,10,5,ink);rect(-1,-3,6,2,'#f6f4eb');rect(10,-2,6,2,'#f6f4eb');
    }else{
      rect(-8,-21,8,20+leg,ink);rect(1,-21,8,20-leg,ink);rect(-7,-19,5,16+leg,'#4c5b76');rect(2,-19,5,16-leg,'#384761');
      rect(-9,-3+leg,10,5,ink);rect(0,-3-leg,12,5,ink);rect(-7,-2+leg,7,2,'#f5f5e9');rect(3,-2-leg,7,2,'#e1e6e9');
    }
    const bottom=pose==='sit'?4:0;ctx.translate(0,bottom);
    // White CP polo, cobalt stripes and collar; Yuri wears a navy jacket.
    rect(-11,-39,22,21,ink);rect(-10,-37,19,17,a.id==='yuri'?'#3a4769':'#fffdf3');
    rect(7,-36,3,16,a.id==='yuri'?'#293449':'#c9d0da');rect(-9,-23,18,3,'#2e42b0');rect(-7,-26,5,2,'#26317a');rect(2,-24,7,2,'#26317a');
    rect(-4,-40,8,5,skin);rect(-5,-36,4,3,'#d9e0e3');rect(1,-36,4,3,'#d9e0e3');rect(0,-34,1,6,ink);
    if(!rear){rect(3,-32,4,1,a.color);rect(3,-31,1,4,a.color);rect(3,-28,4,1,a.color);}
    else {rect(-6,-33,12,2,'#2a3457');rect(-3,-30,8,1,'#2a3457');}
    const hand=pose==='wave'||pose==='dance';const swing=walking?leg*.6:pose==='work'?Math.floor(time*5)%2*2:0;
    rect(-14,-37+swing,5,10,ink);rect(-13,-36+swing,4,5,'#eeeede');rect(-13,-31+swing,4,12,skin);rect(-12,-21+swing,3,3,shade);
    if(hand){const up=Math.floor(time*6)%2*3;rect(10,-47-up,5,21,ink);rect(11,-46-up,4,15,skin);rect(9,-51-up,7,6,skin);rect(10,-50-up,1,3,shade);}
    else {rect(9,-37-swing,6,10,ink);rect(10,-36-swing,4,5,'#e2e7e7');rect(11,-31-swing,4,12,shade);rect(11,-25-swing,3,5,skin);}
    // Large head, stepped outline, nose, ear and individual haircuts.
    rect(-10,-60,18,3,ink);rect(-13,-57,24,18,ink);rect(-10,-40,19,4,ink);rect(-11,-56,21,15,skin);rect(-8,-41,16,4,skin);
    rect(8,-51,5,8,ink);rect(8,-50,4,6,skin);rect(10,-48,2,2,shade);
    rect(-12,-58,21,7,hairColor);rect(-10,-61,16,3,hairColor);rect(-14,-55,5,12,hairColor);
    if(a.index===2||a.index===5){rect(-15,-52,4,22,hairColor);rect(-13,-31,4,3,hairColor);}
    if(a.index===3||a.index===7){for(let i=0;i<5;i++)rect(-12+i*4,-61-(i%2)*2,5,5,hairColor);}
    if(rear){rect(-10,-53,17,10,hairColor);rect(-9,-43,12,3,hairColor);}
    else {
      rect(-4,-50,3,blink?1:4,ink);rect(5,-50,2,blink?1:4,ink);
      if(!blink){rect(-4,-50,1,1,'#fff');rect(5,-50,1,1,'#fff');}
      rect(1,-46,3,3,shade);rect(-1,-40,5,1,'#8e554a');rect(-7,-46,3,2,'#d99573');
      if(a.index===6){rect(-7,-52,8,7,ink);rect(3,-52,7,7,ink);rect(-5,-50,4,3,'#9cb4c8');rect(5,-50,3,3,'#9cb4c8');rect(1,-50,2,1,ink);}
    }
    ctx.restore();
  }
  return {draw};
})();
