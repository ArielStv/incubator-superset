import d3 from 'd3';
import { getColorFromScheme } from '../javascripts/modules/colors';

require('./histogram.css');

function histogram(slice, payload) {
  const div = d3.select(slice.selector);
  const draw = function (data, numBins, normalized, xAxisLabel) {
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

    // set number of ticks
    const maxTicks = 20;
    const numTicks = d3.min([maxTicks, numBins]);

    // Set Histogram objects
    const x = d3.scale.linear();
    const y = d3.scale.linear();
    const xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .ticks(numTicks, 's');
    const yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .ticks(numTicks, 's');

    // Set the x-values
    const max = d3.max(data, d => d3.max(d.values));
    const min = d3.min(data, d => d3.min(d.values));
    x.domain([min, max])
    .range([0, width], 0.1);

    // Calculate bins for the data
    let bins = [];
    data.forEach(d => {
      let b = d3.layout.histogram().bins(numBins)(d.values);
      const color = getColorFromScheme(d.key, slice.formData.color_scheme);
      const w = d3.max([(x(b[0].dx) - x(0)) - 1, 0]);
      const key = d.key;
      // normalize if necessary
      if (normalized) {
        const total = d.values.length;
        b = b.map(d => ({ ...d, y: d.y / total }));
      }
      bins = bins.concat(b.map(v => ({ ...v, color, width: w, key })));
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
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

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
    bar.attr('width', d => d.width)
    .attr('x', d => x(d.x))
    .attr('y', d => y(d.y))
    .attr('height', d => y.range()[0] - y(d.y))
    .style('fill', d => d.color)
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

    // add title if passed
    if (xAxisLabel) {
      svg.append('text')
        .attr('transform',
              'translate(' + (width / 2) + ' ,' +
                             (height + margin.top + 50) + ')')
        .style('text-anchor', 'middle')
        .text(xAxisLabel);
    }
  };

  const numBins = Number(slice.formData.link_length) || 10;
  const normalized = slice.formData.normalized;
  const xAxisLabel = slice.formData.x_axis_label;
  div.selectAll('*').remove();
  draw(payload.data, numBins, normalized, xAxisLabel);
}

module.exports = histogram;
