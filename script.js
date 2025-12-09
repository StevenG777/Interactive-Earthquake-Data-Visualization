// ============================
// FOR ALL PAGES: DATA LOADING
// ============================
// Load CSV data from JSON file (Func Definer)
async function loadCSV(path, sampleSize = null) {
  
    const response = await fetch(path);
    // Extract the content
    const csvText = await response.text();


    const result = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
    });

    let data = result.data;

    if (sampleSize !== null && sampleSize < data.length) {
        data = data
            .sort(() => Math.random() - 0.5)
            .slice(0, sampleSize);
    }

    return data;
}

// Load JSON data from JSON file (Func Definer)
async function loadJSON(path) {
    const data = await d3.json(path)
    return data
}

// Call the CSV loader function for Earthquake Spots (Func Caller & Callback)
const earthquakeData = (await loadCSV("earthquakes.csv"))
    .filter(d => 
        d.mag != null && !isNaN(d.mag) &&
        d.latitude != null && !isNaN(d.latitude) &&
        d.longitude != null && !isNaN(d.longitude) &&
        d.place != null
    );
console.log("Earthquake Data")
console.log(earthquakeData)

// Call the CSV loader function for Seismic Stations (Func Caller)
const stationData = (await loadCSV('stations.csv'))
    .filter(d =>   
        d.latitude != null && !isNaN(d.latitude) &&
        d.longitude != null && !isNaN(d.longitude) &&
        d.name != null
    )
console.log("Seismic Station Data")
console.log(stationData)

// Call the JSON loader function (Function Caller)
const countryData = await loadJSON("https://unpkg.com/world-atlas@2/countries-110m.json")
console.log("Country Data")
console.log(countryData)

// Define the Sphere data (Object Definer)
const sphereData = { type: "Sphere" }
console.log("Sphere GeoJSON Data")
console.log(sphereData)


// ==============================
// FOR ALL PAGES: GLOBAL TOOLTIP
// ==============================
const tooltip = d3.select("#globe-tooltip");


// ===================================
// FOR ALL PAGES: PAGE NAVIGATION DOTS
// ===================================
// Navigate page when you click dot (Func Definer)
function scrollToPageOnClick(dots) {
    function navigateToPage(dot) {
        // Get target element based on dot
        const targetId = dot.getAttribute("data-target");
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        // Scroll to target element
        targetEl.scrollIntoView({ behavior: 'smooth' });
    }

    // Iterate each dot <span> element & listen on the clicked dot
    dots.forEach(dot => {
        dot.addEventListener("click", () => navigateToPage(dot));
    });
}

// Activate dot when you scroll page (Func Definer)
function activateClosestDotOnScroll(dots) {
    // Initialize vars
    let closestDot = null;
    let closestDistance = Infinity;

    // Iterate each dot <span> element & find the closest dot to be activated
    dots.forEach(dot => {
        // Get target element based on dot
        const targetId = dot.getAttribute("data-target");
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        // Calculate distance between the top of current page and top of view port
        const rect = targetEl.getBoundingClientRect();
        const distance = Math.abs(rect.top);

        // When new page arrives, it will have the smaller diff distance and become the closest dot
        if (distance < closestDistance) {
            closestDistance = distance;
            closestDot = dot;
        }
    });

    // Reset all dots & Activate the closest dot
    if (closestDot) {
        dots.forEach(d => d.classList.remove("active"));
        closestDot.classList.add("active");
    }
};

// Click dot to navigate pages, and activate closest dot through scrolling
function initDotSroll() {
    // Get all dots and sections
    const dots = document.querySelectorAll(".nav-dot");
    // Define click event listener (inside the function) (Func Caller)
    scrollToPageOnClick(dots);
    // Define scroll event listener (outside the function) (Func Caller & Func Callback)
    window.addEventListener("scroll", () => activateClosestDotOnScroll(dots));
}

// Call the init function (Func Caller)
initDotSroll();


// =====================
// PAGE 3: EARTH LAYERS
// =====================
// Show debugging info (Func Definer)
function debugMode(hotspots, infoBox, on=false) {
    // Check validity of fetched element
    if (!hotspots.length) { console.warn("No .hotspot elements found. Check your HTML."); return; }
    if (!infoBox) { console.warn("No #earth-layer-info element found."); return; }

    // Check hidden buttons
    if (on) {
        h.style.background = "rgba(255,0,0,0.18)";
        h.style.outline = "1px solid rgba(255,0,0,0.6)";
    }
}

