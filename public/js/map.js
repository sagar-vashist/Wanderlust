function initMap() {
  var mapContainer = document.getElementById("my-map");
  if (!mapContainer) return;

  var mapCoords = (typeof coordinates !== "undefined" && Array.isArray(coordinates) && coordinates.length === 2 && (coordinates[0] !== 0 || coordinates[1] !== 0))
    ? coordinates
    : [77.2090, 28.6139];

  var myAPIKey = (typeof mapToken !== "undefined" && mapToken && mapToken.trim() !== "") ? mapToken : "91a747defc6d451299a4bc539e931e81";

  // Primary Geoapify style URL, with instant fallback to CartoDB Positron vector map
  var primaryStyle = `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${myAPIKey}`;
  var fallbackStyle = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  if (typeof maplibregl !== "undefined") {
    var map = new maplibregl.Map({
      container: "my-map",
      style: fallbackStyle,
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

    // Resize map after load to ensure container dimensions calculate properly
    map.on("load", () => {
      map.resize();
    });
  } else {
    console.error("maplibregl library is not loaded.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMap);
} else {
  initMap();
}
