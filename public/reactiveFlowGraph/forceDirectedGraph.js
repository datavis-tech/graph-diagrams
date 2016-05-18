// A force directed graph visualization module.
define(["d3", "model", "lodash"], function (d3, Model, _) {

  // The constructor function, accepting default values.
  return function ForceDirectedGraph(defaults) {

    // Create a Model.
    // This will serve as the public API for the visualization.
    var model = Model({

          // Force directed layout parameters.
          charge: -200,
          linkDistance: 140,
          gravity: 0.03,

          // The color scale.
          color: d3.scale.ordinal()
            .domain(["property", "lambda"])
            .range(["#FFD1B5", "white"])
        }),
        force = d3.layout.force(),
        zoom = d3.behavior.zoom(),

        // The size of nodes and arrows
        nodeSize = 20,
        arrowWidth = 8;

    // Respond to zoom interactions.
    zoom.on("zoom", function (){
      model.scale = zoom.scale();
      model.translate = zoom.translate();
    });

    // Call onTick each frame of the force directed layout.
    force.on("tick", function(e) { onTick(e); })

    // This function gets reassigned later, each time new data loads.
    function onTick(){}

    // Stop propagation of drag events here so that both dragging nodes and panning are possible.
    // Draws from http://stackoverflow.com/questions/17953106/why-does-d3-js-v3-break-my-force-graph-when-implementing-zooming-when-v2-doesnt/17976205#17976205
    force.drag().on("dragstart", function () {
      d3.event.sourceEvent.stopPropagation();
    });

    // Fix node positions after the first time the user clicks and drags a node.
    force.drag().on("dragend", function (d) {

      // Stop the dragged node from moving.
      d.fixed = true;

      // Communicate this change to the outside world.
      serializeState();
    });


    // Create the SVG element from the container DOM element.
    model.when("container", function (container) {
      model.svg = d3.select(container).append("svg").call(zoom);
    });

    // Adjust the size of the SVG based on the `box` property.
    model.when(["svg", "box"], function (svg, box) {
      svg.attr("width", box.width).attr("height", box.height);
      force.size([box.width, box.height]);
    });

    // Create the SVG group that will contain the visualization.
    model.when("svg", function (svg) {
      model.g = svg.append("g");

      // Arrowhead setup.
      // Draws from Mobile Patent Suits example:
      // http://bl.ocks.org/mbostock/1153292
      svg.append("defs")
        .append("marker")
          .attr("id", "arrow")
          .attr("orient", "auto")
          .attr("preserveAspectRatio", "none")
          // See also http://www.w3.org/TR/SVG/coords.html#ViewBoxAttribute
          //.attr("viewBox", "0 -" + arrowWidth + " 10 " + (2 * arrowWidth))
          .attr("viewBox", "0 -5 10 10")
          // See also http://www.w3.org/TR/SVG/painting.html#MarkerElementRefXAttribute
          .attr("refX", 10)
          .attr("refY", 0)
          .attr("markerWidth", 10)
          .attr("markerHeight", arrowWidth)
        .append("path")
          .attr("d", "M0,-5L10,0L0,5");
    });

    // These 3 groups exist for control of Z-ordering.
    model.when("g", function (g) {
      model.nodeG = g.append("g");
      model.linkG = g.append("g");
      model.arrowG = g.append("g");
    });

    // Update the force layout with configured properties.
    model.when(["charge"], force.charge, force);
    model.when(["linkDistance"], force.linkDistance, force);
    model.when(["gravity"], force.gravity, force);

    // Update zoom scale and translation.
    model.when(["scale", "translate", "g"], function (scale, translate, g) {

      // In the case the scale and translate were set externally,
      if(zoom.scale() !== scale){

        // update the internal D3 zoom state.
        zoom.scale(scale);
        zoom.translate(translate);
      }

      // Transform the SVG group.
      g.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
    });

    // "state" represents the serialized state of the graph.
    model.when("state", function(state){

      // Extract the scale and translate.
      if(state.scale && model.scale !== state.scale){
        model.scale = state.scale;
      }
      if(state.translate && model.translate !== state.translate){
        model.translate = state.translate;
      }

      // Set the node and link data.
      var newData = _.cloneDeep(state);
      force.nodes(newData.nodes).links(newData.links).start();
      model.data = newData;
    });

    // Update the serialized state.
    model.when(["scale", "translate"], _.throttle(function(scale, translate){
      serializeState();
    }, 1000));

    // Sets model.state to expose the serialized state.
    function serializeState(){
      var data = model.data,
          scale = model.scale,
          translate = model.translate;
      model.state = {
        nodes: data.nodes.map(function(node){
          return {
            type: node.type,
            property: node.property,
            fixed: node.fixed,

            // Keep size of JSON small, so it fits in a URL.
            x: Math.round(node.x),
            y: Math.round(node.y)
          };
        }),
        links: data.links.map(function(link){
          // Replaced link object references with indices for serialization.
          return {
            source: link.source.index,
            target: link.target.index
          };
        }),
        scale: scale,
        translate: translate
      };
    }

    model.when(["data", "color", "nodeG", "linkG", "arrowG"],
        function(data, color, nodeG, linkG, arrowG){
      var node = nodeG.selectAll("g").data(data.nodes),
          nodeEnter = node.enter().append("g").call(force.drag);

      nodeEnter.append("rect").attr("class", "node")
        .attr("y", -nodeSize)
        .attr("height", nodeSize * 2)
        .attr("rx", nodeSize)
        .attr("ry", nodeSize);

      nodeEnter.append("text").attr("class", "nodeLabel");

      node.select("g text")

        // Use the property name for property nodes, and λ for lambda nodes.
        .text(function(d) {
          return (d.type === "property" ? d.property : "λ");
        })

        //Center text vertically.
        .attr("dy", function(d) {
          if(d.type === "lambda"){
            return "0.35em";
          } else {
            return "0.3em";
          }
        })

        // Compute rectancle sizes based on text labels.
        .each(function (d) {
          var circleWidth = nodeSize * 2,
              textLength = this.getComputedTextLength(),
              textWidth = textLength + nodeSize;

          if(circleWidth > textWidth) {
            d.isCircle = true;
            d.rectX = -nodeSize;
            d.rectWidth = circleWidth;
          } else {
            d.isCircle = false;
            d.rectX = -(textLength + nodeSize) / 2;
            d.rectWidth = textWidth;
            d.textLength = textLength;
          }
        });

      node.select("g rect")
        .attr("x", function(d) { return d.rectX; })
        .style("foo", function(d) { return "test"; })
        .attr("width", function(d) { return d.rectWidth; })
        .style("fill", function(d) { return color(d.type); });
      node.exit().remove();

      var link = linkG.selectAll(".link").data(data.links);
      link.enter().append("line").attr("class", "link")
      link.exit().remove();

      var arrow = arrowG.selectAll(".arrow").data(data.links);
      arrow.enter().append("line")
        .attr("class", "arrow")
        .attr("marker-end", function(d) { return "url(#arrow)" });
      arrow.exit().remove();

      // Run a modified version of force directed layout
      // to account for link direction going from left to right.
      onTick = function(e) {

        // Execute left-right constraints
        var k = 1 * e.alpha;
        force.links().forEach(function (link) {
          var a = link.source,
              b = link.target,
              dx = b.x - a.x,
              dy = b.y - a.y,
              d = Math.sqrt(dx * dx + dy * dy),
              x = (a.x + b.x) / 2;
          if(!a.fixed){
            a.x += k * (x - d / 2 - a.x);
          }
          if(!b.fixed){
            b.x += k * (x + d / 2 - b.x);
          }
        });
        force.nodes().forEach(function (d) {
          if(d.isCircle){
            d.leftX = d.rightX = d.x;
          } else {
            d.leftX =  d.x - d.textLength / 2 + nodeSize / 2;
            d.rightX = d.x + d.textLength / 2 - nodeSize / 2;
          }
        });

        link.call(edge);
        arrow.call(edge);

        node.attr("transform", function(d) {      
          return "translate(" + d.x + "," + d.y + ")";
        });
      };
    });

    // Sets the (x1, y1, x2, y2) line properties for graph edges.
    function edge(selection){
      selection
        .each(function (d) {
          var sourceX, targetX, dy, dy, angle;

          if( d.source.rightX < d.target.leftX ){
            sourceX = d.source.rightX;
            targetX = d.target.leftX;
          } else if( d.target.rightX < d.source.leftX ){
            targetX = d.target.rightX;
            sourceX = d.source.leftX;
          } else if (d.target.isCircle) {
            targetX = sourceX = d.target.x;
          } else if (d.source.isCircle) {
            targetX = sourceX = d.source.x;
          } else {
            targetX = sourceX = (d.source.x + d.target.x) / 2;
          }

          dx = targetX - sourceX;
          dy = d.target.y - d.source.y;
          angle = Math.atan2(dx, dy);

          d.sourceX = sourceX + Math.sin(angle) * nodeSize;
          d.targetX = targetX - Math.sin(angle) * nodeSize;
          d.sourceY = d.source.y + Math.cos(angle) * nodeSize;
          d.targetY = d.target.y - Math.cos(angle) * nodeSize;
        })
        .attr("x1", function(d) { return d.sourceX; })
        .attr("y1", function(d) { return d.sourceY; })
        .attr("x2", function(d) { return d.targetX; })
        .attr("y2", function(d) { return d.targetY; });
    }

    model.set(defaults);

    return model;
  };
});
