import { MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fishingRestrictionZones, lakePolygons } from "../lib/data";
import type { FishingRestrictionFeature, LakeFeature, LakeId } from "../types";

interface MapViewProps {
  selectedLakeId: LakeId | null;
  onSelectLake: (lakeId: LakeId) => void;
}

type LabelPosition = {
  left: number;
  top: number;
};

type LakeLayer = {
  id: LakeId;
  name: string;
  polygon: L.Polygon;
  center: L.LatLng;
};

type RestrictionLayer = {
  id: string;
  lakeId: LakeId;
  name: string;
  polygon: L.Polygon;
};

type LabelOffset = {
  x: number;
  y: number;
};

const BASE_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const MAP_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/" rel="noopener noreferrer">Esri</a> · See-Geometrien &copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const LAKE_PANE = "lake-polygons";
const RESTRICTION_PANE = "fishing-restrictions";
const SWITZERLAND_BOUNDS = L.latLngBounds([45.75, 5.74], [47.95, 10.66]);

const LABEL_OFFSETS: Record<LakeId, LabelOffset> = {
  greifensee: { x: -34, y: -18 },
  pfaeffikersee: { x: 54, y: 22 },
  zuerichsee: { x: -10, y: 10 }
};

const COMPACT_LABEL_OFFSETS: Record<LakeId, LabelOffset> = {
  greifensee: { x: -74, y: -20 },
  pfaeffikersee: { x: 72, y: 32 },
  zuerichsee: { x: -12, y: 16 }
};

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

const RESTRICTION_STYLE: L.PathOptions = {
  color: "#dc2626",
  fillColor: "#ef4444",
  fillOpacity: 0.16,
  opacity: 0.98,
  pane: RESTRICTION_PANE,
  weight: 2.5
};

