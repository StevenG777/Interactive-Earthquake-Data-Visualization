// ==========================
// DATA LOADING
// ==========================
// Load earthquake data from CSV file (Defined Function)
async function loadCSV(path, sampleSize) {
    // Download CSV text through Fetch API (HTTP Request)
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

// Call the CSV loader function (Caller Function)
const earthquakeData = (await loadCSV("earthquakes.csv", 1000))
    .filter(d => 
        d.mag != null && !isNaN(d.mag) &&
        d.latitude != null && !isNaN(d.latitude) &&
        d.longitude != null && !isNaN(d.longitude)
    );
console.log(earthquakeData)


// ==========================
// DOT FOR PAGES
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const dots = document.querySelectorAll(".nav-dot");

    const updateActiveDot = () => {
        let closestDot = null;
        let closestDistance = Infinity;

        dots.forEach(dot => {
            const targetId = dot.getAttribute("data-target");
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            // distance from top of viewport to top of section
            const rect = targetEl.getBoundingClientRect();
            const distance = Math.abs(rect.top);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestDot = dot;
            }
        });

        if (closestDot) {
            dots.forEach(d => d.classList.remove("active"));
            closestDot.classList.add("active");
        }
    };

    // Scroll to section on dot click
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

    // Update on scroll and after scroll ends (scroll-snap)
    window.addEventListener("scroll", updateActiveDot);
    window.addEventListener("resize", updateActiveDot);

    // Optional: observe scroll snapping end using IntersectionObserver
    const observer = new IntersectionObserver(() => {
        updateActiveDot();
    }, { threshold: 0.5 });

    document.querySelectorAll("section, .hero").forEach(sec => observer.observe(sec));

    // initial update
    updateActiveDot();
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
// TOOLTIP
// ==========================
const tooltip = d3.select("#globe-tooltip");


// ==========================
// PAGE 3: GLOBE 1
// ==========================
const svg1 = d3.select("#globe-svg");
const path1 = d3.geoPath();
const quakeHighlight = "#b30000";

const canvas = document.getElementById("globe-canvas");
const ctx = canvas.getContext("2d");

const projection1 = d3.geoOrthographic().clipAngle(90);
let rotate1 = [0, -20];
let lastX1, lastY1;

// Append SVG element for Globe
svg1.append("path")
  .datum({ type: "Sphere" })
  .attr("class", "globe-sphere")
  .attr("fill", "#000")
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.5);

// Load country geographic locations & name data to globe (Caller Function)
const countryData = d3.json("https://unpkg.com/world-atlas@2/countries-110m.json")
countryData.then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    svg1.append("g").attr("class", "countries").selectAll(".country")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("fill", "#000")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("fill", "#2156e9ff");
            tooltip.text(d.properties.name)
                    .style("display","block")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top",  (event.pageY + 10) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top",  (event.pageY + 10) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).attr("fill", "#000");
            tooltip.style("display","none");
        });

    plotEarthquakesPoints();
    resizeGlobe1();
});

// Make drag-able & rotate-able action available to globe (Caller Function)
svg1.call(d3.drag()
    .on("start", event => { lastX1 = event.x; lastY1 = event.y; })
    .on("drag", event => {
        const dx = event.x - lastX1;
        const dy = event.y - lastY1;
        lastX1 = event.x; lastY1 = event.y;
        rotate1[0] += dx * 0.7;
        rotate1[1] -= dy * 0.7;
        rotate1[1] = Math.max(-90, Math.min(90, rotate1[1]));
        projection1.rotate(rotate1);

        // svg1.selectAll("path").attr("d", path1);
        svg1.selectAll(".country").attr("d", path1);
        // svg1.selectAll(".earthquakes circle")
        //   .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0);
        drawEarthquakesCanvas();

        // updateEarthquakes();
        // updateClipPath();
    })
    .on("end", () => {
        // After drag ends, update full projection
        svg1.selectAll(".country").attr("d", path1);
        // updateEarthquakes();
        drawEarthquakesCanvas();
    })
);

