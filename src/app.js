'use strict';

(() => {
  const names = {
    adults: 'Adults 18+',
    parents: 'Parents',
    students: 'Students 18+',
    employees: 'Employees 18+',
  };
  const audio = Object.fromEntries(Object.keys(names).map(id => {
    const preview = new Audio(`/assets/${id}.mp3`);
    preview.preload = 'none';
    return [id, preview];
  }));
  const buttons = document.querySelectorAll('[data-preview]');
  const cards = document.querySelectorAll('[data-program]');
  const toggle = document.querySelector('#audio-toggle');
  const hint = document.querySelector('#audio-hint');
  const status = document.querySelector('#audio-status');
  const hero = document.querySelector('#hero-video');
  const main = document.querySelector('#main');
  const heroUnmute = document.querySelector('#hero-unmute');
  const heroUnmuteLabel = document.querySelector('#hero-unmute-label');
  const heroControls = document.querySelector('#hero-controls');
  const heroPlayToggle = document.querySelector('#hero-play-toggle');
  const heroSoundToggle = document.querySelector('#hero-sound-toggle');
  let enabled = false;
  let active = null;
  let timer = null;
  let generation = 0;
  let sequence = null;
  let sequenceIndex = -1;
  let sequenceTimer = null;
  let sequenceAudio = false;
  let singleTileAudio = false;
  let audioPlaying = false;
  let heroMutedAfterSequence = true;
  let heroWasPlayingBeforeHide = false;

  function refreshTileVisibility() {
    if (!hero || !main || !Number.isFinite(hero.duration)) return;
    const revealAt = Math.max(hero.duration - 1.5, 0);
    main.classList.toggle('tiles-hidden', hero.currentTime < revealAt);
    refreshHero();
  }

  function announce(text) {
    if (status) status.textContent = text;
  }

  function refreshHero() {
    if (!hero || !heroUnmute) return;
    const tilesVisible = !main?.classList.contains('tiles-hidden');
    const mutedPlaying = hero.muted && !hero.paused;
    heroPlayToggle.hidden = !hero.paused;
    heroSoundToggle.hidden = tilesVisible || mutedPlaying;
    heroUnmute.hidden = !mutedPlaying;
    const label = hero.paused ? 'Play video with sound' : 'Unmute video';
    heroUnmuteLabel.textContent = label;
    heroUnmute.setAttribute('aria-label', `${label} and enable audio previews`);
    heroPlayToggle.dataset.playing = String(!hero.paused);
    heroPlayToggle.setAttribute('aria-label', hero.paused ? 'Play video' : 'Pause video');
    heroPlayToggle.title = hero.paused ? 'Play video' : 'Pause video';
    heroSoundToggle.dataset.muted = String(hero.muted);
    heroSoundToggle.setAttribute('aria-label', hero.muted ? 'Unmute video' : 'Mute video');
    heroSoundToggle.title = hero.muted ? 'Unmute video' : 'Mute video';
  }

  function refresh() {
    buttons.forEach(button => {
      const playing = button.dataset.preview === active && audioPlaying;
      button.setAttribute('aria-pressed', String(playing));
      if (button.classList.contains('listen-button')) {
        button.textContent = playing ? 'Stop audio preview' : 'Listen to program preview';
      } else {
        button.setAttribute('aria-label', `${playing ? 'Stop' : 'Play'} ${names[button.dataset.preview]} audio preview`);
      }
    });
    cards.forEach(card => card.classList.toggle('is-playing', card.dataset.program === active));
    refreshHero();
  }

  function cancelHover() {
    clearTimeout(timer);
    timer = null;
  }

  function stop(preserveSequence = false) {
    cancelHover();
    clearTimeout(sequenceTimer);
    sequenceTimer = null;
    generation++;
    if (!preserveSequence) {
      sequence = null;
      sequenceIndex = -1;
      sequenceAudio = false;
      singleTileAudio = false;
    }
    Object.values(audio).forEach(preview => {
      preview.pause();
      preview.currentTime = 0;
    });
    active = null;
    audioPlaying = false;
    refresh();
    announce('');
  }

  function showSilentFallback(id) {
    announce(`${names[id]} audio could not play. Showing its tile silently for 5 seconds.`);
    if (sequenceTimer !== null) return;
    audioPlaying = false;
    refresh();
    sequenceTimer = setTimeout(() => {
      sequenceTimer = null;
      if (active !== id) return;
      if (sequence) {
        if (singleTileAudio) {
          singleTileAudio = false;
          sequenceAudio = false;
        }
        advanceProgramSequence();
      } else stop();
    }, 5000);
  }

  function showMutedTile(id) {
    stop(true);
    if (hero) hero.muted = true;
    active = id;
    audioPlaying = false;
    refresh();
    announce(`${names[id]} audio muted.`);
  }

  function scrollProgramToStart(id) {
    if (!window.matchMedia('(max-width: 600px)').matches) return;
    const card = [...cards].find(item => item.dataset.program === id);
    const grid = card?.parentElement;
    if (!card || !grid) return;
    grid.scrollTo({
      left: grid.scrollLeft + card.getBoundingClientRect().left - grid.getBoundingClientRect().left,
      behavior: 'smooth',
    });
  }

  function advanceProgramSequence() {
    if (!sequence) return;
    sequenceIndex++;
    if (sequenceIndex >= sequence.length) {
      const firstTile = sequence[0];
      const restartMuted = heroMutedAfterSequence;
      sequence = null;
      sequenceIndex = -1;
      sequenceAudio = false;
      stop();
      heroMutedAfterSequence = true;
      scrollProgramToStart(firstTile);
      void restartHero(restartMuted);
      announce('Program previews finished.');
      return;
    }
    const id = sequence[sequenceIndex];
    scrollProgramToStart(id);
    if (sequenceAudio) {
      void play(id, true);
    } else {
      showMutedTile(id);
      sequenceTimer = setTimeout(() => {
        sequenceTimer = null;
        if (active === id) advanceProgramSequence();
      }, 5000);
    }
  }

  function orderedProgramIds() {
    return [...cards]
      .sort((left, right) => Number(getComputedStyle(left).order) - Number(getComputedStyle(right).order))
      .map(card => card.dataset.program);
  }

  function startTileSequence(id, playAudio, playOnlyThisTile = false) {
    if (!sequence) sequence = orderedProgramIds();
    const index = sequence.indexOf(id);
    if (index < 0) return false;
    sequenceAudio = playAudio;
    singleTileAudio = playAudio && playOnlyThisTile;
    heroMutedAfterSequence = !playAudio;
    sequenceIndex = index - 1;
    stop(true);
    if (hero) hero.muted = true;
    advanceProgramSequence();
    return true;
  }

  function startProgramSequence(playAudio = false) {
    sequence = orderedProgramIds();
    sequenceIndex = -1;
    sequenceAudio = playAudio;
    singleTileAudio = false;
    heroMutedAfterSequence = hero?.muted ?? true;
    if (hero) hero.muted = true;
    advanceProgramSequence();
  }

  function startTileAudioSequence() {
    if (!sequence || sequenceAudio) return false;
    return startTileSequence(sequence[0], true);
  }

  async function play(id, preserveSequence = false) {
    stop(preserveSequence);
    const token = generation;
    // Keep the cinematic video moving, but give the preview exclusive use of sound.
    if (hero) hero.muted = true;
    active = id;
    audioPlaying = true;
    refresh();
    try {
      await audio[id].play();
      // stop() already cancels old playback. A stale promise must not pause a newer one.
      if (generation !== token) return;
      announce(`${names[id]} preview playing.`);
    } catch {
      if (generation !== token) return;
      audioPlaying = false;
      refresh();
      showSilentFallback(id);
    }
  }

  function setEnabled(value) {
    enabled = value;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(value));
      toggle.textContent = value ? 'Mute audio previews' : 'Enable audio previews';
    }
    if (hint) hint.textContent = value ? 'Hover a program to listen. Move away to stop.' : 'Unmute the video or enable previews, then hover a program.';
    if (!value) stop();
  }

  async function restartHero(muted) {
    if (!hero) return;
    stop();
    hero.currentTime = 0;
    hero.muted = muted;
    try {
      await hero.play();
    } catch {
      if (!muted) {
        hero.muted = true;
        try {
          await hero.play();
        } catch {
          announce('The video could not play. Use the play button to try again.');
        }
      } else announce('The video could not play. Use the play button to try again.');
    }
    refreshHero();
  }

  function resetPlaybackToStart() {
    if (!hero) return;
    stop();
    heroWasPlayingBeforeHide = false;
    hero.currentTime = 0;
    heroMutedAfterSequence = false;
    main?.classList.add('tiles-hidden');
    scrollProgramToStart(orderedProgramIds()[0]);
    refreshTileVisibility();
    void restartHero(false);
  }

  toggle?.addEventListener('click', () => {
    setEnabled(!enabled);
    announce(enabled ? 'Hover audio enabled.' : 'Audio previews muted.');
  });

  buttons.forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.preview;
    if (active === id && audioPlaying) {
      startTileSequence(id, false);
      return;
    }
    setEnabled(true);
    if (sequence) startTileSequence(id, true, true);
    else void play(id);
  }));

  cards.forEach(card => {
    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !enabled) return;
      cancelHover();
      timer = setTimeout(() => void play(card.dataset.program), 400);
    });
    card.addEventListener('pointerleave', event => {
      // Touch pointers leave on finger-up; keep an explicitly tapped preview playing.
      if (event.pointerType !== 'mouse') return;
      cancelHover();
      if (active === card.dataset.program) stop();
    });
    card.addEventListener('focusout', event => {
      if (card.contains(event.relatedTarget)) return;
      cancelHover();
      if (active === card.dataset.program) stop();
    });
    card.querySelector('.card-link')?.addEventListener('click', stop);
  });

  Object.entries(audio).forEach(([id, preview]) => {
    preview.addEventListener('ended', () => {
      if (active !== id) return;
      if (sequence) {
        if (sequenceAudio) {
          if (singleTileAudio) {
            singleTileAudio = false;
            sequenceAudio = false;
          }
          advanceProgramSequence();
        }
        return;
      }
      stop();
      announce('Audio preview finished.');
    });
    preview.addEventListener('error', () => {
      if (active !== id) return;
      showSilentFallback(id);
    });
  });

  if (hero && heroUnmute) {
    main?.classList.add('tiles-hidden');
    hero.autoplay = false;
    const mobileHeroQuery = window.matchMedia('(max-width: 600px)');

    function updateHeroSource() {
      const source = mobileHeroQuery.matches ? '/assets/Mobile%20Hero.mp4' : '/assets/hero.mp4';
      if (hero.getAttribute('src') === source) return;
      hero.src = source;
      hero.load();
    }

    updateHeroSource();
    mobileHeroQuery.addEventListener('change', () => {
      const wasPlaying = !hero.paused;
      updateHeroSource();
      if (wasPlaying) void hero.play().catch(refreshHero);
    });

    async function unmuteHero() {
      const moveFocus = document.activeElement === heroUnmute;
      setEnabled(true);
      if (startTileAudioSequence()) return;
      await restartHero(false);
      if (moveFocus && heroUnmute.hidden) heroSoundToggle.focus({ preventScroll: true });
    }

    async function autoplayHeroMuted() {
      hero.currentTime = 0;
      hero.muted = true;
      try {
        await hero.play();
      } catch {
        refreshHero();
      }
      refreshHero();
    }

    heroUnmute.addEventListener('click', () => void unmuteHero());
    heroSoundToggle.addEventListener('click', () => {
      if (hero.muted) void unmuteHero();
      else {
        hero.muted = true;
        refreshHero();
      }
    });
    heroPlayToggle.addEventListener('click', () => {
      if (hero.paused) {
        setEnabled(true);
        void restartHero(false);
      } else resetPlaybackToStart();
    });
    hero.addEventListener('play', () => {
      if (!hero.muted) stop();
      refreshTileVisibility();
      refreshHero();
    });
    hero.addEventListener('pause', refreshHero);
    hero.addEventListener('ended', () => {
      heroWasPlayingBeforeHide = false;
      refreshTileVisibility();
      startProgramSequence(!hero.muted);
      refreshHero();
    });
    hero.addEventListener('loadedmetadata', refreshTileVisibility);
    hero.addEventListener('timeupdate', refreshTileVisibility);
    hero.addEventListener('volumechange', () => {
      if (!hero.muted && (active !== null || timer !== null)) stop();
      refreshHero();
    });

    // Native controls remain available if JavaScript is unavailable.
    hero.controls = false;
    heroControls.hidden = false;
    refreshHero();
    void autoplayHeroMuted();
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') stop();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      heroWasPlayingBeforeHide = Boolean(hero && !hero.paused && !hero.ended);
      return;
    }
    const shouldResume = heroWasPlayingBeforeHide;
    heroWasPlayingBeforeHide = false;
    if (shouldResume && hero?.paused && !hero.ended && active === null) {
      void hero.play().catch(refreshHero);
    }
    refreshHero();
  });
  window.addEventListener('pagehide', stop);
})();
