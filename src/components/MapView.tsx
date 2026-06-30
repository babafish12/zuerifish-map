import { MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { lakePolygons } from "../lib/data";
import type { LakeFeature, LakeId } from "../types";

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

const SWISSTOPO_TILE_URL =
  "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg";
const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.swisstopo.admin.ch/" rel="noopener noreferrer">swisstopo</a> · See-Geometrien &copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const SWITZERLAND_BOUNDS = L.latLngBounds([45.75, 5.74], [47.95, 10.66]);

const BASE_STYLE: L.PathOptions = {
  color: "#04748d",
  fillColor: "#28c7e8",
  fillOpacity: 0.28,
  opacity: 0.95,
  weight: 4
};

const SELECTED_STYLE: L.PathOptions = {
  color: "#f59f00",
  fillColor: "#1da5c6",
  fillOpacity: 0.38,
  opacity: 1,
  weight: 7
};

function toLeafletLatLngs(feature: LakeFeature): L.LatLngExpression[][] {
  return feature.geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
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

export function MapView({ selectedLakeId, onSelectLake }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRefs = useRef<Record<LakeId, LakeLayer> | null>(null);
  const selectedLakeIdRef = useRef<LakeId | null>(selectedLakeId);
  const [labelPositions, setLabelPositions] = useState<Partial<Record<LakeId, LabelPosition>>>({});

  const lakeLayers = useMemo(() => lakePolygons.features.map(createLakeLayer), []);

  useEffect(() => {
    selectedLakeIdRef.current = selectedLakeId;
  }, [selectedLakeId]);

  const updateLabelPositions = useCallback(() => {
    const map = mapRef.current;
    const layers = layerRefs.current;

    if (!map || !layers) {
      return;
    }

    const nextPositions = Object.values(layers).reduce<Partial<Record<LakeId, LabelPosition>>>((positions, layer) => {
      const point = map.latLngToContainerPoint(layer.center);
      positions[layer.id] = { left: point.x, top: point.y };
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
    layerRefs.current = lakeLayers.reduce<Record<LakeId, LakeLayer>>((layers, layer) => {
      layers[layer.id] = layer;
      return layers;
    }, {} as Record<LakeId, LakeLayer>);

    L.tileLayer(SWISSTOPO_TILE_URL, {
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
  }, [lakeLayers, onSelectLake, updateLabelPositions]);

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
        aria-label="Interaktive Schweizer Basiskarte mit markiertem Zürichsee, Greifensee und Pfäffikersee"
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
        <span>Schweizer Basiskarte; See-Flächen exakt aus OpenStreetMap markiert</span>
      </div>
    </div>
  );
}
