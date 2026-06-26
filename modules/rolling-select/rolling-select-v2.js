function buildSelectors(){
    document.querySelectorAll(".cycler").forEach(cycler => {
        const options = JSON.parse(cycler.dataset.options);
        const name = cycler.dataset.name;

        let current = Number(cycler.dataset.current || 0);

        const valueEl = cycler.querySelector(".cycler-value");
        const prevBtn = cycler.querySelector(".cycler-prev");
        const nextBtn = cycler.querySelector(".cycler-next");
        const inputEl = cycler.querySelector("input[type='hidden']");
        const counterEl = cycler.querySelector(".cycler-counter");

        if (inputEl) {
            inputEl.name = name;
        }

        function update() {
            valueEl.innerHTML = options[current].includes('{{') ? lang_data[options[current].replace('%','')] : options[current];

            if (inputEl) {
                inputEl.value = options[current].replace('%','').replace("{{","").replace("}}","");
            }

            if (counterEl) {
                counterEl.textContent =
                    current === 0
                        ? `- / ${options.length - 1}`
                        : `${current} / ${options.length - 1}`;
            }

            cycler.dataset.current = current;
            updateSAEntries(name,current);
        }

        function cycle(direction) {
            if (cycler.classList.contains("cycle-disabled")) return;
            current = (Number(cycler.dataset.current) + direction + options.length) % options.length;
            update();
        }

        prevBtn.addEventListener("click", () => { cycle(-1); filter(); });
        nextBtn.addEventListener("click", () => { cycle(1); filter(); });
        valueEl.addEventListener("click", () => { cycle(1); filter(); });

        update();
    });
}

function setCyclerValue(name, value) {
    const cycler = document.querySelector(
        `.cycler[data-name="${name.replace('_','-')}"]`
    );

    if (!cycler) return;

    const options = JSON.parse(cycler.dataset.options);
    const index = options.indexOf(value == '-' ? value : `{{%${value}}}`);

    if (index === -1) return;

    cycler.dataset.current = index;
    if (lang_data && lang_data.hasOwnProperty(options[index].replace('%',''))){
        cycler.querySelector(".cycler-value").innerHTML = options[index].includes('{{') ? lang_data[options[index].replace('%','')] : options[index];
    }
    else{
        cycler.querySelector(".cycler-value").innerHTML = options[index].includes('{{') ? options[index].replace('%','') : options[index];
    }
    cycler.querySelector("input").value = value;

    updateSAEntries(name,index);
}

function setCyclerIndex(name, index) {
    const cycler = document.querySelector(
        `.cycler[data-name="${name.replace('_','-')}"]`
    );

    if (!cycler) return;

    const options = JSON.parse(cycler.dataset.options);
    if (index < 0 || index >= options.length) return;

    cycler.dataset.current = index;
    if (lang_data && lang_data.hasOwnProperty(options[index].replace('%',''))){
        cycler.querySelector(".cycler-value").innerHTML = options[index].includes('{{') ? lang_data[options[index].replace('%','')] : options[index];
    }
    else{
        cycler.querySelector(".cycler-value").innerHTML = options[index].includes('{{') ? options[index].replace('%','') : options[index];
    }
    cycler.querySelector("input").value = options[index];

    updateSAEntries(name,index);
}

function loadCyclerState(incoming_state = null){
    if (incoming_state === null){
        incoming_state = state
    }
    setCyclerValue("speed",incoming_state["speed"])
    setCyclerValue("los-speed",incoming_state["los_speed"])
    setCyclerValue("holy-water",incoming_state["holy_water"])
    setCyclerValue("candle-interaction",incoming_state["candle_interaction"])
    setCyclerValue("light-interaction",incoming_state["light_interaction"])
    setCyclerValue("radio-interaction",incoming_state["radio_interaction"])
    setCyclerValue("rem-interaction",incoming_state["rem_interaction"])
}