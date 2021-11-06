var active_streams = [];

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector("header").innerHTML += `<div class="col-auto ms-2 me-4">
        <span class="input-group">
            <span class="input-group-text">Layout:&nbsp;</span>
            <select name="select-layout" id="select-layout" class="form-select" >
                <option value="1">1</option>
                <option value="1+1_horiz">1+1 horizontal</option>
                <option value="1+1_vert">1+1 vertical</option>
                <option value="1+2">1+2</option>
                <option value="4">4</option>
                <option value="1+3">1+3</option>
                <option value="1+4">1+4</option>
                <option value="6">6</option>
                <option value="9">9</option>
            </select>
            <button class="btn btn-danger" id="reset-mv">Reset</button>
        </span>
    </div>`;

    document.querySelector("header").classList.remove("mb-4");
    document.querySelector("#select-layout").onchange = init_mv;
    document.querySelector("#reset-mv").onclick = init_mv;

    active_streams = get_active_streams();

    // initialize to the "1" setting
    init_mv();

});

// initialize the multiview to the currently-selected layout
function init_mv(){
    let layout = document.querySelector("#select-layout").value;
    clear_mv_items();
    switch(layout){
        case "1":
            add_mv_item(100, 100, 1);
            break;
        case "1+1_horiz":
            add_mv_item(50, 100, 1);
            add_mv_item(50, 100, 2);
            break;
        case "1+1_vert":
            add_mv_item(100, 50, 1);
            add_mv_item(100, 50, 2);
            break;
        case "1+2":
            add_mv_item(60, 100, 1);
            add_mv_item(40, 50, 2);
            add_mv_item(40, 50, 3);
            break;
        case "4":
            add_mv_item(50, 50, 1);
            add_mv_item(50, 50, 2);
            add_mv_item(50, 50, 3);
            add_mv_item(50, 50, 4);
            break;
        case "1+3":
            add_mv_item(70, 100, 1);
            add_mv_item(30, 33, 2);
            add_mv_item(30, 33, 3);
            add_mv_item(30, 33, 4);
            break;
        case "1+4":
            add_mv_item(75, 100, 1);
            add_mv_item(25, 25, 2);
            add_mv_item(25, 25, 3);
            add_mv_item(25, 25, 4);
            add_mv_item(25, 25, 5);
            break;
        case "6":
            add_mv_item(100/3, 50, 1);
            add_mv_item(100/3, 50, 2);
            add_mv_item(100/3, 50, 3);
            add_mv_item(100/3, 50, 4);
            add_mv_item(100/3, 50, 5);
            add_mv_item(100/3, 50, 6);
            break;
        case "9":
            add_mv_item(100/3, 100/3, 1);
            add_mv_item(100/3, 100/3, 2);
            add_mv_item(100/3, 100/3, 3);
            add_mv_item(100/3, 100/3, 4);
            add_mv_item(100/3, 100/3, 5);
            add_mv_item(100/3, 100/3, 6);
            add_mv_item(100/3, 100/3, 7);
            add_mv_item(100/3, 100/3, 8);
            add_mv_item(100/3, 100/3, 9);
            break;
    }
}

function clear_mv_items(){
    document.querySelector("#multiview-parent").innerHTML = "";
}

function add_mv_item(width, height, id, streams){
    let tmp = document.createElement("div");
    tmp.id = `multiview-item-${id}`
    tmp.classList.add("multiview-item");
    tmp.style.width = width + "%";
    tmp.style.height = height + "%";
    tmp.innerHTML = generate_select_html(id);
    document.querySelector("#multiview-parent").appendChild(tmp);
    document.querySelector("#stream-select-" + id).onchange = function(){
        load_stream(id);
    }
    document.querySelector(`#load-custom-embed-${id}`).onclick = function(){
        let embed_url = document.querySelector(`#custom-embed-${id}`).value;
        load_custom_embed(id, embed_url);
    }
}

function generate_select_html(id){
    let result = `
    <div class="w-50 mx-auto mt-3">
        <span class="input-group">
            <span class="input-group-text">Event:</span>
            <select name="stream-select-${id}" id="stream-select-${id}" class="form-select">
                <option selected>Select an event...</option>`;
    
    active_streams.forEach(stream => {
        result += `<option value="${stream.embed_url}">${stream.name} (${stream.dates})</option>`;
    });
    result += `</select></span></div>`;
    result += `
        <div class="mt-2 text-center">or</div>
        <div class="w-50 mx-auto mt-2">
            <span class="input-group">
                <span class="input-group-text">Custom:</span>
                <input type="text" class="form-control" id="custom-embed-${id}" placeholder="Paste embed URL here...">
                <button class="btn btn-primary" id="load-custom-embed-${id}">Load</button>
            </span>
        </div>
    `
    console.log(result);
    return result;
}

// get all the events happening today with a stream link that we can show in the multiview
function get_active_streams(){
    let result = [];
    event_data.forEach(event => {
        let start_date = new Date(event.start);
        start_date.setHours(0,0,0,0);
        let end_date = new Date(event.end);
        end_date.setHours(0,0,0,0);
        let date_string = "";
        if (start_date.toISOString() == end_date.toISOString()) {
            date_string = start_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        }
        else{
            date_string = start_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) + " - " + end_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        }

        let embed = get_event_embed(event);
        if (embed){
            result.push({name: event.name, embed_url: embed, dates: date_string});
        }
    });
    return result;
}

// returns the embed URL for an event's stream, or null if it doesn't have one
function get_event_embed(event){
    if (event.webcast.link == ""){
        // no link provided, so no embed
        return null;
    }
    else {
        let link_url = new URL(event.webcast.link);
        console.log(link_url);
        if (["www.twitch.tv", "twitch.tv"].includes(link_url.hostname)){
            // livestream on twitch
            return `https://player.twitch.tv/?channel=${link_url.pathname.substring(1)}&parent=${window.location.hostname}`;
        }
        else if (["www.youtube.com", "youtube.com"].includes(link_url.hostname)){
            // livestream on youtube
            if (link_url.pathname == "/watch"){
                // direct link to video via youtube.com
                let video_id = link_url.searchParams.get("v");
                // console.log(`YouTube video ID: ${video_id}`);
                return `https://www.youtube.com/embed/${video_id}?autoplay=1`
            }
            else if (link_url.pathname.split("/")[1] == "channel"){
                // link to channel, generate link to channel's current livestream
                let channel_id = link_url.pathname.split("/")[2];
                console.log(`YouTube channel ID: ${channel_id}`);
                return `https://www.youtube.com/embed/live_stream?channel=${channel_id}&autoplay=1`
            }
        }
        else if (link_url.hostname == "youtu.be"){
            // special case for direct links using youtu.be
            let video_id = link_url.pathname.substring(1);
            // console.log(`youtu.be video ID: ${video_id}`);
            return `https://www.youtube.com/embed/${video_id}?autoplay=1`
        }
        else{
            // link provided, but not to a site we know about
            return null;
        }
    }
}

function load_stream(id){
    let embed_url = document.querySelector("#stream-select-" + id).value;
    console.log(embed_url);
    document.querySelector("#multiview-item-" + id).innerHTML = `<iframe src="${embed_url}" frameborder="0" allowfullscreen="true" scrolling="no" height="100%" width="100%"></iframe>`;
}

function load_custom_embed(id, embed_url){
    document.querySelector("#multiview-item-" + id).innerHTML = `<iframe src="${embed_url}" frameborder="0" allowfullscreen="true" scrolling="no" height="100%" width="100%"></iframe>`;
}