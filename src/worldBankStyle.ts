
import { VectorTileLayer } from "@esri/maplibre-arcgis";
import type { StyleSpecification } from "maplibre-gl";

type WebMapLayerConfig = {
    title?: string;
    layerType: string;
    itemId?: string;
    url?: string;
    opacity?: number;
    visibility?: boolean;
};

export async function buildWorldBankStyle(
    basemapId: string,
    url: string,
    isStillActive: () => boolean
): Promise<StyleSpecification | null> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Web Map HTTP ${response.status}`);
    }

    const webMap = await response.json();
    if (!isStillActive()) return null;

    const configs: WebMapLayerConfig[] = (
        webMap.baseMap?.baseMapLayers ?? []
    ).filter(
        (layer: WebMapLayerConfig) => layer.visibility !== false
    );

    const loaded = await Promise.all(
        configs.map(async (config) => {
            if (config.layerType === "VectorTileLayer") {
                if (!config.itemId) {
                    throw new Error(
                        `Missing itemId for ${config.title}`
                    );
                }

                return {
                    config,
                    vectorLayer:
                        await VectorTileLayer.fromPortalItem(
                            config.itemId
                        )
                };
            }

            return { config, vectorLayer: null };
        })
    );

    if (!isStillActive()) return null;

    const sources: Record<string, any> = {};
    const layers: any[] = [];
    const vectorStyles: any[] = [];

    const addVectorLayer = (
        vectorLayer: VectorTileLayer,
        prefix: string
    ): void => {
        const sourceIdMap: Record<string, string> = {};

        for (const [oldId, original] of Object.entries(
            vectorLayer.sources
        )) {
            const newId = `${prefix}-${oldId}`;
            sourceIdMap[oldId] = newId;

            const source: any = JSON.parse(
                JSON.stringify(original)
            );

            if (
                source.type === "vector" &&
                Array.isArray(source.tiles) &&
                source.tiles.length > 0
            ) {
                delete source.url;
            }

            sources[newId] = source;
        }

        for (const original of vectorLayer.layers) {
            const layer: any = JSON.parse(
                JSON.stringify(original)
            );

            layer.id = `${prefix}-${layer.id}`;

            if (layer.source) {
                layer.source =
                    sourceIdMap[layer.source] ?? layer.source;
            }

            if (layer.ref) {
                layer.ref = `${prefix}-${layer.ref}`;
            }

            layers.push(layer);
        }

        vectorStyles.push(vectorLayer.style);
    };

    loaded.forEach(({ config, vectorLayer }, index) => {
        const prefix = `wb-${index}`;

        if (
            config.layerType === "ArcGISTiledMapServiceLayer"
        ) {
            const serviceUrl = String(
                config.url ?? ""
            ).replace(/\/$/, "");

            if (!serviceUrl) {
                throw new Error(
                    `Missing raster URL for ${config.title}`
                );
            }

            const sourceId = `${prefix}-raster`;

            sources[sourceId] = {
                type: "raster",
                tiles: [
                    `${serviceUrl}/tile/{z}/{y}/{x}`
                ],
                tileSize: 256
            };

            layers.push({
                id: `${prefix}-layer`,
                type: "raster",
                source: sourceId,
                paint: {
                    "raster-opacity": config.opacity ?? 1
                }
            });

        } else if (
            config.layerType === "VectorTileLayer" &&
            vectorLayer
        ) {
            addVectorLayer(vectorLayer, prefix);
        }
    });

    if (layers.length === 0) {
        throw new Error("No basemap layers were created");
    }

    const primaryStyle = vectorStyles[0];

    const combinedStyle: any = {
        version: 8,
        name: basemapId,
        sources,
        layers
    };

    if (primaryStyle?.glyphs) {
        combinedStyle.glyphs = primaryStyle.glyphs;
    }

    if (primaryStyle?.sprite) {
        combinedStyle.sprite = primaryStyle.sprite;
    }

    return combinedStyle as StyleSpecification;
}
