var map = L.map("map").setView([40.66995747013945, -103.59179687498357], 4);

L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);

// Creates clusters with numbers of campgrounds close to each other
var markers = L.markerClusterGroup();

for (var i = 0; i < campgrounds.length; i++) {
    var [latitude, longitude] = campgrounds[i].geometry.coordinates;
    var title = campgrounds[i].title;
    var marker = L.marker(new L.LatLng(longitude, latitude), {
        title: title,
    });
    marker.bindPopup(title);
    markers.addLayer(marker);
}

map.addLayer(markers);