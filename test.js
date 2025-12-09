// ==========================
// PAGE 3 & 4: ALL GLOBES
// ==========================
// GLOBAL VARIABLE INITIALIZATION -------------------------------------------->
// Create D3 selection & locate the SVG container
const svg1 = d3.select("#globe-svg");
const svg1R = d3.select("#globe-svg-r");
const svg2 = d3.select("#globe-svg-2");

// Define path generator: GeoJSON Data [longtitude, latitude in degree] --> SVG String Path [x, y in pixel]
const path1 = d3.geoPath();
const path1R = d3.geoPath();
const path2 = d3.geoPath();
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
const projection2Ortho = d3.geoOrthographic().clipAngle(90);

// Initialize orientation value for rotation when the page loads
    // rotate[0] --> long rotation
    // rotate[1] --> lat rotation
let rotate = [0, -20];
// Initialize X,Y coordinates for DRAG & ROTATE INTERACTIONS when the page loads
let lastX, lastY;
// Keep track of previously selected country
let selectedCountry = null;
// ----------------------------------------------------------------------------

// FUNCTION CALLING -----------------------------------------------------------
// Handle DRAG ROTATION INTERACTIONS (Func Definer, Func Caller & Callback)
// D3 Built-in Interactions:
    // Brush, Dispatch, Drag, Zoom
    // We use drag interaction here
const dragBehavior = d3.drag()
    // Event when user start press on the globe
    .on("start", event => { 
        // Record current X,Y coordinates
        lastX = event.x; 
        lastY = event.y; 
    })
    // Event when user continue to drag the globe
    .on("drag", event => {
        // Calculate Rotation & Projection
        computeRotation(event);

        // Update each plotting element
        updateBaseSphere();
        updateCountries();
        updateEarthquakes();
        updateStations();

        // Update the current X,Y coordinates
        lastX = event.x;
        lastY = event.y;
    })

// Create Base Sphere (Func Caller)
plotBaseSphere(svg1, sphereData, 'globe-sphere1')
// Handle drag behavior (Func Caller)
dragBehavior(svg1)
// Create Country Sphere (Func Caller)
plotCountryRegions(svg1, countryData, 'country1')
// Create Earthquake Spots (Func Caller)
plotEarthquakesPoints(svg1, earthquakeData)
// Create Gradient Color Legend
createGradientLegend(earthquakeData)
// Resize it when page first loaded (Func Caller)
// Try remove it then it won't show up for page first load until you do something to the window to trigger it, i.e. inspect
resizeGlobe(svg1, path1, projection1, 'globe-sphere1', 'country1');
// Resize for Web Responsive Design (CSS Flex Display Simply Won't Help) (Event Listener Caller & Callback)
window.addEventListener("resize", () => resizeGlobe(svg1, path1, projection1, 'globe-sphere1', 'country1'));

// Same above for right globe
plotBaseSphere(svg1R, sphereData, 'globe-sphere1R')
dragBehavior(svg1R)
plotCountryRegions(svg1R, countryData, 'country1R')
// Create Seismic Stations (Func Caller)
plotStationsPoints(svg1R, stationData)
resizeGlobe(svg1R, path1R, projection1R, 'globe-sphere1R', 'country1R');
window.addEventListener("resize", () => resizeGlobe(svg1R, path1R, projection1R, 'globe-sphere1R', 'country1R'));

// Same above for globe2
plotBaseSphere(svg2, sphereData, 'globe-sphere2');
dragBehavior(svg2);
plotCountryRegions(svg2, countryData, 'country2');
resizeGlobe(svg2, path2, projection2Ortho, 'globe-sphere2', 'country2');
window.addEventListener("resize", () => resizeGlobe(svg2, path2, projection2Ortho, 'globe-sphere2', 'country2'));

// ----------------------------------------------------------------------------

