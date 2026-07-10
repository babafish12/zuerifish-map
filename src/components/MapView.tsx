import { ChevronDown, Eye, EyeOff, Layers, LoaderCircle, LocateFixed, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fishingRestrictionZones, lakePolygons, lakes } from "../lib/data";
import { loadOfflineMap } from "../lib/offlineMapData";
import { getOfflineDisplayMinZoom } from "../lib/offlineMapDisplay";
import { getRestrictionPeriodStatus } from "../lib/restrictionPeriodStatus";
import type { FeatureCollection } from "geojson";
import type { FishingRestrictionFeature, Lake, LakeFeature, LakeId, OfflineMapFeature } from "../types";
import type { RestrictionPeriodStatus } from "../lib/restrictionPeriodStatus";

interface MapViewProps {
  selectedLakeId: LakeId | null;
  onSelectLake: (lakeId: LakeId) => void;
}

type LakeLayer = {
  id: LakeId;
  name: string;
  lake: Lake;
  polygon: L.Polygon | null;
  marker: L.CircleMarker | null;
  labelMarker: L.Marker;
  bounds: L.LatLngBounds;
};

type RestrictionLayer = {
  id: string;
  lakeId: LakeId;
  name: string;
  polygon: L.Polygon;
};

type OfflineBaseMapLayerGroup = {
  features: OfflineMapFeature[];
  layer: L.GeoJSON | null;
  minZoom: number;
};

type BaseMapId = "offline" | "klar" | "natur" | "satellit";

type TileLayerConfig = {
  url: string;
  attribution: string;
  className: string;
  maxNativeZoom?: number;
  minZoom?: number;
};

type BaseMapOption = {
  id: BaseMapId;
  label: string;
  description: string;
  base?: TileLayerConfig;
  labels?: TileLayerConfig;
};

type StoredMapPreferences = {
  selectedBaseMapId: BaseMapId;
  showRestrictionZones: boolean;
};

type LocationStatus = "idle" | "locating" | "found" | "unsupported" | "denied" | "unavailable" | "timeout" | "error";
type LakeLabelDisplay = "compact" | "overview" | "standard" | "detail";

