import { writeFile } from "node:fs/promises";
import { URL, URLSearchParams } from "node:url";

const OUTPUT_FILE = new URL("../src/data/offline-map.geojson", import.meta.url);
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const BBOX = {
  south: 47.18,
  west: 8.37,
  north: 47.43,
  east: 8.91
};

const query = `
[out:json][timeout:90];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["highway"="unclassified"]["name"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["railway"~"^(rail|tram|light_rail)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["waterway"~"^(river|canal)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["waterway"="stream"]["name"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["natural"~"^(wood|water|wetland)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["landuse"="forest"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["leisure"~"^(park|nature_reserve)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["place"~"^(city|town|village|suburb|hamlet)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["railway"~"^(station|halt)$"]["name"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom qt;
`;

const response = await fetch(OVERPASS_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "User-Agent": "ZueriFish offline map data builder"
  },
  body: new URLSearchParams({ data: query })
});

if (!response.ok) {
  throw new Error(`Overpass request failed: ${response.status} ${response.statusText}`);
}

const overpass = await response.json();
const features = overpass.elements.flatMap(toFeature).sort(compareFeatures);
const featureCollection = {
  type: "FeatureCollection",
  name: "zuerifish-offline-osm-basemap",
  source: "OpenStreetMap contributors via Overpass API",
  license: "Open Database License (ODbL)",
  bbox: [BBOX.west, BBOX.south, BBOX.east, BBOX.north],
  generatedAt: new Date().toISOString(),
  features
};

await writeFile(OUTPUT_FILE, `${JSON.stringify(featureCollection)}\n`, "utf8");
console.log(`Wrote ${features.length} offline map features to ${OUTPUT_FILE.pathname}`);

function toFeature(element) {
  const tags = element.tags ?? {};

  if (element.type === "node") {
    return toPointFeature(element, tags);
  }

  if (element.type !== "way" || !Array.isArray(element.geometry) || element.geometry.length < 2) {
    return [];
  }

  const coordinates = simplifyRing(element.geometry.map((point) => [roundCoordinate(point.lon), roundCoordinate(point.lat)]), getTolerance(tags));
  const category = getCategory(tags);

  if (!category || coordinates.length < 2) {
    return [];
  }

  const polygon = isPolygon(tags, coordinates);

  if (!shouldKeepFeature(tags, category, coordinates, polygon)) {
    return [];
  }

  const geometry = polygon
    ? {
        type: "Polygon",
        coordinates: [closeRing(coordinates)]
      }
    : {
        type: "LineString",
        coordinates
      };

  return [
    {
      type: "Feature",
      properties: {
        id: `osm-${element.type}-${element.id}`,
        category,
        kind: getKind(tags),
        name: normalizeName(tags.name),
        minZoom: getMinZoom(tags, category),
        layer: getLayer(tags, category),
        source: "OpenStreetMap"
      },
      geometry
    }
  ];
}

function toPointFeature(element, tags) {
  const category = tags.place ? "place" : "station";
  const name = normalizeName(tags.name);

  if (!name || !Number.isFinite(element.lon) || !Number.isFinite(element.lat)) {
    return [];
  }

  return [
    {
      type: "Feature",
      properties: {
        id: `osm-${element.type}-${element.id}`,
        category,
        kind: getKind(tags),
        name,
        minZoom: getMinZoom(tags, category),
        layer: getLayer(tags, category),
        source: "OpenStreetMap"
      },
      geometry: {
        type: "Point",
        coordinates: [roundCoordinate(element.lon), roundCoordinate(element.lat)]
      }
    }
  ];
}

function getCategory(tags) {
  if (tags.highway) {
    return isMinorPath(tags.highway) ? "path" : "road";
  }

  if (tags.railway) {
    return "rail";
  }

  if (tags.waterway) {
    return "waterway";
  }

  if (tags.natural === "water") {
    return "water";
  }

  if (tags.natural === "wood" || tags.landuse === "forest") {
    return "forest";
  }

  if (tags.natural === "wetland") {
    return "wetland";
  }

  if (tags.landuse || tags.leisure) {
    return "land";
  }

  return null;
}

function getKind(tags) {
  return tags.highway ?? tags.railway ?? tags.waterway ?? tags.natural ?? tags.landuse ?? tags.leisure ?? tags.place ?? "unknown";
}

function getLayer(tags, category) {
  if (category === "place" || category === "station") {
    return "label";
  }

  if (category === "road" || category === "path" || category === "rail" || category === "waterway") {
    return "line";
  }

  return "area";
}

