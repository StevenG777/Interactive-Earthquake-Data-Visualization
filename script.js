
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
console.log("Seismic Station Data")
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
const sections = document.querySelectorAll("section, header.hero, header.anecdote");

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

        // Correct comparison: update closestDot if this section is nearer
        if (distance < closestDistance) {
            closestDistance = distance;
            closestDot = dot;
        }
    });

    if (closestDot) {
        // Reset all dots & activate the closest one
        dots.forEach(d => d.classList.remove("active"));
        closestDot.classList.add("active");
    }
};


const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        dots.forEach(dot => {
          dot.classList.toggle("active", dot.dataset.target === id);
        });
      }
    });
  },
  { threshold: 0.5 }
);

dots.forEach(dot => {
    const targetId = dot.getAttribute("data-target");
    const targetEl = document.getElementById(targetId);

    dot.addEventListener("click", () => {
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
// SNAP SCROLLING
// ==========================
function scrollToPageOnClick(dots) {
    function navigateToPage(dot) {
        const targetId = dot.getAttribute("data-target");
        const targetEl = document.getElementById(targetId);
        if (!targetEl) { 
            console.error(`Target ID: ${targetId} don't have defined element`);
            return; 
        }
        targetEl.scrollIntoView({ behavior: 'smooth' });
    }

    // Iterate each dot <span> element & listen on the clicked dot
    dots.forEach(dot => {
        dot.addEventListener("click", () => navigateToPage(dot));
    });
}

// Activate dot when you scroll page (Func Definer)
function activateClosestDotOnScroll(dots) {
    let closestDot = null;
    let closestDistance = Infinity;

    dots.forEach(dot => {
        // Get target element based on dot
        const targetId = dot.getAttribute("data-target");
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        // Calculate distance between the top of current page and top of view port
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

// ================================
// PAGE 1 
// ================================

// Select ALL hero sections
const heroes = document.querySelectorAll('.hero');

// Intersection Observer to trigger animation on scroll
const heroObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Get the h1 and p inside *this* hero section
      const heroElements = entry.target.querySelectorAll('h1, p');

      heroElements.forEach(el => {
        el.classList.remove('animate'); // reset
        void el.offsetWidth;            // trigger reflow
        el.classList.add('animate');    // fade in
      });
    }
  });
}, { threshold: 0.25 }); // lower threshold to 25%

// Observe each hero
heroes.forEach(hero => heroObserver.observe(hero));

// ==========================
// PAGE 2
// ==========================
// Ripple parallax movement
// Ripple parallax movement
(function() {
  const bg = document.querySelector('.anecdote .ripple');
  if (!bg) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    bg.style.transform = `translate(${clamp(x*18,-20,20)}px, ${clamp(y*18,-20,20)}px) scale(1)`;
  });
})();

// Animate anecdote on scroll (replay on each entry)
(function() {
  const anecdote = document.getElementById('anecdote-section');
  if (!anecdote) return;

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    anecdote.classList.add('in-view');
    anecdote.querySelectorAll('.anecdote-inner, .lead, .author, .question, .explain')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const children = anecdote.querySelectorAll('.lead, .author, .question, .explain');

      if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
        anecdote.classList.add('in-view');
        // stagger children
        children.forEach((el,i) => el.style.transitionDelay = `${120 + i*40}ms`);
      } else {
        // remove class so animation can replay
        anecdote.classList.remove('in-view');
        children.forEach(el => el.style.transitionDelay = `0ms`);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(anecdote);
})();

// ==========================
// PAGE 3
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



// =================================
// PAGE 4
// =================================

const featureGIFs = {
  "Plate Tectonics": "gifs/plate_tectonics.gif",
  "Faults": "gifs/fault_lines.webp",
  "Volcanic Activity": "gifs/volcanic_activity.gif",
  "Seismic Waves": "gifs/seismic_waves.gif",
  "Human-Induced Seismicity": "gifs/human_seismicity.gif",
  "Crustal Adjustments": "gifs/crustal_adjustments.gif"
};

const gifEl = document.getElementById("feature-gif");

