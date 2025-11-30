// ==========================
// DATA LOADING
// ==========================

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

// Load country data from JSON file (Func Definer)
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
console.log("Seismis Station Data")
console.log(stationData)

// Call the JSON loader function (Function Caller)
const countryData = await loadJSON("https://unpkg.com/world-atlas@2/countries-110m.json")
console.log("Country Data")
console.log(countryData)

// Define the Sphere data
const sphereData = { type: "Sphere" }
console.log("Sphere GeoJSON Data")
console.log(sphereData)


// ==========================
// GLOBAL TOOLTIP
// ==========================
const tooltip = d3.select("#globe-tooltip");

// ==========================
// DOT FOR PAGES
// ==========================
const dots = document.querySelectorAll(".nav-dot");
const sections = document.querySelectorAll("section, header.hero");

const updateActiveDot = () => {
    let closestDot = null;
    let closestDistance = Infinity;

    // Iterate each dot <span> element
    dots.forEach(dot => {
        const targetId = dot.getAttribute("data-target");
        const targetEl = document.getElementById(targetId);

        if (!targetEl) {
            console.error(`Element with ID: ${targetId} does not exist`);
            return;
        }

        const rect = targetEl.getBoundingClientRect();
        const distance = Math.abs(rect.top);

        closestDistance = Math.min(distance, closestDistance);
        closestDot = distance < closestDistance ? dot : closestDot;
    });

    if (closestDot) {
        // Reset all dot & Activate the selected dot
        dots.forEach(d => d.classList.remove("active"));
        closestDot.classList.add("active");
    }
};

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                dots.forEach(dot => {
                    dot.classList.toggle("active", dot.dataset.target === id);
                });
            }
        });

    }, 
    { 
        threshold: 0.5  
    }
);

dots.forEach(dot => {
    const targetId = dot.getAttribute("data-target");
    const targetEl = document.getElementById(targetId);

    dot.addEventListener("click", () => {
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth" });
            // highlight immediately
            dots.forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
        }
    });
});

updateActiveDot();
window.addEventListener("scroll", updateActiveDot);
window.addEventListener("resize", updateActiveDot);
sections.forEach(section => observer.observe(section));

// ==========================
// PAGE 1: INTRO 
// ==========================
// Select the hero and its text elements
const hero = document.querySelector(".hero");
const heroElements = hero.querySelectorAll("h1, p");

// Intersection Observer to trigger animation on scroll
const heroObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      heroElements.forEach(el => {
        el.classList.remove("animate");
        void el.offsetWidth; // trigger reflow
        el.classList.add("animate");
      });
    }
  });
}, { threshold: 0.25 }); // lower threshold to 25%
heroObserver.observe(hero);

// ==========================
// PAGE 2: EARTH LAYERS PLOT
// ==========================

