function getCookie(e){let t=e+"=",i=decodeURIComponent(document.cookie).split(";");for(let n=0;n<i.length;n++){let o=i[n];for(;" "==o.charAt(0);)o=o.substring(1);if(0==o.indexOf(t))return o.substring(t.length,o.length)}return""}
function setCookie(e,t,i){let n=new Date;n.setTime(n.getTime()+864e5*i);let o="expires="+n.toUTCString();document.cookie=e+"="+t+";"+o+";path=/"}

let openSearchTab = false
let ghost_version = null

function setLoading(percent) {
    const bar = document.getElementById("loading-bar");
    percent = Math.max(0, Math.min(100, percent));
    bar.style.width = percent + "%";
}

function checkLink(){
    return new Promise((resolve, reject) => {
        params = new URL(window.location.href).searchParams

        if (params.get("id")){
            data_link = {
                "id":params.get("id"),
                "username":params.get("username"),
                "avatar":params.get("avatar"),
                "last_linked":params.get("last_linked"),
                "type":params.get("type")
            }

            znid = getCookie("tos_znid")

            setCookie("data_link",JSON.stringify(data_link),30)
            fetch(`https://zero-network.net/zn/${znid}/attach/${data_link['id']}?game=the-other-side`, {method:"POST",signal: AbortSignal.timeout(6000)})
            .then(data => {
                window.location.href = window.location.href.split("?")[0]
            })
            
        }

        if (params.get("reset")){
            setCookie("tos_state","",-1)
            setCookie("tos_settings","",-1)
            window.location.href = window.location.href.split("?")[0]
            
        }

        if (params.get('journal')){
            setCookie("tos_room_id",params.get('journal'),1)
            window.location.href = window.location.href.split("?")[0]
        }

        if (params.get('lang')){
            lang = params.get('lang').toLowerCase()
            setCookie("tos_lang",lang,90)
        }

        if (params.get("search")){
            openSearchTab = true
        }

        if (params.get("version")){
            ghost_version = params.get('version')
        }

        resolve("URL parsed")
    })
}

function heartbeat(){
    if(znid != "no-connection-to-server"){
        state['settings'] = JSON.stringify(user_settings)
        fetch("https://zero-network.net/zn/"+znid+"?game=the-other-side",{method:"POST",Accept:"application/json",body:JSON.stringify(state),signal: AbortSignal.timeout(10000)})
        .then(response => response.json())
        .then(data => {
            $("#active-users-label").text(lang_data['{{active_users}}']+ ": " + data['active_num_users'])
        })
        .catch(response => {
            console.error(response)
            $("#active-users-label").text(lang_data['{{active_users}}']+ ": -")
        });
    }
    else {
        $("#active-users-label").text(lang_data['{{active_users}}']+ ": -")
    }
}

