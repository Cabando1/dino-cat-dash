(()=>{'use strict';
const D=window.Dino,S=D.state;
D.canvas=D.$('game');D.ctx=D.canvas.getContext('2d');
D.ui={score:D.$('score'),high:D.$('high'),lives:D.$('lives'),world:D.$('world'),power:D.$('power'),combo:D.$('combo'),missionText:D.$('missionText'),missionBar:D.$('missionBar'),timerText:D.$('timerText'),timerBar:D.$('timerBar'),overlay:D.$('overlay'),kicker:D.$('kicker'),title:D.$('title'),message:D.$('message'),menuStats:D.$('menuStats'),menuHigh:D.$('menuHigh'),achievementTotal:D.$('achievementTotal'),bestCombo:D.$('bestCombo'),dailyBest:D.$('dailyBest'),skinPicker:D.$('skinPicker'),worldPicker:D.$('worldPicker'),results:D.$('results'),achievements:D.$('achievements'),toast:D.$('toast'),startBtn:D.$('startBtn'),achievementsBtn:D.$('achievementsBtn'),jumpBtn:D.$('jumpBtn'),shootBtn:D.$('shootBtn'),roarBtn:D.$('roarBtn'),pauseBtn:D.$('pauseBtn'),soundBtn:D.$('soundBtn'),musicBtn:D.$('musicBtn')};
function press(fn){return e=>{e.preventDefault();D.audio.init();fn()}}
D.ui.startBtn.addEventListener('click',press(()=>S.mode==='pause'?D.game.pause():D.game.reset()));
D.ui.achievementsBtn.addEventListener('click',press(()=>S.mode==='pause'?D.game.showMenu():D.game.showAchievements()));
D.ui.jumpBtn.addEventListener('pointerdown',press(()=>D.game.jump()));
D.ui.shootBtn.addEventListener('pointerdown',press(()=>D.game.shoot()));
D.ui.roarBtn.addEventListener('pointerdown',press(()=>D.game.megaRoar()));
D.ui.pauseBtn.addEventListener('click',press(()=>D.game.pause()));
D.ui.soundBtn.addEventListener('click',press(()=>D.game.toggleSound()));
D.ui.musicBtn.addEventListener('click',press(()=>D.game.toggleMusic()));
D.canvas.addEventListener('pointerdown',press(()=>D.game.jump()));
document.querySelectorAll('.world-choice').forEach(btn=>btn.addEventListener('click',press(()=>D.game.setWorld(btn.dataset.world))));
document.querySelectorAll('.skin').forEach(btn=>btn.addEventListener('click',press(()=>D.game.setSkin(btn.dataset.skin))));
addEventListener('keydown',e=>{const k=e.key;if(k===' '||k==='ArrowUp'){e.preventDefault();D.game.jump()}else if(k==='f'||k==='F'||k==='x'||k==='X')D.game.shoot();else if(k==='r'||k==='R')D.game.megaRoar();else if(k==='p'||k==='P'||k==='Escape')D.game.pause();else if(k==='Enter'&&(S.mode==='menu'||S.mode==='over'))D.game.reset()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.mode==='play')D.game.pause()});
D.game.setSkin(S.skin);D.game.updateMenuStats();D.game.updateHud();D.game.showMenu();
function loop(ms){const dt=Math.min(.033,(ms-S.last)/1000||0);S.last=ms;D.game.update(dt);D.render.draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
})();
