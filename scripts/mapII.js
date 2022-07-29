import getCountryISO2 from "./iso3to2.js";
//https://d3-graph-gallery.com/graph/choropleth_hover_effect.html
// The svg
var svg = d3.select("svg"); //,
// width = +svg.attr("width"),
// height = +svg.attr("height");

var margin = { top: 50, right: 30, bottom: 50, left: 50 },
  width = 1000 - margin.left - margin.right,
  height = 1000 - margin.top - margin.bottom;

var histogram_svg = d3
  .select("#histogram")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Map and projection
var path = d3.geoPath();
var projection = d3
  .geoMercator()
  .scale(130)
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

svg
  .append("text")
  .attr("transform", "translate(200,0)")
  .attr("x", 50)
  .attr("y", -10)
  .attr("font-size", "24px")
  .text("XYZ Foods Stock Price");

function drawHistogram(incomeData, selectedCountry = undefined) {
  // Clear previous data from chart
  histogram_svg.selectAll("rect").remove();
  histogram_svg.selectAll("g").remove();

  // Check if data is filtered by country
  if (selectedCountry) {
    incomeData = incomeData.filter(
      (d) => d.company_location === selectedCountry
    );
  }
  // ----------------
  // Create a tooltip
  // ----------------
  var tooltip = d3
    .select("#barchart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("max-width", "200px")
    .style("padding", "10px");

  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseover = function (countrySalariesMean) {
    var countryName = countrySalariesMean.key;
    var meanSalary = countrySalariesMean.value;
    tooltip
      .html("Country: " + countryName + "<br>" + "Mean Salary: " + meanSalary)
      .style("opacity", 1);
  };
  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseover = function (countrySalariesMean) {
    var countryName = countrySalariesMean.key;
    var meanSalary = countrySalariesMean.value;
    tooltip
      .html("Country: " + countryName + "<br>" + "Mean Salary: " + meanSalary)
      .style("opacity", 1);
  };
  var mousemove = function (d) {
    tooltip
      .style("left", d3.mouse(this)[0] + 90 + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
      .style("top", d3.mouse(this)[1] + "px");
  };
  var mouseleave = function (d) {
    tooltip.style("opacity", 0);
  };

  // X axis: scale and draw
  var xAxis = d3
    .scaleLinear()
    .domain([0, d3.max(incomeData, (d) => d.salary_in_usd)])
    .range([0, width / 1.5]);

  histogram_svg
    .append("g")
    .attr("transform", "translate(0," + height / 2 + ")")
    .call(d3.axisBottom(xAxis));

  // Compute 10 bins for the histogram
  var histogram = d3
    .histogram()
    .value(function (d) {
      return d.salary_in_usd;
    })
    .domain(xAxis.domain())
    .thresholds(xAxis.ticks(10));

  var bins = histogram(incomeData);

  // Y axis: scale and draw
  var yAxis = d3.scaleLinear().range([height / 2, 0]);
  yAxis.domain([
    0,
    d3.max(bins, function (d) {
      return d.length;
    }),
  ]);
  histogram_svg.append("g").call(d3.axisLeft(yAxis));

  // Draw the bars of the histogram
  histogram_svg
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr("transform", function (d) {
      return "translate(" + xAxis(d.x0) + "," + yAxis(d.length) + ")";
    })
    .attr("width", function (d) {
      return xAxis(d.x1) - xAxis(d.x0) - 1;
    })
    .attr("height", function (d) {
      return height / 2 - yAxis(d.length);
    })
    .style("fill", "#69b3a2")
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
}

function ready(error, topo, incomeData) {
  var data = computeMeanPerCountry(incomeData);
  console.log(incomeData);

  var colorScale = d3
    .scaleQuantize()
    .domain([d3.min(data.values()), d3.max(data.values())])
    .range(d3.schemeBlues[7]);

  // Mouse over event
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

  // Mouse over event, reset all styles
  let mouseLeave = function (d) {
    d3.selectAll(".Country").transition().duration(200).style("opacity", 1);
    d3.select(this).transition().duration(200).style("stroke", "transparent");
  };

  // Mouse click event on country
  let countryClick = function (d) {
    const countryISO2 = getCountryISO2(d.id);
    drawHistogram(incomeData, countryISO2);
    /* drawTopten(countryISO2); */
  };

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

  // Draw the histogram for the whole world without any filter by default
  drawHistogram(incomeData);
}