// Show earth layer info on types of event (Func Definer)
function initHotspots() {
    // Extract relevant HTML elements
    const hotspots = document.querySelectorAll(".hotspot");
    const infoBox = document.getElementById("earth-layer-info");
    // Initialize default msg
    const defaultMsg = "Hover over or press tab to learn more.";

    // Debug mode
    debugMode(hotspots, infoBox);

    // Actions on buttons
    hotspots.forEach((h, i) => {
        // Button styling
        h.style.position = h.style.position || "absolute";
        h.style.left = h.style.left || `${20 + i*10}%`;
        h.style.top = h.style.top || "50%";
        h.style.width = h.style.width || "18%";
        h.style.height = h.style.height || "10%";
        h.style.background = "transparent";
        h.style.outline = "none";

        // Organize text content on hotspot (Func Definer & Callback)
        // Keeping track of time prevent the click & disppear glitch
        let timer = null;
        const name = h.dataset.name || `Layer ${i+1}`;
        const desc = h.dataset.desc || "No description supplied.";
        const show = () => { infoBox.innerHTML = `<strong>${name}</strong><br>${desc}`; }
        const reset = () => { infoBox.textContent = defaultMsg; }
        const showWithCountDown = (e) => {
            // Stop the default action depends on event types
                // click: submit a form, navigate through URL, toggle checkbox, ...
                // touchstart: continue to scroll the screen in mobile device
            e.preventDefault();
            // Focus on one timer, no need for multiple to accumulate countdown when you click many times
            clearTimeout(timer);
            show();
            // Count down timer
            timer = setTimeout(reset, 3000);    
        }

        // Switch text content on different Desktop-based events (Func Callback)
        h.addEventListener("mouseenter", show);
        h.addEventListener("mouseleave", reset);
        // For accessibility
        h.addEventListener("focus", show);
        h.addEventListener("blur", reset);

        // Switch text content on different Mobile-based events (Func Callback)
        h.addEventListener("click", (e) => showWithCountDown(e));
        h.addEventListener("touchstart", (e) => showWithCountDown(e), { passive: false }); // Required for default action to kick in
    });

    // Actions on text box
    // Text box styling
    infoBox.style.maxWidth = infoBox.style.maxWidth || "360px"; 
    infoBox.style.minHeight = infoBox.style.minHeight || "120px"; 
    infoBox.style.boxSizing = infoBox.style.boxSizing || "border-box";
    infoBox.style.padding = infoBox.style.padding || "14px";
}

// Call the init function (Func Caller)
initHotspots();


// ===================================
// PAGE 4: EARTHQUAKE CAUSE ANIMATION
// ===================================
// Define Paths to specific GIFs
const featureGIFs = {
    "Plate Tectonics": "gifs/plate_tectonics.gif",
    "Faults": "gifs/fault_lines.webp",
    "Volcanic Activity": "gifs/volcanic_activity.gif",
    "Seismic Waves": "gifs/seismic_waves.gif",
    "Human-Induced Seismicity": "gifs/human_seismicity.gif",
    "Crustal Adjustments": "gifs/crustal_adjustments.gif"
};

// Change animation on hover (Func Definer)
function initChangeAnimation(){
    // Fetch relevant HTML elements
    const gifEl = document.getElementById("feature-gif");
    const featureBoxes = document.querySelectorAll(".feature-box");

    // Iterate each box to perform actions
    featureBoxes.forEach(box => {
        // Change a corresponding animation on hover
        box.addEventListener("mouseenter", () => {
            // Filter feature by title
            const title = box.querySelector("h3").textContent.trim();
            if (featureGIFs[title]) {
                // Change animation content
                gifEl.src = featureGIFs[title];
                gifEl.style.display = "block";
            }
        });
        // Reset to default animation
        box.addEventListener("mouseleave", () => {
            // Change to default animation content
            gifEl.style.display = "gifs/evolution2.gif";
            gifEl.src = "gifs/evolution2.gif";
        });
    });
}

// Call the init function (Func Caller)
initChangeAnimation();


// ================================
// PAGE 5: GLOBES & COUNTRY SEARCH
// ================================
// VARIABLE INITIALIZATION ----------------------------------------------------
const svg1 = d3.select("#globe-svg");
const svg1R = d3.select("#globe-svg-r");

