const themes = {
    "Default": "theme-default",
    "Berry": "theme-berry",
    "Black & White": "theme-black-white",
    "Coral": "theme-coral",
    "Dusk": "theme-dusk",
    "Frost": "theme-frost",
    "Halloween": "theme-halloween",
    "Holiday": "theme-holiday-animated",
    "Northern Lights": "theme-northern-lights",
    "Pride": "theme-pride",
    "Snow": "theme-snow-particle",
    "Spruce": "theme-spruce",
    "Steel": "theme-steel",
    "Sunset": "theme-sunset",
    "Twilight": "theme-twilight",
    "ZN-Elite" : "theme-zn"
}

const theme_lights = {
    "Holiday":["red","lime","white"],
    "Spooky":["orange","lime","purple"]
}

function loadThemes(){
    let theme_options = ""
    Object.keys(themes).forEach((key) => {
        if(key=="Pixel"&&lang!='en') return;
        theme_options += `<option value="${key}">${key}</option>`
    })
    $("#theme").html(theme_options)
}

let light_interval = null
let bloodMoonInterval = null
let snowInterval = null
let isAltered = false

function changeTheme(name = null){

    let changeObjects = [
        ".ghost_card",".menu","#menu_tab","#settings_box","#settings_tab","#links_box","#links_tab",
        "#data_link_box","#data_link_tab",
        "#wiki_box","#wiki_tab","#maps_box","#maps_tab",
        "#news_box","#news_tab","#debug_tab",
        "#theme_box","#theme_tab","#data_tab", "#info_box","#info_box_voice",
        "#info_box_debug","#info_box_zndl","#info_box_zntdl","#info_box_calibrate", "#info_box_weekly", "#resetMenu", "#broadcast-content",
        "#search_box","#search_tab"
    ]

    if(isAltered){
        isAltered = false
    }

    let theme_name = name != null ? name : $("#theme").val()
    if(themes[theme_name] == undefined){
        theme_name = "Default"
        document.getElementById("theme").value = "Default"
    }

    clearInterval(light_interval)
    $(".ghost_card").removeClass("c-light-div")
    let old_lights = document.querySelectorAll('.c-light');
    old_lights.forEach(light => {
        light.remove()
    })

    stopThemeParticles();
    cg = document.getElementById("candle-group")
    if(cg) cg.remove()
    sl = document.getElementById("string-lights")
    if(sl) sl.remove()
    sd = document.getElementById("body-spacer")
    if(sd) sd.remove()

    if(themes[theme_name].endsWith("-animated")){

        let objs = document.getElementsByClassName("ghost_card")
        for(let i = 0; i < objs.length; i++){
            wrap(objs[i],theme_lights[theme_name],true,true,true,true,true)
        }
        wrap(document.getElementById("menu"),theme_lights[theme_name],false,true,false,false)
        const lights = document.querySelectorAll('.c-light');
        light_interval = setInterval(() => {
            lights.forEach(light => {
                let i = theme_lights[theme_name].indexOf(light.style.backgroundColor)
                i = (i+1) % theme_lights[theme_name].length
                light.style.backgroundColor = theme_lights[theme_name][i];
                light.style.boxShadow = `0px 0px 20px 5px ${theme_lights[theme_name][i]}`
            });
        }, 2000);
    }

    if(themes[theme_name] == "theme-snow-particle"){
        if(!document.getElementById("disable_particles").checked){
            startThemeParticles(themes[theme_name]);
        }
        document.body.style.backgroundImage = "radial-gradient(circle, rgba(0,0,0,0.75), rgba(0,0,0,1)), url('https://zero-network.net/the-other-side/static/imgs/background.png')"
    }
    else{
        document.body.style.backgroundImage = "radial-gradient(circle, rgba(0,0,0,0.75), rgba(0,0,0,1)), url('https://zero-network.net/the-other-side/static/imgs/background.png')"
    }

    changeObjects.forEach((item) => {
        $(item).removeClass(Object.values(themes))
        $(item).addClass(themes[theme_name])
    })
}

