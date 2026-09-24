import test from 'node:test';import assert from 'node:assert/strict';
import { createMatchManifest } from '../renderer/game/simulation/MatchManifest.js';
import { MatchSimulation } from '../renderer/game/simulation/MatchSimulation.js';
import { CONFIG } from '../renderer/game/config.js';
import { VehicleSystem } from '../renderer/game/simulation/VehicleSystem.js';

function runSteps(seed,steps,decisionEffect=null){const sim=new MatchSimulation(createMatchManifest(seed));if(decisionEffect)sim.applyDecisionEffect(decisionEffect);for(let i=0;i<steps&&sim.running;i++)sim.step();return sim.checksumState();}

test('same manifest + no human decisions is deterministic',()=>{const a=runSteps('123901830981',1800),b=runSteps('123901830981',1800);assert.equal(a,b);});

test('same seed diverges after a different human decision',()=>{
  const manifest=createMatchManifest('998877665544');
  const a=new MatchSimulation(manifest), b=new MatchSimulation(manifest);
  const makeDecision=()=>({id:'test-route',type:'route',title:'Route test',description:'Determinism branch test',defaultOption:'centre',options:[
    {id:'centre',label:'Centre',effect:{kind:'route',targetX:7000}},
    {id:'edge',label:'Edge',effect:{kind:'route',targetX:11800}}
  ]});
  a.decisions.offer(makeDecision(),a.tick); b.decisions.offer(makeDecision(),b.tick);
  a.chooseDecision('centre'); b.chooseDecision('edge');
  for(let i=0;i<720;i++){a.step();b.step();}
  assert.notEqual(a.checksumState(),b.checksumState());
  assert.equal(a.decisions.history[0].option,'centre');
  assert.equal(b.decisions.history[0].option,'edge');
});

test('render frame cadence does not change fixed-timestep result',()=>{
  function withFrames(seed,deltas,totalSeconds){const sim=new MatchSimulation(createMatchManifest(seed));let accumulator=0,elapsed=0,index=0;while(elapsed<totalSeconds-1e-9){let dt=Math.min(deltas[index++%deltas.length],totalSeconds-elapsed);elapsed+=dt;accumulator+=dt;while(accumulator+1e-12>=CONFIG.TICK_SECONDS&&sim.running){sim.step();accumulator-=CONFIG.TICK_SECONDS;}}return sim.checksumState();}
  const sixty=withFrames('fps-test',[1/60],90);const uneven=withFrames('fps-test',[1/24,1/144,1/37,1/90,1/51],90);assert.equal(uneven,sixty);
});

test('mock manifest creates 25 real squads and 100 simulated characters',()=>{
  const sim=new MatchSimulation(createMatchManifest('population-test'));
  assert.equal(sim.squads.length,25);
  assert.equal(sim.squads.reduce((n,s)=>n+s.members.length,0),100);
  assert.equal(sim.aliveCharacters(),100);
});

test('decision system auto-resolves ignored choices',()=>{
  const sim=new MatchSimulation(createMatchManifest('decision-timeout'));
  sim.decisions.offer({id:'manual-test',type:'route',title:'Test',description:'Test timeout',timeoutTicks:3,defaultOption:'safe',options:[
    {id:'safe',label:'Safe',effect:{kind:'route',targetX:7000}},
    {id:'risk',label:'Risk',effect:{kind:'route',targetX:12000}}
  ]},sim.tick);
  for(let i=0;i<4;i++)sim.step();
  assert.equal(sim.decisions.history[0].id,'manual-test');
  assert.equal(sim.decisions.history[0].option,'safe');
  assert.equal(sim.decisions.history[0].timedOut,true);
});

test('squad members keep independent positions and downed members stay where they fell',()=>{
  const sim=new MatchSimulation(createMatchManifest('independent-movement'));
  const squad=sim.playerSquad;
  for(let i=0;i<20;i++)sim.step();
  assert.ok(new Set(squad.aliveMembers.map(m=>m.offsetX.toFixed(1))).size>1);
  const member=squad.members[0];
  member.knock(sim.tick);
  const fallX=squad.x+member.offsetX;
  for(let i=0;i<10;i++)sim.step();
  assert.ok(Math.abs((squad.x+member.offsetX)-fallX)<0.001);
});

test('opening deployment spreads squads and delays combat',()=>{
  const sim=new MatchSimulation(createMatchManifest('calm-opening'));
  const positions=sim.squads.map(s=>s.x).sort((a,b)=>a-b);
  assert.ok(positions.slice(1).every((x,i)=>x-positions[i]>500));
  for(let i=0;i<CONFIG.COMBAT_GRACE_TICKS-1;i++)sim.step();
  assert.equal(sim.squads.some(s=>s.members.some(m=>m.damage>0)),false);
});

test('queued decisions receive a full timeout after becoming active',()=>{
  const sim=new MatchSimulation(createMatchManifest('decision-queue'));
  const decision=id=>({id,type:'test',title:id,description:id,timeoutTicks:3,defaultOption:'ok',options:[{id:'ok',label:'OK',effect:{kind:'noop'}}]});
  sim.decisions.offer(decision('first'),sim.tick);sim.decisions.offer(decision('second'),sim.tick);
  for(let i=0;i<3;i++)sim.step();
  assert.equal(sim.decisions.active.id,'second');
  assert.equal(sim.decisions.active.expiresTick,sim.tick+3);
});

test('a vehicle claimed by squad zero cannot be claimed again',()=>{
  const system=new VehicleSystem({pois:[{id:1,x:100,hasVehicle:true}]});
  const player={id:0,vehicle:null},rival={id:1,vehicle:null};
  assert.equal(system.claim(system.vehicles[0],player),true);
  assert.equal(system.availableNear(100),null);
  assert.equal(system.claim(system.vehicles[0],rival),false);
});
