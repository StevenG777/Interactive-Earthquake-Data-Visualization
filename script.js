// Vonoroi Diagram (Optional)
    // const points = earthquakeData.map(d => {
    //     const [x, y] = projection1([d.longitude, d.latitude]);
    //     return { x, y, data: d };
    // });

    // // 2. Create Voronoi diagram
    // const voronoi = d3.Delaunay
    //     .from(points, d => d.x, d => d.y)
    //     .voronoi([0, 0, width, height]);

    // svg1.append("g")
    //     .attr("class", "voronoi")
    //     .selectAll("path")
    //     .data(points)
    //     .enter()
    //     .append("path")
    //     .attr("stroke", "#352dbcff")
    //     .attr("d", (d, i) => voronoi.renderCell(i))
    //     .style("fill", "none")
    //     .style("pointer-events", "all")
    //     .on("mouseover", (event, d) => {
    //         let location = d.data.place;
    //         let distance = "";

    //         if (d.data.place.includes(",")) {
    //             const parts = d.data.place.split(",");
    //             distance = parts[0].trim();
    //             location = parts[1].trim();
    //         }

    //         tooltip.html(`
    //             <strong>${location}</strong><br>
    //             ${distance ? `* Distance: ${distance}<br>` : ""}
    //             * Mag: ${d.data.mag != null ? d.data.mag : "Unknown"}
    //         `)
    //         .style("display", "block")
    //         .style("left", (event.pageX + 10) + "px")
    //         .style("top", (event.pageY + 10) + "px");
    //     })
    //     .on("mousemove", event => {
    //         tooltip.style("left", (event.pageX + 10) + "px")
    //             .style("top", (event.pageY + 10) + "px");
    //     })
    //     .on("mouseout", () => {
    //         tooltip.style("display", "none");
    //     });

// ==========================
// DATA LOADING
// ==========================
async function loadCSV(path, sampleSize = null) {
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

// Define another function because of async/await structure, annoying
async function loadData(sample_Size = null) {
    const sample = await loadCSV("data.csv", sample_Size);
    console.log("Random 100:", sample);
}
loadData()


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
// TOOLTIP
// ==========================
const tooltip = d3.select("#globe-tooltip");

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
// PAGE 3: GLOBE 1
// ==========================
const svg1 = d3.select("#globe-svg");
const path1 = d3.geoPath();
const projection1 = d3.geoOrthographic().clipAngle(90);
let rotate1 = [0, -20];
let lastX1, lastY1;
let earthquakesGroup;

svg1.append("path")
  .datum({ type: "Sphere" })
  .attr("class", "globe-sphere")
  .attr("fill", "#000")
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.5);

svg1.append("defs")
    .append("clipPath")
    .attr("id", "front-hemisphere")
    .append("path")
    .attr("class", "globe-clip");

const countriesGroup1 = svg1.append("g").attr("class", "countries");

d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(worldData => {
  const countries = topojson.feature(worldData, worldData.objects.countries).features;

  countriesGroup1.selectAll(".country")
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

    resizeGlobe1();
    plotEarthquakesPoints();
});

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

        svg1.selectAll("path").attr("d", path1);
        updateEarthquakes();
        updateClipPath();
    })
);

window.addEventListener("resize", resizeGlobe1);

async function plotEarthquakesPoints(sample_Size = null) {
    const earthquakeData = (await loadCSV("data.csv", sample_Size))
        .filter(d => 
            d.mag != null && !isNaN(d.mag) &&
            d.latitude != null && !isNaN(d.latitude) &&
            d.longitude != null && !isNaN(d.longitude)
        );

    earthquakesGroup = svg1.append("g")
        .attr("class", "earthquakes")
        .attr("clip-path", "url(#front-hemisphere)");

    earthquakesGroup.selectAll("circle")
        .data(earthquakeData)
        .enter()
        .append("circle")
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1])
        .attr("r", d => Math.sqrt(Math.abs(d.mag)) * 2)
        .attr("fill", "red")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.3)
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
            let location = d.place;
            let distance = "";

            if (d.place.includes(",")) {
                const parts = d.place.split(",");
                distance = parts[0].trim();       // e.g., "17 km E of Amahai"
                location = parts[1].trim();       // e.g., "Indonesia"
            }

            tooltip.html(`
                <strong>${location}</strong><br>
                ${distance ? `* Distance: ${distance}<br>` : ""}
                * Mag: ${d.mag != null ? d.mag : "Unknown"}
            `)
            .style("display", "block")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });
}

