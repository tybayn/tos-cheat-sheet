
let data_user = {}
let custom_difficulties = {}

function getLink(){
    return new Promise((resolve, reject) => {
        try{
            znid = getCookie("tos_znid")

            let legacy = getCookie("discord_link")
            if (legacy != ''){
                legacy = JSON.parse(legacy)
                legacy['type'] = 'discord'
                setCookie("data_link", JSON.stringify(legacy), 30)
                setCookie("discord_link","",-1)
            }

            data_user = JSON.parse(getCookie("data_link"))
            if(data_user.type == 'discord'){
                document.getElementById("data_avatar").src = `https://cdn.discordapp.com/avatars/${data_user['id']}/${data_user['avatar']}`
                $("#login_type_icon").attr("src","https://cdn.simpleicons.org/discord/white")
            }
            else{
                document.getElementById("data_avatar").src = `${data_user['avatar']}`
                $("#login_type_icon").attr("src","https://cdn.simpleicons.org/twitch/white")
            }

            document.getElementById("data_link_tab_label").innerText = lang_data['{{data_link}}']
            $("#login_type_icon").show()
            $("#data_pre_login").hide()
            $("#data_avatar").addClass("avatar")
            document.getElementById("data_name").innerText = data_user['username']
            document.getElementById("data_link_date").innerText = `${lang_data['{{data_link_h2}}']} ${data_user['last_linked']}`
            $("#data_link_date").removeClass("hidden")
            $("#data_instructions").removeClass("hidden")
            document.getElementById("data_note").innerHTML = `${lang_data['{{data_link_h9}}']}<br><br>${lang_data['{{data_link_p7}}']}`
            $("#data_unlink_button").removeClass("hidden")
            document.getElementById("reset").innerHTML = `${lang_data['{{save_and_reset}}']}<div class='reset_note'>(${lang_data['{{right_click_for_more}}']})</div>`
            fetch(`https://zero-network.net/zn/${znid}/${data_user['id']}?game=the-other-side`, {signal: AbortSignal.timeout(6000)})
            .then(data => data.json())
            .then(data => {
                var stats_info = `<strong>${lang_data['{{data_link_h3}}']}</strong> ${data.total_games}<hr><div class="data-breakdown" style="display:grid; grid-template-columns: auto;">`

                stats_info += `<div class="data-entry">${lang_data['{{novice}}']}: <span class="data-num" style="float:right;">${data.hasOwnProperty('game_evidence') ? data['game_evidence']['3N'] || '0' : '0'}</span></div>`
                stats_info += `<div class="data-entry">${lang_data['{{intermediate}}']}: <span class="data-num" style="float:right;">${data.hasOwnProperty('game_evidence') ? data['game_evidence']['3I'] || '0' : '0'}</span></div>`
                stats_info += `<div class="data-entry">${lang_data['{{expert}}']}: <span class="data-num" style="float:right;">${data.hasOwnProperty('game_evidence') ? data['game_evidence']['3E'] || '0' : '0'}</span></div>`
                stats_info += `<div class="data-entry">${lang_data['{{master}}']}: <span class="data-num" style="float:right;">${data.hasOwnProperty('game_evidence') ? data['game_evidence']['3M'] || '0' : '0'}</span></div>`

                stats_info += `</div><br><strong>${lang_data['{{data_link_h4}}']}</strong><hr><div class="data-ghost-breakdown" style="display:grid; grid-template-columns: 50% 50%;">`
                for (const g in data['ghost_stats']){
                    stats_info += `<div class="data-entry" style="${g == 'Unknown'?'color:#555;':''}">${all_ghosts[g]}: <span class="data-num" style="float:right;">${data['ghost_stats'][g]}</span></div>`
                }
                stats_info += '</div>'

                document.getElementById("data_stats").innerHTML = stats_info
                // document.getElementById("data-stats-link").href = `https://zero-network.net/phasmo-stats/?data-id=${data_user['id']}&avatar=${data_user['type'] == 'discord' ? ('https://cdn.discordapp.com/avatars/'+data_user['id']+'/'+data_user['avatar']) : data_user['avatar']}&username=${data_user['username']}`
                document.getElementById("data_link_status").className = "connected"

                resolve("User data loaded")
            })
            
        } catch(Error){
            resolve("User not logged in")
        }
    })
}

function applyPerms(){
    return new Promise((resolve, reject) => {
        if(Object.keys(data_user).length > 0){
            $('.card_icon_guess').show()
            $('.card_icon_died').show()
            $('.data_voice_commands').show()
        }
        resolve("Data Link Permissions Applied")
    })
}

function data_unlink(){
    data_user = {}
    setCookie("data_link","",-1)
    window.location.href = `https://zero-network.net/logout/redirect/?redirect=${window.location.href.split("?")[0]}`
}