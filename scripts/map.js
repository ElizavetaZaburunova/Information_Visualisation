import getCountryISO2 from "./iso3to2.js";
//https://d3-graph-gallery.com/graph/choropleth_hover_effect.html

// The svg map
var svgMap = d3
  .select("#map")
  .append("svg")
  .attr("width", 800)
  .attr("height", 600);

// Map and projection
var path = d3.geoPath();
var projection = d3
  .geoMercator()
  .scale(100)
  .center([150, -80])
  .translate([700, 600]);

// Margin for Charts
var marginCharts = { top: 30, right: 0, bottom: 70, left: 200 },
  widthCharts = 860 - marginCharts.left - marginCharts.right,
  heightCharts = 800 - marginCharts.top - marginCharts.bottom;

// Histogram
var histogram_svg = d3
  .select("#histogram")
  .append("svg")
  .attr("width", widthCharts + 1000)
  .attr("height", heightCharts + 20)
  .style("margin-bottom", "-210px")
  .append("g")
  .attr(
    "transform",
    "translate(" + marginCharts.left + "," + marginCharts.top + ")"
  );
/////////////////////////////////////////////////
////// TOP TEN JOB TITLES ///////////////////////
/////////////////////////////////////////////////

var xAxisTopTen = d3.scaleLinear();
var yAxisTopTen = d3.scaleBand();
// append the svg object to the body of the page
var topTenSvg = d3
  .select("#topTen")
  .append("svg")
  .attr("width", widthCharts)
  .attr("height", heightCharts)
  .style("margin-bottom", "-210px")
  .append("g")
  .attr(
    "transform",
    "translate(" + marginCharts.left + "," + marginCharts.top + ")"
  );

// Data and color scale
// var data = d3.map();

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
  let _data = new Map();
  for (let i in countrySalariesMean) {
    _data.set(countrySalariesMean[i].key, countrySalariesMean[i].value);
  }
  return _data;
}

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
    .style("padding", "10px")
    .style("position", "absolute");

  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseoverHistogram = function (d) {
    tooltip
      .html(` ${d.length} jobs between USD ${d.x0} and USD ${d.x1}`)
      .style("opacity", 1);
  };
  var mousemoveHistogram = function (d) {
    tooltip
      .style("left", d3.event.pageX + 10 + "px")
      .style("top", d3.event.pageY - 10 + "px");
  };
  var mouseleaveHistogram = function (d) {
    tooltip.style("opacity", 0);
  };

  //Add x axis label
  histogram_svg
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", widthCharts - 220)
    .attr("y", heightCharts / 2 + 45)
    .text("Salary in USD");

  //Add y axis label
  histogram_svg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", "-3.5em")
    .attr("transform", "rotate(-90)")
    .text("Frequency");

  // X axis: scale and draw
  var xAxis = d3
    .scaleLinear()
    .domain([0, d3.max(incomeData, (d) => d.salary_in_usd)])
    .range([0, widthCharts / 1.5]);

  histogram_svg
    .append("g")
    .attr("transform", "translate(0," + heightCharts / 2 + ")")
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
  var yAxis = d3.scaleLinear().range([heightCharts / 2, 0]);
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
      return heightCharts / 2 - yAxis(d.length);
    })
    .style("fill", "#69b3a2")
    .on("mouseover", mouseoverHistogram)
    .on("mousemove", mousemoveHistogram)
    .on("mouseleave", mouseleaveHistogram);
}

function ready(error, topo, incomeData) {
  const data = computeMeanPerCountry(incomeData);

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
    drawTopten(countryISO2);
  };

  // Draw the map
  svgMap
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

  /////////////////////////////////////////////////
  ////// TOP TEN JOB TITLES ///////////////////////
  /////////////////////////////////////////////////

  const drawTopten = function (selectedCountry = undefined) {
    let data = incomeData;

    if (selectedCountry !== undefined) {
      data = data.filter((d) => d.company_location === selectedCountry);
    }

    // Clear previous data from chart
    topTenSvg.selectAll("rect").remove();
    topTenSvg.selectAll("g").remove();

    // Value count of job titles
    let count = d3.rollup(
      data,
      (v) => v.length,
      (d) => d.job_title
    );

    // Sort job titles by count descending
    const sortedCount = new Map(
      [...count.entries()].sort((a, b) => b[1] - a[1])
    );
    var topTenData = Array.from(sortedCount).slice(0, 10);
    topTenData = d3
      .nest()
      .key((d) => d[0])
      .rollup((v) => v[0][1])
      .entries(topTenData);

    // Add X axis
    xAxisTopTen.domain([0, topTenData[0].value]).range([0, widthCharts / 1.5]);

    topTenSvg
      .append("g")
      .attr("transform", "translate(0," + heightCharts / 2 + ")")
      .call(d3.axisBottom(xAxisTopTen))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Y axis
    yAxisTopTen
      .range([0, heightCharts / 2])
      .domain(
        topTenData.map(function (d) {
          return d.key;
        })
      )
      .padding(0.1);
    topTenSvg.append("g").call(d3.axisLeft(yAxisTopTen));

    //Add x axis label
    topTenSvg
      .append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", widthCharts - 220)
      .attr("y", heightCharts / 2 + 45)
      .text("Amount of job titles announced");

    //Add y axis label
    topTenSvg
      .append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("y", 6)
      .attr("dy", "-10.5em")
      .attr("transform", "rotate(-90)")
      .text("Job titles");

    // Add Tooltip
    var tooltip = d3
      .select("#topTen")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("max-width", "300px")
      .style("padding", "10px")
      .style("position", "absolute");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseoverTopTen = function (topTenData) {
      tooltip
        .html(
          "Job-title: " +
            topTenData.key +
            "<br>" +
            "Amount of job titles announced: " +
            topTenData.value
        )
        .style("opacity", 1);
    };
    var mousemoveTopTen = function (d) {
      tooltip
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 10 + "px");
    };
    var mouseleaveTopTen = function (d) {
      tooltip.style("opacity", 0);
    };

    //Bars
    topTenSvg
      .selectAll("myRect")
      .data(topTenData)
      .enter()
      .append("rect")
      .attr("x", xAxisTopTen(0))
      .attr("y", function (d) {
        return yAxisTopTen(d.key);
      })
      .attr("width", function (d) {
        return xAxisTopTen(d.value);
      })
      .attr("height", yAxisTopTen.bandwidth())
      .attr("fill", "#69b3a2")
      .on("mouseover", mouseoverTopTen)
      .on("mousemove", mousemoveTopTen)
      .on("mouseleave", mouseleaveTopTen);
  };

  drawTopten("DE");

  // Draw the histogram for the whole world without any filter by default
  drawHistogram(incomeData);
}

// Parse the Data
d3.csv("./data/salaries.csv", function (csv_data) {
  // const incomeData = csv_data.filter((d) => d.company_location === "AT");
  //draw top ten with selected user data from map
});
