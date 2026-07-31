function initMap() {
  var myAPIKey = (typeof mapToken !== "undefined" && mapToken) ? mapToken : "91a747defc6d451299a4bc539e931e81";

  var mapCoords = (typeof coordinates !== "undefined" && Array.isArray(coordinates) && coordinates.length === 2 && (coordinates[0] !== 0 || coordinates[1] !== 0))
    ? coordinates
    : [77.2090, 28.6139];

  var mapContainer = document.getElementById("my-map");
  if (!mapContainer) return;

  if (typeof maplibregl !== "undefined") {
    var map = new maplibregl.Map({
      container: "my-map",
      style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${myAPIKey}`,
      center: mapCoords,
      zoom: 9,
    });

    map.addControl(new maplibregl.NavigationControl());

    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <h6>Welcome to WanderLust!</h6>
        <p>Exact location will be provided after booking.</p>
    `);

    const marker = new maplibregl.Marker({ color: "red" })
      .setLngLat(mapCoords)
      .setPopup(popup)
      .addTo(map);
  } else {
    console.error("maplibregl library is not loaded.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMap);
} else {
  initMap();
}
