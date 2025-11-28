// ==========================
// DATA LOADING
// ==========================
// Load earthquake data from CSV file (Func Definer)
async function loadCSV(path, sampleSize = null) {
    // Download CSV data through Fetch API (HTTP Request)
    const response = await fetch(path);
    // Extract the content
    const csvText = await response.text();

    // Parse CSV using PapaParse library
    // Keep header, convert to number automatically, skip empty
    const result = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
    });
    // Extract the content
    let data = result.data;

    // Choose a random subset by input the sample size and shuffle it
    if (sampleSize !== null && sampleSize < data.length) {
        data = data
            .sort(() => Math.random() - 0.5)
            .slice(0, sampleSize);
    }

    return data;
}

// Load country data from JSON file (Func Definer)
async function loadJSON(path) {
    // Download JSON data through D3 JSON built in loader (HTTP Request)
    // load country geographic locations & name data
    const data = await d3.json(path)
    return data
}

// Call the CSV loader function for Earthquake Spots (Func Caller & Callback)
const earthquakeData = (await loadCSV("earthquakes.csv", 1000))
    .filter(d => 
        d.mag != null && !isNaN(d.mag) &&
        d.latitude != null && !isNaN(d.latitude) &&
        d.longitude != null && !isNaN(d.longitude) &&
        d.place != null
    );


console.log("Earthquake Data")
console.log(earthquakeData)

// Call the CSV loader function for Seismic Stations (Func Caller)
const stationData = await loadCSV('stations.csv')

// Call the JSON loader function (Function Caller)
const countryData = await loadJSON("https://unpkg.com/world-atlas@2/countries-110m.json")
console.log("Country Data")
console.log(countryData)

// Define the Sphere data
const sphereData = { type: "Sphere" }

// ==========================
// DOT FOR PAGES
// ==========================
const dots = document.querySelectorAll(".nav-dot");
const sections = [document.querySelector(".hero"),
                  document.getElementById("earth-structure-section"),
                  document.getElementById("map-section"),
                  document.getElementById("country-detail-section")];

// Scroll to section on dot click
dots.forEach((dot, i) => {
  dot.addEventListener("click", () => {
    sections[i].scrollIntoView({ behavior: "smooth" });
  });
});

// Highlight active dot on scroll
window.addEventListener("scroll", () => {
  const scrollPos = window.scrollY + window.innerHeight / 2;

  sections.forEach((sec, idx) => {
    const top = sec.offsetTop;
    const bottom = top + sec.offsetHeight;

    if (scrollPos >= top && scrollPos < bottom) {
      dots.forEach(d => d.classList.remove("active"));
      dots[idx].classList.add("active");
    }
  });
});


// ==========================
// PAGE 2: EARTH LAYERS PLOT
// ==========================
const layers = [
  { name: "Crust", color: "#d2c6a4", description: "Earth’s outer crust: thin and rigid", innerRadius: 130, outerRadius: 150 },
  { name: "Lithosphere", color: "#8e8174", description: "Lithosphere: crust + upper mantle, rigid tectonic plates", innerRadius: 100, outerRadius: 130 },
  { name: "Asthenosphere", color: "#5b4c3d", description: "Asthenosphere: partially molten, flows slowly", innerRadius: 70, outerRadius: 100 },
  { name: "Mantle", color: "#3a3637", description: "Mantle: hot, convecting rock that makes up most of Earth’s volume", innerRadius: 20, outerRadius: 70 },
];

const width2D = 400;
const height2D = 400;

