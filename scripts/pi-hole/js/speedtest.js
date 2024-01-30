/* global Chart:false, moment:false */

function getGraphType(speedtest = 0) {
  // Only return line if `barchart_chkbox` is explicitly set to false. Else return bar
  if (!speedtest) {
    return localStorage?.getItem("barchart_chkbox") === "false" ? "line" : "bar";
  }

  return localStorage?.getItem("speedtest_chart_type") || "line";
}

function getCSSval(cssclass, cssproperty) {
  var elem = $("<div class='" + cssclass + "'></div>"),
    val = elem.appendTo("body").css(cssproperty);
  elem.remove();
  return val;
}

var speedChart = null;
var speedlabels = [];
var downloadspeed = [];
var uploadspeed = [];
var serverPing = [];
function createChart() {
  var gridColor = getCSSval("graphs-grid", "background-color");
  var ticksColor = getCSSval("graphs-ticks", "color");
  var speedChartctx = document.getElementById("speedOverTimeChart")?.getContext("2d");
  if (speedChartctx === null || speedChartctx === undefined) return;
  speedChart = new Chart(speedChartctx, {
    type: getGraphType(1),
    data: {
      labels: speedlabels,
      datasets: [
        {
          label: "Mbps Download",
          data: downloadspeed,
          backgroundColor: "rgba(0, 123, 255, 0.5)",
          borderColor: "rgba(0, 123, 255, 1)",
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
          yAxisID: "y-axis-1",
        },
        {
          label: "Mbps Upload",
          data: uploadspeed,
          backgroundColor: "rgba(40, 167, 69, 0.5)",
          borderColor: "rgba(40, 167, 69, 1)",
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
          yAxisID: "y-axis-1",
        },
        {
          label: "ms Ping",
          data: serverPing,
          backgroundColor: "rgba(108, 117, 125, 0.5)",
          borderColor: "rgba(108, 117, 125, 1)",
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
          yAxisID: "y-axis-2",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest",
        axis: "x",
      },
      plugins: {
        legend: {
          display: false,
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          mode: "index",
          intersect: getGraphType(1) === "bar",
          yAlign: "bottom",
          callbacks: {
            label: function (context) {
              return (
                Math.round(context?.parsed?.y ?? 0) + " " + (context?.dataset?.label ?? "") || null
              );
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
          },
          ticks: {
            color: ticksColor,
          },
        },
        "y-axis-1": {
          type: "linear",
          position: "left",
          grid: {
            color: gridColor,
          },
          ticks: {
            color: ticksColor,
          },
        },
        "y-axis-2": {
          type: "linear",
          position: "right",
        },
      },
    },
  });
}

function formatDate(itemdate, results) {
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    return moment(itemdate, "YYYY-MM-DD HH:mm:ss Z")
      .utcOffset(moment().utcOffset())
      .format("HH:mm");
  }

  let output = "HH:mm";
  if (results.length > 1) {
    const first = moment(results[0].start_time, "YYYY-MM-DD HH:mm:ss Z");
    const last = moment(results.at(-1).start_time, "YYYY-MM-DD HH:mm:ss Z");
    if (last.diff(first, "hours") >= 24) output = "Do " + output;
  }

  return moment(itemdate).utcOffset(moment().utcOffset()).format(output);
}

function updateSpeedTestData() {
  const days = localStorage?.getItem("speedtest_days") || -1;
  speedlabels = [];
  downloadspeed = [];
  uploadspeed = [];
  serverPing = [];

  $.ajax({
    url: "api.php?getSpeedData=" + days,
    dataType: "json",
  }).done(function (results) {
    results.forEach(function (packet) {
      // console.log(speedlabels.indexOf(formatDate(packet.start_time)));
      if (speedlabels.indexOf(formatDate(packet.start_time, results)) === -1) {
        speedlabels.push(formatDate(packet.start_time, results));
        uploadspeed.push(parseFloat(packet.upload));
        downloadspeed.push(parseFloat(packet.download));
        serverPing.push(parseFloat(packet.server_ping));
      }
    });
    if (speedChart && !days) speedChart.update();
    else createChart(speedlabels);
  });
}

$(function () {
  updateSpeedTestData();
  setInterval(function () {
    updateSpeedTestData();
  }, 6000);
});
