const zeroPad = (num, places) => String(num).padStart(places, '0')
var bpm_down = false
document.body.onkeyup = function(e) {
    if(e.key == "/" ||
        e.code == "Slash" ||
        e.keyCode == 47
    ){
        closeAll(true,false)
        showSearch();
    }
    
    if($("#search_bar").is(":focus"))
        return 
    
    if (e.key == "f" ||
        e.code == "KeyF" ||      
        e.keyCode == 70      
    ) {
        bpm_down = false
    }
    if (e.key == "c" ||
        e.code == "KeyC" ||   
        e.key == "t" ||
        e.code == "KeyT" ||   
        e.keyCode == 67      
    ) {
        toggle_cooldown_timer();
        send_cooldown_timer();
    }
    if (e.key == "h" ||
        e.code == "KeyH" ||      
        e.keyCode == 72      
    ) {
        toggle_hunt_timer();
        send_hunt_timer();
    }
    if (e.key == "q" ||
        e.code == "KeyQ" ||      
        e.keyCode == 81      
    ) {
        toggleFilterTools();
    }
    if (e.key == "r" ||
        e.code == "KeyR" ||      
        e.keyCode == 82      
    ) {
        bpm_clear();
        saveSettings();
    }
    if(e.key == "m" ||
        e.code == "keyM" ||
        e.keyCode == 77
    ){
        closeAll(true,false)
        showSideMenu('maps')
    }
    if(e.key == "g" ||
        e.code == "keyG" ||
        e.keyCode == 71
    ){
        closeAll(false, true)
        showSideMenu('wiki')
    }
    if(e.keyCode == 37){
        closeAll();
    }
}

document.body.onkeydown = function(e){
    if (!bpm_down && (e.key == "f" ||
        e.code == "KeyF" ||      
        e.keyCode == 70)      
    ) {
        bpm_down = true
        bpm_tap();
    }
    if (e.ctrlKey && e.shiftKey && (e.key == 'r' || e.code == "KeyR" || e.keyCode == 82)) {
        console.log("Force reloading...")
        force_reload()
    }
}

var timer_snd = []
var cooldown_worker;
var hunt_worker;
var count_direction = 0;
var map_size = 0;
var map_difficulty = 2;
const map_hunt_lengths = [0,25,45,75];

function updateMapSize(size){
    map_size = {"S":0,"M":1,"L":2,"XL":3}[size]
    document.getElementById("map_size_info").innerText = `${lang_data['{{map_size}}']}: ${lang_data[["{{small}}","{{medium}}","{{large}}","{{extra_large}}"][map_size]]}`
    draw_graph()
}

function updateMapDifficulty(difficulty){
    if (difficulty == '-1' || difficulty.match(/[A-K]{4}-[A-K]{4}-[A-K]{4}/g)){
        map_difficulty = parseInt(document.getElementById("cust_hunt_length").value)
    }
    else{
        map_difficulty = (difficulties[difficulty]??difficulties['3N']).hunt
    }
    document.getElementById("minute_hunt").innerHTML = zeroPad(Math.round(map_hunt_lengths[map_difficulty]/60),2)
    document.getElementById("second_hunt").innerHTML = zeroPad(Math.round(map_hunt_lengths[map_difficulty]) % 60,2)
    document.getElementsByClassName('hunt_size_label')[0].innerText = `${lang_data['{{hunt}}']}: ${["Off","Short","Medium","Long"][map_difficulty]}`
    draw_graph()
}

function toggleCountup(){
    count_direction = document.getElementById("timer_count_up").checked ? 1 : 0;
    document.getElementById('cooldownProgressBarInner').style.float = count_direction == 0 ? 'left' : 'right';
    document.getElementById('huntProgressBarInner').style.float = count_direction == 0 ? 'left' : 'right';
}

function toggle_cooldown_timer(force_start = false, force_stop = false){
    if(force_start){
        if($("#play_cooldown_button").hasClass("playing")){
            cooldown_worker.terminate();
            start_cooldown_timer();
        }
        else{
            $("#play_cooldown_button").addClass("playing")
            $("#play_cooldown_button_icon").attr('name','pause')
            start_cooldown_timer()
        }
    }

    else if(force_stop){
        if($("#play_cooldown_button").hasClass("playing")){
            $("#play_cooldown_button").removeClass("playing")
            $("#play_cooldown_button_icon").attr('name','play')
            cooldown_worker.terminate();
        }
        if(!muteTimerToggle){
            stop_sound = timer_snd[11].cloneNode()
            stop_sound.volume = volume
            stop_sound.play()
        }
    }

    else if($("#play_cooldown_button").hasClass("playing")){
        $("#play_cooldown_button").removeClass("playing")
        $("#play_cooldown_button_icon").attr('name','play')
        cooldown_worker.terminate();
        if(!muteTimerToggle){
            stop_sound = timer_snd[11].cloneNode()
            stop_sound.volume = volume
            stop_sound.play()
        }
    }
    else{
        $("#play_cooldown_button").addClass("playing")
        $("#play_cooldown_button_icon").attr('name','pause')
        start_cooldown_timer()
    }
}