const featureBoxes = document.querySelectorAll(".feature-box");

featureBoxes.forEach(box => {
  box.addEventListener("mouseenter", () => {
    const title = box.querySelector("h3").textContent.trim();
    if (featureGIFs[title]) {
      gifEl.src = featureGIFs[title];
      gifEl.style.display = "block";
    }
  });

  box.addEventListener("mouseleave", () => {
    gifEl.style.display = "gifs/evolution2.gif";
    gifEl.src = "gifs/evolution2.gif";
  });
});

// ==========================
// PAGE 5
// ==========================
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
    })

plotBaseSphere(svg1, sphereData, 'globe-sphere1')
svg1.call(drag_behavior)          // <-- fix here
plotCountriesRegions(svg1, countryData, 'country1', '#E31F07')
plotEarthquakesPoints(svg1, earthquakeData)
createGradientLegend(earthquakeData)
resizeGlobe1(svg1, path1, projection1, 'globe-sphere1', 'country1');

plotBaseSphere(svg1R, sphereData, 'globe-sphere1R')
svg1R.call(drag_behavior)         // <-- fix here
plotCountriesRegions(svg1R, countryData, 'country1R', '#2156e9')
plotStationsPoints(svg1R, stationData)
resizeGlobe1(svg1R, path1R, projection1R, 'globe-sphere1R', 'country1R');
// ----------------------------------------------------------------------------

// FUNCTION DEFINITION --------------------------------------------------------
// Function to plot empty dark with white outline globe (Func Definer)
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

// Function to plot country to globe & Handle TOOLTIP HOVER INTERACTIONS (Func Definer)
function plotCountriesRegions(selection, data, className, highlightColor = "#2156e9ff") {
  const countryGeoNameData = topojson.feature(data, data.objects.countries).features;

  const countriesGroup = selection.append("g")
    .attr("class", "countries");

  countriesGroup.selectAll(`.${className}`)
    .data(countryGeoNameData)
    .enter()
    .append("path")
    .attr("class", className)
    .attr("fill", "#222222")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", highlightColor);
      tooltip.text(d.properties.name)
        .style("display","block")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("fill", "#222222");
      tooltip.style("display","none");
    });
}

// Function to plot earthquake spot to globe & Handle TOOLTIP HOVER INTERACTIONS (Func Definer)
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

// Function to plot seismic stations to globe & Handle TOOLTIP HOVER INTERACTIONS (Func Definer)
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

// Function to update stations on rotation or resize (Func Definer)
function updateStations() {
    svg1R.selectAll(".stations .station")
        .attr("transform", d => {
            const p = projection1R([d.longitude, d.latitude]) || [-9999,-9999];
            return `translate(${p[0]},${p[1]}) scale(1)`;
        })
        .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate1) ? 0.95 : 0);
}

// Function determine how a point should be hidden (Func Definer)
function isPointVisible(lon, lat, rotate) {
    const λ = lon * Math.PI/180;
    const φ = lat * Math.PI/180;

    const λ0 = -rotate[0] * Math.PI/180;
    const φ0 = -rotate[1] * Math.PI/180;

    const cosc = Math.sin(φ0)*Math.sin(φ) +
                 Math.cos(φ0)*Math.cos(φ)*Math.cos(λ - λ0);

    return cosc > 0;
}

// Function create the legend for globe with earthquake spots (Func Definer)
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

/* Country */
/* =============================
   Country / Globe / Toggle Logic
============================= */

// Select DOM elements
/* -------------------------
   Global selections & state
------------------------- */
const svg2 = d3.selectAll("#globe-svg-r, #globe-svg");
const countryMapSvg = d3.select("#country-map");

let countriesData = [];
let selectedCountry = null;
let activeLayer = "stations"; // default layer

const DEFAULT_FILL = "#222222";
const HIGHLIGHT_FILL = "#e1e0e0ff";

/* -------------------------
   Load country topojson
------------------------- */
d3.json("https://unpkg.com/world-atlas@2/countries-110m.json")
  .then(worldData => {
    countriesData = topojson.feature(worldData, worldData.objects.countries).features;
  })
  .catch(err => console.error("Failed to load world data:", err));