// Define path generator: GeoJSON Data [longtitude, latitude in degree] --> SVG String Path [x, y in pixel]
const path1 = d3.geoPath();
const path1R = d3.geoPath();

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
const projection1R = d3.geoOrthographic().clipAngle(90);

// Initialize orientation value for rotation when the page loads
    // rotate1[0] --> long rotation
    // rotate1[1] --> lat rotation
let rotate1 = [0, -20];
// Initialize X,Y coordinates for DRAG & ROTATE INTERACTIONS when the page loads
let lastX1, lastY1;
// ----------------------------------------------------------------------------

// FUNCTION CALLING -----------------------------------------------------------
// Handle DRAG ROTATION INTERACTIONS (Func Definer, Func Caller & Callback)
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
        updateStations();

        // Update the current X,Y coordinates
        lastX1 = event.x;
        lastY1 = event.y;
    });

plotBaseSphere(svg1, sphereData, 'globe-sphere1');
svg1.call(drag_behavior);
plotCountriesRegions(svg1, countryData, 'country1');
plotEarthquakesPoints(svg1, earthquakeData);
createGradientLegend(earthquakeData);
resizeGlobe1(svg1, path1, projection1, 'globe-sphere1', 'country1');

plotBaseSphere(svg1R, sphereData, 'globe-sphere1R');
svg1R.call(drag_behavior);
plotCountriesRegions(svg1R, countryData, 'country1R');
plotStationsPoints(svg1R, stationData);
resizeGlobe1(svg1R, path1R, projection1R, 'globe-sphere1R', 'country1R');
// ----------------------------------------------------------------------------

// FUNCTION DEFINITION --------------------------------------------------------
// Plot empty dark with white outline globe (Func Definer)
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

// Plot country to globe & Handle TOOLTIP HOVER INTERACTIONS (Func Definer)
function plotCountriesRegions(selection, data, className) {
    const countryGeoNameData = topojson.feature(data, data.objects.countries).features;
    const countriesGroup1 = selection.append("g")
        .attr("class", "countries");

    countriesGroup1.selectAll(`.${className}`)
        .data(countryGeoNameData)
        .enter()
        .append("path")
        .attr("class", className)
        .attr("fill", "#222222")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)

       
        .on("mouseover", function(event, d) {
            
            d3.select(this)
                .attr("fill", "#2156e9ff");
            
            tooltip.text(d.properties.name)
                .style("display","block")
                .style("left", (event.pageX + 10) + "px")
                .style("top",  (event.pageY + 10) + "px");
        })
        
        .on("mouseout", function() {
            
            d3.select(this)
                .attr("fill", "#222222");
            // Hide tooltip info
            tooltip.style("display","none");
        });
}

// Plot earthquake spot to globe & Handle TOOLTIP HOVER INTERACTIONS (Func Definer)
function plotEarthquakesPoints(selection, data) {
    const minMag = d3.min(data, d => d.mag);
    const maxMag = d3.max(data, d => d.mag);
    const GradColor = d3.scaleLinear()
        .domain([minMag, maxMag])
        .range(["#EB776C", "#E31F07"])           
        .interpolate(d3.interpolateLab);

    // Create SVG group <g> for groups of earthquake spots <circle>
    const earthquakesGroup = selection.append("g")
        // SVG Name Attribute
        .attr("class", "earthquakes")

    // Create D3 selection & locate the earthquake group container
    earthquakesGroup.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        .attr("r", d => Math.sqrt(Math.abs(d.mag)) * 2)
        .attr("fill", d => GradColor(d.mag))
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.3)
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, projection1R.rotate()) ? 0.95 : 0)

        .on("mouseover", function(event, d) {
    const originalColor = GradColor(d.mag);
    const darkColor = d3.color(originalColor).darker(1.2); // adjust factor as needed

    d3.select(this)
        .transition()
        .duration(150)
        .attr("fill", darkColor)          // darkened version
        .attr("r", Math.sqrt(d.mag) * 4);

    if (isPointVisible(d.longitude, d.latitude, projection1R.rotate())) {
        let location = d.place;
        let distance = "";

        if (d.place.includes(",")) {
            const parts = d.place.split(",");
            distance = parts[0].trim();
            location = parts[1].trim();
        }
        tooltip.html(`
            <strong>${location}</strong><br>
            ${distance ? `Distance: ${distance}<br>` : ""}
            Mag: ${d.mag != null ? d.mag : "Unknown"}
        `)
        .style("display", "block")
        .style("left", (event.pageX + 10) + "px")
        .style("top",  (event.pageY + 10)  + "px");
    } else {
        tooltip.style("display","none");
    }
})
.on("mouseout", function(_, d) {
    // Reset to original gradient color
    d3.select(this)
        .transition()
        .duration(150)
        .attr("fill", GradColor(d.mag))
        .attr("r", Math.sqrt(d.mag) * 2);

    tooltip.style("display","none");
});
}