function start_cooldown_timer(){
    if(!muteTimerToggle){
        start_sound = timer_snd[10].cloneNode()
        start_sound.volume = volume
        start_sound.play()
    }

    var time = 90 +1
    var prev_t = ""
    var snds_played = [0,0,0,0,0]

    var deadline = new Date(Date.now() + time *1000);
    var min_obj = document.getElementById("minute_cooldown")
    var sec_obj = document.getElementById("second_cooldown")
    var progress_bar = $('#cooldownProgressBar')
    var progress_bar_inner = document.getElementById('cooldownProgressBarInner')
    
    function progress() {
        var t = deadline - Date.now();
        var timeleft = Math.floor(t / 1000);

        var is_demon = timeleft <= 5;
        var is_split = document.getElementById("timer_split").checked

        if (count_direction == 1)
            t = (26*1000) - t

        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);

        if(!muteTimerCountdown){
            if (timeleft == 55){
                if(snds_played[0] == 0){
                    cur_sound = timer_snd[6].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[0] = 1
                    snds_played[4] = 0
                }
            }
            if (timeleft == 35){
                if(snds_played[0] == 0){
                    cur_sound = timer_snd[7].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[0] = 1
                    snds_played[4] = 0
                }
            }
            if (timeleft == 5){
                if(snds_played[0] == 0){
                    cur_sound = timer_snd[8].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[0] = 1
                    snds_played[4] = 0
                }
            }
        
            if (timeleft == 53 || timeleft == 33 || timeleft == 3){
                if(snds_played[1] == 0){
                    cur_sound = timer_snd[3].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[1] = 1
                    snds_played[0] = 0
                    snds_played[4] = 0
                }
            }
            if (timeleft == 52 || timeleft == 32 || timeleft == 2){
                if(snds_played[2] == 0){
                    cur_sound = timer_snd[2].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[2] = 1
                    snds_played[1] = 0
                }
            }
            if (timeleft == 51 || timeleft == 31 || timeleft == 1){
                if(snds_played[3] == 0){
                    cur_sound = timer_snd[1].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[3] = 1
                    snds_played[2] = 0
                }
            }
            if (timeleft == 50 || timeleft == 30 || timeleft == 0){
                if(snds_played[4] == 0){
                    cur_sound = timer_snd[0].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[4] = 1
                    snds_played[3] = 0
                }
            }
        }

        min_val = t<0 ? "00" : zeroPad(minutes,2);
        sec_val = t<0 ? "00" : zeroPad(seconds,2);
        d_val = `${min_val[1]}:${sec_val}`
        if(prev_t != d_val){

            send_timer_link("COOLDOWN_VAL",`${d_val}`,is_split && is_demon ? 1 : 0)

            min_obj.innerHTML = min_val
            sec_obj.innerHTML = sec_val

            var progressBarWidth = count_direction == 0 ? timeleft * progress_bar.width() / (time-1) : (25 - timeleft) * progress_bar.width() / (time-1);
            progress_bar_inner.style.width = progressBarWidth;

            prev_t = d_val
        }

        if(timeleft <= 0){
            cooldown_worker.terminate();
            $("#play_cooldown_button").removeClass("playing")
            $("#play_cooldown_button_icon").attr('name','play')
        }
    };

    const blob = new Blob([`(function(e){setInterval(function(){this.postMessage(null)},100)})()`])
    const url = window.URL.createObjectURL(blob)
    cooldown_worker = new Worker(url)
    cooldown_worker.onmessage = () => {
        progress()
    }
}

