const levenshtein_distance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
       track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
       track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
       for (let i = 1; i <= str1.length; i += 1) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
             track[j][i - 1] + 1,
             track[j - 1][i] + 1,
             track[j - 1][i - 1] + indicator,
          );
       }
    }
    return track[str2.length][str1.length];
 };

 let running_log = []
 let listen_next = false

 $.fn.isInViewport = function () {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();
  
    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + window.innerHeight;
  
    return elementBottom > viewportTop && elementTop < viewportBottom;
}

function reset_voice_status(){
    setTimeout(function(){
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
        document.getElementById("voice_recognition_status").className = "pulse_animation"
    },1000)
}

function domovoi_show_last(){
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
}

function domovoi_hide_last(){
    $("#domovoi-text").hide()
    $("#domovoi-img").attr("src","imgs/domovoi.png")
}


function domovoi_heard(message){
    $("#domovoi-text").text(message.toLowerCase())
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
    setTimeout(function() {
        $("#domovoi-text").hide()
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },2000)
}

function domovoi_not_heard(){
    $("#domovoi-img").attr("src",user_settings['domo_side'] == 1 ? "imgs/domovoi-guess-flip.png" : "imgs/domovoi-guess.png")
    setTimeout(function() {
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },3000)
}

function domovoi_print_logs(){
    console.log("----------------------------------------------------------------")
    console.log("Domo memory:")
    running_log.forEach(function (item,idx){
        console.log(`--${idx}--`)
        for (const [key, value] of Object.entries(item)) {
            console.log(`${key}: ${value}`)
        }
    })
    console.log("----------------------------------------------------------------")
}

