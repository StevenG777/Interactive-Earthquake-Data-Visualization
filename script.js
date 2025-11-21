// ==========================
// TOOLTIP
// ==========================
const tooltip = d3.select("#globe-tooltip");

// ==========================
// PAGE 2: EARTH LAYERS PLOT
// ==========================

const layers = [
  { name: "Crust", 
    color: "#d2c6a4ff", 
    description: "Earth's outermost & thinnest layer that stretches approximately 5km thick under ocean floor and 30km thick under continents", 
    thickness: 40 },
  { name: "Lithosphere", 
    color: "#8e8174ff", 
    description: "…", 
    thickness: 30 },
  { name: "Asthenosphere", 
    color: "#5b4c3dff", 
    description: "…", 
    thickness: 50 },
  { name: "Mantle", 
    color: "#3a3637ff", 
    description: "…", 
    thickness: 70 },
];

const width = 300;
const height = 500;

const svg = d3.select("#earth-structure-plot")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("width", "100%")
  .attr("height", "100%");

const defs = svg.append("defs");

layers.forEach((layer, i) => {
  const grad = defs.append("linearGradient")
    .attr("id", `grad-${i}`)
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");  // vertical gradient

grad.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", d3.rgb(layer.color).brighter(0.7));
  grad.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", d3.rgb(layer.color).darker(0.7));
});

let currentY = 0;
const totalThickness = d3.sum(layers, d => d.thickness);

layers.forEach((layer, i) => {
  const layerHeight = (layer.thickness / totalThickness) * height;

  svg.append("rect")
    .attr("x", 0)
    .attr("y", currentY)
    .attr("width", width)
    .attr("height", layerHeight)
    .attr("fill", `url(#grad-${i})`)  // use gradient here
    .attr("class", "layer")
    .on("mouseover", (event) => {
      d3.select("#earth-layer-info").html(layer.description);
      svg.selectAll(".layer").attr("opacity", 0.7);
      d3.select(event.currentTarget).attr("opacity", 1);
    })
    .on("mouseout", () => {
      d3.select("#earth-layer-info").text("Hover over a layer to see details.");
      svg.selectAll(".layer").attr("opacity", 1);
    })
    .on("click", (event) => {
      const rect = d3.select(event.currentTarget);
      rect.transition()
          .duration(400)
          .attr("transform", `translate(-5, -5) scale(1.05)`)
        .transition()
          .duration(400)
          .attr("transform", `translate(0,0) scale(1)`);
    });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", currentY + layerHeight / 2)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", "#fff")
    .style("pointer-events", "none")
    .text(layer.name);

  currentY += layerHeight;
});


// ==========================
// PAGE 3: GLOBE 1
// ==========================
const svg1 = d3.select("#globe-svg");
const path1 = d3.geoPath();
const projection1 = d3.geoOrthographic().clipAngle(90);
let rotate1 = [0, -20];
let lastX1, lastY1;

svg1.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "globe-sphere")
    .attr("fill", "#000")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5);

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
                   .style("display", "block")
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", event => {
            d3.select(event.currentTarget).attr("fill", "#000");
            tooltip.style("display", "none");
        });

    resizeGlobe1();
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
    })
);

function resizeGlobe1() {
    const containerWidth = svg1.node().parentNode.getBoundingClientRect().width;
    svg1.attr("width", containerWidth).attr("height", containerWidth);
    projection1.translate([containerWidth / 2, containerWidth / 2])
               .scale(containerWidth / 2 * 0.9);
    path1.projection(projection1);
    svg1.select(".globe-sphere").attr("d", path1);
    svg1.selectAll(".country").attr("d", path1);
}
window.addEventListener("resize", resizeGlobe1);

// ==========================
// PAGE 4: GLOBE 2
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
let connectorSvg = null;

// Create reset button immediately
const resetButton = document.createElement("button");
resetButton.textContent = "Reset Country";
resetButton.id = "reset-button";
Object.assign(resetButton.style, {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    padding: "8px 12px",
    background: "#fff",
    border: "1px solid #000",
    cursor: "pointer",
    display: "none"
});
resetButton.addEventListener("click", () => {
    if (selectedCountry) {
        countriesGroup2.selectAll(".country")
            .filter(c => c === selectedCountry)
            .attr("fill", "#000");
        selectedCountry = null;
    }
    countryMapSvg.selectAll("*").remove();
    if (connectorSvg) connectorSvg.remove();
    connectorSvg = null;
    d3.select("#country-name").text("Click a country");
    d3.select("#country-details").text("Details about the selected country will appear here.");
});
document.querySelector("#country-detail-section").appendChild(resetButton);

// Intersection observer to show/hide reset button
const observerButton = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) resetButton.style.display = "block";
        else resetButton.style.display = "none";
    });
}, { threshold: 0.1 });
observerButton.observe(document.querySelector("#country-detail-section"));


// Load countries for Globe 2
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
                   .style("display", "block")
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", (event, d) => {
            if (d !== selectedCountry) d3.select(event.currentTarget).attr("fill", "#000");
            tooltip.style("display", "none");
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

    // redraw the zoomed country map
    countryMapSvg.selectAll("*").remove();
    const width = countryMapSvg.node().getBoundingClientRect().width;
    const height = countryMapSvg.node().getBoundingClientRect().height;
    const countryProjection = d3.geoMercator().fitSize([width, height], d);
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

// Drag Globe 2
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

        // Remove connector on rotate
        if (connectorSvg) { connectorSvg.remove(); connectorSvg = null; }
    })
);

function resizeGlobe2() {
    const containerWidth = svg2.node().parentNode.getBoundingClientRect().width;
    svg2.attr("width", containerWidth).attr("height", containerWidth);
    projection2.translate([containerWidth / 2, containerWidth / 2])
               .scale(containerWidth / 2 * 0.9);
    path2.projection(projection2);
    svg2.select(".globe-sphere").attr("d", path2);
    svg2.selectAll(".country").attr("d", path2);
}
window.addEventListener("resize", resizeGlobe2);