const svg2D = d3.select("#earth-structure-plot")
    .append("svg")
    .attr("viewBox", `0 0 ${width2D} ${height2D}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform", `translate(${width2D/2}, ${height2D/2})`);

layers.forEach(layer => {
  const arcGen = d3.arc()
    .innerRadius(layer.innerRadius)
    .outerRadius(layer.outerRadius)
    .startAngle(-Math.PI/2)
    .endAngle(Math.PI/2);

  svg2D.append("path")
    .attr("d", arcGen())
    .attr("fill", layer.color)
    .attr("class", "layer-slice")
    .on("mouseover", event => {
      d3.select("#earth-layer-info")
        .html(`<strong>${layer.name}</strong><br>${layer.description}`);
      svg2D.selectAll(".layer-slice").attr("opacity", 0.6);
      d3.select(event.currentTarget).attr("opacity", 1);
    })
    .on("mouseout", () => {
      d3.select("#earth-layer-info").html("Hover over a layer to see details.");
      svg2D.selectAll(".layer-slice").attr("opacity", 1);
    });

  const centroid = arcGen.centroid();
  svg2D.append("text")
    .attr("x", centroid[0] * 1.1)
    .attr("y", centroid[1] * 1.1)
    .attr("text-anchor", centroid[0] > 0 ? "start" : "end")
    .attr("alignment-baseline", "middle")
    .attr("fill", "#fff")
    .style("pointer-events", "none")
    .text(layer.name);
});


// ==========================
// TOOLTIP FOR ALL GLOBES
// ==========================
const tooltip = d3.select("#globe-tooltip");


// ==========================
// PAGE 3: GLOBE 1
// ==========================

// ==========================
// PAGE 3: GLOBE 1 Right
// ==========================
const svg1R = d3.select("#globe-svg-r");  // Make sure you have a container with this ID
const path1R = d3.geoPath();
const projection1R = d3.geoOrthographic().clipAngle(90);

// GLOBAL VARIABLE INITIALIZATION -------------------------------------------->
// Create D3 selection, & locate the SVG container, 
const svg1 = d3.select("#globe-svg");

// Define path generator: GeoJSON Data [longtitude, latitude in degree] --> SVG String Path [x, y in pixel]
const path1 = d3.geoPath();
// Define projection callback: 
    // Azimuthal Projection:    Sphere --> Plane
    // Conic Projection:        Sphere --> Cone --> Plane
    // Cylindrical Projection   Sphere --> Cylinder --> Plane
    // We use Azimuthal Orthographics projection
        // 1. orthographicRaw() --> Use orthographicRaw to perform math stuff
            // LINK: https://github.com/d3/d3-geo/blob/main/src/projection/orthographic.js
        // 2. projection(orthographicRaw()) --> Wrapped by project() to access useful member function and share interface with other projection funcs
            // LINK: https://github.com/d3/d3-geo/blob/main/src/projection/index.js
        // 3. projection(orthographicRaw()).clipAngle(Radian) --> Clip to the visible hemisphere
const projection1 = d3.geoOrthographic().clipAngle(90);

// Initialize orientation value for rotation when the page loads
    // rotate1[0] --> long rotation
    // rotate1[1] --> lat rotation
let rotate1 = [0, -20];
// Initialize X,Y coordinates for DRAG & ROTATE INTERACTIONS when the page loads
let lastX1, lastY1;
// ----------------------------------------------------------------------------

// FUNCTION CALLING -----------------------------------------------------------

// Handle DRAG ROTATION INTERACTIONS (Func Caller & Callback)


// selection.call(d3.drag()) <--> d3.drag().apply(selection)
// D3 Built-in Interactions:
    // Brush, Dispatch, Drag, Zoom
    // We use drag interaction here
const drag_behavior = d3.drag()
    // Event when user start press on the globe
    .on("start", event => { 
        // Record current X,Y coordinates
        lastX1 = event.x; 
        lastY1 = event.y; 
    })
    // Event when user continue to drag the globe
    .on("drag", event => {
        // Find diff X,Y coordinates from BEFORE drag and AFTER drag coordinates
        const dx = event.x - lastX1;
        const dy = event.y - lastY1;
        // dx = event.x - lastX1; dy = event.y - lastY1;
        // Change rotation amount
            // Choose 0.7 because you don't want the rotation to be too sensitive, ruin UX
            // Choose rotate1[0] += because when you move left, it rotates toward left, vice versa
            // Choose rotate1[1] -= because invert the direction align with MacOS standard, when you move up, you scroll down, vice versa
            // Choose Math.max(-90, Math.min(90, rotate1[1])), because you will flip the earth vertically and disoriented
                // If you don't believe what I said, try it
        rotate1[0] += dx * 0.8;
        rotate1[1] -= dy * 0.8;
        rotate1[1] = Math.max(-90, Math.min(90, rotate1[1]));
        // Rotate <path>, NOT <circle>, in horizontal/vertical direction specifed by rotate1
        // projection(orthographicRaw()).rotate([λ, φ])
        projection1.rotate(rotate1);
        projection1R.rotate(rotate1);
        
        // Re-render the SVG <path>
        // It DOES NOT re-render <circle>
        svg1.select("path#globe-sphere1").attr("d", path1);
        svg1.selectAll(".country1").attr("d", path1);
        svg1R.select("path#globe-sphere1R").attr("d", path1R);
        svg1R.selectAll(".country1R").attr("d", path1R);

        // Re-render the SVG <circle> with the correct X,Y coordinates
        // It DOES NOT re-render other SVG elements: <path>, <line>, <text>, whatever
        updateEarthquakes();

        // Update the current X,Y coordinates
        lastX1 = event.x;
        lastY1 = event.y;
    })

drag_behavior(svg1)
drag_behavior(svg1R)

// Create Base Sphere (Func Caller)
plotBaseSphere(svg1, sphereData, 'globe-sphere1')

// Create Country Sphere (Func Caller)
plotCountriesRegions(svg1, countryData, 'country1')

// Create Earthquake Spots (Func Caller)
plotEarthquakesPoints(svg1, earthquakeData)

// Resize it when page first loaded (Func Caller)
// Try remove it then it won't show up for page first load until you do something to the window to trigger it, i.e. inspect
resizeGlobe1(svg1, path1, projection1, 'globe-sphere1', 'country1');

// Resize for Web Responsive Design (CSS Flex Display Simply Won't Help) (Event Listener Caller & Callback)
window.addEventListener("resize", () => resizeGlobe1(svg1, path1, projection1, 'globe-sphere1', 'country1'));
// --------------------------------------------------------------------------


plotBaseSphere(svg1R, sphereData, 'globe-sphere1R')

plotCountriesRegions(svg1R, countryData, 'country1R')

resizeGlobe1(svg1R, path1R, projection1R, 'globe-sphere1R', 'country1R');

window.addEventListener("resize", () => resizeGlobe1(svg1R, path1R, projection1R, 'globe-sphere1R', 'country1R'));

// FUNCTION DEFINITION ----------------------------------------------------->
// Function to plot blank sphere globe (Func Definer)
function plotBaseSphere(selection, data, idName) {
    selection.append("path")
        // Input Sphere data
        .datum(data)
        // SVG Name Attribute
        .attr("id", idName)
        // SVG Styling
        .attr("fill", "#000")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);
}

// Function to plot countries sphere & Handle CLICK COUNTRY NAME INTERACTIONS (Func Definer)
function plotCountriesRegions(selection, data, className) {
    // Extract relevant country data from the object
    const countryGeoNameData = topojson.feature(data, data.objects.countries).features;
    console.log(countryGeoNameData)

    // Create SVG group <g> for groups of countries <path>
    const countriesGroup1 = selection.append("g")
        // SVG Name Attribute
        .attr("class", "countries");

    // Create D3 selection & locate the country group container
    // countriesGroup1.selectAll(".country")
    countriesGroup1.selectAll(`.${className}`)
        // Input Country Geometry & Name data
        .data(countryGeoNameData)
        .enter()
        // Create individual country <path>
        .append("path")
        // SVG Styling
        // .attr("class", "country")
        .attr("class", className)
        .attr("fill", "#222222")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)

        // Event when user hover on the country polygon
        .on("mouseover", function(event, d) {
            // Create D3 selection & locate selected country <path>
            d3.select(this)
                // SVG Styling
                // Highlight selected country region
                .attr("fill", "#2156e9ff");
            // Display tooltip info for selected country
            tooltip.text(d.properties.name)
                .style("display","block")
                .style("left", (event.pageX + 10) + "px")
                .style("top",  (event.pageY + 10) + "px");
        })
        // Event when user no longer hover on the country polygon
        .on("mouseout", function() {
            // Create D3 selection & locate selected country <path>
            d3.select(this)
                // SVG Styling
                // Reset the selected country region
                .attr("fill", "#222222");
            // Hide tooltip info
            tooltip.style("display","none");
        });
}

// Function to plot earthquake spot to globe & Handle TOOLTIP HOVER INTERACTIONS (Func Definer)
function plotEarthquakesPoints(selection, data) {
    // Compute min and max magnitude from earthquakeData
    const minMag = d3.min(data, d => d.mag);
    const maxMag = d3.max(data, d => d.mag);
    // Define color --> gradient from orange → red
    const GradColor = d3.scaleLinear()
        .domain([minMag, maxMag])
        .range(["pink", "red"])           
        .interpolate(d3.interpolateLab);

    // Create SVG group <g> for groups of earthquake spots <circle>
    const earthquakesGroup = selection.append("g")
        // SVG Name Attribute
        .attr("class", "earthquakes")
        // .attr("clip-path", "url(#front-hemisphere)");

    // Create D3 selection & locate the earthquake group container
    earthquakesGroup.selectAll("circle")
        // Input Earthquake data
        .data(data)
        .enter()
        // Create individual earthquake <circle>
        .append("circle")
        // Define position using projection: [long, lat] --> [x, y]
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        // SVG Styling
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        .attr("r", d => Math.sqrt(Math.abs(d.mag)) * 2)
        .attr("fill", d => GradColor(d.mag))
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.3)
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0)

        // Event when hover on the earthquake point
        .on("mouseover", function(event, d) {
            // Create D3 selection & locate the selected point
            // Enlarge and darken the points with animated transition
            d3.select(this)
                // SVG Styling
                .transition()
                .duration(150)
                .attr("fill", "#4d1515ff")
                .attr("r", Math.sqrt(d.mag) * 4);  

            // Display Tooltip details only for visible points
            if (isPointVisible(d.longitude, d.latitude, rotate1)) {
                // Initialize location & distance data
                let location = d.place;
                let distance = "";

                // Preprocess data
                if (d.place.includes(",")) {
                    const parts = d.place.split(",");
                    distance = parts[0].trim();
                    location = parts[1].trim();
                }

                // Show data
                tooltip.html(`
                    <strong>${location}</strong><br>
                    ${distance ? `* Distance: ${distance}<br>` : ""}
                    * Mag: ${d.mag != null ? d.mag : "Unknown"}
                `)
                // Tooltip Styling
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top",  (event.pageY + 10)  + "px");
            }
            else {
                tooltip.style("display","none");
            }

        })
        // Event when no longer hover on the earthquake point
        .on("mouseout", function(_, d) {
            // Reset Tooltip
            tooltip.style("display","none");
            
            // Create D3 selection & locate the selected point
            // shrink back to original radius with animated transition
            d3.select(this)
                // SVG Styling
                .transition()
                .duration(150)
                .attr("fill", d => GradColor(d.mag))
                .attr("r", Math.sqrt(d.mag) * 2);
        });
}

// Function to resize global to fit current container (Func Definer)
function resizeGlobe1(selection, pathFunc, projectionFunc, idNameSphere, classNameCountry) {
    const containerWidth = selection.node().parentNode.getBoundingClientRect().width;

    selection
        .attr("width", containerWidth)
        .attr("height", containerWidth);

    projectionFunc
        .translate([containerWidth / 2, containerWidth / 2])
        .scale(containerWidth / 2 * 0.9);

    pathFunc.projection(projectionFunc);

    selection.select(`#${idNameSphere}`)
        .attr("d", pathFunc);
    selection.selectAll(`.${classNameCountry}`)
        .attr("d", pathFunc);

    updateEarthquakes();
}

