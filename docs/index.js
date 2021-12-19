var event_data = null;
var last_updated = null;

var today_events = [];
var future_events = [];

var today = new Date();
today.setHours(0,0,0,0);

document.addEventListener('DOMContentLoaded', function() {
    // load event data
    var request = new XMLHttpRequest();
    request.open('GET', '/events/event_data.json', false);  // `false` makes the request synchronous
    request.send(null);
    if (request.status === 200) {
        // console.log(JSON.parse(request.responseText));
        let response = JSON.parse(request.responseText);
        // event_data = JSON.parse(request.responseText).data;
        event_data = response.data;
        last_updated = response.last_updated;
    }
    else {
        alert("ERROR: Couldn't lead event data.")
    }

    // show the time the data was updated
    document.querySelector("#last-updated").innerHTML = last_updated;

    // split the events into today and future events
    event_data.forEach(event => {
        let event_date = new Date(event.start);
        event_date.setHours(0,0,0,0);

        if (event_date > today) {
            future_events.push(event);
        }
        else{
            today_events.push(event);
        }
    });
    // console.log(today_events);
    // console.log(future_events);

    populate_filter_options(event_data);

    refresh_tables();

    document.querySelector("#include-leagues").onchange = refresh_tables;
    document.querySelector("#select-program").onchange = refresh_tables;
    document.querySelector("#select-region").onchange = refresh_tables;
    document.querySelector("#select-type").onchange = refresh_tables;
});

// generate a table row for a single event
function generate_table_row(event, name){
    // spruce up the event data
    let level = getType(event);
    let region = getRegion(event);
    let stream_link = event.webcast.link ? `<a class="btn btn-success w-100" href="${event.webcast.link}">Stream</a>` : ""; 

    let start_date = new Date(event.start);
    start_date.setHours(0,0,0,0);
    let end_date = new Date(event.end);
    end_date.setHours(0,0,0,0);
    let date_string = "";
    let date_string_short = "";
    if (start_date.toISOString() == end_date.toISOString()) {
        date_string = start_date.toDateString();
        date_string_short = start_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
    }
    else{
        date_string = start_date.toDateString() + " - " + end_date.toDateString();
        date_string_short = start_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) + " - " + end_date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
    }

    let row = `
        <tr>
            <td>${event.name}</td>
            <td>${event.program.name}</td>
            <td>${region}</td>
            <td>${date_string_short}</td>
            <td>${level}</td>
            <td>${stream_link}</td>
            <td><div class="btn-expand btn btn-outline-primary w-100" id="heading-${event.sku}" data-bs-toggle="collapse" data-bs-target="#collapse-${event.sku}" aria-expanded="false" aria-controls="collapse-${event.sku}"><div class="collapse-arrow">∨</div></div></td>
        </tr>
        <tr>
            <td colspan="7" class="p-0 bg-secondary bg-opacity-25">
                <div id="collapse-${event.sku}" class="accordion-collapse collapse" aria-labelledby="heading-${event.sku}" data-bs-parent="#accordion-${name}">
                    <div class="accordion-body row">
                        <div class="col-auto">
                            <span class="fw-bold">Date(s):&nbsp;</span>${date_string}
                        </div>
                        <div class="col-auto">
                            <span class="fw-bold">Venue:&nbsp;</span>${event.location.venue}
                        </div>
                        <div class="col-auto">
                            <span class="fw-bold">Location:&nbsp;</span>${event.location.city},${event.location.region ? ` ${event.location.region},` : ""} ${event.location.country}
                        </div>
                        <div class="col-auto">
                            <span class="fw-bold">RobotEvents:&nbsp;</span><a href="https://robotevents.com/${event.sku}.html" target="_blank">${event.sku}</a>
                        </div>
                        <div class="col-auto">
                            <span class="fw-bold">Stream Description:&nbsp;</span>${event.webcast.html}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `;

    return row;
}

function populate_filter_options(events_list){
    let programs = [];
    let regions = [];
    let event_types = [];

    events_list.forEach(event => {
        let this_program = event.program.code
        let this_region = getRegion(event);
        let this_type = getType(event);

        if (!programs.includes(this_program)){
            programs.push(this_program);
        }
        if (!regions.includes(this_region)){
            regions.push(this_region);
        }
        if (!event_types.includes(this_type)){
            event_types.push(this_type);
        }
    });

    programs.sort();
    regions.sort();
    event_types.sort();

    let programs_html = `<option value="all">All Programs</option>`;
    programs.forEach(program => {
        programs_html += `<option value="${program}">${program}</option>`;
    });
    document.querySelector("#select-program").innerHTML = programs_html;

    let regions_html = `<option value="all">All Regions</option>`;
    regions.forEach(region => {
        regions_html += `<option value="${region}">${region}</option>`;
    });
    document.querySelector("#select-region").innerHTML = regions_html;

    let event_types_html = `<option value="all">All Event Types</option>`;
    event_types.forEach(type => {
        event_types_html += `<option value="${type}">${type}</option>`;
    });
    document.querySelector("#select-type").innerHTML = event_types_html;
}

function filter_events(input){
    let include_leagues = document.querySelector("#include-leagues").checked;
    let program = document.querySelector("#select-program").value;
    let region = document.querySelector("#select-region").value;
    let event_type = document.querySelector("#select-type").value;
    
    console.log(include_leagues, program, region, event_type);

    let output = [];

    input.forEach(event => {
        let include = true;

        if (!include_leagues && is_league(event)){
            include = false;
        }

        if (program != "all" && event.program.code != program){
            include = false;
        }

        if (region != "all" && getRegion(event) != region){
            include = false;
        }

        if (event_type != "all" && getType(event) != event_type){
            include = false;
        }

        if (include){
            output.push(event);
        }
    });

    return output;
}

function getRegion(event){
    return event.location.region ? event.location.region : event.location.country;
}

function getType(event){
    return event.level == "Other" ? "Local" : event.level;
}

function is_league(event){
    let start = new Date(event.start);
    start.setUTCHours(0,0,0,0);
    let end = new Date(event.end);
    start.setUTCHours(0,0,0,0);
    return (start < end && event.name.toLowerCase().includes("league"));
}

function generate_table(events_list, name){
    let events_sorted = events_list.sort((a, b) => {
        let a_date = new Date(a.start);
        let b_date = new Date(b.start);
        if (a_date < b_date) {
            return -1;
        }
        else if (b_date < a_date) {
            return 1;
        }
        else {
            return 0;
        }
    });

    let events_filtered = filter_events(events_sorted);

    let table = `<table class="table table-hover table-borderless"><thead><tr><th>Event Name</th><th>Program</th><th>Region</th><th>Date(s)</th><th>Type</th><th>Stream</th><th>Details</th></tr></thead><tbody class="accordion" id="accordion-${name}">`;
    events_filtered.forEach(event => {
        table += generate_table_row(event, name);
    });
    table += "</tbody></table>";
    // console.log(table);
    return table;
}

function refresh_tables(){
    document.querySelector("#events_today_area").innerHTML = generate_table(today_events, "today");
    document.querySelector("#future_events_area").innerHTML = generate_table(future_events, "upcoming");
}