const RESTRICTION_ZONE_ORDER: Record<string, number> = {
  "Seeschutzzone VC": 0,
  "Seeschutzzone VA": 1,
  "Seeschutzzone VB": 2,
  "100-m-Radius Bachmündung": 3
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

function createLakeLayer(feature: LakeFeature): LakeLayer {
  const polygon = L.polygon(toLeafletLatLngs(feature), BASE_STYLE);

  return {
    id: feature.properties.id,
    name: feature.properties.name,
    polygon,
    center: polygon.getBounds().getCenter()
  };
}

function createRestrictionLayer(feature: FishingRestrictionFeature): RestrictionLayer {
  const polygon = L.polygon(toRestrictionLatLngs(feature), RESTRICTION_STYLE).bindTooltip(
    `${feature.properties.name}: ${feature.properties.rule} Zeitraum: ${feature.properties.period}.`,
    { className: "restriction-tooltip", direction: "top", sticky: true }
  );

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

export function MapView({ selectedLakeId, onSelectLake }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRefs = useRef<Record<LakeId, LakeLayer> | null>(null);
  const selectedLakeIdRef = useRef<LakeId | null>(selectedLakeId);
  const [labelPositions, setLabelPositions] = useState<Partial<Record<LakeId, LabelPosition>>>({});

  const lakeLayers = useMemo(() => lakePolygons.features.map(createLakeLayer), []);
  const restrictionLayers = useMemo(() => [...fishingRestrictionZones.features].sort(compareRestrictionFeatures).map(createRestrictionLayer), []);

  useEffect(() => {
    selectedLakeIdRef.current = selectedLakeId;
  }, [selectedLakeId]);

  const updateLabelPositions = useCallback(() => {
    const map = mapRef.current;
    const layers = layerRefs.current;

    if (!map || !layers) {
      return;
    }

    const offsets = map.getSize().x < 560 ? COMPACT_LABEL_OFFSETS : LABEL_OFFSETS;
    const nextPositions = Object.values(layers).reduce<Partial<Record<LakeId, LabelPosition>>>((positions, layer) => {
      const point = map.latLngToContainerPoint(layer.center);
      const offset = offsets[layer.id];
      positions[layer.id] = { left: point.x + offset.x, top: point.y + offset.y };
      return positions;
    }, {});

    setLabelPositions(nextPositions);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      attributionControl: true,
      maxBounds: SWITZERLAND_BOUNDS,
      maxBoundsViscosity: 1,
      minZoom: 8,
      scrollWheelZoom: true,
      worldCopyJump: false,
      zoomControl: false
    });

    mapRef.current = map;
    map.createPane(LAKE_PANE).style.zIndex = "430";
    map.createPane(RESTRICTION_PANE).style.zIndex = "470";
    layerRefs.current = lakeLayers.reduce<Record<LakeId, LakeLayer>>((layers, layer) => {
      layers[layer.id] = layer;
      return layers;
    }, {} as Record<LakeId, LakeLayer>);

    L.tileLayer(BASE_TILE_URL, {
      attribution: MAP_ATTRIBUTION,
      bounds: SWITZERLAND_BOUNDS,
      maxNativeZoom: 19,
      maxZoom: 19,
      minZoom: 8,
      noWrap: true
    }).addTo(map);

    lakeLayers.forEach((layer) => {
      layer.polygon
        .addTo(map)
        .on("click", () => onSelectLake(layer.id))
        .on("mouseover", () => layer.polygon.setStyle({ weight: selectedLakeIdRef.current === layer.id ? 7 : 5 }))
        .on("mouseout", () => layer.polygon.setStyle(selectedLakeIdRef.current === layer.id ? SELECTED_STYLE : BASE_STYLE));
    });

    restrictionLayers.forEach((layer) => {
      layer.polygon.addTo(map).on("click", () => onSelectLake(layer.lakeId));
    });

    const bounds = L.featureGroup(lakeLayers.map((layer) => layer.polygon)).getBounds();
    map.fitBounds(bounds, { padding: [46, 46] });
    map.on("move zoom resize", updateLabelPositions);
    map.whenReady(updateLabelPositions);

    return () => {
      map.off("move zoom resize", updateLabelPositions);
      map.remove();
      mapRef.current = null;
      layerRefs.current = null;
    };
  }, [lakeLayers, onSelectLake, restrictionLayers, updateLabelPositions]);

  useEffect(() => {
    const layers = layerRefs.current;

    if (!layers) {
      return;
    }

    Object.values(layers).forEach((layer) => {
      layer.polygon.setStyle(selectedLakeId === layer.id ? SELECTED_STYLE : BASE_STYLE);

      if (selectedLakeId === layer.id) {
        layer.polygon.bringToFront();
      }
    });
  }, [selectedLakeId]);

  function handleSelectLake(lakeId: LakeId) {
    onSelectLake(lakeId);

    const map = mapRef.current;
    const layer = layerRefs.current?.[lakeId];

    if (map && layer) {
      map.fitBounds(layer.polygon.getBounds(), { maxZoom: 12, padding: [92, 92] });
    }
  }

  return (
    <div className="map-wrap">
      <div
        ref={mapContainerRef}
        className="leaflet-map"
        aria-label="Interaktive grüne Satellitenbasiskarte mit markiertem Zürichsee, Greifensee, Pfäffikersee und roten Fischereiverbotszonen an Bachmündungen und Seeschutzzonen"
      />

      <div className="lake-controls" aria-label="Seen auswählen">
        {lakeLayers.map((lake) => {
          const position = labelPositions[lake.id];

          return (
            <button
              key={lake.id}
              type="button"
              className={selectedLakeId === lake.id ? "lake-control selected" : "lake-control"}
              style={position ? { left: `${position.left}px`, top: `${position.top}px` } : { left: "-9999px", top: "-9999px" }}
              tabIndex={position ? undefined : -1}
              aria-label={`${lake.name} öffnen`}
              aria-pressed={selectedLakeId === lake.id}
              onClick={() => handleSelectLake(lake.id)}
            >
              {lake.name}
            </button>
          );
        })}
      </div>

      <div className="map-legend" aria-label="Kartenhinweis">
        <MapPin size={16} aria-hidden="true" />
        <span>Rot: Fischereiverbotszonen an Zürichsee-Bachmündungen und Pfäffikersee-Seeschutzzonen</span>
      </div>
    </div>
  );
}