function parse_speech(vtext){
    vtext = vtext.toLowerCase().trim()
    running_log.push({
        "Time":new Date().toJSON().replace('T', ' ').split('.')[0],
        "Raw":vtext
    })
    if(running_log.length > 5){
        running_log.shift()
    }
    let cur_idx = running_log.length - 1

    domovoi_msg = ""

    for (const [key, value] of Object.entries(ZNLANG['overall'])) {
        for (var i = 0; i < value.length; i++) {
            vtext = vtext.replace(value[i], key);
        }
    }

    running_log[cur_idx]["Cleaned"] = vtext

    if(voice_prefix && (vtext.startsWith("domo") || vtext.startsWith("hey domo") || vtext.startsWith("okay domo"))){
        vtext = vtext.replace("okay domo","").replace("hey domo","").replace("domo").trim()
        if (vtext == ""){
            console.log("Domo awaiting command!")
            $("#domovoi-img").attr("src",user_settings['domo_side'] == 1 ? "imgs/domovoi-attention-flip.png" : "imgs/domovoi-attention.png")
            listen_next = true
            return
        }
    }
    else if(voice_prefix && !listen_next){
        return
    }

    listen_next = false

    if(vtext.startsWith('ghost')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized ghost command")
        running_log[cur_idx]["Type"] = "ghost"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('ghost', "").trim()
        domovoi_msg += "marked "

        var smallest_ghost = "Spirit"
        var smallest_val = 100
        var vvalue = 0
        if(vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith("knight ") || 
            vtext.startsWith("night ") || vtext.startsWith("is not ") || vtext.startsWith("is knot ")){
            vtext = vtext.replace('is not ', "").replace('is knot ', "").replace('knot ', "").replace('not ', "").replace('knight ', "").replace('night ', "").trim()
            vvalue = 0
            domovoi_msg += "not "
        }
        else if(vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear")){
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ","").replace("on due ","").replace("clear ","").trim()
            vvalue = 0
            domovoi_msg = "cleared "
        }
        else if(vtext.startsWith("guess ") || vtext.startsWith("might be ")){
            vtext = vtext.replace('guess ', "").replace('might be ', "").trim()
            vvalue = 3
            domovoi_msg = "guessed "
        }
        else if(vtext.startsWith("select ") || vtext.startsWith("deselect ") || vtext.startsWith("is ")){
            vtext = vtext.replace('deselect ', "").replace('select ', "").replace("is ", "").trim()
            vvalue = 2
            domovoi_msg = "selected "
        }
        else if(vtext.startsWith("hide ") || vtext.startsWith("remove ") || vtext.startsWith("removes ")){
            vtext = vtext.replace('hide ', "").replace('removes ', "").replace('remove ', "").trim()
            vvalue = -1
            domovoi_msg = "removed "
        }
        else if(vtext.startsWith("dead ") || vtext.startsWith("killed by ") || vtext.startsWith("killed ")){
            vtext = vtext.replace('dead ', "").replace('killed by ', "").replace('killed ', "").trim()
            vvalue = -2
            domovoi_msg = "killed by "
        }
        else if(vtext.startsWith("show ") || vtext.startsWith("data ") || vtext.startsWith("info ")){
            vtext = vtext.replace('show ', "").replace('data ', "").replace('info ', "").trim()
            vvalue = -10
            domovoi_msg = "showing info for "
        }
        else if(vtext.startsWith("test ") || vtext.startsWith("tests ")){
            vtext = vtext.replace('tests ', "").replace('test ', "").trim()
            vvalue = -11
            domovoi_msg = "showing tests for "
        }

        // Common fixes to ghosts
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['ghosts'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_ghosts).length; i++){
            var leven_val = levenshtein_distance(Object.keys(all_ghosts)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_ghost = Object.keys(all_ghosts)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_ghost}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_ghost}`
        domovoi_msg += smallest_ghost

        if (vvalue == 0){
            fade(document.getElementById(smallest_ghost));
        }
        else if (vvalue == 3){
            guess(document.getElementById(smallest_ghost));
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == 2){
            select(document.getElementById(smallest_ghost));
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == -1){
            remove(document.getElementById(smallest_ghost));
        }
        else if (vvalue == -2){
            died(document.getElementById(smallest_ghost));
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if(vvalue == -10){
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})

            send_ghost_data_link(smallest_ghost)
        }
        else if(vvalue == -11){
            if(!$(document.getElementById(smallest_ghost)).isInViewport())
                document.getElementById(smallest_ghost).scrollIntoView({alignToTop:true,behavior:"smooth"})

            openGhostInfo(smallest_ghost)
            send_ghost_tests_link(smallest_ghost)
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('evidence')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidence command")
        running_log[cur_idx]["Type"] = "evidence"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('evidence', "").trim()
        domovoi_msg += "marked evidence as "

        var smallest_evidence = "emf 5"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith("knight ")|| vtext.startsWith("night ")){
            vtext = vtext.replace('knot ', "").replace('not ', "").replace('knight ', "").replace('night ', "").trim()
            vvalue = -1
            domovoi_msg += "not "
        }
        else if(vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear")){
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ","").replace("on due ","").replace("clear ","").trim()
            vvalue = 0
            domovoi_msg = "cleared "
        }

        // Common replacements for evidence names
        var prevtext = vtext;
        vtext = vtext.replace("ghost ","").trim()
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }


        for(var i = 0; i < Object.keys(all_evidence).length; i++){
            var leven_val = levenshtein_distance(Object.keys(all_evidence)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = Object.keys(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += smallest_evidence

        if(!$(document.getElementById(smallest_evidence).querySelector("#checkbox")).hasClass("block")){
            while (!document.getElementById(smallest_evidence).querySelector("#checkbox").classList.contains({"1":"good","-1":"bad","0":"neutral"}[vvalue.toString()])){
                tristate(document.getElementById(smallest_evidence),true);
            }
            filter();
        }
        else{
            domovoi_msg = `Evidence ${smallest_evidence} is locked!`
        }
        

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('speed') || vtext.startsWith('feed')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized speed command")
        running_log[cur_idx]["Type"] = "speed"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('speed', "").replace('feed', "").trim()
        domovoi_msg += "marked speed "

        var smallest_speed = "normal"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith("knight ")|| vtext.startsWith("night ")){
            vtext = vtext.replace('knot ', "").replace('not ', "").replace('knight ', "").replace('night ', "").trim()
            vvalue = 0
            domovoi_msg += "not "
        }
        else if(vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear")){
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ","").replace("on due ","").replace("clear ","").trim()
            vvalue = -1
            domovoi_msg = "cleared "
        }

        if (vvalue == -1){
            vvalue = 0
        }

        // Common replacements for speed
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['speed'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < all_speed.length; i++){
            var leven_val = levenshtein_distance(all_speed[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_speed = all_speed[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_speed}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_speed}`
        domovoi_msg += smallest_speed

        if(!$(document.getElementById(smallest_speed).querySelector("#checkbox")).hasClass("block")){
            while (!document.getElementById(smallest_speed).querySelector("#checkbox").classList.contains({"1":"good","0":"neutral"}[vvalue.toString()])){
                dualstate(document.getElementById(smallest_speed));
            }
        }
        else{
            domovoi_msg = `Speed ${smallest_speed} is locked!`
        }
        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('los') ||vtext.startsWith('los speed') || vtext.startsWith('loss speed') || vtext.startsWith('line of sight speed') ){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized line of sight speed command")
        running_log[cur_idx]["Type"] = "speed"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('los speed', "").replace('loss speed', "").replace('line of sight speed', "").replace('los', "").trim()
        domovoi_msg += "marked los speed "

        var smallest_speed = "normal"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith("knight ")|| vtext.startsWith("night ")){
            vtext = vtext.replace('knot ', "").replace('not ', "").replace('knight ', "").replace('night ', "").trim()
            vvalue = 0
            domovoi_msg += "not "
        }
        else if(vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear")){
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ","").replace("on due ","").replace("clear ","").trim()
            vvalue = -1
            domovoi_msg = "cleared "
        }

        if (vvalue == -1){
            vvalue = 0
        }

        // Common replacements for speed
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['los_speed'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < all_los_speed.length; i++){
            var leven_val = levenshtein_distance(all_los_speed[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_speed = all_los_speed[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_speed}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_speed}`
        domovoi_msg += smallest_speed

        if(!$(document.getElementById("Los"+smallest_speed).querySelector("#checkbox")).hasClass("block")){
            while (!document.getElementById("Los"+smallest_speed).querySelector("#checkbox").classList.contains({"1":"good","0":"neutral"}[vvalue.toString()])){
                dualstate(document.getElementById("Los"+smallest_speed));
            }
        }
        else{
            domovoi_msg = `LOS Speed ${smallest_speed} is locked!`
        }
        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('holy water')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized holy water command")
        running_log[cur_idx]["Type"] = "holy_water"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('holy water', "").trim()
        domovoi_msg += "marked holy water "

        var smallest_speed = "normal"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith("knight ")|| vtext.startsWith("night ")){
            vtext = vtext.replace('knot ', "").replace('not ', "").replace('knight ', "").replace('night ', "").trim()
            vvalue = 0
            domovoi_msg += "not "
        }
        else if(vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear")){
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ","").replace("on due ","").replace("clear ","").trim()
            vvalue = -1
            domovoi_msg = "cleared "
        }

        if (vvalue == -1){
            vvalue = 0
        }

        // Common replacements for holy water
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['holy_water'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < all_holy_water.length; i++){
            var leven_val = levenshtein_distance(all_holy_water[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_speed = all_holy_water[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_speed}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_speed}`
        domovoi_msg += smallest_speed

        if(!$(document.getElementById("HolyWater"+smallest_speed).querySelector("#checkbox")).hasClass("block")){
            while (!document.getElementById("HolyWater"+smallest_speed).querySelector("#checkbox").classList.contains({"1":"good","0":"neutral"}[vvalue.toString()])){
                dualstate(document.getElementById("HolyWater"+smallest_speed));
            }
        }
        else{
            domovoi_msg = `Holy Water ${smallest_speed} is locked!`
        }
        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext == 'timer start' || vtext == 'timer stop' || vtext == 'cooldown start' || vtext == 'cool down start' || vtext == 'cooldown stop' || vtext == 'cool down stop'){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized cooldown command")
        running_log[cur_idx]["Type"] = "cooldown"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('timer', "").replace('cooldown', "").replace('cool down', "").trim()
        
        if(vtext == "start"){
            domovoi_msg += "started cooldown timer"
            toggle_cooldown_timer(true,false)
            send_cooldown_timer(true,false)
        } 
        else if(vtext == "stop"){
            domovoi_msg += "stopped cooldown timer"
            toggle_cooldown_timer(false,true)
            send_cooldown_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext == 'hunt start' || vtext == 'hunt stop'){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized hunt command")
        running_log[cur_idx]["Type"] = "hunt"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('hunt', "").trim()
        
        if(vtext == "start"){
            domovoi_msg += "started hunt timer"
            toggle_hunt_timer(true,false)
            send_hunt_timer(true,false)
        } 
        else if(vtext == "stop"){
            domovoi_msg += "stopped hunt timer"
            toggle_hunt_timer(false,true)
            send_hunt_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('difficulty')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidence set command")
        running_log[cur_idx]["Type"] = "evidence set"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('difficulty', "").trim()
        domovoi_msg += "set difficulty to "

        var smallest_num = "3"
        var smallest_val = 100
        var prev_value = document.getElementById("num_evidence").value
        var all_difficulty = ["novice","intermediate","expert","master"]

        for(var i = 0; i < all_difficulty.length; i++){
            var leven_val = levenshtein_distance(all_difficulty[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_difficulty[i]
            }
        }
        domovoi_msg += smallest_num

        smallest_num = {"novice":"3N","intermediate":"3I","expert":"3E","master":"3M"}[smallest_num]
        document.getElementById("num_evidence").value =  smallest_num
        if(prev_value != smallest_num){
            checkDifficulty()
            filter()
            updateMapDifficulty(smallest_num)
            showCustom()
            flashMode()
            bpm_calc(true)
            saveSettings()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('show tools') || vtext.startsWith('show filters')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized filter/tool command")
        running_log[cur_idx]["Type"] = "filter/tool"
        console.log(`Heard '${vtext}'`)
        domovoi_msg += "toggled menu"

        toggleFilterTools()

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('show maps') || vtext.startsWith('show map')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "maps"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('show maps', "").replace('show map', "").replace('select map', "").trim()
        domovoi_msg = "showing map"

        var smallest_map = "ravenwood"
        var smallest_val = 100

        if(vtext != ""){

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`

            changeMap(document.getElementById(smallest_map),all_maps[smallest_map])
            send_cur_map_link()
        }

        showSideMenu('maps',true,false)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('select map')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "maps"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('show maps', "").replace('show map', "").replace('select map', "").trim()
        domovoi_msg = "selecting map"

        var smallest_map = "ravenwood"
        var smallest_val = 100

        if(vtext != ""){

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`
        }

        changeMap(document.getElementById(smallest_map),all_maps[smallest_map])
        send_cur_map_link()

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('close maps') || vtext.startsWith('close map') || vtext.startsWith('hide maps') || vtext.startsWith('hide map')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "maps"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "closing map"

        showSideMenu('maps',false, true)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if (vtext.startsWith("event map")){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "maps"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "now showing event maps"

        document.getElementById("map_event_check_box").checked = 1
        changeMap(document.getElementById('maps_list').querySelector('.selected_map'),all_maps[document.getElementById('maps_list').querySelector('.selected_map').id])
        saveSettings()
        send_cur_map_link()

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if (vtext.startsWith("standard map") || vtext.startsWith("regular map")){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "maps"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "now showing standard maps"

        document.getElementById("map_event_check_box").checked = 0
        changeMap(document.getElementById('maps_list').querySelector('.selected_map'),all_maps[document.getElementById('maps_list').querySelector('.selected_map').id])
        saveSettings()
        send_cur_map_link()

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('show description') || vtext.startsWith('show behavior')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized behavior command")
        running_log[cur_idx]["Type"] = "description/behavior"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "showing ghost behaviors"

        toggleDescriptions(true)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('hide description') || vtext.startsWith('hide behavior')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized behavior command")
        running_log[cur_idx]["Type"] = "description/behavior"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "hiding ghost behaviors"

        toggleDescriptions(false)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('reset cheat sheet') || vtext.startsWith('reset journal')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized reset command")
        console.log(`Heard '${vtext}'`)
        if(Object.keys(data_user).length > 0){
            if(!hasSelected()){
                $("#reset").removeClass("standard_reset")
                $("#reset").addClass("reset_pulse")
                $("#reset").html("No ghost selected!<div class='reset_note'>(say 'force reset' to save & reset)</div>")
                $("#reset").prop("onclick",null)
                $("#reset").prop("ondblclick","reset()")
                reset_voice_status()
            }
            else{
                reset()
            }
        }
        else{
            reset()
        }
    }
    else if(vtext.startsWith('force reset')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized reset command")
        console.log(`Heard '${vtext}'`)
        reset()
    }
    else if(vtext.startsWith('stop listening')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized stop listening command")
        console.log(`Heard '${vtext}'`)
        stop_voice()
    }
    else if(vtext.startsWith('disconnect all') || vtext.startsWith('unlink all')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized disconnect command")
        if(hasLink)
            disconnect_room()
        if(hasDLLink)
            disconnect_link(false,false,1000,"Cheat Sheet requested disconnect")
        stop_voice()
    }
    // else if(vtext.startsWith('launch desktop link')){
    //     document.getElementById("voice_recognition_status").className = null
    //     document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
    //     console.log("Recognized launch command")
    //     if (hasDLLink){
    //         domovoi_heard("ZN-Desktop-Link already connected!")
    //     }
    //     else {
    //         domovoi_heard("Launching ZN-Desktop-Link")
    //         create_link(true)
    //     }
        
    // }
    else if(
        vtext.startsWith("hello domo") || vtext.startsWith("hello domovoi")|| vtext.startsWith("hello zero") ||
        vtext.startsWith("hi domo") || vtext.startsWith("hi domovoi")|| vtext.startsWith("hi zero")
    ){
        if(Object.keys(data_user).length > 0){
            domovoi_heard(`hello ${data_user['username']}!`)
        }
        else{
            domovoi_heard("hello!")
        }
        
        reset_voice_status()
    }
    else if(
        vtext.startsWith("move domo") || vtext.startsWith("move domovoi")|| vtext.startsWith("move zero") ||
        vtext.startsWith("domo move") || vtext.startsWith("domovoi move")|| vtext.startsWith("zero move")
    ){
        if (user_settings['domo_side'] == 0){
            $("#domovoi").addClass("domovoi-flip")
            $("#domovoi-img").addClass("domovoi-img-flip")
        }
        else{
            $("#domovoi").removeClass("domovoi-flip")
            $("#domovoi-img").removeClass("domovoi-img-flip")
        }
        saveSettings()
        
        reset_voice_status()
    }
    else{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-not-recognized.png)"
        domovoi_not_heard()
        reset_voice_status()
    }


}

if (("webkitSpeechRecognition" in window || "speechRecognition" in window) && navigator.userAgent.toLowerCase().match(/chrome|edge|crios/) && !('brave' in navigator)) {
    let speechRecognition = new webkitSpeechRecognition() || new SpeechRecognition();
    let speechRecognitionList = new webkitSpeechGrammarList() || new SpeechGrammarList();
    let stop_listen = true

    let ghost_grammar = `#JSGF V1.0; grammar ghosts; public <ghost> = ${Object.keys(all_ghosts).join(" | ")}`
    let evidence_grammar = `#JSGF V1.0; grammar evidence; public <evidence> = ${Object.keys(all_evidence).join(" | ")}`
    let speed_grammar = `#JSGF V1.0; grammar speed; public <speed> = ${all_speed.join(" | ")}`
    let los_speed_grammar = `#JSGF V1.0; grammar los_speed; public <los_speed> = ${all_los_speed.join(" | ")}`
    let holy_water_grammar = `#JSGF V1.0; grammar holy_water; public <holy_water> = ${all_holy_water.join(" | ")}`
    let maps_grammar = `#JSGF V1.0; grammar maps; public <map> = tanglewood | edgefield | ridgeview | grafton | willow | brownstone | bleasdale | sunny meadows | sm | restricted | courtyard | male | female | wing | hospital | prison | maple lodge | woodwind | drive | road | court | farmhouse | high school | campsite | camp`
    let command_grammar = `#JSGF V1.0; grammar commands; public <command> = evidence | speed | los speed | line of sight speed | not | clear | select | remove | undo | timer | cooldown | start | stop | number | of | difficulty | monkey paw | has | line of sight | show | info | filters | tools | percent | map | maps | reset | journal | cheat sheet | stop | listening`

    speechRecognitionList.addFromString(ghost_grammar,1)
    speechRecognitionList.addFromString(evidence_grammar,1)
    speechRecognitionList.addFromString(speed_grammar,1)
    speechRecognitionList.addFromString(los_speed_grammar,1)
    speechRecognitionList.addFromString(holy_water_grammar,1)
    speechRecognitionList.addFromString(maps_grammar,1)
    speechRecognitionList.addFromString(command_grammar,1)

    speechRecognition.grammars = speechRecognitionList
  
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'en-US';
  
    speechRecognition.onend = () => {
        if(!stop_listen){
            let auto = true
            speechRecognition.start();
        }
    }

    speechRecognition.onspeechstart = () =>{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-listening.png)"
    }

    speechRecognition.onerror = (error) =>{
        if(error.error != "no-speech")
            console.log(error)
    }
  
    speechRecognition.onresult = (event) => {
        let final_transcript = "";
  
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript = event.results[i][0].transcript;
            }
        }

        final_transcript = final_transcript.replace(/[.,;:-]/g, '')
        parse_speech(final_transcript);
    };
    
    function start_voice(auto=false){
        stop_listen = false
        if(!auto){
            document.getElementById("start_voice").disabled = true
            document.getElementById("stop_voice").disabled = false
            document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
            document.getElementById("voice_recognition_status").className = "pulse_animation"
            document.getElementById("voice_recognition_status").style.display = "block"
            $("#domovoi").show()
            setCookie("tos_voice_recognition_on",true,0.0833)
        }
        speechRecognition.start();
    }

    function stop_voice(){
        stop_listen = true
        document.getElementById("start_voice").disabled = false
        document.getElementById("stop_voice").disabled = true
        document.getElementById("voice_recognition_status").style.display = "none"
        setCookie("tos_voice_recognition_on",false,-1)
        $("#domovoi").hide()
        speechRecognition.stop();
    }

  } else {
    document.getElementById("start_voice").disabled = true
    document.getElementById("stop_voice").disabled = true
    document.getElementById("start_voice").style.display = "none"
    document.getElementById("stop_voice").style.display = "none"
    document.getElementById("voice_recognition_note").innerHTML = "Browser not supported"
    console.log("Speech Recognition Not Available");
  }