function getMinZoom(tags, category) {
  if (category === "place") {
    return (
      {
        city: 8,
        town: 9,
        village: 10,
        suburb: 12,
        hamlet: 13
      }[tags.place] ?? 11
    );
  }

  if (category === "station") {
    return 12;
  }

  if (category === "road") {
    return (
      {
        motorway: 8,
        trunk: 8,
        primary: 9,
        secondary: 10,
        tertiary: 11,
        unclassified: 12,
        residential: 13,
        living_street: 13,
        service: 14
      }[tags.highway] ?? 13
    );
  }

  if (category === "path") {
    return tags.highway === "track" ? 12 : 13;
  }

  if (category === "rail" || category === "waterway") {
    return 10;
  }

  return 9;
}

function getTolerance(tags) {
  if (tags.highway === "motorway" || tags.highway === "trunk" || tags.highway === "primary") {
    return 0.000025;
  }

  if (tags.highway || tags.railway || tags.waterway) {
    return 0.000045;
  }

  return 0.00009;
}

function shouldKeepFeature(tags, category, coordinates, polygon) {
  if (category === "road") {
    if (["motorway", "trunk", "primary", "secondary", "tertiary"].includes(tags.highway)) {
      return true;
    }

    return Boolean(tags.name) && lineLength(coordinates) >= 0.005;
  }

  if (category === "rail") {
    return lineLength(coordinates) >= 0.002;
  }

  if (category === "waterway") {
    return tags.waterway !== "stream" || (Boolean(tags.name) && lineLength(coordinates) >= 0.0025);
  }

  if (!polygon) {
    return true;
  }

  const area = polygonArea(coordinates);

  if (category === "forest") {
    return area >= 0.000015 || Boolean(tags.name);
  }

  if (category === "water" || category === "wetland") {
    return area >= 0.000012 || Boolean(tags.name);
  }

  if (category === "land") {
    return area >= 0.000006 || Boolean(tags.name);
  }

  return true;
}

function lineLength(coordinates) {
  let length = 0;

  for (let i = 1; i < coordinates.length; i += 1) {
    length += Math.hypot(coordinates[i][0] - coordinates[i - 1][0], coordinates[i][1] - coordinates[i - 1][1]);
  }

  return length;
}

function polygonArea(coordinates) {
  let area = 0;

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    area += coordinates[i][0] * coordinates[i + 1][1] - coordinates[i + 1][0] * coordinates[i][1];
  }

  return Math.abs(area / 2);
}

function isPolygon(tags, coordinates) {
  return Boolean(tags.natural || tags.landuse || tags.leisure) && coordinates.length >= 4 && areSameCoordinate(coordinates[0], coordinates.at(-1));
}

function isMinorPath(highway) {
  return ["track", "path", "footway", "cycleway", "bridleway", "pedestrian"].includes(highway);
}

function simplifyRing(points, tolerance) {
  if (points.length <= 2) {
    return points;
  }

  const simplified = simplifyDouglasPeucker(points, tolerance);
  return simplified.length >= 2 ? simplified : [points[0], points.at(-1)];
}

function simplifyDouglasPeucker(points, tolerance) {
  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i += 1) {
    const distance = perpendicularDistance(points[i], points[0], points[end]);

    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance <= tolerance) {
    return [points[0], points[end]];
  }

  const left = simplifyDouglasPeucker(points.slice(0, index + 1), tolerance);
  const right = simplifyDouglasPeucker(points.slice(index), tolerance);
  return left.slice(0, -1).concat(right);
}

function perpendicularDistance(point, start, end) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / Math.hypot(dx, dy);
}

function closeRing(coordinates) {
  if (areSameCoordinate(coordinates[0], coordinates.at(-1))) {
    return coordinates;
  }

  return [...coordinates, coordinates[0]];
}

function areSameCoordinate(left, right) {
  return Boolean(left && right && left[0] === right[0] && left[1] === right[1]);
}

function roundCoordinate(value) {
  return Number(value.toFixed(6));
}

function normalizeName(name) {
  return typeof name === "string" && name.trim() ? name.trim() : undefined;
}

function compareFeatures(left, right) {
  const layerOrder = { area: 0, line: 1, label: 2 };
  const categoryOrder = {
    land: 0,
    forest: 1,
    wetland: 2,
    water: 3,
    waterway: 4,
    rail: 5,
    road: 6,
    path: 7,
    place: 8,
    station: 9
  };

  return (
    (layerOrder[left.properties.layer] ?? 10) - (layerOrder[right.properties.layer] ?? 10) ||
    (categoryOrder[left.properties.category] ?? 10) - (categoryOrder[right.properties.category] ?? 10) ||
    left.properties.minZoom - right.properties.minZoom ||
    left.properties.id.localeCompare(right.properties.id)
  );
}
