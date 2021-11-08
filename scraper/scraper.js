var re = require("robotevents");
require("isomorphic-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

// initialize the RobotEvents API by setting our API key
const re_key = require("./key.js").re_key;
re.authentication.setBearer(re_key);

// build a list of ISO date strings representing today and the next 14 days
let today = new Date();
today.setUTCHours(0,0,0,0);
let dates = [];
[...Array(15).keys()].forEach(i => {
    let tmp = new Date();
    tmp.setDate(today.getDate() + i);
    tmp.setUTCHours(0,0,0,0);
    dates.push(tmp.toISOString());
});

// get all the current seasons
const CURRENT_START_YEAR = 2021;
async function getCurrentSeasons(){
    let current_seasons = [];
    let all_seasons = await re.seasons.all();
    current_seasons = all_seasons.filter(season => season.years_start == CURRENT_START_YEAR);
    return current_seasons;
}

// async function to iterate over an array
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

// get all events within in the next 7 days
async function getEvents(){
    let all_events = [];
    let seasons = await getCurrentSeasons();
    await asyncForEach(seasons, async (season) =>{
        let this_season_events = await re.events.search({"season": season.id});
        this_season_events.forEach(event => {
            let event_start = new Date(event.start);
            event_start.setUTCHours(0,0,0,0);
            let event_end = new Date(event.end);
            event_end.setUTCHours(0,0,0,0);

            if (dates.includes(event_start.toISOString()) || dates.includes(event_end.toISOString())){
                // event starts or ends within the next 7 days
                all_events.push(event);
            }
            else if (event_start < today && (event_end.toISOString == today.toISOString() || event_end > today)){
                // event has already started, but ends today or later
                all_events.push(event);
            }
        })
    });
    return all_events;
}

// return the HTML content of a page
async function getPageContent(url){
    let result = ""
    await fetch(url).then(async response => {
        // console.log(response);
        await response.text().then(async text => {
            result = text;
        });
    });
    return result;
}

// get the webcast info for a given event, or return null if there is no webcast
async function getWebcastInfo(event_id){
    // get the event page and parse it
    let page_content = await getPageContent(`https://robotevents.com/${event_id}.html#webcast`);
    let document = new JSDOM(page_content).window.document;
    
    // get the webcast tab
    let webcast_tab = document.querySelector("tab[name=Webcast]");
    
    // if the webcast tab doesn't exist, there is no webcast
    if (webcast_tab == null){
        return null;
    }
    else{
        // the webcast tab exists, so get the webcast info
        // let webcast_info = webcast_tab.querySelector("p");
        let webcast_info = document.createElement("p");
        webcast_tab.querySelectorAll("p").forEach(p => {
            webcast_info.innerHTML += p.innerHTML;
            webcast_info.innerHTML += " ";
        });
        let webcast_info_text = webcast_info.textContent;
        let link = webcast_info.querySelector("a");
        
        // if the webcast info includes one of the below phrases and does not include a link, assume there is no webcast
        const webcast_filter_phrases = ["no webcast", "no weebcast", "no web cast", "not available", "not applicable", "n/a", "none", "we are not able", "there will not be a webcast", "we will not cast", "will not be webcast"];
        let webcast_na = false;
        webcast_filter_phrases.forEach(phrase => {
            if (webcast_info_text.toLowerCase().includes(phrase) && link == null){
                // console.log(`Rejected ${event_id}: ${webcast_info_text}`)
                webcast_na = true;
            }
        });
        if (webcast_na){
            return null;
        }
        else {
            // at this point we're pretty sure will actually be a webcast
            if (link){
                // webcast tab includes a link
                return {
                    html: webcast_info.innerHTML,
                    text: webcast_info.textContent,
                    link: link.href
                };
            }
            else {
                // webcast tab does not include a link
                // check to see if there is a URL anywhere in the webcast info
                let link_found = false;
                let link_url = "";
                // let desc_split = webcast_info_text.split(" ");
                let desc_split = webcast_info_text.split(/\s+/);
                desc_split.forEach(word => {
                    if (!link_found){
                        try{
                            let url_obj = new URL(word);
                            if (["http:", "https:"].includes(url_obj.protocol)){
                                link_found = true;
                                link_url = url_obj.href;
                            }
                        }
                        catch(e){}
                    }
                });
                if (link_found){
                    // there was a URL in the webcast info
                    return {
                        html: webcast_info.innerHTML,
                        text: webcast_info.textContent,
                        link: link_url
                    };
                }
                else {
                    // there was no URL in the webcast info
                    return {
                        html: webcast_info.innerHTML,
                        text: webcast_info.textContent,
                        link: ""
                    };
                }
            }


            // let link_href = link ? link.href : "";
            // console.log(`${event_id}: ${webcast_info.textContent} | ${link_href}`);
            // return {
            //     html: webcast_info.innerHTML,
            //     text: webcast_info.textContent,
            //     link: link_href
            // };
        }
    }
};

// find all events with webcast info
async function getWebcastEvents(){
    let all_events = await getEvents();
    
    let webcast_events = [];
    await asyncForEach(all_events, async (event) => {
        let webcast_info = await getWebcastInfo(event.sku);
        if (webcast_info){
            console.log(`${event.sku}: ${webcast_info.text} | ${webcast_info.link}`);
            event.webcast = webcast_info;
            webcast_events.push(event);
        }
    });
    return webcast_events;
}

// get webcast info for upcoming events and write to a file
async function main(){
    let webcast_events = await getWebcastEvents();
    let now = new Date();
    let of_content = {
        "last_updated": now.toISOString(),
        "data": webcast_events
    }
    let of_text = JSON.stringify(of_content);
    // let of_content = `var event_data = ${JSON.stringify(webcast_events)}`;
    await fs.writeFile("../docs/events/event_data.json", of_text, (error) => {
        console.log(error);
    });
}

main();
