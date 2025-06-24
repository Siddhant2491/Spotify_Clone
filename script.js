console.log("Let start");

let currentSong = new Audio();
let songs = [];
let flag = false;
let currFolder = "";

// Declare DOM elements
let play, prev, next, replay, mute, ham, clo, toggle;

async function getsongs(folder) {
    currFolder = folder;
    let a = await fetch(`${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let element of as) {
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Show songs in library section
    let p = document.querySelector(".lib ul");
    p.innerHTML = "";
    for (const song of songs) {
        p.innerHTML += `
            <li>
                <div class="sname">    
                    <img src="/Spotify_Clone/assets/images/music.svg" alt="">
                    <p class="songName">${song.replaceAll("%20", " ")}</p>
                </div>
                <img class="pp" src="/Spotify_Clone/assets/images/play.svg" alt="">
            </li>`;
    }

    // Add click events
    document.querySelectorAll(".lib li").forEach(e => {
        e.addEventListener("click", () => {
            playSong(e.querySelector(".songName").textContent.trim());
        });
    });
}

function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return "0:00";
    const total = Math.round(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function setOnEndHandler() {
    currentSong.onended = () => {
        const index = songs.indexOf(currentSong.src.split(`/${currFolder}/`)[1]);
        if (flag && index + 1 < songs.length) {
            playSong(songs[index + 1]);
        } else {
            play.src = "/Spotify_Clone/assets/images/play.svg";
        }
    };
}

function playSong(track, pause = false) {
    currentSong.src = `/${currFolder}/` + track;
    currentSong.loop = false;
    setOnEndHandler();
    if (!pause) {
        currentSong.play();
        play.src = "/Spotify_Clone/assets/images/pause.svg";
    }
    document.querySelector(".disName").textContent = decodeURI(track);
    document.querySelector(".time").textContent = "00:00 / 00:00";
}

async function displayAlbums() {
    const a = await fetch("/Spotify_Clone/songs/");
    const response = await a.text();
    const div = document.createElement("div");
    div.innerHTML = response;
    const links = Array.from(div.getElementsByTagName("a"));

    for (const e of links) {
        if (!e.href.includes("/songs")) continue;

        const part = e.getAttribute("href").replaceAll("\\", "/").split("/songs/");
        const folder = part[1]?.slice(0, -1);
        if (!folder) continue;

        try {
            const res = await fetch(`/Spotify_Clone/songs/${folder}/info.json`);
            if (!res.ok) continue;
            const metadata = await res.json();
            document.querySelector(".cards").innerHTML += `
                <div data-folder="${folder}" class="card">
                    <img src="/Spotify_Clone/songs/${folder}/cover.jpg" alt="COVER">
                    <h3>${metadata.title}</h3>
                    <p>${metadata.discription}</p>
                </div>`;
        } catch (err) {
            console.error(`Error loading metadata for ${folder}`, err);
        }
    }
}

function bindControls() {
    // Play / Pause
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "/Spotify_Clone/assets/images/pause.svg";
        } else {
            currentSong.pause();
            play.src = "/Spotify_Clone/assets/images/play.svg";
        }
    });

    // Keyboard control
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            play.click();
        }
    });

    prev.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split(`/${currFolder}/`)[1]);
        if (index > 0) playSong(songs[index - 1]);
        else currentSong.currentTime = 0;
    });

    next.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split(`/${currFolder}/`)[1]);
        if (index < songs.length - 1) playSong(songs[index + 1]);
    });

    replay.addEventListener("click", () => {
        currentSong.currentTime = 0;
    });

    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".time").textContent =
                `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
            document.querySelector(".circle").style.left =
                (currentSong.currentTime / currentSong.duration) * 99 + "%";
        }
    });

    document.querySelector(".seekBar").addEventListener("click", (e) => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width);
        currentSong.currentTime = percent * currentSong.duration;
    });

    document.querySelector(".vol input").addEventListener("input", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    mute.addEventListener("click", () => {
        const volSlider = document.querySelector(".vol input");
        if (currentSong.volume === 0) {
            currentSong.volume = 0.1;
            volSlider.value = 10;
            mute.src = "/Spotify_Clone/assets/images/volume.svg";
        } else {
            currentSong.volume = 0;
            volSlider.value = 0;
            mute.src = "/Spotify_Clone/assets/images/mute.svg";
        }
    });

    ham.addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    });

    clo.addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    toggle.addEventListener("click", () => {
        const autoplayOn = toggle.src.includes("autoplay.svg") && !toggle.src.includes("autoplayoff");
        toggle.src = autoplayOn
            ? "/Spotify_Clone/assets/images/autoplayoff.svg"
            : "/Spotify_Clone/assets/images/autoplay.svg";
        flag = !autoplayOn;
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await getsongs(`Spotify_Clone/songs/Badshah`);
    playSong(songs[0], true);
    await displayAlbums();
    bindControls();

    // Bind click on cards
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            await getsongs(`Spotify_Clone/songs/${card.dataset.folder}`);
            // playSong(songs[0]); // if you want autoplay on click
        });
    });
});