function initHotspots() {
  const hotspots = Array.from(document.querySelectorAll(".hotspot"));
  const infoBox = document.getElementById("earth-layer-info");
  const earthSection = document.getElementById("earth-structure-section");
  const defaultMsg = "Hover over or press tab to learn more.";
  if (!infoBox) { console.warn("No #earth-layer-info element found."); return; }
  if (!hotspots.length) { console.warn("No .hotspot elements found. Check your HTML."); return; }

  const debugShowBoxes = false;

  hotspots.forEach((h, i) => {
    h.tabIndex = 0; // make focusable
    h.style.position = h.style.position || "absolute";
    if (!h.style.width) h.style.width = h.dataset.width || "18%";
    if (!h.style.height) h.style.height = h.dataset.height || "10%";
    if (!h.style.left) h.style.left = h.dataset.left || `${20 + i*10}%`;
    if (!h.style.top) h.style.top = h.dataset.top || "50%";

    if (debugShowBoxes) {
      h.style.background = "rgba(255,0,0,0.18)";
      h.style.outline = "1px solid rgba(255,0,0,0.6)";
    } else {
      h.style.background = "transparent";
      h.style.outline = "none";
    }

    const name = h.dataset.name || `Layer ${i+1}`;
    const desc = h.dataset.desc || "No description supplied.";

    const show = () => {
      infoBox.innerHTML = `<strong>${name}</strong><br>${desc}`;
    };
    const reset = () => { infoBox.textContent = defaultMsg; };

    h.addEventListener("mouseenter", show);
    h.addEventListener("mouseleave", reset);
    h.addEventListener("focus", show);
    h.addEventListener("blur", reset);

    let timer = null;
    h.addEventListener("click", (e) => {
      e.preventDefault();
      clearTimeout(timer);
      show();
      timer = setTimeout(reset, 3000);
    });

    h.addEventListener("touchstart", (e) => {
      e.preventDefault();
      clearTimeout(timer);
      show();
      timer = setTimeout(reset, 3000);
    }, { passive: false });
  });

  infoBox.style.maxWidth = infoBox.dataset.maxWidth || "360px"; 
  infoBox.style.minHeight = infoBox.dataset.minHeight || "120px"; 
  infoBox.style.boxSizing = "border-box";
  infoBox.style.padding = infoBox.style.padding || "14px";

  const focusableSelector = 'a, button, input, select, textarea, [tabindex]';
  const originalTabindex = new Map();

  function disableOtherFocus() {
    document.querySelectorAll(focusableSelector).forEach(el => {
      if (el.classList && el.classList.contains('hotspot')) return;
      
      if (earthSection.contains(el) && el.classList && el.classList.contains('hotspot')) return;

      if (!originalTabindex.has(el)) {
        originalTabindex.set(el, el.hasAttribute('tabindex') ? el.getAttribute('tabindex') : null);
      }
      try { el.tabIndex = -1; } catch (e) {}
    });
  }

  function restoreFocus() {
    originalTabindex.forEach((val, el) => {
      if (!document.contains(el)) return; 
      if (val === null) {
        el.removeAttribute('tabindex');
      } else {
        el.setAttribute('tabindex', val);
      }
    });
    originalTabindex.clear();
  }

  let earthActive = false;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
        earthActive = true;
        disableOtherFocus();

        if (!document.activeElement || document.activeElement === document.body) {
          hotspots[0].focus();
        }
      } else {
        if (earthActive) {
          earthActive = false;
          restoreFocus();
        }
      }
    });
  }, { threshold: [0.55] });
  io.observe(earthSection);

  document.addEventListener("keydown", (e) => {
    if (!earthActive) return;
    if (e.key !== "Tab") return;

    const visibleHotspots = hotspots.filter(h => h.offsetParent !== null); // visible ones
    if (!visibleHotspots.length) return;

    const currentIndex = visibleHotspots.indexOf(document.activeElement);
    if (e.shiftKey) {
      // SHIFT+TAB: move backwards
      if (currentIndex === -1 || currentIndex === 0) {
        e.preventDefault();
        visibleHotspots[visibleHotspots.length - 1].focus();
      }
      // otherwise allow normal backwards behavior within hotspots
    } else {
      if (currentIndex === visibleHotspots.length - 1 || currentIndex === -1) {
        e.preventDefault();
        visibleHotspots[0].focus();
      }
    }
  });
  infoBox.textContent = defaultMsg;
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHotspots);
} else {
  initHotspots();
}

// ==========================
// PAGE 3: GLOBE 1 & GLOBE Right
// ==========================

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
        projection2.rotate(rotate1);
        
        // Re-render the SVG <path>
        // It DOES NOT re-render <circle>
        svg1.select("path#globe-sphere1").attr("d", path1);
        svg1.selectAll(".country1").attr("d", path1);
        svg1R.select("path#globe-sphere1R").attr("d", path1R);
        svg1R.selectAll(".country1R").attr("d", path1R);
        svg2.select("path#globe-sphere2").attr("d", path2);
        svg2.selectAll(".country2").attr("d", path2);

        // Re-render the SVG <circle> with the correct X,Y coordinates
        // It DOES NOT re-render other SVG elements: <path>, <line>, <text>, whatever
        updateEarthquakes();
        updateStations();

        // Update the current X,Y coordinates
        lastX1 = event.x;
        lastY1 = event.y;
    })

plotBaseSphere(svg1, sphereData, 'globe-sphere1')
drag_behavior(svg1)
plotCountriesRegions(svg1, countryData, 'country1')
plotEarthquakesPoints(svg1, earthquakeData)
createGradientLegend(earthquakeData)
resizeGlobe1(svg1, path1, projection1, 'globe-sphere1', 'country1');
window.addEventListener("resize", () => resizeGlobe1(svg1, path1, projection1, 'globe-sphere1', 'country1'));

plotBaseSphere(svg1R, sphereData, 'globe-sphere1R')
drag_behavior(svg1R)
plotCountriesRegions(svg1R, countryData, 'country1R')
plotStationsPoints(svg1R, stationData)
resizeGlobe1(svg1R, path1R, projection1R, 'globe-sphere1R', 'country1R');
window.addEventListener("resize", () => resizeGlobe1(svg1R, path1R, projection1R, 'globe-sphere1R', 'country1R'));

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
    const countryGeoNameData = topojson.feature(data, data.objects.countries).features;
    const countriesGroup1 = selection.append("g")
        .attr("class", "countries");

    countriesGroup1.selectAll(`.${className}`)
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
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0)

        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(150)
                .attr("fill", "#4d1515ff")
                .attr("r", Math.sqrt(d.mag) * 4);  

            if (isPointVisible(d.longitude, d.latitude, rotate1)) {
                let location = d.place;
                let distance = "";

                if (d.place.includes(",")) {
                    const parts = d.place.split(",");
                    distance = parts[0].trim();
                    location = parts[1].trim();
                }
                tooltip.html(`
                    <strong>${location}</strong><br>
                    ${distance ? `* Distance: ${distance}<br>` : ""}
                    * Mag: ${d.mag != null ? d.mag : "Unknown"}
                `)
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top",  (event.pageY + 10)  + "px");
            }
            else {
                tooltip.style("display","none");
            }

        })
        .on("mouseout", function(_, d) {
            tooltip.style("display","none");
            
            d3.select(this)
                .transition()
                .duration(150)
                .attr("fill", d => GradColor(d.mag))
                .attr("r", Math.sqrt(d.mag) * 2);
        });
}

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
                .attr("transform", () => {
                    const p = projection1R([d.longitude, d.latitude]);
                    return `translate(${p[0]},${p[1]}) scale(1)`;
                });
            tooltip.style("display", "none");
        });
}

