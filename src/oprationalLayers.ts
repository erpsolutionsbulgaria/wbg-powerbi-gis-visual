
import type { Map as MapLibreMap } from "maplibre-gl";

import projectSites from "./data/project-sites.json";
import nigerAdmin1 from "./data/niger-admin1.json";

export function addProjectSitesLayer(map: MapLibreMap): void {
    const sourceId = "project-sites";
    const layerId = "project-sites-points";

    if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
            type: "geojson",
            data: projectSites as any
        });
    }

    if (!map.getLayer(layerId)) {
        map.addLayer({
            id: layerId,
            type: "circle",
            source: sourceId,
            paint: {
                "circle-radius": 7,
                "circle-color": "#e63946",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff"
            }
        });
    }
}

export function addAdmin1Layer(map: MapLibreMap): void {
    const sourceId = "niger-admin1";
    const fillLayerId = "niger-admin1-fill";
    const outlineLayerId = "niger-admin1-outline";

    if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
            type: "geojson",
            data: nigerAdmin1 as any
        });
    }

    if (!map.getLayer(fillLayerId)) {
        map.addLayer({
            id: fillLayerId,
            type: "fill",
            source: sourceId,
            paint: {
                "fill-color": "#3388ff",
                "fill-opacity": 0.12
            }
        });
    }

    if (!map.getLayer(outlineLayerId)) {
        map.addLayer({
            id: outlineLayerId,
            type: "line",
            source: sourceId,
            paint: {
                "line-color": "#3388ff",
                "line-width": 2
            }
        });
    }
}
