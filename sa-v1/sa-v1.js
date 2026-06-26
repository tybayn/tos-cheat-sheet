var sa_win = document.getElementById("sa-window");
const sa_header = document.getElementById("sa-window-header");

function updateNumSAEntries(){
    let difficulty = document.getElementById("num_evidence").value;
    let num_cleanse = 4
    if (difficulty == "-1" || difficulty.match(/[A-K]{4}-[A-K]{4}-[A-K]{4}/g)){
        num_cleanse = document.getElementById("cust_cleanse_evidence").value;
    }
    else{
        num_cleanse = difficulties[difficulty]?.cleanse;
    }
    if (num_cleanse === undefined || num_cleanse === null || num_cleanse === ""){
        $("#sa-scan").hide()
        $("#need-more").hide();
        return
    }


    let cyclers = document.querySelectorAll(`.cycler[data-group="evidence"]`);
    if(Array.from(cyclers).filter((x) => {return x.dataset.current != 0}).length < num_cleanse){
        $("#sa-scan").hide()
        $("#need-more").text(`! ${num_cleanse - Array.from(cyclers).filter((x) => {return x.dataset.current != 0}).length} MORE EVIDENCE NEEDED !`);
        $("#need-more").show();
    }
    else{
        Array.from(cyclers).filter((x) => {return x.dataset.current != 0}).forEach((x,idx) => {
            if (idx > num_cleanse - 1){
                $("#sa-" + x.dataset.name.split('-')[0]).hide();
            }
        })
        $("#need-more").hide();
        $("#sa-scan").show()
    }
}

function updateSAEntries(evi, index){
    if (index == 0){
        $("#sa-" + evi.split('-')[0]).hide();
    }
    else{
        $("#sa-" + evi.split('-')[0]).text(`ADD ${evi.split('-')[0].toUpperCase()} ${index}`);
        $("#sa-" + evi.split('-')[0]).show();
    }

    updateNumSAEntries()
}

