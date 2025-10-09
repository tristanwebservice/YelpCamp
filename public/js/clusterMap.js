maptilersdk.config.apiKey = maptilerApiKey;

const map = new maptilersdk.Map({
  container: "map",
  style: maptilersdk.MapStyle.BRIGHT,
  center: [-103.59179687498357, 40.66995747013945],
  zoom: 3,
});

map.on("load", function () {
  map.addSource("campgrounds", {
    type: "geojson",
    data: campgrounds,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
  });

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "campgrounds",
    filter: ["has", "point_count"],
    paint: {
      // Use step expressions (https://docs.maptiler.com/gl-style-specification/expressions/#step)
      // with three steps to implement three types of circles:
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#00BCD4",
        10,
        "#2196F3",
        30,
        "#3F51B5",
      ],
      "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25],
    },
  });

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "campgrounds",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
  });

  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "campgrounds",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 4,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });

  // Create an invisible layer with larger circles for better click detection
  map.addLayer({
    id: "unclustered-point-large",
    type: "circle",
    source: "campgrounds",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "rgba(0,0,0,0)",
      "circle-radius": 10, // Larger invisible circle for easier clicking
      "circle-stroke-width": 0,
    },
  });

  // Create an invisible layer with larger circles for clusters
  map.addLayer({
    id: "clusters-large",
    type: "circle",
    source: "campgrounds",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "rgba(0,0,0,0)",
      "circle-radius": [
        "step",
        ["get", "point_count"],
        25, // Larger invisible circle for clusters
        10,
        30,
        30,
        35,
      ],
    },
  });

  // inspect a cluster on click - using the larger invisible layer
  map.on("click", "clusters-large", async (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["clusters", "clusters-large"],
    });

    if (features.length > 0) {
      const clusterFeature = features.find(
        (f) => f.properties.cluster_id !== undefined
      );
      if (clusterFeature) {
        const clusterId = clusterFeature.properties.cluster_id;
        const zoom = await map
          .getSource("campgrounds")
          .getClusterExpansionZoom(clusterId);
        map.easeTo({
          center: clusterFeature.geometry.coordinates,
          zoom,
        });
      }
    }
  });

  // When a click event occurs on a feature in the unclustered-point layer
  map.on("click", "unclustered-point-large", function (e) {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["unclustered-point", "unclustered-point-large"],
    });

    if (features.length > 0) {
      const pointFeature = features.find(
        (f) => f.layer.id === "unclustered-point" || f.properties.popUpMarkup
      );
      if (pointFeature && pointFeature.properties.popUpMarkup) {
        const { popUpMarkup } = pointFeature.properties;
        const coordinates = pointFeature.geometry.coordinates.slice();

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new maptilersdk.Popup()
          .setLngLat(coordinates)
          .setHTML(popUpMarkup)
          .addTo(map);
      }
    }
  });

  // Change cursor to pointer when hovering over clickable areas
  map.on("mouseenter", ["clusters-large", "unclustered-point-large"], () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", ["clusters-large", "unclustered-point-large"], () => {
    map.getCanvas().style.cursor = "";
  });
});
