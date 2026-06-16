function getCookie(e){let t=e+"=",i=decodeURIComponent(document.cookie).split(";");for(let n=0;n<i.length;n++){let o=i[n];for(;" "==o.charAt(0);)o=o.substring(1);if(0==o.indexOf(t))return o.substring(t.length,o.length)}return""}
function setCookie(e,t,i){let n=new Date;n.setTime(n.getTime()+864e5*i);let o="expires="+n.toUTCString();document.cookie=e+"="+t+";"+o+";path=/"}

const all_speed = ["Normal","Fast"]
const all_los_speed = ["Slow","Normal","Medium","Fast"]
const all_holy_water = ["Normal","Long"]

let all_evidence = {}
let all_ghosts = {}
let all_maps = {}
let bpm_list = []
let bpm_los_list = []

var state = {"evidence":{},"speed":"-","los_speed":"-","holy_water":"-","candle_interaction":"-","rem_interaction":"-","light_interaction":"-","radio_interaction":"-","ghosts":{},"map":"ravenwood","map_size":"M"}
var user_settings = {"num_evidences":"3N","volume":50,"mute_broadcast":0,"mute_timer_toggle":0,"mute_timer_countdown":0,"timer_count_up":0,"timer_split":1,"adaptive_evidence":0,"hide_descriptions":0,"layout":0,"hide_sanity_speed":0,"offset":0.0,"bpm_type":0,"bpm":0,"domo_side":0,"priority_sort":0,"map":"ravenwood","theme":"Default","keep_alive":0,"disable_particles":0,"show_event_maps":0,"voice_prefix":0}

let znid = getCookie("tos_znid")

let hasLink = false;
let hasDLLink = false;
let markedDead = false;
let polled = false;
let filter_locked = false;
let voice_prefix = false;
let wakeLock = null;

let auto_select_timeout = null
let last_guessed = null

let touchStartX = 0
let touchStartY = 0
let touchMap = false
let tabOpen = false

function waitForElementById(id){
    let wait_for_element = () => {
        const c = document.getElementById(id)
        if(!c){
            return setTimeout(wait_for_element, 50)
        }
        else{
            return c
        }
    }
    return wait_for_element()
}

function showMenu(){
    mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
    var is_c = ["-5","-1"].includes(document.getElementById("num_evidence").value) || document.getElementById("num_evidence").value.match(/[0-9]{4}-[0-9]{4}-[0-9]{4}/g)
    if(mquery.matches){
        if(is_c)
            $("#domovoi").addClass("domovoi-custom")
        $("#domovoi").removeClass("domovoi-menu-hidden")
        document.getElementById("menu").style.marginBottom = "-8px";
    }
}

function toggleFilterTools(){
    if($('#tools-content').is(':visible')){
        $('#show_tool_button').attr('onclick',"toggleFilterTools();showMenu();")
        $('#show_tool_button').addClass('filter_tool_button_back')
        $('#show_tool_button').removeClass('filter_tool_button_live')
        $('#show_filter_button').attr('onclick',"showMenu()")
        $('#show_filter_button').addClass('filter_tool_button_live')
        $('#show_filter_button').removeClass('filter_tool_button_back')
        $('#tools-content').removeClass('spin_show')
        $('#tools-content').addClass('spin_hide')
        setTimeout(function(){
            $('#tools-content').toggle()
            $('#tools-content').removeClass('spin_hide')
            $('#filter-content').addClass('spin_show')
            $('#filter-content').toggle()
        },150)
    }
    else{
        $('#show_tool_button').attr('onclick',"showMenu()")
        $('#show_tool_button').addClass('filter_tool_button_live')
        $('#show_tool_button').removeClass('filter_tool_button_back')
        $('#show_filter_button').attr('onclick',"toggleFilterTools();showMenu();")
        $('#show_filter_button').addClass('filter_tool_button_back')
        $('#show_filter_button').removeClass('filter_tool_button_live')
        $('#filter-content').removeClass('spin_show')
        $('#filter-content').addClass('spin_hide')
        setTimeout(function(){
            $('#filter-content').toggle()
            $('#filter-content').removeClass('spin_hide')
            $('#tools-content').addClass('spin_show')
            $('#tools-content').toggle()
            draw_graph(false)
        },150)
    }
}

function dualstate(elem,ignore_link=false,radio=false){
    var checkbox = $(elem).find("#checkbox");
    var siblings = $(elem).siblings()

    if (checkbox.hasClass("disabled")){
        return;
    }

    if (checkbox.hasClass("neutral")){
        checkbox.removeClass("neutral")
        checkbox.addClass("good")
        if(radio){
            for(var i=0;i<siblings.length;i++){
                $(siblings[i]).find("#checkbox").removeClass("good")
                $(siblings[i]).find("#checkbox").addClass("neutral")
            }
        }
    }
    else if (checkbox.hasClass("good")){
        checkbox.removeClass("good")
        checkbox.addClass("neutral")
    }

    if(!ignore_link){filter(ignore_link)}
}

function tristate(elem,ignore_link=false){
    var checkbox = $(elem).find("#checkbox");
    var label = $(elem).find(".label");
    var id  = $(elem).attr("id")

    if (checkbox.hasClass("disabled") || checkbox.hasClass("block")){
        return;
    }

    if (checkbox.hasClass("neutral")){
        checkbox.removeClass("neutral")
        checkbox.addClass("good")
    }
    else if (checkbox.hasClass("good")){
        checkbox.removeClass("good")
        checkbox.addClass("bad")
        label.addClass("strike")
    }
    else if (checkbox.hasClass("bad")){
        checkbox.removeClass("bad")
        label.removeClass("strike")
        checkbox.addClass("neutral")
    }

    if(!ignore_link){filter(ignore_link)}
}

function quadstate(elem,ignore_link=false){
    var checkbox = $(elem).find("#checkbox");
    var label = $(elem).find(".label");
    var id  = $(elem).attr("id")

    if (checkbox.hasClass("disabled") || checkbox.hasClass("block")){
        return;
    }

    if (checkbox.hasClass("neutral")){
        checkbox.removeClass("neutral")
        checkbox.addClass("good")
    }
    else if (checkbox.hasClass("good")){
        checkbox.removeClass("good")
        checkbox.addClass("maybe")
    }
    else if (checkbox.hasClass("maybe")){
        checkbox.removeClass("maybe")
        checkbox.addClass("bad")
        label.addClass("strike")
    }
    else if (checkbox.hasClass("bad")){
        checkbox.removeClass("bad")
        label.removeClass("strike")
        checkbox.addClass("neutral")
    }

    if(!ignore_link){filter(ignore_link)}
}

function toggleCoal(force_on = false, force_off = false, ignore_link=false){

    if(force_off){
        $('#coal-icon').removeClass('coal-active')
        $('#coal-icon').attr("src","imgs/coal-w.png")
        $('#coal-icon-2').removeClass('coal-active')
        $('#coal-icon-2').attr("src","imgs/coal-w.png")
        coal = 0
        return
    }

    if(!$("#coal-icon").hasClass("coal-active") || force_on){
        $('#coal-icon').addClass('coal-active')
        $('#coal-icon').attr("src","imgs/coal-b.png")
        $('#coal-icon-2').addClass('coal-active')
        $('#coal-icon-2').attr("src","imgs/coal-b.png")
        coal = 1
    }
    else{
        $('#coal-icon').removeClass('coal-active')
        $('#coal-icon').attr("src","imgs/coal-w.png")
        $('#coal-icon-2').removeClass('coal-active')
        $('#coal-icon-2').attr("src","imgs/coal-w.png")
        coal = 0
    }

    send_modifier_link()

    if(!ignore_link){filter(ignore_link)}
}

function toggleForestMinion(value, reset=false, force_off = false, ignore_link=false){

    if(force_off){
        $('#forest-minion-icon').removeClass('forest-minion-active')
        $('#forest-minion-icon').attr("src","imgs/minion-w.png")
        $('#forest-minion-icon-2').removeClass('forest-minion-active')
        $('#forest-minion-icon-2').attr("src","imgs/minion-w.png")
        forest_minion = 0
        $("#forest-minion-mod").text(forest_minion)
        $("#forest-minion-mod-2").text(forest_minion)
        return
    }

    let cur_val = reset ? 0 : parseInt($("#forest-minion-mod").text())
    forest_minion = Math.max(Math.min(cur_val + value, 8),-8)
    $("#forest-minion-mod").text(forest_minion)
    $("#forest-minion-mod-2").text(forest_minion)

    if (forest_minion == 0){
        $('#forest-minion-icon').removeClass('forest-minion-active')
        $('#forest-minion-icon').attr("src","imgs/minion-w.png")
        $('#forest-minion-icon-2').removeClass('forest-minion-active')
        $('#forest-minion-icon-2').attr("src","imgs/minion-w.png")
    }
    else{
        $('#forest-minion-icon').addClass('forest-minion-active')
        $('#forest-minion-icon').attr("src","imgs/minion-y.png")
        $('#forest-minion-icon-2').addClass('forest-minion-active')
        $('#forest-minion-icon-2').attr("src","imgs/minion-y.png")
    }

    send_modifier_link()

    if(!ignore_link){filter(ignore_link)}
}