function loadAllAndConnect(){
    let loadZN = new Promise((resolve, reject) => {
        znid = getCookie("tos_znid")
        pznid = getCookie("tos_prev-znid")
        if(znid && znid!="no-connection-to-server"){
            $("#session").text(`C: ${znid}`)
            $("#prev-session").text(`P: ${pznid == '' ? '-' : pznid}`)

            if(znid!="no-connection-to-server"){
                $('#room_id').val("")
                $('#room_id').css('color',"#CCC")
                $('#room_id').prop('disabled',false)
                $('#room_id_create').show()
                $('#room_id_link').show()
                $('#link_id_create').show()
                mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
                if(!mquery.matches && navigator.platform.toLowerCase().includes('win'))
                    $('#link_id_create_launch').show()
            }
            else{
                $('#room_id').val("Can't Connect!")
                $('#link_id').val("Can't Connect!")
            }
            resolve("Loaded existing session")
        }
        else{
            var id;
            try{
                id = JSON.parse(getCookie("data_link"))['id'];
            } catch(Error) {
                id = false;
            }
            fetch(`https://zero-network.net/zn/?lang=${lang}${id ? '&discord_id='+id : ''}&game=the-other-side`,{headers:{Accept:"application/json"}, signal: AbortSignal.timeout(10000)})
            .then(e=>e.json())
            .then(e => {
                znid = e.znid
                setCookie("tos_znid",e.znid,1)

                $("#session").text(`C: ${e.znid}`)
                $("#prev-session").text(`P: ${pznid == '' ? '-' : pznid}`)

                $('#room_id').val("")
                $('#room_id').css('color',"#CCC")
                $('#room_id').prop('disabled',false)
                $('#room_id_create').show()
                $('#room_id_link').show()
                $('#link_id_create').show()
                mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
                if(!mquery.matches && navigator.platform.toLowerCase().includes('win'))
                    $('#link_id_create_launch').show()
            })
            .then(x =>{
                resolve("New session created")
            })
            .catch(response => {
                znid = 'no-connection-to-server'
                console.log(response)
                console.warn("Possible latency issues!")
                setCookie("tos_znid","no-connection-to-server",1)
                $('#room_id').val("Can't Connect!")
                $('#link_id').val("Can't Connect!")
                $("#session").text("no-connection-to-server")
                $("#prev-session").text(`P: ${pznid == '' ? '-' : pznid}`)
                reject("Unable to connect")
            })
        }
    })

    let loadData = new Promise((resolve, reject) => {

        lang = getCookie("tos_lang")

        if(!lang){
            lang = 'en'
        }
        try{
            let dif_html = ""
            for (const [key, value] of Object.entries(difficulties)) {
                dif_html += `<option value="${key}">${value.name}</option>`
            }
            document.getElementById("num_evidence").innerHTML = dif_html

            fetch(`https://zero-network.net/the-other-side/data/ghosts.json?${ghost_version ? ('&version='+ghost_version) : ''}`, {cache: 'default', signal: AbortSignal.timeout(10000)})
            .then(data => data.json())
            .then(data => {

                all_ghosts = Object.fromEntries(data.ghosts.map(a => [a.ghost,a.name]))
                all_evidence = data.evidence

                var cards = document.getElementById('cards')
                var wiki = document.getElementById('wiki-0-evidence-data')
                var cur_version = document.getElementById('current-version-label')
                var evidence_list = document.getElementById('evidence')
                var evidence_list_fake = document.getElementById('evidence-fake')
                var evidence_list_cleanse = document.getElementById('evidence-cleanse')
        
                evidence_list.innerHTML = "";
                evidence_list_fake.innerHTML = "";
                evidence_list_cleanse.innerHTML = "";

                Object.entries(data.evidence).forEach(([key,value]) => {
                    evidence_list.innerHTML += `
                    <div class="evidence-row">
                        <button id="${key}" class="tricheck white" name="evidence" onclick="tristate(this)" value="${key}">
                            <div id="checkbox" class="neutral"><span class="icon"></span></div>
                            <div class="label">${key}</div>
                        </button>
                    </div>
                    `
                    evidence_list_fake.innerHTML += `
                    <div class="evidence-row">
                        <button id="${key}-fake" class="tricheck white" name="evidence-fake" onclick="${key == 'Freezing'? 'tristate(this)' : 'quadstate(this)'}" value="${key}">
                            <div id="checkbox" class="neutral"><span class="icon"></span></div>
                            <div class="label">${key}</div>
                        </button>
                    </div>
                    `
                    evidence_list_cleanse.innerHTML += `
                    <div class="cycler" data-name="${key}-cleanse" data-options='["-",${Array.from(value).map(e => `"${e}"`).join(",")}]' data-current="0">
                        <div class="cycler-label">${key}</div>
                        <button class="cycler-prev" type="button">&lt;</button>
                        <div class="cycler-value"></div>
                        <button class="cycler-next" type="button">&gt;</button>
                        <input type="hidden">
                        <div class="cycler-counter"></div>
                    </div>
                    `
                })
        
                cards.innerHTML = "<div id='control_hints'>{{tap_int}}<br>{{dbl_tap_int}}</div><div id='all_control' class='all_control'><div id='expand_all' onclick='expandAll()'>{{expand_all}}</div><div id='collapse_all' onclick='collapseAll()'>{{collapse_all}}</div></div>";
                wiki.innerHTML = "";
                for(var i = 0; i < data.ghosts.length; i++){
                    bpm_speeds.add(data.ghosts[i].min_speed)
                    if(data.ghosts[i].max_speed != null){bpm_speeds.add(data.ghosts[i].max_speed)}
                    if(data.ghosts[i].alt_speed != null){bpm_speeds.add(data.ghosts[i].alt_speed)}
                    var ghost = new Ghost(data.ghosts[i],data.evidence);
                    cards.innerHTML += `${ghost.ghostTemplate}`
                    wiki.innerHTML += (i == data.ghosts.length-1 ? `${ghost.wikiTemplate.replace("&#9500;","&#9492;")}` : `${ghost.wikiTemplate}`)
                }
                cur_version.innerHTML = `${data.version}`
            })
            .then(data => {
                var raw_state = getCookie("tos_state")

                if (!raw_state || raw_state == '' || raw_state == null){
                    console.log("No State found")
                    for (var i = 0; i < Object.keys(all_evidence).length; i++){
                        state["evidence"][Object.keys(all_evidence)[i]] = 0
                    }
                    for (var i = 0; i < Object.keys(all_ghosts).length; i++){
                        state["ghosts"][Object.keys(all_ghosts)[i]] = 1
                    }

                    var read_state = JSON.parse(JSON.stringify(state))
                }
                else{
                    var read_state = JSON.parse(raw_state)
                }

                let us = getCookie("tos_settings")
                if (us && us != '' && us != null)
                    us = JSON.parse(us)
                else
                    us = user_settings

                for (const [key, value] of Object.entries(read_state["evidence"])){ 
                    let num_fake = 0
                    if (us['num_evidences'] == '-1' || us['num_evidences'].match(/[A-K]{4}-[A-K]{4}-[A-K]{4}/g)){
                        num_fake = parseInt(us['cust_fake_evidences'] ?? 0)
                    }
                    else{
                        num_fake = difficulties[legacy_correct[us['num_evidences']??'3N']??us['num_evidences']].fake
                    }
                    if (num_fake > 0){
                        if (value == 2){
                            quadstate(document.getElementById(key+"-fake"));
                        }
                        else if (value == 1){
                            quadstate(document.getElementById(key+"-fake"));
                            quadstate(document.getElementById(key+"-fake"));
                        }
                        else if (value == -1){
                            quadstate(document.getElementById(key+"-fake"));
                            quadstate(document.getElementById(key+"-fake"));
                            quadstate(document.getElementById(key+"-fake"));
                        }
                    }
                    else{
                        if (value == 1){
                            tristate(document.getElementById(key));
                        }
                        else if (value == -1){
                            tristate(document.getElementById(key));
                            tristate(document.getElementById(key));
                        }
                    }
                }

                for (const [key, value] of Object.entries(read_state['ghosts'])){ 
                    if (value == 0){
                        fade(document.getElementById(key), true);
                    }
                    else if (value == -2){
                        died(document.getElementById(key), true, true);
                    }
                    else if (value == -1){
                        remove(document.getElementById(key), true, true);
                    }
                    else if (value == 2){
                        select(document.getElementById(key), true, true);
                    }
                    else if (value == 3){
                        guess(document.getElementById(key), true, true);
                    }
                    else{
                        state['ghosts'][key] = value
                    }
                }

                loadCyclerState(read_state)

            })
            .then(() => {
                let mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
                if(mquery.matches){
                    $("#menu").show()
                    setTimeout(() => {
                        updateScaling()
                        $("#control_hints")[0].scrollIntoView({behavior: "smooth"})
                    }, 1000)
                }
                resolve("Ghost data loaded")
            })
            .catch(error => {
                console.error(error)
                document.getElementById("page-loading-status").innerText = "failed to load ghost data!"
                reject("Could not load ghost data")
            })
        }
        catch{
            document.getElementById("page-loading-status").innerText = "failed to load ghost data!"
            reject("Could not load ghost data")
        }
    })

    let loadMaps = new Promise((resolve, reject) => {
        fetch("https://zero-network.net/the-other-side/data/maps", {cache: 'default', signal: AbortSignal.timeout(12000)})
        .then(data => data.json())
        .then(data => {
            var map_html = ""
            var usr_set = {}
            try{
                let cur_settings = getCookie("tos_settings")
                usr_set = JSON.parse(cur_settings)
            }
            catch(e){
                console.warn(`Error loading settings! Loading defaults...`)
                usr_set = user_settings
            }
            
            var usr_map = usr_set.hasOwnProperty('map') ? usr_set['map']: "ravenwood"

            for(var i = 0; i < data.length; i++) {
                all_maps[data[i]['div_id']] = data[i]['file_url']
                if(data[i]['event_url'])
                    all_maps[`${data[i]['div_id']}-e`] = data[i]['event_url']
                map_html += `<button class="maps_button${data[i]['div_id'] == usr_map ? " selected_map" : ""}" id="${data[i]['div_id']}" onclick="changeMap(this,'${data[i]['file_url']}');send_cur_map_link();saveSettings();"><div class="map_size ${data[i]['size'].toLowerCase()}">${data[i]['size']}</div>${data[i]['name']}${data[i]['event_url'] ? '<div class="event_map">★</div>' : ''}</button>`
            }
            $("#maps_list").html(map_html)

            resolve("Map data loaded")
        })
        .catch(error => {
            console.error(error)
            document.getElementById("page-loading-status").innerText = "failed to load map data!"
            reject("Failed to load map data")
        })

    })

    setLoading(25)
    document.getElementById("page-loading-status").innerText = "loading language data..."
    Promise.all([load_translation()])
    .then(() => {
        setLoading(40)
        document.getElementById("page-loading-status").innerText = "loading ghost & map data..."
        Promise.all([loadZN,loadData,loadMaps])
        .then(() => {
            setLoading(80)
            document.getElementById("page-loading-status").innerText = "translating page..."
            Promise.all([translate(lang)])
            .then(() => {
                Promise.all([fallback_translate(lang)])
                .then(() => {
                    setLoading(90)
                    document.getElementById("page-loading-status").innerText = "translating wiki..."
                    Promise.all([translate_wiki(lang)])
                    .then(() => {
                        Promise.all([fallback_translate_wiki(lang)])
                        .then(() => {
                            setLoading(99)
                            document.getElementById("page-loading-status").innerText = "loading user settings..."
                            Promise.all([getLink()])
                            .then(() => {
                                buildSelectors()
                                setLoading(100)
                                loadSettings()
                                filter(true)
                                applyPerms()
                                auto_link()
                                openWikiFromURL()
                                loadSearch()
                                try{heartbeat()} catch(Error){console.warn("Possible latency issues!")}
                                setInterval(function(){
                                    if(!document.hidden){
                                        try{heartbeat()} catch(Error){console.error("Heartbeat failed!")}
                                    }
                                }, 300000)
                            })
                        })
                    })
                })
            })
        })
        .catch(e => {
            // Maintenance Block
            $("#maintenance-block").fadeIn(1000)
        })
    })
}