// Function to update earthquakes on rotation or resize (Func Definer)
function updateEarthquakes() {
    svg1.selectAll(".earthquakes circle")
        // Update X,Y positions with projection
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        .attr("opacity", d =>
            isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0
        );
}

function updateStations() {
    svg1R.selectAll(".stations .station")
        .attr("transform", d => {
            const p = projection1R([d.longitude, d.latitude]) || [-9999,-9999];
            return `translate(${p[0]},${p[1]}) scale(1)`;
        })
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate1) ? 0.95 : 0);
}

function isPointVisible(lon, lat, rotate) {
    const λ = lon * Math.PI/180;
    const φ = lat * Math.PI/180;

    const λ0 = -rotate[0] * Math.PI/180;
    const φ0 = -rotate[1] * Math.PI/180;

    const cosc = Math.sin(φ0)*Math.sin(φ) +
                 Math.cos(φ0)*Math.cos(φ)*Math.cos(λ - λ0);

    return cosc > 0;
}

function createGradientLegend(data) {
  if (!data || data.length === 0) return;

  const minMag = d3.min(data, d => d.mag).toFixed(1);
  const maxMag = d3.max(data, d => d.mag).toFixed(1);
  const midMag = ((+minMag + +maxMag) / 2).toFixed(1);

  document.getElementById("legend-min").textContent = minMag;
  document.getElementById("legend-mid").textContent = midMag;
  document.getElementById("legend-max").textContent = maxMag;
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
    updateStations();
}
// ----------------------------------------------------------------------------

// ==========================
// PAGE 4: GLOBE 2 
// ==========================
const svg2 = d3.select("#globe-svg-2");
const path2 = d3.geoPath();
const projection2 = d3.geoOrthographic().clipAngle(90);

svg2.append("path")
    .datum({type:"Sphere"})
    .attr("class", "globe-sphere2")
    .attr("fill", "#000")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5);

drag_behavior(svg2);

const countriesGroup2 = svg2.append("g").attr("class", "countries");
const countryMapSvg = d3.select("#country-map");

let selectedCountry = null;

d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    countriesGroup2.selectAll(".country2")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country2")
        .attr("fill", "#222222")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
            if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#2156e9ff");
            tooltip.text(d.properties.name)
                .style("display","block")
                .style("left", (event.pageX + 10) + "px")
                .style("top",  (event.pageY + 10) + "px");
        })
        .on("mouseout", (event, d) => {
            if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#222222");
            tooltip.style("display","none");
        })
        .on("click", (event, d) => {
            if (selectedCountry) {
                countriesGroup2.selectAll(".country2")
                    .filter(c => c.properties.name === selectedCountry.properties.name)
                    .attr("fill", "#222222");
            }
            d3.select(event.currentTarget).attr("fill", "#ffb347");
            selectedCountry = d;

            d3.select("#country-name").text(d.properties.name);
            d3.select("#country-details").text(`You clicked on ${d.properties.name}.`);

            // draw country map
            countryMapSvg.selectAll("*").remove();
            const cw = countryMapSvg.node().getBoundingClientRect().width;
            const ch = countryMapSvg.node().getBoundingClientRect().height;
            const countryProjection = d3.geoMercator().fitSize([cw, ch], d);
            const countryPath = d3.geoPath().projection(countryProjection);

            countryMapSvg.append("path")
                .datum(d)
                .attr("d", countryPath)
                .attr("fill", "#2156e9ff")
                .attr("stroke", "#000")
                .attr("stroke-width", 1);
      });

    resizeGlobe2();
});

function resizeGlobe2(){
  const cw = svg2.node().parentNode.getBoundingClientRect().width;
  svg2.attr("width", cw).attr("height", cw);
  projection2.translate([cw/2, cw/2]).scale(cw/2 * 0.9);
  path2.projection(projection2);
  svg2.select(".globe-sphere2").attr("d", path2);
  svg2.selectAll(".country2").attr("d", path2);

}
window.addEventListener("resize", resizeGlobe2);