// Plot seismic stations to globe & Handle TOOLTIP HOVER INTERACTIONS (Func Definer)
function plotStationsPoints(selection, data) {
    const tri = d3.symbol().type(d3.symbolTriangle).size(90);

    const stationsGroup = selection.append("g")
        .attr("class", "stations");

    stationsGroup.selectAll(".stations > path")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "station")
        .attr("transform", d => {
            const p = projection1R([d.longitude, d.latitude]);
            return `translate(${p[0]},${p[1]})`;
        })
        .attr("d", tri)
        .attr("fill", "#2aa3ff")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.8)
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0)

        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(140)
                .attr("fill", "#0033a0") // dark blue on hover
                .attr("transform", () => {
                    const p = projection1R([d.longitude, d.latitude]);
                    return `translate(${p[0]},${p[1]}) scale(1.2)`;
                });
                
            if (isPointVisible(d.longitude, d.latitude, rotate1)) {
               tooltip.html(`
                        <strong>${d["station code"]}</strong><br>
                        ${d.name}<br>
                        <strong>Network:</strong> ${d["network code"]}<br>
                        <strong>Telemetry:</strong> ${d.telemetry}<br>
                        <strong>Elevation:</strong> ${d.elevation} m
                    `)
                    .style("display", "block")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top",  (event.pageY + 10) + "px");
            } 
            else {
                tooltip.style("display", "none");
            }
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .transition()
                .duration(120)
                .attr("fill", "#2aa3ff")
                .attr("transform", () => {
                    const p = projection1R([d.longitude, d.latitude]);
                    return `translate(${p[0]},${p[1]}) scale(1)`;
                });
            tooltip.style("display", "none");
        });
}

// Update earthquakes on rotation or resize (Func Definer)
function updateEarthquakes() {
    svg1.selectAll(".earthquakes circle")
        // Update X,Y positions with projection
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        .attr("opacity", d =>
            isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0
        );
}

// Update stations on rotation or resize (Func Definer)
function updateStations() {
    svg1R.selectAll(".stations .station")
        .attr("transform", d => {
            const p = projection1R([d.longitude, d.latitude]) || [-9999,-9999];
            return `translate(${p[0]},${p[1]}) scale(1)`;
        })
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate1) ? 0.95 : 0);
}

// Determine how a point should be hidden (Func Definer)
function isPointVisible(lon, lat, rotate) {
    const λ = lon * Math.PI/180;
    const φ = lat * Math.PI/180;

    const λ0 = -rotate[0] * Math.PI/180;
    const φ0 = -rotate[1] * Math.PI/180;

    const cosc = Math.sin(φ0)*Math.sin(φ) +
                 Math.cos(φ0)*Math.cos(φ)*Math.cos(λ - λ0);

    return cosc > 0;
}

// Create the legend for globe with earthquake spots (Func Definer)
function createGradientLegend(data) {
  if (!data || data.length === 0) return;

  const minMag = d3.min(data, d => d.mag).toFixed(1);
  const maxMag = d3.max(data, d => d.mag).toFixed(1);
  const midMag = ((+minMag + +maxMag) / 2).toFixed(1);

  document.getElementById("legend-min").textContent = minMag;
  document.getElementById("legend-mid").textContent = midMag;
  document.getElementById("legend-max").textContent = maxMag;
}

// Resize global to fit current container (Func Definer)
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
    updateStations();
}
// ----------------------------------------------------------------------------

/* Country */
const svg2 = d3.select("#globe-svg-2");
const path2 = d3.geoPath();
const projection2 = d3.geoOrthographic().clipAngle(90);

// Countries group
const countriesGroup2 = svg2.append("g").attr("class", "countries");
const countryMapSvg = d3.select("#country-map");

// State
let countriesData = [];
let selectedCountry = null; // will hold the selected feature

