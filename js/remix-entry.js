(()=>{
'use strict';
function install(){
  const actions=document.querySelector('.menu-actions');
  if(!actions||document.getElementById('rexRemixEntry'))return;
  const button=document.createElement('button');
  button.id='rexRemixEntry';button.type='button';
  button.innerHTML='<span>Play Rex Remix</span><small>New illustrated prototype</small>';
  button.addEventListener('click',()=>{location.href='./remix/'});
  actions.appendChild(button);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