// Tooltip stuff
svg1.on("mousemove", (event) => {
    const [mx, my] = d3.pointer(event);

    const hovered = earthquakeData.find(d => {
        const p = projection1([d.longitude, d.latitude]);
        if (!p) return false;
        const [x, y] = p;
        const r = Math.sqrt(Math.abs(d.mag)) * 2.5;
        return Math.hypot(mx - x, my - y) < r + 3;
    });

    if (hovered) {
        tooltip
            .style("display", "block")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px")
            .html(`
                <strong>${hovered.place}</strong><br>
                Mag: ${hovered.mag}
            `);
    } else {
        tooltip.style("display", "none");
    }
});

// Resize within some unknown window (Caller Event Listener)
window.addEventListener("resize", resizeGlobe1);

// Function to plot earthquake spot to globe (Definer Function)
async function plotEarthquakesPoints() {
    let earthquakesGroup = svg1.append("g")
        .attr("class", "earthquakes")

    earthquakesGroup.selectAll("circle")
        .data(earthquakeData)
        .enter()
        .append("circle")
        .attr("cx", d => {
            const p = projection1([d.longitude, d.latitude])
            d._x = p[0];
            return d._x
        })
        .attr("cy", d => {
            const p = projection1([d.longitude, d.latitude])
            d._y = p[1];
            return d._y
        })
        .attr("r", d => Math.sqrt(Math.abs(d.mag)) * 4)
        .attr("fill", "red")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.3)
        .attr("opacity", d => 
            isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0)
        .on("mouseover", function(event, d) {
            // enlarge dot
            d3.select(this)
            .transition()
            .duration(150)
            .attr("fill", "#4d1515ff")
            .attr("r", Math.sqrt(d.mag) * 8);  

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
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
           .style("top",  (event.pageY + 10)  + "px");
        })
        .on("mouseout", function(event, d) {
            tooltip.style("display","none");

        // shrink back to original radius
        d3.select(this)
            .transition()
            .duration(150)
            .attr("fill", "red")
            .attr("r", Math.sqrt(d.mag) * 4);
    });

    // drawEarthquakesCanvas();
}

function drawEarthquakesCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    earthquakeData.forEach(d => {
        const p = projection1([d.longitude, d.latitude]);
        if (!p) return;

        const [x, y] = p;

        // Hemisphere check (same logic)
        if (!isPointVisible(d.longitude, d.latitude, rotate1)) return;

        const radius = Math.sqrt(Math.abs(d.mag)) * 2.5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,0,0,0.8)";
        ctx.fill();
    });
}

// Function to resize global to fit current container (Definer Function)
// function resizeGlobe1() {
//     const containerWidth = svg1.node().parentNode.getBoundingClientRect().width;
//     svg1.attr("width", containerWidth).attr("height", containerWidth);
//     projection1.translate([containerWidth / 2, containerWidth / 2])
//                .scale(containerWidth / 2 * 0.9);
//     path1.projection(projection1);
//     svg1.select(".globe-sphere").attr("d", path1);
//     svg1.selectAll(".country").attr("d", path1);

//     updateEarthquakes();
//     // updateClipPath(); 
// }

function resizeGlobe1() {
    const containerWidth = svg1.node().parentNode.getBoundingClientRect().width;

    svg1.attr("width", containerWidth).attr("height", containerWidth);

    // Canvas must match SVG size
    canvas.width = containerWidth;
    canvas.height = containerWidth;

    projection1
        .translate([containerWidth / 2, containerWidth / 2])
        .scale(containerWidth / 2 * 0.9);

    path1.projection(projection1);

    // Update SVG paths
    svg1.select(".globe-sphere").attr("d", path1);
    svg1.selectAll(".country").attr("d", path1);

    drawEarthquakesCanvas();
}


// Function to determine if an earthquake point should be visible or not (Definer Function)
function isPointVisible(lon, lat, rotate) {
    const λ = lon * Math.PI/180;
    const φ = lat * Math.PI/180;

    const λ0 = -rotate[0] * Math.PI/180; // invert rotation
    const φ0 = -rotate[1] * Math.PI/180;

    const cosc = Math.sin(φ0)*Math.sin(φ) +
                 Math.cos(φ0)*Math.cos(φ)*Math.cos(λ - λ0);

    return cosc > 0;  // visible hemisphere
}

// Function to update earthquakes on rotation or resize (Definer Function)
function updateEarthquakes() {
    svg1.selectAll(".earthquakes circle")
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        .attr("opacity", d =>
            isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0
        );
}

