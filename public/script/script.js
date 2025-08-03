const socket = io();
const map = L.map('map').setView([0, 0], 18);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

const yourCustomIcon = L.icon({
    iconUrl: '/img/your.png',
    iconSize: [30, 30],
});

const otherUserIcon = L.icon({
    iconUrl: '/img/other.png',
    iconSize: [30, 30],
});

const myMarker = L.marker([0, 0], { icon: yourCustomIcon }).addTo(map);

const otherRiders = {};
let firstTime = true;
let userIsInteracting = false;

// Detect manual map interactions (zoom or pan)
map.on('zoomstart', () => {
    userIsInteracting = true;
});
map.on('zoomend', () => {
    // Allow a short delay to ensure interaction is complete
    setTimeout(() => {
        userIsInteracting = false;
    }, 500);
});
map.on('movestart', () => {
    userIsInteracting = true;
});
map.on('moveend', () => {
    setTimeout(() => {
        userIsInteracting = false;
    }, 500);
});

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            // Emit location update to the server
            socket.emit('rider:locationUpdate', { latitude, longitude });

            // Update the user's marker position
            myMarker.setLatLng([latitude, longitude]);

            // Only set the initial view or pan if the user isn't interacting
            if (firstTime) {
                map.setView([latitude, longitude], 18);
                firstTime = false;
            } else if (!userIsInteracting) {
                map.panTo([latitude, longitude]);
            }
        },
        (err) => console.error('Location error:', err),
        { enableHighAccuracy: true, timeout: 1000, maximumAge: 0 } //1-sec just for demonstration
    );
}

socket.on('rider:locationBroadcast', ({ id, latitude, longitude }) => {
    if (id === socket.id) return;

    if (!otherRiders[id]) {
        const marker = L.marker([latitude, longitude], {
            icon: otherUserIcon,
        }).addTo(map);
        otherRiders[id] = marker;
    } else {
        otherRiders[id].setLatLng([latitude, longitude]);
    }
});

socket.on('rider:disconnected', ({ id }) => {
    if (otherRiders[id]) {
        map.removeLayer(otherRiders[id]);
        delete otherRiders[id];
    }
});