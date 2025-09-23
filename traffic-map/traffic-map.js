let trafficData = [];

// Leaflet circle properties by queue length
function getCircle(queue) {
    let cColor, cFillColor, cRadius;
    
    if (queue <= 10) {
        cColor = "green"; cFillColor = "green"; cRadius = 5;
    }
    if (queue >= 10 && queue < 25) {
        cColor = "yellow"; cFillColor = "yellow"; cRadius = 10;
    }
    if (queue >= 25 && queue < 50) {
        cColor = "orange"; cFillColor = "orange"; cRadius = 20;
    }
    if (queue > 50) {
        cColor = "red"; cFillColor = "red"; cRadius = 30;
    } 
    return {color: cColor, fillColor: cFillColor, radius: cRadius};
}

// Load intersection coordinates from file
async function loadLocationData() {
    const response = await fetch("intersections.json");
    const locations = await response.json();

    locations.forEach(element => {
        trafficData.push({id: element.id, location: element.location, lat: element.lat, lon: element.lon, queue: 0, time: 0});
    });
}

// Traffic queue length and wait time from API
async function fetchTrafficData() {
    try {
        const response1 = await fetch("https://api.oulunliikenne.fi/tpm/kpi/queue-length")
        if (!response1.ok) {
            throw new Error(`Queue status: ${response1.status}`);
        }
        let queue = await response1.json();

        const response2 = await fetch("https://api.oulunliikenne.fi/tpm/kpi/wait-time")
        if (!response2.ok) {
            throw new Error(`Time status: ${response2.status}`);
        }
        let time = await response2.json();

        parseAverage(queue);
        parseAverage(time);

    } catch (error) {
        console.error(`${error.name}: ${error.message}`);
    }
}

// Each intersection has multiple sensors, this calculates intersection average values
function parseAverage(data) {
    data.forEach(location => {
        const entry = trafficData.find(d => d.id === location.devName);
        if (!entry) return;

        let totalWaitTime = 0;
        let totalQueue = 0;
        let waitTimeCount = 0;
        let queueCount = 0;

        location.values.forEach(element => {
            if (element.name === "avgWaitTime") {
                totalWaitTime += element.value;
                waitTimeCount++;
            }
            else if (element.name === "avgQueueLength") {
                totalQueue += element.value;
                queueCount++;
            }
        })
        if (waitTimeCount) entry.time = totalWaitTime / waitTimeCount;
        if (queueCount) entry.queue = totalQueue / queueCount;
    });
}

async function createMap() {
    await loadLocationData();
    await fetchTrafficData();

    let map = L.map("map").setView([65.0122, 25.464], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 8,
        maxZoom: 17,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    trafficData.forEach(element => {
        let circleProperties = getCircle(element.queue);

        // Create circle
        let circle = L.circleMarker([element.lat, element.lon], {
            color: circleProperties.color,
            fillColor: circleProperties.fillColor,
            opacity: 0.8,
            radius: circleProperties.radius,
            interactive: true
        });

        circle.addTo(map);

        // Clickable marker info
        circle.bindPopup(`
            <b>Intersection: </b> ${element.location}<br>
            <b>Averages over the last 5 minutes:</b><br>
            <b>Waiting time: </b> ${element.time.toFixed(2)}s<br>
            <b>Queue length: </b> ${element.queue.toFixed(2)} vehicles
        `);
    });
    updateHTML();
}

function updateHTML() {
    let byTime = trafficData.toSorted((b, a) => a.time - b.time);
    let byQueue = trafficData.toSorted((b, a) => a.queue - b.queue);

    for (let i = 0; i < 10; i++) {
        document.getElementById("wait").innerHTML += byTime[i].location + "<br>" + byTime[i].time.toFixed(2) + "s<br>";
        document.getElementById("queue").innerHTML += byQueue[i].location + "<br>" + byQueue[i].queue.toFixed(2) + " vehicles<br>";
    }
}

createMap();