
import { Map as MapLibreMap, Popup } from "maplibre-gl";

export function registerProjectSitesPopup(map: MapLibreMap): void {
    map.on("click", "project-sites-points", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const properties = feature.properties ?? {};
        const geometry = feature.geometry;

        if (
            geometry.type !== "Point" &&
            geometry.type !== "MultiPoint"
        ) {
            return;
        }

        const coordinates = event.lngLat;

        const projectName =
            properties.project_name ?? "Unknown project";

        const siteName =
            properties.site_name ?? "Unknown site";

        const status =
            properties.proj_status ?? "N/A";

        const beneficiaries =
            properties.benef_number ?? "N/A";

        const container = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = String(projectName);
        container.appendChild(title);

        const details = [
            ["Site", siteName],
            ["Status", status],
            ["Beneficiaries", beneficiaries]
        ];

        details.forEach(([label, value]) => {
            const row = document.createElement("div");
            row.textContent = `${label}: ${String(value)}`;
            container.appendChild(row);
        });

        new Popup({
            closeButton: true,
            closeOnClick: true
        })
            .setLngLat(coordinates)
            .setDOMContent(container)
            .addTo(map);
    });

    map.on("mouseenter", "project-sites-points", () => {
        map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "project-sites-points", () => {
        map.getCanvas().style.cursor = "";
    });
}
