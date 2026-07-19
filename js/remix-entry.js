(()=>{
'use strict';
const scriptBase=new URL('.',document.currentScript.src);
function loadClassicPolish(){
  if(document.querySelector('script[data-classic-polish]'))return;
  const script=document.createElement('script');
  script.dataset.classicPolish='true';
  script.src=new URL('classic-boss-cat-polish.js?v=3.1.1',scriptBase).href;
  script.async=false;
  document.head.appendChild(script);
}
function install(){
  loadClassicPolish();
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