function toggle_hunt_timer(force_start = false, force_stop = false){
    if(force_start){
        if($("#play_hunt_button").hasClass("playing")){
            hunt_worker.terminate();
            start_hunt_timer();
        }
        else{
            $("#play_hunt_button").addClass("playing")
            $("#play_hunt_button_icon").attr('name','pause')
            start_hunt_timer()
        }
    }

    else if(force_stop){
        if($("#play_hunt_button").hasClass("playing")){
            $("#play_hunt_button").removeClass("playing")
            $("#play_hunt_button_icon").attr('name','play')
            hunt_worker.terminate();
        }
        if(!muteTimerToggle){
            stop_sound = timer_snd[11].cloneNode()
            stop_sound.volume = volume
            stop_sound.play()
        }
    }

    else if($("#play_hunt_button").hasClass("playing")){
        $("#play_hunt_button").removeClass("playing")
        $("#play_hunt_button_icon").attr('name','play')
        hunt_worker.terminate();
        if(!muteTimerToggle){
            stop_sound = timer_snd[11].cloneNode()
            stop_sound.volume = volume
            stop_sound.play()
        }
    }
    else{
        $("#play_hunt_button").addClass("playing")
        $("#play_hunt_button_icon").attr('name','pause')
        start_hunt_timer()
    }
}

function start_hunt_timer(){
    if(!muteTimerToggle){
        start_sound = timer_snd[10].cloneNode()
        start_sound.volume = volume
        start_sound.play()
    }

    var time = map_hunt_lengths[map_difficulty]+1;
    var prev_t = ""
    var snds_played = [0,0,0,0,0,0,0]

    var deadline = new Date(Date.now() + time *1000);
    var min_obj = document.getElementById("minute_hunt")
    var sec_obj = document.getElementById("second_hunt")
    var progress_bar = $('#huntProgressBar')
    var progress_bar_inner = document.getElementById('huntProgressBarInner')
    
    function progress() {
        var t = deadline - Date.now();
        var dt = t;
        var timeleft = Math.floor(t / 1000);
        if (count_direction == 1){
            t = ((map_hunt_lengths[map_difficulty]+1)*1000) - t
            dt = t
        }
        else{
            dt = t
        }

        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);
        var d_minutes = Math.floor((dt % (1000 * 60 * 60)) / (1000 * 60));
        var d_seconds = Math.floor((dt % (1000 * 60)) / 1000);

        if(!muteTimerCountdown){
            if (timeleft == 7){
                if(snds_played[0] == 0){
                    cur_sound = timer_snd[9].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[0] = 1
                    snds_played[6] = 0
                }
            }

            if (timeleft == 5){
                if(snds_played[1] == 0){
                    cur_sound = timer_snd[5].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[1] = 1
                    snds_played[0] = 0
                }
            }

            if (timeleft == 4){
                if(snds_played[2] == 0){
                    cur_sound = timer_snd[4].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[2] = 1
                    snds_played[1] = 0
                }
            }
        
            if (timeleft == 3){
                if(snds_played[3] == 0){
                    cur_sound = timer_snd[3].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[3] = 1
                    snds_played[2] = 0
                }
            }
            if (timeleft == 2){
                if(snds_played[4] == 0){
                    cur_sound = timer_snd[2].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[4] = 1
                    snds_played[3] = 0
                }
            }
            if (timeleft == 1){
                if(snds_played[5] == 0){
                    cur_sound = timer_snd[1].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[5] = 1
                    snds_played[4] = 0
                }
            }
            if (timeleft == 0){
                if(snds_played[6] == 0){
                    cur_sound = timer_snd[0].cloneNode()
                    cur_sound.volume = volume
                    cur_sound.play()
                    snds_played[6] = 1
                    snds_played[5] = 0
                    if(document.getElementById("timer_auto_start_cooldown").checked){
                        toggle_cooldown_timer(true,false)
                        toggle_hunt_timer(false,true)
                    }
                }
            }
        }

        min_val = t<0 ? "00" : zeroPad(minutes,2);
        sec_val = t<0 ? "00" : zeroPad(seconds,2);
        d_min_val = t<0 ? "00" : zeroPad(d_minutes,2);
        d_sec_val = t<0 ? "00" : zeroPad(d_seconds,2);
        d_val = `${d_min_val[1]}:${d_sec_val}`
        if(prev_t != d_val){

            send_timer_link("HUNT_VAL",`${d_val}`,0)

            min_obj.innerHTML = min_val
            sec_obj.innerHTML = sec_val

            var progressBarWidth = count_direction == 0 ? timeleft * progress_bar.width() / (time-1) : (map_hunt_lengths[map_difficulty] - timeleft) * progress_bar.width() / (time-1);
            progress_bar_inner.style.width = progressBarWidth;

            prev_t = d_val
        }

        if(timeleft <= 0){
            hunt_worker.terminate();
            $("#play_hunt_button").removeClass("playing")
            $("#play_hunt_button_icon").attr('name','play')
        }
    };

    const blob = new Blob([`(function(e){setInterval(function(){this.postMessage(null)},100)})()`])
    const url = window.URL.createObjectURL(blob)
    hunt_worker = new Worker(url)
    hunt_worker.onmessage = () => {
        progress()
    }
}