/* -------------------------
   Utility
------------------------- */
function sameFeature(a, b) {
  if (!a || !b) return false;
  if (a.id !== undefined && b.id !== undefined) return a.id === b.id;
  return a === b;
}

/* -------------------------
   Draw zoomed-in country map
------------------------- */
function drawCountryMap(feature) {
  countryMapSvg.selectAll("*").remove();
  if (!feature) return;

  const cw = countryMapSvg.node().getBoundingClientRect().width || 200;
  const ch = countryMapSvg.node().getBoundingClientRect().height || 250;
  const projection = d3.geoMercator().fitSize([cw, ch], feature);
  const path = d3.geoPath().projection(projection);

  // Draw country
  countryMapSvg.append("path")
    .datum(feature)
    .attr("d", path)
    .attr("fill", HIGHLIGHT_FILL)
    .attr("stroke", "#000")
    .attr("stroke-width", 1);

  // Draw stations if active
  if ((activeLayer === "stations" || activeLayer === "both") && stationData?.length) {
    const stations = stationData.filter(d => d3.geoContains(feature, [d.longitude, d.latitude]));
    const tri = d3.symbol().type(d3.symbolTriangle).size(90);
    const gStations = countryMapSvg.append("g").attr("class", "stations-map");

    gStations.selectAll("path")
      .data(stations)
      .enter()
      .append("path")
      .attr("d", tri)
      .attr("transform", d => {
        const [x, y] = projection([d.longitude, d.latitude]);
        return `translate(${x},${y})`;
      })
      .attr("fill", "#2aa3ff")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(120)
          .attr("transform", () => {
            const [x, y] = projection([d.longitude, d.latitude]);
            return `translate(${x},${y}) scale(1.2)`;
          })
          .attr("fill", "#0033a0");
        if (tooltip) tooltip
          .html(`<strong>${d["station code"]||""}</strong><br>${d.name||""}<br>
                 <strong>Network:</strong> ${d["network code"]||""}`)
          .style("display","block")
          .style("left", (event.pageX+10)+"px")
          .style("top", (event.pageY+10)+"px");
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .transition().duration(120)
          .attr("transform", d => {
            const [x, y] = projection([d.longitude, d.latitude]);
            return `translate(${x},${y}) scale(1)`;
          })
          .attr("fill", "#2aa3ff");
        if (tooltip) tooltip.style("display","none");
      });
  }

  // Draw earthquakes if active
  if ((activeLayer === "earthquakes" || activeLayer === "both") && earthquakeData?.length) {
    const quakes = earthquakeData.filter(d => d3.geoContains(feature, [d.longitude, d.latitude]));
    const gQuakes = countryMapSvg.append("g").attr("class", "earthquakes-map");

    gQuakes.selectAll("circle")
      .data(quakes)
      .enter()
      .append("circle")
      .attr("cx", d => projection([d.longitude, d.latitude])[0])
      .attr("cy", d => projection([d.longitude, d.latitude])[1])
      .attr("r", d => Math.sqrt(d.magnitude)*2)
      .attr("fill", "orange")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("stroke-width", 2);
        if (tooltip) tooltip
          .html(`<strong>Magnitude:</strong> ${d.magnitude}<br>${d.place||""}`)
          .style("display","block")
          .style("left",(event.pageX+10)+"px")
          .style("top",(event.pageY+10)+"px");
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).attr("stroke-width", 0.5);
        if (tooltip) tooltip.style("display","none");
      });
  }

  // Show "No data" message if nothing to display
  if (((activeLayer === "stations" || activeLayer === "both") && !stationData?.length) &&
      ((activeLayer === "earthquakes" || activeLayer === "both") && !earthquakeData?.length)) {
    countryMapSvg.append("text")
      .attr("x", cw/2)
      .attr("y", ch/2)
      .attr("text-anchor","middle")
      .attr("dominant-baseline","middle")
      .attr("fill","#ffffffcc")
      .style("font-size","12px")
      .text("No data for this country");
  }
}

