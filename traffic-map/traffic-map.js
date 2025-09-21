const apiUrl = "https://api.oulunliikenne.fi/tpm/kpi/traffic-volume";
const locationFile = "intersections.json";

// Leaflet circle properties by traffic volume
function getCircle(value) {
    let cColor, cFillColor, cRadius;

    if (value >= 200 && value < 300) {
        cColor = "yellow";
        cFillColor = "yellow";
        cRadius = 10;
    }
    if (value >= 300 && value < 1000) {
        cColor = "orange";
        cFillColor = "orange";
        cRadius = 20;
    }
    if (value >= 1000) {
        cColor = "red";
        cFillColor = "red";
        cRadius = 30;
    } 
    return {color: cColor, fillColor: cFillColor, radius: cRadius};
}

// Load intersection coordinates from file
async function loadLocationData(trafficData) {
    const response = await fetch(locationFile);
    const locations = await response.json();

    locations.forEach(element => {
        trafficData.push({id: element.id, location: element.location, lat: element.lat, lon: element.lon, value: 0});
    });
}

// Traffic volume from API
async function fetchTrafficData(trafficData) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        traffic = await response.json();

        traffic.forEach(location => {
            const entry = trafficData.find(d => d.id === location.devName);
            if (!entry) return;

            let total = 0;
            location.values.forEach(element => {
                if (element.name === "trafficVolume") {
                    total = total + element.value;
                }
            })
            entry.value = total;
        });

    } catch (error) {
        console.error(error.message);
    }
}

async function createMap() {
    let trafficData = [];
    let circleProperties = [];
    await loadLocationData(trafficData);
    await fetchTrafficData(trafficData);

    let map = L.map("map").setView([65.0122, 25.464], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 8,
        maxZoom: 17,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    trafficData.forEach(element => {
        circleProperties = getCircle(element.value);

        let cColor = circleProperties.color;
        let cFillColor = circleProperties.fillColor;
        let cRadius = circleProperties.radius;

        // Create circle and add to map
        let circle = L.circleMarker([element.lat, element.lon], {
            color: cColor,
            fillColor: cFillColor,
            opacity: 0.8,
            radius: cRadius,
            interactive: true
        }).addTo(map);

        // Clickable marker info
        circle.bindPopup(`<b>Intersection: </b> ${element.location} </br>
            <b>Traffic during last 5 minutes: </b> ${element.value}`
        );
    });
}

createMap();