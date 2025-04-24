let data, scatterplot, barchart;
let difficultyFilter = [];

// Initialize the dispatcher for inter-view communication
const dispatcher = d3.dispatch('filterCategories');

d3.csv('data/vancouver_trails.csv')
  .then(_data => {
    data = _data;

    // Ensure the data is correctly formatted
    data.forEach(d => {
      d.distance = +d.distance;
      d.time = +d.time;
      d.difficulty = d.difficulty.trim().toLowerCase();
    });

    const colorScale = d3.scaleOrdinal()
      .domain(['easy', 'intermediate', 'difficult'])
      .range(['#a1d99b', 'green', 'darkgreen']);

    // Initialize Scatterplot
    scatterplot = new Scatterplot({
      parentElement: '#scatterplot',
      colorScale: colorScale
    }, data);

    scatterplot.updateVis();

    barchart = new Barchart({
      parentElement: '#barchart',
      colorScale: colorScale
    }, dispatcher, data);  
    barchart.updateVis();
  })
  .catch(error => console.error(error));

// Event listener for filtering data based on categories selected in the barchart
dispatcher.on('filterCategories', selectedCategories => {
  console.log(selectedCategories);  // Debugging line to check selected categories
  if (selectedCategories.length === 0) {
    scatterplot.data = data;  // No filters applied
  } else {
    scatterplot.data = data.filter(d =>
      selectedCategories.includes(d.difficulty)
    );  // Filter data based on selected categories
  }
  scatterplot.updateVis();  // Update the scatter plot with filtered data
});