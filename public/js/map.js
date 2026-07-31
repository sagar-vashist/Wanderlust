import {
  Map,
  NavigationControl,
  Marker,
  Popup,
} from "https://cdn.skypack.dev/maplibre-gl";

var myAPIKey = mapToken;

var map = new Map({
  container: "my-map",
  style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${myAPIKey}`,
  center: coordinates,
  zoom: 9,
});
map.addControl(new NavigationControl());

const popup = new Popup({ offset: 25 }).setHTML(`
    <h6>Welcome to WanderLust!</h6>
    <p>Exact location will be provided after booking.</p>
`);

const marker = new Marker({ color: "red" })
  .setLngLat(coordinates)
  .setPopup(popup)
  .addTo(map);