let particleCanvas, particleCtx, bloodMoonParticles = [];
let bloodMoonRunning = false;
let bloodMoonAnimFrame;
const PARTICLE_COUNT = 60;

function toggleBloodMoon(force_on = false, force_off = false, ignore_link = false) {
    const icon1 = $('#blood-moon-icon');
    const icon2 = $('#blood-moon-icon-2');
    const isActive = icon1.hasClass('blood-moon-active');

    if (force_off || (isActive && !force_on)) {
        icon1.removeClass('blood-moon-active').attr("src", "imgs/moon-w.png");
        icon2.removeClass('blood-moon-active').attr("src", "imgs/moon-w.png");
        $("#blood-moon-effect-top").removeClass("blood-moon-effect-top");
        $("#blood-moon-effect-top").removeClass("blood-moon-effect-top-anim");
        $("#blood-moon-effect-bottom").removeClass("blood-moon-effect-bottom");
        $("#blood-moon-effect-bottom").removeClass("blood-moon-effect-bottom-anim");
        stopBloodMoonParticles();
        blood_moon = 0;
    } else {
        icon1.addClass('blood-moon-active').attr("src", "imgs/moon-r.png");
        icon2.addClass('blood-moon-active').attr("src", "imgs/moon-r.png");
        $("#blood-moon-effect-top").addClass("blood-moon-effect-top");
        $("#blood-moon-effect-bottom").addClass("blood-moon-effect-bottom");
        if (!document.getElementById("disable_particles").checked){
            $("#blood-moon-effect-top").addClass("blood-moon-effect-top-anim");
            $("#blood-moon-effect-bottom").addClass("blood-moon-effect-bottom-anim");
        }
        startBloodMoonParticles();
        blood_moon = 1;
    }

    send_modifier_link()

    if (!ignore_link) filter(ignore_link);
}

function startBloodMoonParticles() {
    if (!$('#blood-moon-icon').hasClass('blood-moon-active'))
        return;

    stopBloodMoonParticles();

    const disableParticles = document.getElementById("disable_particles")?.checked;
    const top = $("#blood-moon-effect-top");
    const bottom = $("#blood-moon-effect-bottom");

    // toggle pulse
    if (disableParticles) {
        top.removeClass("blood-moon-effect-top-anim");
        bottom.removeClass("blood-moon-effect-bottom-anim");
        return;
    } else {
        if (!top.hasClass("blood-moon-effect-top-anim")) {
            top.addClass("blood-moon-effect-top-anim");
            bottom.addClass("blood-moon-effect-bottom-anim");
        }
    }

    particleCanvas = document.getElementById('particle-canvas');
    particleCtx = particleCanvas.getContext('2d');

    function resizeCanvas() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const h = particleCanvas.height;

    bloodMoonParticles = Array.from({ length: PARTICLE_COUNT }, () => {
        const up = Math.random() > 0.5; // 50% go up, 50% go down
        const yStart = up ? h : 0; // start bottom or top
        return {
            x: Math.random() * particleCanvas.width,
            y: yStart,
            baseY: yStart,
            vy: (Math.random() * 0.3 + 0.15) * (up ? -1 : 1),
            size: Math.random() * 2 + 2,
            color: Math.random() < 0.5 ? 'rgb(160, 0, 0)' : 'rgb(40, 40, 40)',
            life: Math.random() * 2 + 2, // seconds
            age: 0,
            up
        };
    });

    bloodMoonRunning = true;
    animateBloodMoonParticles(performance.now());
}

function animateBloodMoonParticles(lastTime) {
    if (!bloodMoonRunning) return;

    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    const ctx = particleCtx;
    const w = particleCanvas.width;
    const h = particleCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const travel = h * 0.3;

    for (const p of bloodMoonParticles) {
        
        p.age += delta;
        const progress = p.age / p.life;
        const alpha = 1 - progress; // fade out

        // move within travel distance
        p.y = p.baseY + travel * progress * (p.up ? -1 : 1);

        ctx.beginPath();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (progress >= 1) {
            // reset particle
            p.x = Math.random() * w;
            p.baseY = p.up ? h : 0;
            p.y = p.baseY;
            p.life = Math.random() * 2 + 4;
            p.age = Math.random() * p.life;
            p.size = Math.random() * 2 + 2;
            p.color = Math.random() < 0.5 ? 'rgb(160, 0, 0)' : 'rgb(40, 40, 40)';
        }
    }

    ctx.globalAlpha = 1;
    bloodMoonAnimFrame = requestAnimationFrame(() => animateBloodMoonParticles(now));
}

function stopBloodMoonParticles() {
    bloodMoonRunning = false;
    if (bloodMoonAnimFrame) cancelAnimationFrame(bloodMoonAnimFrame);

    const top = $("#blood-moon-effect-top");
    const bottom = $("#blood-moon-effect-bottom");
    top.removeClass("blood-moon-effect-top-anim");
    bottom.removeClass("blood-moon-effect-bottom-anim");

    if (particleCtx) {
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    }
}

function select(elem,ignore_link=false,internal=false){
    if ($(elem).hasClass("faded")){
        fade(elem,ignore_link)
    }

    var on = $(elem).hasClass("selected")
    var switch_type = $(elem).hasClass("died")

    for (const [key, value] of Object.entries(state["ghosts"])){ 
        if(value == 2 || value == -2){
            state['ghosts'][key] = 1
            $(document.getElementById(key)).removeClass(["died","selected"])
        }
    }

    if (on){
        $(elem).removeClass(["selected"]);
        if (!ignore_link || internal) markedDead = false
        state["ghosts"][elem.id] = 1;
    }
    else{
        $(elem).removeClass(["died","guessed","permhidden"])
        $(elem).addClass("selected");
        if (!ignore_link || internal) markedDead = false
        state["ghosts"][elem.id] = 2;
    }
    setCookie("tos_state",JSON.stringify(state),1)
    if(!ignore_link){filter(ignore_link)}

    if(polled && !ignore_link){resetResetButton()}
}

function guess(elem,ignore_link=false,internal=false){
    if ($(elem).hasClass("faded")){
        fade(elem,ignore_link)
    }

    var on = false
    if (!ignore_link || internal){

        on = $(elem).hasClass("guessed")

        for (const [key, value] of Object.entries(state["ghosts"])){ 
            if(value == 3){
                state['ghosts'][key] = 1
                $(document.getElementById(key)).removeClass(["guessed","preguessed"])
            }
        }
    }

    if (on){
        $(elem).removeClass("guessed");
        state["ghosts"][elem.id] = 1;
        send_guess("")
    }
    else{
        clearTimeout(auto_select_timeout)
        last_guessed = null
        $(elem).removeClass(["selected","died","permhidden","preguessed"])
        $(elem).addClass("guessed");
        state["ghosts"][elem.id] = 3;
        send_guess(elem.id)
    }
    setCookie("tos_state",JSON.stringify(state),1)
    if(!ignore_link){filter(ignore_link)}
}

function died(elem,ignore_link=false,internal=false){
    if ($(elem).hasClass("faded")){
        fade(elem,ignore_link)
    }

    var on = $(elem).hasClass("died")
    var switch_type = $(elem).hasClass("selected")

    for (const [key, value] of Object.entries(state["ghosts"])){ 
        if(value == 2 || value == -2){
            state['ghosts'][key] = 1
            $(document.getElementById(key)).removeClass(["died","selected"])
        }
    }

    if (on){
        $(elem).removeClass(["selected","died"]);
        if (!ignore_link || internal) markedDead = false
        state["ghosts"][elem.id] = 1;
    }
    else{
        $(elem).removeClass(["selected","guessed","permhidden"])
        $(elem).addClass("died");
        if (!ignore_link || internal) markedDead = true
        state["ghosts"][elem.id] = -2;
    }
    setCookie("tos_state",JSON.stringify(state),1)
    if(!ignore_link){filter(ignore_link)}

    if(polled && !ignore_link){resetResetButton()}
}

function fade(elem,ignore_link=false){

    $(elem).removeClass(["selected","guessed","died"])

    if (state["ghosts"][elem.id] != 0){
        state["ghosts"][elem.id] = 0;
        $(elem).addClass("faded");
        $(elem).find(".ghost_name").addClass("strike");
    }
    else{
        state["ghosts"][elem.id] = 1;
        $(elem).removeClass("faded");
        $(elem).find(".ghost_name").removeClass("strike");
    }

    setCookie("tos_state",JSON.stringify(state),1)
    if (!ignore_link){filter(ignore_link)}
}

function remove(elem,ignore_link=false){
    state["ghosts"][elem.id] = -1;
    $(elem).find(".ghost_name").removeClass("strike");
    $(elem).removeClass(["selected","guessed","died","faded"]);
    $(elem).addClass("permhidden");
    setCookie("tos_state",JSON.stringify(state),1)
    if (!ignore_link){filter(ignore_link)}
}

