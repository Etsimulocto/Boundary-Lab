/* Boundary Lab v0.4 — deterministic geometric sandbox.
   An exploratory classical model, not a quantum-field simulation.
   No hidden physical constants or external libraries.
*/
"use strict";
const $ = id => document.getElementById(id);
const canvas=$("world"), ctx=canvas.getContext("2d");
const plot=$("plot"), pc=plot.getContext("2d");
const W=900,H=540,TAU=Math.PI*2;
const controls=["seed","count","speed","range","attract","repel","memory","noise","boundary","topology","mutation","edgeField","fieldPulse","fieldWidth","fieldRadius","softCore"];
let state, running=false, frame=0, samples=[], baseline=null;
let fpsClock=0, lastTick=0;
const palette=["#63d3d6","#f7b96b","#b99bff"];
const viz={trails:true,centers:true,links:true,quality:"auto",trailLength:32};
let groups=[],previousGroups=[],joins=0,departures=0,meanSpin=0;
function updateDisplay(){
 viz.trails=$("showTrails").checked;viz.centers=$("showCenters").checked;
 viz.links=$("showLinks").checked;viz.quality=$("renderQuality").value;
 viz.trailLength=Number($("trailLength").value);
 $("trailLengthLabel").textContent=viz.trailLength;
 draw();
}

