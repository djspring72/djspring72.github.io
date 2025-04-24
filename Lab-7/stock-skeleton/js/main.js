// Helper function to parse date strings
const parseTime = d3.timeParse('%Y-%m-%d');

let data, focusContextVis;

/**
 * Load and preprocess data, then initialize chart
 */
d3.csv('data/sp_500_index.csv').then(_data => {
  _data.forEach(d => {
    d.date = parseTime(d.date);      // Convert date string to Date object
    d.close = +d.close;              // Convert close price to float
  });

  data = _data;

  // Initialize and render the Focus + Context visualization
  focusContextVis = new FocusContextVis({ parentElement: '#chart' }, data);
  focusContextVis.updateVis();
}).catch(error => {
  console.error('Error loading the data:', error);
});
