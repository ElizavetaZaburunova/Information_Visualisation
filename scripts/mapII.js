import getCountryISO2 from "./iso3to2.js";
//https://d3-graph-gallery.com/graph/choropleth_hover_effect.html
// The svg
var svg = d3.select("svg") //,
  // width = +svg.attr("width"),
  // height = +svg.attr("height");

var margin = {top: 50, right: 30, bottom: 30, left: 50},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var histogram_svg = d3.select("#histogram")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Map and projection
var path = d3.geoPath();
var projection = d3
  .geoMercator()
  .scale(70)
  .center([0, 20])
  .translate([width / 2, height / 2]);

// Data and color scale
var data = d3.map();

// Load external data and boot
d3.queue()
  //Load external world map data
  .defer(
    d3.json,
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  )
  //Load data
  .defer(d3.csv, "./data/salaries.csv")
  .await(ready);

function computeMeanPerCountry(raw_data) {
    // Group per country and compute mean 
    const countrySalariesMean = d3
    .nest()
    .key(function (d) {
      return d.company_location;
    })
    .rollup(function (v) {
      return d3.mean(v, function (d) {
        return d.salary_in_usd;
      });
    })
    .entries(raw_data);

    // Build map <k:v> => <country_id:mean_salaray_in_usd>
    let _data = d3.map();
    for (let i in countrySalariesMean) {
      _data.set(countrySalariesMean[i].key, countrySalariesMean[i].value);
    }
    return _data;
}

function drawHistogram(incomeData, selectedCountry=undefined) {
  histogram_svg.selectAll("rect").remove();
  histogram_svg.selectAll("g").remove();

  if (selectedCountry) {
    incomeData = incomeData.filter(d => d.company_location === selectedCountry)
  }
      // Draw the histogram
      // X axis: scale and draw:
    var xAxis = d3.scaleLinear()
        .domain([0, d3.max(incomeData, d => d.salary_in_usd)])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
        .range([0, width]);

    histogram_svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xAxis));


    // Compute bins 
    var histogram = d3.histogram()
    .value(function(d) { return d.salary_in_usd; })   // I need to give the vector of value
    .domain(xAxis.domain())  // then the domain of the graphic
    .thresholds(xAxis.ticks(70)); // then the numbers of bins

    var bins = histogram(incomeData);
    
      // Y axis: scale and draw:
    var yAxis = d3.scaleLinear()
        .range([height, 0]);
        yAxis.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    histogram_svg.append("g")
        .call(d3.axisLeft(yAxis));

          // append the bar rectangles to the svg element
    histogram_svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
          .attr("x", 1)
          .attr("transform", function(d) { return "translate(" + xAxis(d.x0) + "," + yAxis(d.length) + ")"; })
          .attr("width", function(d) { return xAxis(d.x1) - xAxis(d.x0) -1 ; })
          .attr("height", function(d) { return height - yAxis(d.length); })
          .style("fill", "#69b3a2")
}

function ready(error, topo, incomeData) {
  var data = computeMeanPerCountry(incomeData);
  var colorScale = d3.scaleQuantize()
    .domain([d3.min(data.values()), d3.max(data.values())])
    .range(d3.schemeBlues[7]);

  let mouseOver = function (d) {
    // Reset all other countries 
    d3.selectAll(".Country").style("opacity", 1).style("stroke", "transparent");

    // Highlight the hover country
    d3.selectAll(".Country").transition().duration(200).style("opacity", 0.5);
    d3.select(this)
      .transition()
      .duration(200)
      .style("opacity", 1)
      .style("stroke", "black");
  };

  let mouseLeave = function (d) {
    d3.selectAll(".Country").transition().duration(200).style("opacity", 1);
    d3.select(this).transition().duration(200).style("stroke", "transparent");
  };

  let countryClick = function (d) {
    const countryISO2 = getCountryISO2(d.id);
    drawHistogram(incomeData, countryISO2);
  }

  // Draw the map
  svg
    .append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    // draw each country
    .attr("d", d3.geoPath().projection(projection))
    // set the color of each country
    .attr("fill", function (d) {
      const countryISO2 = getCountryISO2(d.id);
      d.total = data.get(countryISO2) || 0;
      return colorScale(d.total);
    })
    .style("stroke", "transparent")
    .attr("class", function (d) {
      return "Country";
    })
    .style("opacity", 0.8)
    .on("mouseover", mouseOver)
    .on("mouseleave", mouseLeave)
    .on("click", countryClick);

    drawHistogram(incomeData)
}