function rng(seed){let a=(seed>>>0)||1;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function setting(){return Object.fromEntries(controls.map(k=>[k,["boundary","topology"].includes(k)?$(k).value:Number($(k).value)]));}
function randn(r){return (r()+r()+r()+r()-2)*1.73205;}
function initialize(){
 const c=setting(),r=rng(c.seed);state={c,r,t:0,particles:[],edges:new Set(),prevEdges:new Set(),history:[]};
 for(let i=0;i<c.count;i++) state.particles.push({x:35+r()*(W-70),y:35+r()*(H-70),vx:(r()-.5)*c.speed,vy:(r()-.5)*c.speed,id:i,kind:Math.floor(r()*3),alive:true});
 samples=[];frame=0;baseline=null;groups=[];previousGroups=[];joins=0;departures=0;meanSpin=0;
 state.trails=state.particles.map(q=>[[q.x,q.y]]);
 running=false;$("play").textContent="▶ Run";draw();measure(true);status("Reset with seed "+c.seed);
}
function dist(a,b,c){
 let dx=b.x-a.x,dy=b.y-a.y;
 if(c.boundary==="wrap"){if(dx>W/2)dx-=W;if(dx< -W/2)dx+=W;if(dy>H/2)dy-=H;if(dy< -H/2)dy+=H;}
 return [dx,dy,Math.max(0.0001,Math.hypot(dx,dy))];
}
function pairAllowed(a,b,c){
 return c.topology==="all" || (c.topology==="same" && a.kind===b.kind) || (c.topology==="near-id" && Math.abs(a.id-b.id)<=2);
}
// Arc geometry shared by the force field and visualization.
// Radius slider 0 = a flat field front; 100 = a circular arc
// bulging inward at the emitter, tapering toward the two corners.
function arcProfile(position,span,curvature){
 const k=Math.max(0,Math.min(1,curvature/100));
 if(k===0)return 1;
 const half=span/2,u=Math.max(-1,Math.min(1,(position-half)/half));
 const sagitta=half*.85, radius=(half*half+sagitta*sagitta)/(2*sagitta);
 const arc=Math.max(0,(Math.sqrt(Math.max(0,radius*radius-(u*half)**2))-(radius-sagitta))/sagitta);
 return (1-k)+k*arc;
}
function fieldDepth(position,span,c){
 return c.fieldWidth*arcProfile(position,span,c.fieldRadius);
}
function edgeFieldForce(q,c,t){
 if(c.edgeField<=0)return [0,0];
 const pulse=Math.max(0,1+c.fieldPulse*Math.sin(t*.03));
 const base=c.edgeField*pulse;
 let fx=0,fy=0;
 const left=fieldDepth(q.y,H,c),right=left;
 const top=fieldDepth(q.x,W,c),bottom=top;
 if(left>0&&q.x<left){
  const s=Math.max(0,1-q.x/left);
  fx+=base*s;fy+=base*.25*s*Math.sin(q.y*.04+t*.02);
 }
 if(right>0&&q.x>W-right){
  const s=Math.max(0,1-(W-q.x)/right);
  fx-=base*s;fy+=base*.25*s*Math.sin(q.y*.04+t*.02+1.7);
 }
 if(top>0&&q.y<top){
  const s=Math.max(0,1-q.y/top);
  fy+=base*s;fx+=base*.25*s*Math.sin(q.x*.04+t*.02+3.1);
 }
 if(bottom>0&&q.y>H-bottom){
  const s=Math.max(0,1-(H-q.y)/bottom);
  fy-=base*s;fx+=base*.25*s*Math.sin(q.x*.04+t*.02+4.6);
 }
 return [fx*.02,fy*.02];
}
// Filled polygons and dashed fronts use exactly the same arc geometry
// as the force calculation, avoiding a misleading UI-only curvature.
function drawFieldRegion(side,c){
 const n=72;
 const horizontal=side==="top"||side==="bottom";
 const span=horizontal?W:H;
 const p=i=>{const v=span*i/n,d=fieldDepth(v,span,c);
  if(side==="top")return [v,d];
  if(side==="bottom")return [v,H-d];
  if(side==="left")return [d,v];
  return [W-d,v];
 };
 const outerStart=side==="top"?[0,0]:side==="bottom"?[0,H]:side==="left"?[0,0]:[W,0];
 const outerEnd=side==="top"?[W,0]:side==="bottom"?[W,H]:side==="left"?[0,H]:[W,H];
 ctx.beginPath();ctx.moveTo(...outerStart);ctx.lineTo(...outerEnd);
 for(let i=n;i>=0;i--)ctx.lineTo(...p(i));ctx.closePath();ctx.fill();
 ctx.beginPath();for(let i=0;i<=n;i++){const xy=p(i);if(i===0)ctx.moveTo(...xy);else ctx.lineTo(...xy);}ctx.stroke();
}
function tick(){
 const {c,r,particles:p}=state, forces=p.map(()=>[0,0]);state.prevEdges=state.edges;state.edges=new Set();
 for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
  if(!p[i].alive||!p[j].alive||!pairAllowed(p[i],p[j],c))continue;
  const [dx,dy,d]=dist(p[i],p[j],c);if(d>c.range && (c.softCore<=0 || d>=18))continue;
  let f=(c.attract*(1-d/c.range)-c.repel*Math.pow(Math.max(0,1-d/24),2))*0.026;
  if(c.softCore>0 && d<18)f-=c.softCore*(1-d/18)*.06;
  f=Math.max(-.24,Math.min(.24,f));
  const fx=f*dx/d,fy=f*dy/d;forces[i][0]+=fx;forces[i][1]+=fy;forces[j][0]-=fx;forces[j][1]-=fy;
  if(d<=c.range)state.edges.add(i+":"+j);
 }
 for(let i=0;i<p.length;i++){
  const q=p[i];if(!q.alive)continue;
  const [efx,efy]=edgeFieldForce(q,c,state.t);
  q.vx=c.memory*q.vx+forces[i][0]+efx+randn(r)*c.noise*.03;
  q.vy=c.memory*q.vy+forces[i][1]+efy+randn(r)*c.noise*.03;
  const max=Math.max(.2,c.speed),v=Math.hypot(q.vx,q.vy);if(v>max){q.vx*=max/v;q.vy*=max/v;}
  q.x+=q.vx;q.y+=q.vy;
  if(c.boundary==="wrap"){q.x=(q.x+W)%W;q.y=(q.y+H)%H;}
  else if(c.boundary==="reflect"){
   if(q.x<5||q.x>W-5){q.x=Math.max(5,Math.min(W-5,q.x));q.vx*=-1;}
   if(q.y<5||q.y>H-5){q.y=Math.max(5,Math.min(H-5,q.y));q.vy*=-1;}
  }else if(q.x<0||q.x>W||q.y<0||q.y>H){q.alive=false;}
  if(c.mutation>0&&r()<c.mutation/10000)q.kind=(q.kind+1+Math.floor(r()*2))%3;
 }
 state.t++;
 if(state.t%3===0)for(const q of p){if(!q.alive)continue;const hist=state.trails[q.id];hist.push([q.x,q.y]);if(hist.length>81)hist.shift();}
 if(state.t%10===0)measure(false);
}
// Periodic connected-component tracking; does not alter movement.
function stats(){
 const p=state.particles.filter(q=>q.alive),n=p.length,edges=state.edges;
 const parent=state.particles.map((q,i)=>i);
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(const key of edges){const [i,j]=key.split(":").map(Number);parent[root(i)]=root(j);}
 const map=new Map();
 for(const q of p){const k=root(q.id);if(!map.has(k))map.set(k,[]);map.get(k).push(q);}
 const components=[...map.values()];
 const next=components.filter(g=>g.length>=2).map(g=>{
  let x=0,y=0;
  if(state.c.boundary==="wrap"){
   const circ=(key,span)=>{let sx=0,cx=0;for(const q of g){const theta=q[key]/span*TAU;sx+=Math.sin(theta);cx+=Math.cos(theta);}return ((Math.atan2(sx,cx)/TAU+1)%1)*span;};
   x=circ("x",W);y=circ("y",H);
  }else{x=g.reduce((v,q)=>v+q.x,0)/g.length;y=g.reduce((v,q)=>v+q.y,0)/g.length;}
  let vx=0,vy=0,radius=0,moment=0,inertia=0;
  for(const q of g){vx+=q.vx;vy+=q.vy;}vx/=g.length;vy/=g.length;
  for(const q of g){const [dx,dy]=dist({x,y},q,state.c);moment+=dx*(q.vy-vy)-dy*(q.vx-vx);inertia+=dx*dx+dy*dy;radius=Math.max(radius,Math.hypot(dx,dy));}
  return {ids:g.map(q=>q.id),x,y,radius,size:g.length,spin:inertia>1e-6?moment/inertia:0};
 });
 // Best-overlap association between sampled connected components.
 const oldOf=new Map();
 previousGroups.forEach((g,i)=>g.ids.forEach(id=>oldOf.set(id,i)));
 const matched=next.map(g=>{const overlap=new Map();for(const id of g.ids){const old=oldOf.get(id);if(old!==undefined)overlap.set(old,(overlap.get(old)||0)+1);}
  let idx=-1,max=0;for(const [i,count] of overlap)if(count>max){max=count;idx=i;}return idx;});
 const before=new Map(),after=new Map();
 previousGroups.forEach((g,i)=>g.ids.forEach(id=>before.set(id,i)));
 next.forEach((g,i)=>g.ids.forEach(id=>after.set(id,i)));
 for(const q of p){const b=before.get(q.id),a=after.get(q.id);
  if(a!==undefined&&(b===undefined||matched[a]!==b))joins++;
  if(b!==undefined&&(a===undefined||matched[a]!==b))departures++;
 }
 previousGroups=next;groups=next;
 const mass=next.filter(g=>g.size>=3);const weight=mass.reduce((s,g)=>s+g.size,0);
 meanSpin=weight?mass.reduce((s,g)=>s+g.spin*g.size,0)/weight:0;
 let retained=0;for(const key of edges)if(state.prevEdges.has(key))retained++;
 const kinds=[0,0,0];for(const q of p)kinds[q.kind]++;
 let entropy=0;for(const count of kinds)if(count){const f=count/(n||1);entropy-=f*Math.log2(f);}
 return {time:state.t,alive:n,edges:edges.size,clusters:components.length,
  largest:Math.max(0,...components.map(g=>g.length)),
  retention:edges.size?retained/edges.size:0,diversity:entropy,seed:state.c.seed,
  joins,departures,meanSpin};
}
function measure(first){
 const s=stats();samples.push(s);if(samples.length>500)samples.shift();
 for(const [id,value] of Object.entries({
  mAlive:s.alive,mEdges:s.edges,mClusters:s.clusters,mLargest:s.largest,
  mRetention:(100*s.retention).toFixed(0)+"%",mDiversity:s.diversity.toFixed(2),
  mJoins:s.joins,mDepartures:s.departures,mSpin:s.meanSpin.toFixed(4)
 }))$(id).textContent=value;
 plotHistory();
}
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle="#090f1d";ctx.fillRect(0,0,W,H);
 ctx.strokeStyle="#17243a";ctx.lineWidth=1;for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 // Each filled band follows the same circular profile as its applied force.
 if(state.c.edgeField>0){
  const c=state.c,phase=.5+.5*Math.sin(state.t*.03);
  ctx.save();
  ctx.fillStyle="#68d3d8";
  ctx.globalAlpha=.06+.08*phase;
  ctx.strokeStyle="#68d3d8";ctx.lineWidth=1.4;
  for(const side of ["left","right","top","bottom"])drawFieldRegion(side,c);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle="rgba(104,211,216,.65)";
  ctx.setLineDash([6,6]);ctx.lineWidth=1.3;
  for(const side of ["left","right","top","bottom"]){
   const horizontal=side==="top"||side==="bottom",span=horizontal?W:H;
   ctx.beginPath();
   for(let i=0;i<=72;i++){
    const v=span*i/72,d=fieldDepth(v,span,c);
    const xy=side==="top"?[v,d]:side==="bottom"?[v,H-d]:side==="left"?[d,v]:[W-d,v];
    if(i===0)ctx.moveTo(...xy);else ctx.lineTo(...xy);
   }
   ctx.stroke();
  }
  ctx.setLineDash([]);
  for(const [x,y] of [[9,H/2],[W-9,H/2],[W/2,9],[W/2,H-9]]){
   ctx.fillStyle="#8ff7e9";ctx.beginPath();ctx.arc(x,y,5+2*phase,0,TAU);ctx.fill();
   ctx.strokeStyle="rgba(143,247,233,.45)";ctx.beginPath();ctx.arc(x,y,10+3*phase,0,TAU);ctx.stroke();
  }
  ctx.restore();
 }
 const p=state.particles;ctx.lineWidth=.8;
 if(viz.trails){
  ctx.save();ctx.lineWidth=1;
  for(const q of p){if(!q.alive)continue;const history=state.trails[q.id];const first=Math.max(1,history.length-viz.trailLength);
   const stride=viz.quality==="low"?2:1;
   for(let j=first;j<history.length;j+=stride){const u=history[j-1],v=history[j];
    if(Math.abs(v[0]-u[0])>W/2||Math.abs(v[1]-u[1])>H/2)continue;
    ctx.strokeStyle=palette[q.kind];ctx.globalAlpha=.06+.42*(j-first)/Math.max(1,history.length-first);
    ctx.beginPath();ctx.moveTo(u[0],u[1]);ctx.lineTo(v[0],v[1]);ctx.stroke();
   }
  }ctx.restore();
 }
 const linkLimit=viz.quality==="low"?750:2200;
 const linkStride=Math.max(1,Math.ceil(state.edges.size/linkLimit));let linkIndex=0;
 if(viz.links)for(const e of state.edges){if(linkIndex++%linkStride!==0)continue;
 const [i,j]=e.split(":").map(Number),a=p[i],b=p[j];if(!a.alive||!b.alive)continue;const [dx,dy]=dist(a,b,state.c);if(Math.abs(dx)>W/2||Math.abs(dy)>H/2)continue;ctx.strokeStyle="rgba(99,211,214,.17)";ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+dx,a.y+dy);ctx.stroke();}
 if(viz.centers){
  ctx.save();ctx.lineWidth=1.1;
  for(const g of groups){if(g.size<3)continue;
   ctx.strokeStyle=g.spin>=0?"#f7b96b":"#63d3d6";
   ctx.beginPath();ctx.arc(g.x,g.y,Math.min(40,Math.max(7,g.radius)),0,TAU);ctx.stroke();
   ctx.beginPath();ctx.moveTo(g.x-5,g.y);ctx.lineTo(g.x+5,g.y);ctx.moveTo(g.x,g.y-5);ctx.lineTo(g.x,g.y+5);ctx.stroke();
   ctx.fillStyle="#e3eafa";ctx.font="11px system-ui";
   ctx.fillText(g.size+" "+(Math.abs(g.spin)<.0005?"·":g.spin>0?"↻":"↺"),g.x+9,g.y-8);
  }ctx.restore();
 }
 for(const q of p){if(!q.alive)continue;ctx.fillStyle=palette[q.kind];ctx.beginPath();ctx.arc(q.x,q.y,3.8,0,TAU);ctx.fill();}
 ctx.fillStyle="#9db3cd";ctx.font="13px system-ui";ctx.fillText("TICK "+state.t,14,22);
}
function plotHistory(){
 const w=plot.width,h=plot.height;pc.clearRect(0,0,w,h);pc.fillStyle="#0d1728";pc.fillRect(0,0,w,h);
 pc.strokeStyle="#23324a";for(let y=20;y<h;y+=30){pc.beginPath();pc.moveTo(0,y);pc.lineTo(w,y);pc.stroke();}
 const points=samples;const max=Math.max(1,...points.map(s=>s.largest));
 pc.strokeStyle="#63d3d6";pc.lineWidth=2;pc.beginPath();
 points.forEach((s,i)=>{const x=(i/Math.max(1,points.length-1))*w,y=h-12-(s.largest/max)*(h-25);i?pc.lineTo(x,y):pc.moveTo(x,y);});pc.stroke();
 pc.fillStyle="#9db3cd";pc.font="12px system-ui";pc.fillText("Largest connected cluster (autoscaled)",10,15);
}
function status(s){$("status").textContent=s;}
function syncLabels(){for(const id of ["count","speed","range","attract","repel","memory","noise","mutation","edgeField","fieldPulse","fieldWidth","fieldRadius","softCore"])$(id+"Label").textContent=$(id).value;}
function animate(t){if(running && t-lastTick>=30){tick();if(viz.quality!=="low"||state.t%2===0)draw();lastTick=t;}requestAnimationFrame(animate);}
$("play").onclick=()=>{running=!running;$("play").textContent=running?"❚❚ Pause":"▶ Run";status(running?"Running":"Paused");};
$("step").onclick=()=>{running=false;$("play").textContent="▶ Run";tick();draw();status("Advanced one tick");};
$("reset").onclick=initialize;
$("randomSeed").onclick=()=>{$("seed").value=Math.floor(Math.random()*1000000000)+1;initialize();};
for(const id of controls){$(id).addEventListener("change",()=>{syncLabels();initialize();});$(id).addEventListener("input",syncLabels);}
$("export").onclick=()=>{
 const payload={about:"Boundary Lab v0.4 classical toy model — no claim of quantum or cosmological validity",configuration:state.c,samples};
 const a=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));a.href=url;a.download="boundary-lab-"+state.c.seed+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$("csv").onclick=()=>{
 const keys=["time","alive","edges","clusters","largest","retention","diversity","seed","joins","departures","meanSpin"];
 const csv=[keys.join(","),...samples.map(s=>keys.map(k=>s[k]).join(","))].join("\n");
 const a=document.createElement("a"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.href=url;a.download="boundary-lab-"+state.c.seed+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$("presets").onchange=e=>{
 const presets={
  baseline:{attract:0,repel:0,memory:.9,noise:.3,range:75,boundary:"wrap",topology:"all",mutation:0},
  aggregation:{attract:2.8,repel:.9,memory:.88,noise:.15,range:110,boundary:"wrap",topology:"all",mutation:0},
  separation:{attract:0,repel:3,memory:.85,noise:.2,range:85,boundary:"reflect",topology:"all",mutation:0},
  selective:{attract:2.5,repel:.8,memory:.9,noise:.12,range:110,boundary:"wrap",topology:"same",mutation:1},
  open:{attract:1.6,repel:1.3,memory:.92,noise:.4,range:90,boundary:"open",topology:"all",mutation:0},
  fieldstorm:{attract:1.2,repel:1.2,memory:.9,noise:.35,range:90,boundary:"reflect",topology:"all",mutation:10,edgeField:2.2,fieldPulse:1.4,fieldWidth:60,fieldRadius:75,softCore:.6}
 };const v=presets[e.target.value];if(!v)return;for(const [k,val] of Object.entries({edgeField:0,fieldPulse:0,fieldWidth:55,fieldRadius:0,softCore:0,...v}))$(k).value=val;syncLabels();initialize();
};
for(const id of ["showTrails","showCenters","showLinks","renderQuality","trailLength"])$(id).addEventListener("change",updateDisplay);
$("trailLength").addEventListener("input",updateDisplay);
syncLabels();initialize();requestAnimationFrame(animate);