// Function to update earthquakes on rotation or resize (Func Definer)
function updateEarthquakes() {
    // Ensure <circle> are both shown/hidden and update to rotated positions
    // Create D3 selection & locate the <circle>
    svg1.selectAll(".earthquakes circle")
        // Update X,Y positions with projection
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        // SVG Styling
        .attr("opacity", d =>
            isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0
        );
}

// Function to determine if an earthquake point should be visible or not (Function Definer)
function isPointVisible(lon, lat, rotate) {
    // Use math to update if <circle> should be shown or hidden
    const λ = lon * Math.PI/180;
    const φ = lat * Math.PI/180;

    // invert rotation
    const λ0 = -rotate[0] * Math.PI/180;
    const φ0 = -rotate[1] * Math.PI/180;

    const cosc = Math.sin(φ0)*Math.sin(φ) +
                 Math.cos(φ0)*Math.cos(φ)*Math.cos(λ - λ0);

    // visible hemisphere
    return cosc > 0;
}
// --------------------------------------------------------------------------


// // ==========================
// // PAGE 4: GLOBE 2 + CONNECTOR
// // ==========================
// const svg2 = d3.select("#globe-svg-2");
// const path2 = d3.geoPath();
// const projection2 = d3.geoOrthographic().clipAngle(90);