const DEFAULT_FILL = "#222222";
const HIGHLIGHT_FILL = "#4eabe1ff";
const globeStationsGroup = svg2.append("g").attr("class", "globe-stations");
const triSymbol = d3.symbol().type(d3.symbolTriangle).size(90);

// Load countries topojson (world-atlas)
d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
  countriesData = topojson.feature(worldData, worldData.objects.countries).features;

  countriesGroup2.selectAll(".country2")
    .data(countriesData)
    .enter()
    .append("path")
    .attr("class", "country2")
    .attr("fill", DEFAULT_FILL)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .attr("d", path2);

  resizeGlobe1(svg2, path2, projection2,'globe-sphere2', 'country2');
}).catch(err => {
  console.error("Failed to load world data:", err);
});

function sameFeature(a, b) {
  if (!a || !b) return false;
  if (a.id !== undefined && b.id !== undefined) return a.id === b.id;
  // fallback: compare references
  return a === b;
}

function rotateToLonLat(lon, lat, duration = 1000) {
  const currentRotate = projection2.rotate();
  const targetRotate = [-lon, -lat, 0];

  d3.transition()
    .duration(duration)
    .tween("rotate", function() {
      const rInterpolator = d3.interpolate(currentRotate, targetRotate);
      return function(t) {
        projection2.rotate(rInterpolator(t));
        // update paths as rotation changes
        svg2.selectAll(".country2").attr("d", path2);
        svg2.select(".globe-sphere2").attr("d", path2);
        // update stations positions & visibility while rotating
        plotStationsOnGlobe(selectedCountry);
      };
    });
}

function drawCountryMap(feature) {
  countryMapSvg.selectAll("*").remove();
  if (!feature) return;

  const cw = countryMapSvg.node().getBoundingClientRect().width || 400;
  const ch = countryMapSvg.node().getBoundingClientRect().height || 300;

  const countryProjection = d3.geoMercator().fitSize([cw, ch], feature);
  const countryPath = d3.geoPath().projection(countryProjection);

  // Draw country
  countryMapSvg.append("path")
    .datum(feature)
    .attr("d", countryPath)
    .attr("fill", HIGHLIGHT_FILL)
    .attr("stroke", "#000")
    .attr("stroke-width", 1);

  // Always draw only seismic stations for the selected country
  if (!stationData || !stationData.length) {
    // If stationData is missing, show a notice
    countryMapSvg.append("text")
      .attr("x", cw / 2)
      .attr("y", ch / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#ffffffcc")
      .style("font-size", "12px")
      .text("Station data unavailable");
    return;
  }

  const stationsInCountry = stationData.filter(d => d3.geoContains(feature, [d.longitude, d.latitude]));
  if (!stationsInCountry || stationsInCountry.length === 0) {
    // Optional: show a message inside the country map
    countryMapSvg.append("text")
      .attr("x", cw / 2)
      .attr("y", ch / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#ffffffcc")
      .style("font-size", "12px")
      .text("No stations in this country");
    return;
  }

  const tri = d3.symbol().type(d3.symbolTriangle).size(90);

  countryMapSvg.append("g")
    .attr("class", "stations-map")
    .selectAll("path")
    .data(stationsInCountry)
    .enter()
    .append("path")
    .attr("d", tri)
    .attr("transform", d => {
      const [x, y] = countryProjection([d.longitude, d.latitude]);
      return `translate(${x},${y})`;
    })
    .attr("fill", "#2aa3ff")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.8)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition().duration(120)
        .attr("transform", () => {
          const [x, y] = countryProjection([d.longitude, d.latitude]);
          return `translate(${x},${y}) scale(1.2)`;
        })
        .attr("fill", "#0033a0"); // darker blue
      // Optional: show tooltip if you have tooltip variable
      if (typeof tooltip !== "undefined") {
        tooltip.html(`
          <strong>${d["station code"] || ""}</strong><br>
          ${d.name || ""}<br>
          <strong>Network:</strong> ${d["network code"] || ""}<br>
          <strong>Telemetry:</strong> ${d.telemetry || ""}<br>
          <strong>Elevation:</strong> ${d.elevation || ""} m
        `)
        .style("display", "block")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
      }
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition().duration(120)
        .attr("transform", () => {
          const [x, y] = countryProjection([d.longitude, d.latitude]);
          return `translate(${x},${y}) scale(1)`;
        })
        .attr("fill", "#2aa3ff"); // normal blue
      if (typeof tooltip !== "undefined") tooltip.style("display", "none");
    });
}

