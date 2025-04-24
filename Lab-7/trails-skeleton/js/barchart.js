class Barchart {

  constructor(_config, _dispatcher, _data) {
    this.config = {
      parentElement: _config.parentElement,
      colorScale: _config.colorScale,
      containerWidth: _config.containerWidth || 260,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 40},
    };
    this.dispatcher = _dispatcher; // Store the dispatcher
    this.data = _data;
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.xScale = d3.scaleBand()
        .range([0, vis.width])
        .paddingInner(0.2);

    vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSizeOuter(0)
        .tickFormat(d => d.charAt(0).toUpperCase() + d.slice(1));

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSizeOuter(0);

    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);

    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    vis.svg.append('text')
        .attr('class', 'axis-title')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '.71em')
        .text('Trails');
  }

  updateVis() {
    let vis = this;

    const aggregatedDataMap = d3.rollups(vis.data, v => v.length, d => d.difficulty);
    vis.aggregatedData = Array.from(aggregatedDataMap, ([key, count]) => ({ key, count }));

    const orderedKeys = ['easy', 'intermediate', 'difficult'];
    vis.aggregatedData = vis.aggregatedData.sort((a,b) => {
      return orderedKeys.indexOf(a.key) - orderedKeys.indexOf(b.key);
    });

    vis.colorValue = d => d.key;
    vis.xValue = d => d.key;
    vis.yValue = d => d.count;

    vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
    vis.yScale.domain([0, d3.max(vis.aggregatedData, vis.yValue)]);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Add bar
    const bars = vis.chart.selectAll('.bar')
      .data(vis.aggregatedData, d => d.key)
      .join('rect')
        .attr('class', 'bar')
        .attr('x', d => vis.xScale(vis.xValue(d)))
        .attr('y', d => vis.yScale(vis.yValue(d)))
        .attr('width', vis.xScale.bandwidth())
        .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
        .attr('fill', d => vis.config.colorScale(vis.colorValue(d)))
        .on('click', function(event, d) {
          // Toggle the "active" class on the clicked bar
          const isActive = d3.select(this).classed('active');
          d3.select(this).classed('active', !isActive);

          // Get the names of all active categories
          const selectedCategories = vis.chart.selectAll('.bar.active').data().map(k => k.key);
          
          // Call the dispatcher with the selected categories
          vis.dispatcher.call('filterCategories', event, selectedCategories);
        });

    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}