function revive(){
    for (const [key, value] of Object.entries(state["ghosts"])){ 
        if(value == -1){
            state['ghosts'][key] = 0
            $(document.getElementById(key)).removeClass(["died","selected","guessed","permhidden"])
            $(document.getElementById(key)).addClass(["faded"])
            $(document.getElementById(key)).find(".ghost_name").addClass("strike");
        }
    }
    setCookie("tos_state",JSON.stringify(state),1)
    if (hasLink){send_state()}
}

function filter(ignore_link=false){
    state["evidence"] = {}

    for (var i = 0; i < Object.keys(all_evidence).length; i++){
        state["evidence"][Object.keys(all_evidence)[i]] = 0
    }

    if (document.getElementsByClassName("guessed").length > 0 && last_guessed == null){
        last_guessed = document.getElementsByClassName("guessed")[0].id
    }

    // Get values of checkboxes
    var base_speed = 2.42;
    var ghost_array = [];
    var evi_array = [];
    var not_evi_array = [];
    
    var good_checkboxes = document.querySelectorAll('[name="evidence"] .good');
    var bad_checkboxes = document.querySelectorAll('[name="evidence"] .bad');
    var speed_checkboxes = document.querySelectorAll('[name="speed"] .good');
    var los_speed_checkboxes = document.querySelectorAll('[name="losspeed"] .good');
    var holy_water_checkboxes = document.querySelectorAll('[name="holywater"] .good');
    
    var num_evidences = document.getElementById("num_evidence").value

    for (var i = 0; i < good_checkboxes.length; i++) {
        if (num_evidences == "0" && good_checkboxes[i].parentElement.value != "Ghost Orbs"){
            good_checkboxes[i].parentElement.classList.remove("good")
            good_checkboxes[i].parentElement.classList.add("neutral")
            state["evidence"][good_checkboxes[i].parentElement.value] = 0;
        }
        else{
            evi_array.push(good_checkboxes[i].parentElement.value);
            state["evidence"][good_checkboxes[i].parentElement.value] = 1;
        }
    }

    for (var i = 0; i < bad_checkboxes.length; i++) {
        not_evi_array.push(bad_checkboxes[i].parentElement.value);
        state["evidence"][bad_checkboxes[i].parentElement.value] = -1;
    }

    var selected_speed = document.querySelector('.cycler[data-name="speed"] input').value;
    var selected_los_speed = document.querySelector('.cycler[data-name="los-speed"] input').value;
    var selected_holy_water = document.querySelector('.cycler[data-name="holy-water"] input').value;
    var selected_candle_interaction = document.querySelector('.cycler[data-name="candle-interaction"] input').value;
    var selected_rem_interaction = document.querySelector('.cycler[data-name="rem-interaction"] input').value;
    var selected_light_interaction = document.querySelector('.cycler[data-name="light-interaction"] input').value;
    var selected_radio_interaction = document.querySelector('.cycler[data-name="radio-interaction"] input').value;
    state["speed"] = selected_speed;
    state["los_speed"] = selected_los_speed;
    state["holy_water"] = selected_holy_water;
    state["candle_interaction"] = selected_candle_interaction;
    state["rem_interaction"] = selected_rem_interaction;
    state["light_interaction"] = selected_light_interaction;
    state["radio_interaction"] = selected_radio_interaction;


    // Filter other evidences
    for (var i = 0; i < Object.keys(all_evidence).length; i++){
        var checkbox = document.getElementById(Object.keys(all_evidence)[i]);
        $(checkbox).removeClass("block")
        $(checkbox).find("#checkbox").removeClass(["block","disabled","faded"])
        $(checkbox).find(".label").removeClass("disabled-text")
    }

    // Get all ghosts
    var ghosts = document.getElementsByClassName("ghost_card")
    var keep_evidence = new Set();
    var fade_evidence = new Set();
    var not_fade_evidence = new Set();
    var keep_speed = new Set();
    var fade_speed = new Set();
    var not_fade_speed = new Set();
    var keep_los_speed = new Set();
    var fade_los_speed = new Set();
    var not_fade_los_speed = new Set();
    var keep_holy_water = new Set();
    var fade_holy_water = new Set();
    var not_fade_holy_water = new Set();

    for (var i = 0; i < ghosts.length; i++){
        $(ghosts[i]).removeClass("preguessed")
        var keep = true;
        var loskeep = true;
        var holywaterkeep = true;
        var cooldownkeep = true;

        var marked_not = $(ghosts[i]).hasClass("faded") || $(ghosts[i]).hasClass("permhidden")
        var name = ghosts[i].id;
        var evi_objects = ghosts[i].getElementsByClassName("ghost_evidence")[0].children
        var evidence = []
        for (var j = 0; j < evi_objects.length; j++){
            $(evi_objects[j]).removeClass(["ghost_evidence_found","ghost_evidence_not"])
            evidence.push(evi_objects[j].getAttribute("name"))
        }
        var temp_vals = [...ghosts[i].querySelector(".ghost_hunt_info").innerText.replace('\n','').matchAll(/\d+(?:\.\d+)?(?:\s*\n?\s*m\/s|\s*\n?\s*s)/g)].map(m => m[0].replace(/\s+/g, ''));
        var speed = parseFloat(temp_vals[0])
        var los_speed = parseFloat(temp_vals[1])
        var holy_water = parseFloat(temp_vals[2])
        var cooldown = parseFloat(temp_vals[3])

        var candle_interaction = ghosts[i].querySelector(".candle-interaction").innerText.trim()
        var rem_interaction = ghosts[i].querySelector(".rem-interaction").innerText.trim()
        var light_interaction = ghosts[i].querySelector(".light-interaction").innerText.trim()
        var radio_interaction = ghosts[i].querySelector(".radio-interaction").innerText.trim()

        // Check for evidences
        // Standard
        if (["3","3N","3I","3E","3M"].includes(num_evidences)){

            if (evi_array.length > 0){
                evi_array.forEach(function (item,index){
                    if(!evidence.includes(item)){
                        keep = false
                    }
                });
            }

            if (not_evi_array.length > 0){
                not_evi_array.forEach(function (item,index){
                    if(evidence.includes(item)){
                        keep = false
                    }
                });
            }

            // Manage evidence classes
            evidence.forEach(function(item, index){
                if(document.getElementById("adaptive_evidence").checked){
                    if(evi_array.includes(item)){
                        $(evi_objects[index]).addClass("ghost_evidence_found")
                    }
                }
            })
        }

        // Nightmare Mode
        else if (num_evidences == "2"){

            if (evi_array.length == 3 && name != "The Mimic"){
                keep = false
            }
            else if (evi_array.length > 0){
                if (evi_array.length > (evidence.length > 3 ? 2 : 1) && evidence.filter(x => !evi_array.includes(x)).includes(nm_evidence)){
                    keep = false
                }

                evi_array.forEach(function (item,index){
                    if(!evidence.includes(item)){
                        keep = false
                    }
                });

            }

            if (not_evi_array.length > 1){
                if (evidence.filter(x => !not_evi_array.includes(x)).length <= (evidence.length > 3 ? 2 : 1)){
                    keep = false
                }
            }

            // Manage evidence classes
            evidence.forEach(function(item, index){
                if(document.getElementById("adaptive_evidence").checked){
                    if(evi_array.includes(item)){
                        $(evi_objects[index]).addClass("ghost_evidence_found")
                    }
                    else if(not_evi_array.includes(item)){
                        $(evi_objects[index]).addClass("ghost_evidence_not")
                    }
                    else if(evi_array.length == evidence.length - 1){
                        $(evi_objects[index]).addClass("ghost_evidence_not")
                    }
                }
            })
        }

        // Insanity
        else if (num_evidences == "1"){

            if (evi_array.length == 2 && name != "The Mimic"){
                keep = false
            }
            else if (evi_array.length > 0){
                if (evi_array.length > (evidence.length > 3 ? 1 : 0) && evidence.filter(x => !evi_array.includes(x)).includes(nm_evidence)){
                    keep = false
                }

                evi_array.forEach(function (item,index){
                    if(!evidence.includes(item)){
                        keep = false
                    }
                });

            }


            // Manage evidence classes
            evidence.forEach(function(item, index){
                if(document.getElementById("adaptive_evidence").checked){
                    if(evi_array.includes(item)){
                        $(evi_objects[index]).addClass("ghost_evidence_found")
                    }
                    else if(not_evi_array.includes(item)){
                        $(evi_objects[index]).addClass("ghost_evidence_not")
                    }
                    else if(evi_array.length == evidence.length - 2){
                        $(evi_objects[index]).addClass("ghost_evidence_not")
                    }
                }
            })
        }

        // Apocalypse
        else if (num_evidences == "0"){

            if (evi_array.length > 0 && name != "The Mimic"){
                keep = false
            }

            if (not_evi_array.length > 0 && name == "The Mimic"){
                keep = false
            }

            // Manage evidence classes
            if(document.getElementById("adaptive_evidence").checked){
                evidence.forEach(function(item, index){
                    $(evi_objects[index]).addClass("ghost_evidence_not")
                })
            }
        }

        //Check for speed
        if(selected_speed != "-"){
            if (selected_speed == "speed_normal" && speed != 2.42){
                keep = false
            }
            else if (selected_speed == "speed_fast" && speed <= 2.42){
                keep = false
            }
        }

        
        // Check for LOS speed
        if (selected_los_speed != "-"){
            if (selected_los_speed == "los_slow" && los_speed != 2.0){
                keep = false
            }
            else if (selected_los_speed == "los_normal" && los_speed != 2.5){
                keep = false
            }
            else if (selected_los_speed == "los_medium" && los_speed != 2.7){
                keep = false
            }
            else if (selected_los_speed == "los_fast" && los_speed != 3.1){
                keep = false
            }
        }

        // Check for holy water duration
        if (selected_holy_water != "-"){
            if (selected_holy_water == "holy_water_normal" && holy_water != 3){
                keep = false
            }
            else if (selected_holy_water == "holy_water_long" && holy_water <= 3){
                keep = false
            }
        }

        // Check for candle interaction
        if (selected_candle_interaction != "-"){
            if (selected_candle_interaction == "candle_blow_out" && candle_interaction != "Blow Out"){
                keep = false
            }
            else if (selected_candle_interaction == "candle_no_interaction" && candle_interaction != "X"){
                keep = false
            }
        }

        // Check for REM interaction
        if (selected_rem_interaction != "-"){
            if (selected_rem_interaction == "rem_interacts" && rem_interaction != "Interact"){
                keep = false
            }
            else if (selected_rem_interaction == "rem_no_interaction" && rem_interaction != "X"){
                keep = false
            }
        }

        // Check for light interaction
        if (selected_light_interaction != "-"){
            if (selected_light_interaction == "light_on_off" && light_interaction != "On/Off"){
                keep = false
            }
            else if (selected_light_interaction == "light_on_only" && ['X','Off Only'].includes(light_interaction)){
                keep = false
            }
            else if (selected_light_interaction == "light_off_only" && ['X','On Only'].includes(light_interaction)){
                keep = false
            }
        }

        // Check for radio interaction
        if (selected_radio_interaction != "-"){
            if (selected_radio_interaction == "radio_on_off" && radio_interaction != "On/Off"){
                keep = false
            }
            else if (selected_radio_interaction == "radio_on_only" && ['X','Off Only'].includes(radio_interaction)){
                keep = false
            }
            else if (selected_radio_interaction == "radio_off_only" && ['X','On Only'].includes(radio_interaction)){
                keep = false
            }
        }

        $(ghosts[i]).removeClass(["hidden","losfiltered"])
        if (!keep){
            $(ghosts[i]).removeClass(["selected","died","guessed"])
            $(ghosts[i]).addClass("hidden")
            state['ghosts'][name] = $(ghosts[i]).hasClass("faded") ? 0 : 1
        }
        else{
            ghost_array.push(name)
            for (var e = 0; e < evidence.length; e++){
                keep_evidence.add(evidence[e])
                if (marked_not){
                    fade_evidence.add(evidence[e])
                }
                else{
                    not_fade_evidence.add(evidence[e])
                }
            }
        }
    }

    if (["3","3N","3I","3E","3M"].includes(num_evidences)){
        if (evi_array.length >= 0){
            Object.keys(all_evidence).filter(evi => !keep_evidence.has(evi)).forEach(function(item){
                if (!not_evi_array.includes(item)){
                    var checkbox = document.getElementById(item);
                    $(checkbox).addClass("block")
                    $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
                    $(checkbox).find("#checkbox").addClass(["neutral","block","disabled"])
                    $(checkbox).find(".label").addClass("disabled-text")
                    $(checkbox).find(".label").removeClass("strike")
                }
            })
        }
    }

    else if (num_evidences == "2"){
        var keep_evi = evi_array
        if (keep_evi.length == 3){
            Object.keys(all_evidence).filter(evi => !keep_evi.includes(evi)).forEach(function(item){
                if (!not_evi_array.includes(item)){
                    var checkbox = document.getElementById(item);
                    $(checkbox).addClass("block")
                    $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
                    $(checkbox).find("#checkbox").addClass(["neutral","block","disabled"])
                    $(checkbox).find(".label").addClass("disabled-text")
                    $(checkbox).find(".label").removeClass("strike")
                }
            })
        }
        else if (keep_evi.length == 2){
            Object.keys(all_evidence).filter(evi => !keep_evi.includes(evi)).forEach(function(item){
                if (!not_evi_array.includes(item)){
                    var checkbox = document.getElementById(item);
                    $(checkbox).addClass("block")
                    $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
                    $(checkbox).find("#checkbox").addClass(["neutral","block","disabled"])
                    $(checkbox).find(".label").addClass("disabled-text")
                    $(checkbox).find(".label").removeClass("strike")
                }
            })
        }
        else if (keep_evi.length > 0){
            Object.keys(all_evidence).filter(evi => !keep_evidence.has(evi)).forEach(function(item){
                if (!not_evi_array.includes(item)){
                    var checkbox = document.getElementById(item);
                    $(checkbox).addClass("block")
                    $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
                    $(checkbox).find("#checkbox").addClass(["neutral","block","disabled"])
                    $(checkbox).find(".label").addClass("disabled-text")
                    $(checkbox).find(".label").removeClass("strike")
                }
            })
        }
    }

    else if (num_evidences == "1"){
        var keep_evi = evi_array
        if (keep_evi.length == 2){
            Object.keys(all_evidence).filter(evi => !keep_evi.includes(evi)).forEach(function(item){
                if (!not_evi_array.includes(item)){
                    var checkbox = document.getElementById(item);
                    $(checkbox).addClass("block")
                    $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
                    $(checkbox).find("#checkbox").addClass(["neutral","block","disabled"])
                    $(checkbox).find(".label").addClass("disabled-text")
                    $(checkbox).find(".label").removeClass("strike")
                }
            })
        }
        else if (keep_evi.length == 1){
            Object.keys(all_evidence).filter(evi => !keep_evi.includes(evi)).forEach(function(item){
                if (!not_evi_array.includes(item)){
                    var checkbox = document.getElementById(item);
                    $(checkbox).addClass("block")
                    $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
                    $(checkbox).find("#checkbox").addClass(["neutral","block","disabled"])
                    $(checkbox).find(".label").addClass("disabled-text")
                    $(checkbox).find(".label").removeClass("strike")
                }
            })
        }
        else if (keep_evi.length > 0){
            Object.keys(all_evidence).filter(evi => !keep_evidence.has(evi)).forEach(function(item){
                if (!not_evi_array.includes(item)){
                    var checkbox = document.getElementById(item);
                    $(checkbox).addClass("block")
                    $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
                    $(checkbox).find("#checkbox").addClass(["neutral","block","disabled"])
                    $(checkbox).find(".label").addClass("disabled-text")
                    $(checkbox).find(".label").removeClass("strike")
                }
            })
        }
    }

    else if (num_evidences == "0"){
        Object.keys(all_evidence).filter(evi => evi != 'Ghost Orbs').forEach(function(item){
            var checkbox = document.getElementById(item);
            $(checkbox).addClass("block")
            $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
            $(checkbox).find("#checkbox").addClass(["neutral","block","disabled"])
            $(checkbox).find(".label").addClass("disabled-text")
            $(checkbox).find(".label").removeClass("strike")
        })
    }

    // If one ghost, remove fade, remove permhidden
    if(ghost_array.length == 1){
        if($(`#${ghost_array[0]}`).hasClass("faded")){
            fade(document.getElementById(ghost_array[0]),ignore_link)
            return
        }
        if($(`#${ghost_array[0]}`).hasClass("permhidden")){
            $(`#${ghost_array[0]}`).removeClass("permhidden")
            filter(ignore_link)
            return
        }
    }

    // Loop through and fade evidence that needs to be faded
    fade_evidence.forEach(function(item){
        if(
            fade_evidence.has(item) && 
            !not_fade_evidence.has(item) &&
            keep_evidence.has(item) &&
            !evi_array.includes(item) &&
            !not_evi_array.includes(item)
        ){
            var checkbox = document.getElementById(item);
            $(checkbox).find("#checkbox").removeClass(["good","bad","faded"])
            $(checkbox).find("#checkbox").addClass(["neutral","faded"])
            $(checkbox).find(".label").addClass("disabled-text")
            $(checkbox).find(".label").removeClass("strike")
        }
    })

    prioritySort()
    clearTimeout(auto_select_timeout)
    autoPreSelect()
    auto_select_timeout = setTimeout(() => {
        autoSelect()
    }, 1005)
    setCookie("tos_state",JSON.stringify(state),1)
    updateScaling()
    if (hasLink && !ignore_link){send_state()}
    if (hasDLLink){send_evidence_link(); send_ghosts_link(); send_interaction_link();}
}

