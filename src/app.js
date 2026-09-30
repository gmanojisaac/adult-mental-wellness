'use strict';
(() => {
  const ids=['adults','parents','students','employees'];
  const names={adults:'Adults',parents:'Parents',students:'Students',employees:'Employees'};
  const audio=Object.fromEntries(ids.map(id=>{const a=new Audio(`/assets/${id}.mp3`);a.preload='none';return [id,a]}));
  const toggle=document.querySelector('#audio-toggle');
  const hint=document.querySelector('#audio-hint');
  const status=document.querySelector('#audio-status');
  const hero=document.querySelector('#hero-video');
  let enabled=false, active=null, timer=null, generation=0;
  const announce=text=>{if(status)status.textContent=text};
  function refresh(){document.querySelectorAll('[data-preview]').forEach(b=>{const playing=b.dataset.preview===active;b.setAttribute('aria-pressed',String(playing));if(b.classList.contains('listen-button'))b.textContent=playing?'Stop audio preview':'Listen to program preview';else b.setAttribute('aria-label',`${playing?'Stop':'Play'} ${names[b.dataset.preview]} audio preview`)});document.querySelectorAll('[data-program]').forEach(c=>c.classList.toggle('is-playing',c.dataset.program===active));}
  function stop(){clearTimeout(timer);timer=null;generation++;ids.forEach(id=>{audio[id].pause();audio[id].currentTime=0});active=null;refresh();}
  async function play(id){stop();const token=generation;hero?.pause();active=id;refresh();try{await audio[id].play();if(generation!==token){audio[id].pause();audio[id].currentTime=0;return}announce(`${names[id]} preview playing.`)}catch{if(generation===token){active=null;refresh();announce('Audio could not play. Try the speaker button.');if(hint)hint.textContent='Tap a card’s speaker to play its preview.'}}}
  function setEnabled(value){enabled=value;if(toggle){toggle.setAttribute('aria-pressed',String(value));toggle.textContent=value?'Mute audio previews':'Enable audio previews'}if(hint)hint.textContent=value?'Hover over a card to hear its description.':'Or tap a card’s speaker to listen.';if(!value)stop();}
  toggle?.addEventListener('click',()=>{setEnabled(!enabled);announce(enabled?'Hover audio enabled.':'Audio previews muted.')});
  document.querySelectorAll('[data-preview]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.preview;if(active===id){stop();return}setEnabled(true);void play(id)}));
  document.querySelectorAll('[data-program]').forEach(card=>{
    const schedule=()=>{if(!enabled)return;clearTimeout(timer);timer=setTimeout(()=>void play(card.dataset.program),400)};
    card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')schedule()});
    card.addEventListener('pointerleave',()=>{clearTimeout(timer);if(active===card.dataset.program)stop()});
    card.querySelector('.card-link').addEventListener('focus',schedule);
    card.addEventListener('focusout',e=>{if(!card.contains(e.relatedTarget)){clearTimeout(timer);if(active===card.dataset.program)stop()}});
    card.querySelector('.card-link').addEventListener('click',stop);
  });
  ids.forEach(id=>{audio[id].addEventListener('ended',()=>{if(active===id){active=null;refresh();announce('Audio preview finished.')}});audio[id].addEventListener('error',()=>{if(active===id){stop();announce('The audio preview is unavailable. The description is shown on the card.')}})});
  hero?.addEventListener('play',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();hero?.pause()}});
  window.addEventListener('pagehide',stop);
})();
