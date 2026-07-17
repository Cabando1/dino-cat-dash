(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.game||!D.state||!D.player||!D.arrays||!D.ui||!D.render)return;

  const S=D.state,P=D.player,A=D.arrays;
  const stage=document.querySelector('.stage');
  const panel=D.ui.overlay&&D.ui.overlay.querySelector('.panel');
  if(!stage||!panel)return;

  const VERSION='3.0.0';
  const GUIDE_KEY='dinoCatDashPowerGuideSeenV3';
  const DIFFICULTY_KEY='dinoCatDashDifficultyV3';
  const BOSS_WIN_KEY='dinoCatDashBossDefeatedV3';
  const profiles={
    easy:{label:'Easy',speedStart:.72,speedEnd:.92,gapStart:390,gapEnd:285,hitPad:8,bossMin:270,castleMin:70,warning:2.7,scoreFactor:1},
    normal:{label:'Normal',speedStart:.84,speedEnd:1,gapStart:330,gapEnd:245,hitPad:5,bossMin:240,castleMin:60,warning:2.2,scoreFactor:1.08},
    wild:{label:'Wild',speedStart:1,speedEnd:1.16,gapStart:275,gapEnd:195,hitPad:2,bossMin:205,castleMin:45,warning:1.7,scoreFactor:1.25}
  };
  const obstacleMeta={
    cat:['Sleeping Cat','Jump normally. Please respect nap hours.','LOW'],tree:['Tall Tree','Jump early and hold Jump for maximum height.','TALL'],duck:['Rubber Duck','A small bounce-sized obstacle with a large ego.','LOW'],pizza:['Pizza Slice','Jump normally. Do not stop for toppings.','LOW'],stump:['Tree Stump','Jump near the front edge.','MEDIUM'],yarn:['Yarn Ball','It rolls low; jump when it reaches the warning line.','LOW'],toast:['Toast','Crispy, square, and somehow dangerous.','MEDIUM'],mixer:['Stand Mixer','Tall kitchen hazard. Jump early.','TALL'],roll:['Rolling Pin','Low and fast. Use a quick jump.','LOW'],vacuum:['Robot Vacuum','Jump early; it refuses to yield.','MEDIUM'],lamp:['Floor Lamp','Very tall. Hold Jump to clear it.','TALL'],armorCat:['Armored Cat','Jump early. The helmet is not decorative.','TALL'],banner:['Castle Banner','Tall castle obstacle. Hold Jump.','TALL'],crown:['Crown Pile','Low royal clutter. Jump normally.','LOW']
  };
  const obstacleDims={cat:[98,42],tree:[62,120],duck:[56,50],pizza:[56,54],stump:[76,56],yarn:[75,52],toast:[58,56],mixer:[72,84],roll:[50,58],vacuum:[92,62],lamp:[58,116],armorCat:[78,98],banner:[52,118],crown:[76,54]};
  const worldPatterns=[['cat','duck','pizza','cat','tree'],['cat','stump','yarn','cat','tree'],['pizza','toast','roll','mixer'],['cat','yarn','vacuum','lamp'],['crown','armorCat','banner','cat']];
  const powerMeta=[
    ['Flame Breath','Tap Shoot. Twenty-four bouncing fire blasts destroy obstacles.','Shoot'],
    ['Laser Blaster','Tap Shoot. Thirty-six fast shots; ammunition is unlimited during the boss.','Shoot'],
    ['Shield Egg','Blocks two hits when first collected and stacks up to three shields.','Automatic'],
    ['Super Sneakers','Higher, more controllable jumps for nine seconds. Hold Jump for the highest leap.','Automatic'],
    ['Star Magnet','Pulls nearby stars and bonuses toward Rex for ten seconds.','Automatic'],
    ['Time Freeze','Slows hazards for eight seconds and adds a visible frozen-screen effect.','Automatic'],
    ['Golden Rex','Seven seconds of invincibility. Shiny confidence included.','Automatic'],
    ['Mega Roar','Clears hazards and damages Sir Whiskers. Five stars recharge one roar.','Mega Roar'],
    ['Extra Life','Restores one heart up to the five-life maximum.','Automatic'],
    ['Bonus Star','Builds score combos and helps recharge Mega Roar.','Collect']
  ];
  const objectives=[
    {type:'jumps',goal:5,text:'Jump 5 hazards',reward:'Shield Egg'},
    {type:'powers',goal:2,text:'Collect 2 power-ups',reward:'Mega Roar'},
    {type:'destroyed',goal:4,text:'Destroy 4 obstacles',reward:'Shield Egg'},
    {type:'stars',goal:4,text:'Collect 4 stars',reward:'Extra Life'},
    {type:'jumps',goal:6,text:'Jump 6 castle hazards',reward:'Mega Roar'}
  ];

  const safeGet=(key,fallback)=>{try{return D.store.get(key,fallback)}catch{return fallback}};
  const safeSet=(key,value)=>{try{D.store.set(key,value)}catch{}};
  let difficulty=safeGet(DIFFICULTY_KEY,'easy');
  if(!profiles[difficulty])difficulty='easy';
  let guideSeen=Boolean(safeGet(GUIDE_KEY,false));
  let runTime=0,castleTime=0,lastWorld=S.world,worldStartStats={},objectiveDone=false;
  let jumpHeld=false,jumpHold=0,jumpBuffer=0,coyote=0;
  let recovery=0,lastLives=S.lives,lastPowerCount=Number(S.stats&&S.stats.powers)||0,lastStars=Number(S.stats&&S.stats.stars)||0;
  let firstBossAssistApplied=false,bossGuideShown=false,lastBossHp=null,lastBossPhase=0;
  let warningType=null,warningUntil=0,choiceTimer=28,choiceId=0,activeChoice=null;
  let modalKind=null,modalReturnMode='menu',queuedCheckpoint=null;
  let practiceMode=null,pendingPractice=null,practiceSnapshot=null,continueUsed=false;
  let damageByType={},lastHazardType='hazard',patternIndex=[0,0,0,0,0],seenObstacles={};
  const knownObstacles=new WeakSet();

  const menuTools=document.createElement('section');
  menuTools.id='v3MenuTools';
  menuTools.className='v3-menu-tools';
  menuTools.innerHTML=`
    <div class="v3-difficulty"><span>Difficulty:</span>
      <button type="button" data-difficulty="easy">Easy</button>
      <button type="button" data-difficulty="normal">Normal</button>
      <button type="button" data-difficulty="wild">Wild</button>
    </div>
    <div class="v3-tool-buttons">
      <button type="button" id="v3PowerGuideBtn">Power Guide</button>
      <button type="button" id="v3ObstacleGuideBtn">Obstacle Guide</button>
      <button type="button" id="v3TrainingBtn">Training</button>
      <button type="button" id="v3RestartWorldBtn">Restart World</button>
      <button type="button" id="v3ContinueBtn">Second Chance</button>
    </div>`;
  const menuActions=panel.querySelector('.menu-actions');
  panel.insertBefore(menuTools,menuActions||null);

  const warning=document.createElement('aside');
  warning.id='v3Warning';warning.className='v3-warning hidden';
  warning.innerHTML='<span>UPCOMING</span><strong></strong><em></em><b></b>';
  stage.appendChild(warning);

  const objectiveHud=document.createElement('aside');
  objectiveHud.id='v3Objective';objectiveHud.className='v3-objective hidden';
  objectiveHud.innerHTML='<span>WORLD OBJECTIVE</span><strong></strong><i><b></b></i><em></em>';
  stage.appendChild(objectiveHud);

  const bossHud=document.createElement('aside');
  bossHud.id='v3BossHud';bossHud.className='v3-boss-hud hidden';
  bossHud.innerHTML='<div><span>Sir Whiskers</span><strong></strong></div><i><b></b></i><p></p><em></em>';
  stage.appendChild(bossHud);

  const modeBadge=document.createElement('div');
  modeBadge.id='v3ModeBadge';modeBadge.className='v3-mode-badge';stage.appendChild(modeBadge);

  const endPanel=document.createElement('section');
  endPanel.id='v3EndPanel';endPanel.className='v3-end-panel hidden';
  D.ui.results.insertAdjacentElement('afterend',endPanel);

  const modal=document.createElement('section');
  modal.id='v3Modal';modal.className='v3-modal hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  modal.innerHTML='<div class="v3-modal-panel"><p class="v3-modal-kicker"></p><h2></h2><div class="v3-modal-body"></div><div class="v3-modal-actions"><button type="button" id="v3ModalClose">Continue</button></div></div>';
  document.body.appendChild(modal);
  const modalKicker=modal.querySelector('.v3-modal-kicker'),modalTitle=modal.querySelector('h2'),modalBody=modal.querySelector('.v3-modal-body'),modalClose=modal.querySelector('#v3ModalClose');

  function profile(){return profiles[difficulty]}
  function suppressOldCards(){
    const old=document.getElementById('storyCard');if(old)old.classList.add('hidden');
    const reliable=document.getElementById('reliableStoryCard');if(reliable)reliable.classList.add('hidden');
    document.body.classList.remove('story-open','reliable-story-open');
  }
  function stopOldCutscene(){
    if(D.cutsceneReliability&&D.cutsceneReliability.activeKind&&typeof D.cutsceneReliability.close==='function'){
      try{D.cutsceneReliability.close()}catch{}
    }
    suppressOldCards();
  }
  function currentObjective(){return objectives[Math.min(4,S.world)]}
  function statValue(type){return Number(S.stats&&S.stats[type])||0}
  function objectiveProgress(){const o=currentObjective();return Math.max(0,statValue(o.type)-Number(worldStartStats[o.type]||0))}
  function resetObjective(){worldStartStats={jumps:statValue('jumps'),powers:statValue('powers'),destroyed:statValue('destroyed'),stars:statValue('stars')};objectiveDone=false}
  function rewardObjective(){
    const o=currentObjective();
    if(o.reward==='Shield Egg')P.shield=Math.min(3,Math.max(2,P.shield+1));
    else if(o.reward==='Mega Roar')P.roars=Math.min(3,P.roars+1);
    else if(o.reward==='Extra Life')S.lives=Math.min(5,S.lives+1);
    objectiveDone=true;
    if(D.game.toast)D.game.toast(`Objective complete: ${o.reward}`);
    if(D.audio&&D.audio.sfx&&D.audio.sfx.unlock)D.audio.sfx.unlock();
    D.game.updateHud();
  }
  function updateObjectiveHud(){
    if(S.mode==='menu'||S.mode==='over'||S.boss){objectiveHud.classList.add('hidden');return}
    const o=currentObjective(),value=Math.min(o.goal,objectiveProgress());
    objectiveHud.classList.remove('hidden');objectiveHud.querySelector('strong').textContent=o.text;
    objectiveHud.querySelector('i b').style.width=`${100*value/o.goal}%`;
    objectiveHud.querySelector('em').textContent=objectiveDone?`Complete — ${o.reward} awarded`:`${value}/${o.goal} • Reward: ${o.reward}`;
    if(!objectiveDone&&value>=o.goal)rewardObjective();
  }
  function difficultyProgress(){return Math.min(1,runTime/Math.max(1,profile().bossMin))}
  function movementFactor(){
    if(practiceMode==='trees'||practiceMode==='powers')return .62;
    const p=profile(),t=difficultyProgress();
    return p.speedStart+(p.speedEnd-p.speedStart)*t;
  }
  function minimumGap(){const p=profile(),t=difficultyProgress();return p.gapStart+(p.gapEnd-p.gapStart)*t}
  function bossMinimumForStart(){
    const base=profile().bossMin;
    const reductions=[0,55,110,160,base];
    return Math.max(75,base-reductions[Math.min(4,Number(S.selectedWorld)||0)]);
  }
  function bossGateMet(){return Number(S.selectedWorld)===4||practiceMode==='boss'||(runTime>=bossMinimumForStart()&&castleTime>=profile().castleMin)}

  function setDifficulty(name){
    if(!profiles[name])return;difficulty=name;safeSet(DIFFICULTY_KEY,name);
    document.querySelectorAll('[data-difficulty]').forEach(b=>b.classList.toggle('active',b.dataset.difficulty===name));
    if(D.game.toast)D.game.toast(`${profiles[name].label} difficulty selected`);
  }
  menuTools.querySelectorAll('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>setDifficulty(b.dataset.difficulty)));

  function powerGuideHtml(){return `<div class="v3-guide-intro"><strong>How powers work</strong><p>Run into a glowing item. The HUD shows the power, ammunition, shield count, or timer. The game pauses the first time so the power cannot expire while you read.</p></div><div class="v3-guide-grid">${powerMeta.map(([name,copy,control],i)=>`<article><b>${i+1}</b><div><strong>${name}</strong><span>${copy}</span><em>${control}</em></div></article>`).join('')}</div><div class="v3-callout"><strong>Quick rule:</strong> Flame and Laser use Shoot. Mega Roar uses the orange button. Everything else activates automatically.</div>`}
  function obstacleGuideHtml(){return `<div class="v3-guide-intro"><strong>Read the silhouette and warning</strong><p>Hazards now receive a dark ground shadow, a contrast outline, and an advance warning. Tall objects require an early jump and a longer press.</p></div><div class="v3-obstacle-grid">${Object.entries(obstacleMeta).map(([type,[name,copy,height]])=>`<article><div class="v3-obstacle-symbol ${height.toLowerCase()}">${name.split(' ').map(x=>x[0]).join('')}</div><div><strong>${name}</strong><span>${copy}</span><em>${height}</em></div></article>`).join('')}</div>`}
  function checkpointHtml(world){
    const next=D.worlds[world]||D.worlds[4];
    return `<div class="v3-checkpoint"><div><span>Score</span><strong>${Math.floor(S.score).toLocaleString()}</strong></div><div><span>Lives</span><strong>${'❤'.repeat(Math.max(0,S.lives))}</strong></div><div><span>Best Combo</span><strong>x${S.stats.maxCombo||1}</strong></div><div><span>Next</span><strong>${next.name}</strong></div></div><p class="v3-center">New obstacle types will be labeled when they first appear. The next section begins only after you press Continue.</p>`;
  }
  function bossGuideHtml(){return `<div class="v3-boss-guide"><div class="v3-versus"><span>REX</span><b>VS</b><span>SIR WHISKERS</span></div><div class="v3-phase-grid"><article><b>1</b><strong>Yarn Barrage</strong><span>Watch GET READY, then jump when JUMP NOW appears.</span></article><article><b>2</b><strong>Fireball Trouble</strong><span>Fireballs and the Royal Paw move faster. Shoot fireballs or jump them.</span></article><article><b>3</b><strong>Vacuum Panic</strong><span>Faster volleys and robot-vacuum rushes. Keep shooting.</span></article></div><div class="v3-instruction-grid"><article><strong>Laser</strong><span>Boss ammunition is unlimited. Hold a steady rhythm on Shoot.</span></article><article><strong>Mega Roar</strong><span>Use it when several attacks are on screen or when a phase begins.</span></article><article><strong>Warnings</strong><span>GET READY means prepare. JUMP NOW is the moment to leave the ground.</span></article><article><strong>First attempt help</strong><span>Your first boss attempt includes a shield, a ready roar, and slower attacks.</span></article></div></div>`}
  function practiceHtml(){return `<div class="v3-practice-grid"><button type="button" data-practice="trees"><strong>Tree Practice</strong><span>Slower speed, tree-only hazards, and repeated jump timing.</span></button><button type="button" data-practice="powers"><strong>Power Lab</strong><span>No obstacles. Collect and test rotating power-up choices.</span></button><button type="button" data-practice="boss"><strong>Boss Practice</strong><span>Start directly at Sir Whiskers with first-attempt assistance.</span></button></div><p class="v3-center">Training does not change high scores or daily bests.</p>`}

  function openModal(kind,options={}){
    if(modalKind)return;
    stopOldCutscene();
    modalKind=kind;modalReturnMode=options.returnMode||S.mode||'menu';
    modal.classList.remove('hidden');document.body.classList.add('v3-modal-open');
    if(kind==='powers'){
      modalKicker.textContent=options.first?'FIRST POWER-UP — GAME PAUSED':'REFERENCE GUIDE';
      modalTitle.textContent='Rex’s Power-Up Field Manual';modalBody.innerHTML=powerGuideHtml();modalClose.textContent=options.first?'Resume With My Power':'Back';
    }else if(kind==='obstacles'){
      modalKicker.textContent='REFERENCE GUIDE';modalTitle.textContent='Obstacle Identification Guide';modalBody.innerHTML=obstacleGuideHtml();modalClose.textContent='Back';
    }else if(kind==='checkpoint'){
      modalKicker.textContent='WORLD COMPLETE';modalTitle.textContent=`Next: ${(D.worlds[options.world]||D.worlds[4]).name}`;modalBody.innerHTML=checkpointHtml(options.world);modalClose.textContent='Continue Adventure';
    }else if(kind==='boss'){
      modalKicker.textContent='FINAL BOSS AHEAD — GAME PAUSED';modalTitle.textContent='Sir Whiskers Has Filed a Formal Challenge';modalBody.innerHTML=bossGuideHtml();modalClose.textContent='Ready — Start the Fight';
    }else if(kind==='practice'){
      modalKicker.textContent='TRAINING MODE';modalTitle.textContent='Choose a Practice Session';modalBody.innerHTML=practiceHtml();modalClose.textContent='Cancel';
      modalBody.querySelectorAll('[data-practice]').forEach(btn=>btn.addEventListener('click',()=>startPractice(btn.dataset.practice)));
    }
    if(options.pause!==false)S.mode='v3modal';
    try{modalClose.focus({preventScroll:true})}catch{modalClose.focus()}
  }
  function closeModal(){
    if(!modalKind)return;
    const closing=modalKind;modalKind=null;modal.classList.add('hidden');document.body.classList.remove('v3-modal-open');
    if(closing==='powers'&&!guideSeen){guideSeen=true;safeSet(GUIDE_KEY,true)}
    if(closing==='checkpoint'||closing==='boss'||modalReturnMode==='play'||modalReturnMode==='v3modal'){
      S.mode='play';S.last=performance.now();D.ui.overlay.classList.remove('visible');
    }else S.mode=modalReturnMode;
    if(queuedCheckpoint){const world=queuedCheckpoint;queuedCheckpoint=null;setTimeout(()=>openModal('checkpoint',{world,returnMode:'play'}),0)}
  }
  modalClose.addEventListener('click',closeModal);
  addEventListener('keydown',e=>{if(modalKind&&(e.key==='Enter'||e.key==='Escape')){e.preventDefault();closeModal()}},true);

  menuTools.querySelector('#v3PowerGuideBtn').addEventListener('click',()=>openModal('powers',{returnMode:S.mode,pause:S.mode==='play'}));
  menuTools.querySelector('#v3ObstacleGuideBtn').addEventListener('click',()=>openModal('obstacles',{returnMode:S.mode,pause:S.mode==='play'}));
  menuTools.querySelector('#v3TrainingBtn').addEventListener('click',()=>openModal('practice',{returnMode:S.mode}));
  menuTools.querySelector('#v3RestartWorldBtn').addEventListener('click',()=>{const w=Math.min(4,S.world);S.selectedWorld=w;pendingPractice=practiceMode;D.game.reset()});
  menuTools.querySelector('#v3ContinueBtn').addEventListener('click',useSecondChance);

  function startPractice(kind){
    modalKind=null;modal.classList.add('hidden');document.body.classList.remove('v3-modal-open');
    practiceSnapshot={selectedWorld:S.selectedWorld,high:S.high,dailyBest:S.dailyBest};pendingPractice=kind;
    S.selectedWorld=kind==='boss'?4:0;D.game.reset();
  }
  function exitPractice(){
    if(!practiceMode)return;
    const snap=practiceSnapshot;practiceMode=null;pendingPractice=null;
    if(snap){S.selectedWorld=snap.selectedWorld;S.high=snap.high;S.dailyBest=snap.dailyBest;safeSet('dinoCatDashHighScore',snap.high);safeSet('dinoCatDashDaily-'+S.dailyKey,snap.dailyBest)}
    D.game.showMenu();
  }

  function useSecondChance(){
    if(S.mode!=='over'||continueUsed)return;
    const eligible=difficulty==='easy'||statValue('stars')>=5;
    if(!eligible)return;
    continueUsed=true;S.lives=2;P.inv=3;P.y=D.G-P.h;P.vy=0;P.ground=true;S.mode='play';S.last=performance.now();
    A.obstacles.splice(0,A.obstacles.length,...A.obstacles.filter(o=>o.x>P.x+360));
    A.enemies.splice(0,A.enemies.length,...A.enemies.filter(e=>e.x>P.x+360));
    D.ui.overlay.classList.remove('visible');D.game.updateHud();
    if(D.game.toast)D.game.toast('Second Chance: 2 lives and 3 seconds of protection');
  }

  function identifyUpcoming(){
    let next=null;
    for(const o of A.obstacles){if(o.x>P.x+120&&(!next||o.x<next.x))next=o}
    if(!next){warning.classList.add('hidden');warningType=null;return}
    const meta=obstacleMeta[next.type]||[next.type,'Jump the hazard.','HAZARD'];
    const distance=next.x-P.x;
    const showDistance=Math.max(430,S.speed*profile().warning);
    if(distance<showDistance){
      warning.classList.remove('hidden');warning.querySelector('strong').textContent=meta[0];warning.querySelector('em').textContent=meta[1];warning.querySelector('b').textContent=meta[2];
      if(warningType!==next.type){warningType=next.type;warningUntil=S.time+1.1;if(D.audio&&D.audio.tone)D.audio.tone(meta[2]==='TALL'?260:340,.08,'square',.012,-50)}
    }else warning.classList.add('hidden');
  }

  function tuneNewObstacles(){
    const existing=A.obstacles.filter(o=>knownObstacles.has(o));
    for(const o of A.obstacles){
      if(knownObstacles.has(o))continue;
      knownObstacles.add(o);
      const world=Math.min(4,S.world),pattern=worldPatterns[world],type=practiceMode==='trees'?'tree':pattern[patternIndex[world]++%pattern.length];
      const d=obstacleDims[type];o.type=type;o.w=d[0];o.h=d[1];o.y=D.G-d[1];
      const rightmost=existing.reduce((m,x)=>Math.max(m,x.x+x.w),P.x+180);
      o.x=Math.max(o.x,rightmost+minimumGap());existing.push(o);
      const count=seenObstacles[type]||0;seenObstacles[type]=count+1;
      if(count<2&&['tree','mixer','lamp','armorCat','banner'].includes(type)){
        for(let i=0;i<3;i++)A.items.push({kind:'star',x:o.x-250+i*68,y:D.G-165-Math.sin(i/2*Math.PI)*48,w:46,h:46,phase:i,spin:0,v3Trail:true});
      }
    }
  }

  function spawnChoice(){
    if(S.boss||practiceMode==='boss'||activeChoice)return;
    const pairs=[['shield','laser'],['sneakers','magnet'],['freeze','golden'],['flame','roar']];
    const pair=pairs[choiceId%pairs.length],id=++choiceId;activeChoice=id;
    A.items.push({kind:pair[0],x:D.W+80,y:255,w:46,h:46,phase:0,spin:0,v3Choice:id});
    A.items.push({kind:pair[1],x:D.W+80,y:350,w:46,h:46,phase:2,spin:0,v3Choice:id});
    if(D.game.toast)D.game.toast(`Choose one: ${D.powerInfo[pair[0]][0]} or ${D.powerInfo[pair[1]][0]}`);
  }
  function manageChoice(powerCollected){
    if(!activeChoice)return;
    const choices=A.items.filter(i=>i.v3Choice===activeChoice);
    if(powerCollected){for(let i=A.items.length-1;i>=0;i--)if(A.items[i].v3Choice===activeChoice)A.items.splice(i,1);activeChoice=null;choiceTimer=36}
    else if(!choices.length||choices.every(i=>i.x<-60)){activeChoice=null;choiceTimer=24}
  }

  function applyPowerBalance(before){
    const powers=statValue('powers'),stars=statValue('stars');
    const collected=powers>before.powers;
    if(collected){
      if(P.power==='flame')P.ammo=Math.max(P.ammo,24);
      if(P.power==='laser'&&!S.boss)P.ammo=Math.max(P.ammo,36);
      if(P.shield>before.shield)P.shield=Math.min(3,Math.max(2,P.shield));
      const durations={sneakers:9,magnet:10,freeze:8,golden:7};
      if(durations[P.timed]){P.timedMax=durations[P.timed];P.timedLeft=Math.max(P.timedLeft,P.timedMax)}
      const label=P.power!=='none'?D.powerInfo[P.power][0]:P.timed!=='none'?D.powerInfo[P.timed][0]:P.shield>before.shield?'Shield Egg':S.lives>before.lives?'Extra Life':P.roars>before.roars?'Mega Roar':'Power-up';
      if(D.game.toast)D.game.toast(`${label} collected — check the Power HUD`);
      if(!guideSeen){safeSet('dinoCatDashPowerGuideSeen',true);safeSet('dinoCatDashPowerGuideSeenV223',true);stopOldCutscene();openModal('powers',{first:true,returnMode:'play'})}
    }
    const oldCharges=Math.floor(before.stars/5),newCharges=Math.floor(stars/5);
    if(newCharges>oldCharges){P.roars=Math.min(3,P.roars+(newCharges-oldCharges));if(D.game.toast)D.game.toast('Five stars charged a Mega Roar');D.game.updateHud()}
    return collected;
  }

  function nearestHazard(){
    let best=null;
    for(const o of A.obstacles){const d=Math.abs(o.x-P.x);if(!best||d<best.d)best={d,type:o.type}}
    for(const e of A.enemies){const d=Math.abs(e.x-P.x);if(!best||d<best.d)best={d,type:e.type||'boss attack'}}
    return best?best.type:'hazard';
  }
  function applyRecovery(){
    recovery=2.2;P.inv=Math.max(P.inv,2.4);
    A.obstacles.splice(0,A.obstacles.length,...A.obstacles.filter(o=>o.x>P.x+330||o.x+o.w<P.x-50));
    A.enemies.splice(0,A.enemies.length,...A.enemies.filter(e=>e.x>P.x+350||e.x+e.w<P.x-60));
    if(D.game.toast)D.game.toast('Recovery shield — nearby hazards cleared');
    if(S.lives<=2&&D.audio&&D.audio.tone)D.audio.tone(150,.25,'sawtooth',.02,-30);
  }

  function applyBossAssist(dt){
    if(!S.boss)return;
    const firstAttempt=!safeGet(BOSS_WIN_KEY,false);
    if(firstAttempt&&!firstBossAssistApplied){firstBossAssistApplied=true;P.shield=Math.max(P.shield,1);P.roars=Math.max(P.roars,1);D.game.updateHud()}
    if(firstAttempt){if(S.boss.cool>0)S.boss.cool+=dt*.18;if(S.boss.windup>0)S.boss.windup+=dt*.12}
  }
  function updateBossHud(){
    if(!S.boss){bossHud.classList.add('hidden');lastBossHp=null;return}
    const b=S.boss;bossHud.classList.remove('hidden');bossHud.querySelector('div strong').textContent=`Phase ${b.phase} • ${Math.max(0,b.hp)} / ${b.maxHp}`;
    bossHud.querySelector('i b').style.width=`${100*Math.max(0,b.hp)/b.maxHp}%`;bossHud.querySelector('p').textContent=b.attackName||'Preparing mischief…';
    const next=b.phase===1?'Phase 2 at 28 HP':b.phase===2?'Phase 3 at 14 HP':'Final phase';bossHud.querySelector('em').textContent=next;
    if(lastBossHp!==null&&b.hp<lastBossHp){bossHud.classList.remove('hit');void bossHud.offsetWidth;bossHud.classList.add('hit')}
    if(b.phase!==lastBossPhase){lastBossPhase=b.phase;if(D.audio&&D.audio.tone)D.audio.tone(410,.18,'square',.02,90)}
    lastBossHp=b.hp;
  }

  function performanceTip(){
    const entries=Object.entries(damageByType).sort((a,b)=>b[1]-a[1]);
    if(entries.length){const [type,count]=entries[0],name=(obstacleMeta[type]&&obstacleMeta[type][0])||type;return `${name} caused ${count} hit${count===1?'':'s'}. Watch its warning and jump slightly earlier.`}
    if(S.stats.powers<2)return 'Collect more glowing power-ups. Shields and weapons make the later worlds much safer.';
    if(S.stats.maxCombo<4)return 'Follow star trails and chain clean jumps to build a larger score combo.';
    return 'Strong run. Use Mega Roar at phase changes to clear attacks and create a safe shooting window.';
  }
  function updateEndPanel(){
    const over=S.mode==='over';endPanel.classList.toggle('hidden',!over);if(!over)return;
    const approxJump=statValue('jumps')*100,smash=statValue('destroyed')*90,stars=statValue('stars')*160;
    endPanel.innerHTML=`<h3>Run Review</h3><div class="v3-score-breakdown"><div><span>Jump bonuses</span><strong>${approxJump.toLocaleString()}</strong></div><div><span>Obstacle bonuses</span><strong>${smash.toLocaleString()}</strong></div><div><span>Star bonuses</span><strong>${stars.toLocaleString()}</strong></div><div><span>Max combo</span><strong>x${S.stats.maxCombo||1}</strong></div></div><p><strong>Coach Rex:</strong> ${performanceTip()}</p>`;
  }

  function syncTools(){
    const mode=S.mode;
    menuTools.classList.toggle('hidden',!(mode==='menu'||mode==='pause'||mode==='over'));
    menuTools.querySelector('.v3-difficulty').classList.toggle('hidden',mode==='pause');
    menuTools.querySelector('#v3TrainingBtn').classList.toggle('hidden',mode==='pause'||mode==='over');
    menuTools.querySelector('#v3RestartWorldBtn').classList.toggle('hidden',mode!=='pause');
    const eligible=mode==='over'&&!continueUsed&&(difficulty==='easy'||statValue('stars')>=5);
    menuTools.querySelector('#v3ContinueBtn').classList.toggle('hidden',!eligible);
    modeBadge.textContent=practiceMode?`TRAINING: ${practiceMode.toUpperCase()} • EXIT IN PAUSE MENU`:`${profiles[difficulty].label.toUpperCase()} • ${Math.floor(runTime/60)}:${String(Math.floor(runTime%60)).padStart(2,'0')}`;
    modeBadge.classList.toggle('visible',mode==='play'||mode==='pause'||mode==='v3modal');
    document.querySelectorAll('[data-difficulty]').forEach(b=>b.classList.toggle('active',b.dataset.difficulty===difficulty));
    updateEndPanel();
  }

  const originalHit=D.hit;
  D.hit=(a,b)=>{
    const playerLike=x=>x&&Math.abs(Number(x.x)-(P.x+17))<3&&Math.abs(Number(x.w)-(P.w-28))<4;
    const itemPair=(a&&a.kind)||(b&&b.kind);
    if(!itemPair){
      const pad=profile().hitPad;
      if(playerLike(a))a={...a,x:a.x+pad,y:a.y+Math.max(2,pad-2),w:Math.max(4,a.w-pad*2),h:Math.max(4,a.h-pad*2)};
      if(playerLike(b))b={...b,x:b.x+pad,y:b.y+Math.max(2,pad-2),w:Math.max(4,b.w-pad*2),h:Math.max(4,b.h-pad*2)};
    }
    return originalHit(a,b);
  };

  const originalJump=D.game.jump;
  D.game.jump=()=>{
    if(S.mode!=='play')return;
    if(P.ground||coyote>0){originalJump();jumpHold=0;coyote=0;return}
    jumpBuffer=.13;
  };
  function beginJumpHold(){jumpHeld=true;jumpHold=0}
  function endJumpHold(){jumpHeld=false;if(P.vy<-360)P.vy*=.58}
  D.ui.jumpBtn.addEventListener('pointerdown',beginJumpHold,true);D.ui.jumpBtn.addEventListener('pointerup',endJumpHold,true);D.ui.jumpBtn.addEventListener('pointercancel',endJumpHold,true);
  D.canvas.addEventListener('pointerdown',beginJumpHold,true);D.canvas.addEventListener('pointerup',endJumpHold,true);D.canvas.addEventListener('pointercancel',endJumpHold,true);
  addEventListener('keydown',e=>{if((e.key===' '||e.key==='ArrowUp')&&!e.repeat)beginJumpHold()},true);
  addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowUp')endJumpHold()},true);

  const originalReset=D.game.reset;
  D.game.reset=()=>{
    runTime=0;castleTime=0;lastWorld=S.selectedWorld;continueUsed=false;damageByType={};lastHazardType='hazard';firstBossAssistApplied=false;bossGuideShown=false;lastBossHp=null;lastBossPhase=0;choiceTimer=28;activeChoice=null;seenObstacles={};patternIndex=[0,0,0,0,0];recovery=0;
    originalReset();
    S.lives=5;lastLives=5;practiceMode=pendingPractice;pendingPractice=null;
    if(practiceMode){S.v3Practice=practiceMode;modeBadge.classList.add('practice')}
    else{S.v3Practice=null;modeBadge.classList.remove('practice')}
    resetObjective();lastPowerCount=statValue('powers');lastStars=statValue('stars');D.game.updateHud();
    if(S.boss)setTimeout(()=>{stopOldCutscene();if(!bossGuideShown){bossGuideShown=true;openModal('boss',{returnMode:'play'})}},0);
  };

  const originalShowMenu=D.game.showMenu;
  D.game.showMenu=()=>{if(practiceMode)exitPractice();else originalShowMenu()};

  const originalUpdate=D.game.update;
  D.game.update=dt=>{
    const playing=S.mode==='play';
    if(playing){runTime+=dt;if(S.world===4&&!S.boss)castleTime+=dt;else if(S.world<4)castleTime=0}
    if(jumpBuffer>0)jumpBuffer-=dt;if(coyote>0)coyote-=dt;if(recovery>0)recovery-=dt;
    if(playing&&jumpHeld&&!P.ground&&P.vy<0&&jumpHold<.19){const extra=P.timed==='sneakers'?1500:1180;P.vy-=extra*dt;jumpHold+=dt}

    const gateBoss=playing&&Number(S.selectedWorld)!==4&&S.world===4&&!bossGateMet()&&S.score>=13499;
    const realScore=S.score;
    if(gateBoss)S.score=13499;
    const before={world:S.world,boss:!!S.boss,lives:S.lives,powers:statValue('powers'),stars:statValue('stars'),shield:P.shield,timed:P.timed,power:P.power,ammo:P.ammo,roars:P.roars};
    const obstacleBefore=new Map(A.obstacles.map(o=>[o,o.x]));
    const enemyBefore=new Map(A.enemies.map(e=>[e,e.x]));
    lastHazardType=nearestHazard();

    originalUpdate(dt);

    if(gateBoss){const earned=Math.max(0,S.score-13499);S.score=realScore+earned;D.game.updateHud()}
    stopOldCutscene();
    const factor=movementFactor();
    for(const [o,x] of obstacleBefore){if(A.obstacles.includes(o)){const moved=x-o.x;o.x=x-moved*factor;if(recovery>0)o.x+=moved*.25}}
    for(const [e,x] of enemyBefore){if(A.enemies.includes(e)){const moved=x-e.x;e.x=x-moved*factor;if(recovery>0)e.x+=moved*.25}}
    tuneNewObstacles();

    if(practiceMode==='powers'){
      A.obstacles.length=0;A.enemies.length=0;choiceTimer-=dt;if(choiceTimer<=0){spawnChoice();choiceTimer=7}
    }else if(playing&&!S.boss){choiceTimer-=dt;if(choiceTimer<=0)spawnChoice()}

    const collected=applyPowerBalance(before);manageChoice(collected);
    if(S.lives<before.lives){damageByType[lastHazardType]=(damageByType[lastHazardType]||0)+(before.lives-S.lives);applyRecovery()}
    lastLives=S.lives;lastPowerCount=statValue('powers');lastStars=statValue('stars');

    if(!P.ground&&P.y>=D.G-P.h-10&&P.vy>=0)coyote=.1;
    if(P.ground&&jumpBuffer>0){jumpBuffer=0;originalJump()}

    if(S.world!==before.world&&!S.boss){
      lastWorld=S.world;resetObjective();
      if(modalKind)queuedCheckpoint=S.world;else openModal('checkpoint',{world:S.world,returnMode:'play'});
    }

    if(!before.boss&&S.boss){
      firstBossAssistApplied=false;applyBossAssist(0);stopOldCutscene();
      if(!bossGuideShown){bossGuideShown=true;openModal('boss',{returnMode:'play'})}
    }
    applyBossAssist(dt);updateBossHud();
    if(before.boss&&!S.boss&&S.mode==='over'&&D.ui.title&&/Defeated/i.test(D.ui.title.textContent))safeSet(BOSS_WIN_KEY,true);

    if(practiceMode&&practiceSnapshot){S.high=practiceSnapshot.high;S.dailyBest=practiceSnapshot.dailyBest;safeSet('dinoCatDashHighScore',practiceSnapshot.high);safeSet('dinoCatDashDaily-'+S.dailyKey,practiceSnapshot.dailyBest)}
    if(practiceMode==='trees'){for(const o of A.obstacles){o.type='tree';o.w=62;o.h=120;o.y=D.G-120}}

    identifyUpcoming();updateObjectiveHud();syncTools();
    if(S.world===4&&!S.boss&&D.ui.world){const needTime=Math.max(0,Math.ceil(bossMinimumForStart()-runTime)),needCastle=Math.max(0,Math.ceil(profile().castleMin-castleTime));const wait=Math.max(needTime,needCastle);D.ui.world.textContent=wait?`Castle • ${wait}s to boss`:'Castle • Boss approaching'}
  };

  const originalDraw=D.render.draw;
  D.render.draw=()=>{
    originalDraw();
    const c=D.ctx;c.save();
    for(const o of A.obstacles){
      c.fillStyle='rgba(0,0,0,.24)';c.beginPath();c.ellipse(o.x+o.w/2,D.G+4,Math.max(24,o.w*.55),9,0,0,D.TAU);c.fill();
      c.strokeStyle='rgba(13,20,28,.72)';c.lineWidth=4;c.strokeRect(o.x-2,o.y-2,o.w+4,o.h+4);
      if((seenObstacles[o.type]||0)<=2&&o.x<D.W-70&&o.x>D.W-500){
        const name=(obstacleMeta[o.type]||[o.type])[0];c.font='900 16px system-ui';const w=c.measureText(name.toUpperCase()).width+22;c.fillStyle='rgba(7,12,25,.9)';c.fillRect(o.x+o.w/2-w/2,o.y-34,w,25);c.fillStyle='#fff';c.textAlign='center';c.fillText(name.toUpperCase(),o.x+o.w/2,o.y-16);c.textAlign='left';
      }
    }
    if(P.timed==='freeze'){c.fillStyle='rgba(110,225,255,.11)';c.fillRect(0,0,D.W,D.H);c.strokeStyle='rgba(180,246,255,.7)';c.lineWidth=3;c.strokeRect(5,5,D.W-10,D.H-10)}
    c.restore();syncTools();
  };

  setDifficulty(difficulty);resetObjective();syncTools();
  D.gameplayV3={version:VERSION,profiles,get difficulty(){return difficulty},setDifficulty,openPowerGuide:()=>openModal('powers',{returnMode:S.mode}),openObstacleGuide:()=>openModal('obstacles',{returnMode:S.mode}),get runTime(){return runTime},get castleTime(){return castleTime},bossGateMet,startPractice};
})();
