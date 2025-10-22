(function () {
  let spotifyToken = null;
  let spotifyDeviceId = null;
  let spotifyPlayer = null;
  let usingSpotify = false;

  // Insert a "Connect to Spotify" button in the header
  const userWidget = document.querySelector('.user-widget');
  const connectBtn = document.createElement('a');
  connectBtn.className = 'btn btn--primary';
  connectBtn.href = '/login';
  connectBtn.textContent = 'Connect to Spotify';
  if (userWidget) {
    userWidget.appendChild(connectBtn);
  }

  async function getToken() {
    try {
      const res = await fetch('/token');
      if (!res.ok) return null;
      const data = await res.json();
      return data.access_token;
    } catch (_) {
      return null;
    }
  }

  function loadSpotifySDK() {
    return new Promise((resolve, reject) => {
      if (window.Spotify) return resolve();
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.head.appendChild(script);
      window.onSpotifyWebPlaybackSDKReady = () => resolve();
      script.onerror = reject;
    });
  }

  async function apiFetch(method, url, body) {
    const token = await getToken();
    if (!token) throw new Error('No Spotify token');
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function createPlayer() {
    spotifyPlayer = new Spotify.Player({
      name: 'Web Player',
      getOAuthToken: async cb => {
        const t = await getToken();
        spotifyToken = t;
        cb(t);
      },
      volume: 0.7
    });

    spotifyPlayer.addListener('ready', ({ device_id }) => {
      spotifyDeviceId = device_id;
      transferPlayback(device_id).catch(console.error);
    });

    spotifyPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      updateUIFromState(state);
    });

    await spotifyPlayer.connect();
  }

  async function transferPlayback(deviceId) {
    await apiFetch('PUT', 'https://api.spotify.com/v1/me/player', { device_ids: [deviceId], play: false });
  }

  function msToTime(ms) {
    const total = Math.floor((ms || 0) / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updateProgress(position, duration) {
    const filled = document.getElementById('progress-filled');
    if (!filled || !duration) return;
    const pct = Math.max(0, Math.min(100, (position / duration) * 100));
    filled.style.width = `${pct}%`;
    const leftLabel = document.querySelector('.progress-bar-container .progress-time');
    if (leftLabel) leftLabel.textContent = msToTime(position);
    const rightLabel = document.getElementById('track-duration');
    if (rightLabel) rightLabel.textContent = msToTime(duration);
  }

  function updateUIFromState(state) {
    const track = state.track_window?.current_track;
    const isPlaying = !state.paused;
    const playIcon = document.querySelector('#play-pause-btn .play-icon');
    const pauseIcon = document.querySelector('#play-pause-btn .pause-icon');
    if (playIcon && pauseIcon) {
      if (isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    }
    if (track) {
      const cover = document.getElementById('current-track-cover');
      const name = document.getElementById('current-track-name');
      const artist = document.getElementById('current-track-artist');
      cover && (cover.src = track.album?.images?.[0]?.url || cover.src);
      name && (name.textContent = track.name || '');
      artist && (artist.textContent = (track.artists || []).map(a => a.name).join(', '));
      updateProgress(state.position, track.duration_ms);
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  async function loadSidebarPlaylists() {
    try {
      const data = await apiFetch('GET', 'https://api.spotify.com/v1/me/playlists?limit=50');
      const list = document.getElementById('playlist-list');
      if (!list) return;
      list.innerHTML = '';
      for (const p of data.items || []) {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'playlist-item';
        a.textContent = p.name;
        a.dataset.playlistId = p.id;
        a.addEventListener('click', async (e) => {
          e.preventDefault();
          await showPlaylist(p.id);
        });
        list.appendChild(a);
      }
    } catch (e) {
      console.warn('Failed to load playlists', e);
    }
  }

  async function showPlaylist(playlistId) {
    const home = document.getElementById('home-page');
    const plPage = document.getElementById('playlist-page');
    if (home && plPage) { home.classList.add('hidden'); plPage.classList.remove('hidden'); }

    const meta = await apiFetch('GET', `https://api.spotify.com/v1/playlists/${playlistId}`);
    const coverImg = document.getElementById('playlist-cover-img');
    const titleEl = document.getElementById('playlist-title');
    const descEl = document.getElementById('playlist-description');
    coverImg && (coverImg.src = meta.images?.[0]?.url || '');
    titleEl && (titleEl.textContent = meta.name || '');
    descEl && (descEl.textContent = meta.description || '');

    const tracksContainer = document.getElementById('playlist-tracks');
    if (tracksContainer) tracksContainer.innerHTML = '';
    for (const item of meta.tracks.items) {
      const track = item.track; if (!track) continue;
      const row = document.createElement('div');
      row.className = 'track-item';
      row.innerHTML = `
        <div class="track-number">•</div>
        <div class="track-info">
          <img class="track-cover" src="${(track.album.images?.[2]?.url || track.album.images?.[0]?.url) || ''}" alt="">
          <div class="track-details">
            <div class="track-title">${escapeHtml(track.name)}</div>
            <div class="track-artist">${(track.artists || []).map(a => escapeHtml(a.name)).join(', ')}</div>
          </div>
        </div>
        <div class="track-album">${escapeHtml(track.album?.name || '')}</div>
        <div class="track-duration">${msToTime(track.duration_ms)}</div>
        <button class="track-play-btn" title="Play">
          <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.287V1.713z"/>
          </svg>
        </button>
      `;
      row.querySelector('.track-play-btn')?.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopImmediatePropagation();
        await apiFetch('PUT', `https://api.spotify.com/v1/me/player/play`, { uris: [track.uri] });
      });
      tracksContainer?.appendChild(row);
    }

    const bigPlay = document.getElementById('playlist-play-btn');
    if (bigPlay) {
      const newNode = bigPlay.cloneNode(true);
      bigPlay.parentNode.replaceChild(newNode, bigPlay);
      newNode.addEventListener('click', async (e) => {
        e.preventDefault();
        await apiFetch('PUT', `https://api.spotify.com/v1/me/player/play`, { context_uri: `spotify:playlist:${playlistId}` });
      });
    }
  }

  function interceptClick(el, handler) {
    if (!el) return;
    el.addEventListener('click', async (e) => {
      if (!usingSpotify) return; // let local engine handle it
      e.preventDefault();
      e.stopImmediatePropagation();
      try { await handler(e); } catch (err) { console.error(err); }
    }, true); // capture phase to beat existing listeners
  }

  function hookControls() {
    const playPause = document.getElementById('play-pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('previous-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const progressBar = document.querySelector('.progress-bar');
    const volumeBar = document.querySelector('.volume-bar');
    const volumeFilled = document.getElementById('volume-filled');

    interceptClick(playPause, async () => {
      const playback = await apiFetch('GET', 'https://api.spotify.com/v1/me/player');
      if (playback && playback.is_playing) {
        await apiFetch('PUT', 'https://api.spotify.com/v1/me/player/pause');
      } else {
        await apiFetch('PUT', 'https://api.spotify.com/v1/me/player/play');
      }
    });

    interceptClick(nextBtn, async () => {
      await apiFetch('POST', 'https://api.spotify.com/v1/me/player/next');
    });

    interceptClick(prevBtn, async () => {
      await apiFetch('POST', 'https://api.spotify.com/v1/me/player/previous');
    });

    interceptClick(shuffleBtn, async () => {
      const playback = await apiFetch('GET', 'https://api.spotify.com/v1/me/player');
      const newState = !playback?.shuffle_state;
      await apiFetch('PUT', `https://api.spotify.com/v1/me/player/shuffle?state=${newState}`);
      shuffleBtn?.classList.toggle('active', newState);
    });

    interceptClick(repeatBtn, async () => {
      const playback = await apiFetch('GET', 'https://api.spotify.com/v1/me/player');
      const modeMap = { off: 'context', context: 'track', track: 'off' };
      const newMode = modeMap[playback?.repeat_state || 'off'];
      await apiFetch('PUT', `https://api.spotify.com/v1/me/player/repeat?state=${newMode}`);
      repeatBtn?.classList.toggle('active', newMode !== 'off');
    });

    if (progressBar) {
      progressBar.addEventListener('click', async (e) => {
        if (!usingSpotify) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const rect = progressBar.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const playback = await apiFetch('GET', 'https://api.spotify.com/v1/me/player');
        const duration = playback?.item?.duration_ms || 0;
        await apiFetch('PUT', `https://api.spotify.com/v1/me/player/seek?position_ms=${Math.floor(duration * ratio)}`);
      }, true);
    }

    if (volumeBar) {
      volumeBar.addEventListener('click', async (e) => {
        if (!usingSpotify) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const rect = volumeBar.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const vol = Math.floor(ratio * 100);
        await apiFetch('PUT', `https://api.spotify.com/v1/me/player/volume?volume_percent=${vol}`);
        if (volumeFilled) volumeFilled.style.width = `${vol}%`;
      }, true);
    }
  }

  async function bootstrap() {
    const token = await getToken();
    if (!token) {
      usingSpotify = false; // fallback to local engine with <audio>
      return;
    }
    spotifyToken = token;
    usingSpotify = true;
    if (connectBtn) {
      connectBtn.textContent = 'Spotify Connected';
      connectBtn.classList.remove('btn--primary');
      connectBtn.classList.add('btn--secondary');
      connectBtn.href = '#';
    }
    document.body.setAttribute('data-mode', 'spotify');
    await loadSpotifySDK();
    await createPlayer();
    hookControls();
    loadSidebarPlaylists().catch(console.warn);
  }

  bootstrap().catch(console.error);
})();