function updateEarthquakesOnce() {
    earthquakesGroup.selectAll("circle")
        .attr("cx", d => {
            const p = projection1([d.longitude, d.latitude]);
            d._x = p[0];
            return d._x;
        })
        .attr("cy", d => {
            const p = projection1([d.longitude, d.latitude]);
            d._y = p[1];
            return d._y;
        });
}


// ==========================
// PAGE 3: GLOBE 1.5
// ==========================

const svgStation = d3.select("#globe-svg-station");
const pathStation = d3.geoPath();

const projectionStation = d3.geoOrthographic().clipAngle(90);
let rotateStation = [0, -20];
let lastXStation, lastYStation;

// Append SVG element for Globe
svgStation.append("path")
  .datum({ type: "Sphere" })
  .attr("class", "globe-sphere")
  .attr("fill", "#000")
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.5);

// Load country geographic locations & name data to globe (Caller Function)
countryData.then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    svgStation.append("g").attr("class", "countries").selectAll(".country")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("fill", "#000")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("fill", "#2156e9ff");
            tooltip.text(d.properties.name)
                    .style("display","block")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top",  (event.pageY + 10) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top",  (event.pageY + 10) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).attr("fill", "#000");
            tooltip.style("display","none");
        });

    plotEarthquakesPoints();
    resizeGlobe1();
});

// Make drag-able & rotate-able action available to globe (Caller Function)
svgStation.call(d3.drag()
    .on("start", event => { lastX1 = event.x; lastY1 = event.y; })
    .on("drag", event => {
        const dx = event.x - lastX1;
        const dy = event.y - lastY1;
        lastX1 = event.x; lastY1 = event.y;
        rotate1[0] += dx * 0.7;
        rotate1[1] -= dy * 0.7;
        rotate1[1] = Math.max(-90, Math.min(90, rotate1[1]));
        projection1.rotate(rotate1);

        // svg1.selectAll("path").attr("d", path1);
        svg1.selectAll(".country").attr("d", pathStation);
        // svg1.selectAll(".earthquakes circle")
        //   .attr("opacity", d => isPointVisible(d.longitude, d.latitude, rotate1) ? 0.8 : 0);
        drawEarthquakesCanvas();

        // updateEarthquakes();
        // updateClipPath();
    })
    .on("end", () => {
        // After drag ends, update full projection
        svg1.selectAll(".country").attr("d", pathStation);
        // updateEarthquakes();
        drawEarthquakesCanvas();
    })
);



// ==========================
// PAGE 4: GLOBE 2 
// ==========================


// Container for globe
const svg2 = d3.select("#globe-svg-2");
// Path generator that convert GeoJSON data to SVG path string
const path2 = d3.geoPath();
// Define Azimuthal projections (Sphere --> Plane) 
const projection2 = d3.geoOrthographic().clipAngle(90);
let rotate2 = [0, -20];
let lastX2, lastY2;

svg2.append("path")
  .datum({ type: "Sphere" })
  .attr("class", "globe-sphere")
  .attr("fill", "#000")
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.5);

const countriesGroup2 = svg2.append("g").attr("class", "countries");
const countryMapSvg = d3.select("#country-map");

let selectedCountry = null;
let connectorPath = null;

d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
  const countries = topojson.feature(worldData, worldData.objects.countries).features;

  countriesGroup2.selectAll(".country")
    .data(countries)
    .enter()
    .append("path")
      .attr("class", "country")
      .attr("fill", "#000")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#2156e9ff");
        tooltip.text(d.properties.name)
               .style("display","block")
               .style("left", (event.pageX + 10) + "px")
               .style("top",  (event.pageY + 10) + "px");
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top",  (event.pageY + 10) + "px");
      })
      .on("mouseout", (event, d) => {
        if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#000");
        tooltip.style("display","none");
      })
      .on("click", (event, d) => {
        if (selectedCountry) {
          countriesGroup2.selectAll(".country")
            .filter(c => c.properties.name === selectedCountry.properties.name)
            .attr("fill", "#000");
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
  svg2.select(".globe-sphere").attr("d", path2);
  svg2.selectAll(".country").attr("d", path2);

}
window.addEventListener("resize", resizeGlobe2);
window.addEventListener("scroll", () => {
  if (selectedCountry) drawConnector();
});
