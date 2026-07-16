(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.ui||!D.game||!D.render)return;

  const META={
    jungle:{name:'Jungle Rex',description:'Green explorer with a red bandana and drifting leaf trail.',tag:'Classic adventurer',trail:'#79f0a1'},
    ocean:{name:'Ocean Rex',description:'Bright blue Rex with a yellow bandana and an animated bubble trail.',tag:'Blue body + bubbles',trail:'#65e6ff'},
    sunset:{name:'Sunset Rex',description:'Orange Rex with a purple bandana and glowing sunset sparks.',tag:'Orange body + sparks',trail:'#ff9b55'}
  };

  const panel=D.ui.overlay.querySelector('.panel');
  if(!panel)return;

  const preview=document.createElement('section');
  preview.id='rexPreviewCard';
  preview.className='rex-preview-card';
  preview.innerHTML='<canvas id="rexPreview" width="420" height="150" aria-label="Selected Rex preview"></canvas><div class="rex-preview-copy"><strong id="rexPreviewName">Jungle Rex</strong><span id="rexPreviewDescription"></span><em id="rexPreviewTag"></em></div>';
  panel.insertBefore(preview,D.ui.menuStats);

  const hint=document.createElement('div');
  hint.id='setupHint';
  hint.className='setup-hint hidden';
  hint.textContent='Change Rex style or starting world below, then select Play Selected Setup.';
  D.ui.results.insertAdjacentElement('afterend',hint);

  const badge=document.createElement('div');
  badge.id='skinBadge';
  badge.className='skin-badge';
  badge.innerHTML='<i></i><span></span>';
  document.querySelector('.stage').appendChild(badge);

  const canvas=document.getElementById('rexPreview');
  const ctx=canvas.getContext('2d');
  const nameEl=document.getElementById('rexPreviewName');
  const descEl=document.getElementById('rexPreviewDescription');
  const tagEl=document.getElementById('rexPreviewTag');
  const pickerLabel=D.ui.skinPicker.querySelector('span');
  if(pickerLabel)pickerLabel.textContent='Choose Rex style:';

  document.querySelectorAll('.skin').forEach(btn=>{
    const skin=D.skins[btn.dataset.skin];
    if(!skin)return;
    const label=btn.textContent.trim();
    btn.innerHTML=`<i class="skin-swatch" style="background:${skin.body}"></i><span>${label}</span>`;
  });

  function roundedRect(x,y,w,h,r){
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }

  function drawPreview(ms=0){
    const key=D.state.skin in META?D.state.skin:'jungle';
    const skin=D.skins[key],meta=META[key],t=ms/1000;
    const grad=ctx.createLinearGradient(0,0,420,150);
    if(key==='ocean'){grad.addColorStop(0,'#073a62');grad.addColorStop(1,'#46c9db')}
    else if(key==='sunset'){grad.addColorStop(0,'#5f315f');grad.addColorStop(.55,'#df724e');grad.addColorStop(1,'#ffd178')}
    else{grad.addColorStop(0,'#173f31');grad.addColorStop(1,'#7bcf76')}
    ctx.clearRect(0,0,420,150);ctx.fillStyle=grad;roundedRect(0,0,420,150,16);ctx.fill();

    if(key==='ocean'){
      ctx.strokeStyle='rgba(220,250,255,.65)';ctx.lineWidth=2;
      for(let i=0;i<7;i++){const x=28+i*57+Math.sin(t+i)*8,y=25+(i%3)*38+Math.sin(t*1.6+i)*5;ctx.beginPath();ctx.arc(x,y,5+(i%3)*3,0,Math.PI*2);ctx.stroke()}
    }else if(key==='sunset'){
      ctx.fillStyle='rgba(255,226,116,.85)';ctx.beginPath();ctx.arc(352,35,25,0,Math.PI*2);ctx.fill();
      for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#ffd76c':'#b46cff';ctx.fillRect(20+i*48,112+Math.sin(t*3+i)*8,5,5)}
    }else{
      ctx.fillStyle='rgba(26,92,52,.55)';for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(24+i*55,118+Math.sin(t*2+i)*5,13,6,.4,0,Math.PI*2);ctx.fill()}
    }

    ctx.save();ctx.translate(122,30+Math.sin(t*2)*2);ctx.scale(1.35,1.35);
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(26,48);ctx.quadraticCurveTo(-18,30,-48,50);ctx.quadraticCurveTo(-8,62,34,66);ctx.closePath();ctx.fill();
    ctx.fillStyle=skin.body;ctx.beginPath();ctx.ellipse(46,52,43,34,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=skin.belly;ctx.beginPath();ctx.ellipse(57,60,23,22,.18,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=skin.stripe;ctx.lineWidth=6;ctx.lineCap='round';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(23+i*14,25+i*2);ctx.lineTo(31+i*14,37+i*3);ctx.stroke()}
    const step=Math.sin(t*7)*5;drawLeg(29,73,step,skin);drawLeg(62,73,-step,skin);
    ctx.fillStyle=skin.body;roundedRect(63,14,34,50,13);ctx.fill();ctx.beginPath();ctx.ellipse(92,25,36,27,0,0,Math.PI*2);ctx.fill();roundedRect(87,25,45,22,9);ctx.fill();
    ctx.fillStyle=skin.dark;ctx.beginPath();ctx.moveTo(92,44);ctx.lineTo(130,44);ctx.lineTo(119,57);ctx.lineTo(91,52);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(98+i*8,44);ctx.lineTo(102+i*8,51);ctx.lineTo(106+i*8,44);ctx.fill()}
    ctx.beginPath();ctx.ellipse(102,19,9,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#172018';ctx.beginPath();ctx.arc(106,20,3.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=skin.bandana;ctx.beginPath();ctx.moveTo(68,43);ctx.lineTo(89,49);ctx.lineTo(69,56);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(71,51);ctx.lineTo(58,60);ctx.lineTo(68,48);ctx.fill();
    ctx.restore();

    ctx.fillStyle='rgba(7,12,23,.62)';roundedRect(285,96,116,35,18);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 14px system-ui';ctx.textAlign='center';ctx.fillText(meta.name.toUpperCase(),343,119);
    requestAnimationFrame(drawPreview);
  }

  function drawLeg(x,y,step,skin){ctx.save();ctx.translate(x,y);ctx.rotate(step*.02);ctx.fillStyle=skin.body;roundedRect(-7,0,17,25,7);ctx.fill();ctx.fillStyle=skin.dark;roundedRect(-10,20,26,10,5);ctx.fill();ctx.restore()}

  function updateSkinUi(announce=false){
    const key=D.state.skin in META?D.state.skin:'jungle',meta=META[key],skin=D.skins[key];
    nameEl.textContent=meta.name;descEl.textContent=meta.description;tagEl.textContent=meta.tag;
    badge.querySelector('i').style.background=skin.body;badge.querySelector('span').textContent=meta.name;
    document.querySelectorAll('.skin').forEach(btn=>btn.classList.toggle('active',btn.dataset.skin===key));
    if(announce&&D.game.toast)D.game.toast(`${meta.name} selected`);
  }

  const originalSetSkin=D.game.setSkin;
  D.game.setSkin=name=>{originalSetSkin(name);updateSkinUi(true)};

  function syncOverlay(){
    const resultsVisible=D.state.mode==='over'&&!D.ui.results.classList.contains('hidden')&&D.ui.achievements.classList.contains('hidden');
    const mainMenu=D.state.mode==='menu'&&D.state.menuMode==='main';
    preview.classList.toggle('hidden',!(resultsVisible||mainMenu));
    hint.classList.toggle('hidden',!resultsVisible);
    if(resultsVisible){
      D.ui.skinPicker.classList.remove('hidden');
      D.ui.worldPicker.classList.remove('hidden');
      if(D.ui.startBtn.textContent!=='Play Selected Setup')D.ui.startBtn.textContent='Play Selected Setup';
      const replayMessage='Change Rex style or starting world below, then play again.';
      if(D.ui.message.textContent!==replayMessage)D.ui.message.textContent=replayMessage;
    }
    badge.classList.toggle('visible',D.state.mode==='play'||D.state.mode==='pause');
  }

  const originalDraw=D.render.draw;
  D.render.draw=()=>{
    originalDraw();
    const c=D.ctx,p=D.player,key=D.state.skin,t=D.state.time;
    c.save();
    if(key==='ocean'){
      c.strokeStyle='rgba(170,244,255,.8)';c.lineWidth=2;
      for(let i=0;i<4;i++){c.beginPath();c.arc(p.x-5-i*16,p.y+28+(i%2)*22+Math.sin(t*5+i)*5,5+i,0,D.TAU);c.stroke()}
    }else if(key==='sunset'){
      for(let i=0;i<5;i++){c.fillStyle=i%2?'#ffbc59':'#a96cff';c.fillRect(p.x-8-i*15,p.y+36+Math.sin(t*7+i)*12,5,5)}
    }else{
      c.fillStyle='rgba(114,232,130,.72)';for(let i=0;i<4;i++){c.beginPath();c.ellipse(p.x-4-i*17,p.y+45+Math.sin(t*5+i)*10,6,3,.45,0,D.TAU);c.fill()}
    }
    c.restore();
    syncOverlay();
  };

  updateSkinUi(false);syncOverlay();requestAnimationFrame(drawPreview);
})();