function loadSearch(){
    mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
    params = new URL(window.location.href).searchParams
    if(!mquery.matches && openSearchTab){
        document.getElementById("search_bar").value = params.get("search")
        showSearch()
        search()
        let url = new URL(window.location.href)
        url.searchParams.delete("search")
        history.replaceState(history.state,"",url.href)
    }
}


function copy_user_settings(){
    var copyText = JSON.stringify(user_settings)
    ZNCopyShare(copyText,"Copy User Settings")
    document.getElementById("debug-console").value += "User Settings copied to clipboard\n"
}


function force_reload(){
    const url = new URL(location.href);
    url.searchParams.set("refresh", "1");
    location.href = url.toString();
}

(function devToolsDetector() {
    let devtoolsOpen = false;

    function detectDevTools() {
        return (
            window.outerWidth - window.innerWidth > 160 ||
            window.outerHeight - window.innerHeight > 160
        );
    }

    function onDevToolsOpen() {
        const blue = 'color:#5cc0ff;font-weight:bold';
        const red = 'color:#ff5c5c;font-weight:bold';
        const gray = 'color:#aaa';
        const green = 'color:#5eff8d;font-weight:bold';

        console.log('%c*******************************************************', blue);
        console.log('%c[ INTRUSION DETECTED ]', red);
        console.log('%cJust kidding! But if you\'re digging for ghost data...', gray);
        console.log('%cWe have a real API waiting for you:', gray);
        console.log('%c>> https://zero-network.net/developer/portal/', green);
        console.log('%cHappy hunting 👻', gray);
        console.log('%c*******************************************************', blue);
    }

    setInterval(() => {
        const open = detectDevTools();

        if (open && !devtoolsOpen) {
            devtoolsOpen = true;
            onDevToolsOpen();
        }

        if (!open && devtoolsOpen) {
            devtoolsOpen = false;
        }
    }, 5000);
})();