function plotStationsOnGlobe(feature = null) {
  if (!stationData) return;

  const stationsToShow = feature
    ? stationData.filter(d => d3.geoContains(feature, [d.longitude, d.latitude]))
    : [];

  const sel = globeStationsGroup.selectAll(".globe-station")
    .data(stationsToShow, d => d["station code"] || `${d.longitude},${d.latitude}`);

  sel.exit().remove();

  const enter = sel.enter()
    .append("path")
    .attr("class", "globe-station")
    .attr("d", triSymbol)
    .attr("fill", "#2aa3ff")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.8)
    .attr("opacity", 0)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition().duration(120)
        .attr("transform", () => {
          const p = projection2([d.longitude, d.latitude]);
          return `translate(${p[0]},${p[1]}) scale(1.4)`;
        })
        .attr("fill", "#0033a0");
      if (typeof tooltip !== "undefined") {
        tooltip.html(`<strong>${d["station code"]||""}</strong><br>${d.name||""}`)
          .style("display","block")
          .style("left",(event.pageX+10)+"px")
          .style("top",(event.pageY+10)+"px");
      }
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition().duration(120)
        .attr("transform", () => {
          const p = projection2([d.longitude, d.latitude]);
          return `translate(${p[0]},${p[1]}) scale(1)`;
        })
        .attr("fill", "#2aa3ff");
      if (typeof tooltip !== "undefined") tooltip.style("display","none");
    });

  // ENTER + UPDATE: set position and visibility
  sel.merge(enter)
    .attr("transform", d => {
      const p = projection2([d.longitude, d.latitude]) || [-9999, -9999];
      return `translate(${p[0]},${p[1]}) scale(1)`;
    })
    .attr("opacity", d => {
      // hide triangles on back hemisphere
      const λ = d.longitude * Math.PI/180;
      const φ = d.latitude * Math.PI/180;
      const rot = projection2.rotate ? projection2.rotate() : [0,0,0];
      const λ0 = -rot[0] * Math.PI/180;
      const φ0 = -rot[1] * Math.PI/180;
      const cosc = Math.sin(φ0)*Math.sin(φ) + Math.cos(φ0)*Math.cos(φ)*Math.cos(λ-λ0);
      return cosc > 0 ? 0.95 : 0;
    });
}

/* Zoomed-in Countries */
function handleCountrySearch(query) {
  if (!countriesData || !countriesData.length) {
    d3.select("#country-result").text("World geometry not yet loaded. Try again in a moment.");
    return;
  }

  if (!query || !query.trim()) {
    d3.select("#country-result").text("Please enter a country name.");
    return;
  }
  const q = query.trim().toLowerCase();

  let countryFeature = countriesData.find(c => {
    const props = c.properties || {};
    const candidates = [
      props.name,
      props.NAME,
      props.NAME_EN,
      props.admin,
      props.name_en
    ].filter(Boolean);

    if (props.iso_a3) candidates.push(props.iso_a3);
    if (props.iso_a2) candidates.push(props.iso_a2);

    return candidates.some(s => String(s).toLowerCase().includes(q));
  });

  if (!countryFeature) {
    countryFeature = countriesData.find(c => {
      const p = c.properties || {};
      return (p.name && p.name.toLowerCase() === q) || (p.admin && p.admin.toLowerCase() === q);
    });
  }

  if (!countryFeature) {
    d3.select("#country-result").text(`No country matching "${query}" found.`);
    // clear selection
    selectedCountry = null;
    svg2.selectAll(".country2").attr("fill", DEFAULT_FILL);
    drawCountryMap(null);
    plotStationsOnGlobe(null); // clear globe stations
    return;
  }

  const centroid = d3.geoCentroid(countryFeature); // [lon, lat]
  if (isFinite(centroid[0]) && isFinite(centroid[1])) {
    rotateToLonLat(centroid[0], centroid[1], 1200);
  }

  selectedCountry = countryFeature;
  svg2.selectAll(".country2")
    .attr("fill", d => (sameFeature(d, selectedCountry) ? HIGHLIGHT_FILL : DEFAULT_FILL));

  // draw the zoomed country map (with stations)
  drawCountryMap(countryFeature);

  plotStationsOnGlobe(selectedCountry);
  const stationsInCountry = stationData ? stationData.filter(d =>
    d3.geoContains(countryFeature, [d.longitude, d.latitude])
  ) : [];

  const displayName = countryFeature.properties && (countryFeature.properties.name || countryFeature.properties.admin || "Selected country");
  d3.select("#country-result").text(
    `${displayName}: ${stationsInCountry.length} station${stationsInCountry.length === 1 ? "" : "s"}`
  );
}

