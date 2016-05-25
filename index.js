function outputGraph(graph, project, name){
  var filename = "../graph-diagrams/public/graphs/" + project + "_" + name + ".json";
  var data = JSON.stringify(graph.serialize(), null, 2);
  fs.writeFile(filename, data);
}

module.exports = {
  outputGraph: outputGraph
};
