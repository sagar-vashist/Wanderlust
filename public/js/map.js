function initMap() {
  var mapContainer = document.getElementById("my-map");
  if (!mapContainer) return;

  var mapCoords =
    typeof coordinates !== "undefined" &&
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    (coordinates[0] !== 0 || coordinates[1] !== 0)
      ? coordinates
      : [77.209, 28.6139];

  if (typeof maplibregl === "undefined") {
    console.error("maplibregl library is not loaded.");
    mapContainer.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;border-radius:12px;color:#666;font-family:sans-serif;">Map unavailable right now. Please refresh the page.</div>';
    return;
  }

  var myAPIKey = (typeof mapToken !== "undefined" && mapToken) ? mapToken.trim() : "";

  var styleUrl = myAPIKey
    ? `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${myAPIKey}`
    : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  var map = new maplibregl.Map({
    container: "my-map",
    style: styleUrl,
    center: mapCoords,
    zoom: 12,
  });

  map.addControl(new maplibregl.NavigationControl());

  const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
      <h6 style="margin:0; font-weight:600;">Welcome to WanderLust!</h6>
      <p style="margin:4px 0 0; font-size:12px;">Exact location will be provided after booking.</p>
  `);

  new maplibregl.Marker({ color: "#fe424d" })
    .setLngLat(mapCoords)
    .setPopup(popup)
    .addTo(map);

  map.on("load", () => {
    map.resize();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMap);
} else {
  initMap();
}
