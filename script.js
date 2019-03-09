function firstfunction() {
  var tmp = document.getElementById("mainsvg");
  var stream, newaudio, analyser, width = document.body.clientWidth, dx, dy,
    height = document.body.clientHeight, audioSRC;
  var audioCTX = new (window.AudioContext || window.webkitAudioContest)();
  var audio = document.getElementById("audiofile");


  if (audio) {
    audio.value = "";
  }
  audio.addEventListener("change", function (event) {
    var divs = document.getElementById("titleholder");
    divs.style.display = "none";
    stream = URL.createObjectURL(event.target.files[0]);
    newaudio = new Audio();
    newaudio.crossOrigin = "anonymous";
    newaudio.src = stream;
    newaudio.addEventListener('canplay', function () {
      audioSRC = audioCTX.createMediaElementSource(newaudio);
      analyser = audioCTX.createAnalyser();
      audioSRC.connect(analyser);
      audioSRC.connect(audioCTX.destination);
      newaudio.play();
      callfirst();
    });

  });

  function callfirst() {


    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    /*
    Code below and up until renderChart() is from http://bl.ocks.org/mbostock/76342abc327062128604.
    */
    var barPadding = '1';

    radius = 30;

    var sampler = poissonDiscSampler(width + radius * 2, height + radius * 2, radius),
      samples = [],
      sample;

    while (sample = sampler()) samples.push([sample[0] - radius, sample[1] - radius]);

    var voronoi = d3.geom.voronoi()
      .clipExtent([[-1, -1], [width + 1, height + 1]]);

    var svg = d3.select("svg");

    svg.selectAll("path")
      .data(voronoi.triangles(samples).map(d3.geom.polygon))
      .enter().append("path")
      .attr("d", function (d) { return "M" + d.join("L") + "Z"; })
      .style("fill", function (d) { return color(d.centroid()); })
      //.style("fill-opacity",0.8)
      .style("stroke", function (d) { return color(d.centroid()); })
      .style("display", "none");


    function color(d) {
      dx = d[0] - width / 2,
        dy = d[1] - height / 2;
      return d3.lab(80 - (dx * dx + dy * dy) / 5000, dx / 7, dy / 7);
    }

    // Based on https://www.jasondavies.com/poisson-disc/
    function poissonDiscSampler(width, height, radius) {
      var k = 30, // maximum number of samples before rejection
        radius2 = radius * radius,
        R = 3 * radius2,
        cellSize = radius * Math.SQRT1_2,
        gridWidth = Math.ceil(width / cellSize),
        gridHeight = Math.ceil(height / cellSize),
        grid = new Array(gridWidth * gridHeight),
        queue = [],
        queueSize = 0,
        sampleSize = 0;

      return function () {
        if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

        // Pick a random existing sample and remove it from the queue.
        while (queueSize) {
          var i = Math.random() * queueSize | 0,
            s = queue[i];

          // Make a new candidate between [radius, 2 * radius] from the existing sample.
          for (var j = 0; j < k; ++j) {
            var a = 2 * Math.PI * Math.random(),
              r = Math.sqrt(Math.random() * R + radius2),
              x = s[0] + r * Math.cos(a),
              y = s[1] + r * Math.sin(a);

            // Reject candidates that are outside the allowed extent,
            // or closer than 2 * radius to any existing sample.
            if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
          }

          queue[i] = queue[--queueSize];
          queue.length = queueSize;
        }
      };

      function far(x, y) {
        var i = x / cellSize | 0,
          j = y / cellSize | 0,
          i0 = Math.max(i - 2, 0),
          j0 = Math.max(j - 2, 0),
          i1 = Math.min(i + 3, gridWidth),
          j1 = Math.min(j + 3, gridHeight);

        for (j = j0; j < j1; ++j) {
          var o = j * gridWidth;
          for (i = i0; i < i1; ++i) {
            if (s = grid[o + i]) {
              var s,
                dx = s[0] - x,
                dy = s[1] - y;
              if (dx * dx + dy * dy < radius2) return false;
            }
          }
        }

        return true;
      }

      function sample(x, y) {
        var s = [x, y];
        queue.push(s);
        grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
        ++sampleSize;
        ++queueSize;
        return s;
      }
    }

    function renderChart() {
      requestAnimationFrame(renderChart);
      // Copy frequency data to frequencyData array.
      analyser.getByteFrequencyData(frequencyData);
      // Update d3 chart with new data.
      svg.selectAll('path')
        .data(frequencyData)
        .style("display", "block")
        //.attr("fill", function(d){return d*0.01})
        .attr("fill-opacity", function (d) {
          return d * 0.012
        })
        .attr("stroke-opacity", function (d) {
          return d * 0.012
        });


    }


    renderChart();



  }

}