// let rotate2 = [0, -20];
// let lastX2, lastY2;

// svg2.append("path")
//     .datum({type:"Sphere"})
//     .attr("class", "globe-sphere")
//     .attr("fill", "#000")
//     .attr("stroke", "#fff")
//     .attr("stroke-width", 0.5);

// const countriesGroup2 = svg2.append("g").attr("class", "countries");
// const countryMapSvg = d3.select("#country-map");

// let selectedCountry = null;
// let connectorPath = null;

// d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
//     const countries = topojson.feature(worldData, worldData.objects.countries).features;

//     countriesGroup2.selectAll(".country")
//         .data(countries)
//         .enter()
//         .append("path")
//         .attr("class", "country")
//         .attr("fill", "#000")
//         .attr("stroke", "#fff")
//         .attr("stroke-width", 0.5)
//         .on("mouseover", (event, d) => {
//         if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#2156e9ff");
//         tooltip.text(d.properties.name)
//                 .style("display","block")
//                 .style("left", (event.pageX + 10) + "px")
//                 .style("top",  (event.pageY + 10) + "px");
//         })
//         .on("mousemove", event => {
//         tooltip.style("left", (event.pageX + 10) + "px")
//                 .style("top",  (event.pageY + 10) + "px");
//         })
//         .on("mouseout", (event, d) => {
//         if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#000");
//         tooltip.style("display","none");
//         })
//         .on("click", (event, d) => {
//         if (selectedCountry) {
//             countriesGroup2.selectAll(".country")
//             .filter(c => c.properties.name === selectedCountry.properties.name)
//             .attr("fill", "#000");
//         }
//         d3.select(event.currentTarget).attr("fill", "#ffb347");
//         selectedCountry = d;

