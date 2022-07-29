// set the dimensions and margins of the graph
var margin = { top: 30, right: 30, bottom: -350, left: 100 },
  width = 1000 - margin.left - margin.right,
  height = 1000 - margin.top;

// append the svg object to the body of the page
var svgBarchart = d3
  .select("#barchart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var xAxisBarChart = d3.scaleBand();
var yAxisBarChart = d3.scaleLinear();

var g = svgBarchart
  .append("g")
  .attr("transform", "translate(" + 100 + "," + 100 + ")");

// read the data
d3.csv("./data/salaries.csv", function (csv_data) {
  //get mean salary for country
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
    .entries(csv_data);

  //if you want to sort the data by salary
  /* countrySalariesMean.sort((a, b) => {
  return b.value - a.value;
}); */

  //get the country ids for the dropdown
  var countriesArray = countrySalariesMean.map(function (d) {
    return d.key;
  });

  // ----------------
  // Dropdown menu for the countries
  // ----------------
  var dropdown = d3.selectAll("#dropdown");
  dropdown
    .selectAll("option")
    .data(countriesArray)
    .enter()
    .append("option")
    .attr("value", function (d) {
      return d;
    })
    .text(function (d) {
      return d;
    });
  //selection grab all the options, and then filter out those that aren't selected
  dropdown.on("change", function (d) {
    var selections = d3
      .select(this)
      .selectAll("option")
      .filter(function (d, i) {
        return this.selected;
      });

    var selectedCountryIDs = selections._groups[0].map(function (d) {
      return d.__data__;
    });

    updateFunction(selectedCountryIDs);
  });

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
  var mouseover = function (countrySalariesMean) {
    var countryName = countrySalariesMean.key;
    var meanSalary = countrySalariesMean.value;
    tooltip
      .html(
        "Country: " + countryName + "<br>" + "Mean Salary in USD: " + meanSalary
      )
      .style("opacity", 1);
  };
  var mousemove = function (d) {
    tooltip
      .style("left", d3.event.pageX + 10 + "px")
      .style("top", d3.event.pageY - 10 + "px");
  };
  var mouseleave = function (d) {
    tooltip.style("opacity", 0);
  };

  var updateFunction = function (selectedCountries = []) {
    var updatedData = countrySalariesMean;
    svgBarchart.selectAll("rect").remove();
    svgBarchart.selectAll("g").remove();
    if (selectedCountries.length !== 0) {
      updatedData = updatedData.filter(function (d) {
        // Check if string in array of strings
        return selectedCountries.includes(d.key);
      });
    }

    //Add x axis label
    svgBarchart
      .append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", width - 100)
      .attr("y", height / 2 + 50)
      .text("Country");

    //Add y axis label
    svgBarchart
      .append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("y", 6)
      .attr("dy", "-4.5em")
      .attr("transform", "rotate(-90)")
      .text("Mean-Salary in USD");

    // Add X axis
    xAxisBarChart
      .range([0, width / 1.125])
      .domain(
        updatedData.map(function (data) {
          return data.key;
        })
      )
      .padding(0.2);

    svgBarchart
      .append("g")
      .attr("transform", "translate(0," + height / 2 + ")")
      .call(d3.axisBottom(xAxisBarChart))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Add Y axis
    yAxisBarChart.domain([0, 160000]).range([height / 2, 0]);
    svgBarchart.append("g").call(d3.axisLeft(yAxisBarChart));

    // Add Bars
    svgBarchart
      .selectAll("mybar")
      .data(updatedData)
      .enter()
      .append("rect")
      .attr("x", function (updatedData) {
        return xAxisBarChart(updatedData.key);
      })
      .attr("y", function (updatedData) {
        return yAxisBarChart(updatedData.value);
      })
      .attr("width", xAxisBarChart.bandwidth())
      .attr("height", function (updatedData) {
        return height / 2 - yAxisBarChart(updatedData.value);
      })
      .attr("fill", "#69b3a2")
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);
  };

  updateFunction();
});
