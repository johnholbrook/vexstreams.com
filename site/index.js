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
function generate_table_row(event){
    // spruce up the event data
    let level = event.level == "Other" ? "Local" : event.level;
    let region = event.location.region ? event.location.region : event.location.country;
    let stream_link = event.webcast.link ? `<a href="${event.webcast.link}">Stream</a>` : ""; 

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

    let row = document.createElement("tr");
    row.innerHTML = `<tr>
    <td>${event.name}</td>
    <td>${event.program.code}</td>
    <td>${date_string}</td>
    <td>${region}</td>
    <td>${level}</td>
    <td><a href="https://robotevents.com/${event.sku}.html">RobotEvents</a></td>
    <td>${stream_link}</td>
    </tr>
    `

    return row;
}

function generate_table(events_list){
    let table = document.createElement("table");
    table.classList.add("table", "table-striped");
    table.innerHTML = "<thead><tr><th>Event Name</th><th>Competition</th><th>Date(s)</th><th>Region</th><th>Type</th><th>Event Link</th><th>Stream</th></tr></thead><tbody>";
    events_list.forEach(event => {
        table.appendChild(generate_table_row(event));
    });
    table.innerHTML += "</tbody>";
    return table;
}

document.querySelector("#events_today_area").innerHTML = generate_table(today_events).outerHTML;
document.querySelector("#future_events_area").innerHTML = generate_table(future_events).outerHTML;