/* -------------------------
   Unified country update
------------------------- */
function updateCountryView() {
  if (!selectedCountry) return;
  drawCountryMap(selectedCountry);

  // Update globes
  if (activeLayer === "stations") {
    plotStationsOnGlobe(selectedCountry);
    hideEarthquakeGlobe();
  } else if (activeLayer === "earthquakes") {
    plotEarthquakesOnGlobe(selectedCountry);
    hideStationGlobe();
  } else if (activeLayer === "both") {
    plotStationsOnGlobe(selectedCountry);
    plotEarthquakesOnGlobe(selectedCountry);
  }

  // Update result text
  const stations = stationData?.filter(d => d3.geoContains(selectedCountry,[d.longitude,d.latitude])) || [];
  const quakes = earthquakeData?.filter(d => d3.geoContains(selectedCountry,[d.longitude,d.latitude])) || [];
  const name = selectedCountry.properties?.name || selectedCountry.properties?.admin || "Selected country";
  d3.select("#country-result").text(`${name}: ${stations.length} stations, ${quakes.length} earthquakes`);
}

/* -------------------------
   Country search
------------------------- */
function handleCountrySearch(query) {
  if (!countriesData?.length) return;

  const q = query.trim().toLowerCase();
  if (!q) return d3.select("#country-result").text("Please enter a country name.");

  const countryFeature = countriesData.find(c => {
    const p = c.properties || {};
    const candidates = [p.name,p.NAME,p.NAME_EN,p.admin,p.name_en].filter(Boolean);
    if (p.iso_a2) candidates.push(p.iso_a2);
    if (p.iso_a3) candidates.push(p.iso_a3);
    return candidates.some(s => String(s).toLowerCase().includes(q));
  });

  if (!countryFeature) {
    selectedCountry = null;
    svg2.selectAll(".country2").attr("fill", DEFAULT_FILL);
    countryMapSvg.selectAll("*").remove();
    d3.select("#country-result").text(`No country matching "${query}" found.`);
    return;
  }

  selectedCountry = countryFeature;
  svg2.selectAll(".country2").attr("fill", d => sameFeature(d, selectedCountry) ? HIGHLIGHT_FILL : DEFAULT_FILL);

  updateCountryView(); // unified redraw
}

/* -------------------------
   Input + button wiring
------------------------- */
const inputEl = document.getElementById("country-input");
const btn = document.getElementById("country-search-btn");
if (btn && inputEl) {
  btn.addEventListener("click", ()=>handleCountrySearch(inputEl.value));
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); handleCountrySearch(inputEl.value); }
  });
}

/* -------------------------
   Toggle buttons logic
------------------------- */
const toggleButtons = document.querySelectorAll(".toggle-btn");
toggleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    activeLayer = btn.dataset.type;
    toggleButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    updateCountryView(); // unified redraw
  });
});

/* -------------------------
   Box toggles for dual-globe view
------------------------- */
(function() {
  const boxStations = document.getElementById("box-stations");
  const boxMagnitudes = document.getElementById("box-magnitudes");
  if (!boxStations || !boxMagnitudes) return;

  function applyActiveBox(mode) {
    activeLayer = mode;
    boxStations.classList.toggle("active", mode === "stations");
    boxMagnitudes.classList.toggle("active", mode === "earthquakes");
    boxStations.setAttribute("aria-pressed", mode === "stations");
    boxMagnitudes.setAttribute("aria-pressed", mode === "earthquakes");

    // Redraw everything
    updateCountryView();
  }

  boxStations.addEventListener("click", () => applyActiveBox("stations"));
  boxMagnitudes.addEventListener("click", () => applyActiveBox("earthquakes"));

  [boxStations, boxMagnitudes].forEach(box => {
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); box.click(); }
    });
  });

  // Set initial state
  applyActiveBox(activeLayer);
})();

// ==========================
// PAGE 6
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  const flipCards = document.querySelectorAll(".flip-card");

  flipCards.forEach(card => {
    card.addEventListener("click", () => {
      card.querySelector(".flip-card-inner").classList.toggle("flipped");
    });
  });
});
