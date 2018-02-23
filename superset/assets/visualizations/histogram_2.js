import d3 from 'd3';
import { getColorFromScheme } from '../javascripts/modules/colors';

require('./histogram_2.css');

import nv from 'nvd3';

function histogram_2(slice, payload) {
  const div = d3.select(slice.selector);
  const draw = function (data, numBins, opacity) {

    // Set Margins
    const margin = {
      top: 50,
      right: 10,
      bottom: 20,
      left: 50,
    };
    const navBarHeight = 36;
    const navBarBuffer = 10;
    const width = slice.width() - margin.left - margin.right;
    const height = slice.height() - margin.top - margin.bottom - navBarHeight - navBarBuffer;

    // Set Histogram objects
    const formatNumber = d3.format(',.0f');
    const formatTicks = d3.format(',.00f');
    const x = d3.scale.linear();
    const y = d3.scale.linear();
    const xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .ticks(20)
    // .tickFormat(formatTicks);
    const yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .ticks(10);


    // set x-values
    let allData = [];
    data.forEach(d => {
      allData = allData.concat(d.values);
    })
    const min = Number(slice.formData.xmin) || d3.min(allData);
    const max = Number(slice.formData.xmax) || d3.max(allData);
    x.domain([min, max])
    .range([0, width], 0.1);

    // construct bins
    let bins = [];
    data.forEach((d, i) => {
      const color = getColorFromScheme(d.key, slice.formData.color_scheme);
      const b = d3.layout.histogram().bins(numBins[i])(d.values.filter(n => n>=min & n<=max));
      const width = 0.9*(d3.max(b.map(d => x(d.x)))-d3.min(b.map(d => x(d.x))))/numBins[i];
      bins = bins.concat(b.map(v => ({...v,
        color, width,key: d.key, opacity: opacity[i]
      })));
    });

    // Set the y-values
    y.domain([0, d3.max(bins, d => d.y)])
    .range([height, 0]);

    // Create the svg value with the bins
    const svg = div.selectAll('svg')
    .data([bins])
    .enter()
    .append('svg');

    // Make a rectangular background fill
    svg.append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', '#f6f6f6');

    // Transform the svg to make space for the margins
    const gEnter = svg
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr("class", "g-enter");

    // Add the bars and the x axis
    gEnter.append('g').attr('class', 'bars');
    gEnter.append('g').attr('class', 'x axis');

    // Add width and height to the svg
    svg.attr('width', slice.width())
    .attr('height', slice.height());

    // Create the bars in the svg
    const bar = svg.select('.bars').selectAll('.bar').data(bins);
    bar.enter().append('rect');
    bar.exit().remove();
    // Set the Height and Width for each bar
    const r = x.range()
    bar.attr('width', d => d.width)
    .attr("class", d => d.key)
    .attr('x', d => x(d.x))
    .attr('y', d => y(d.y))
    .attr('height', d => y.range()[0] - y(d.y))
    .style('fill', d => d.color)
    .style('fill-opacity', d => d.opacity)
    .order();

    // Update the x-axis
    svg.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(' + margin.left + ',' + (height + margin.top) + ')')
    .text('values')
    .call(xAxis);

    // Update the Y Axis and add minor lines
    svg.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .text('count')
    .call(yAxis)
    .selectAll('g')
    .filter(function (d) { return d; })
    .classed('minor', true);

    // legend dispatcher
    const dispatch = d3.dispatch('legend_clicked');
    dispatch.on("legend_clicked", clicked => {
      const bars = d3.selectAll("."+clicked)
        .filter("rect");
      const prev = bars.style("fill-opacity");
      bars.style("fill-opacity", d => prev==0 ? d.opacity : 0);
    })

    // make legend
    const legend = nv.models.legend()
      .color(d => getColorFromScheme(d.key, slice.formData.color_scheme));
    const duration = 250,
          keys = data.map(d => d.key);
    const g_legend = gEnter.append('g').attr('class', 'nv-legendWrap');
    legend.width(width);
    g_legend.datum(data)
      .call(legend);
    g_legend.selectAll(".nv-legend-symbol")
      .data(keys)
      .attr("class", d => d)
      .style("opacity", opacity)
      .on("click", function() {
        const elem = d3.select(this)
        dispatch.legend_clicked(elem.attr("class"));
        elem.style("fill-opacity", 1-elem.style("fill-opacity"));
      });
    g_legend.attr('transform', 'translate(0,' + (-margin.top) +')');

  };

  function parseEntry(entry, numSeries) {
    console.log(entry)
    const parsed = JSON.parse("["+entry+"]")
    if (parsed.length==1) {
      return d3.range(numSeries).map(d => parsed[0]);
    } else {
      return parsed;
    };
  };

  const numSeries = payload.data.length;
  const numBins = parseEntry(slice.formData.link_length, numSeries);
  const opacity = parseEntry(slice.formData.global_opacity, numSeries);
  div.selectAll('*').remove();
  
  draw(payload.data, numBins, opacity);
    
}

module.exports = histogram_2;
