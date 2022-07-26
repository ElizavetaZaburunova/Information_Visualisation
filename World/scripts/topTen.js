// set the dimensions and margins of the graph
var margin = { top: 20, right: 30, bottom: 40, left: 90 },
  width = 460 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select("#topTen")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
d3.csv("./data/salaries.csv", function (csv_data) {
  //get mean salary for country
  var countrySalariesMean = d3
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
  //sort data by salary and get the top 10
  var topTenData = countrySalariesMean
    .sort((a, b) => {
      return b.value - a.value;
    })
    .slice(0, 10);

  console.log(topTenData);

  // Add Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "myTooltip")
    .style("opacity", 0);

  // Add X axis
  var x = d3.scaleLinear().domain([0, 160000]).range([0, width]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Y axis
  var y = d3
    .scaleBand()
    .range([0, height])
    .domain(
      topTenData.map(function (d) {
        return d.key;
      })
    )
    .padding(0.1);
  svg.append("g").call(d3.axisLeft(y));

  //Bars
  svg
    .selectAll("myRect")
    .data(topTenData)
    .enter()
    .append("rect")
    .attr("x", x(0))
    .attr("y", function (d) {
      return y(d.key);
    })
    .attr("width", function (d) {
      return x(d.value);
    })
    .attr("height", y.bandwidth())
    .attr("fill", "#69b3a2")
    .on("mouseover", onMouseOver)
    .on("mouseout", onMouseOut);
});

//Tooltip function
function onMouseOver(d) {
  var tooltipDiv = d3.select("#myTooltip");

  tooltipDiv.transition().duration(200).style("opacity", 1);

  tooltipDiv
    .html("your Content")
    .style("left", parseFloat(widthScale(d)) + "px") // I dont have widthScale
    .style("cursor", "pointer")
    .style("top", function (d) {
      return d3.event.pageY - this.offsetHeight - 17 + "px";
    })
    .style("color", "#333333");
}

function onMouseOut(d) {
  var tooltipDiv = d3.select("#myTooltip");
  tooltipDiv.transition().duration(500).style("opacity", 0);
}