// FUNCTION DEFINITION ------------------------------------------------------->
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
function plotCountryRegions(selection, data, className) {
    // Extract relevant country data from the object
    const countryGeoNameData = topojson.feature(data, data.objects.countries).features;

    // Create SVG group <g> for groups of countries <path>
    const countriesGroup = selection.append("g")
        // SVG Name Attribute
        .attr("class", "countries");

    // Create D3 selection & locate the country group container
    countriesGroup.selectAll(`.${className}`)
        // Input Country Geometry & Name data
        .data(countryGeoNameData)
        .enter()
        // Create individual country <path>
        .append("path")
        // SVG Styling
        .attr("class", className)
        .attr("fill", "#222222")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)

        // Event when user hover on the country polygon
        .on("mouseover", function(event, d) {
            if (d !== selectedCountry){
              // Create D3 selection & locate selected country <path>
                d3.select(this)
                    // SVG Styling
                    // Highlight hovered country region
                    .attr("fill", "#2156e9ff");
            }
            // Display tooltip info for selected country
            tooltip.text(d.properties.name)
                .style("display","block")
                .style("left", (event.pageX + 10) + "px")
                .style("top",  (event.pageY + 10) + "px");
        })
        // Event when user no longer hover on the country polygon
        .on("mouseout", function(_, d) {
            if (d!== selectedCountry){
                // Create D3 selection & locate hovered country <path>
                d3.select(this)
                    // SVG Styling
                    // Reset the selected country region
                    .attr("fill", "#222222");
            }
            // Hide tooltip info
            tooltip.style("display","none");
        })
        // Event when user click on a country
        .on("click", function(_, d){
            // Higlight and Draw selected country in 2D
            clickBehavior(d, this, countriesGroup)
        });
}

// Function to plot selected countries in 2D map
function plotSelectedCountry(selectionGetInfo, selectionCreate, d){
    // Create D3 selection & locate the SVG container
    // Clear previous selected country
    selectionCreate.selectAll("*").remove();

    // Define the X,Y bound
    const cw = selectionGetInfo.node().getBoundingClientRect().width;
    const ch = selectionGetInfo.node().getBoundingClientRect().height;

    // Define path generator: GeoJSON Data [longtitude, latitude in degree] --> SVG String Path [x, y in pixel]
    const pathMerca = d3.geoPath();
    // Define Mercator projection callback
    const projectionMerca = d3.geoMercator().fitSize([cw, ch], d);
    // Apply project on SVG string path
    pathMerca.projection(projectionMerca);

    // Create the selected country as SVG <path>
    selectionCreate.append("path")
        // Input data
        .datum(d)
        .attr("d", pathMerca)
        // SVG Styling
        .attr("fill", "#2156e9ff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1);
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
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate) ? 0.8 : 0)

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
            if (isPointVisible(d.longitude, d.latitude, rotate)) {
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

// Function to plot seismic station points & Handle TOOLTIP HOVER INTERACTIONS (Func Definer)
function plotStationsPoints(selection, data) {
    // symbol generator for triangle
    const tri = d3.symbol().type(d3.symbolTriangle).size(90);

    // Create SVG group <g> for groups of seismic stations <path>
    const stationsGroup = selection.append("g")
        // SVG Name Attribute
        .attr("class", "stations");

    // Create D3 selection & locate the selected station
    stationsGroup.selectAll(".stations > path")
        // Input Station data
        .data(data)
        .enter()
        // Create individual seismic stations <path>
        .append("path")
        // SVG Name Attribute
        .attr("class", "station")
        // SVG Transformation
        .attr("transform", d => {
            const p = projection1R([d.longitude, d.latitude]);
            return `translate(${p[0]},${p[1]})`;
        })
        // SVG Styling
        .attr("d", tri)
        .attr("fill", "#2aa3ff")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.8)
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate) ? 0.8 : 0)

        // Event when hover on the selected station
        .on("mouseover", function(event, d) {
            // Create D3 selection & locate the selected station
            d3.select(this)
                // SVG Transformation
                // Enlarge slightly for emphasis
                .transition()
                .duration(140)
                .attr("transform", () => {
                    const p = projection1R([d.longitude, d.latitude]);
                    // Slight scale up; we re-create the symbol scaled via transform
                    return `translate(${p[0]},${p[1]}) scale(1.2)`;
                });

            // Only show if visible on the front hemisphere
            if (isPointVisible(d.longitude, d.latitude, rotate)) {
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
        // Event when no longer hover on the selected station
        .on("mouseout", function(event, d) {
            // Create D3 selection & locate the selected station
            d3.select(this)
                // SVG Transformation
                .transition()
                .duration(120)
                .attr("transform", () => {
                    const p = projection1R([d.longitude, d.latitude]);
                    return `translate(${p[0]},${p[1]}) scale(1)`;
                });

            // Reset tooltip
            tooltip.style("display", "none");
        });
}

// Function to use difference of dragging to compute rotation and feed it to projection (Func Definer)
function computeRotation(event) {
    // Find diff X,Y coordinates from BEFORE drag and AFTER drag coordinates
    const dx = event.x - lastX;
    const dy = event.y - lastY;
    // dx = event.x - lastX; dy = event.y - lastY;
    // Change rotation amount
        // Choose 0.7 because you don't want the rotation to be too sensitive, ruin UX
        // Choose rotate[0] += because when you move left, it rotates toward left, vice versa
        // Choose rotate[1] -= because invert the direction align with MacOS standard, when you move up, you scroll down, vice versa
        // Choose Math.max(-90, Math.min(90, rotate[1])), because you will flip the earth vertically and disoriented
            // If you don't believe what I said, try it
    rotate[0] += dx * 0.8;
    rotate[1] -= dy * 0.8;
    rotate[1] = Math.max(-90, Math.min(90, rotate[1]));
    // Rotate <path>, NOT <circle>, in horizontal/vertical direction specifed by rotate
    // projection(orthographicRaw()).rotate([λ, φ])
    projection1.rotate(rotate);
    projection1R.rotate(rotate);
    projection2Ortho.rotate(rotate);
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
            isPointVisible(d.longitude, d.latitude, rotate) ? 0.8 : 0
        );
}

// Function to update station positions & visibility after rotation/resize (Func Definer)
function updateStations() {
    // Create D3 selection & locate the stations or station group
    svg1R.selectAll(".stations .station")
        // SVG Transformation
        .attr("transform", d => {
            const p = projection1R([d.longitude, d.latitude]) || [-9999,-9999];
            return `translate(${p[0]},${p[1]}) scale(1)`;
        })
        // SVG Styling
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate) ? 0.95 : 0);
}

