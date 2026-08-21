import test from 'node:test';import assert from 'node:assert/strict';
import { createMatchManifest } from '../renderer/game/simulation/MatchManifest.js';
import { MatchSimulation } from '../renderer/game/simulation/MatchSimulation.js';
import { CONFIG } from '../renderer/game/config.js';

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
