let songs = []; 
const GITHUB_USERNAME = "sachin35544"; 
const REPO_NAME = "my-spotify"; 

let myPlaylists = [{ name: "Liked Songs", songs: [], isLiked: true }];
let currentSongIndex = 0;
let isPlaying = false;
const audio = new Audio();

// DOM Elements
const playlistListUI = document.getElementById('playlist-list');
const playBtn = document.getElementById('play-btn');
const songModal = document.getElementById('playlist-modal');
const createModal = document.getElementById('create-playlist-modal');
const searchInput = document.getElementById('search-input');
const searchSection = document.getElementById('search-results-section');
const mainLibrary = document.getElementById('main-library-section');

async function loadSongsFromGitHub() {
    const url = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/songs.json`;
    try {
        const response = await fetch(`${url}?t=${new Date().getTime()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("File nahi mili");
        songs = await response.json();
        init(); 
    } catch (error) {
        console.error("Error loading songs:", error);
        songs = [{ id: 0, title: "Error Loading", cover: "", url: "" }];
        init();
    }
}

function init() {
    renderSongs();
    renderLibrary();
    if (songs.length > 0) loadSong(0, false);
    setupEventListeners();
}

// MULTI-GRID RENDER LOGIC
function renderSongs() {
    const grids = ['grid-latest', 'grid-nocopyright', 'grid-english', 'grid-hindi', 'grid-other'];
    grids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = "";
    });

    // 1. New to Old: Array ko reverse karo
    const sortedSongs = [...songs].reverse();

    sortedSongs.forEach((song) => {
        const originalIndex = songs.findIndex(s => s.id === song.id);
        
        // Card Banane ka template
        const createCard = () => {
            const card = document.createElement('div');
            card.className = 'card';
            if (originalIndex === currentSongIndex && isPlaying) card.classList.add('active-card');
            card.innerHTML = `<img src="${song.cover}"><h4>${song.title}</h4>`;
            card.onclick = () => loadSong(originalIndex);
            return card;
        };

        // A. Latest Section (Sare gaane aayenge reverse order mein)
        document.getElementById('grid-latest').appendChild(createCard());

        // B. Categorized Sections
        let targetId = "";
        if(song.category === "No Copyright") targetId = "grid-nocopyright";
        else if(song.category === "English") targetId = "grid-english";
        else if(song.category === "Hindi") targetId = "grid-hindi";
        else if(song.category === "Other") targetId = "grid-other";

        if(targetId) {
            document.getElementById(targetId).appendChild(createCard());
        }
    });
}

function renderLibrary() {
    playlistListUI.innerHTML = "";
    myPlaylists.forEach((list) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        const iconHTML = list.isLiked ? '<i data-lucide="heart"></i>' : '<i data-lucide="music-2"></i>';
        li.innerHTML = `<div class="playlist-icon ${list.isLiked ? 'liked-icon' : ''}">${iconHTML}</div>
            <div class="playlist-meta"><h4>${list.name}</h4><p>${list.songs.length} songs</p></div>`;
        playlistListUI.appendChild(li);
    });
    if (window.lucide) lucide.createIcons();
}

function setupEventListeners() {
    document.getElementById('create-playlist').onclick = () => createModal.style.display = "flex";
    document.getElementById('save-playlist-btn').onclick = () => {
        const nameInput = document.getElementById('new-playlist-name');
        if (nameInput.value.trim()) {
            myPlaylists.push({ name: nameInput.value, songs: [], isLiked: false });
            renderLibrary();
            createModal.style.display = "none";
            nameInput.value = "";
        }
    };
    document.getElementById('close-create-modal').onclick = () => createModal.style.display = "none";
    document.getElementById('open-modal-btn').onclick = () => {
        songModal.style.display = "flex";
        renderModalContent();
    };
    document.getElementById('close-modal').onclick = () => songModal.style.display = "none";
    document.getElementById('done-btn').onclick = () => songModal.style.display = "none";

    playBtn.onclick = () => isPlaying ? pauseSong() : playSong();
    document.getElementById('next-btn').onclick = () => loadSong((currentSongIndex + 1) % songs.length);
    document.getElementById('prev-btn').onclick = () => loadSong((currentSongIndex - 1 + songs.length) % songs.length);

    audio.ontimeupdate = () => {
        if (audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            document.getElementById('progress-bar').value = progress;
            document.getElementById('current-time').innerText = formatTime(audio.currentTime);
            document.getElementById('duration').innerText = formatTime(audio.duration);
        }
    };
    audio.onended = () => loadSong((currentSongIndex + 1) % songs.length);
    document.getElementById('progress-bar').oninput = (e) => audio.currentTime = (e.target.value / 100) * audio.duration;
    document.getElementById('volume-slider').oninput = (e) => audio.volume = e.target.value / 100;

    window.onclick = (e) => {
        if (e.target == songModal) songModal.style.display = "none";
        if (e.target == createModal) createModal.style.display = "none";
    };

    searchInput.oninput = (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query === "") {
            searchSection.style.display = "none";
            mainLibrary.style.display = "block";
            return;
        }
        const filtered = songs.filter(s => s.title.toLowerCase().includes(query));
        if (filtered.length > 0) {
            searchSection.style.display = "block";
            mainLibrary.style.display = "none";
            renderSpotifySearch(filtered);
        }
    };
}

function renderSpotifySearch(results) {
    const topResultDiv = document.getElementById('top-result-card');
    const listDiv = document.getElementById('search-songs-list');
    const top = results[0];
    const topIdx = songs.findIndex(s => s.id === top.id);
    topResultDiv.innerHTML = `<img src="${top.cover}" style="width: 100px; border-radius: 8px;">
        <h1 style="margin: 10px 0;">${top.title}</h1>
        <p style="color: #b3b3b3;">Song</p>`;
    topResultDiv.onclick = () => loadSong(topIdx);

    listDiv.innerHTML = "";
    results.slice(0, 4).forEach(song => {
        const idx = songs.findIndex(s => s.id === song.id);
        const row = document.createElement('div');
        row.className = 'search-row';
        row.style = "display: flex; align-items: center; padding: 10px; cursor: pointer; border-radius: 4px;";
        row.innerHTML = `<img src="${song.cover}" style="width: 40px; height: 40px; border-radius: 4px; margin-right: 15px;">
            <div><div style="font-weight: bold;">${song.title}</div></div>`;
        row.onclick = () => loadSong(idx);
        listDiv.appendChild(row);
    });
}

function loadSong(index, shouldPlay = true) {
    if (songs.length === 0) return;
    currentSongIndex = index;
    const song = songs[currentSongIndex];
    audio.src = song.url;
    document.getElementById('track-title').innerText = song.title;
    document.getElementById('current-album-art').src = song.cover;
    if (shouldPlay) playSong();
    renderSongs();
}

function playSong() { isPlaying = true; audio.play(); playBtn.innerHTML = '<i data-lucide="pause"></i>'; lucide.createIcons(); renderSongs(); }
function pauseSong() { isPlaying = false; audio.pause(); playBtn.innerHTML = '<i data-lucide="play"></i>'; lucide.createIcons(); renderSongs(); }
function formatTime(s) { const m = Math.floor(s/60), sec = Math.floor(s%60); return `${m}:${sec < 10 ? '0' : ''}${sec}`; }

loadSongsFromGitHub();