// wire up input and button (including Enter key)
const inputEl = document.getElementById("country-input");
const btn = document.getElementById("country-search-btn");

if (btn && inputEl) {
  btn.addEventListener("click", () => handleCountrySearch(inputEl.value));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCountrySearch(inputEl.value);
    }
  });
}

let activeLayer = "stations"; // default: stations
const toggleButtons = document.querySelectorAll(".toggle-btn");

toggleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // Update active layer
    activeLayer = btn.dataset.type;

    // Update button styles
    toggleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Update globe rendering
    updateGlobePoints();
  });
});
const svgGlobe = d3.select("#globe-svg");
const projection = d3.geoOrthographic().clipAngle(90);
const path = d3.geoPath().projection(projection);

// Groups for points
const stationsGroup = svgGlobe.append("g").attr("class", "stations");
const earthquakesGroup = svgGlobe.append("g").attr("class", "earthquakes");

function updateGlobePoints() {

  earthquakesGroup.selectAll("circle")
    .attr("opacity", d => (activeLayer === "earthquakes" || activeLayer === "both") && isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0);

  stationsGroup.selectAll("path")
    .attr("opacity", d => (activeLayer === "stations" || activeLayer === "both") && isPointVisible(d.longitude, d.latitude, rotate1) ? 0.95 : 0);
}

// Toggle logic for two separate boxes (Stations / Magnitudes)
// Ensure this runs after DOM + globe initialization
(function() {
  const boxStations = document.getElementById("box-stations");
  const boxMagnitudes = document.getElementById("box-magnitudes");
  if (!boxStations || !boxMagnitudes) return;

  // The DOM containers that hold the two globes (adjust these selectors if your markup differs)
  const topGlobeContainer = document.querySelector(".globe-container.globe-top");          // stations (svg1R)
  const bottomGlobeContainer = document.querySelector(".globe-container.globe-bottom-wrapper"); // magnitudes (svg1)

  // Keep a global-ish activeLayer variable consistent with your other code
  window.activeLayer = window.activeLayer || "stations";

  function applyActiveBox(mode) {
    // UI states
    boxStations.classList.toggle("active", mode === "stations");
    boxMagnitudes.classList.toggle("active", mode === "earthquakes");

    boxStations.setAttribute("aria-pressed", mode === "stations");
    boxMagnitudes.setAttribute("aria-pressed", mode === "earthquakes");

    // dim opposite globe container
    if (topGlobeContainer && bottomGlobeContainer) {
      if (mode === "stations") {
        topGlobeContainer.classList.remove("globe-dim");
        bottomGlobeContainer.classList.add("globe-dim");
      } else if (mode === "earthquakes") {
        bottomGlobeContainer.classList.remove("globe-dim");
        topGlobeContainer.classList.add("globe-dim");
      }
    }

    // update active layer and visuals
    window.activeLayer = mode;

    if (typeof updateGlobePoints === "function") updateGlobePoints();
    // ensure globe-station plotting updates for selected country
    if (mode === "stations" && typeof plotStationsOnGlobe === "function") {
      plotStationsOnGlobe(selectedCountry || null);
    }
    // ensure earthquake circles update
    if ((mode === "earthquakes" || mode === "both") && typeof updateEarthquakes === "function") {
      updateEarthquakes();
    }
  }

  // mouse click handlers
  boxStations.addEventListener("click", () => applyActiveBox("stations"));
  boxMagnitudes.addEventListener("click", () => applyActiveBox("earthquakes"));

  // keyboard support (Enter / Space)
  [boxStations, boxMagnitudes].forEach(box => {
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        box.click();
      }
    });
  });

  // set initial state (mirrors existing default)
  applyActiveBox(window.activeLayer || "stations");
})();


// ==================
// PAGE 7: NEWS INFO 
// ==================
document.addEventListener("DOMContentLoaded", () => {
  const flipCards = document.querySelectorAll(".flip-card");
  flipCards.forEach(card => {
    card.addEventListener("click", () => {
      card.querySelector(".flip-card-inner").classList.toggle("flipped");
    });
  });
});