// Function to resize global to fit current container
function resizeGlobe1() {
    const containerWidth = svg1.node().parentNode.getBoundingClientRect().width;
    svg1.attr("width", containerWidth).attr("height", containerWidth);
    projection1.translate([containerWidth / 2, containerWidth / 2])
               .scale(containerWidth / 2 * 0.9);
    path1.projection(projection1);
    svg1.select(".globe-sphere").attr("d", path1);
    svg1.selectAll(".country").attr("d", path1);

    updateEarthquakes();
    updateClipPath(); 
}

// Function to update earthquakes on rotation or resize
function updateEarthquakes() {
    svg1.selectAll(".earthquakes circle")
        .attr("cx", d => projection1([d.longitude, d.latitude])[0])
        .attr("cy", d => projection1([d.longitude, d.latitude])[1]);
}

// Function to show data in front sphere
function updateClipPath() {
    svg1.select(".globe-clip")
        .attr("d", path1({ type: "Sphere" }));
}


// ==========================
// PAGE 4: GLOBE 2 + CONNECTOR
// ==========================
const svg2 = d3.select("#globe-svg-2");
const path2 = d3.geoPath();
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

        drawConnector();
      });

  resizeGlobe2();
});

// Connector Globe 2 + Country
function drawConnector(){
  // remove existing
  if (connectorPath) connectorPath.remove();

  const globeSvg = d3.select("#globe-svg-2").node();
  const countrySvg = d3.select("#country-map").node();
  const gBBox = globeSvg.getBoundingClientRect();
  const cBBox = countrySvg.getBoundingClientRect();

  const startX = gBBox.x + gBBox.width;
  const startY = gBBox.y + gBBox.height / 2;
  const endX = cBBox.x;
  const endY = cBBox.y + cBBox.height / 2;

  const connectorSvg = d3.select("#line-connector");

  connectorPath = connectorSvg.append("path")
    .attr("d", `M${startX},${startY} L${endX},${endY}`)
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", function() {
      const len = this.getTotalLength();
      return `${len} ${len}`;
    })
    .attr("stroke-dashoffset", function() {
      return this.getTotalLength();
    });

  connectorPath.transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);
}

svg2.call(d3.drag()
  .on("start", event => { lastX2 = event.x; lastY2 = event.y; })
  .on("drag", event => {
    const dx = event.x - lastX2;
    const dy = event.y - lastY2;
    lastX2 = event.x; lastY2 = event.y;
    rotate2[0] += dx * 0.7;
    rotate2[1] -= dy * 0.7;
    rotate2[1] = Math.max(-90, Math.min(90, rotate2[1]));
    projection2.rotate(rotate2);
    svg2.selectAll("path").attr("d", path2);

    // remove connector when globe moves
    if (connectorPath) {
      connectorPath.remove();
      connectorPath = null;
    }
  })
);

function resizeGlobe2(){
  const cw = svg2.node().parentNode.getBoundingClientRect().width;
  svg2.attr("width", cw).attr("height", cw);
  projection2.translate([cw/2, cw/2]).scale(cw/2 * 0.9);
  path2.projection(projection2);
  svg2.select(".globe-sphere").attr("d", path2);
  svg2.selectAll(".country").attr("d", path2);

  // optionally redraw connector if country is selected
  if (selectedCountry) drawConnector();
}
window.addEventListener("resize", resizeGlobe2);
window.addEventListener("scroll", () => {
  if (selectedCountry) drawConnector();
});