type UserLocation = {
  lat: number;
  lng: number;
  accuracy: number | null;
};

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors';
const CARTO_ATTRIBUTION = `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions" rel="noopener noreferrer">CARTO</a>`;
const ESRI_ATTRIBUTION = 'Tiles &copy; <a href="https://www.esri.com/" rel="noopener noreferrer">Esri</a>';
const LOCAL_MAP_ATTRIBUTION = "Offline-Karte: lokale OpenStreetMap-Vektordaten";
const MAP_PREFERENCES_STORAGE_KEY = "zuerifish:map-preferences";
const DEFAULT_MAP_PREFERENCES: StoredMapPreferences = {
  selectedBaseMapId: "offline",
  showRestrictionZones: true
};
const TILE_LOAD_FALLBACK_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#e6efe7"/><path d="M0 192 C48 174 84 210 128 192 C172 174 208 210 256 192 L256 256 L0 256 Z" fill="#d7e7da"/><path d="M0 98 C48 82 86 114 128 98 C170 82 208 114 256 98" fill="none" stroke="#c6d9d2" stroke-width="4" opacity=".8"/></svg>'
)}`;

const OFFLINE_AREA_PANE = "offline-map-areas";
const OFFLINE_LINE_PANE = "offline-map-lines";
const OFFLINE_LABEL_PANE = "offline-map-labels";
const LAKE_PANE = "lake-polygons";
const RESTRICTION_PANE = "fishing-restrictions";
const USER_LOCATION_PANE = "user-location";
const BASEMAP_LABEL_MIN_ZOOM = 13;
const SWITZERLAND_BOUNDS = L.latLngBounds([45.75, 5.74], [47.95, 10.66]);
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 60_000,
  timeout: 12_000
};
const GEOLOCATION_ERROR_CODES = {
  permissionDenied: 1,
  positionUnavailable: 2,
  timeout: 3
} as const;

const BASEMAP_OPTIONS: BaseMapOption[] = [
  {
    id: "offline",
    label: "Offline",
    description: "lokal"
  },
  {
    id: "klar",
    label: "Klar",
    description: "online",
    base: {
      url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      attribution: CARTO_ATTRIBUTION,
      className: "map-tiles-clear",
      maxNativeZoom: 20
    },
    labels: {
      url: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      attribution: CARTO_ATTRIBUTION,
      className: "map-tiles-labels",
      maxNativeZoom: 20,
      minZoom: BASEMAP_LABEL_MIN_ZOOM
    }
  },
  {
    id: "natur",
    label: "Natur",
    description: "online",
    base: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
      attribution: CARTO_ATTRIBUTION,
      className: "map-tiles-natural",
      maxNativeZoom: 20
    },
    labels: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
      attribution: CARTO_ATTRIBUTION,
      className: "map-tiles-labels",
      maxNativeZoom: 20,
      minZoom: BASEMAP_LABEL_MIN_ZOOM
    }
  },
  {
    id: "satellit",
    label: "Satellit",
    description: "online",
    base: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: ESRI_ATTRIBUTION,
      className: "map-tiles-satellite",
      maxNativeZoom: 19
    },
    labels: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      attribution: ESRI_ATTRIBUTION,
      className: "map-tiles-labels",
      maxNativeZoom: 19,
      minZoom: BASEMAP_LABEL_MIN_ZOOM
    }
  }
];

const BASE_STYLE: L.PathOptions = {
  color: "#0369a1",
  fillColor: "#38bdf8",
  fillOpacity: 0.42,
  opacity: 1,
  pane: LAKE_PANE,
  weight: 3.5
};

const SELECTED_STYLE: L.PathOptions = {
  color: "#075985",
  fillColor: "#0ea5e9",
  fillOpacity: 0.56,
  opacity: 1,
  pane: LAKE_PANE,
  weight: 6
};

const LAKE_MARKER_STYLE: L.CircleMarkerOptions = {
  className: "lake-point-marker",
  color: "#0369a1",
  fillColor: "#38bdf8",
  fillOpacity: 0.56,
  opacity: 1,
  pane: LAKE_PANE,
  radius: 7,
  weight: 2.5
};

const SELECTED_LAKE_MARKER_STYLE: L.CircleMarkerOptions = {
  className: "lake-point-marker selected",
  color: "#075985",
  fillColor: "#0ea5e9",
  fillOpacity: 1,
  opacity: 1,
  pane: LAKE_PANE,
  radius: 10,
  weight: 4
};

const ACTIVE_RESTRICTION_STYLE: L.PathOptions = {
  color: "#dc2626",
  fillColor: "#ef4444",
  fillOpacity: 0.18,
  opacity: 0.98,
  pane: RESTRICTION_PANE,
  weight: 2.5
};

const INACTIVE_RESTRICTION_STYLE: L.PathOptions = {
  color: "#be123c",
  dashArray: "6 5",
  fillColor: "#fb7185",
  fillOpacity: 0.16,
  opacity: 0.88,
  pane: RESTRICTION_PANE,
  weight: 2.2
};

const USER_LOCATION_MARKER_STYLE: L.CircleMarkerOptions = {
  className: "user-location-marker",
  color: "#0b6f82",
  fillColor: "#ffffff",
  fillOpacity: 1,
  opacity: 1,
  pane: USER_LOCATION_PANE,
  radius: 8,
  weight: 4
};

const USER_LOCATION_ACCURACY_STYLE: L.CircleMarkerOptions = {
  className: "user-location-accuracy",
  color: "#0b6f82",
  fillColor: "#5bc0eb",
  fillOpacity: 0.14,
  opacity: 0.46,
  pane: USER_LOCATION_PANE,
  weight: 2
};

const RESTRICTION_ZONE_ORDER: Record<string, number> = {
  "Seeschutzzone VC": 0,
  "Seeschutzzone VA": 1,
  "Seeschutzzone VB": 2,
  "100-m-Radius Bachmündung": 3
};

const ROAD_WEIGHT_BY_KIND: Record<string, number> = {
  motorway: 3.8,
  trunk: 3.6,
  primary: 3.3,
  secondary: 2.8,
  tertiary: 2.35,
  unclassified: 1.65,
  residential: 1.45,
  living_street: 1.3
};

const polygonFeatureByLakeId = new Map(lakePolygons.features.map((feature) => [feature.properties.id, feature]));

function toLeafletPoint([lng, lat]: [number, number]): L.LatLngTuple {
  return [lat, lng];
}

function toLeafletLatLngs(feature: LakeFeature): L.LatLngExpression[][] | L.LatLngExpression[][][] {
  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates.map((ring) => ring.map(toLeafletPoint));
  }

  return feature.geometry.coordinates.map((polygon) => polygon.map((ring) => ring.map(toLeafletPoint)));
}

function toRestrictionLatLngs(feature: FishingRestrictionFeature): L.LatLngExpression[][] | L.LatLngExpression[][][] {
  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng])) as L.LatLngExpression[][];
  }

  return feature.geometry.coordinates.map((polygon) => polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng]))) as L.LatLngExpression[][][];
}

function getRestrictionStyle(feature: FishingRestrictionFeature): L.PathOptions {
  return getRestrictionPeriodStatus(feature.properties.period).tone === "active" ? ACTIVE_RESTRICTION_STYLE : INACTIVE_RESTRICTION_STYLE;
}

function createLakeLabelIcon(id: LakeId, name: string, isSelected: boolean, display: LakeLabelDisplay): L.DivIcon {
  const hasVisibleLabel = display !== "compact" || isSelected;
  const button = document.createElement("button");
  button.type = "button";
  button.className = [
    "lake-label-control",
    `lake-label-${hasVisibleLabel ? display : "compact"}`,
    hasVisibleLabel ? "labeled" : "compact",
    isSelected ? "selected" : ""
  ]
    .filter(Boolean)
    .join(" ");
  button.dataset.lakeId = id;
  button.textContent = hasVisibleLabel ? name : "";
  button.title = name;
  button.setAttribute("aria-label", `${name} öffnen`);
  button.setAttribute("aria-pressed", String(isSelected));

  return L.divIcon({
    className: "lake-label-marker",
    html: button,
    iconAnchor: [0, 0],
    iconSize: [0, 0]
  });
}

function createRestrictionTooltipContent(feature: FishingRestrictionFeature, status: RestrictionPeriodStatus): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = `restriction-tooltip-card ${status.tone}`;

  const zone = document.createElement("span");
  zone.className = "restriction-tooltip-zone";
  zone.textContent = feature.properties.zone;

  const title = document.createElement("strong");
  title.className = "restriction-tooltip-title";
  title.textContent = feature.properties.name;

  const rule = document.createElement("span");
  rule.className = "restriction-tooltip-rule";
  rule.textContent = feature.properties.rule;

  const meta = document.createElement("span");
  meta.className = "restriction-tooltip-meta";
  meta.textContent = `${feature.properties.period} · ${status.label}`;

  wrapper.append(zone, title, rule, meta);
  return wrapper;
}

function getLakeLabelDisplay(lake: Lake, zoom: number, isSelected: boolean): LakeLabelDisplay {
  if (isSelected) {
    return "detail";
  }

  const area = lake.areaKm2 ?? 0;
  const rank = lake.rank ?? Number.POSITIVE_INFINITY;

  if (lake.detailLevel === "full") {
    return zoom <= 8 ? "overview" : "standard";
  }

  if (zoom <= 8) {
    return area >= 30 || rank <= 10 ? "overview" : "compact";
  }

  if (zoom === 9) {
    return area >= 8 || rank <= 22 ? "standard" : "compact";
  }

  if (zoom === 10) {
    return area >= 3 || rank <= 35 ? "standard" : "compact";
  }

  return "detail";
}

function getLakeMarkerRadius(lake: Lake, isSelected: boolean): number {
  const baseRadius = Math.max(6, Math.min(17, 4.5 + Math.sqrt(lake.areaKm2 ?? 2) * 0.55));
  return isSelected ? baseRadius + 3 : baseRadius;
}

function getLakeMarkerStyle(lake: Lake, isSelected: boolean): L.CircleMarkerOptions {
  return {
    ...(isSelected ? SELECTED_LAKE_MARKER_STYLE : LAKE_MARKER_STYLE),
    radius: getLakeMarkerRadius(lake, isSelected)
  };
}

function applyLakeMarkerStyle(marker: L.CircleMarker, lake: Lake, isSelected: boolean, radiusOffset = 0) {
  const radius = getLakeMarkerRadius(lake, isSelected) + radiusOffset;
  const style = {
    ...getLakeMarkerStyle(lake, isSelected),
    radius
  };
  const projectedMarker = marker as L.CircleMarker & { _point?: L.Point };

  Object.assign(marker.options, style);

  if (!projectedMarker._point) {
    return;
  }

  marker.setStyle(style);
  marker.setRadius(radius);
}

function bringPathToFront(path: L.Path) {
  const renderedPath = path as L.Path & { _path?: SVGElement };

  if (renderedPath._path?.parentNode) {
    path.bringToFront();
  }
}

function getMarkerBounds(lake: Lake, center: L.LatLng): L.LatLngBounds {
  const radiusMeters = Math.max(1600, Math.min(22_000, Math.sqrt(lake.areaKm2 ?? 1) * 1700));
  return center.toBounds(radiusMeters);
}

function createLakeLayer(lake: Lake, feature: LakeFeature | undefined): LakeLayer {
  const polygon = feature ? L.polygon(toLeafletLatLngs(feature), { ...BASE_STYLE, className: `lake-polygon lake-polygon-${lake.id}` }) : null;
  const center = polygon?.getBounds().getCenter() ?? (lake.center ? L.latLng(lake.center.lat, lake.center.lng) : SWITZERLAND_BOUNDS.getCenter());
  const marker = polygon ? null : L.circleMarker(center, getLakeMarkerStyle(lake, false));

  return {
    id: lake.id,
    name: lake.name,
    lake,
    polygon,
    marker,
    labelMarker: L.marker(center, {
      icon: createLakeLabelIcon(lake.id, lake.name, false, getLakeLabelDisplay(lake, 8, false)),
      interactive: true,
      keyboard: false,
      zIndexOffset: 500
    }),
    bounds: polygon?.getBounds() ?? getMarkerBounds(lake, center)
  };
}

function createRestrictionLayer(feature: FishingRestrictionFeature): RestrictionLayer {
  const status = getRestrictionPeriodStatus(feature.properties.period);
  const polygon = L.polygon(toRestrictionLatLngs(feature), getRestrictionStyle(feature)).bindTooltip(createRestrictionTooltipContent(feature, status), {
    className: `restriction-tooltip ${status.tone}`,
    direction: "top",
    opacity: 1,
    sticky: true
  });

  return {
    id: feature.properties.id,
    lakeId: feature.properties.lakeId,
    name: feature.properties.name,
    polygon
  };
}

function compareRestrictionFeatures(left: FishingRestrictionFeature, right: FishingRestrictionFeature): number {
  return (RESTRICTION_ZONE_ORDER[left.properties.zone] ?? 10) - (RESTRICTION_ZONE_ORDER[right.properties.zone] ?? 10);
}

function createOfflineLabelIcon(feature: OfflineMapFeature): L.DivIcon {
  const label = document.createElement("span");
  label.className = `offline-map-label ${feature.properties.category} ${feature.properties.kind}`;
  label.textContent = feature.properties.name ?? "";

  return L.divIcon({
    className: "offline-map-label-marker",
    html: label,
    iconAnchor: [0, 0],
    iconSize: [0, 0]
  });
}

function createOfflineBaseMapLayerGroups(offlineFeatures: OfflineMapFeature[]): OfflineBaseMapLayerGroup[] {
  const featuresByZoom = offlineFeatures.reduce<Map<number, OfflineMapFeature[]>>((groups, feature) => {
    const minZoom = getOfflineDisplayMinZoom(feature);
    const features = groups.get(minZoom) ?? [];
    features.push(feature);
    groups.set(minZoom, features);
    return groups;
  }, new Map<number, OfflineMapFeature[]>());

  return [...featuresByZoom.entries()]
    .sort(([leftZoom], [rightZoom]) => leftZoom - rightZoom)
    .map(([minZoom, features]) => ({
      features,
      layer: null,
      minZoom
    }));
}

function createOfflineGeoJsonLayer(features: OfflineMapFeature[]): L.GeoJSON {
  return L.geoJSON(
    {
      type: "FeatureCollection",
      features
    } as FeatureCollection,
    {
      interactive: false,
      pointToLayer: (feature, latLng) =>
        L.marker(latLng, {
          icon: createOfflineLabelIcon(feature as OfflineMapFeature),
          interactive: false,
          keyboard: false,
          pane: OFFLINE_LABEL_PANE
        }),
      style: (feature) => getOfflineFeatureStyle(feature as OfflineMapFeature)
    }
  );
}

function getOfflineBaseMapLayer(group: OfflineBaseMapLayerGroup): L.GeoJSON {
  if (!group.layer) {
    group.layer = createOfflineGeoJsonLayer(group.features);
  }

  return group.layer;
}

function syncOfflineBaseMapLayerGroups(map: L.Map, groups: OfflineBaseMapLayerGroup[], isVisible: boolean) {
  const size = map.getSize();

  if (!isVisible || size.x === 0 || size.y === 0) {
    removeOfflineBaseMapLayerGroups(groups);
    return;
  }

  const zoom = map.getZoom();

  groups.forEach((group) => {
    const shouldShow = zoom >= group.minZoom;
    const layer = shouldShow ? getOfflineBaseMapLayer(group) : group.layer;

    if (!layer) {
      return;
    }

    if (shouldShow && !map.hasLayer(layer)) {
      layer.addTo(map);
    } else if (!shouldShow && map.hasLayer(layer)) {
      layer.removeFrom(map);
    }
  });
}

function removeOfflineBaseMapLayerGroups(groups: OfflineBaseMapLayerGroup[]) {
  groups.forEach((group) => group.layer?.remove());
}

function getOfflineFeatureStyle(feature: OfflineMapFeature): L.PathOptions {
  const { category, kind } = feature.properties;

  if (category === "forest") {
    return {
      className: "offline-map-feature offline-area offline-forest",
      color: "#9bcf9e",
      fillColor: "#cde7c5",
      fillOpacity: 0.48,
      opacity: 0.34,
      pane: OFFLINE_AREA_PANE,
      weight: 1
    };
  }

  if (category === "land") {
    return {
      className: "offline-map-feature offline-area offline-land",
      color: "#c8d7b2",
      fillColor: "#e2ecd2",
      fillOpacity: 0.42,
      opacity: 0.3,
      pane: OFFLINE_AREA_PANE,
      weight: 1
    };
  }

  if (category === "wetland") {
    return {
      className: "offline-map-feature offline-area offline-wetland",
      color: "#93c9bd",
      dashArray: "4 4",
      fillColor: "#cfeee4",
      fillOpacity: 0.42,
      opacity: 0.42,
      pane: OFFLINE_AREA_PANE,
      weight: 1
    };
  }

  if (category === "water") {
    return {
      className: "offline-map-feature offline-area offline-water",
      color: "#7db8d0",
      fillColor: "#b7ddec",
      fillOpacity: 0.48,
      opacity: 0.5,
      pane: OFFLINE_AREA_PANE,
      weight: 1
    };
  }

  if (category === "waterway") {
    return {
      className: "offline-map-feature offline-line offline-waterway",
      color: "#64a8c7",
      opacity: kind === "river" || kind === "canal" ? 0.72 : 0.54,
      pane: OFFLINE_LINE_PANE,
      weight: kind === "river" || kind === "canal" ? 2.1 : 1.25
    };
  }

  if (category === "rail") {
    return {
      className: "offline-map-feature offline-line offline-rail",
      color: "#7f8792",
      dashArray: "7 5",
      opacity: 0.58,
      pane: OFFLINE_LINE_PANE,
      weight: kind === "rail" ? 1.7 : 1.2
    };
  }

  if (category === "road") {
    return {
      className: `offline-map-feature offline-line offline-road offline-road-${kind}`,
      color: getRoadColor(kind),
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.72,
      pane: OFFLINE_LINE_PANE,
      weight: ROAD_WEIGHT_BY_KIND[kind] ?? 1.4
    };
  }

  return {
    className: "offline-map-feature offline-line offline-path",
    color: "#9f8e78",
    dashArray: "3 5",
    opacity: 0.52,
    pane: OFFLINE_LINE_PANE,
    weight: 1.1
  };
}

function getRoadColor(kind: string): string {
  if (kind === "motorway" || kind === "trunk") {
    return "#d98a5b";
  }

  if (kind === "primary" || kind === "secondary") {
    return "#d9a84f";
  }

  if (kind === "tertiary") {
    return "#c4b26c";
  }

  return "#ffffff";
}

function getBaseMapOption(id: BaseMapId): BaseMapOption {
  return BASEMAP_OPTIONS.find((option) => option.id === id) ?? BASEMAP_OPTIONS[0];
}

function isBaseMapId(value: unknown): value is BaseMapId {
  return typeof value === "string" && BASEMAP_OPTIONS.some((option) => option.id === value);
}

function readStoredMapPreferences(): StoredMapPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_MAP_PREFERENCES;
  }

  try {
    const rawPreferences = window.localStorage.getItem(MAP_PREFERENCES_STORAGE_KEY);

    if (!rawPreferences) {
      return DEFAULT_MAP_PREFERENCES;
    }

    const parsed = JSON.parse(rawPreferences) as Partial<StoredMapPreferences>;

    return {
      selectedBaseMapId: isBaseMapId(parsed.selectedBaseMapId) ? parsed.selectedBaseMapId : DEFAULT_MAP_PREFERENCES.selectedBaseMapId,
      showRestrictionZones:
        typeof parsed.showRestrictionZones === "boolean" ? parsed.showRestrictionZones : DEFAULT_MAP_PREFERENCES.showRestrictionZones
    };
  } catch {
    return DEFAULT_MAP_PREFERENCES;
  }
}

function writeStoredMapPreferences(preferences: StoredMapPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MAP_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Browsers can deny storage in private or locked-down contexts. The map still works without persistence.
  }
}

function createTileLayer(config: TileLayerConfig, zIndex: number): L.TileLayer {
  return L.tileLayer(config.url, {
    attribution: config.attribution,
    bounds: SWITZERLAND_BOUNDS,
    className: config.className,
    errorTileUrl: TILE_LOAD_FALLBACK_URL,
    keepBuffer: 4,
    maxNativeZoom: config.maxNativeZoom ?? 19,
    maxZoom: 19,
    minZoom: config.minZoom ?? 8,
    noWrap: true,
    updateWhenIdle: true
  }).setZIndex(zIndex);
}

function fitBoundsWhenSized(map: L.Map, bounds: L.LatLngBounds, options: L.FitBoundsOptions, fallbackZoom: number) {
  const size = map.getSize();

  if (size.x > 0 && size.y > 0) {
    map.fitBounds(bounds, options);
    return;
  }

  map.setView(bounds.getCenter(), fallbackZoom, { animate: false });
}

function syncLakeLayerStyles(map: L.Map, layers: Record<LakeId, LakeLayer>, selectedLakeId: LakeId | null) {
  const zoom = map.getZoom();

  Object.values(layers).forEach((layer) => {
    const isSelected = selectedLakeId === layer.id;

    layer.polygon?.setStyle(isSelected ? SELECTED_STYLE : BASE_STYLE);
    if (layer.marker) {
      applyLakeMarkerStyle(layer.marker, layer.lake, isSelected);
    }
    layer.labelMarker.setIcon(createLakeLabelIcon(layer.id, layer.name, isSelected, getLakeLabelDisplay(layer.lake, zoom, isSelected)));
    layer.labelMarker.setZIndexOffset(isSelected ? 900 : 500);

    if (isSelected) {
      if (layer.polygon) {
        bringPathToFront(layer.polygon);
      }

      if (layer.marker) {
        bringPathToFront(layer.marker);
      }
    }
  });
}

function formatAccuracy(accuracyMeters: number): string {
  if (accuracyMeters >= 1000) {
    return `${(accuracyMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(accuracyMeters)} m`;
}

function getLocationError(error: GeolocationPositionError): { status: LocationStatus; message: string } {
  switch (error.code) {
    case GEOLOCATION_ERROR_CODES.permissionDenied:
      return {
        status: "denied",
        message: "Standortfreigabe wurde abgelehnt."
      };
    case GEOLOCATION_ERROR_CODES.positionUnavailable:
      return {
        status: "unavailable",
        message: "Standort konnte nicht ermittelt werden."
      };
    case GEOLOCATION_ERROR_CODES.timeout:
      return {
        status: "timeout",
        message: "Standortsuche dauerte zu lange."
      };
    default:
      return {
        status: "error",
        message: "Standortsuche fehlgeschlagen."
      };
  }
}

export function MapView({ selectedLakeId, onSelectLake }: MapViewProps) {
  const [mapPreferences, setMapPreferences] = useState<StoredMapPreferences>(readStoredMapPreferences);
  const [isMapSwitcherOpen, setIsMapSwitcherOpen] = useState(false);
  const [lakeQuery, setLakeQuery] = useState("");
  const [offlineFeatures, setOfflineFeatures] = useState<OfflineMapFeature[] | null>(null);
  const [offlineMapStatus, setOfflineMapStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelTileLayerRef = useRef<L.TileLayer | null>(null);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const userLocationAccuracyRef = useRef<L.Circle | null>(null);
  const layerRefs = useRef<Record<LakeId, LakeLayer> | null>(null);
  const selectedLakeIdRef = useRef<LakeId | null>(selectedLakeId);

  const offlineBaseMapLayerGroups = useMemo(() => createOfflineBaseMapLayerGroups(offlineFeatures ?? []), [offlineFeatures]);
  const lakeLayers = useMemo(() => lakes.map((lake) => createLakeLayer(lake, polygonFeatureByLakeId.get(lake.id))), []);
  const restrictionLayers = useMemo(() => [...fishingRestrictionZones.features].sort(compareRestrictionFeatures).map(createRestrictionLayer), []);
  const lakeSearchResults = useMemo(() => {
    const normalizedQuery = lakeQuery
      .toLocaleLowerCase("de-CH")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    if (!normalizedQuery) {
      return [];
    }

    return lakes
      .filter((lake) =>
        `${lake.name} ${lake.canton}`
          .toLocaleLowerCase("de-CH")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(normalizedQuery)
      )
      .slice(0, 5);
  }, [lakeQuery]);
  const { selectedBaseMapId, showRestrictionZones } = mapPreferences;
  const selectedBaseMapOption = getBaseMapOption(selectedBaseMapId);
  const RestrictionToggleIcon = showRestrictionZones ? EyeOff : Eye;
  const isLocating = locationStatus === "locating";
  const locationButtonText = isLocating ? "Sucht..." : userLocation ? "Aktualisieren" : "Standort";
  const locationButtonLabel = isLocating ? "Standort wird gesucht" : userLocation ? "Standort erneut suchen" : "Standort anzeigen";
  const mapSwitcherToggleLabel = isMapSwitcherOpen
    ? "Kartenauswahl schliessen"
    : `Kartenauswahl öffnen, aktuell ${selectedBaseMapOption.label}`;

  useEffect(() => {
    writeStoredMapPreferences(mapPreferences);
  }, [mapPreferences]);

  useEffect(() => {
    if (selectedBaseMapId !== "offline" || offlineFeatures) {
      return;
    }

    const controller = new AbortController();
    setOfflineMapStatus("loading");

    loadOfflineMap(controller.signal)
      .then((offlineMap) => {
        setOfflineFeatures(offlineMap.features);
        setOfflineMapStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setOfflineMapStatus("error");
      });

    return () => controller.abort();
  }, [offlineFeatures, selectedBaseMapId]);

  useEffect(() => {
    selectedLakeIdRef.current = selectedLakeId;
  }, [selectedLakeId]);

  const handleSelectLake = useCallback(
    (lakeId: LakeId) => {
      onSelectLake(lakeId);

      const map = mapRef.current;
      const layer = layerRefs.current?.[lakeId];

      if (map && layer) {
        fitBoundsWhenSized(map, layer.bounds, { maxZoom: layer.polygon ? 12 : 11, padding: [92, 92] }, layer.polygon ? 12 : 10);
      }
    },
    [onSelectLake]
  );

  const selectLakeWithoutZoom = useCallback(
    (lakeId: LakeId) => {
      onSelectLake(lakeId);
    },
    [onSelectLake]
  );

  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      setLocationMessage("Standort wird von diesem Browser nicht unterstützt.");
      return;
    }

    setLocationStatus("locating");
    setLocationMessage("Standort wird gesucht...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;
        const nextLocation = {
          accuracy,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setUserLocation(nextLocation);
        setLocationStatus("found");
        setLocationMessage(accuracy ? `Standort gefunden (±${formatAccuracy(accuracy)})` : "Standort gefunden.");
      },
      (error) => {
        const nextError = getLocationError(error);
        setLocationStatus(nextError.status);
        setLocationMessage(nextError.message);
      },
      GEOLOCATION_OPTIONS
    );
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!mapContainerRef.current || map) {
      return;
    }

    const nextMap = L.map(mapContainerRef.current, {
      attributionControl: true,
      maxBounds: SWITZERLAND_BOUNDS,
      maxBoundsViscosity: 1,
      minZoom: 8,
      doubleClickZoom: false,
      scrollWheelZoom: true,
      worldCopyJump: false,
      zoomControl: false
    });

    mapRef.current = nextMap;
    nextMap.createPane(OFFLINE_AREA_PANE).style.zIndex = "130";
    nextMap.createPane(OFFLINE_LINE_PANE).style.zIndex = "170";
    nextMap.createPane(OFFLINE_LABEL_PANE).style.zIndex = "300";
    nextMap.createPane(LAKE_PANE).style.zIndex = "430";
    nextMap.createPane(RESTRICTION_PANE).style.zIndex = "470";
    nextMap.createPane(USER_LOCATION_PANE).style.zIndex = "650";
    layerRefs.current = lakeLayers.reduce<Record<LakeId, LakeLayer>>((layers, layer) => {
      layers[layer.id] = layer;
      return layers;
    }, {} as Record<LakeId, LakeLayer>);

    lakeLayers.forEach((layer) => {
      if (layer.polygon) {
        layer.polygon
          .addTo(nextMap)
          .on("click", () => selectLakeWithoutZoom(layer.id))
          .on("mouseover", () => layer.polygon?.setStyle({ weight: selectedLakeIdRef.current === layer.id ? 6 : 5 }))
          .on("mouseout", () => layer.polygon?.setStyle(selectedLakeIdRef.current === layer.id ? SELECTED_STYLE : BASE_STYLE));
      }

      if (layer.marker) {
        layer.marker
          .addTo(nextMap)
          .on("click", () => selectLakeWithoutZoom(layer.id))
          .on("mouseover", () => {
            const isSelected = selectedLakeIdRef.current === layer.id;
            if (layer.marker) {
              applyLakeMarkerStyle(layer.marker, layer.lake, isSelected, isSelected ? 0 : 2);
            }
          })
          .on("mouseout", () => {
            const isSelected = selectedLakeIdRef.current === layer.id;
            if (layer.marker) {
              applyLakeMarkerStyle(layer.marker, layer.lake, isSelected);
            }
          });
      }

      layer.labelMarker.addTo(nextMap).on("click", () => handleSelectLake(layer.id));
    });

    const syncLakeLabels = () => {
      const layers = layerRefs.current;

      if (layers) {
        syncLakeLayerStyles(nextMap, layers, selectedLakeIdRef.current);
      }
    };

    syncLakeLabels();
    nextMap.on("zoomend", syncLakeLabels);

    const lakeBoundsLayers: L.Layer[] = [];
    lakeLayers.forEach((layer) => {
      if (layer.polygon) {
        lakeBoundsLayers.push(layer.polygon);
      } else if (layer.marker) {
        lakeBoundsLayers.push(layer.marker);
      }
    });
    const bounds = L.featureGroup(lakeBoundsLayers).getBounds();
    fitBoundsWhenSized(nextMap, bounds, { padding: [46, 46] }, 9);

    return () => {
      nextMap.off("zoomend", syncLakeLabels);
      nextMap.remove();
      mapRef.current = null;
      layerRefs.current = null;
      userLocationMarkerRef.current = null;
      userLocationAccuracyRef.current = null;
    };
  }, [handleSelectLake, lakeLayers, selectLakeWithoutZoom]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !userLocation) {
      return;
    }

    const point = L.latLng(userLocation.lat, userLocation.lng);
    const tooltip = userLocation.accuracy ? `Dein Standort · Genauigkeit ±${formatAccuracy(userLocation.accuracy)}` : "Dein Standort";

    if (!userLocationMarkerRef.current) {
      userLocationMarkerRef.current = L.circleMarker(point, USER_LOCATION_MARKER_STYLE).bindTooltip(tooltip, {
        direction: "top",
        offset: [0, -10]
      });
    } else {
      userLocationMarkerRef.current.setLatLng(point);
      userLocationMarkerRef.current.setTooltipContent(tooltip);
    }

    if (!map.hasLayer(userLocationMarkerRef.current)) {
      userLocationMarkerRef.current.addTo(map);
    }

    if (userLocation.accuracy && userLocation.accuracy > 0) {
      if (!userLocationAccuracyRef.current) {
        userLocationAccuracyRef.current = L.circle(point, {
          ...USER_LOCATION_ACCURACY_STYLE,
          radius: userLocation.accuracy
        });
      } else {
        userLocationAccuracyRef.current.setLatLng(point);
        userLocationAccuracyRef.current.setRadius(userLocation.accuracy);
      }

      if (!map.hasLayer(userLocationAccuracyRef.current)) {
        userLocationAccuracyRef.current.addTo(map);
      }
    } else if (userLocationAccuracyRef.current) {
      userLocationAccuracyRef.current.removeFrom(map);
    }

    const radius = Math.max(userLocation.accuracy ?? 120, 80);
    fitBoundsWhenSized(map, point.toBounds(radius), { maxZoom: 16, padding: [72, 72] }, 15);
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    restrictionLayers.forEach((layer) => {
      if (showRestrictionZones) {
        if (!map.hasLayer(layer.polygon)) {
          layer.polygon.addTo(map);
        }

        layer.polygon.off("click").on("click", () => selectLakeWithoutZoom(layer.lakeId));
      } else if (map.hasLayer(layer.polygon)) {
        layer.polygon.removeFrom(map);
      }
    });
  }, [restrictionLayers, selectLakeWithoutZoom, showRestrictionZones]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    baseTileLayerRef.current?.remove();
    labelTileLayerRef.current?.remove();
    baseTileLayerRef.current = null;
    labelTileLayerRef.current = null;

    const baseMap = getBaseMapOption(selectedBaseMapId);

    if (!baseMap.base) {
      const syncOfflineLayers = () => syncOfflineBaseMapLayerGroups(map, offlineBaseMapLayerGroups, true);

      syncOfflineLayers();
      map.on("zoomend", syncOfflineLayers);
      map.on("resize", syncOfflineLayers);
      map.attributionControl.addAttribution(LOCAL_MAP_ATTRIBUTION);

      return () => {
        map.off("zoomend", syncOfflineLayers);
        map.off("resize", syncOfflineLayers);
        removeOfflineBaseMapLayerGroups(offlineBaseMapLayerGroups);
        map.attributionControl.removeAttribution(LOCAL_MAP_ATTRIBUTION);
      };
    }

    removeOfflineBaseMapLayerGroups(offlineBaseMapLayerGroups);

    const baseLayer = createTileLayer(baseMap.base, 100).addTo(map);
    const labelLayer = baseMap.labels ? createTileLayer(baseMap.labels, 130).addTo(map) : null;

    baseLayer.bringToBack();
    baseTileLayerRef.current = baseLayer;
    labelTileLayerRef.current = labelLayer;

    return () => {
      baseLayer.remove();
      labelLayer?.remove();

      if (baseTileLayerRef.current === baseLayer) {
        baseTileLayerRef.current = null;
      }

      if (labelTileLayerRef.current === labelLayer) {
        labelTileLayerRef.current = null;
      }
    };
  }, [offlineBaseMapLayerGroups, selectedBaseMapId]);

  useEffect(() => {
    selectedLakeIdRef.current = selectedLakeId;
    const layers = layerRefs.current;
    const map = mapRef.current;

    if (!layers || !map) {
      return;
    }

    syncLakeLayerStyles(map, layers, selectedLakeId);
  }, [selectedLakeId]);

  return (
    <div className="map-wrap">
      <div
        ref={mapContainerRef}
        className={selectedBaseMapId === "offline" ? "leaflet-map offline-basemap" : "leaflet-map"}
        aria-label={`Interaktive Fischerei-Karte mit wechselbaren Basiskarten, lokalem Offline-Modus, ${lakes.length} Schweizer Seen, blau hervorgehobenen Seen und rot markierten Fischereiverbotszonen an erfassten Zürcher Bachmündungen und Seeschutzzonen`}
      />

      <div className="map-lake-search">
        <label className="sr-only" htmlFor="map-lake-search-input">
          See auf der Karte suchen
        </label>
        <div className="map-lake-search-field">
          <Search size={18} aria-hidden="true" />
          <input
            id="map-lake-search-input"
            type="search"
            value={lakeQuery}
            placeholder="See suchen"
            autoComplete="off"
            onChange={(event) => setLakeQuery(event.currentTarget.value)}
          />
          {lakeQuery ? (
            <button type="button" aria-label="Kartensuche leeren" onClick={() => setLakeQuery("")}>
              <X size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {lakeQuery.trim() ? (
          <div className="map-lake-search-results" aria-label="Gefundene Seen">
            {lakeSearchResults.length > 0 ? (
              lakeSearchResults.map((lake) => (
                <button
                  key={lake.id}
                  type="button"
                  onClick={() => {
                    setLakeQuery("");
                    handleSelectLake(lake.id);
                  }}
                >
                  <strong>{lake.name}</strong>
                  <span>{lake.canton}</span>
                </button>
              ))
            ) : (
              <p>Kein See gefunden. Suche nach Name oder Region.</p>
            )}
          </div>
        ) : null}
      </div>

      {selectedBaseMapId === "offline" && offlineMapStatus !== "ready" ? (
        <p className={`map-data-status ${offlineMapStatus}`} role="status" aria-live="polite">
          {offlineMapStatus === "error" ? "Offline-Grundkarte nicht geladen. Seen bleiben wählbar." : "Offline-Karte wird vorbereitet …"}
        </p>
      ) : null}

      <div className={isMapSwitcherOpen ? "map-style-switcher expanded" : "map-style-switcher collapsed"} role="group" aria-label="Kartenauswahl">
        <button
          type="button"
          className="map-style-toggle"
          aria-expanded={isMapSwitcherOpen}
          aria-controls="map-style-menu"
          aria-label={mapSwitcherToggleLabel}
          onClick={() => setIsMapSwitcherOpen((isOpen) => !isOpen)}
        >
          <span className="map-style-toggle-main">
            <Layers size={17} aria-hidden="true" />
            <span>Karte wählen</span>
          </span>
          <span className="map-style-current">{selectedBaseMapOption.label}</span>
          <ChevronDown className="map-style-chevron" size={17} aria-hidden="true" />
        </button>

        {isMapSwitcherOpen ? (
          <div className="map-style-menu" id="map-style-menu">
            <div className="map-style-options" aria-label="Basiskarten auswählen">
              {BASEMAP_OPTIONS.map((option) => {
                const isSelected = selectedBaseMapId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={isSelected ? "map-style-option active" : "map-style-option"}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setMapPreferences((preferences) => ({ ...preferences, selectedBaseMapId: option.id }));
                      setIsMapSwitcherOpen(false);
                    }}
                  >
                    <span className="map-style-name">{option.label}</span>
                    <span className="map-style-description">{option.description}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className={showRestrictionZones ? "map-restriction-toggle active" : "map-restriction-toggle"}
              aria-pressed={showRestrictionZones}
              aria-label={showRestrictionZones ? "Fischereiverbotszonen ausblenden" : "Fischereiverbotszonen einblenden"}
              onClick={() => setMapPreferences((preferences) => ({ ...preferences, showRestrictionZones: !preferences.showRestrictionZones }))}
            >
              <RestrictionToggleIcon size={17} aria-hidden="true" />
              <span>{showRestrictionZones ? "Zonen ausblenden" : "Zonen anzeigen"}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="map-location-control">
        <button
          type="button"
          className={isLocating ? "map-location-button loading" : "map-location-button"}
          aria-busy={isLocating}
          aria-label={locationButtonLabel}
          disabled={isLocating}
          onClick={handleLocateUser}
        >
          {isLocating ? <LoaderCircle size={18} aria-hidden="true" /> : <LocateFixed size={18} aria-hidden="true" />}
          <span>{locationButtonText}</span>
        </button>
        {locationMessage ? (
          <p className={`map-location-status ${locationStatus}`} role="status" aria-live="polite">
            {locationMessage}
          </p>
        ) : null}
      </div>

    </div>
  );
}
