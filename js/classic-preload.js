(()=>{
  'use strict';
  const D=window.Dino;
  if(!D||!D.store)return;
  for(const key of[
    'dinoCatDashPowerGuideSeen',
    'dinoCatDashPowerGuideSeenV223',
    'dinoCatDashPowerGuideSeenV3'
  ])D.store.set(key,true);
})();
