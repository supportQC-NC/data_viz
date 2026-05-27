// src/pages/CyclonesMapPage/CyclonesMapPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  fetchPositions,
  fetchTrajectoires,
  selectPositions,
  selectTrajectoires,
} from "../../store/slices/cyclonesSlice";
import { useLang } from "../../store/context/langContext";
import "./CyclonesMapPage.scss";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const TYPE_COLOR = {
  "Non classé": "#4a6a84",
  "Dépression tropicale faible": "#00b4cc",
  "Dépression tropicale modérée": "#00e6ff",
  "Dépression tropicale forte": "#ffd166",
  "Cyclone tropical": "#ff9f43",
  "Cyclone tropical intense": "#ff6b35",
  "Cyclone tropical très intense": "#ff3b5c",
};

const TYPE_LABELS = Object.keys(TYPE_COLOR);

const MAP_STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  ocean: "mapbox://styles/mapbox/navigation-night-v1",
};

export default function CyclonesMapPage() {
  const dispatch = useDispatch();
  const { t } = useLang();

  const positions = useSelector(selectPositions);
  const trajectoires = useSelector(selectTrajectoires);

  const mapContainer = useRef(null);
  const map = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState("satellite");
  const [styleLoading, setStyleLoading] = useState(false);
  const [selectedCyc, setSelectedCyc] = useState(null);
  const [hoveredCyc, setHoveredCyc] = useState(null);
  const [filterSaison, setFilterSaison] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (positions.status === "idle") dispatch(fetchPositions());
    if (trajectoires.status === "idle") dispatch(fetchTrajectoires());
  }, [dispatch, positions.status, trajectoires.status]);

  const trajs = useMemo(
    () => trajectoires.features.map((f) => f.properties),
    [trajectoires.features],
  );
  const saisons = useMemo(
    () => [...new Set(trajs.map((tr) => tr.saison))].sort(),
    [trajs],
  );

  const filteredTrajs = useMemo(
    () =>
      trajectoires.features.filter((f) => {
        const p = f.properties;
        if (filterSaison !== "all" && p.saison !== filterSaison) return false;
        if (filterType !== "all" && p.type_max !== filterType) return false;
        return true;
      }),
    [trajectoires.features, filterSaison, filterType],
  );

  const filteredPos = useMemo(() => {
    const nums = new Set(filteredTrajs.map((f) => f.properties.num_ref));
    return positions.features.filter((f) => nums.has(f.properties.num_ref));
  }, [positions.features, filteredTrajs]);

  const addLayers = () => {
    if (!map.current) return;

    if (!map.current.getSource("trajectoires")) {
      map.current.addSource("trajectoires", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    if (!map.current.getSource("positions")) {
      map.current.addSource("positions", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.current.getLayer("trajectoires-line")) {
      map.current.addLayer({
        id: "trajectoires-line",
        type: "line",
        source: "trajectoires",
        paint: {
          "line-color": [
            "match",
            ["get", "type_max"],
            "Non classé",
            "#4a6a84",
            "Dépression tropicale faible",
            "#00b4cc",
            "Dépression tropicale modérée",
            "#00e6ff",
            "Dépression tropicale forte",
            "#ffd166",
            "Cyclone tropical",
            "#ff9f43",
            "Cyclone tropical intense",
            "#ff6b35",
            "Cyclone tropical très intense",
            "#ff3b5c",
            "#4a6a84",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 8, 3.5],
          "line-opacity": 0.8,
        },
      });
    }

    if (!map.current.getLayer("trajectoires-line-hover")) {
      map.current.addLayer({
        id: "trajectoires-line-hover",
        type: "line",
        source: "trajectoires",
        filter: ["==", "num_ref", ""],
        paint: { "line-color": "#ffffff", "line-width": 5, "line-opacity": 1 },
      });
    }

    if (!map.current.getLayer("positions-point")) {
      map.current.addLayer({
        id: "positions-point",
        type: "circle",
        source: "positions",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "vmax"],
            0,
            3,
            50,
            6,
            100,
            11,
          ],
          "circle-color": [
            "match",
            ["get", "type"],
            "Non classé",
            "#4a6a84",
            "Dépression tropicale faible",
            "#00b4cc",
            "Dépression tropicale modérée",
            "#00e6ff",
            "Dépression tropicale forte",
            "#ffd166",
            "Cyclone tropical",
            "#ff9f43",
            "Cyclone tropical intense",
            "#ff6b35",
            "Cyclone tropical très intense",
            "#ff3b5c",
            "#4a6a84",
          ],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(255,255,255,0.3)",
        },
      });
    }
  };

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.satellite,
      center: [163, -18],
      zoom: 4.5,
    });
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-right");

    map.current.on("load", () => {
      addLayers();

      map.current.on("mouseenter", "trajectoires-line", (e) => {
        map.current.getCanvas().style.cursor = "pointer";
        const props = e.features[0]?.properties;
        if (props) {
          setHoveredCyc(props);
          map.current.setFilter("trajectoires-line-hover", [
            "==",
            "num_ref",
            props.num_ref,
          ]);
        }
      });

      map.current.on("mouseleave", "trajectoires-line", () => {
        map.current.getCanvas().style.cursor = "";
        setHoveredCyc(null);
        map.current.setFilter("trajectoires-line-hover", ["==", "num_ref", ""]);
      });

      map.current.on("click", "trajectoires-line", (e) => {
        const props = e.features[0]?.properties;
        if (props) setSelectedCyc(props);
      });

      map.current.on("click", (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["trajectoires-line"],
        });
        if (!features.length) setSelectedCyc(null);
      });

      setMapReady(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapReady) return;
    setStyleLoading(true);
    map.current.setStyle(MAP_STYLES[mapStyle]);
    map.current.once("styledata", () => {
      addLayers();
      const srcT = map.current.getSource("trajectoires");
      const srcP = map.current.getSource("positions");
      if (srcT)
        srcT.setData({ type: "FeatureCollection", features: filteredTrajs });
      if (srcP)
        srcP.setData({ type: "FeatureCollection", features: filteredPos });
      setStyleLoading(false);
    });
  }, [mapStyle]);

  useEffect(() => {
    if (!mapReady || !map.current) return;
    const src = map.current.getSource("trajectoires");
    if (src)
      src.setData({ type: "FeatureCollection", features: filteredTrajs });
  }, [mapReady, filteredTrajs]);

  useEffect(() => {
    if (!mapReady || !map.current) return;
    const src = map.current.getSource("positions");
    if (src) src.setData({ type: "FeatureCollection", features: filteredPos });
  }, [mapReady, filteredPos]);

  const isLoading =
    positions.status === "loading" || trajectoires.status === "loading";
  const displayCyc = selectedCyc || hoveredCyc;

  const getStyleLabel = (key) => {
    if (key === "satellite") return t("cyclonesMap.style_satellite");
    if (key === "dark") return t("cyclonesMap.style_dark");
    return t("cyclonesMap.style_ocean");
  };

  return (
    <div className="cyc-map-page">
      <aside className="cyc-map-sidebar">
        <div className="cyc-map-sidebar__header">
          <Link to="/cyclones" className="cyc-map-sidebar__back">
            {t("cyclonesMap.back")}
          </Link>
          <h1 className="cyc-map-sidebar__title">{t("cyclonesMap.title")}</h1>
          <p className="cyc-map-sidebar__sub">
            {filteredTrajs.length} trajectoires · {filteredPos.length} positions
          </p>
        </div>

        <div className="cyc-map-sidebar__section">
          <span className="cyc-section-title">
            {t("cyclonesMap.style_label")}
          </span>
          <div className="cyc-style-btns">
            {Object.keys(MAP_STYLES).map((key) => (
              <button
                key={key}
                className={`cyc-style-btn${mapStyle === key ? " active" : ""}`}
                onClick={() => setMapStyle(key)}
              >
                {getStyleLabel(key)}
              </button>
            ))}
          </div>
        </div>

        <div className="cyc-map-sidebar__section">
          <span className="cyc-section-title">
            {t("cyclonesMap.filter_label")}
          </span>

          <div className="cyc-filter">
            <label className="cyc-filter__label">
              {t("cyclonesMap.filter_saison")}
            </label>
            <select
              className="cyc-filter__select"
              value={filterSaison}
              onChange={(e) => setFilterSaison(e.target.value)}
            >
              <option value="all">{t("cyclonesMap.filter_saison_all")}</option>
              {saisons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="cyc-filter">
            <label className="cyc-filter__label">
              {t("cyclonesMap.filter_type")}
            </label>
            <select
              className="cyc-filter__select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">{t("cyclonesMap.filter_type_all")}</option>
              {TYPE_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {(filterSaison !== "all" || filterType !== "all") && (
            <button
              className="cyc-filter__reset"
              onClick={() => {
                setFilterSaison("all");
                setFilterType("all");
              }}
            >
              {t("cyclonesMap.filter_reset")}
            </button>
          )}
        </div>

        <div className="cyc-map-sidebar__section">
          <span className="cyc-section-title">
            {t("cyclonesMap.legend_title")}
          </span>
          {TYPE_LABELS.map((label) => (
            <div key={label} className="cyc-legend-item">
              <span
                className="cyc-legend-item__dot"
                style={{ background: TYPE_COLOR[label] }}
              />
              <span className="cyc-legend-item__label">{label}</span>
            </div>
          ))}
        </div>

        {displayCyc && (
          <div className="cyc-map-sidebar__section">
            <span className="cyc-section-title">
              {selectedCyc
                ? t("cyclonesMap.selected_label")
                : t("cyclonesMap.hover_label")}
            </span>
            <div className="cyc-info">
              <div className="cyc-info__header">
                <span className="cyc-info__name">{displayCyc.nom}</span>
                <span className="cyc-info__season">{displayCyc.saison}</span>
              </div>
              <div
                className="cyc-info__type"
                style={{ color: TYPE_COLOR[displayCyc.type_max] }}
              >
                {displayCyc.type_max}
              </div>
              <div className="cyc-info__grid">
                <div className="cyc-info__item">
                  <span className="cyc-info__item-label">
                    {t("cyclonesMap.info_vmax")}
                  </span>
                  <span className="cyc-info__item-value">
                    {displayCyc.vmax_traj ?? "—"} m/s
                  </span>
                </div>
                <div className="cyc-info__item">
                  <span className="cyc-info__item-label">
                    {t("cyclonesMap.info_pmin")}
                  </span>
                  <span className="cyc-info__item-value">
                    {displayCyc.pmin_traj ?? "—"} hPa
                  </span>
                </div>
                <div className="cyc-info__item">
                  <span className="cyc-info__item-label">
                    {t("cyclonesMap.info_start")}
                  </span>
                  <span className="cyc-info__item-value">
                    {displayCyc.date_deb?.slice(0, 10) ?? "—"}
                  </span>
                </div>
                <div className="cyc-info__item">
                  <span className="cyc-info__item-label">
                    {t("cyclonesMap.info_end")}
                  </span>
                  <span className="cyc-info__item-value">
                    {displayCyc.date_fin?.slice(0, 10) ?? "—"}
                  </span>
                </div>
              </div>
              {selectedCyc && (
                <button
                  className="cyc-info__close"
                  onClick={() => setSelectedCyc(null)}
                >
                  {t("cyclonesMap.info_close")}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="cyc-map-sidebar__footer">
          <Link to="/guide" className="cyc-map-sidebar__guide-link">
            {t("cyclonesMap.guide_link")}
          </Link>
        </div>
      </aside>

      <div className="cyc-map-container">
        <div ref={mapContainer} className="cyc-map-canvas" />
        {(isLoading || styleLoading) && (
          <div className="cyc-map-loading">
            <div className="cyc-map-loading__spinner" />
            <span>
              {styleLoading
                ? t("cyclonesMap.loading_style")
                : t("cyclonesMap.loading_data")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