// Function to update countries visibility after rotation/resize (Func Definer)
function updateCountries(){
    // Re-render the SVG <path> for all globes
    // It DOES NOT re-render <circle>
    svg1.selectAll(".country1").attr("d", path1);
    svg1R.selectAll(".country1R").attr("d", path1R);
    svg2.selectAll(".country2").attr("d", path2);
}

// Function to update sphere orientation after rotation/resize (Func Definer)
function updateBaseSphere(){
    // Re-render the SVG <path> for all globes
    // It DOES NOT re-render <circle>
    svg1.select("path#globe-sphere1").attr("d", path1);
    svg1R.select("path#globe-sphere1R").attr("d", path1R);
     svg2.select("path#globe-sphere2").attr("d", path2);
}

// Function to determine if an earthquake point should be visible or not (Func Definer)
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

// Create a simple horizontal gradient legend for earthquake magnitude (Func Definer)
function createGradientLegend(data) {
  if (!data || data.length === 0) return;

  const minMag = d3.min(data, d => d.mag).toFixed(1);
  const maxMag = d3.max(data, d => d.mag).toFixed(1);
  const midMag = ((+minMag + +maxMag) / 2).toFixed(1);

  document.getElementById("legend-min").textContent = minMag;
  document.getElementById("legend-mid").textContent = midMag;
  document.getElementById("legend-max").textContent = maxMag;
}

function clickBehavior(d, thisPath, allPaths) {
    // Clear and reset the selected Country
    if (selectedCountry) {
        // Create D3 selection & locate all country
        allPaths
            // Keep the one with selected country name
            .filter(c => c.properties.name === selectedCountry.properties.name)
            // SVG Styling --> reset to black
            .attr("fill", "#222222");
    }

    // Create D3 selection & locate the clicked selected country
    d3.select(thisPath)
        // SVG Styling
        .attr("fill", "#ffb347");
    // Record the selected country
    selectedCountry = d;

    // Display the Detail Info
    d3.select("#country-name").text(d.properties.name);
    d3.select("#country-details")
      .text(`You clicked on ${d.properties.name}.`);

    // Create selected country in 2D map
    const countryMapSvg = d3.select("#country-map");
    plotSelectedCountry(allPaths, countryMapSvg, d);
}

// Function to resize global to fit current container (Func Definer)
function resizeGlobe(selection, pathFunc, projectionFunc, idNameSphere, classNameCountry) {
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