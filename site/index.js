let today_events = [];
let future_events = [];

let today = new Date();
today.setHours(0,0,0,0);

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
console.log(today_events);
console.log(future_events);

// generate a table row for a single event
function generate_table_row(event, name){
    // spruce up the event data
    let level = event.level == "Other" ? "Local" : event.level;
    let region = event.location.region ? event.location.region : event.location.country;
    let stream_link = event.webcast.link ? `<a class="btn btn-success w-100" href="${event.webcast.link}">Stream</a>` : ""; 

    let start_date = new Date(event.start);
    start_date.setHours(0,0,0,0);
    let end_date = new Date(event.end);
    end_date.setHours(0,0,0,0);
    let date_string = "";
    if (start_date.toISOString() == end_date.toISOString()) {
        date_string = start_date.toDateString();
    }
    else{
        date_string = start_date.toDateString() + " - " + end_date.toDateString();
    }

    let row = `
        <tr>
            <td>${event.name}</td>
            <td>${event.program.name}</td>
            <td>${region}</td>
            <td>${level}</td>
            <td>${stream_link}</td>
            <td><div class="btn-expand btn btn-outline-primary w-100" id="heading-${event.sku}" data-bs-toggle="collapse" data-bs-target="#collapse-${event.sku}" aria-expanded="false" aria-controls="collapse-${event.sku}"></div></td>
        </tr>
        <tr>
            <td colspan="6" class="p-0 bg-secondary bg-opacity-25">
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

function generate_table(events_list, name){

    let table = `<table class="table table-hover table-borderless"><thead><tr><th>Event Name</th><th>Program</th><th>Region</th><th>Type</th><th>Stream</th><th>Details</th></tr></thead><tbody class="accordion" id="accordion-${name}">`;
    events_list.forEach(event => {
        table += generate_table_row(event, name);
    });
    table += "</tbody></table>";
    console.log(table);
    return table;
}

document.querySelector("#events_today_area").innerHTML = generate_table(today_events, "today");
document.querySelector("#future_events_area").innerHTML = generate_table(future_events, "upcoming");