import test from 'node:test';
import assert from 'node:assert/strict';
import {replyTo,molarMass,detectLanguage} from '../web/engine.js';
import {makeSvg} from '../web/studio.js';

test('solves arithmetic, equations and supported science questions locally',()=>{
  assert.match(replyTo('2*(3+4)',{mode:'math'}),/14/);
  assert.match(replyTo('2x+3=11',{mode:'math'}),/x = 4/);
  assert.match(replyTo('-2x+3=11',{mode:'math'}),/x = -4/);
  assert.match(replyTo('-3+2',{mode:'math'}),/= -1/);
  assert.equal(Number(molarMass('H2O').total.toFixed(3)),18.015);
  assert.match(replyTo('H2O molar mass',{mode:'chemistry'}),/18\.015/);
  assert.match(replyTo('Mg(OH)2 molar mass',{mode:'chemistry'}),/does not support/);
  assert.match(replyTo('force for 5 kg at 2 m\/s²',{mode:'physics'}),/10 N/);
});

test('keeps subject and language choices distinct and handles crisis directly',()=>{
  assert.equal(detectLanguage('epdi pannu'),'Tanglish');
  assert.match(replyTo('I want to die',{mode:'ideas'}),/emergency service/i);
  assert.match(replyTo('saaganum',{mode:'math',language:'Tanglish'}),/emergency service/i);
  assert.match(replyTo('I am suicidal',{mode:'ideas'}),/emergency service/i);
  assert.match(replyTo('I might cut myself',{mode:'decide'}),/emergency service/i);
  assert.match(replyTo('I plan to end it tonight',{mode:'reason'}),/emergency service/i);
  assert.match(replyTo('Python starter',{mode:'code'}),/```python/);
  assert.match(replyTo('new student app ideas',{mode:'ideas'}),/Three practical ideas/);
  assert.match(replyTo('new student app ideas',{mode:'imagine'}),/Three imaginative directions/);
  assert.match(replyTo('video epdi create panra?',{language:'Tanglish'}),/MediaRecorder/);
  assert.match(replyTo('How do you generate an image?'),/SVG image/);
});

test('procedural artwork is deterministic and escapes user text',()=>{
  const first=makeSvg('premium rose'),second=makeSvg('premium rose');
  assert.equal(first,second);assert.match(first,/svg/);assert.match(first,/petal/);
  const hostile=makeSvg('<script>alert(1)</script>');
  assert.doesNotMatch(hostile,/<script>/);assert.match(hostile,/&lt;script&gt;/);
});
