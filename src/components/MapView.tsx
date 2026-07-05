import { Eye, EyeOff, Layers, LoaderCircle, LocateFixed } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fishingRestrictionZones, lakePolygons, offlineMap } from "../lib/data";
import { getRestrictionPeriodStatus } from "../lib/restrictionPeriodStatus";
import type { FeatureCollection } from "geojson";
import type { FishingRestrictionFeature, LakeFeature, LakeId, OfflineMapFeature } from "../types";
import type { RestrictionPeriodStatus } from "../lib/restrictionPeriodStatus";

interface MapViewProps {
  selectedLakeId: LakeId | null;
  onSelectLake: (lakeId: LakeId) => void;
}

type LakeLayer = {
  id: LakeId;
  name: string;
  polygon: L.Polygon;
  labelMarker: L.Marker;
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
  color: "#04748d",
  fillColor: "#28c7e8",
  fillOpacity: 0.28,
  opacity: 0.95,
  pane: LAKE_PANE,
  weight: 4
};

const SELECTED_STYLE: L.PathOptions = {
  color: "#f59f00",
  fillColor: "#1da5c6",
  fillOpacity: 0.38,
  opacity: 1,
  pane: LAKE_PANE,
  weight: 7
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
  color: "#ea580c",
  dashArray: "6 5",
  fillColor: "#fb923c",
  fillOpacity: 0.14,
  opacity: 0.9,
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

function toLeafletLatLngs(feature: LakeFeature): L.LatLngExpression[][] {
  return feature.geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
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

function createLakeLabelIcon(id: LakeId, name: string, isSelected: boolean): L.DivIcon {
  const button = document.createElement("button");
  button.type = "button";
  button.className = isSelected ? "lake-label-control selected" : "lake-label-control";
  button.dataset.lakeId = id;
  button.textContent = name;
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

function createLakeLayer(feature: LakeFeature): LakeLayer {
  const polygon = L.polygon(toLeafletLatLngs(feature), BASE_STYLE);
  const center = polygon.getBounds().getCenter();

  return {
    id: feature.properties.id,
    name: feature.properties.name,
    polygon,
    labelMarker: L.marker(center, {
      icon: createLakeLabelIcon(feature.properties.id, feature.properties.name, false),
      interactive: true,
      keyboard: false,
      zIndexOffset: 500
    })
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

function createOfflineBaseMapLayerGroups(): OfflineBaseMapLayerGroup[] {
  const featuresByZoom = offlineMap.features.reduce<Map<number, OfflineMapFeature[]>>((groups, feature) => {
    const minZoom = feature.properties.minZoom;
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

  const offlineBaseMapLayerGroups = useMemo(createOfflineBaseMapLayerGroups, []);
  const lakeLayers = useMemo(() => lakePolygons.features.map(createLakeLayer), []);
  const restrictionLayers = useMemo(() => [...fishingRestrictionZones.features].sort(compareRestrictionFeatures).map(createRestrictionLayer), []);
  const { selectedBaseMapId, showRestrictionZones } = mapPreferences;
  const RestrictionToggleIcon = showRestrictionZones ? EyeOff : Eye;
  const isLocating = locationStatus === "locating";
  const locationButtonText = isLocating ? "Sucht..." : userLocation ? "Aktualisieren" : "Standort";
  const locationButtonLabel = isLocating ? "Standort wird gesucht" : userLocation ? "Standort erneut suchen" : "Standort anzeigen";

  useEffect(() => {
    writeStoredMapPreferences(mapPreferences);
  }, [mapPreferences]);

  useEffect(() => {
    selectedLakeIdRef.current = selectedLakeId;
  }, [selectedLakeId]);

  const handleSelectLake = useCallback(
    (lakeId: LakeId) => {
      onSelectLake(lakeId);

      const map = mapRef.current;
      const layer = layerRefs.current?.[lakeId];

      if (map && layer) {
        fitBoundsWhenSized(map, layer.polygon.getBounds(), { maxZoom: 12, padding: [92, 92] }, 12);
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
      layer.polygon
        .addTo(nextMap)
        .on("click", () => selectLakeWithoutZoom(layer.id))
        .on("mouseover", () => layer.polygon.setStyle({ weight: selectedLakeIdRef.current === layer.id ? 7 : 5 }))
        .on("mouseout", () => layer.polygon.setStyle(selectedLakeIdRef.current === layer.id ? SELECTED_STYLE : BASE_STYLE));

      layer.labelMarker.addTo(nextMap).on("click", () => handleSelectLake(layer.id));
    });

    const bounds = L.featureGroup(lakeLayers.map((layer) => layer.polygon)).getBounds();
    fitBoundsWhenSized(nextMap, bounds, { padding: [46, 46] }, 9);

    return () => {
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
    const layers = layerRefs.current;

    if (!layers) {
      return;
    }

    Object.values(layers).forEach((layer) => {
      const isSelected = selectedLakeId === layer.id;
      layer.polygon.setStyle(isSelected ? SELECTED_STYLE : BASE_STYLE);
      layer.labelMarker.setIcon(createLakeLabelIcon(layer.id, layer.name, isSelected));
      layer.labelMarker.setZIndexOffset(isSelected ? 900 : 500);

      if (isSelected) {
        layer.polygon.bringToFront();
      }
    });
  }, [selectedLakeId]);

  return (
    <div className="map-wrap">
      <div
        ref={mapContainerRef}
        className={selectedBaseMapId === "offline" ? "leaflet-map offline-basemap" : "leaflet-map"}
        aria-label="Interaktive Fischerei-Karte mit wechselbaren Basiskarten, lokalem Offline-Modus, markiertem Zürichsee, Greifensee, Pfäffikersee und rot oder orange markierten Fischereiverbotszonen an Bachmündungen und Seeschutzzonen"
      />

      <div className="map-style-switcher" aria-label="Kartentyp auswählen">
        <div className="map-style-heading" aria-hidden="true">
          <Layers size={15} />
          <span>Karte</span>
        </div>
        <div className="map-style-options" aria-label="Basiskarten auswählen">
          {BASEMAP_OPTIONS.map((option) => {
            const isSelected = selectedBaseMapId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={isSelected ? "map-style-option active" : "map-style-option"}
                aria-pressed={isSelected}
                onClick={() => setMapPreferences((preferences) => ({ ...preferences, selectedBaseMapId: option.id }))}
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
