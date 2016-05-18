var express = require("express");
var app = express();

app.use(express.static("public"));

// Writes the metadata for the graph with the given name.
app.post("/write/:graphName", function (req, res) {

  // Write the data to public/graphs/{{graphName}}-meta.json
  // * pan
  // * zoom
  // * fixedNodes: id ->
  //   * x: int
  //   * y: int

  res.send("Success!");
});

app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});
