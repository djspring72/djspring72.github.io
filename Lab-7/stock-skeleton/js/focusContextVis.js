class FocusContextVis {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      width: 800,
      height: 240,
      contextHeight: 50,
      margin: { top: 10, right: 10, bottom: 100, left: 45 },
      contextMargin: { top: 280, right: 10, bottom: 20, left: 45 }
    };
    this.data = _data;
    this.initVis();
  }

  initVis() {
    let vis = this;

    const containerWidth = vis.config.width + vis.config.margin.left + vis.config.margin.right;
    const containerHeight = vis.config.height + vis.config.margin.top + vis.config.margin.bottom;

    vis.xScaleFocus = d3.scaleTime().range([0, vis.config.width]);
    vis.xScaleContext = d3.scaleTime().range([0, vis.config.width]);
    vis.yScaleFocus = d3.scaleLinear().range([vis.config.height, 0]).nice();
    vis.yScaleContext = d3.scaleLinear().range([vis.config.contextHeight, 0]).nice();

    vis.xAxisFocus = d3.axisBottom(vis.xScaleFocus).tickSizeOuter(0);
    vis.xAxisContext = d3.axisBottom(vis.xScaleContext).tickSizeOuter(0);
    vis.yAxisFocus = d3.axisLeft(vis.yScaleFocus);

    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    vis.focus = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.focus.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', vis.config.width)
      .attr('height', vis.config.height);

    vis.focusLinePath = vis.focus.append('path')
      .attr('class', 'chart-line');

    vis.xAxisFocusG = vis.focus.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.config.height})`);

    vis.yAxisFocusG = vis.focus.append('g')
      .attr('class', 'axis y-axis');

    vis.tooltipTrackingArea = vis.focus.append('rect')
      .attr('width', vis.config.width)
      .attr('height', vis.config.height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    vis.tooltip = vis.focus.append('g')
      .attr('class', 'tooltip')
      .style('display', 'none');

    vis.tooltip.append('circle').attr('r', 4);
    vis.tooltip.append('text');

    vis.context = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.contextMargin.left},${vis.config.contextMargin.top})`);

    vis.contextAreaPath = vis.context.append('path')
      .attr('class', 'chart-area');

    vis.xAxisContextG = vis.context.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.config.contextHeight})`);

    vis.brushG = vis.context.append('g')
      .attr('class', 'brush x-brush');

    // Initialize brush component
    vis.brush = d3.brushX()
      .extent([[0, 0], [vis.config.width, vis.config.contextHeight]])
      .on('brush', ({ selection }) => vis.brushed(selection))
      .on('end', ({ selection }) => {
        if (!selection) vis.brushed(null);
      });
  }

  updateVis() {
    let vis = this;

    vis.xValue = d => d.date;
    vis.yValue = d => d.close;

    vis.line = d3.line()
      .x(d => vis.xScaleFocus(vis.xValue(d)))
      .y(d => vis.yScaleFocus(vis.yValue(d)));

    vis.area = d3.area()
      .x(d => vis.xScaleContext(vis.xValue(d)))
      .y1(d => vis.yScaleContext(vis.yValue(d)))
      .y0(vis.config.contextHeight);

    vis.xScaleFocus.domain(d3.extent(vis.data, vis.xValue));
    vis.yScaleFocus.domain(d3.extent(vis.data, vis.yValue));
    vis.xScaleContext.domain(vis.xScaleFocus.domain());
    vis.yScaleContext.domain(vis.yScaleFocus.domain());

    vis.bisectDate = d3.bisector(vis.xValue).left;

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    vis.focusLinePath.datum(vis.data).attr('d', vis.line);
    vis.contextAreaPath.datum(vis.data).attr('d', vis.area);

    vis.tooltipTrackingArea
      .on('mouseenter', () => vis.tooltip.style('display', 'block'))
      .on('mouseleave', () => vis.tooltip.style('display', 'none'))
      .on('mousemove', function (event) {
        const xPos = d3.pointer(event, this)[0];
        const date = vis.xScaleFocus.invert(xPos);

        const index = vis.bisectDate(vis.data, date, 1);
        const a = vis.data[index - 1];
        const b = vis.data[index];
        const d = b && (date - a.date > b.date - date) ? b : a;

        vis.tooltip.select('circle')
          .attr('transform', `translate(${vis.xScaleFocus(d.date)},${vis.yScaleFocus(d.close)})`);

        vis.tooltip.select('text')
          .attr('transform', `translate(${vis.xScaleFocus(d.date)},${vis.yScaleFocus(d.close) - 15})`)
          .text(Math.round(d.close));
      });

    vis.xAxisFocusG.call(vis.xAxisFocus);
    vis.yAxisFocusG.call(vis.yAxisFocus);
    vis.xAxisContextG.call(vis.xAxisContext);

    const defaultBrushSelection = [
      vis.xScaleFocus(new Date('2019-01-01')),
      vis.xScaleContext.range()[1]
    ];
    vis.brushG
      .call(vis.brush)
      .call(vis.brush.move, defaultBrushSelection);
  }

  brushed(selection) {
    let vis = this;

    if (selection) {
      const selectedDomain = selection.map(vis.xScaleContext.invert, vis.xScaleContext);
      vis.xScaleFocus.domain(selectedDomain);
    } else {
      vis.xScaleFocus.domain(vis.xScaleContext.domain());
    }

    vis.focusLinePath.attr('d', vis.line);
    vis.xAxisFocusG.call(vis.xAxisFocus);
  }
}