function wrap(div, light_colors, top=true, right=true, bottom=true, left=true, space=false){

    let i = 20
    let spacing = 100
    let light_color = Math.floor(Math.random()*3)
    if(space)
        div.classList.add("c-light-div")
    if(top)
        for (i = Math.floor(Math.random()*40+5); i < div.clientWidth; i+=spacing) {
            let light = document.createElement('div');
            let base = document.createElement('div')
            light.style.left = `${i}px`
            light.style.top = `-${Math.floor(Math.random() * 10)+5}px`
            light.style.backgroundColor = light_colors[light_color];
            light.style.boxShadow = `0px 0px 20px 5px ${light_colors[light_color]}`
            light.style.transform = `rotate(${Math.floor(Math.random() * 40)-20}deg)`
            light.classList.add('c-light')
            light.classList.add('c-light-t')
            base.classList.add('c-light-b-t')
            light.appendChild(base)
            div.appendChild(light);
            light_color = (light_color + 1) % light_colors.length
        }

    if(right)
        for (i = i - div.clientWidth; i < div.clientHeight; i+=spacing) {
            let light = document.createElement('div');
            let base = document.createElement('div')
            light.style.top = `${i}px`
            light.style.right = `-${Math.floor(Math.random() * 10)+5}px`
            light.style.backgroundColor = light_colors[light_color];
            light.style.boxShadow = `0px 0px 20px 5px ${light_colors[light_color]}`
            light.style.transform = `rotate(${Math.floor(Math.random() * 40)-20}deg)`
            light.classList.add('c-light')
            light.classList.add('c-light-r');
            base.classList.add('c-light-b-r')
            light.appendChild(base)
            div.appendChild(light);
            light_color = (light_color + 1) % light_colors.length
        }

    if(bottom)
        for (i = i - div.clientHeight; i < div.clientWidth; i+=spacing) {
            let light = document.createElement('div');
            let base = document.createElement('div')
            light.style.right = `${i}px`
            light.style.bottom = `-${Math.floor(Math.random() * 10)+5}px`
            light.style.backgroundColor = light_colors[light_color];
            light.style.boxShadow = `0px 0px 20px 5px ${light_colors[light_color]}`
            light.style.transform = `rotate(${Math.floor(Math.random() * 40)-20}deg)`
            light.classList.add('c-light')
            light.classList.add('c-light-b');
            base.classList.add('c-light-b-b')
            light.appendChild(base)
            div.appendChild(light);
            light_color = (light_color + 1) % light_colors.length
        }

    if(left)
        for (i = i - div.clientWidth; i < div.clientHeight; i+=spacing) {
            let light = document.createElement('div');
            let base = document.createElement('div')
            light.style.bottom = `${i}px`
            light.style.left = `-${Math.floor(Math.random() * 10)+5}px`
            light.style.backgroundColor = light_colors[light_color];
            light.style.boxShadow = `0px 0px 20px 5px ${light_colors[light_color]}`
            light.style.transform = `rotate(${Math.floor(Math.random() * 40)-20}deg)`
            light.classList.add('c-light')
            light.classList.add('c-light-l');
            base.classList.add('c-light-b-l')
            light.appendChild(base)
            div.appendChild(light);
            light_color = (light_color + 1) % light_colors.length
        }
}

function createGhostSpacer(height=125){
    ghost_container = document.getElementById('cards')
    const spacerdiv = document.createElement('div')  
    spacerdiv.id = "body-spacer"
    spacerdiv.style.height = `${height}px`
    ghost_container.appendChild(spacerdiv);
}

/// -------------------
// THEME PARTICLE ENGINE
// -------------------


let particleThemeCanvas, themeParticleCtx, themeParticles = [];
let animFrameTheme = null;
let currentTheme = null;

function createThemeParticle(theme, w, h) {
    if (theme === "theme-snow-particle") {
        return {
            x: Math.random() * w,
            y: 0,
            baseY: 0,
            vy: Math.random() * 0.5 + 0.2,
            size: Math.random() * 2 + 2,
            color: Math.random() < 0.33 ? 'rgb(200,200,200)' : 'rgb(200,200,220)',
            age: 0,
            delay: Math.random() * 30,
            type: 'snow'
        };
    }
}

function animateThemeParticles(lastTime) {
    if (!currentTheme) return;

    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    const w = particleThemeCanvas.width;
    const h = particleThemeCanvas.height;
    const travel = h * 0.4;

    themeParticleCtx.clearRect(0, 0, w, h);

    for (const p of themeParticles) {

        if (p.delay > 0) {
            p.delay -= delta;
            continue; // skip updating/drawing this frame
        }

        if (p.type == 'snow') {
            p.y += p.vy;
            p.age = Math.random() * h / p.vy;
            themeParticleCtx.beginPath();
            themeParticleCtx.globalAlpha = 0.7;
            themeParticleCtx.fillStyle = p.color;
            themeParticleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            themeParticleCtx.fill();

            if (p.y > h) Object.assign(p, createThemeParticle(currentTheme, w, h) || p);
        }
    }

    themeParticleCtx.globalAlpha = 1;
    animFrameTheme = requestAnimationFrame(() => animateThemeParticles(now));
}

function startThemeParticles(theme) {
    stopThemeParticles();

    currentTheme = theme;
    if (document.getElementById("disable_particles")?.checked) return;
    

    particleThemeCanvas = document.getElementById('particle-theme-canvas');
    themeParticleCtx = particleThemeCanvas.getContext('2d');

    function resizeCanvas() {
        particleThemeCanvas.width = window.innerWidth;
        particleThemeCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const count = theme === "theme-snow-particle" ? 60 : 60;
    const h = particleThemeCanvas.height;
    const w = particleThemeCanvas.width;

    themeParticles = Array.from({ length: count }, () => createThemeParticle(theme, w, h));

    animateThemeParticles(performance.now());
}

function stopThemeParticles() {
    if (animFrameTheme) cancelAnimationFrame(animFrameTheme);
    themeParticles = [];
    currentTheme = null;
    if(themeParticleCtx)
        themeParticleCtx.clearRect(0, 0, particleThemeCanvas.width, particleThemeCanvas.height);
}

// -------------------


function saveOriginalStyles(elem, styles) {
    styles.forEach(style => {
        if (!(style in elem.dataset)) {
            elem.dataset["orig" + style] = elem.style[style] || "";
        }
    });
}

function restoreOriginalStyles(elem) {
    Object.keys(elem.dataset).forEach(key => {
        if (key.startsWith("orig")) {
            let styleName = key.slice(4);
            styleName = styleName.charAt(0).toLowerCase() + styleName.slice(1); // lowercase first letter
            elem.style[styleName] = elem.dataset[key];
        }
    });
}