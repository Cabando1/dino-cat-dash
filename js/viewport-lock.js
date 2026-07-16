(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.state)return;

  const touchDevice=window.matchMedia('(hover: none) and (pointer: coarse)').matches||navigator.maxTouchPoints>0;
  if(!touchDevice)return;

  const root=document.documentElement;
  const body=document.body;
  const controls=document.querySelector('.controls');
  let locked=false;
  let savedScrollY=0;
  let pending=false;

  const isPlaying=()=>D.state.mode==='play';

  function revealControls(){
    if(!controls)return;
    const viewport=window.visualViewport;
    const viewportTop=viewport?viewport.offsetTop:0;
    const viewportHeight=viewport?viewport.height:window.innerHeight;
    const viewportBottom=viewportTop+viewportHeight-8;
    const rect=controls.getBoundingClientRect();

    if(rect.bottom>viewportBottom){
      window.scrollBy(0,rect.bottom-viewportBottom+4);
    }else if(rect.top<viewportTop){
      window.scrollBy(0,rect.top-viewportTop-4);
    }
  }

  function lockViewport(){
    if(locked||pending||!isPlaying())return;
    pending=true;
    requestAnimationFrame(()=>{
      if(!isPlaying()){pending=false;return}
      revealControls();
      requestAnimationFrame(()=>{
        pending=false;
        if(!isPlaying()||locked)return;
        savedScrollY=window.scrollY||window.pageYOffset||0;
        body.style.top=`-${savedScrollY}px`;
        root.classList.add('gameplay-locked');
        body.classList.add('gameplay-locked');
        locked=true;
      });
    });
  }

  function unlockViewport(){
    pending=false;
    if(!locked)return;
    root.classList.remove('gameplay-locked');
    body.classList.remove('gameplay-locked');
    body.style.top='';
    locked=false;
    window.scrollTo(0,savedScrollY);
  }

  function stopTouchScroll(event){
    if(locked&&event.cancelable)event.preventDefault();
  }

  document.addEventListener('touchmove',stopTouchScroll,{capture:true,passive:false});
  document.addEventListener('gesturestart',stopTouchScroll,{capture:true,passive:false});
  document.addEventListener('gesturechange',stopTouchScroll,{capture:true,passive:false});

  function monitor(){
    if(isPlaying())lockViewport();
    else unlockViewport();
    requestAnimationFrame(monitor);
  }

  addEventListener('pagehide',unlockViewport);
  requestAnimationFrame(monitor);
})();