//         d3.select("#country-name").text(d.properties.name);
//         d3.select("#country-details").text(`You clicked on ${d.properties.name}.`);

//         // draw country map
//         countryMapSvg.selectAll("*").remove();
//         const cw = countryMapSvg.node().getBoundingClientRect().width;
//         const ch = countryMapSvg.node().getBoundingClientRect().height;
//         const countryProjection = d3.geoMercator().fitSize([cw, ch], d);
//         const countryPath = d3.geoPath().projection(countryProjection);

//         countryMapSvg.append("path")
//             .datum(d)
//             .attr("d", countryPath)
//             .attr("fill", "#2156e9ff")
//             .attr("stroke", "#000")
//             .attr("stroke-width", 1);

//         drawConnector();
//         });

//     resizeGlobe2();
// });

// // Connector Globe 2 + Country
// function drawConnector(){
//   // remove existing
//   if (connectorPath) connectorPath.remove();

//   const globeSvg = d3.select("#globe-svg-2").node();
//   const countrySvg = d3.select("#country-map").node();
//   const gBBox = globeSvg.getBoundingClientRect();
//   const cBBox = countrySvg.getBoundingClientRect();

//   const startX = gBBox.x + gBBox.width;
//   const startY = gBBox.y + gBBox.height / 2;
//   const endX = cBBox.x;
//   const endY = cBBox.y + cBBox.height / 2;

//   const connectorSvg = d3.select("#line-connector");

//   connectorPath = connectorSvg.append("path")
//     .attr("d", `M${startX},${startY} L${endX},${endY}`)
//     .attr("fill", "none")
//     .attr("stroke", "#fff")
//     .attr("stroke-width", 2)
//     .attr("stroke-dasharray", function() {
//       const len = this.getTotalLength();
//       return `${len} ${len}`;
//     })
//     .attr("stroke-dashoffset", function() {
//       return this.getTotalLength();
//     });

//   connectorPath.transition()
//     .duration(1000)
//     .ease(d3.easeLinear)
//     .attr("stroke-dashoffset", 0);
// }

// svg2.call(d3.drag()
//     .on("start", event => { lastX2 = event.x; lastY2 = event.y; })
//     .on("drag", event => {
//         const dx = event.x - lastX2;
//         const dy = event.y - lastY2;
//         lastX2 = event.x; lastY2 = event.y;
//         rotate2[0] += dx * 0.7;
//         rotate2[1] -= dy * 0.7;
//         rotate2[1] = Math.max(-90, Math.min(90, rotate2[1]));
//         projection2.rotate(rotate2);
//         svg2.selectAll("path").attr("d", path2);

//         // remove connector when globe moves
//         if (connectorPath) {
//             connectorPath.remove();
//             connectorPath = null;
//         }
//     })
// );

// function resizeGlobe2(){
//   const cw = svg2.node().parentNode.getBoundingClientRect().width;
//   svg2.attr("width", cw).attr("height", cw);
//   projection2.translate([cw/2, cw/2]).scale(cw/2 * 0.9);
//   path2.projection(projection2);
//   svg2.select(".globe-sphere").attr("d", path2);
//   svg2.selectAll(".country").attr("d", path2);

//   // optionally redraw connector if country is selected
//   if (selectedCountry) drawConnector();
// }
// window.addEventListener("resize", resizeGlobe2);
// window.addEventListener("scroll", () => {
//   if (selectedCountry) drawConnector();
// });