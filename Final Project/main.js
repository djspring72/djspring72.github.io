let countyData = {};
let mapLayer;
const map = L.map('map').setView([35.5, -79.8], 7);

function getColor(score, maxScore) {
// Normalize the score relative to max in view
const ratio = maxScore > 0 ? score / maxScore : 0;
// Blue scale from light to dark
return ratio >= 0.95 ? '#08306b' :
ratio >= 0.8 ? '#08519c' :
ratio >= 0.65 ? '#2171b5' :
ratio >= 0.5 ? '#4292c6' :
ratio >= 0.35 ? '#6baed6' :
ratio >= 0.2 ? '#9ecae1' :
ratio >= 0.05 ? '#c6dbef' :
'#f7fbff'; // very light blue for near zero
}

function computeCountyCenters(features) {
const centers = {};
const grouped = {};
features.forEach(f => {
const name = f.properties.county.replace(" County", "").toLowerCase();
grouped[name] = grouped[name] || [];
grouped[name].push(f);
});
for (const [name, feats] of Object.entries(grouped)) {
const coords = feats.map(f => L.geoJSON(f).getBounds().getCenter());
const avg = coords.reduce((a, b) => ({ lat: a.lat + b.lat, lng: a.lng + b.lng }));
centers[name] = L.latLng(avg.lat / coords.length, avg.lng / coords.length);
}
return centers;
}

let geojsonData, countyCenters;

Promise.all([
fetch('nc_county_scores_by_year_and_weight.json').then(res => res.json()),
fetch('National_Atlas_County_Boundaries_(USGS).geojson').then(res => res.json())
]).then(([scores, geo]) => {
countyData = scores;
geojsonData = geo.features.filter(f => f.properties.state === 'NC');
countyCenters = computeCountyCenters(geojsonData);

// Set map bounds to NC only
const bounds = L.geoJSON(geojsonData).getBounds();
map.fitBounds(bounds);
map.setMaxBounds(bounds);
map.setMinZoom(map.getZoom() - 1);

populateDropdowns();
updateMap();
});

function populateDropdowns() {
const years = new Set();
const weights = new Set();

for (const county of Object.values(countyData)) {
for (const year of Object.keys(county)) {
years.add(year);
for (const weight of Object.keys(county[year])) {
weights.add(weight);
}
}
}

const yearSel = document.getElementById('yearFilter');
[...years].sort().forEach(y => {
yearSel.innerHTML += `<option value="${y}">${y}</option>`;
});

const weightSel = document.getElementById('weightFilter');
[...weights]
.sort((a, b) => {
const aNum = parseInt(a.split(/[^\d]/)[0], 10);
const bNum = parseInt(b.split(/[^\d]/)[0], 10);
return aNum - bNum;
})
.forEach(w => {
weightSel.innerHTML += `<option value="${w}">${w}</option>`;
});

yearSel.addEventListener('change', updateMap);
weightSel.addEventListener('change', updateMap);
}

function getSelectedFilters() {
return {
year: document.getElementById('yearFilter').value,
weight: document.getElementById('weightFilter').value
};
}

function getFilteredStats(countyName, filters) {
const c = countyData[countyName] || {};
let total = { first: 0, second: 0, third: 0, mow: 0, score: 0 };

const years = filters.year === 'all' ? Object.keys(c) : [filters.year];
years.forEach(y => {
const weights = c[y] || {};
const keys = filters.weight === 'all' ? Object.keys(weights) : [filters.weight];
keys.forEach(w => {
const stats = weights[w];
if (stats) {
total.first += stats.first;
total.second += stats.second;
total.third += stats.third;
total.mow += stats.mow;
total.score += stats.score;
}
});
});

return total;
}

function updateMap() {
if (mapLayer) map.removeLayer(mapLayer);

const filters = getSelectedFilters();
const seen = new Set();

// Calculate max score for visible counties with current filters
let maxScore = 0;
geojsonData.forEach(feature => {
const name = feature.properties.county.replace(" County", "").toLowerCase();
const stats = getFilteredStats(name, filters);
if (stats.score > maxScore) maxScore = stats.score;
});

mapLayer = L.geoJson(geojsonData, {
style: feature => {
const name = feature.properties.county.replace(" County", "").toLowerCase();
const stats = getFilteredStats(name, filters);
return {
fillColor: getColor(stats.score, maxScore),
weight: 1.5,
color: 'black',
fillOpacity: 0.8
};
},
onEachFeature: (feature, layer) => {
const name = feature.properties.county.replace(" County", "");
const key = name.toLowerCase();
const stats = getFilteredStats(key, filters);

layer.bindPopup(`
<strong>${name} County</strong><br>
Total Score: ${stats.score}<br>
1st Placers: ${stats.first}<br>
2nd Placers: ${stats.second}<br>
3rd Placers: ${stats.third}<br>
Most Outstanding Wrestlers: ${stats.mow}
`);

if (!seen.has(key)) {
const center = countyCenters[key];
if (center) {
layer.bindTooltip(name, {
permanent: true,
direction: "center",
className: "county-label"
});
seen.add(key);
}
}
}
}).addTo(map);
}


const legend = L.control({ position: 'bottomleft' });

legend.onAdd = function (map) {
const div = L.DomUtil.create('div', 'info legend');
div.innerHTML = `
<h4>Wrestling Preformance</h4>
<div class="legend-box"><div class="legend-color" style="background:#08306b"></div> High</div>
<div class="legend-box"><div class="legend-color" style="background:#2171b5"></div> Medium</div>
<div class="legend-box"><div class="legend-color" style="background:#c6dbef"></div> Low</div>
<div class="legend-box"><div class="legend-color" style="background:#ffffff; border: 1px solid #ccc;"></div> No Score</div>
`;
return div;
};

legend.addTo(map);
