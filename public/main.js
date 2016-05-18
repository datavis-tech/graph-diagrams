require(["d3", "forceDirectedGraph", "lodash"], function (d3, ForceDirectedGraph, lodash) {

  // Initialize the force directed graph.
  var container = d3.select("#container").node(),
      forceDirectedGraph = ForceDirectedGraph({ container: container });

  // Initialize zoom based on client size.
  var scale = container.clientWidth * 1 / 800;
  forceDirectedGraph.scale = scale;
  forceDirectedGraph.translate = [
    container.clientWidth / 2 * (1 - scale),
    container.clientHeight / 2 * (1 - scale)
  ];
  

  // Set up default data.
  if(!location.hash){
    location.hash = '{"nodes":[{"type":"lambda","fixed":0,"x":442,"y":250},{"type":"property","property":"firstName","fixed":1,"x":290,"y":212},{"type":"property","property":"lastName","fixed":1,"x":293,"y":294},{"type":"property","property":"fullName","fixed":0,"x":581,"y":247}],"links":[{"source":1,"target":0},{"source":2,"target":0},{"source":0,"target":3}],"scale":1.938287710980903,"translate":[-360.71751731834274,-241.583180104211]}';
  }

  // Update the fragment identifier in response to user interactions.
  forceDirectedGraph.when(["state"], function(state){
    location.hash = JSON.stringify(state);
    console.log(JSON.stringify(state));
  });
  
  // Sets the data on the graph visualization from the fragment identifier.
  // See https://github.com/curran/screencasts/blob/gh-pages/navigation/examples/code/snapshot11/main.js
  function navigate(){
    if(location.hash){
      var newState = JSON.parse(location.hash.substr(1));
      if(JSON.stringify(newState) !== JSON.stringify(forceDirectedGraph.state)){
        forceDirectedGraph.state = newState;
      }
    }
  }

  // Navigate once to the initial hash value.
  navigate();
  
  // Navigate whenever the fragment identifier value changes.
  window.addEventListener("hashchange", navigate);

  // Sets the `box` model property
  // based on the size of the container,
  function computeBox(){
    forceDirectedGraph.box = {
      width: container.clientWidth,
      height: container.clientHeight
    };
  }

  // once to initialize `model.box`, and
  computeBox();

  // whenever the browser window resizes in the future.
  window.addEventListener("resize", computeBox);
  
});