function prioritySort(){

    var sortParentElement = document.getElementById("cards")
    var sortElements = [...document.querySelectorAll(".ghost_card")]
    var mobileSpacer = document.getElementById("mobile-spacer")

    if(document.getElementById("priority_sort").checked){
        $("#sort_img").attr("src","imgs/sort-icon.png")
        sortElements.sort((a,b) => {
            return Object.keys(all_ghosts).indexOf(a.id) - Object.keys(all_ghosts).indexOf(b.id)
        }).sort((a,b) => {
            if ($(a).hasClass("faded") && !$(b).hasClass("faded"))
                return 1
            else if ($(a).hasClass("faded") == $(b).hasClass("faded"))
                return 0
            return -1
        }).forEach(gcard => sortParentElement.appendChild(gcard))
    }
    else{
        $("#sort_img").attr("src","imgs/not-sort-icon.png")
        sortElements.sort((a,b) => {
            return Object.keys(all_ghosts).indexOf(a.id) - Object.keys(all_ghosts).indexOf(b.id)
        }).forEach(gcard => sortParentElement.appendChild(gcard))
    }

    if (mobileSpacer)
        sortParentElement.appendChild(mobileSpacer)
    else 
        sortParentElement.innerHTML += `<div id="mobile-spacer" class="mobile-spacer"></div>`

    let spacer = document.getElementById("body-spacer")
    if (spacer)
        sortParentElement.appendChild(spacer)

    let vis_ghosts = Array.from(document.getElementsByClassName("ghost_card")).filter(g => !$(g).hasClass("hidden"))

    if (MQUERY.matches && vis_ghosts.length <= 10){
        updateScaling()
        vis_ghosts[0].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function all_los(){
    var ghosts = document.getElementsByClassName("ghost_card")
    for (var i = 0; i < ghosts.length; i++){
        var has_los = parseInt(ghosts[i].getElementsByClassName("ghost_has_los")[0].textContent)
        if(
            !has_los && (!$(ghosts[i]).hasClass("hidden") || ($(ghosts[i]).hasClass("hidden") && $(ghosts[i]).hasClass("losfiltered")))
        ){
            return false
        }
    }
    
    return true
}

function all_not_los(){
    var ghosts = document.getElementsByClassName("ghost_card")
    for (var i = 0; i < ghosts.length; i++){
        var has_los = parseInt(ghosts[i].getElementsByClassName("ghost_has_los")[0].textContent)
        if(
            has_los && (!$(ghosts[i]).hasClass("hidden") || ($(ghosts[i]).hasClass("hidden") && $(ghosts[i]).hasClass("losfiltered")))
        ){
            return false
        }
    }
    
    return true
}

function autoPreSelect(){

    if(Object.keys(data_user).length > 0 || hasDLLink){
        var cur_selected = []
        var has_selected = false
        var selected = "";
        var died = "";
        var ghosts = document.getElementsByClassName("ghost_card")
        for (var i = 0; i < ghosts.length; i++){
            if($(ghosts[i]).hasClass("selected")){
                has_selected = true
                selected = ghosts[i].id;
            }
            else if($(ghosts[i]).hasClass("died")){
                has_selected = true
                died = ghosts[i].id;
            }
            else if($(ghosts[i]).hasClass("guessed")){
                has_selected = true
                guessed = ghosts[i].id;
            }
            else if(
                !$(ghosts[i]).hasClass("faded") && 
                !$(ghosts[i]).hasClass("hidden") && 
                !$(ghosts[i]).hasClass("permhidden")
            ){
                cur_selected.push(i)
            }
        }

        if ((cur_selected.length == 1 || last_guessed != null) && selected == "" && died == ""){
            if(Object.keys(data_user).length > 0){
                if (last_guessed != null)
                    $(ghosts[last_guessed]).addClass("preguessed")
                else
                    $(ghosts[cur_selected[0]]).addClass("preguessed")
            }
        }
        if (selected != ""){
            send_ghost_link(selected,2)
        }
        else if(died != ""){
            send_ghost_link(died,-1)
        }
        else if(last_guessed == null){
            send_ghost_link("",0)
        }
    }
    resetResetButton()
}

function autoSelect(){
    if(Object.keys(data_user).length > 0 || hasDLLink){
        var cur_selected = []
        var has_selected = false
        var selected = "";
        var died = "";
        var guessed = "";
        var ghosts = document.getElementsByClassName("ghost_card")
        for (var i = 0; i < ghosts.length; i++){
            if($(ghosts[i]).hasClass("selected")){
                has_selected = true
                selected = ghosts[i].id;
            }
            else if($(ghosts[i]).hasClass("died")){
                has_selected = true
                died = ghosts[i].id;
            }
            else if($(ghosts[i]).hasClass("guessed")){
                has_selected = true
                guessed = ghosts[i].id;
            }
            else if(
                !$(ghosts[i]).hasClass("faded") && 
                !$(ghosts[i]).hasClass("hidden") && 
                !$(ghosts[i]).hasClass("permhidden")
            ){
                cur_selected.push(i)
            }
        }

        if (!has_selected && cur_selected.length == 1){
            if(Object.keys(data_user).length > 0){
                guess(ghosts[cur_selected[0]],internal=true)
                send_ghost_link(ghosts[cur_selected[0]].id,1)
            }
            else{
                send_ghost_link(ghosts[cur_selected[0]].id,2)
            }
        }
        else{
            if (last_guessed != null && !$(ghosts[last_guessed]).hasClass("hidden") && selected == "" && died == ""){
                send_ghost_link(last_guessed,1)
                guess(ghosts[last_guessed],internal=true)
            }
            else if (selected != ""){
                send_ghost_link(selected,2)
            }
            else if(died != ""){
                send_ghost_link(died,-1)
            }
            else if (guessed != ""){
                send_ghost_link(guessed,1)
            }
            else{
                send_ghost_link("",0)
            }
        }

        last_guessed = null

        setCookie("tos_state",JSON.stringify(state),1)
    }
    resetResetButton()
}

function hasSelected(){
    if(Object.keys(data_user).length > 0){
        var ghosts = document.getElementsByClassName("ghost_card")
        for (var i = 0; i < ghosts.length; i++){
            if(ghosts[i].className.includes("selected") || ghosts[i].className.includes("died")){
                return true
            }
        }
    }
    return false
}

function checkResetButton(){
    if(Object.keys(data_user).length > 0 && document.getElementById("force_selection").checked){
        if(!hasSelected()){
            $("#reset").removeClass("standard_reset")
            $("#reset").addClass("reset_pulse")
            $("#reset").html(`${lang_data['{{no_ghost_selected}}']}<div class='reset_note'>(${lang_data['{{double_click_to_reset}}']})</div>`)
            $("#reset").attr("onclick",null)
            $("#reset").attr("ondblclick","reset()")
        }
    }
}

function resetResetButton(){
    $("#reset").removeClass("reset_pulse")
    $("#reset").addClass("standard_reset")
    if(Object.keys(data_user).length > 0){
        $("#reset").html(`${lang_data['{{save_and_reset}}']}<div class='reset_note'>(${lang_data['{{right_click_for_more}}']})</div>`)
    }
    else{
        if(lang_data)
            $("#reset").html(polled ? lang_data['{{waiting_for_others}}'] : lang_data['{{reset}}'])
    }
    $("#reset").attr("ondblclick",null)
    $("#reset").attr("onclick","reset()")
}

function showInfo(event){

    event.stopPropagation()
    $("#info_blockout").toggle()
    $("#blackout").fadeToggle(400)
}

function showVoiceInfo(event){
    event.stopPropagation()
    $("#voice_blockout").toggle()
    $("#blackout_voice").fadeToggle(400)
}

function showZNDLInfo(event){
    event.stopPropagation()
    $("#zndl_blockout").toggle()
    $("#blackout_zndl").fadeToggle(400)
}

function showZNTDLInfo(event){
    event.stopPropagation()
    $("#zntdl_blockout").toggle()
    $("#blackout_zntdl").fadeToggle(400)
}

function showDebug(event){
    event.stopPropagation()
    if (window._flushDebugLog) window._flushDebugLog();
    $("#debug_blockout").toggle()
    $("#blackout_debug").fadeToggle(400)
}

function showCalibrate(){
    $("#blackout_calibrate").fadeToggle(400)
}

function startSwipe(e){
    touchStartX = e.changedTouches[0].pageX
    touchStartY = e.changedTouches[0].pageY
}

function endSwipe(e){
    touchEndX = e.changedTouches[0].pageX
    touchEndY = e.changedTouches[0].pageY

    if(
        !touchMap && 
        (Math.abs(touchEndX - touchStartX) / screen.width > 0.20 ||
        Math.abs(touchEndY - touchStartY) / screen.height > 0.15 )
    ){
        // Closing tabs
        if (touchEndX < touchStartX && Math.abs(touchEndX - touchStartX) > Math.abs(touchEndY - touchStartY)){
            closeAll()
        }

        // Close filters
        if (!tabOpen && touchStartY >= $("#menu").offset().top && touchEndY > touchStartY && Math.abs(touchEndX - touchStartX) < Math.abs(touchEndY - touchStartY)){
            closeMenu()
        }

        // Open filters
        if (!tabOpen && touchStartY >= $("#menu").offset().top - 100 && touchEndY < touchStartY && Math.abs(touchEndX - touchStartX) < Math.abs(touchEndY - touchStartY)){
            showMenu()
        }
    }

    touchMap = false
}

function closeAll(skip_map=false,skip_wiki=false){
    mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")

    document.getElementById("settings_box").style.left = (mquery.matches ? "-100%" : "0px")
    if (!mquery.matches)
        document.getElementById("settings_box").style.width = lang_menu_widths[lang].width
    document.getElementById("settings_box").style.boxShadow = "none"
    document.getElementById("settings_tab").style.boxShadow = "none"
    $("#settings_box").removeClass("tab-open")

    document.getElementById("links_box").style.left = (mquery.matches ? "-100%" : "0px")
    if (!mquery.matches)
        document.getElementById("links_box").style.width = lang_menu_widths[lang].width
    document.getElementById("links_box").style.boxShadow = "none"
    document.getElementById("links_box").style.boxShadow = "none"
    $("#links_box").removeClass("tab-open")

    document.getElementById("data_link_box").style.left = (mquery.matches ? "-100%" : "0px")
    if (!mquery.matches)
        document.getElementById("data_link_box").style.width = lang_menu_widths[lang].width
    document.getElementById("data_link_box").style.boxShadow = "none"
    document.getElementById("data_link_tab").style.boxShadow = "none"
    $("#data_link_box").removeClass("tab-open")

    if(!skip_wiki){
        document.getElementById("wiki_box").style.left = (mquery.matches ? "-100%" : "0px")
        if (!mquery.matches)
            document.getElementById("wiki_box").style.width = lang_menu_widths[lang].width
        document.getElementById("wiki_box").style.boxShadow = "none"
        document.getElementById("wiki_tab").style.boxShadow = "none"
        $("#wiki_box").removeClass("tab-open")
    }

    if(!skip_map){
        document.getElementById("maps_box").style.width = (mquery.matches ? "calc(100% - 40px)" : "556px")
        document.getElementById("maps_box").style.left = (mquery.matches ? "-100%" : "-388px")
        document.getElementById("maps_box").style.boxShadow = "none"
        document.getElementById("maps_box").style.boxShadow = "none"
        $("#maps_box").removeClass("tab-open")
    }

    document.getElementById("settings_box").style.zIndex = "1"
    document.getElementById("links_box").style.zIndex = "1"
    document.getElementById("data_link_box").style.zIndex= "1"
    if (!skip_wiki) document.getElementById("wiki_box").style.zIndex= "1"
    if (!skip_map) document.getElementById("maps_box").style.zIndex= "1"
    tabOpen = false
}

function isClosed(elem,value=0){
    mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
    return (
        !$(elem).hasClass("tab-open") || 
        Math.abs(elem.getBoundingClientRect().left) == (mquery.matches ? elem.clientWidth : value)
    )
}

function get_open_menu_width(block){
    mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
    let menu = document.getElementById(`${block}_box`)
    switch (block){
        case "settings":
        case "links":
        case "data_link":
            return (!mquery.matches ? "200px" : `${menu.width}px`);
        case "event":
        case "wiki":
            return (!mquery.matches ? "350px" : `${menu.width}px`);
        case "maps":
            return (!mquery.matches ? lang_menu_widths[lang].maps : "calc(100% - 40px)");
        default:
            return "200px";
    }
}

function get_close_menu_width(block){
    mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
    let menu = document.getElementById(`${block}_box`)
    switch (block){
        case "settings":
        case "links":
        case "data_link":
            return (!mquery.matches ? lang_menu_widths[lang].width : `${menu.width}px`);
        case "event":
        case "wiki":
            return (!mquery.matches ? lang_menu_widths[lang].width : `${menu.width}px`);
        case "maps":
            return (!mquery.matches ? "556px" : "calc(100% - 40px)");
        default:
            return (!mquery.matches ? lang_menu_widths[lang].width : `${menu.width}px`);
    }
}

function showSideMenu(block, force_open=false,force_close=false){
    mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
    let menu = document.getElementById(`${block}_box`)
    let tab = document.getElementById(`${block}_tab`)
    if ((isClosed(menu,block=='maps'?388:0) || force_open) && !force_close){
        menu.style.boxShadow = "5px 0px 10px 0px #000"
        tab.style.boxShadow = "5px 6px 5px -2px #000"
        $(".side-menu").css("z-index", "1");
        menu.style.zIndex = (mquery.matches ? "1000" : "2")
        menu.style.left = (mquery.matches ? "0px" : lang_menu_widths[lang].left)
        menu.style.width = get_open_menu_width(block)
        $(menu).addClass("tab-open")
        tabOpen = true
    }
    else if (!force_close){
        menu.style.width = get_close_menu_width(block)
        menu.style.left = (mquery.matches ? "-100%" : (block == 'maps' ? "-388px" : "0px"))
        menu.style.boxShadow = "none"
        tab.style.boxShadow = "none"
        $(menu).removeClass("tab-open")
        tabOpen = false
        if(mquery.matches){
            $("#cards").scrollTop($("#cards").scrollTop() - 1);
            setTimeout(function(){
                $("#cards").scrollTop($("#cards").scrollTop() + 1);
                menu.style.zIndex = "1"
            },500);
            $("#menu").show()
        }
    }
}

function showSearch(force_open=false,force_close=false){
    document.getElementById("search_bar").value = document.getElementById("search_bar").value.replace('/','')
    if ((document.getElementById("search_box").style.right == "-36px" || force_open) && !force_close){
        document.getElementById("theme_box").style.zIndex = "9"
        document.getElementById("search_box").style.zIndex = "11"
        document.getElementById("search_box").style.boxShadow = "-5px 0px 10px 0px #000"
        document.getElementById("search_tab").style.boxShadow = "-5px 6px 5px -2px #000"
        document.getElementById("search_box").style.right = "0px"
        document.getElementById("search_box").style.width = "350px"
        document.getElementById("search_bar").focus()
        if(mquery.matches)
            $("#menu").hide()
    }
    else {
        $(".ghost_card").removeClass("result_focus")
        document.getElementById("search_box").style.width = "20px"
        document.getElementById("search_box").style.right = "-36px"
        document.getElementById("search_box").style.boxShadow = "none"
        document.getElementById("search_box").style.boxShadow = "none"
        if(mquery.matches)
            $("#menu").show()
    }
}

function showTheme(){
    if (document.getElementById("theme_box").style.right == "-36px"){
        document.getElementById("search_box").style.zIndex = "9"
        document.getElementById("theme_box").style.zIndex = "11"
        document.getElementById("theme_box").style.boxShadow = "-5px 0px 10px 0px #000"
        document.getElementById("theme_tab").style.boxShadow = "-5px 6px 5px -2px #000"
        document.getElementById("theme_box").style.right = "0px"
        document.getElementById("theme_box").style.width = "160px"
        document.getElementById("theme_blockout").style.zIndex = "10"
        $("#theme_blockout").fadeIn(500)
    }
    else {
        document.getElementById("theme_box").style.width = "20px"
        document.getElementById("theme_box").style.right = "-36px"
        document.getElementById("theme_box").style.boxShadow = "none"
        document.getElementById("theme_box").style.boxShadow = "none"
        $("#theme_blockout").fadeOut(500)
        setTimeout(()=>{
            document.getElementById("theme_blockout").style.zIndex = "-999"
        },500)
    }
}

function flashMode(custom_message=null){

    if (custom_message){
        document.getElementById("game_mode").innerHTML = custom_message
    }
    else{
        var cur_evidence = document.getElementById("num_evidence").value
        var mode_text = {
            "3N":lang_data['{{novice}}'],
            "3I":lang_data['{{intermediate}}'],
            "3E":lang_data['{{expert}}'],
            "3M":lang_data['{{master}}']
        }[cur_evidence]
        document.getElementById("game_mode").innerHTML = `${mode_text}<span>(${parseInt(cur_evidence)} ${lang_data['{{evidence}}']})</span>`
    }
    $("#game_mode").fadeIn(500,function () {
        $("#game_mode").delay(500).fadeOut(500);
    });
}

function load_default(key, def){
    return user_settings.hasOwnProperty(key) ? ((user_settings[key] === '' || user_settings[key] === null) ? def : user_settings[key]) : def
}

function saveSettings(reset = false){
    user_settings['volume'] = parseInt(document.getElementById("modifier_volume").value)
    user_settings['mute_broadcast'] = document.getElementById("mute_broadcast").checked ? 1 : 0;
    user_settings['mute_timer_toggle'] = document.getElementById("mute_timer_toggle").checked ? 1 : 0;
    user_settings['mute_timer_countdown'] = document.getElementById("mute_timer_countdown").checked ? 1 : 0;
    user_settings['timer_count_up'] = document.getElementById("timer_count_up").checked ? 1 : 0;
    user_settings['timer_split'] = document.getElementById("timer_split").checked ? 1 : 0;
    user_settings['auto_start_cooldown'] = document.getElementById("timer_auto_start_cooldown").checked ? 1 : 0;
    user_settings['adaptive_evidence'] = document.getElementById("adaptive_evidence").checked ? 1 : 0;
    user_settings['hide_descriptions'] = document.getElementById("hide_descriptions").checked ? 1 : 0;
    user_settings['layout'] = document.getElementById("card_format").value
    user_settings['hide_sanity_speed'] = document.getElementById("hide_sanity_speed").checked ? 1 : 0;
    user_settings['offset'] = parseFloat(document.getElementById("offset_value").innerText.replace(/\d+(?:-\d+)+/g,"")).toFixed(1)
    user_settings['num_evidences'] = document.getElementById("num_evidence").value
    user_settings['bpm_type'] = document.getElementById("bpm_type").checked ? 1 : 0;
    user_settings['bpm'] = reset ? 0 : parseInt(document.getElementById('input_bpm').innerHTML.split("<br>")[0])
    user_settings['domo_side'] = $("#domovoi").hasClass("domovoi-flip") ? 1 : 0;
    user_settings['priority_sort'] = document.getElementById("priority_sort").checked ? 1 : 0;
    user_settings['disable_particles'] = document.getElementById("disable_particles").checked ? 1 : 0;
    user_settings['keep_alive'] = document.getElementById("keep_alive").checked ? 1 : 0;
    user_settings['show_event_maps'] = document.getElementById("map_event_check_box").checked ? 1 : 0;
    user_settings['map'] = $(".selected_map")[0] ? $(".selected_map")[0].id : 'tanglewood'
    user_settings['theme'] = $("#theme").val();
    user_settings['voice_prefix'] = document.getElementById("voice_prefix").checked ? 1 : 0

    setCookie("tos_settings",JSON.stringify(user_settings),30)
}

function loadSettings(){
    loadThemes()

    try{
        user_settings = JSON.parse(getCookie("tos_settings"))
    } catch (error) {
        user_settings = {"num_evidences":"3N","volume":50,"mute_broadcast":0,"mute_timer_toggle":0,"mute_timer_countdown":0,"timer_count_up":0,"timer_split":1,"adaptive_evidence":0,"hide_descriptions":0,"layout":0,"hide_sanity_speed":0,"offset":0.0,"bpm_type":0,"bpm":0,"domo_side":0,"priority_sort":0,"map":"ravenwood","theme":"Default","keep_alive":0,"disable_particles":0,"show_event_maps":0,"voice_prefix":0}
    }

    user_settings['num_evidences'] = user_settings['num_evidences'] == "" ? "3" : user_settings['num_evidences']

    document.getElementById("modifier_volume").value = load_default('volume',50)
    document.getElementById("mute_broadcast").checked = load_default('mute_broadcast',0) == 1 
    document.getElementById("mute_timer_toggle").checked = load_default('mute_timer_toggle',0) == 1 
    document.getElementById("mute_timer_countdown").checked = load_default('mute_timer_countdown',0) == 1
    document.getElementById("timer_count_up").checked = load_default('timer_count_up',0) == 1
    document.getElementById("timer_split").checked = load_default('timer_split',0) == 1
    document.getElementById("timer_auto_start_cooldown").checked = load_default('auto_start_cooldown',0) == 1
    document.getElementById("adaptive_evidence").checked = load_default('adaptive_evidence',0) == 1
    document.getElementById("hide_descriptions").checked = load_default('hide_descriptions',0) == 1
    document.getElementById("card_format").value = load_default('layout',0)
    document.getElementById("hide_sanity_speed").checked = load_default('hide_sanity_speed',0) == 1
    document.getElementById("offset_value").innerText = ` ${load_default('offset',0.0)}% `

    if(Array.from(document.getElementById("num_evidence").options).map(option => option.value).includes(load_default('num_evidences','3')))
        document.getElementById("num_evidence").value = load_default('num_evidences','3')
    else
        document.getElementById("num_evidence").value = '-1'

    document.getElementById("bpm_type").checked = load_default('bpm_type',0) == 1
    if (load_default('domo_side',0) == 1){
        $("#domovoi").addClass("domovoi-flip")
        $("#domovoi-img").addClass("domovoi-img-flip")
    }
    document.getElementById("priority_sort").checked = load_default('priority_sort',0) == 1;
    document.getElementById("disable_particles").checked = load_default('disable_particles',0) == 1;
    document.getElementById("keep_alive").checked = load_default('keep_alive',0) == 1;
    document.getElementById("map_event_check_box").checked = load_default('show_event_maps',0) == 1;
    document.getElementById("voice_prefix").checked = load_default('voice_prefix',0) == 1;
    
    var room_id = getCookie("tos_room_id")
    if (room_id == ''){
        var map_exists = setInterval(function(){
            if(document.getElementById(user_settings['map']) != null){
                var map_elem = document.getElementById(user_settings['map'])
                if (map_elem.onclick.toString().match(/(http.+?)'\)/)){
                    changeMap(map_elem,map_elem.onclick.toString().match(/(http.+?)'\)/)[1],true)
                }
                else{
                    changeMap(map_elem,null,true)
                }
                clearInterval(map_exists)
            }
        },500)
    }

    document.getElementById("theme").value = user_settings['theme']
    if (user_settings['coal']){
        toggleCoal(true)
    }
    if (user_settings['forest_minion']){
        toggleForestMinion(user_settings['forest_minion'],true)
    }
    if (user_settings['blood_moon']){
        toggleBloodMoon(true)
    }

    if ((user_settings['bpm'] ?? 0) > 0){
        document.getElementById('input_bpm').innerHTML = `${user_settings['bpm']}<br>bpm`
        var cms = document.getElementById("bpm_type").checked ? get_ms(user_settings['bpm']) : get_ms_exact(user_settings['bpm'])
        document.getElementById('input_speed').innerHTML = `${cms}<br>m/s`;
        try{
            mark_ghosts(cms)
        } catch(Error){
            // Om nom nom
        }
        try{
            mark_ghost_details(cms)
        } catch(Error){
            // Om nom nom
        }
    }

    setCookie("tos_settings",JSON.stringify(user_settings),30)

    toggleDescriptions()
    toggleSanitySpeed(document.getElementById("hide_sanity_speed").checked)
    changeLayout()
    toggleKeepAlive(document.getElementById("keep_alive"))
    changeTheme(user_settings['theme'])
    setVolume()
    mute("toggle")
    mute("countdown")
    mute_broadcast()
    toggleCountup()
    toggleVoicePrefix()
    adjustOffset(0)
    setTempo()
    updateMapDifficulty(user_settings['num_evidences'])
    // showCustom()
    setTimeout(() => {
        flashMode()
    },300)
    send_cur_map_link()
}

function resetSettings(){
    user_settings = {"num_evidences":"3N","volume":50,"mute_broadcast":0,"mute_timer_toggle":0,"mute_timer_countdown":0,"timer_count_up":0,"timer_split":1,"adaptive_evidence":0,"hide_descriptions":0,"layout":0,"hide_sanity_speed":0,"offset":0.0,"bpm_type":0,"bpm":0,"domo_side":0,"priority_sort":0,"map":"ravenwood","theme":"Default","keep_alive":0,"disable_particles":0,"show_event_maps":0,"voice_prefix":0}
    document.getElementById("modifier_volume").value = load_default('volume',50)
    document.getElementById("mute_broadcast").checked = load_default('mute_broadcast',0) == 1 
    document.getElementById("mute_timer_toggle").checked = load_default('mute_timer_toggle',0) == 1 
    document.getElementById("mute_timer_countdown").checked = load_default('mute_timer_countdown',0) == 1
    document.getElementById("timer_count_up").checked = load_default('timer_count_up',0) == 1
    document.getElementById("timer_split").checked = load_default('timer_split',0) == 1
    document.getElementById("timer_auto_start_cooldown").checked = load_default('auto_start_cooldown',0) == 1
    document.getElementById("adaptive_evidence").checked = load_default('adaptive_evidence',0) == 1
    document.getElementById("hide_descriptions").checked = load_default('hide_descriptions',0) == 1
    document.getElementById("card_format").value = load_default('layout',0)
    document.getElementById("hide_sanity_speed").checked = load_default('hide_sanity_speed',0) == 1
    document.getElementById("offset_value").innerText = ` ${load_default('offset',0.0)}% `
    document.getElementById("num_evidence").value = load_default('num_evidences','3')
    document.getElementById("bpm_type").checked = load_default('bpm_type',0) == 1
    document.getElementById("disable_particles").checked = load_default('disable_particles',0) == 1
    document.getElementById("keep_alive").checked = load_default('keep_alive',0) == 1
    document.getElementById("map_event_check_box").checked = load_default('show_event_maps',0) == 1;
    document.getElementById("voice_prefix").checked = load_default('voice_prefix',0) == 1;
    document.getElementById("tanglewood").click()
    document.getElementById("theme").value = user_settings['theme']
    if (user_settings['coal']){
        $('#coal-icon').removeClass('coal-active')
        coal = 0
    }
    if (user_settings['forest_minion']){
        $('#forest-minion-icon').removeClass('forest-minion-active')
        $("#forest-minion-mod").text("0")
        $("#forest-minion-mod-2").text("0")
        forest_minion = 0
    }
    if (user_settings['blood_moon']){
        $('#blood-moon-icon').removeClass('blood-moon-active')
        blood_moon = 0
    }
    setCookie("tos_settings",JSON.stringify(user_settings),30)
}

function checkDifficulty(){
    
}

function changeMap(elem,map,ignore_link=false){

    $(".maps_button").removeClass("selected_map")
    let map_name = $(elem).text().slice(1)
    let short_map = map_name.length > 24 ? map_name.slice(0,24) + "..." : map_name
    $("#cur_map").html($(elem).html().replace(map_name, short_map))
    $(elem).addClass("selected_map")
    $(".map_image").css("background-image",document.getElementById("map_event_check_box").checked && document.getElementById("map-type").value == '0' && all_maps.hasOwnProperty(`${elem.id}-e`) ? `url(${all_maps[`${elem.id}-e`]})` : "url("+map+")")

    $("#map-explorer-link-2").attr("href",`https://zero-network.net/the-other-side/map-explorer/?share=${elem.id}`)

    state['map'] = elem.id
    state['map_size'] = elem.querySelector(".map_size").innerText
    setCookie("tos_state",JSON.stringify(state),1)
    updateMapSize(elem.querySelector(".map_size").innerText)
    send_cur_map_link()
    if(!ignore_link){
        send_state()
    }
}

function zoomMap(elem){
    touchMap = true
    $(".map_image").css("width",`200%`)
    $(".map_image").css("height",`200%`)
}

function unZoomMap(elem){
    $(".map_image").css("width",`100%`)
    $(".map_image").css("height",`100%`)
    $(".map_image").css("left",`0`)
    $(".map_image").css("top",`0`)
}

function moveZoom(elem,e){
    if(e.hasOwnProperty("touches")){
        mpx = (e.touches[0].clientX - $(elem).offset().left) / $(elem).width()
        mpy = (e.touches[0].clientY - $(elem).offset().top) / $(elem).height()
    }
    else{
        mpx = (e.clientX - $(elem).offset().left) / $(elem).width()
        mpy = (e.clientY - $(elem).offset().top) / $(elem).height()
    }

    $(".map_image").css("left",`-${(mpx*120)-10}%`)
    $(".map_image").css("top",`-${(mpy*120)-10}%`)
}

function playSound(resource){
    var snd = new Audio(resource);
    snd.volume = volume
    snd.play()
}

function toggleDescriptions(forced = null){

    if (forced == true){
        document.getElementById("hide_descriptions").checked = false
    }
    else if (forced == false){
        document.getElementById("hide_descriptions").checked = true
    }

    if(document.getElementById("hide_descriptions").checked){
        $(".ghost_card").addClass(["ghost_card_hidden"])
        $(".ghost_behavior").addClass(["ghost_behavior_hidden"])
    }
    else{
        $(".ghost_card").removeClass(["ghost_card_hidden"])
        $(".ghost_behavior").removeClass(["ghost_behavior_hidden"])
    }
    changeLayout()
}

function toggleSanitySpeed(forced=null){
    if (forced == false){
        document.getElementById("hide_sanity_speed").checked = false
        $(".ghost_hunt_info").addClass("ghost_info_lock")
    }
    else if (forced == true){
        document.getElementById("hide_sanity_speed").checked = true
        $(".ghost_hunt_info").removeClass("ghost_info_lock")
    }

    if(document.getElementById("hide_sanity_speed").checked){
        $(".ghost_hunt_info").removeClass("ghost_info_lock")
    }
    else{
        $(".ghost_hunt_info").addClass("ghost_info_lock")
    }
}

function changeLayout(){
    const layout = document.getElementById("card_format").value
    $(".ghost_card").removeClass(["ghost_card_alt_1","ghost_card_alt_2"])
    $(".ghost_behavior").removeClass(["ghost_behavior_alt_1","ghost_behavior_alt_2"])
    $(".ghost_name").removeClass(["ghost_name_alt_1","ghost_name_alt_2"])
    $(".ghost_evidence").removeClass(["ghost_evidence_alt_1","ghost_evidence_alt_2"])
    $(".ghost_hunt_info").removeClass(["ghost_hunt_info_alt_1","ghost_hunt_info_alt_2"])
    $(".ghost_clear").removeClass(["ghost_clear_alt_1","ghost_clear_alt_2"])

    if(!document.getElementById("hide_descriptions").checked){
        if (layout === "1"){
            $(".ghost_card").addClass(["ghost_card_alt_1"])
            $(".ghost_behavior").addClass(["ghost_behavior_alt_1"])
            $(".ghost_name").addClass(["ghost_name_alt_1"])
            $(".ghost_evidence").addClass(["ghost_evidence_alt_1"])
            $(".ghost_hunt_info").addClass(["ghost_hunt_info_alt_1"])
            $(".ghost_clear").addClass(["ghost_clear_alt_1"])
        }
        else if (layout === "2"){
            $(".ghost_card").addClass(["ghost_card_alt_2"])
            $(".ghost_behavior").addClass(["ghost_behavior_alt_2"])
            $(".ghost_name").addClass(["ghost_name_alt_2"])
            $(".ghost_evidence").addClass(["ghost_evidence_alt_2"])
            $(".ghost_hunt_info").addClass(["ghost_hunt_info_alt_2"])
            $(".ghost_clear").addClass(["ghost_clear_alt_2"])
        }
    }
}

function toggleVoicePrefix(){
    voice_prefix = document.getElementById("voice_prefix").checked
}

async function toggleKeepAlive(elem){
    if (elem.checked){
        try {
            if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');

            // Reset the variable if the system releases it automatically
            wakeLock.addEventListener('release', () => {
                wakeLock = null;
                document.getElementById("keep_alive").checked = false
            });
            } else {
                console.error("Wake Lock not supported on this browser.");
                document.getElementById("keep_alive").checked = false
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
            document.getElementById("keep_alive").checked = false
        }
    }
    else{
        if (wakeLock !== null) {
            await wakeLock.release();
            wakeLock = null;
            return;
        }
    }
}

function showResetMenu(event){

    if(Object.keys(data_user).length > 0){
        event.preventDefault()
        event.stopPropagation() //important!!

        let resetMenu = $("#resetMenu");
        resetMenu.css({top: event.y - resetMenu.height(), left: event.x, position:'absolute'})
        resetMenu.show()
    }
}

function hideResetMenu(event) {
    if(event.target.id !== 'resetMenu'){
        let resetMenu = $("#resetMenu");
        resetMenu.hide()
      }
}

function resetGhosts(skip_filter=false){
    var ghosts = document.getElementsByClassName("ghost_card")
    for (var i = 0; i < ghosts.length; i++){
        state['ghosts'][ghosts[i].id] = 1
        $(ghosts[i]).removeClass(['permhidden',"selected","guessed","died","faded"])
        $(ghosts[i].querySelector(".ghost_name")).removeClass(["strike"])
    }

    if(!skip_filter){
        setCookie("tos_state",JSON.stringify(state),1)
        filter()
    }
}

function resetFilters(skip_filter=false){
    for(var i = 0; i < Object.keys(all_evidence).length; i++){
        let e = document.getElementById(Object.keys(all_evidence)[i])
        $(e).removeClass(["block"])
        e.querySelector("#checkbox").className = "neutral"
        $(e.querySelector(".label")).removeClass(["strike","disabled-text"]);
        state['evidence'][Object.keys(all_evidence)[i]] = 0
    }

    setCyclerValue("speed",'-')
    setCyclerValue("los-speed",'-')
    setCyclerValue("holy-water",'-')
    setCyclerValue("candle-interaction",'-')
    setCyclerValue("light-interaction",'-')
    setCyclerValue("radio-interaction",'-')
    setCyclerValue("rem-interaction",'-')


    if(!skip_filter){
        setCookie("tos_state",JSON.stringify(state),1)
        filter()
    }
}

function resetNoSave(){
    resetGhosts(true)
    resetFilters(true)
    setCookie("tos_state",JSON.stringify(state),1)
    filter()
}

function reset(skip_continue_session=false){

    var ready = true
    if(!skip_continue_session){
        ready = continue_session()
    }

    if(ready){
        send_reset_link()
        state['settings'] = JSON.stringify(user_settings)
        saveSettings(true)

        fetch("https://zero-network.net/zn/"+znid+"/end?game=the-other-side",{method:"POST",body:JSON.stringify(state),signal: AbortSignal.timeout(2000)})
        .then((response) => {
            setCookie("tos_znid",znid,-1)
            setCookie("tos_prev-znid",znid,30)
            setCookie("tos_state",JSON.stringify(state),-1)
            location.reload()
        })
        .catch((response) => {
            setCookie("tos_znid",znid,-1)
            setCookie("tos_prev-znid",znid,30)
            setCookie("tos_state",JSON.stringify(state),-1)
            location.reload()
        });
    }
}

