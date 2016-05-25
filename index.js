// This module is a utility for writing graph files
// from within the unit tests of other projects.
var fs = require("fs");
module.exports = function (options){
  return function (graph, name){
    if(options.outputGraphs){
      var filename = [
        "../graph-diagrams/public/graphs/",
        options.project,
        "_",
        name,
        ".json"
      ].join("");
      var data = JSON.stringify(graph.serialize(), null, 2);
      fs.writeFile(filename, data);
    }
  };
};
