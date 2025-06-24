console.log("Let start");
let currentSong = new Audio;
let songs;
let flag = false;
let currFolder;

async function getsongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    //show songs in lib section
    let p = document.querySelector(".lib").getElementsByTagName("ul")[0];
    p.innerHTML = "";
    for (const song of songs) {
        p.innerHTML = p.innerHTML + `<li>
                            <div class="sname">    
                                <img src="/assets/images/music.svg" alt="">
                                <p class="songName">
                                    ${song.replaceAll("%20", " ")}
                                </p>
                            </div>
                            <img class="pp" src="/assets/images/play.svg" alt="">
                        </li>`
    }

    //Added Event listener to every song
    Array.from(document.querySelector(".lib").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playSong(e.querySelector(".songName").innerHTML.trim());
        })
    })
}

function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
        return '0:00';
    }
    const totalSeconds = Math.round(seconds);  // Round to nearest second
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function setOnEndHandler() {
    currentSong.onended = () => {
        if (flag) {
            let currentTrack = currentSong.src.split("/").slice(-1)[0];
            let index = songs.indexOf(currentTrack);
            if (index + 1 < songs.length) {
                playSong(songs[index + 1]);
            } else {
                play.src = "/assets/images/play.svg";
            }
        } else {
            play.src = "/assets/images/play.svg";
        }
    };
}


const playSong = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    currentSong.loop = false;
    setOnEndHandler();
    if (!pause) {
        currentSong.play();
        if (!currentSong.paused) {
            play.src = "/assets/images/pause.svg";
        }
    }
    document.querySelector(".disName").innerHTML = decodeURI(track);
    document.querySelector(".time").innerHTML = "00:00 / 00:00";
}

async function displayAlbums(){
    let a= await fetch("songs/");
    let response= await a.text();
    let div=document.createElement("div");
    div.innerHTML=response;
    let anc = div.getElementsByTagName("a");
    let array= Array.from(anc);
    for (let i = 0; i < array.length; i++) {
        const e = array[i];
        if(e.href.includes("/songs")){
            let folder;
            let part = e.getAttribute('href').replaceAll("\\", "/").split("/songs/");
            if(part.length >1 && part[1]){
                folder=part[1].slice(0, -1);
            }
            if (!folder) continue;
            //geting meta data
            try {
                const res = await fetch(`/songs/${folder}/info.json`);
                if (!res.ok) {
                    console.warn(`Could not fetch info.json for folder: ${folder}`);
                    continue;
                }
                const metadata = await res.json();
                document.querySelector(".cards").innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <img src="/songs/${folder}/cover.jpg" alt="COVER">
                        <h3>${metadata.title}</h3>
                        <p>${metadata.discription}</p>
                    </div>`;
            } catch (error) {
                console.error(`Error loading metadata for folder ${folder}`, error);
            }
        }
    }
}



async function main() {
    await getsongs(`songs/Badshah`);
    playSong(songs[0], true);

    //display all the albums
    await displayAlbums();

    //load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            //playSong(songs[0]); //if want auto play
        })
    })

    //Add Event Listener to play button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "/assets/images/pause.svg";
        }
        else {
            currentSong.pause();
            play.src = "/assets/images/play.svg";
        }
    })

    //keyboard play pause
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();

            if (currentSong.paused) {
                currentSong.play();
                play.src = "/assets/images/pause.svg";
            } else {
                currentSong.pause();
                play.src = "/assets/images/play.svg";
            }
        }
    })

    //prev and next event
    prev.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split(`/${currFolder}/`)[1]);
        if (index > 0) {
            playSong(songs[index - 1]);
        }
        else {
            currentSong.currentTime = 0;
        }
    })
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split(`/${currFolder}/`)[1]);
        if (index < songs.length - 1) {
            playSong(songs[index + 1]);
        }
    })

    replay.addEventListener("click", () => {
        currentSong.currentTime = 0;
    })


    //Current time and duration and move seekbar
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".time").innerHTML = formatTime(currentSong.currentTime) + " / " + formatTime(currentSong.duration);
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 99 + "%";
    })

    //seekbar Event Listener
    document.querySelector(".seekBar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    })

    //Add Event listener to volume
    document.querySelector(".vol").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    })

    //mute
    mute.addEventListener("click", () => {
        let volSlider = document.querySelector(".vol").getElementsByTagName("input")[0];

        if (currentSong.volume == 0) {
            currentSong.volume = 0.1;
            volSlider.value = 10;
            mute.src = "/assets/images/volume.svg";
        } else {
            currentSong.volume = 0;
            volSlider.value = 0;
            mute.src = "/assets/images/mute.svg";
        }
    })

    //hamburger add event
    ham.addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    })

    clo.addEventListener("click", () => {
        document.querySelector(".left").style.left = -100 + "%";
    })

    //autoplay toggle
    toggle.addEventListener("click", () => {
        const isAutoplayOn = toggle.src.includes("autoplay.svg") && !toggle.src.includes("autoplayoff");

        if (isAutoplayOn) {
            toggle.src = "/assets/images/autoplayoff.svg";
            flag = false;
        } else {
            toggle.src = "/assets/images/autoplay.svg";
            flag = true;
        }
    })
}

main()