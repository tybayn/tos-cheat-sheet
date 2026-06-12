function titleCase(str) {
    return str.toLowerCase().split(' ').map(function (word) {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

evi_color = {
    "Audio": "#d18c5e", 
    "EMF 20+": "#db4d48",
    "Freezing": "#9ae0f7",
    "Radiation": "#2ccc29",
    "UV": "#ad8ce7",
    "Writing": "#4d8ce3",
}

evi_icons = {
    "Audio": "imgs/audio-icon.png", 
    "EMF 20+": "imgs/emf5-icon.png",
    "Freezing": "imgs/freezing-icon.png",
    "Radiation": "imgs/radiation-icon.png",
    "UV": "imgs/fingerprints-icon.png",
    "Writing": "imgs/writing-icon.png",
}


class Ghost {
    constructor(data,evidence){
        mquery = window.matchMedia("screen and (pointer: coarse) and (max-device-width: 600px)")
        this.ghostTemplate = `
        <div class="ghost_card" id="${data.ghost}">
            <div class="ghost_name" onclick="toggleGhostExpand(this)">${data.name}</div>
            <div class="ghost_hunt_info">
                <div class="ghost_hunt_entry ${data.speed > 2.35 ? 'high' : data.speed < 2.35 ? 'low' : ''}">
                    <div class="footstep_los">
                        <img src="imgs/footsteps.png" style="filter: invert(1);">
                        <img src="imgs/los.png" title="LOS Speed" style="margin-bottom: -5px; opacity: 0.7;">
                    </div>
                    <div class="ghost_hunt_values">
                        <div class="speed_item">${parseFloat(data.speed).toFixed(2)}<span class="ms">m/s</span><span class="sound" onclick="toggleSound(${data.speed},'${data.ghost}0')">&#128266;</span></div>
                        <div class="speed_item_alt" style="opacity: 0.7;">${parseFloat(data.los_speed).toFixed(2)}<span class="ms">m/s</span></div>
                    </div>
                </div>
                <div class="ghost_hunt_entry ${data.holy_water > 3 ? 'low' : data.holy_water < 3 ? 'high' : ''}">
                    <div class="footstep_los">
                        <img src="imgs/holy-water.png" title="Holy Water Duration">
                    </div>
                    <div class="ghost_hunt_values_h">
                        ${data.holy_water}<span class="ms">s</span>
                    </div>
                </div>
                <div class="ghost_hunt_entry ${data.cooldown > 60 ? 'high' : data.cooldown < 60 ? 'low' : ''}">
                    <div class="footstep_los">
                        <img src="imgs/stopwatch.png" title="Cooldown Duration">
                    </div>
                    <div class="ghost_hunt_values_h">
                        ${data.cooldown}<span class="ms">s</span>
                    </div>
                </div>
            </div>
            <div class="ghost_evidence" onclick="toggleGhostExpand(this)">
                ${this.build_evidence_item(data.evidence[0],evidence[data.evidence[0]],mquery.matches)}
                ${this.build_evidence_item(data.evidence[1],evidence[data.evidence[1]],mquery.matches)}
                ${this.build_evidence_item(data.evidence[2],evidence[data.evidence[2]],mquery.matches)}
            </div>

            <div class="ghost_behavior" onpointerup="doubleTap(toggleGhostExpand, event, this)">
                <div class="ghost_evidence_internal">
                    ${mquery.matches ? this.build_evidence_item(data.evidence[0],evidence[data.evidence[0]]) : ''}
                    ${mquery.matches ? this.build_evidence_item(data.evidence[1],evidence[data.evidence[1]]) : ''}
                    ${mquery.matches ? this.build_evidence_item(data.evidence[2],evidence[data.evidence[2]]) : ''}
                </div>
                <div class="ghost_tests_button" onClick="openGhostInfo('${data.ghost}')">{{0_evidence_tests}} >></div>
                ${this.behavior(data.wiki)}
                <div class="ghost_extra">
                    ${document.getElementById("wiki-extra-"+data.ghost.replace(" ","-").toLowerCase()) ? "<div class=\"ghost_extra_button\" onClick=\"openWikiPath('ghost-data.extra-"+data.ghost.replace(" ","-").toLowerCase()+"')\">[{{more_details}}]</div>" : ''}
                </div>
            </div>
            <div class="ghost_clear">
                <img class="card_icon card_icon_select" title="{{select_ghost}}" src="imgs/select.png" onclick="select(this.parentElement.parentElement)">
                <img class="card_icon card_icon_guess" title="{{guess_ghost}}" style="display:none;" src="imgs/guess.png" onclick="guess(this.parentElement.parentElement)">
                <img class="card_icon card_icon_not" title="{{not_ghost}}" src="imgs/not.png" onclick="fade(this.parentElement.parentElement)" ondblclick="remove(this.parentElement.parentElement)">
                <img class="card_icon card_icon_died" title="{{died_to_ghost}}" style="display:none;" src="imgs/died.png" onclick="died(this.parentElement.parentElement)">
            </div>
            <div class="ghost_guesses"></div>
            <div class="ghost_expand" onclick="toggleGhostExpand(this)">▼ Show More ▼</div>
        </div>
        `

        this.wikiTemplate = `
        <div id="wiki-0-evidence-${data.ghost.replace(" ","-").toLowerCase()}" class="wiki_title accordian" onclick="accordian(this)"><div class="wiki_subtitle"><div class="wiki_crumb">&#9500;</div> ${data.name}</div></div>
        <div class="wiki_details" style="height: 0px;">
            <div class="text">
                <p><b>{{abilities_behaviors_tells}}</b></p>
                ${Object.keys(data.wiki).length > 0 ? this.build_tells(data.wiki["candles"],data.wiki["rem"],data.wiki["lights"],data.wiki["radios"],data.wiki["tells"],data.wiki["behavior"],data.wiki["abilities"],data.wiki["interactions"]) : ""}
                <p><b>{{confirmation_tests}}</b> †</p>
                ${Object.keys(data.wiki).length > 0 ? this.build_confirmation_tests(data.ghost,data.name,data.wiki["confirmation_tests"]) : ""}
                <p><b>{{elimination_tests}}</b></p>
                ${Object.keys(data.wiki).length > 0 ? this.build_elimination_tests(data.ghost,data.name,data.wiki["elimination_tests"]) : ""}
            </div>
            <div onclick="generateWikiShareLink(this);" class="wiki-share">{{copy_share_link}} <img loading="lazy" src="imgs/share.png"></div>
        </div>
        `
    }

    build_evidence_item(evidence,evidence_name,wordless=false){
        
        return `<div class="ghost_evidence_item" ${evidence in evi_color ? 'style=\"color:' + evi_color[evidence] + ' !important;\"' : ''} name="${evidence}"><img src="${evi_icons[evidence]}">${wordless ? '' : evidence_name}</div>`
    }

    build_tells(candles,rem,lights,radios,tells,behavior,abilities,interactions){
        var data = `<div class="interaction-icons">`
    
        if (candles != null)
            data += `<div class="interaction-item"><img src="imgs/candle-icon.png">${candles}</div>`

        if (rem != null)
            data += `<div class="interaction-item"><img src="imgs/rem-icon.png">${rem}</div>`

        if (lights != null)
            data += `<div class="interaction-item"><img src="imgs/bulb-icon.png">${lights}</div>`

        if (radios != null)
            data += `<div class="interaction-item"><img src="imgs/radio-icon.png">${radios}</div>`

        data += `</div><ul>`

        for(var i in tells){
            if(tells[i]["is_0_evi"]){
                data += `<li><b>{{tell}}</b>: ${tells[i]["data"]}`
                if(tells[i].hasOwnProperty("note"))
                    data += `<br><i>{{note}}: ${tells[i]["note"]}</i>`
                data += "</li>"
            }
        }

        for(var i in behavior){
            if(behavior[i]["is_0_evi"]){
                data += `<li><b>{{behavior}}</b>: ${behavior[i]["data"]}</li>`
                if(behavior[i].hasOwnProperty("note"))
                    data += `<br><i>{{note}}: ${behavior[i]["note"]}</i>`
                data += "</li>"
            }
        }

        for(var i in abilities){
            if(abilities[i]["is_0_evi"]){
                data += `<li><b>{{ability}}</b>: ${abilities[i]["data"]}</li>`
                if(abilities[i].hasOwnProperty("note"))
                    data += `<br><i>{{note}}: ${abilities[i]["note"]}</i>`
                data += "</li>"
            }
        }

        for(var i in interactions){
            if(interactions[i]["is_0_evi"]){
                data += `<li><b>{{interaction}}</b>: ${interactions[i]["data"]}</li>`
                if(interactions[i].hasOwnProperty("note"))
                    data += `<br><i>{{note}}: ${interactions[i]["note"]}</i>`
                data += "</li>"
            }
        }

        data += "</ul>"
        return data
    }

    build_confirmation_tests(ghost,ghost_name,value){
        var data = "<ul>"

        if(value.length == 0){
            data += `<li class="non-definitive"><i>({{no_confirmation_tests,${ghost_name}}})</i></li>`
        }

        for(var i in value){
            data += `<li${value[i]["definitive"] ? "" : " class=\"non-definitive\""}><b>{{${value[i]["type"].toLowerCase().replace(' ','_')}}} (${value[i]["definitive"] ? "{{definitive}}" : "{{non_definitive}}"})</b>: ${value[i]["data"]}`

            if(value[i]["image"] != null){
                if(Array.isArray(value[i]["image"])){
                    value[i]["image"].forEach(img => {
                        data += `<br><img loading="lazy" class="zoomable" src="${img}" onclick="zoomImage(this)">`
                    });
                }
                else{
                    data += `<br><img loading="lazy" class="zoomable" src="${value[i]["image"]}" onclick="zoomImage(this${value[i].hasOwnProperty("subtitle") ? ",'"+value[i]['subtitle']+"'" : ""})">`
                }
            }

            if(value[i]["definitive"])
                data += `<div class="wiki_mark_ghost" onclick='select(document.getElementById("${ghost}"))'>&#x2714; {{mark_ghost}}</div>`
            
            data += `</li>`
        }

        data += "</ul>"
        return data
    }

    build_elimination_tests(ghost,ghost_name,value){
        var data = "<ul>"

        if(value.length == 0){
            data += `<li class="non-definitive"><i>({{no_elimination_tests,${ghost_name}}})</i></li>`
        }

        for(var i in value){
            data += `<li><b>{{${value[i]["type"].toLowerCase().replace(' ','_')}}}</b>: ${value[i]["data"]}`

            if(value[i]["image"] != null){
                if(Array.isArray(value[i]["image"])){
                    value[i]["image"].forEach(img => {
                        data += `<br><img loading="lazy" class="zoomable" src="${img}" onclick="zoomImage(this)">`
                    })
                }
                else{
                    data += `<br><img loading="lazy" class="zoomable" src="${value[i]["image"]}" onclick="zoomImage(this)">`
                }
            }

            data += `<div class="wiki_mark_ghost" onclick='fade(document.getElementById("${ghost}"))'>&#x2717; {{mark_ghost}}</div></li>`
        }

        data += "</ul>"
        return data
    }

    behavior(value){
        var msg = "<div class='ghost_behavior_item'>"

        var opened = false

        // Load Tells
        for(var s of ["tells","behaviors","abilities","hunt_sanity","hunt_speed","evidence"]){
            if(value[s] != null){
                opened = false
                for(var i = 0; i < value[s].length;i++){
                    if(value[s][i]["include_on_card"]){
                        if(i == 0){
                            opened = true
                            msg += `<div class='dtitle'><i>{{${(s)}}}</i><div class='ddash'></div></div><ul>`
                        }
                        msg += `<li>${value[s][i]["data"]}</li>`
                    }
                }
                if(opened)
                msg += "</ul>"
            }
        }

        msg += `<div class='dtitle'><i>{{interactions}}</i><div class='ddash'></div></div><div class="interaction-icons">`
    
        if (value["candles"] != null)
            msg += `<div class="interaction-item candle-interaction"><img alt="Candle Interaction" src="imgs/candle-icon.png">${value["candles"]}</div>`

        if (value["rem"] != null)
            msg += `<div class="interaction-item rem-interaction"><img alt="FLX-Pod Interaction" src="imgs/rem-icon.png">${value["rem"]}</div>`

        if (value["lights"] != null)
            msg += `<div class="interaction-item light-interaction"><img alt="Light Interaction" src="imgs/bulb-icon.png">${value["lights"]}</div>`

        if (value["radios"] != null)
            msg += `<div class="interaction-item radio-interaction"><img alt="Radio Interaction" src="imgs/radio-icon.png">${value["radios"]}</div>`

        msg += `</div>`

        msg += "</div>"
        return msg
    }

    toNumStr(num) { 
        let new_num = Number(num);

        if (Number.isInteger(new_num)) { 
            new_num = new_num.toFixed(1); // 1 → "1.0"
        } else {
            new_num = Number(new_num.toFixed(2)).toString(); // round + trim
        }

        return lang_currency.includes(lang)
            ? new_num.replace(".", ",")
            : new_num;
    }
}