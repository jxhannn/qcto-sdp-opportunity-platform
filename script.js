(function () {
  const pageViews = document.querySelectorAll(".page-view");
  const navLinks = document.querySelectorAll(".main-nav .nav-link");
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const viewTriggers = document.querySelectorAll("[data-view]");
  const validViews = ["home", "explore", "careers", "about"];
  const provinceStatsData = window.QCTO_HOME_PROVINCE_STATS || null;
  const exploreProvinceIdToName = {
    "ZA.GT": "Gauteng",
    "ZA.NL": "KwaZulu-Natal",
    "ZA.NP": "Limpopo",
    "ZA.WC": "Western Cape",
    "ZA.EC": "Eastern Cape",
    "ZA.MP": "Mpumalanga",
    "ZA.NW": "North West",
    "ZA.FS": "Free State",
    "ZA.NC": "Northern Cape"
  };
  let selectedHomeProvince = null;
  let selectedExploreProvince = null;
  let lastExploreMapProvinceInput = { province: null, time: 0 };

  function formatStatNumber(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function updateHomeStats(stats) {
    if (!stats) return;

    const statTargets = {
      accreditationRecords: document.getElementById("home-stat-accreditation-records"),
      uniqueOrganisations: document.getElementById("home-stat-unique-organisations"),
      activeAccreditations: document.getElementById("home-stat-active-accreditations"),
      setaQualityPartners: document.getElementById("home-stat-quality-partners")
    };

    Object.entries(statTargets).forEach(([key, target]) => {
      if (target) target.textContent = formatStatNumber(stats[key]);
    });
  }

  function updateHomeProvinceControlState(provinceName) {
    document.querySelectorAll(".home-map .province-bubble").forEach((bubble) => {
      const isSelected = bubble.dataset.province === provinceName;
      bubble.classList.toggle("is-selected", Boolean(provinceName && isSelected));
      bubble.classList.toggle("is-muted", Boolean(provinceName && !isSelected));
      bubble.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    document.querySelectorAll(".home-map .province-legend-item").forEach((item) => {
      const isSelected = item.dataset.province === provinceName;
      item.classList.toggle("is-selected", Boolean(provinceName && isSelected));
      item.classList.toggle("is-muted", Boolean(provinceName && !isSelected));
      item.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function resetHomeProvinceFilter() {
    selectedHomeProvince = null;
    updateHomeStats(provinceStatsData && provinceStatsData.default);
    updateHomeProvinceControlState(null);
    renderHomePartner(selectedHomePartnerIndex);
  }

  function setHomeProvinceFilter(provinceName) {
    if (!provinceStatsData || !provinceName) return;

    if (selectedHomeProvince === provinceName) {
      resetHomeProvinceFilter();
      return;
    }

    const provinceStats = provinceStatsData.provinces && provinceStatsData.provinces[provinceName];
    if (!provinceStats) return;

    selectedHomeProvince = provinceName;
    updateHomeStats(provinceStats);
    updateHomeProvinceControlState(provinceName);
    renderHomePartner(selectedHomePartnerIndex);
  }

  function initHomeProvinceMapInteraction() {
    if (!provinceStatsData) return;

    updateHomeStats(provinceStatsData.default);

    document.querySelectorAll(".home-map .province-bubble").forEach((bubble) => {
      bubble.addEventListener("click", () => {
        setHomeProvinceFilter(bubble.dataset.province);
      });

      bubble.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setHomeProvinceFilter(bubble.dataset.province);
      });
    });

    document.querySelectorAll(".home-map .province-legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        setHomeProvinceFilter(item.dataset.province);
      });
    });
  }

  const homePartners = Array.isArray(window.QCTO_HOME_PARTNERS) ? window.QCTO_HOME_PARTNERS : [];
  const partnerProvinceStats = window.QCTO_PARTNER_PROVINCE_STATS || {};
  const PARTNER_LOGO_MAP = {
    "AGRISETA": "assets/partner-logos/agriseta.png",
    "BANKSETA": "assets/partner-logos/bankseta.jpg",
    "CETA": "assets/partner-logos/ceta.png",
    "CATHSSETA": "assets/partner-logos/cathsseta.png",
    "CATHS SETA": "assets/partner-logos/cathsseta.png",
    "CHIETA": "assets/partner-logos/chieta.png",
    "ETDP SETA": "assets/partner-logos/etdp-seta.png",
    "EWSETA": "assets/partner-logos/ewseta.jpg",
    "FASSET": "assets/partner-logos/fasset.jpg",
    "FOODBEV SETA": "assets/partner-logos/foodbev-seta.png",
    "FOODBEV": "assets/partner-logos/foodbev-seta.png",
    "FP&M SETA": "assets/partner-logos/fpm-seta.svg",
    "FPM SETA": "assets/partner-logos/fpm-seta.svg",
    "HWSETA": "assets/partner-logos/hwseta.png",
    "INSETA": "assets/partner-logos/inseta.png",
    "LGSETA": "assets/partner-logos/lgseta.png",
    "MERSETA": "assets/partner-logos/merseta.png",
    "MICT SETA": "assets/partner-logos/mict-seta.png",
    "MICT": "assets/partner-logos/mict-seta.png",
    "MQA": "assets/partner-logos/mqa.png",
    "NAMB": "assets/partner-logos/namb-dhet.jpg",
    "NATED": "assets/partner-logos/nated.png",
    "PSETA": "assets/partner-logos/pseta.png",
    "QCTO": "assets/partner-logos/qcto.svg",
    "SAPC": "assets/partner-logos/sapc.png",
    "SASSETA": "assets/partner-logos/sasseta.png",
    "SOUTH AFRICAN PHARMACY COUNCIL": "assets/partner-logos/sapc.png",
    "SERVICES SETA": "assets/partner-logos/services-seta.png",
    "SERVICES": "assets/partner-logos/services-seta.png",
    "TETA": "assets/partner-logos/teta.png",
    "W&RSETA": "assets/partner-logos/wrseta.jpg",
    "W&R SETA": "assets/partner-logos/wrseta.jpg",
    "WRSETA": "assets/partner-logos/wrseta.jpg"
  };
  let selectedHomePartnerIndex = 0;
  let homePartnerDragStartX = null;
  let homePartnerDragActive = false;

  function formatPartnerNumber(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function normalisePartnerKey(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");
  }

  function getPartnerProvinceStatKeys(partner) {
    return [...new Set([
      partner.key,
      partner.name,
      partner.shortName,
      partner.partner,
      partner.fallback
    ].map(normalisePartnerKey).filter(Boolean))];
  }

  function getPartnerActiveAccreditations(partner) {
    if (!selectedHomeProvince) return partner.activeAccreditations;

    const provinceStats = partnerProvinceStats[selectedHomeProvince];
    if (!provinceStats) return partner.activeAccreditations;

    const statKeys = getPartnerProvinceStatKeys(partner);
    for (const key of statKeys) {
      if (provinceStats[key]) {
        return provinceStats[key].activeAccreditations;
      }
    }

    return 0;
  }

  function getPartnerLogoSources(partner) {
    const sources = [];
    const isOfficialLogoSource = (source) => {
      const cleanSource = String(source || "");
      return cleanSource && !/google\.com\/s2\/favicons|favicon\.ico/i.test(cleanSource);
    };
    const partnerKeys = [
      partner.key,
      partner.name,
      partner.shortName,
      partner.partner,
      partner.fallback
    ].map(normalisePartnerKey);

    if (Array.isArray(partner.logoSrcs)) {
      sources.push(...partner.logoSrcs);
    }

    partnerKeys.forEach((key) => {
      if (PARTNER_LOGO_MAP[key]) sources.push(PARTNER_LOGO_MAP[key]);
    });

    if (partner.officialLogoSrc) sources.push(partner.officialLogoSrc);

    if (partner.logoSrc) sources.push(partner.logoSrc);

    return [...new Set(sources.filter(isOfficialLogoSource))];
  }

  function loadPartnerLogo(logo, fallback, partner) {
    const sources = getPartnerLogoSources(partner);
    const frame = logo.closest(".partner-logo-frame");

    logo.alt = partner.name ? `${partner.name} logo` : "Quality partner logo";
    logo.loading = "eager";
    logo.decoding = "async";
    logo.hidden = true;
    logo.removeAttribute("src");
    if (frame) {
      frame.classList.remove("logo-wide", "logo-square", "logo-tall", "is-dark-logo");
      if (partner.logoShape) frame.classList.add(`logo-${partner.logoShape}`);
      frame.classList.toggle("is-dark-logo", partner.logoTone === "dark");
    }

    if (fallback) {
      fallback.hidden = false;
      fallback.textContent = partner.fallback || (partner.name || "QP").slice(0, 4).toUpperCase();
    }

    if (!sources.length) return;

    let sourceIndex = 0;
    const requestId = `${partner.key || partner.name || "partner"}-${Date.now()}-${Math.random()}`;
    logo.dataset.logoRequest = requestId;

    const tryNextSource = () => {
      if (logo.dataset.logoRequest !== requestId) return;

      if (sourceIndex >= sources.length) {
        logo.hidden = true;
        if (fallback) fallback.hidden = false;
        return;
      }

      logo.onload = () => {
        if (logo.dataset.logoRequest !== requestId) return;
        logo.hidden = false;
        if (fallback) fallback.hidden = true;
      };

      logo.onerror = () => {
        sourceIndex += 1;
        tryNextSource();
      };

      logo.src = sources[sourceIndex];

      if (logo.complete && logo.naturalWidth > 0) {
        logo.hidden = false;
        if (fallback) fallback.hidden = true;
      }
    };

    tryNextSource();
  }

  function renderHomePartner(index) {
    if (!homePartners.length) return;

    const safeIndex = ((index % homePartners.length) + homePartners.length) % homePartners.length;
    selectedHomePartnerIndex = safeIndex;

    const partner = homePartners[safeIndex];
    const nameTarget = document.getElementById("home-partner-name");
    const descTarget = document.getElementById("home-partner-description");
    const programmesTarget = document.getElementById("home-partner-programmes");
    const activeTarget = document.getElementById("home-partner-active");
    const positionTarget = document.getElementById("home-partner-position");
    const logo = document.getElementById("home-partner-logo");
    const fallback = document.getElementById("home-partner-logo-fallback");

    if (nameTarget) {
      const partnerName = partner.name || partner.key || "Quality Partner";
      nameTarget.textContent = partnerName;
      nameTarget.dataset.partnerFilter = partner.key || partnerName;
      nameTarget.setAttribute("role", "button");
      nameTarget.setAttribute("tabindex", "0");
      nameTarget.setAttribute("title", `Open Explore filtered by ${partnerName}`);
      nameTarget.setAttribute("aria-label", `Open Explore filtered by ${partnerName}`);
    }
    if (descTarget) descTarget.textContent = partner.description || "Quality assured partner in the accredited provider dataset.";
    if (programmesTarget) programmesTarget.textContent = formatPartnerNumber(partner.accreditedProgrammes);
    if (activeTarget) activeTarget.textContent = formatPartnerNumber(getPartnerActiveAccreditations(partner));
    if (positionTarget) positionTarget.textContent = `${safeIndex + 1} of ${homePartners.length}`;

    if (fallback) fallback.textContent = partner.fallback || (partner.name || "QP").slice(0, 4).toUpperCase();

    if (logo) {
      loadPartnerLogo(logo, fallback, partner);
    }
  }

  function moveHomePartner(direction) {
    if (!homePartners.length) return;
    renderHomePartner(selectedHomePartnerIndex + direction);
  }

  function initHomePartnerCarousel() {
    if (!homePartners.length) return;

    const carousel = document.getElementById("home-partner-carousel");
    if (!carousel || carousel.dataset.qctoPartnerReady === "true") return;

    carousel.dataset.qctoPartnerReady = "true";

    const prev = carousel.querySelector(".partner-prev");
    const next = carousel.querySelector(".partner-next");

    if (prev) prev.addEventListener("click", () => moveHomePartner(-1));
    if (next) next.addEventListener("click", () => moveHomePartner(1));

    const partnerNameTarget = document.getElementById("home-partner-name");
    const openCurrentPartnerOnExplore = () => {
      const currentPartner = homePartners[selectedHomePartnerIndex];
      const partnerFilter = currentPartner ? (currentPartner.key || currentPartner.name || currentPartner.shortName || "") : "";
      if (partnerFilter) goToExploreWithFilters({ partner: partnerFilter });
    };

    if (partnerNameTarget && partnerNameTarget.dataset.qctoPartnerClickReady !== "true") {
      partnerNameTarget.dataset.qctoPartnerClickReady = "true";
      partnerNameTarget.addEventListener("click", openCurrentPartnerOnExplore);
      partnerNameTarget.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openCurrentPartnerOnExplore();
      });
    }

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveHomePartner(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveHomePartner(1);
      }
    });

    carousel.addEventListener("pointerdown", (event) => {
      homePartnerDragStartX = event.clientX;
      homePartnerDragActive = true;
      carousel.classList.add("is-dragging");
    });

    carousel.addEventListener("pointerup", (event) => {
      if (!homePartnerDragActive || homePartnerDragStartX === null) return;

      const deltaX = event.clientX - homePartnerDragStartX;
      homePartnerDragStartX = null;
      homePartnerDragActive = false;
      carousel.classList.remove("is-dragging");

      if (Math.abs(deltaX) < 38) return;
      moveHomePartner(deltaX < 0 ? 1 : -1);
    });

    carousel.addEventListener("pointercancel", () => {
      homePartnerDragStartX = null;
      homePartnerDragActive = false;
      carousel.classList.remove("is-dragging");
    });

    renderHomePartner(0);
  }

  function updateExploreStats(stats) {
    if (!stats) return;

    const statTargets = {
      accreditationRecords: document.getElementById("explore-stat-accreditation-records"),
      uniqueOrganisations: document.getElementById("explore-stat-unique-organisations"),
      activeAccreditations: document.getElementById("explore-stat-active-accreditations"),
      setaQualityPartners: document.getElementById("explore-stat-quality-partners")
    };

    Object.entries(statTargets).forEach(([key, target]) => {
      if (target) target.textContent = formatStatNumber(stats[key]);
    });
  }

  function updateExploreProvinceControlState(provinceName) {
    const hasProvince = Boolean(provinceName);
    const exploreMap = document.querySelector(".explore-map");
    if (exploreMap) exploreMap.classList.toggle("has-selection", hasProvince);

    document.querySelectorAll(".explore-map .explore-province-shape").forEach((shape) => {
      const isSelected = shape.dataset.province === provinceName;
      shape.classList.toggle("is-selected", Boolean(provinceName && isSelected));
      shape.classList.toggle("is-muted", Boolean(provinceName && !isSelected));
      shape.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    document.querySelectorAll(".explore-map .explore-legend-item").forEach((item) => {
      const isSelected = item.dataset.province === provinceName;
      item.classList.toggle("is-selected", Boolean(provinceName && isSelected));
      item.classList.toggle("is-muted", Boolean(provinceName && !isSelected));
      item.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    getExploreEmbeddedProvincePaths().forEach((shape) => {
      const shapeProvince = shape.dataset.province;
      const isSelected = shapeProvince === provinceName;
      shape.style.opacity = provinceName && !isSelected ? "0.28" : "";
      shape.style.filter = provinceName && !isSelected ? "grayscale(1)" : "";
      shape.style.stroke = provinceName && isSelected ? "#ffffff" : "";
      shape.style.strokeWidth = provinceName && isSelected ? "8" : "";
      shape.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    syncExploreEmbeddedMapState(provinceName);
  }

  function getExploreEmbeddedProvincePaths() {
    const mapObject = document.querySelector(".explore-map .sa-province-object");
    try {
      const mapDocument = mapObject && mapObject.contentDocument;
      return mapDocument ? Array.from(mapDocument.querySelectorAll("path[data-id]")) : [];
    } catch (error) {
      return [];
    }
  }

  function syncExploreEmbeddedMapState(provinceName) {
    const mapObject = document.querySelector(".explore-map .sa-province-object");
    if (!mapObject || !mapObject.contentWindow) return;

    mapObject.contentWindow.postMessage({
      type: "qcto-explore-province-state",
      province: provinceName || ""
    }, "*");
  }

  function syncExploreProvinceSelect(provinceName) {
    const provinceSelect = document.getElementById("explore-filter-province");
    if (provinceSelect) provinceSelect.value = provinceName || "";
  }

  function resetExploreProvinceFilter(options = {}) {
    if (!options.keepCityProvinceFlag) {
      exploreProvinceAutoSelectedByCity = false;
    }
    selectedExploreProvince = null;
    updateExploreStats(provinceStatsData && provinceStatsData.default);
    updateExploreProvinceControlState(null);
    syncExploreProvinceSelect(null);
    updateExploreCityTownOptions("");

    if (!options.skipTableFilter) {
      applyExploreTableFilters({ provinceOverride: "" });
    }
  }

  function setExploreProvinceFilter(provinceName, options = {}) {
    if (!options.autoProvince) {
      exploreProvinceAutoSelectedByCity = false;
    }
    if (!provinceStatsData || !provinceName) return;

    const shouldToggle = options.toggle !== false;
    if (shouldToggle && selectedExploreProvince === provinceName) {
      resetExploreProvinceFilter();
      return;
    }

    const provinceStats = provinceStatsData.provinces && provinceStatsData.provinces[provinceName];
    if (!provinceStats) return;

    selectedExploreProvince = provinceName;
    updateExploreStats(provinceStats);
    updateExploreProvinceControlState(provinceName);
    syncExploreProvinceSelect(provinceName);
    updateExploreCityTownOptions(provinceName);

    if (!options.skipTableFilter) {
      applyExploreTableFilters({ provinceOverride: provinceName });
    }
  }

  function handleExploreMapProvinceInput(provinceName) {
    lastExploreMapProvinceInput = { province: provinceName, time: Date.now() };
    setExploreProvinceFilter(provinceName);
  }

  function initExploreProvinceMapInteraction() {
    if (!provinceStatsData) return;

    updateExploreStats(provinceStatsData.default);

    const provinceMap = document.querySelector(".explore-map .sa-map.provinces");
    if (provinceMap) {
      provinceMap.addEventListener("click", (event) => {
        const provinceTarget = event.target.closest && event.target.closest(".explore-province-shape[data-province]");
        if (!provinceTarget) return;
        setExploreProvinceFilter(provinceTarget.dataset.province);
      });
    }

    const provinceObject = document.querySelector(".explore-map .sa-province-object");
    const initEmbeddedMap = () => {
      getExploreEmbeddedProvincePaths().forEach((shape) => {
        const provinceName = exploreProvinceIdToName[shape.dataset.id];
        if (!provinceName || shape.dataset.qctoReady === "true") return;

        shape.dataset.province = provinceName;
        shape.dataset.qctoReady = "true";
        shape.setAttribute("role", "button");
        shape.setAttribute("focusable", "false");
        shape.setAttribute("aria-label", "Filter by " + provinceName);
        shape.setAttribute("aria-pressed", "false");
        shape.style.cursor = "pointer";
        shape.style.outline = "none";
        shape.style.pointerEvents = "all";
        shape.style.transition = "opacity 0.18s ease, filter 0.18s ease, stroke-width 0.18s ease";

        shape.addEventListener("mousedown", (event) => {
          event.preventDefault();
        });

        shape.addEventListener("click", () => {
          handleExploreMapProvinceInput(provinceName);
        });

        shape.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          handleExploreMapProvinceInput(provinceName);
        });
      });

      updateExploreProvinceControlState(selectedExploreProvince);
    };

    if (provinceObject) {
      provinceObject.addEventListener("load", initEmbeddedMap);
      initEmbeddedMap();
    }

    window.addEventListener("message", (event) => {
      if (!event.data || event.data.type !== "qcto-explore-province-click") return;
      if (
        event.data.province === lastExploreMapProvinceInput.province &&
        Date.now() - lastExploreMapProvinceInput.time < 250
      ) {
        return;
      }

      setExploreProvinceFilter(event.data.province);
    });

    document.querySelectorAll(".explore-map .explore-province-shape").forEach((shape) => {
      shape.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setExploreProvinceFilter(shape.dataset.province);
      });
    });

    document.querySelectorAll(".explore-map .explore-legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        setExploreProvinceFilter(item.dataset.province);
      });
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function getEmailLinkHtml(value) {
    const raw = String(value || "").trim();
    if (!raw || raw.toLowerCase() === "not specified") return escapeHtml(raw || "Not specified");

    const firstEmail = raw
      .split(/[;,\s]+/)
      .map((item) => item.trim())
      .find((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));

    if (!firstEmail) return escapeHtml(raw);

    return `<a class="explore-email-link" href="mailto:${escapeAttribute(firstEmail)}">${escapeHtml(raw)}</a>`;
  }

  function getStatusClass(status) {
    const clean = String(status || "").toLowerCase();

    if (clean.includes("expired")) return "status-expired";
    if (clean === "active" || clean.startsWith("active ")) return "status-active";

    return "status-neutral";
  }

  let exploreTableInitialised = false;
  let exploreTableLoading = false;
  let exploreTableScrollBound = false;
  let exploreTableAllRows = [];
  let exploreTableRows = [];
  let exploreRowsLoaded = 0;
  let exploreSearchIndex = [];
  let homeSearchIndex = [];
  let careerSearchIndex = [];
  let exploreTableDataLoadPromise = null;
  let homeSearchIndexLoadPromise = null;
  let exploreSearchTimer = null;
  let homeSearchTimer = null;
  let careerSearchTimer = null;
  let exploreProvinceAutoSelectedByCity = false;
  let selectedExploreQualificationPrefix = "";
  let selectedExploreSearchMode = "all";
  let pendingExploreFilters = null;
  const EXPLORE_TABLE_BATCH_SIZE = 200;
  const EXPLORE_SEARCH_MIN_LENGTH = 1;
  const EXPLORE_SEARCH_SUGGESTION_LIMIT = 4;
  const HOME_SEARCH_MIN_LENGTH = 1;
  const HOME_SEARCH_SUGGESTION_LIMIT = 4;
  const CAREER_SEARCH_MIN_LENGTH = 1;
  const CAREER_SEARCH_SUGGESTION_LIMIT = 4;

  const CAREER_FAMILY_CAREERS = {
  "Engineering, Manufacturing & Trades": [
    "Adhesive Binding Machine Operator",
    "Aerial Chainsaw Operator",
    "Aids to Navigation Technician",
    "Aircraft Maintenance Mechanic",
    "Annealing Operator",
    "Apparel and Related Manufacturing Machine Mechanic",
    "Architectural Draughtsperson",
    "Armature Winder",
    "Asphalt Tester",
    "Automotive Technician",
    "Avionics Mechanic",
    "Avionics Mechanician",
    "Basic Kitchen Appliance Repairer",
    "Bath Operator",
    "Beam House Machine Operator",
    "Beaming and Sizing Machine Operator",
    "Bicycle Mechanic",
    "Bicycle Repairer",
    "Bicycle Special Components Repairer",
    "Bitumen Spray Equipment Operator",
    "Bituminous Binders Tester",
    "Blacksmith",
    "Blow Moulding Machine Setter",
    "Boilermaker",
    "Braiding Machine Operator",
    "Brush Hand",
    "Chainsaw Operator",
    "Checkout Operator",
    "Chemical Engineering Technician",
    "Chemical Laboratory Analyst",
    "Chemical Manufacturing Technician",
    "Chemical Plant Controller",
    "Chemical Production Machine Operator",
    "Chemist (Surface Coatings Technologist)",
    "Civil Engineering Technician",
    "CNC Milling Machinist",
    "CNC Turning Machinist",
    "Coldset Rotary Offset Lithography Printing Technician",
    "Coldset Rotary Offset Lithography Technician",
    "Concrete Tester",
    "Continuous Bucket Trencher Operator",
    "Corrugated Board Manufacturing Machine Minder",
    "Craft Bookbinding Technician",
    "Creeling and Warping Machine Operator",
    "Diamond and Gemstone Setter",
    "Diamond Cutter",
    "Domestic Water and Drainage Pipe Repairer",
    "Draughtsperson (Piping Draught Person)",
    "Dry Kiln Operator",
    "Dry Mill Operator",
    "EDM Plunge Operator",
    "EDM Wire Operator",
    "Electrician",
    "Electronic Pre-press Gravure Technician",
    "Engine Workshop Maintenance Mechanic",
    "Engineering Studies",
    "Environmental Officer",
    "Extrusion Machine Setter",
    "Face Shovel Operator",
    "First-line Production Supervisor",
    "Fitter and Turner",
    "Folding Machine Operator",
    "Gathering Arm Loader Operator",
    "General Residential Repairer",
    "Geomatics Officer",
    "Glass Forming Operator",
    "Glass Melt Operator",
    "Glass Process Operator",
    "Goldsmith",
    "Gravure Cylinder Preperation Technician",
    "Guillotine Operator",
    "Head Saw Doctor",
    "Heatset Rotary Offset Lithography Technician",
    "Heavy Duty Clutch and Brake Repairer",
    "Heavy Duty Drive Train Repairer (Vehicle Transmission Mechanic)",
    "Heavy Duty Hydraulic and Pneumatic Repairer",
    "Heavy Duty Suspension Repairer",
    "Heavy Equipment Mechanic",
    "Hot Mix Asphalt Paving Machine Operator",
    "Injection Moulding Machine Setter",
    "Instrument Mechanician",
    "Lathe Operator",
    "Lift Mechanic",
    "Loader Operator",
    "Log Yard Operator",
    "Lubrication Equipment Mechanic",
    "Major Domestic Appliance Repairer",
    "Man-made Fibre Extrusion Machine Operator",
    "Man-made Fibre Texturing Production Machine Operator",
    "Manufacturing Production Process Controller",
    "Master Toolmaker (Purpose Built Machine Master Toolmaker)",
    "Mechanical Engineering Technician",
    "Mechanical Fitter",
    "Mechanised Hard Cover Bookbinding Technician",
    "Mechanised Soft-Cover Bookbinding Technician",
    "Mechatronics Technician",
    "Melter",
    "Metal Machinist",
    "Metal Manufacturing",
    "Metal Manufacturing Finishing Process Controller",
    "Metal Manufacturing Material Preparation Process Controller",
    "Metal Manufacturing Rolling Process Controller",
    "Miller",
    "Milling Machine Operator",
    "Millwright",
    "Moulder",
    "Multi-Disciplinary Drawing: Office Practice",
    "Packaging Manufacturing Machine Minder",
    "Packaging Rotary Printing and Re-reeling Flexographic Machine Minder",
    "Paintless Dent Remover",
    "Panel Beater",
    "Panelbeater",
    "Paper Process Controller",
    "Paper Sheetfed offset Lithography Technician",
    "Patternmaker",
    "Paving Screed Operator",
    "Plant Operator",
    "Plastics Manufacturing Machine Operator",
    "Plastics Manufacturing Machine Setter",
    "Pothole Repair Person",
    "Printing Machinist",
    "Production Operator",
    "Production Process Controller",
    "Production Process Machine Operator and Assembler",
    "Production Supervisor",
    "Propeller Workshop Maintenance Mechanic",
    "Pulp Process Controller",
    "Radar Mechanic",
    "Radio Operator",
    "Reach Stacker C48 Operator",
    "Refrigerant Safe Handling",
    "Refrigeration Mechanic",
    "Rigger",
    "Roll Label Machine Technician",
    "Rotary Printing and Re-reeling Flexographic Machine Technician",
    "Rotary Printing And Re-Reeling Gravure Machine Technician",
    "Saddle Stitching Machine Operator",
    "Saw Doctor",
    "Saw Filer",
    "Sewing Machine Mechanic Operator",
    "Sewing Machine Mechanic Repairer",
    "Sheet Metal Worker",
    "Sheetfed Lithography Technician",
    "Side Loader Container C56 Operator",
    "Sideboom Operator",
    "Skid Steer Loader Operator",
    "Small Domestic Appliance Repairer",
    "Small Engine Mechanic",
    "Specialised Chainsaw Operator",
    "Spout Operator",
    "Structural Plater",
    "Surface Grinding Operator",
    "Telecommunication Line Mechanic",
    "Tissue Backstand Operator",
    "Tissue Converter Machine Operator",
    "Tooling CAD Operator",
    "Tooling Machinist",
    "Toolmaker",
    "Tractor Mechanic",
    "Tractor Mechanic Assistant",
    "Tractor Operator",
    "Unitary Air Conditioning Installer",
    "Warping Machine Operator",
    "Weapon Systems Mechanic",
    "Welder",
    "Wheel Balancer",
    "Workshop Tool Assistant"
  ],
  "Business, Administration & Management": [
    "Administrative Attache",
    "Anti Money Laundering Analyst",
    "Assistant Baker",
    "Assistant Baker (Fermented Dough Products)",
    "Assistant Baker: Fermented Dough Products",
    "Assistant Handyperson",
    "Business Administrator",
    "Cash Office Clerk",
    "Company Secretary",
    "Conflict Management",
    "Dispatching and Receiving Clerk",
    "Events Coordinator",
    "Heavy Duty Workshop Assistant",
    "HR Administrator",
    "Legislation Administrative Assistant",
    "Library Assistant",
    "Make-Up Consultant",
    "Management Accountant",
    "Management Assistant",
    "Manufacturing Workshop Assistant",
    "Market Research Analyst",
    "Marketing Coordinator",
    "Marketing Management",
    "Methods Analyst",
    "New Venture",
    "New Venture Creation",
    "Office Administrator",
    "Office Supervisor",
    "Perishable Goods Department Coordinator",
    "Physical Asset Practitioner",
    "Planner",
    "Procurement Officer",
    "Project Coordinator",
    "Public Administration Officer",
    "Purchasing Officer",
    "Quality Assurer",
    "Quality Controller",
    "Quality Inspector",
    "Quality Manager",
    "Quality Test Automator",
    "Recruitment Manager",
    "Retirement Fund Administrator",
    "Risk Practitioner",
    "Small Business Consultant",
    "Supply and Distribution Manager",
    "Survey Interviewer",
    "Work Place Preparedness and Risk Control Assistant-Communicable & Other occupational Diseases",
    "Work Place Preparedness and Risk Control Officer- Communicable & Other occupational Diseases"
  ],
  "ICT & Data": [
    "Advanced Spatial Intelligence Data Scientist",
    "AI Software Developer",
    "C++ Programmer",
    "Cloud Administrator",
    "Computer and Digital Support Assistant",
    "Computer Technician",
    "Cybersecurity Analyst",
    "Data Analyst",
    "Data and Telecommunications Cabler",
    "Electronic Equipment Mechanician",
    "Extended Reality Developer",
    "Front-End Web Designer",
    "Hypertext Markup Language (HTML) Programmer",
    "IT Support Technician",
    "Java Programmer",
    "JavaScript Programmer",
    "Laptop Repairer",
    "Mobile Device Repairer",
    "Mobile Device Technician",
    "Mobile Phone Repairer",
    "Network Administrator",
    "Python Developer",
    "Radiotrician",
    "Software Developer",
    "Software Engineer",
    "Software Tester",
    "Spatial Intelligence Data Scientist",
    "Technopreneur",
    "Telecommunications Cable Jointer",
    "Telecommunications Specialist",
    "Wearables"
  ],
  "Retail, Sales & Customer Service": [
    "Auctioneer",
    "Buyer",
    "Contact Centre Manager",
    "Franchise Manager",
    "Health Products Sales Associate",
    "Retail Buyer",
    "Retail Chain Store Manager",
    "Retail Manager: Retail Store Manager",
    "Retail Sales Advisor",
    "Retail Store Manager",
    "Retail Supervisor",
    "Sales Representative",
    "Service Station Attendant",
    "Shelf Filler",
    "Small Retail Business Owner",
    "Store Person"
  ],
  "Transport, Logistics & Supply Chain": [
    "Aircraft Structures Technician",
    "Aircraft Structures Worker",
    "Airline Ground Crew",
    "Bus Driver",
    "Clearing and Forwarding Agent",
    "Commercial Diver",
    "Customs Compliance Manager",
    "Deck Hand (Able Seaman)",
    "Dock Master",
    "Drone Pilot",
    "Dump Truck Operator",
    "Engine Able Seafarer",
    "Forklift Operator",
    "Fuel Pipeline Controller",
    "Logistics Clerk",
    "Marine Electro-Technical Officer",
    "Marine Electro-Technical Rating",
    "Railway Safety Inspector",
    "Railway Signal Operator (Functional Yard Operator)",
    "Railway Signalling Assembler and Wirer",
    "Railway Signalling Installer",
    "Railway Track Constructor",
    "Railway Track Supervisor",
    "Road Traffic Safety Officer",
    "Road Transport Manager",
    "RPAS Technician",
    "Service Truck Operator",
    "Straddle Carrier C49 Operator",
    "Supply Chain Practitioner",
    "Traffic Officer",
    "Train Control Officer",
    "Train Driver",
    "Transit Protection Driver",
    "Truck Driver",
    "Vehicle Damage Quantifier"
  ],
  "Health, Safety & Community Services": [
    "BodyTalk Practitioner",
    "Care Worker",
    "Civic and Health Peer Education",
    "Community / Religious Worker",
    "Community Counsellor",
    "Community Development Practitioner",
    "Covid-19 Vaccine Demand Creation and Community Advocacy Practitioner",
    "Crystal Healing Practitioner",
    "Disability Attendant",
    "Emergency Services Responder",
    "Emotional Freedom Techniques (EFT) Tapping Practitioner",
    "Fire Alarm Commissioner",
    "Fire Alarm Designer",
    "Fire Alarm Installer",
    "Fire Alarm Technician",
    "Health Information Manager",
    "Health Products Information Officer",
    "Health Products Marketing Associate",
    "Health Promotion Officer",
    "Heart Resonance Practitioner",
    "Medical Secretary",
    "Metaphysics Practitioner",
    "Mine Occupational Health and Safety Representative",
    "Mortician",
    "Occupational Health and Safety Assistant",
    "Occupational Health and Safety Officer",
    "Occupational Health and Safety Practitioner",
    "Occupational Screening Spirometry",
    "Orientation and Mobility Practitioner",
    "Pharmacist's Assistant (Basic)",
    "Pharmacist's Assistant (Post Basic)",
    "Pharmacy Support Worker",
    "Reiki Practitioner",
    "Safety",
    "Safety Inspector (Forestry and Related Industries Safety Health and Environment Officer)",
    "Social Counselling Support Worker",
    "Social Counselling Worker",
    "Weft Knitting Machine Operator"
  ],
  "Hospitality, Tourism & Food Services": [
    "Abattoir Foreman",
    "Abattoir Process Worker",
    "Abattoir Supervisor",
    "Baking and Confectionery Operator",
    "Basic Food Safety Complier",
    "Butter Maker",
    "Chef",
    "Condensed Liquid Dairy Products Maker",
    "Cook",
    "Cottage Cheesemaker",
    "Dairy Unit Manager",
    "Dried Dairy Products Maker",
    "Fermented Dairy Products Maker",
    "Fishing Hand",
    "Food and Beverage Packaging Operator",
    "Food Handler",
    "Fresh Dairy Products Maker",
    "Grain Depot Manager",
    "Hospitality Supervisor",
    "Ice Cream Products Maker",
    "Kitchen Hand",
    "Liquid Dairy Reception Operator",
    "Liquid Long Life Dairy Products Maker",
    "Meat Processing Operator",
    "Process Machine Operator",
    "Processed Cheese Maker",
    "Red Meat De-Boner",
    "Ripened Cheesemaker",
    "Sugar Processing Controller",
    "Sugar Processing Machine Operator",
    "Tourist Information Officer",
    "Travel Consultant",
    "Winemaker's Assistant"
  ],
  "Finance, Banking & Insurance": [
    "Bank Customer Services Clerk",
    "Bank Teller",
    "Banknote Processor",
    "Bookkeeper",
    "Business Banker",
    "Credit or Loans Officer",
    "Finance Administrator",
    "Financial Advisor",
    "Foreign Exchange Officer",
    "Fraud Examiner",
    "Insurance Advisor",
    "Insurance Underwriter",
    "Internal Auditor",
    "Management Accounting Officer",
    "Management Accounting Practitioner",
    "Management Accounting Specialist",
    "Municipal Finance Manager",
    "Payroll Administrator",
    "Tax Technician"
  ],
  "Agriculture, Environment & Natural Resources": [
    "Agricultural Worker",
    "Collaborative Recycler",
    "Crop Produce Analyst",
    "E-Waste Operations Controller",
    "Eco Ranger",
    "Fertilizer Manufacturing",
    "Forestry Incident Investigator",
    "Forestry Production and Operations Foreman",
    "Forestry Production Foreman",
    "Forestry SHE Representative",
    "Forestry Technician",
    "Gardener",
    "Grain Grader",
    "Hot Water System Installer (Heat Pump Installer)",
    "Hot Water System Installer (Solar Water Installer)",
    "Hot- and Cold-Water Systems Installer",
    "Industrial Water Process Controller",
    "Materials Recycler (Paper and Packaging Collector)",
    "Nursery Person (Garden Centre Supervisor)",
    "Nurseryperson (Nursery Supervisor)",
    "Orchard and Vineyard Foreman",
    "Pest Management Officer",
    "Production or Operations Supervisor (Forestry): (Forestry Production Supervisor)",
    "Self-employed re-cycling materials collector",
    "Small Re-cycling Business Owner",
    "Soils",
    "Viticulture Worker",
    "Water and Sanitation Coordinator",
    "Water Cart Operator",
    "Water Infrastructure Manager",
    "Water Process Controller",
    "Water Reticulation Practitioner",
    "Water Works Management Practitioner",
    "Wet Mill Operator"
  ],
  "Education, Training & Human Development": [
    "Aalim",
    "Adult Literacy Teacher",
    "Career Development Officer",
    "Civic and Soft Skills",
    "Driving Instructor",
    "ECD Practitioner",
    "Equestrian Coach or Instructor Level 1",
    "Fitness Instructor",
    "Foundational Learning Competence",
    "Group Fitness Instructor",
    "Imaam",
    "Individual Fitness Instructor",
    "Muallim",
    "Occupational Trainer",
    "Principal Real Estate Agent",
    "Professional Principal Executive Officer",
    "School Principal (School Manager)",
    "Sport Talent Scout",
    "Training and Development Practitioner",
    "Training Facilitator",
    "Workplace Essential Skills",
    "Workplace Preparation"
  ],
  "Media, Creative & Communication": [
    "Advertiser",
    "Animation Artist",
    "Apparel Pattern Designer Assistant",
    "Art & Design Assistant",
    "Assistant Life Coach: Communication",
    "Binder and Finisher",
    "Business Development Officer",
    "Electronic Originator",
    "Furniture Designer",
    "Garden Designer",
    "Innovation Practitioner",
    "Interior Decorator",
    "Journalist",
    "Landscape Designer",
    "Media Production Assistant",
    "Motion Graphics Designer",
    "Performing Artist",
    "Popular Music: Composition",
    "Popular Music: Studio Work",
    "Proof reader",
    "Public Relations Officer",
    "Sound Operator",
    "Text Editor",
    "Visual Merchandiser"
  ],
  "Legal, Security & Public Services": [
    "Access Control Officer",
    "Compliance Officer",
    "Detective",
    "Diplomat",
    "Family Law Practitioner",
    "General Manager Public Service",
    "Governance Officer",
    "Government Official",
    "Immigration Officer",
    "Labour Inspector",
    "Legal Secretary",
    "Magazine Master",
    "Military Police Official",
    "Non-Commissioned Police Official",
    "Paralegal",
    "Parole Board Member (Offender Placement and Release Practitioner)",
    "Patrol Officer",
    "Refugee Status Determination Officer",
    "Security Officer",
    "Trade Union Official",
    "Trustee",
    "Water Regulation Practitioner"
  ],
  "Beauty, Wellness & Personal Care": [
    "Barber",
    "Beauty Practitioner",
    "Beauty Therapist",
    "Body Massage Therapist",
    "Body Therapist",
    "Chemical Hair Reformation Attendant",
    "Eye Grooming Therapist",
    "Hair and Scalp Treatment Attendant",
    "Hair Colouring Attendant",
    "Hair Cutting Attendant",
    "Hairdresser",
    "Hairstylist",
    "Nail Therapist",
    "Temporary Hair Removal Therapist"
  ],
  "Construction, Property & Facilities": [
    "Bamboo Floor Finisher",
    "Carpet Floor Finisher",
    "Cleaner",
    "Commercial Housekeeper",
    "Construction Artisan",
    "Cutting Machine Maintenance Assistant",
    "Fabricated Glazing Solution Installer",
    "Facilities Manager",
    "General Garden Maintenance Worker",
    "General Glazing Installer",
    "Insulation Installer",
    "Joiner",
    "Laundry Worker",
    "Maintenance Planner",
    "Physical Asset Manager",
    "Plumber",
    "Pre-Fabricated Glazing Solution Installer",
    "Real Estate Agent",
    "Refractory Mason",
    "Room Attendant",
    "Routine Road Maintenance Manager",
    "Sewing Machine Maintenance and Repair Technician Assistant",
    "Specialised Glazing Solution Installer",
    "Stonemason"
  ],
  "Mining, Energy & Utilities": [
    "Energy Kinesiology Practitioner",
    "Energy Performance Certificate (EPC) Practitioner",
    "Fossil Power Plant Process Controller",
    "Hydrogen Fuel Cell System Practitioner",
    "Mine Overseer",
    "Miner",
    "Mining Operator",
    "Natural Energy Healing Practitioner",
    "Nuclear Power Plant Process Controller",
    "Renewable Energy Workshop Assistant",
    "Solar PV Installer",
    "Surface Blaster",
    "Surface Safe Declarer",
    "Underground Hardrock Safe Declarer",
    "Underground Hardrock Support Installer",
    "Wind Turbine Service Technician"
  ],
  "Textiles, Clothing, Furniture & Wood": [
    "Apparel Pattern Maker and Grader",
    "Basic Furniture Upholster",
    "Clothing Production",
    "Footwear Closing Production Machine Operator",
    "Footwear Cutting Machine Operator",
    "Footwear Finishing Production Machine Operator",
    "Furniture Maker",
    "Furniture Upholsterer",
    "Garment Pattern Development Assistant",
    "Handicraft Footwear Maker",
    "Handicraft Frame Weaver",
    "Handicraft Knitter",
    "Handicraft Sewer",
    "Leather Tanning Machine Operator",
    "Non-woven Thermo-Bonding Textile Production Machine Operator",
    "Pattern Grader",
    "Pattern Making Assistant",
    "Ringframe Spinning and Yarn Packaging Machine Operator",
    "Rotor Spinning and Yarn Packaging Machine Operator",
    "Seamstress",
    "Sewing Machine Operator",
    "Speciality Yarn Assembly Machine Operator",
    "Textile",
    "Textile Blowroom and Carding Machine Operator",
    "Textile Carding and Drawframe Machine Operator",
    "Textile Drawframe and Speedframe Machine Operator",
    "Textile Dry Finishing and Heat Setting Machine Operator",
    "Textile Dry Fringing Machine Operator",
    "Textile Dry Product Surface Preparation Machine",
    "Textile Sliver Lap",
    "Textile Wet Process Coating Machine Operator",
    "Textile Wet Process Dyeing Machine Operator",
    "Textile Wet Process Preparation Machine Operator",
    "Textile Wet Process Printing Machine Operator",
    "Textile Wet Product Finishing Machine Operator",
    "Textiles",
    "Tissue Packaging Attendant",
    "Tufting Machine Operator",
    "Upholstery Frame Preparer",
    "Warp Knitting Machine Operator",
    "Weaving Machine Operator",
    "Wood Processing Machine Operator"
  ]
};

  const CAREER_FAMILY_META = {
  "Engineering, Manufacturing & Trades": {
    "icon": "gear",
    "description": "Build, install, repair and maintain technical, trade and production systems."
  },
  "Business, Administration & Management": {
    "icon": "briefcase",
    "description": "Coordinate offices, projects, teams and organisational operations."
  },
  "ICT & Data": {
    "icon": "monitor",
    "description": "Work with software, data, cloud, networks and digital systems."
  },
  "Retail, Sales & Customer Service": {
    "icon": "chart",
    "description": "Serve customers, support sales and manage retail/service experiences."
  },
  "Transport, Logistics & Supply Chain": {
    "icon": "route",
    "description": "Move people and goods, coordinate transport and support supply chains."
  },
  "Health, Safety & Community Services": {
    "icon": "heart",
    "description": "Support healthcare, safety, welfare and community services."
  },
  "Hospitality, Tourism & Food Services": {
    "icon": "cloche",
    "description": "Create guest experiences in food, travel, tourism and hospitality."
  },
  "Finance, Banking & Insurance": {
    "icon": "chart",
    "description": "Work with financial records, banking, insurance and business controls."
  },
  "Agriculture, Environment & Natural Resources": {
    "icon": "gear",
    "description": "Work with farming, natural resources, water, waste and environmental care."
  },
  "Education, Training & Human Development": {
    "icon": "user",
    "description": "Support learning, training, development and human capability."
  },
  "Media, Creative & Communication": {
    "icon": "pencil",
    "description": "Create, edit, design and communicate content and ideas."
  },
  "Legal, Security & Public Services": {
    "icon": "book",
    "description": "Support legal, public, safety, security and regulatory services."
  },
  "Beauty, Wellness & Personal Care": {
    "icon": "user",
    "description": "Provide grooming, wellness, hair, beauty and personal care services."
  },
  "Construction, Property & Facilities": {
    "icon": "tools",
    "description": "Build, maintain and manage property, buildings and facilities."
  },
  "Mining, Energy & Utilities": {
    "icon": "gear",
    "description": "Support mining, energy, water and utility operations."
  },
  "Textiles, Clothing, Furniture & Wood": {
    "icon": "tools",
    "description": "Produce textiles, garments, leather, furniture and wood-based products."
  }
};

  const ROLE_NQF_LOOKUP = {
  "Hairdresser": "NQF Levels 4 & Not specified",
  "Retail Sales Advisor": "NQF Level 3",
  "Kitchen Hand": "NQF Level 3",
  "Chef": "NQF Levels 4 & 5",
  "Food Handler": "NQF Level 2",
  "Cook": "NQF Levels 4 & Not specified",
  "Bus Driver": "NQF Level 3",
  "Truck Driver": "NQF Level 3",
  "Tax Technician": "NQF Levels 3, 6 & 8",
  "Insurance Advisor": "NQF Level 5",
  "Occupational Health and Safety Officer": "NQF Level 4",
  "New Venture": "NQF Level 2",
  "Office Administrator": "NQF Levels 3 - 7",
  "Contact Centre Manager": "NQF Level 5",
  "Office Supervisor": "NQF Level 5",
  "Project Coordinator": "NQF Level 5",
  "Small Business Consultant": "NQF Level 5",
  "Agricultural Worker": "NQF Levels 2 - 5",
  "Software Engineer": "NQF Level 6",
  "AI Software Developer": "NQF Level 5",
  "Computer Technician": "NQF Level 5",
  "Technopreneur": "NQF Level 4",
  "Cybersecurity Analyst": "NQF Levels 4 - 7",
  "Data Analyst": "NQF Level 5",
  "Innovation Practitioner": "NQF Level 4",
  "Supply Chain Practitioner": "NQF Levels 5, 6 & 7",
  "Paralegal": "NQF Level 5",
  "Environmental Officer": "NQF Levels 5, 6 & 7",
  "Real Estate Agent": "NQF Level 4",
  "Conflict Management": "NQF Level 5",
  "Mortician": "NQF Levels 3, 5 & 6",
  "Emergency Services Responder": "NQF Levels 2, 3 & 4",
  "Care Worker": "NQF Levels 2 - 5",
  "Safety": "NQF Level 5",
  "Aircraft Maintenance Mechanic": "NQF Levels 5 & Not specified",
  "Crop Produce Analyst": "NQF Level 5",
  "Training and Development Practitioner": "NQF Level 5",
  "Construction Artisan": "NQF Levels 1 - Not specified",
  "Plumber": "NQF Levels 3, 4 & Not specified",
  "Supply and Distribution Manager": "NQF Level 7",
  "Trade Union Official": "NQF Level 4",
  "Adult Literacy Teacher": "NQF Level 5",
  "Training Facilitator": "NQF Levels 4, 5 & 6",
  "ECD Practitioner": "NQF Levels 1, 4 & 5",
  "Retail Supervisor": "NQF Level 4",
  "Dispatching and Receiving Clerk": "NQF Level 3",
  "Retail Chain Store Manager": "NQF Level 5",
  "Retail Buyer": "NQF Level 5",
  "Visual Merchandiser": "NQF Level 3",
  "Service Station Attendant": "NQF Level 2",
  "Retail Manager: Retail Store Manager": "NQF Level 6",
  "Perishable Goods Department Coordinator": "NQF Level 3",
  "Sales Representative": "NQF Levels 4 & 5",
  "Community Development Practitioner": "NQF Levels 4 & 5",
  "Municipal Finance Manager": "NQF Level 8",
  "Work Place Preparedness and Risk Control Assistant-Communicable & Other occupational Diseases": "NQF Level 3",
  "Occupational Health and Safety Practitioner": "NQF Level 5",
  "Millwright": "NQF Levels 4 & Not specified",
  "Mechanical Fitter": "NQF Levels 2 - Not specified",
  "Journalist": "NQF Level 5",
  "HR Administrator": "NQF Levels 5, 6 & 7",
  "Plant Operator": "NQF Levels 2 - 5",
  "Forklift Operator": "NQF Levels 3 & Not specified",
  "Community / Religious Worker": "NQF Levels 2, 5 & 6",
  "Community Counsellor": "NQF Level 5",
  "Health Promotion Officer": "NQF Level 3",
  "Electrician": "NQF Levels 4, 5 & Not specified",
  "Security Officer": "NQF Levels 3, 4 & 5",
  "Patrol Officer": "NQF Level 3",
  "Access Control Officer": "NQF Level 3",
  "Foundational Learning Competence": "NQF Level 2",
  "Occupational Trainer": "NQF Level 4",
  "Surface Blaster": "NQF Level 3",
  "IT Support Technician": "NQF Levels 3, 4 & 5",
  "Tractor Operator": "NQF Level 2",
  "Assistant Handyperson": "NQF Level 3",
  "Retirement Fund Administrator": "NQF Level 5",
  "Recruitment Manager": "NQF Level 5",
  "Marketing Coordinator": "NQF Level 5",
  "Quality Manager": "NQF Level 6",
  "Bookkeeper": "NQF Level 5",
  "Management Assistant": "NQF Level 5",
  "Payroll Administrator": "NQF Level 6",
  "Civil Engineering Technician": "NQF Levels 4 & 5",
  "Mechanical Engineering Technician": "NQF Level 5",
  "Business Administrator": "NQF Level 5",
  "Marketing Management": "NQF Level 5",
  "Public Administration Officer": "NQF Level 5",
  "Public Relations Officer": "NQF Level 5",
  "Road Transport Manager": "NQF Level 5",
  "Welder": "NQF Levels 2 - Not specified",
  "Software Developer": "NQF Levels 4 & 5",
  "Drone Pilot": "NQF Level 4",
  "RPAS Technician": "NQF Level 4",
  "Telecommunications Cable Jointer": "NQF Level 3",
  "Beauty Therapist": "NQF Level 4",
  "Management Accountant": "NQF Level 8",
  "Management Accounting Officer": "NQF Level 5",
  "Body Massage Therapist": "NQF Level 4",
  "Temporary Hair Removal Therapist": "NQF Level 4",
  "Make-Up Consultant": "NQF Level 4",
  "Management Accounting Specialist": "NQF Level 6",
  "Management Accounting Practitioner": "NQF Level 7",
  "Beauty Practitioner": "NQF Level 4",
  "Body Therapist": "NQF Level 4",
  "Nail Therapist": "NQF Level 4",
  "Financial Advisor": "NQF Levels 6 & 7",
  "Eye Grooming Therapist": "NQF Level 4",
  "Draughtsperson (Piping Draught Person)": "NQF Level 5",
  "Facilities Manager": "NQF Level 6",
  "Legal Secretary": "NQF Level 5",
  "Finance Administrator": "NQF Level 5",
  "Multi-Disciplinary Drawing: Office Practice": "NQF Level 5",
  "Individual Fitness Instructor": "NQF Level 4",
  "Group Fitness Instructor": "NQF Level 4",
  "Fitness Instructor": "NQF Level 4",
  "Automotive Technician": "NQF Levels 2 - Not specified",
  "Fitter and Turner": "NQF Levels 4 & Not specified",
  "Boilermaker": "NQF Levels 4 & Not specified",
  "Art & Design Assistant": "NQF Level 5",
  "Medical Secretary": "NQF Level 5",
  "Travel Consultant": "NQF Level 5",
  "Laundry Worker": "NQF Level 2",
  "Principal Real Estate Agent": "NQF Level 5",
  "Maintenance Planner": "NQF Level 5",
  "Labour Inspector": "NQF Level 5",
  "Occupational Health and Safety Assistant": "NQF Level 4",
  "Pulp Process Controller": "NQF Level 4",
  "Paper Process Controller": "NQF Level 4",
  "Auctioneer": "NQF Level 4",
  "Work Place Preparedness and Risk Control Officer- Communicable & Other occupational Diseases": "NQF Level 4",
  "Solar PV Installer": "NQF Levels 4 & 5",
  "Workplace Essential Skills": "NQF Level 4",
  "New Venture Creation": "NQF Level 2",
  "Career Development Officer": "NQF Level 5",
  "Cleaner": "NQF Levels 1 & 3",
  "Workplace Preparation": "NQF Level 2",
  "Food and Beverage Packaging Operator": "NQF Level 3",
  "Process Machine Operator": "NQF Level 3",
  "Metal Machinist": "NQF Levels 4 & Not specified",
  "Armature Winder": "NQF Levels 4 & Not specified",
  "Front-End Web Designer": "NQF Level 4",
  "Cloud Administrator": "NQF Level 4",
  "Hospitality Supervisor": "NQF Level 5",
  "Risk Practitioner": "NQF Levels 6 & 8",
  "Internal Auditor": "NQF Levels 6, 7 & 8",
  "Family Law Practitioner": "NQF Level 5",
  "Store Person": "NQF Levels 2 & 4",
  "Tourist Information Officer": "NQF Level 5",
  "Events Coordinator": "NQF Level 5",
  "Logistics Clerk": "NQF Levels 3, 4 & 5",
  "Bank Customer Services Clerk": "NQF Level 4",
  "Insurance Underwriter": "NQF Level 5",
  "Clearing and Forwarding Agent": "NQF Level 5",
  "Goldsmith": "NQF Levels 4 & Not specified",
  "Avionics Mechanician": "NQF Level Not specified",
  "Radar Mechanic": "NQF Level Not specified",
  "Instrument Mechanician": "NQF Levels 5 & Not specified",
  "Grain Depot Manager": "NQF Level 5",
  "Shelf Filler": "NQF Level 2",
  "Cash Office Clerk": "NQF Level 2",
  "Pest Management Officer": "NQF Level 5",
  "Banknote Processor": "NQF Level 4",
  "Procurement Officer": "NQF Level 5",
  "General Manager Public Service": "NQF Level 6",
  "Eco Ranger": "NQF Level 4",
  "Hot Water System Installer (Solar Water Installer)": "NQF Level 4",
  "Hot- and Cold-Water Systems Installer": "NQF Level 4",
  "General Residential Repairer": "NQF Levels 2 & 3",
  "Domestic Water and Drainage Pipe Repairer": "NQF Levels 2 & 3",
  "Python Developer": "NQF Level 4",
  "C++ Programmer": "NQF Level 4",
  "JavaScript Programmer": "NQF Level 4",
  "Java Programmer": "NQF Level 4",
  "Basic Kitchen Appliance Repairer": "NQF Level 2",
  "Gardener": "NQF Levels 2 & 3",
  "Market Research Analyst": "NQF Level 5",
  "Rigger": "NQF Levels 4 & Not specified",
  "Renewable Energy Workshop Assistant": "NQF Level 4",
  "Checkout Operator": "NQF Level 2",
  "Heavy Duty Clutch and Brake Repairer": "NQF Level 3",
  "Hot Water System Installer (Heat Pump Installer)": "NQF Level 4",
  "Heavy Duty Drive Train Repairer (Vehicle Transmission Mechanic)": "NQF Level 3",
  "Heavy Duty Suspension Repairer": "NQF Level 2",
  "Heavy Duty Workshop Assistant": "NQF Level 2",
  "Heavy Duty Hydraulic and Pneumatic Repairer": "NQF Level 3",
  "Hairstylist": "NQF Level 3",
  "Chemical Hair Reformation Attendant": "NQF Level 4",
  "Hair Cutting Attendant": "NQF Level 4",
  "Hair and Scalp Treatment Attendant": "NQF Level 2",
  "Hair Colouring Attendant": "NQF Level 4",
  "Face Shovel Operator": "NQF Level 2",
  "Service Truck Operator": "NQF Level 2",
  "Water Cart Operator": "NQF Level 2",
  "Hot Mix Asphalt Paving Machine Operator": "NQF Level 2",
  "Sideboom Operator": "NQF Level 2",
  "Continuous Bucket Trencher Operator": "NQF Level 2",
  "Paving Screed Operator": "NQF Level 2",
  "Engineering Studies": "NQF Level 5",
  "Quality Assurer": "NQF Level 5",
  "Chainsaw Operator": "NQF Levels 2 & 3",
  "Specialised Chainsaw Operator": "NQF Level 3",
  "Bank Teller": "NQF Level 4",
  "Credit or Loans Officer": "NQF Level 4",
  "Compliance Officer": "NQF Level 6",
  "Governance Officer": "NQF Levels 7 & 8",
  "Water Reticulation Practitioner": "NQF Level 4",
  "Chemical Engineering Technician": "NQF Level 5",
  "Loader Operator": "NQF Level 2",
  "Quality Test Automator": "NQF Level 5",
  "Forestry SHE Representative": "NQF Level 3",
  "Forestry Incident Investigator": "NQF Level 4",
  "Nursery Person (Garden Centre Supervisor)": "NQF Level 3",
  "Nurseryperson (Nursery Supervisor)": "NQF Level 3",
  "Refrigeration Mechanic": "NQF Levels 2 - Not specified",
  "Refrigerant Safe Handling": "NQF Level 2",
  "Toolmaker": "NQF Levels 5 & Not specified",
  "Dump Truck Operator": "NQF Level 2",
  "Workshop Tool Assistant": "NQF Level 2",
  "Chemical Production Machine Operator": "NQF Level 2",
  "Sewing Machine Operator": "NQF Level 2",
  "Basic Food Safety Complier": "NQF Level 2",
  "Customs Compliance Manager": "NQF Level 7",
  "Production Operator": "NQF Level 3",
  "Water Process Controller": "NQF Level 3",
  "Occupational Screening Spirometry": "NQF Level 5",
  "Industrial Water Process Controller": "NQF Level 5",
  "Water Regulation Practitioner": "NQF Level 8",
  "Small Retail Business Owner": "NQF Level 4",
  "Fraud Examiner": "NQF Levels 7 & 8",
  "School Principal (School Manager)": "NQF Level 6",
  "Plastics Manufacturing Machine Setter": "NQF Level 5",
  "Mechatronics Technician": "NQF Level 5",
  "Assistant Life Coach: Communication": "NQF Level 5",
  "Grain Grader": "NQF Level 4",
  "Stonemason": "NQF Level 4",
  "Production or Operations Supervisor (Forestry): (Forestry Production Supervisor)": "NQF Level 3",
  "Safety Inspector (Forestry and Related Industries Safety Health and Environment Officer)": "NQF Level 4",
  "Chemical Laboratory Analyst": "NQF Level 4",
  "Software Tester": "NQF Level 5",
  "Reach Stacker C48 Operator": "NQF Level 3",
  "Quality Controller": "NQF Level 4",
  "Quality Inspector": "NQF Level 3",
  "Barber": "NQF Level 3",
  "Seamstress": "NQF Level 3",
  "Abattoir Foreman": "NQF Level 4",
  "Abattoir Supervisor": "NQF Level 3",
  "Routine Road Maintenance Manager": "NQF Level 5",
  "Heavy Equipment Mechanic": "NQF Levels 4 & Not specified",
  "Textile Wet Process Dyeing Machine Operator": "NQF Level 2",
  "Weaving Machine Operator": "NQF Level 2",
  "Weft Knitting Machine Operator": "NQF Level 2",
  "Textile Wet Process Coating Machine Operator": "NQF Level 2",
  "Textile Blowroom and Carding Machine Operator": "NQF Level 2",
  "Textile Wet Product Finishing Machine Operator": "NQF Level 2",
  "Production Process Controller": "NQF Level 4",
  "Textile Dry Finishing and Heat Setting Machine Operator": "NQF Level 2",
  "Beaming and Sizing Machine Operator": "NQF Level 2",
  "Speciality Yarn Assembly Machine Operator": "NQF Level 2",
  "Creeling and Warping Machine Operator": "NQF Level 2",
  "Man-made Fibre Extrusion Machine Operator": "NQF Level 2",
  "Pattern Grader": "NQF Level 4",
  "Ringframe Spinning and Yarn Packaging Machine Operator": "NQF Level 2",
  "Textile Drawframe and Speedframe Machine Operator": "NQF Level 2",
  "Tufting Machine Operator": "NQF Level 2",
  "Textile Carding and Drawframe Machine Operator": "NQF Level 2",
  "Textile Dry Fringing Machine Operator": "NQF Level 2",
  "Warp Knitting Machine Operator": "NQF Level 2",
  "Rotor Spinning and Yarn Packaging Machine Operator": "NQF Level 2",
  "Textile Wet Process Printing Machine Operator": "NQF Level 2",
  "Textile Wet Process Preparation Machine Operator": "NQF Level 2",
  "Apparel Pattern Maker and Grader": "NQF Level 5",
  "Apparel Pattern Designer Assistant": "NQF Level 5",
  "Man-made Fibre Texturing Production Machine Operator": "NQF Level 2",
  "Textile Sliver Lap": "NQF Level 2",
  "Braiding Machine Operator": "NQF Level 2",
  "Textile Dry Product Surface Preparation Machine": "NQF Level 2",
  "Non-woven Thermo-Bonding Textile Production Machine Operator": "NQF Level 2",
  "Metal Manufacturing Finishing Process Controller": "NQF Level 4",
  "Metal Manufacturing Rolling Process Controller": "NQF Level 4",
  "Metal Manufacturing": "NQF Level 4",
  "Metal Manufacturing Material Preparation Process Controller": "NQF Level 4",
  "Fossil Power Plant Process Controller": "NQF Level 6",
  "Lift Mechanic": "NQF Levels 4 & Not specified",
  "Tractor Mechanic": "NQF Levels 4 & Not specified",
  "Sheet Metal Worker": "NQF Level Not specified",
  "Government Official": "NQF Level 7",
  "Panel Beater": "NQF Level 4",
  "Health Products Sales Associate": "NQF Level 5",
  "Health Products Information Officer": "NQF Level 5",
  "Health Products Marketing Associate": "NQF Level 5",
  "Muallim": "NQF Level 4",
  "Imaam": "NQF Level 5",
  "Aalim": "NQF Level 6",
  "Apparel and Related Manufacturing Machine Mechanic": "NQF Level 4",
  "Chemical Plant Controller": "NQF Level 5",
  "Footwear Closing Production Machine Operator": "NQF Level 2",
  "Business Banker": "NQF Levels 5, 6 & 7",
  "Manufacturing Production Process Controller": "NQF Level 4",
  "Furniture Upholsterer": "NQF Level 4",
  "Water Infrastructure Manager": "NQF Level 8",
  "Company Secretary": "NQF Level 8",
  "First-line Production Supervisor": "NQF Level 4",
  "Production Supervisor": "NQF Level 5",
  "Basic Furniture Upholster": "NQF Level 2",
  "Sewing Machine Mechanic Operator": "NQF Level 3",
  "Skid Steer Loader Operator": "NQF Level 2",
  "Small Engine Mechanic": "NQF Levels 4 & Not specified",
  "Miner": "NQF Level 3",
  "Mining Operator": "NQF Levels 2, 3 & 4",
  "Underground Hardrock Safe Declarer": "NQF Level 2",
  "Surface Safe Declarer": "NQF Level 2",
  "Mine Occupational Health and Safety Representative": "NQF Level 2",
  "Underground Hardrock Support Installer": "NQF Level 2",
  "Non-Commissioned Police Official": "NQF Level 6",
  "Purchasing Officer": "NQF Level 6",
  "Panelbeater": "NQF Level Not specified",
  "Assistant Baker: Fermented Dough Products": "NQF Level 2",
  "Baking and Confectionery Operator": "NQF Level 3",
  "Straddle Carrier C49 Operator": "NQF Level 3",
  "Clothing Production": "NQF Level 5",
  "Library Assistant": "NQF Level 5",
  "Orchard and Vineyard Foreman": "NQF Level 4",
  "Media Production Assistant": "NQF Levels 4, 5 & 6",
  "Furniture Designer": "NQF Level 7",
  "Furniture Maker": "NQF Level 5",
  "Fresh Dairy Products Maker": "NQF Level 4",
  "Cottage Cheesemaker": "NQF Level 4",
  "Disability Attendant": "NQF Level 3",
  "Unitary Air Conditioning Installer": "NQF Level 2",
  "Transit Protection Driver": "NQF Level 5",
  "Train Driver": "NQF Level 4",
  "Railway Signal Operator (Functional Yard Operator)": "NQF Level 3",
  "Fire Alarm Commissioner": "NQF Level 5",
  "Fire Alarm Installer": "NQF Level 5",
  "Fire Alarm Designer": "NQF Level 5",
  "Fire Alarm Technician": "NQF Level 5",
  "Sewing Machine Maintenance and Repair Technician Assistant": "NQF Level 4",
  "Collaborative Recycler": "NQF Level 2",
  "Materials Recycler (Paper and Packaging Collector)": "NQF Level 3",
  "Wheel Balancer": "NQF Level 1",
  "Road Traffic Safety Officer": "NQF Level 6",
  "Traffic Officer": "NQF Level 6",
  "Paper Sheetfed offset Lithography Technician": "NQF Level Not specified",
  "Packaging Manufacturing Machine Minder": "NQF Level Not specified",
  "Social Counselling Worker": "NQF Level 5",
  "Textile": "NQF Level Not specified",
  "Winemaker's Assistant": "NQF Level 4",
  "Handicraft Sewer": "NQF Level 1",
  "Buyer": "NQF Level 5",
  "Equestrian Coach or Instructor Level 1": "NQF Level 5",
  "Social Counselling Support Worker": "NQF Level 4",
  "Architectural Draughtsperson": "NQF Level 5",
  "Upholstery Frame Preparer": "NQF Level 2",
  "Airline Ground Crew": "NQF Level 4",
  "Business Development Officer": "NQF Level 5",
  "Health Information Manager": "NQF Level 7",
  "Telecommunications Specialist": "NQF Level 5",
  "Assistant Baker": "NQF Level 2",
  "Electronic Originator": "NQF Level Not specified",
  "Coldset Rotary Offset Lithography Technician": "NQF Level Not specified",
  "Performing Artist": "NQF Level 5",
  "Fermented Dairy Products Maker": "NQF Level 4",
  "Butter Maker": "NQF Level 4",
  "Ripened Cheesemaker": "NQF Level 4",
  "Processed Cheese Maker": "NQF Level 4",
  "CNC Turning Machinist": "NQF Level 4",
  "Tooling Machinist": "NQF Level 5",
  "CNC Milling Machinist": "NQF Level 4",
  "Aerial Chainsaw Operator": "NQF Level 3",
  "Joiner": "NQF Level Not specified",
  "Popular Music: Studio Work": "NQF Level 5",
  "Popular Music: Composition": "NQF Level 5",
  "Hypertext Markup Language (HTML) Programmer": "NQF Level 4",
  "Spatial Intelligence Data Scientist": "NQF Level 5",
  "Handicraft Knitter": "NQF Level 1",
  "Wind Turbine Service Technician": "NQF Level 5",
  "Sound Operator": "NQF Level 5",
  "Advertiser": "NQF Level 5",
  "Motion Graphics Designer": "NQF Level 5",
  "Animation Artist": "NQF Level 5",
  "Garment Pattern Development Assistant": "NQF Level 5",
  "Meat Processing Operator": "NQF Level 3",
  "Printing Machinist": "NQF Level Not specified",
  "Rotary Printing And Re-Reeling Gravure Machine Technician": "NQF Level Not specified",
  "Rotary Printing and Re-reeling Flexographic Machine Technician": "NQF Level Not specified",
  "Mechanised Hard Cover Bookbinding Technician": "NQF Level Not specified",
  "Energy Performance Certificate (EPC) Practitioner": "NQF Level 5",
  "Production Process Machine Operator and Assembler": "NQF Level 3",
  "Extended Reality Developer": "NQF Level 6",
  "Military Police Official": "NQF Level 6",
  "Assistant Baker (Fermented Dough Products)": "NQF Level 2",
  "Planner": "NQF Level 5",
  "Aircraft Structures Technician": "NQF Level 4",
  "Avionics Mechanic": "NQF Level 5",
  "Geomatics Officer": "NQF Level 5",
  "Parole Board Member (Offender Placement and Release Practitioner)": "NQF Level 6",
  "Immigration Officer": "NQF Level 5",
  "Refugee Status Determination Officer": "NQF Level 5",
  "Fishing Hand": "NQF Level 2",
  "Side Loader Container C56 Operator": "NQF Level 3",
  "Master Toolmaker (Purpose Built Machine Master Toolmaker)": "NQF Level 6",
  "Commercial Housekeeper": "NQF Level 4",
  "Major Domestic Appliance Repairer": "NQF Level 3",
  "Small Domestic Appliance Repairer": "NQF Level 3",
  "Blacksmith": "NQF Level Not specified",
  "Paintless Dent Remover": "NQF Level 4",
  "Professional Principal Executive Officer": "NQF Level 7",
  "Vehicle Damage Quantifier": "NQF Level 4",
  "Trustee": "NQF Level 4",
  "Franchise Manager": "NQF Level 6",
  "Retail Store Manager": "NQF Level 6",
  "Pattern Making Assistant": "NQF Level 4",
  "Moulder": "NQF Levels 4 & Not specified",
  "Patternmaker": "NQF Level Not specified",
  "Melter": "NQF Level 4",
  "Lathe Operator": "NQF Level 3",
  "Computer and Digital Support Assistant": "NQF Level 4",
  "Hydrogen Fuel Cell System Practitioner": "NQF Level 5",
  "Landscape Designer": "NQF Level 5",
  "Self-employed re-cycling materials collector": "NQF Level 1",
  "Garden Designer": "NQF Level 4",
  "Small Re-cycling Business Owner": "NQF Level 3",
  "Bitumen Spray Equipment Operator": "NQF Level 2",
  "Liquid Long Life Dairy Products Maker": "NQF Level 4",
  "Railway Signalling Assembler and Wirer": "NQF Level 3",
  "Train Control Officer": "NQF Level 5",
  "Railway Track Constructor": "NQF Level 4",
  "Foreign Exchange Officer": "NQF Level 6",
  "Anti Money Laundering Analyst": "NQF Level 6",
  "Radiotrician": "NQF Level Not specified",
  "Tractor Mechanic Assistant": "NQF Level 2",
  "Textiles": "NQF Level 5",
  "Forestry Production and Operations Foreman": "NQF Level 4",
  "Forestry Production Foreman": "NQF Level 4",
  "Water Works Management Practitioner": "NQF Level 6",
  "Mobile Device Technician": "NQF Level 4",
  "Mobile Device Repairer": "NQF Level 4",
  "Laptop Repairer": "NQF Level 4",
  "Wearables": "NQF Level 4",
  "Survey Interviewer": "NQF Level 4",
  "Fertilizer Manufacturing": "NQF Level 5",
  "Craft Bookbinding Technician": "NQF Level Not specified",
  "Radio Operator": "NQF Level 3",
  "General Garden Maintenance Worker": "NQF Level 1",
  "Propeller Workshop Maintenance Mechanic": "NQF Level 4",
  "Pharmacist's Assistant (Post Basic)": "NQF Level 5",
  "Pharmacist's Assistant (Basic)": "NQF Level 4",
  "Civic and Soft Skills": "NQF Level 5",
  "Civic and Health Peer Education": "NQF Level 5",
  "Advanced Spatial Intelligence Data Scientist": "NQF Level 5",
  "Heart Resonance Practitioner": "NQF Level 5",
  "Telecommunication Line Mechanic": "NQF Level 4",
  "Sugar Processing Machine Operator": "NQF Level 3",
  "Sugar Processing Controller": "NQF Level 5",
  "Footwear Finishing Production Machine Operator": "NQF Level 2",
  "Beam House Machine Operator": "NQF Level 2",
  "Concrete Tester": "NQF Level 4",
  "Bamboo Floor Finisher": "NQF Level 3",
  "Carpet Floor Finisher": "NQF Level 3",
  "Electronic Equipment Mechanician": "NQF Level Not specified",
  "Structural Plater": "NQF Level Not specified",
  "Refractory Mason": "NQF Level Not specified",
  "Viticulture Worker": "NQF Level 2",
  "Data and Telecommunications Cabler": "NQF Level 3",
  "Deck Hand (Able Seaman)": "NQF Level 3",
  "Engine Able Seafarer": "NQF Level 3",
  "Dock Master": "NQF Level 5",
  "Dairy Unit Manager": "NQF Level 5",
  "Railway Safety Inspector": "NQF Level 6",
  "Wood Processing Machine Operator": "NQF Level 4",
  "Handicraft Footwear Maker": "NQF Level 1",
  "Handicraft Frame Weaver": "NQF Level 1",
  "Nuclear Power Plant Process Controller": "NQF Level 6",
  "Soils": "NQF Level 4",
  "Bituminous Binders Tester": "NQF Level 4",
  "Asphalt Tester": "NQF Level 4",
  "Driving Instructor": "NQF Level 4",
  "Dried Dairy Products Maker": "NQF Level 4",
  "Condensed Liquid Dairy Products Maker": "NQF Level 4",
  "Diplomat": "NQF Level 7",
  "Liquid Dairy Reception Operator": "NQF Level 3",
  "Lubrication Equipment Mechanic": "NQF Level 4",
  "Tissue Packaging Attendant": "NQF Level 3",
  "Tissue Converter Machine Operator": "NQF Level 4",
  "Tissue Backstand Operator": "NQF Level 3",
  "Roll Label Machine Technician": "NQF Level Not specified",
  "Aircraft Structures Worker": "NQF Level Not specified",
  "Footwear Cutting Machine Operator": "NQF Level 2",
  "Dry Mill Operator": "NQF Level 4",
  "Head Saw Doctor": "NQF Level 4",
  "Saw Filer": "NQF Level 2",
  "Forestry Technician": "NQF Level 5",
  "Wet Mill Operator": "NQF Level 4",
  "Saw Doctor": "NQF Level 4",
  "Dry Kiln Operator": "NQF Level 4",
  "Log Yard Operator": "NQF Level 3",
  "Administrative Attache": "NQF Level 5",
  "Plastics Manufacturing Machine Operator": "NQF Level 3",
  "Leather Tanning Machine Operator": "NQF Level 2",
  "Blow Moulding Machine Setter": "NQF Level 5",
  "Miller": "NQF Level 5",
  "Milling Machine Operator": "NQF Level 3",
  "Manufacturing Workshop Assistant": "NQF Level 3",
  "EDM Plunge Operator": "NQF Level 4",
  "Surface Grinding Operator": "NQF Level 3",
  "EDM Wire Operator": "NQF Level 4",
  "Tooling CAD Operator": "NQF Level 4",
  "Pothole Repair Person": "NQF Level 3",
  "Weapon Systems Mechanic": "NQF Level Not specified",
  "Railway Signalling Installer": "NQF Level 3",
  "Network Administrator": "NQF Level 4",
  "Sheetfed Lithography Technician": "NQF Level 4",
  "Packaging Rotary Printing and Re-reeling Flexographic Machine Minder": "NQF Level 4",
  "Corrugated Board Manufacturing Machine Minder": "NQF Level 4",
  "Mechanised Soft-Cover Bookbinding Technician": "NQF Level 4",
  "Coldset Rotary Offset Lithography Printing Technician": "NQF Level 4",
  "Electronic Pre-press Gravure Technician": "NQF Level 4",
  "Folding Machine Operator": "NQF Level 2",
  "Extrusion Machine Setter": "NQF Level 5",
  "Guillotine Operator": "NQF Level 2",
  "Saddle Stitching Machine Operator": "NQF Level 3",
  "Adhesive Binding Machine Operator": "NQF Level 3",
  "Sport Talent Scout": "NQF Level 5",
  "Binder and Finisher": "NQF Level Not specified",
  "Gravure Cylinder Preperation Technician": "NQF Level Not specified",
  "Heatset Rotary Offset Lithography Technician": "NQF Level Not specified",
  "Warping Machine Operator": "NQF Level 2",
  "Commercial Diver": "NQF Level 4",
  "Fabricated Glazing Solution Installer": "NQF Level 3",
  "Glass Forming Operator": "NQF Level 2",
  "Specialised Glazing Solution Installer": "NQF Level 4",
  "Annealing Operator": "NQF Level 2",
  "Bath Operator": "NQF Level 2",
  "Pre-Fabricated Glazing Solution Installer": "NQF Level 3",
  "Glass Melt Operator": "NQF Level 3",
  "General Glazing Installer": "NQF Level 2",
  "Spout Operator": "NQF Level 2",
  "Chemical Manufacturing Technician": "NQF Level 5",
  "Glass Process Operator": "NQF Level 3",
  "Injection Moulding Machine Setter": "NQF Level 5",
  "Diamond and Gemstone Setter": "NQF Level Not specified",
  "Bicycle Repairer": "NQF Level 3",
  "Covid-19 Vaccine Demand Creation and Community Advocacy Practitioner": "NQF Level 3",
  "Engine Workshop Maintenance Mechanic": "NQF Level 5",
  "Physical Asset Manager": "NQF Level 7",
  "Energy Kinesiology Practitioner": "NQF Level 5",
  "Magazine Master": "NQF Level 5",
  "Metaphysics Practitioner": "NQF Level 5",
  "Reiki Practitioner": "NQF Level 5",
  "Emotional Freedom Techniques (EFT) Tapping Practitioner": "NQF Level 5",
  "BodyTalk Practitioner": "NQF Level 4",
  "Natural Energy Healing Practitioner": "NQF Level 5",
  "Crystal Healing Practitioner": "NQF Level 5",
  "Interior Decorator": "NQF Level 5",
  "Mobile Phone Repairer": "NQF Level 2",
  "Detective": "NQF Level 6",
  "Sewing Machine Mechanic Repairer": "NQF Level 2",
  "Proof reader": "NQF Level 6",
  "Text Editor": "NQF Level 6",
  "Orientation and Mobility Practitioner": "NQF Level 6",
  "Pharmacy Support Worker": "NQF Level 6",
  "Gathering Arm Loader Operator": "NQF Level 2",
  "Physical Asset Practitioner": "NQF Level 6",
  "Cutting Machine Maintenance Assistant": "NQF Level 3",
  "Methods Analyst": "NQF Level 5",
  "Insulation Installer": "NQF Level 2",
  "Water and Sanitation Coordinator": "NQF Level 6",
  "Legislation Administrative Assistant": "NQF Level 5",
  "Bicycle Mechanic": "NQF Level 4",
  "Bicycle Special Components Repairer": "NQF Level 4",
  "Fuel Pipeline Controller": "NQF Level 4",
  "Railway Track Supervisor": "NQF Level 4",
  "Marine Electro-Technical Officer": "NQF Level 5",
  "Marine Electro-Technical Rating": "NQF Level 4",
  "Chemist (Surface Coatings Technologist)": "NQF Level 5",
  "Abattoir Process Worker": "NQF Level 1",
  "Aids to Navigation Technician": "NQF Level 4",
  "Red Meat De-Boner": "NQF Level 2",
  "Mine Overseer": "NQF Level 5",
  "Brush Hand": "NQF Level 2",
  "Ice Cream Products Maker": "NQF Level 4",
  "E-Waste Operations Controller": "NQF Level 4",
  "Room Attendant": "NQF Level 4",
  "Diamond Cutter": "NQF Level Not specified"
};



  function expandCompactExploreData(compactPayload) {
    if (!compactPayload || !Array.isArray(compactPayload.columns) || !Array.isArray(compactPayload.rows)) {
      return [];
    }

    const columns = compactPayload.columns;
    return compactPayload.rows.map((row) => {
      const record = {};
      columns.forEach((column, index) => {
        record[column] = row[index] ?? "";
      });
      return record;
    });
  }

  function getExploreTableDataFromWindow() {
    if (Array.isArray(window.QCTO_EXPLORE_TABLE_DATA)) {
      return window.QCTO_EXPLORE_TABLE_DATA;
    }

    if (window.QCTO_EXPLORE_TABLE_DATA_COMPACT) {
      window.QCTO_EXPLORE_TABLE_DATA = expandCompactExploreData(window.QCTO_EXPLORE_TABLE_DATA_COMPACT);
      delete window.QCTO_EXPLORE_TABLE_DATA_COMPACT;
      return window.QCTO_EXPLORE_TABLE_DATA;
    }

    return null;
  }

  function loadExploreTableData() {
    const availableData = getExploreTableDataFromWindow();
    if (availableData) {
      return Promise.resolve(availableData);
    }

    if (exploreTableDataLoadPromise) {
      return exploreTableDataLoadPromise;
    }

    exploreTableDataLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-explore-table-data="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(getExploreTableDataFromWindow() || []), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "assets/explore-table-data.js";
      script.dataset.exploreTableData = "true";
      script.async = true;
      script.onload = () => resolve(getExploreTableDataFromWindow() || []);
      script.onerror = () => reject(new Error("Could not load Explore table data."));
      document.body.appendChild(script);
    });

    return exploreTableDataLoadPromise;
  }

  function deriveQualificationType(qualificationTitle) {
    const title = String(qualificationTitle || "").trim();
    if (!title) return "Not specified";

    const beforeColon = title.split(":")[0].trim();
    return beforeColon || "Not specified";
  }

  function prepareExploreTableRow(row) {
    const prepared = { ...row };
    prepared.qualificationType = row.qualificationType || deriveQualificationType(row.qualificationTitle);
    prepared.cityTown = row.cityTown || "Not specified";
    prepared.province = row.province || "Not specified";
    prepared.career = row.career || "Not specified";
    prepared.setaPartner = row.setaPartner || "Not specified";
    prepared.accreditationStatus = row.accreditationStatus || "Not specified";
    prepared.orgGroupId = row.orgGroupId || row.uniqueOrgId || "";
    prepared.__orgGroupId = String(prepared.orgGroupId || "").trim().toLowerCase();
    prepared.__province = prepared.province.toLowerCase();
    prepared.__career = prepared.career.toLowerCase();
    prepared.__cityTown = prepared.cityTown.toLowerCase();
    prepared.__setaPartner = prepared.setaPartner.toLowerCase();
    prepared.__status = prepared.accreditationStatus.toLowerCase();
    prepared.__providerName = String(prepared.providerName || "").toLowerCase();
    prepared.__qualificationTitle = String(prepared.qualificationTitle || "").toLowerCase();
    prepared.__careerQualificationHaystack = [prepared.career, prepared.qualificationTitle]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
    prepared.__searchHaystack = [prepared.providerName, prepared.career, prepared.qualificationTitle]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
    return prepared;
  }

  function getUniqueSortedValues(rows, key) {
    return Array.from(new Set(
      rows
        .map((row) => String(row[key] || "").trim())
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));
  }

  function buildExploreSearchIndex(rows) {
    const seen = new Set();
    const entries = [];

    function addEntry(type, value) {
      const cleanValue = String(value || "").trim();
      if (!cleanValue || cleanValue === "Not specified") return;

      const key = type + "::" + cleanValue.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      entries.push({
        type,
        value: cleanValue,
        normalized: cleanValue.toLowerCase()
      });
    }

    rows.forEach((row) => {
      addEntry("Provider", row.providerName);
      addEntry("Career", row.career);
      addEntry("Qualification", row.qualificationTitle);
    });

    entries.sort((a, b) => a.value.localeCompare(b.value));
    return entries;
  }

  function truncateWords(value, maxWords = 4) {
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    return words.slice(0, maxWords).join(" ");
  }

  function highlightSuggestionText(value, query) {
    const label = String(value || "");
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) return escapeHtml(label);

    const lowerLabel = label.toLowerCase();
    const lowerQuery = cleanQuery.toLowerCase();
    const index = lowerLabel.indexOf(lowerQuery);

    if (index < 0) return escapeHtml(label);

    const before = label.slice(0, index);
    const match = label.slice(index, index + cleanQuery.length);
    const after = label.slice(index + cleanQuery.length);

    return `${escapeHtml(before)}<mark class="suggestion-match">${escapeHtml(match)}</mark><span class="suggestion-muted">${escapeHtml(after)}</span>`;
  }

  function buildHomeSearchIndex(rows) {
    const seen = new Set();
    const entries = [];

    function addEntry(type, value) {
      const cleanValue = String(value || "").trim();
      if (!cleanValue || cleanValue === "Not specified") return;

      const key = type + "::" + cleanValue.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      entries.push({
        type,
        value: cleanValue,
        label: truncateWords(cleanValue, 4),
        normalized: cleanValue.toLowerCase()
      });
    }

    rows.forEach((row) => {
      addEntry("Career", row.career);
      addEntry("Qualification", row.qualificationTitle);
    });

    entries.sort((a, b) => a.value.localeCompare(b.value));
    return entries;
  }

  function normaliseHomeSearchIndex(rawIndex) {
    if (!Array.isArray(rawIndex)) return [];

    return rawIndex.map((entry) => {
      if (Array.isArray(entry)) {
        return {
          type: entry[0],
          value: entry[1],
          label: entry[2],
          normalized: entry[3] || String(entry[1] || "").toLowerCase()
        };
      }

      return {
        type: entry.type,
        value: entry.value,
        label: entry.label || truncateWords(entry.value, 4),
        normalized: entry.normalized || String(entry.value || "").toLowerCase()
      };
    }).filter((entry) => entry.value && entry.normalized);
  }

  function ensureHomeSearchIndexLoaded() {
    if (homeSearchIndex.length) return Promise.resolve(homeSearchIndex);

    if (Array.isArray(window.QCTO_HOME_SEARCH_INDEX)) {
      homeSearchIndex = normaliseHomeSearchIndex(window.QCTO_HOME_SEARCH_INDEX);
      return Promise.resolve(homeSearchIndex);
    }

    if (homeSearchIndexLoadPromise) return homeSearchIndexLoadPromise;

    homeSearchIndexLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-home-search-index="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          homeSearchIndex = normaliseHomeSearchIndex(window.QCTO_HOME_SEARCH_INDEX || []);
          resolve(homeSearchIndex);
        }, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "assets/search-index.js";
      script.dataset.homeSearchIndex = "true";
      script.async = true;
      script.onload = () => {
        homeSearchIndex = normaliseHomeSearchIndex(window.QCTO_HOME_SEARCH_INDEX || []);
        resolve(homeSearchIndex);
      };
      script.onerror = () => reject(new Error("Could not load home search index."));
      document.body.appendChild(script);
    });

    return homeSearchIndexLoadPromise;
  }

  async function ensureExploreRowsLoaded() {
    if (exploreTableAllRows.length) return exploreTableAllRows;

    const rawRows = await loadExploreTableData();
    exploreTableAllRows = rawRows.map(prepareExploreTableRow);
    exploreSearchIndex = buildExploreSearchIndex(exploreTableAllRows);
    if (!homeSearchIndex.length) homeSearchIndex = buildHomeSearchIndex(exploreTableAllRows);
    if (!careerSearchIndex.length) careerSearchIndex = buildCareerSearchIndex();
    return exploreTableAllRows;
  }

  function getExploreSearchQuery() {
    const input = document.getElementById("explore-search-input");
    const query = input ? input.value.trim() : "";
    return query.length >= EXPLORE_SEARCH_MIN_LENGTH ? query.toLowerCase() : "";
  }

  function hideExploreSearchSuggestions() {
    const suggestions = document.getElementById("explore-search-suggestions");
    if (!suggestions) return;

    suggestions.hidden = true;
    suggestions.innerHTML = "";
  }

  function getExploreSearchSuggestions(query) {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    if (normalizedQuery.length < EXPLORE_SEARCH_MIN_LENGTH) return [];

    const startsWithMatches = [];
    const includesMatches = [];

    for (const entry of exploreSearchIndex) {
      if (entry.normalized.startsWith(normalizedQuery)) {
        startsWithMatches.push(entry);
      } else if (entry.normalized.includes(normalizedQuery)) {
        includesMatches.push(entry);
      }

      if (startsWithMatches.length >= EXPLORE_SEARCH_SUGGESTION_LIMIT) break;
    }

    const combined = startsWithMatches.concat(includesMatches);
    return combined.slice(0, EXPLORE_SEARCH_SUGGESTION_LIMIT);
  }

  function renderExploreSearchSuggestions(query) {
    const suggestions = document.getElementById("explore-search-suggestions");
    if (!suggestions) return;

    const matches = getExploreSearchSuggestions(query);
    if (!matches.length) {
      hideExploreSearchSuggestions();
      return;
    }

    suggestions.innerHTML = "";
    const fragment = document.createDocumentFragment();

    matches.forEach((match) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-suggestion-item";
      button.setAttribute("role", "option");
      button.dataset.value = match.value;
      button.innerHTML = `<span>${highlightSuggestionText(match.value, query)}</span><small>${escapeHtml(match.type)}</small>`;
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const input = document.getElementById("explore-search-input");
        if (input) input.value = match.value;
        hideExploreSearchSuggestions();
        applyExploreTableFilters();
      });
      fragment.appendChild(button);
    });

    suggestions.appendChild(fragment);
    suggestions.hidden = false;
  }

  function inferExploreProvinceFromCityTown(cityTown) {
    const selectedCityTown = String(cityTown || "").trim().toLowerCase();
    if (!selectedCityTown || !exploreTableAllRows.length) return "";

    const provinceMatches = new Set();
    exploreTableAllRows.forEach((row) => {
      if (row.__cityTown === selectedCityTown && row.province && row.province !== "Not specified") {
        provinceMatches.add(row.province);
      }
    });

    return provinceMatches.size === 1 ? Array.from(provinceMatches)[0] : "";
  }

  function handleExploreCityTownFilterChange() {
    const cityTownSelect = document.getElementById("explore-filter-city-town");
    const selectedCityTown = cityTownSelect ? cityTownSelect.value : "";

    if (!selectedCityTown) {
      if (exploreProvinceAutoSelectedByCity) {
        resetExploreProvinceFilter({ skipTableFilter: true, keepCityProvinceFlag: true });
        exploreProvinceAutoSelectedByCity = false;
      }
      applyExploreTableFilters();
      return;
    }

    const inferredProvince = inferExploreProvinceFromCityTown(selectedCityTown);
    if (inferredProvince) {
      setExploreProvinceFilter(inferredProvince, {
        toggle: false,
        skipTableFilter: true,
        autoProvince: true
      });
      exploreProvinceAutoSelectedByCity = true;
    }

    applyExploreTableFilters();
  }

  function populateSelect(selectId, values, allLabel = "All") {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = allLabel;
    select.appendChild(defaultOption);

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    if (currentValue && values.includes(currentValue)) {
      select.value = currentValue;
    }
  }


  function updateExploreCityTownOptions(provinceName = null) {
    if (!exploreTableAllRows.length) return;

    const cityTownSelect = document.getElementById("explore-filter-city-town");
    if (!cityTownSelect) return;

    const provinceValue = String(
      provinceName ||
      (document.getElementById("explore-filter-province") ? document.getElementById("explore-filter-province").value : "") ||
      ""
    ).trim().toLowerCase();

    const rowsForCities = provinceValue
      ? exploreTableAllRows.filter((row) => row.__province === provinceValue)
      : exploreTableAllRows;

    const values = getUniqueSortedValues(rowsForCities, "cityTown");
    const currentValue = cityTownSelect.value;

    populateSelect("explore-filter-city-town", values);

    if (currentValue && values.includes(currentValue)) {
      cityTownSelect.value = currentValue;
    } else if (currentValue) {
      cityTownSelect.value = "";
    }
  }

  function setExploreSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const nextValue = String(value || "").trim();
    if (nextValue && !Array.from(select.options).some((option) => option.value === nextValue)) {
      const option = document.createElement("option");
      option.value = nextValue;
      option.textContent = nextValue;
      select.appendChild(option);
    }

    select.value = nextValue;
  }

  function populateExploreFilterOptions(rows) {
    const provinceValues = provinceStatsData && provinceStatsData.provinceOrder
      ? provinceStatsData.provinceOrder
      : getUniqueSortedValues(rows, "province");

    populateSelect("explore-filter-province", provinceValues);
    populateSelect("explore-filter-career", getUniqueSortedValues(rows, "career"));
    populateSelect("explore-filter-status", getUniqueSortedValues(rows, "accreditationStatus"));
    populateSelect("explore-filter-partner", getUniqueSortedValues(rows, "setaPartner"));
    updateExploreCityTownOptions(selectedExploreProvince);

    syncExploreProvinceSelect(selectedExploreProvince);
  }

  function getExploreFilterValues(overrides = {}) {
    const provinceSelect = document.getElementById("explore-filter-province");
    const careerSelect = document.getElementById("explore-filter-career");
    const cityTownSelect = document.getElementById("explore-filter-city-town");
    const statusSelect = document.getElementById("explore-filter-status");
    const partnerSelect = document.getElementById("explore-filter-partner");

    return {
      province: Object.prototype.hasOwnProperty.call(overrides, "provinceOverride")
        ? overrides.provinceOverride
        : (provinceSelect ? provinceSelect.value : ""),
      career: careerSelect ? careerSelect.value : "",
      cityTown: cityTownSelect ? cityTownSelect.value : "",
      status: statusSelect ? statusSelect.value : "",
      partner: partnerSelect ? partnerSelect.value : "",
      search: getExploreSearchQuery(),
      searchMode: selectedExploreSearchMode,
      qualificationPrefix: selectedExploreQualificationPrefix
    };
  }

  function createExploreResultsRow(row) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(row.providerName)}</td>
      <td>${escapeHtml(row.province)}</td>
      <td>${escapeHtml(row.career)}</td>
      <td>${escapeHtml(row.qualificationTitle)}</td>
      <td class="nqf-cell">${escapeHtml(row.nqfLevel)}</td>
      <td>${escapeHtml(row.setaPartner)}</td>
      <td><span class="${getStatusClass(row.accreditationStatus)}">${escapeHtml(row.accreditationStatus)}</span></td>
      <td class="email-cell">${getEmailLinkHtml(row.email)}</td>
      <td class="contact-cell">${escapeHtml(row.contact)}</td>
    `;

    return tr;
  }

  function renderExploreTableBatch(batchSize = EXPLORE_TABLE_BATCH_SIZE) {
    const tbody = document.getElementById("explore-results-body");
    if (!tbody || !exploreTableRows.length || exploreRowsLoaded >= exploreTableRows.length) return;

    const fragment = document.createDocumentFragment();
    const end = Math.min(exploreRowsLoaded + batchSize, exploreTableRows.length);

    for (let index = exploreRowsLoaded; index < end; index += 1) {
      fragment.appendChild(createExploreResultsRow(exploreTableRows[index]));
    }

    tbody.appendChild(fragment);
    exploreRowsLoaded = end;
  }

  function resetExploreTableRender() {
    const tbody = document.getElementById("explore-results-body");
    const scrollContainer = document.querySelector(".explore-table-scroll");
    if (!tbody) return;

    tbody.innerHTML = "";
    exploreRowsLoaded = 0;

    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
      scrollContainer.scrollLeft = 0;
    }

    if (!exploreTableRows.length) {
      tbody.innerHTML = '<tr><td colspan="9">No matching records found.</td></tr>';
      return;
    }

    renderExploreTableBatch(EXPLORE_TABLE_BATCH_SIZE);
  }

  function updateExploreStatsFromRows(rows) {
    if (!Array.isArray(rows) || !rows.length) {
      updateExploreStats({
        accreditationRecords: 0,
        uniqueOrganisations: 0,
        activeAccreditations: 0,
        setaQualityPartners: 0
      });
      return;
    }

    const uniqueOrganisations = new Set();
    const uniquePartners = new Set();
    let activeCount = 0;

    rows.forEach((row) => {
      const orgId = String(row.orgGroupId || row.uniqueOrgId || "").trim();
      const providerFallback = String(row.providerName || "").trim().toLowerCase();
      const partner = String(row.setaPartner || "").trim();
      const status = String(row.accreditationStatus || "").trim().toLowerCase();

      if (orgId && orgId !== "Not specified") {
        uniqueOrganisations.add(orgId.toLowerCase());
      } else if (providerFallback && providerFallback !== "not specified") {
        uniqueOrganisations.add("provider:" + providerFallback);
      }

      if (partner && partner !== "Not specified") uniquePartners.add(partner);
      if (status === "active" || status.startsWith("active ")) activeCount += 1;
    });

    updateExploreStats({
      accreditationRecords: rows.length,
      uniqueOrganisations: uniqueOrganisations.size,
      activeAccreditations: activeCount,
      setaQualityPartners: uniquePartners.size
    });
  }

  function applyExploreTableFilters(overrides = {}) {
    if (!exploreTableInitialised || !exploreTableAllRows.length) return;

    const filters = getExploreFilterValues(overrides);
    const selectedProvince = String(filters.province || "").toLowerCase();
    const selectedCareer = String(filters.career || "").toLowerCase();
    const selectedCityTown = String(filters.cityTown || "").toLowerCase();
    const selectedStatus = String(filters.status || "").toLowerCase();
    const selectedPartner = String(filters.partner || "").toLowerCase();
    const searchQuery = String(filters.search || "").toLowerCase();
    const searchMode = String(filters.searchMode || "all").toLowerCase();
    const selectedQualificationPrefix = String(filters.qualificationPrefix || "").toLowerCase();

    exploreTableRows = exploreTableAllRows.filter((row) => {
      if (selectedProvince && row.__province !== selectedProvince) return false;
      if (selectedCareer && row.__career !== selectedCareer) return false;
      if (selectedCityTown && row.__cityTown !== selectedCityTown) return false;
      if (selectedStatus && row.__status !== selectedStatus) return false;
      if (selectedPartner && row.__setaPartner !== selectedPartner) return false;
      if (selectedQualificationPrefix && !row.__qualificationTitle.startsWith(selectedQualificationPrefix)) return false;
      if (searchQuery) {
        const searchHaystack = searchMode === "careeronly"
          ? row.__career
          : searchMode === "careerqualification"
            ? row.__careerQualificationHaystack
            : row.__searchHaystack;
        if (!searchHaystack.includes(searchQuery)) return false;
      }
      return true;
    });

    updateExploreStatsFromRows(exploreTableRows);
    resetExploreTableRender();
  }

  function applyExploreFiltersFromHome(filters = {}) {
    const province = String(filters.province || "").trim();
    const career = String(filters.career || "").trim();
    const qualificationPrefix = String(filters.qualificationPrefix || "").trim();
    const partner = String(filters.partner || "").trim();
    const searchTerm = String(filters.searchTerm || "").trim();
    const searchScope = String(filters.searchScope || "all").trim().toLowerCase();

    [
      "explore-filter-province",
      "explore-filter-career",
      "explore-filter-city-town",
      "explore-filter-status",
      "explore-filter-partner"
    ].forEach((selectId) => setExploreSelectValue(selectId, ""));

    const searchInput = document.getElementById("explore-search-input");
    if (searchInput) searchInput.value = searchTerm || qualificationPrefix;
    hideExploreSearchSuggestions();
    exploreProvinceAutoSelectedByCity = false;
    selectedExploreQualificationPrefix = qualificationPrefix;
    selectedExploreSearchMode = searchTerm ? searchScope : "all";

    setExploreSelectValue("explore-filter-career", career);
    setExploreSelectValue("explore-filter-partner", partner);

    if (province) {
      setExploreSelectValue("explore-filter-province", province);
      setExploreProvinceFilter(province, { toggle: false, skipTableFilter: true });
    } else {
      resetExploreProvinceFilter({ skipTableFilter: true });
    }

    applyExploreTableFilters({ provinceOverride: province });
  }

  function applyPendingExploreFilters() {
    if (!pendingExploreFilters || !exploreTableInitialised) return;
    applyExploreFiltersFromHome(pendingExploreFilters);
    pendingExploreFilters = null;
  }

  async function goToExploreWithFilters(filters) {
    pendingExploreFilters = filters || {};
    showView("explore");

    try {
      await initExploreResultsTableLazy();
    } catch (error) {
      console.error(error);
    }

    requestAnimationFrame(() => {
      applyPendingExploreFilters();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function clearExploreFilters() {
    [
      "explore-filter-province",
      "explore-filter-career",
      "explore-filter-city-town",
      "explore-filter-status",
      "explore-filter-partner"
    ].forEach((selectId) => {
      const select = document.getElementById(selectId);
      if (select) select.value = "";
    });

    const searchInput = document.getElementById("explore-search-input");
    if (searchInput) searchInput.value = "";
    hideExploreSearchSuggestions();
    exploreProvinceAutoSelectedByCity = false;
    selectedExploreQualificationPrefix = "";
    selectedExploreSearchMode = "all";

    resetExploreProvinceFilter({ skipTableFilter: true });
    applyExploreTableFilters({ provinceOverride: "" });
  }

  function initExploreFilterControls() {
    const provinceSelect = document.getElementById("explore-filter-province");
    const careerSelect = document.getElementById("explore-filter-career");
    const cityTownSelect = document.getElementById("explore-filter-city-town");
    const statusSelect = document.getElementById("explore-filter-status");
    const partnerSelect = document.getElementById("explore-filter-partner");
    const clearButton = document.getElementById("explore-clear-filters");

    if (provinceSelect && provinceStatsData && provinceStatsData.provinceOrder) {
      populateSelect("explore-filter-province", provinceStatsData.provinceOrder);
    }

    if (provinceSelect && provinceSelect.dataset.qctoFilterReady !== "true") {
      provinceSelect.dataset.qctoFilterReady = "true";
      provinceSelect.addEventListener("change", () => {
        if (provinceSelect.value) {
          setExploreProvinceFilter(provinceSelect.value, { toggle: false });
        } else {
          resetExploreProvinceFilter();
        }
      });
    }

    [careerSelect, statusSelect, partnerSelect].forEach((select) => {
      if (!select || select.dataset.qctoFilterReady === "true") return;
      select.dataset.qctoFilterReady = "true";
      select.addEventListener("change", () => {
        applyExploreTableFilters();
      });
    });

    if (cityTownSelect && cityTownSelect.dataset.qctoFilterReady !== "true") {
      cityTownSelect.dataset.qctoFilterReady = "true";
      cityTownSelect.addEventListener("change", handleExploreCityTownFilterChange);
    }

    initExploreSearchControls();

    if (clearButton && clearButton.dataset.qctoFilterReady !== "true") {
      clearButton.dataset.qctoFilterReady = "true";
      clearButton.addEventListener("click", clearExploreFilters);
    }
  }

  function initExploreSearchControls() {
    const input = document.getElementById("explore-search-input");
    const button = document.getElementById("explore-search-button");
    const form = input ? input.closest("form") : null;

    if (!input || input.dataset.qctoSearchReady === "true") return;

    input.dataset.qctoSearchReady = "true";

    input.addEventListener("input", () => {
      window.clearTimeout(exploreSearchTimer);
      const query = input.value.trim();

      exploreSearchTimer = window.setTimeout(() => {
        selectedExploreSearchMode = "all";
        if (query.length >= EXPLORE_SEARCH_MIN_LENGTH) {
          renderExploreSearchSuggestions(query);
        } else {
          hideExploreSearchSuggestions();
        }
        applyExploreTableFilters();
      }, 160);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideExploreSearchSuggestions();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        hideExploreSearchSuggestions();
        applyExploreTableFilters();
      }
    });

    input.addEventListener("focus", () => {
      const query = input.value.trim();
      if (query.length >= EXPLORE_SEARCH_MIN_LENGTH) {
        renderExploreSearchSuggestions(query);
      }
    });

    if (button) {
      button.addEventListener("click", () => {
        selectedExploreSearchMode = "all";
        hideExploreSearchSuggestions();
        applyExploreTableFilters();
      });
    }

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        selectedExploreSearchMode = "all";
        hideExploreSearchSuggestions();
        applyExploreTableFilters();
      });
    }

    document.addEventListener("click", (event) => {
      const suggestions = document.getElementById("explore-search-suggestions");
      if (!suggestions || suggestions.hidden) return;
      if (form && form.contains(event.target)) return;
      hideExploreSearchSuggestions();
    });
  }

  async function initExploreResultsTableLazy() {
    if (exploreTableInitialised || exploreTableLoading) return;

    const tbody = document.getElementById("explore-results-body");
    const scrollContainer = document.querySelector(".explore-table-scroll");
    if (!tbody || !scrollContainer) return;

    exploreTableLoading = true;
    tbody.innerHTML = '<tr><td colspan="9">Loading provider records...</td></tr>';

    try {
      await ensureExploreRowsLoaded();
      exploreTableRows = exploreTableAllRows;
      tbody.innerHTML = "";
      exploreRowsLoaded = 0;
      exploreTableInitialised = true;
      populateExploreFilterOptions(exploreTableAllRows);
      applyExploreTableFilters();
      applyPendingExploreFilters();

      if (!exploreTableScrollBound) {
        exploreTableScrollBound = true;
        scrollContainer.addEventListener("scroll", () => {
          const nearBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 120;
          if (nearBottom) renderExploreTableBatch(EXPLORE_TABLE_BATCH_SIZE);
        });
      }
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="9">Unable to load provider records.</td></tr>';
      console.error(error);
    } finally {
      exploreTableLoading = false;
    }
  }

  function initSelectControlPickers() {
    document.querySelectorAll(".select-control").forEach((control) => {
      if (control.dataset.qctoPickerReady === "true") return;
      const select = control.querySelector("select");
      if (!select) return;

      control.dataset.qctoPickerReady = "true";
      control.addEventListener("click", (event) => {
        if (event.target === select) return;
        event.preventDefault();
        select.focus();

        if (typeof select.showPicker === "function") {
          try {
            select.showPicker();
          } catch (error) {
            // Some browsers only allow showPicker during direct user activation.
          }
        }
      });
    });
  }

  function hideHomeSearchSuggestions() {
    const suggestions = document.getElementById("home-search-suggestions");
    if (!suggestions) return;

    suggestions.hidden = true;
    suggestions.innerHTML = "";
  }

  function getHomeSearchSuggestions(query) {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    if (normalizedQuery.length < HOME_SEARCH_MIN_LENGTH) return [];

    const startsWithMatches = [];
    const includesMatches = [];

    for (const entry of homeSearchIndex) {
      if (entry.normalized.startsWith(normalizedQuery)) {
        startsWithMatches.push(entry);
      } else if (entry.normalized.includes(normalizedQuery)) {
        includesMatches.push(entry);
      }
    }

    return startsWithMatches.concat(includesMatches).slice(0, HOME_SEARCH_SUGGESTION_LIMIT);
  }

  function executeHomeSearch(rawQuery) {
    const query = String(rawQuery || "").trim();
    if (!query) return;

    const input = document.getElementById("home-search-input");
    if (input) input.value = query;

    hideHomeSearchSuggestions();
    goToExploreWithFilters({
      searchTerm: query,
      searchScope: "careerQualification"
    });
  }

  function renderHomeSearchSuggestions(query) {
    const suggestions = document.getElementById("home-search-suggestions");
    if (!suggestions) return;

    const matches = getHomeSearchSuggestions(query);
    if (!matches.length) {
      hideHomeSearchSuggestions();
      return;
    }

    suggestions.innerHTML = "";
    const fragment = document.createDocumentFragment();

    matches.forEach((match) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-suggestion-item";
      button.setAttribute("role", "option");
      button.dataset.value = match.value;
      button.innerHTML = `<span>${highlightSuggestionText(match.label, query)}</span><small>${escapeHtml(match.type)}</small>`;
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        executeHomeSearch(match.value);
      });
      fragment.appendChild(button);
    });

    suggestions.appendChild(fragment);
    suggestions.hidden = false;
  }

  function buildCareerSearchIndex() {
    const seen = new Map();

    buildAllCareersFromFamilies().forEach((item) => {
      const career = String(item.career || "").trim();
      if (!career) return;

      const key = career.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, {
          type: "Career",
          value: career,
          family: item.family || "",
          normalized: key
        });
      }
    });

    return Array.from(seen.values()).sort((a, b) => a.value.localeCompare(b.value));
  }

  function hideCareerSearchSuggestions() {
    const suggestions = document.getElementById("career-search-suggestions");
    if (!suggestions) return;

    suggestions.hidden = true;
    suggestions.innerHTML = "";
  }

  function getCareerSearchSuggestions(query) {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    if (normalizedQuery.length < CAREER_SEARCH_MIN_LENGTH) return [];

    const startsWithMatches = [];
    const includesMatches = [];

    for (const entry of careerSearchIndex) {
      if (entry.normalized.startsWith(normalizedQuery)) {
        startsWithMatches.push(entry);
      } else if (entry.normalized.includes(normalizedQuery)) {
        includesMatches.push(entry);
      }
    }

    return startsWithMatches.concat(includesMatches).slice(0, CAREER_SEARCH_SUGGESTION_LIMIT);
  }

  function executeCareerSearch(rawQuery) {
    const query = String(rawQuery || "").trim();
    if (!query) return;

    const input = document.getElementById("career-search-input");
    if (input) input.value = query;

    hideCareerSearchSuggestions();

    const exact = careerSearchIndex.find((entry) => entry.normalized === query.toLowerCase());
    if (exact) {
      goToExploreWithFilters({ career: exact.value });
      return;
    }

    goToExploreWithFilters({
      searchTerm: query,
      searchScope: "careerOnly"
    });
  }

  function renderCareerSearchSuggestions(query) {
    const suggestions = document.getElementById("career-search-suggestions");
    if (!suggestions) return;

    const matches = getCareerSearchSuggestions(query);
    if (!matches.length) {
      hideCareerSearchSuggestions();
      return;
    }

    suggestions.innerHTML = "";
    const fragment = document.createDocumentFragment();

    matches.forEach((match) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-suggestion-item";
      button.setAttribute("role", "option");
      button.dataset.value = match.value;
      button.innerHTML = `<span>${highlightSuggestionText(match.value, query)}</span><small>Career</small>`;
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        executeCareerSearch(match.value);
      });
      fragment.appendChild(button);
    });

    suggestions.appendChild(fragment);
    suggestions.hidden = false;
  }

  function initCareerSearchControls() {
    const input = document.getElementById("career-search-input");
    const button = document.getElementById("career-search-button");
    const form = document.getElementById("career-search-form");

    if (!input || input.dataset.qctoCareerSearchReady === "true") return;
    input.dataset.qctoCareerSearchReady = "true";

    const loadIndex = async () => {
      if (!careerSearchIndex.length) {
        careerSearchIndex = buildCareerSearchIndex();
      }
    };

    input.addEventListener("focus", async () => {
      await loadIndex();
      const query = input.value.trim();
      if (query.length >= CAREER_SEARCH_MIN_LENGTH) {
        renderCareerSearchSuggestions(query);
      }
    });

    input.addEventListener("input", () => {
      window.clearTimeout(careerSearchTimer);
      const query = input.value.trim();

      careerSearchTimer = window.setTimeout(async () => {
        if (query.length < CAREER_SEARCH_MIN_LENGTH) {
          hideCareerSearchSuggestions();
          return;
        }

        await loadIndex();
        renderCareerSearchSuggestions(query);
      }, 120);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideCareerSearchSuggestions();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        executeCareerSearch(input.value);
      }
    });

    if (button) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        executeCareerSearch(input.value);
      });
    }

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        executeCareerSearch(input.value);
      });
    }

    document.addEventListener("click", (event) => {
      const suggestions = document.getElementById("career-search-suggestions");
      if (!suggestions || suggestions.hidden) return;
      if ((form && form.contains(event.target)) || suggestions.contains(event.target)) return;
      hideCareerSearchSuggestions();
    });
  }

  function initHomeSearchControls() {
    const input = document.getElementById("home-search-input");
    const button = document.getElementById("home-search-button");
    const form = document.getElementById("home-search-form");

    if (!input || input.dataset.qctoHomeSearchReady === "true") return;
    input.dataset.qctoHomeSearchReady = "true";

    const loadIndex = async () => {
      try {
        await ensureHomeSearchIndexLoaded();
      } catch (error) {
        console.error(error);
      }
    };

    input.addEventListener("focus", () => {
      loadIndex();
    });

    input.addEventListener("input", () => {
      window.clearTimeout(homeSearchTimer);
      const query = input.value.trim();

      homeSearchTimer = window.setTimeout(async () => {
        if (query.length < HOME_SEARCH_MIN_LENGTH) {
          hideHomeSearchSuggestions();
          return;
        }

        await loadIndex();
        renderHomeSearchSuggestions(query);
      }, 140);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideHomeSearchSuggestions();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        executeHomeSearch(input.value);
      }
    });

    if (button) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        executeHomeSearch(input.value);
      });
    }

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        executeHomeSearch(input.value);
      });
    }

    document.addEventListener("click", (event) => {
      const suggestions = document.getElementById("home-search-suggestions");
      if (!suggestions || suggestions.hidden) return;
      if ((form && form.contains(event.target)) || suggestions.contains(event.target)) return;
      hideHomeSearchSuggestions();
    });
  }

  function initHomeExploreShortcuts() {

    if (document.documentElement.dataset.qctoHomeExploreShortcutsReady === "true") return;
    document.documentElement.dataset.qctoHomeExploreShortcutsReady = "true";

    document.addEventListener("click", (event) => {
      const careerItem = event.target.closest("[data-explore-career]");
      if (careerItem) {
        event.preventDefault();
        const career = careerItem.dataset.exploreCareer;
        if (career) goToExploreWithFilters({ career });
        return;
      }

      const provinceItem = event.target.closest("[data-explore-province]");
      if (provinceItem) {
        event.preventDefault();
        const province = provinceItem.dataset.exploreProvince;
        if (province) goToExploreWithFilters({ province });
        return;
      }

      const qualificationItem = event.target.closest("[data-explore-qualification-prefix]");
      if (qualificationItem) {
        event.preventDefault();
        const qualificationPrefix = qualificationItem.dataset.exploreQualificationPrefix;
        if (qualificationPrefix) goToExploreWithFilters({ qualificationPrefix });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      const shortcutItem = event.target.closest("[data-explore-career], [data-explore-province], [data-explore-qualification-prefix]");
      if (!shortcutItem) return;

      event.preventDefault();
      shortcutItem.click();
    });
  }


  function getCareerFamilyIconName(familyName) {
    return (CAREER_FAMILY_META[familyName] && CAREER_FAMILY_META[familyName].icon) || "grid";
  }

  function getCareerNqfLabel(careerName) {
    const cleanCareer = String(careerName || "").trim();
    if (!cleanCareer) return "NQF Level not listed";

    if (ROLE_NQF_LOOKUP[cleanCareer]) return ROLE_NQF_LOOKUP[cleanCareer];

    const lowerCareer = cleanCareer.toLowerCase();
    const matchedKey = Object.keys(ROLE_NQF_LOOKUP).find((key) => key.toLowerCase() === lowerCareer);
    if (matchedKey) return ROLE_NQF_LOOKUP[matchedKey];

    if (!exploreTableAllRows.length) return "NQF Level not listed";

    const levels = Array.from(new Set(
      exploreTableAllRows
        .filter((row) => String(row.career || "").trim().toLowerCase() === lowerCareer)
        .map((row) => String(row.nqfLevel || "").trim().replace(/^NQF\s*Level\s*/i, ""))
        .filter(Boolean)
    )).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));

    if (!levels.length) return "NQF Level not listed";
    if (levels.length === 1) return `NQF Level ${levels[0]}`;
    if (levels.length <= 3) {
      const last = levels[levels.length - 1];
      const first = levels.slice(0, -1).join(", ");
      return `NQF Levels ${first} & ${last}`;
    }

    return `NQF Levels ${levels[0]} - ${levels[levels.length - 1]}`;
  }

  function buildAllCareersFromFamilies() {
    const seen = new Map();

    Object.entries(CAREER_FAMILY_CAREERS).forEach(([familyName, careers]) => {
      careers.forEach((careerName) => {
        const cleanCareer = String(careerName || "").trim();
        if (!cleanCareer) return;

        const key = cleanCareer.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, {
            career: cleanCareer,
            family: familyName,
            nqfLabel: getCareerNqfLabel(cleanCareer),
            icon: getCareerFamilyIconName(familyName)
          });
        }
      });
    });

    return Array.from(seen.values()).sort((a, b) => a.career.localeCompare(b.career));
  }

  function renderPopularCareersList() {
    const list = document.getElementById("popular-careers-list");
    if (!list) return;

    const careers = buildAllCareersFromFamilies();
    const fragment = document.createDocumentFragment();

    careers.forEach((item) => {
      const button = document.createElement("button");
      button.className = "career-row";
      const careerNameLength = String(item.career || "").length;
      const combinedCareerTextLength = careerNameLength + String(item.family || "").length + String(item.nqfLabel || "").length;
      if (careerNameLength > 80 || combinedCareerTextLength > 135) {
        button.classList.add("career-row--very-long");
      } else if (careerNameLength > 52 || combinedCareerTextLength > 105) {
        button.classList.add("career-row--long");
      }
      button.type = "button";
      button.dataset.popularCareer = item.career;
      button.innerHTML = `
        <span class="career-line-icon ${escapeHtml(item.icon)}" aria-hidden="true"></span>
        <span class="career-row-copy">
          <strong>${escapeHtml(item.career)}</strong>
          <small>${escapeHtml(item.family)} &middot; ${escapeHtml(item.nqfLabel)}</small>
        </span>
        <span class="career-chevron" aria-hidden="true">&rsaquo;</span>
      `;
      fragment.appendChild(button);
    });

    list.innerHTML = "";
    list.appendChild(fragment);
  }

  function initPopularCareersList() {
    renderPopularCareersList();

    if (document.documentElement.dataset.qctoPopularCareersReady === "true") return;
    document.documentElement.dataset.qctoPopularCareersReady = "true";

    document.addEventListener("click", (event) => {
      const row = event.target.closest("[data-popular-career]");
      if (!row) return;

      event.preventDefault();
      const career = row.dataset.popularCareer;
      if (career) goToExploreWithFilters({ career });
    });
  }

  function closeCareerFamilyModal() {
    const modal = document.getElementById("career-family-modal");
    if (!modal) return;

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("career-family-modal-open");
  }

  function openCareerFamilyModal(familyName) {
    const modal = document.getElementById("career-family-modal");
    const title = document.getElementById("career-family-modal-title");
    const summary = document.getElementById("career-family-modal-summary");
    const rolesContainer = document.getElementById("career-family-modal-roles");
    const icon = document.getElementById("career-family-modal-icon");

    if (!modal || !title || !summary || !rolesContainer) return;

    const roles = CAREER_FAMILY_CAREERS[familyName] || [];
    const meta = CAREER_FAMILY_META[familyName] || {};
    const countText = roles.length === 1 ? "1 career" : roles.length + " careers";

    title.textContent = familyName;
    summary.textContent = countText + " available in this family. Choose a career to open Explore with matching records.";
    if (icon) {
      icon.className = "career-line-icon career-family-modal__icon " + (meta.icon || "grid");
    }

    rolesContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();

    roles.forEach((roleName) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "career-family-role-card";
      button.dataset.familyCareer = roleName;
      button.innerHTML = `
        <strong>${escapeHtml(roleName)}</strong>
        <small>Open matching records on Explore</small>
      `;
      fragment.appendChild(button);
    });

    rolesContainer.appendChild(fragment);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("career-family-modal-open");

    const firstRole = rolesContainer.querySelector("button");
    if (firstRole) {
      firstRole.focus({ preventScroll: true });
    } else {
      const closeButton = modal.querySelector("[data-close-career-family-modal]");
      if (closeButton) closeButton.focus({ preventScroll: true });
    }
  }

  function initCareerFamilyModal() {
    if (document.documentElement.dataset.qctoCareerFamilyModalReady === "true") return;
    document.documentElement.dataset.qctoCareerFamilyModalReady = "true";

    document.addEventListener("click", (event) => {
      const familyTile = event.target.closest("[data-career-family]");
      if (familyTile) {
        event.preventDefault();
        openCareerFamilyModal(familyTile.dataset.careerFamily);
        return;
      }

      const roleCard = event.target.closest("[data-family-career]");
      if (roleCard) {
        event.preventDefault();
        const career = roleCard.dataset.familyCareer;
        closeCareerFamilyModal();
        if (career) goToExploreWithFilters({ career });
        return;
      }

      if (event.target.closest("[data-close-career-family-modal]")) {
        event.preventDefault();
        closeCareerFamilyModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      const modal = document.getElementById("career-family-modal");
      if (!modal || modal.hidden) return;

      if (event.key === "Escape") {
        closeCareerFamilyModal();
      }
    });
  }


  function clearVisualForms() {
    document.querySelectorAll("input").forEach((input) => {
      input.value = "";
    });

    document.querySelectorAll("select").forEach((select) => {
      select.selectedIndex = 0;
    });
  }

  function setMobileMenuOpen(isOpen) {
    if (!mobileMenuToggle || !mainNav) return;
    document.body.classList.toggle("mobile-nav-open", isOpen);
    mobileMenuToggle.classList.toggle("is-open", isOpen);
    mobileMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    mobileMenuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  }

  function toggleMobileMenu() {
    const isOpen = document.body.classList.contains("mobile-nav-open");
    setMobileMenuOpen(!isOpen);
  }

  function showView(viewName, updateHash = true) {
    const nextView = validViews.includes(viewName) ? viewName : "home";

    pageViews.forEach((view) => {
      view.classList.toggle("active", view.dataset.page === nextView);
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.view === nextView);
    });

    setMobileMenuOpen(false);

    if (updateHash) {
      history.replaceState(null, "", "#" + nextView);
    }

    window.scrollTo({ top: 0, behavior: updateHash ? "smooth" : "auto" });

    if (nextView === "explore") {
      initExploreFilterControls();
      initSelectControlPickers();
      initExploreResultsTableLazy();
    }
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", toggleMobileMenu);
  }

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("mobile-nav-open")) return;
    if (mobileMenuToggle && mobileMenuToggle.contains(event.target)) return;
    if (mainNav && mainNav.contains(event.target)) return;
    setMobileMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMobileMenuOpen(false);
  });

  viewTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      const viewName = trigger.dataset.view;
      if (!viewName) return;

      event.preventDefault();
      showView(viewName);
    });
  });

  clearVisualForms();
  initExploreFilterControls();
  initSelectControlPickers();
  initHomeProvinceMapInteraction();
  initHomePartnerCarousel();
  initHomeSearchControls();
  initCareerSearchControls();
  initHomeExploreShortcuts();
  initPopularCareersList();
  initCareerFamilyModal();
  initExploreProvinceMapInteraction();
  window.resetHomeProvinceFilter = resetHomeProvinceFilter;
  window.resetExploreProvinceFilter = resetExploreProvinceFilter;
  window.setExploreProvinceFilter = setExploreProvinceFilter;

  const initialView = (location.hash || "#home").replace("#", "").trim();
  showView(initialView, false);
})();
