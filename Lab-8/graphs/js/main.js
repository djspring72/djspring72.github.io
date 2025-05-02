/* The contents of miserables.json */
d3.json('data/miserables.json').then(data => {
    const forceDirectedGraph = new ForceDirectedGraph({ parentElement: '#force-directed-graph'}, data);
  })
  .catch(error => console.error(error));