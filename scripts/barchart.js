// set the dimensions and margins of the graph
var margin = { top: 30, right: 30, bottom: 70, left: 60 },
  width = 460 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select("#barchart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
  // ----------------
  // HELP with Filtering, I need selected countries AND their salary mean at the end to update the chart
  // ----------------
  //selection grab all the options, and then filter out those that aren't selected
  dropdown.on("change", function (d) {
    var selections = d3
      .select(this)
      .selectAll("option")
      .filter(function (d, i) {
        return this.selected;
      });
    console.log(selections);
  });

  // ----------------
  // Create a tooltip --> HELP: I need the tooltip to be directly right next to the bar
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
    .style("padding", "10px");

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

  // Add X axis
  var x = d3
    .scaleBand()
    .range([0, width])
    .domain(
      countrySalariesMean.map(function (data) {
        return data.key;
      })
    )
    .padding(0.2);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis
  var y = d3.scaleLinear().domain([0, 160000]).range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // Add Bars
  svg
    .selectAll("mybar")
    .data(countrySalariesMean)
    .enter()
    .append("rect")
    .attr("x", function (countrySalariesMean) {
      return x(countrySalariesMean.key);
    })
    .attr("y", function (countrySalariesMean) {
      return y(countrySalariesMean.value);
    })
    .attr("width", x.bandwidth())
    .attr("height", function (countrySalariesMean) {
      return height - y(countrySalariesMean.value);
    })
    .attr("fill", "#69b3a2")
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
});
