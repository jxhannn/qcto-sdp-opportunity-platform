(function () {
  const pageViews = document.querySelectorAll(".page-view");
  const navLinks = document.querySelectorAll(".main-nav .nav-link");
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

    if (nameTarget) nameTarget.textContent = partner.name || partner.key || "Quality Partner";
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
  "Business & Management": [
    "Abattoir Supervisor",
    "Access Control Officer",
    "Agricultural Worker",
    "Business Administrator",
    "Business Banker",
    "Cash Office Clerk",
    "Compliance Officer",
    "Contact Centre Manager",
    "Credit or Loans Officer",
    "Customs Compliance Manager",
    "Dairy Unit Manager",
    "E-Waste Operations Controller",
    "Facilities Manager",
    "Finance Administrator",
    "First-line Production Supervisor",
    "Foreign Exchange Officer",
    "Forestry Production and Operations Foreman",
    "Franchise Manager",
    "Gardener",
    "General Manager Public Service",
    "Geomatics Officer",
    "Grain Depot Manager",
    "Health Information Manager",
    "Health Products Information Officer",
    "Health Promotion Officer",
    "HR Administrator",
    "Immigration Officer",
    "Management Accountant",
    "Management Accounting Officer",
    "Management Accounting Practitioner",
    "Management Accounting Specialist",
    "Management Assistant",
    "Marine Electro-Technical Officer",
    "Marketing Management",
    "Media Production Assistant",
    "Methods Analyst",
    "Mining Operator",
    "Multi-Disciplinary Drawing: Office Practice",
    "Municipal Finance Manager",
    "New Venture",
    "New Venture Creation",
    "Nursery Person (Garden Centre Supervisor)",
    "Nurseryperson (Nursery Supervisor)",
    "Occupational Health and Safety Officer",
    "Office Administrator",
    "Office Supervisor",
    "Patrol Officer",
    "Payroll Administrator",
    "Pest Management Officer",
    "Physical Asset Manager",
    "Procurement Officer",
    "Production or Operations Supervisor (Forestry): (Forestry Production Supervisor)",
    "Production Supervisor",
    "Professional Principal Executive Officer",
    "Project Coordinator",
    "Public Administration Officer",
    "Purchasing Officer",
    "Quality Manager",
    "Railway Track Supervisor",
    "Recruitment Manager",
    "Refugee Status Determination Officer",
    "Retail Chain Store Manager",
    "Retail Manager: Retail Store Manager",
    "Retail Store Manager",
    "Retail Supervisor",
    "Road Traffic Safety Officer",
    "Road Transport Manager",
    "Routine Road Maintenance Manager",
    "Safety Inspector (Forestry and Related Industries Safety Health and Environment Officer)",
    "School Principal (School Manager)",
    "Security Officer",
    "Small Business Consultant",
    "Small Re-cycling Business Owner",
    "Small Retail Business Owner",
    "Supply and Distribution Manager",
    "Technopreneur",
    "Tourist Information Officer",
    "Traffic Officer",
    "Train Control Officer",
    "Water Infrastructure Manager",
    "Water Works Management Practitioner",
    "Work Place Preparedness and Risk Control Officer- Communicable & Other occupational Diseases"
  ],
  "Engineering & Trades": [
    "Aircraft Maintenance Mechanic",
    "Apparel and Related Manufacturing Machine Mechanic",
    "Architectural Draughtsperson",
    "Automotive Technician",
    "Avionics Mechanic",
    "Avionics Mechanician",
    "Bicycle Mechanic",
    "Boilermaker",
    "Chemical Engineering Technician",
    "Civil Engineering Technician",
    "Domestic Water and Drainage Pipe Repairer",
    "Draughtsperson (Piping Draught Person)",
    "Electrician",
    "Electronic Equipment Mechanician",
    "Engine Workshop Maintenance Mechanic",
    "Engineering Studies",
    "Fitter and Turner",
    "Heavy Duty Drive Train Repairer (Vehicle Transmission Mechanic)",
    "Heavy Equipment Mechanic",
    "Instrument Mechanician",
    "Lift Mechanic",
    "Lubrication Equipment Mechanic",
    "Mechanical Engineering Technician",
    "Mechanical Fitter",
    "Metal Machinist",
    "Millwright",
    "Plumber",
    "Propeller Workshop Maintenance Mechanic",
    "Radar Mechanic",
    "Refrigeration Mechanic",
    "Rigger",
    "Sewing Machine Mechanic Operator",
    "Sewing Machine Mechanic Repairer",
    "Sheet Metal Worker",
    "Small Engine Mechanic",
    "Solar PV Installer",
    "Telecommunication Line Mechanic",
    "Textile",
    "Tractor Mechanic",
    "Tractor Mechanic Assistant",
    "Water Reticulation Practitioner",
    "Welder"
  ],
  "ICT & Data": [
    "Advanced Spatial Intelligence Data Scientist",
    "AI Software Developer",
    "Business Development Officer",
    "Career Development Officer",
    "Cloud Administrator",
    "Community Development Practitioner",
    "Computer and Digital Support Assistant",
    "Computer Technician",
    "Conflict Management",
    "Cybersecurity Analyst",
    "Data Analyst",
    "Data and Telecommunications Cabler",
    "Drone Pilot",
    "ECD Practitioner",
    "Extended Reality Developer",
    "Garment Pattern Development Assistant",
    "Hot- and Cold-Water Systems Installer",
    "IT Support Technician",
    "Network Administrator",
    "Radiotrician",
    "RPAS Technician",
    "Software Developer",
    "Software Engineer",
    "Software Tester",
    "Spatial Intelligence Data Scientist",
    "Training and Development Practitioner",
    "Weapon Systems Mechanic"
  ],
  "Health & Social Services": [
    "Aids to Navigation Technician",
    "Beauty Therapist",
    "Body Massage Therapist",
    "Body Therapist",
    "Care Worker",
    "Civic and Health Peer Education",
    "Community Counsellor",
    "Covid-19 Vaccine Demand Creation and Community Advocacy Practitioner",
    "Disability Attendant",
    "Eye Grooming Therapist",
    "Health Products Marketing Associate",
    "Health Products Sales Associate",
    "Medical Secretary",
    "Mine Occupational Health and Safety Representative",
    "Mortician",
    "Nail Therapist",
    "Occupational Health and Safety Assistant",
    "Occupational Health and Safety Practitioner",
    "Pharmacy Support Worker",
    "Safety",
    "Social Counselling Support Worker",
    "Social Counselling Worker",
    "Temporary Hair Removal Therapist"
  ],
  "Media & Communications": [
    "Assistant Life Coach: Communication",
    "Baking and Confectionery Operator",
    "Journalist",
    "Liquid Dairy Reception Operator",
    "Meat Processing Operator",
    "Miner",
    "Public Relations Officer",
    "Surface Blaster",
    "Telecommunications Cable Jointer",
    "Telecommunications Specialist"
  ],
  "Marketing, Sales & Retail": [
    "Checkout Operator",
    "Marketing Coordinator",
    "Perishable Goods Department Coordinator",
    "Retail Buyer",
    "Retail Sales Advisor",
    "Sales Representative",
    "Service Station Attendant",
    "Shelf Filler",
    "Visual Merchandiser"
  ],
  "Hospitality & Tourism": [
    "Chef",
    "Cook",
    "Food and Beverage Packaging Operator",
    "Food Handler",
    "Hospitality Supervisor",
    "Kitchen Hand",
    "Process Machine Operator",
    "Travel Consultant"
  ],
  "Logistics & Supply Chain": [
    "Bus Driver",
    "Forklift Operator",
    "Logistics Clerk",
    "Store Person",
    "Supply Chain Practitioner",
    "Train Driver",
    "Transit Protection Driver",
    "Truck Driver"
  ],
  "Finance & Accounting": [
    "Bookkeeper",
    "Financial Advisor",
    "Heavy Duty Suspension Repairer",
    "Internal Auditor",
    "Retirement Fund Administrator",
    "Tax Technician"
  ],
  "HR & Training": [
    "Adult Literacy Teacher",
    "Foundational Learning Competence",
    "Occupational Trainer",
    "Training Facilitator",
    "Workplace Essential Skills",
    "Workplace Preparation"
  ],
  "Beauty & Personal Care": [
    "Barber",
    "Beauty Practitioner",
    "Dispatching and Receiving Clerk",
    "Hairdresser",
    "Make-Up Consultant"
  ],
  "Insurance & Banking": [
    "Bank Customer Services Clerk",
    "Bank Teller",
    "Banknote Processor",
    "Insurance Advisor",
    "Insurance Underwriter"
  ],
  "Legal & Compliance": [
    "Governance Officer",
    "Legal Secretary",
    "Paralegal",
    "Trade Union Official"
  ],
  "Quality & Risk Management": [
    "Innovation Practitioner",
    "Quality Assurer",
    "Quality Controller",
    "Risk Practitioner"
  ],
  "Sport & Fitness": [
    "Fitness Instructor",
    "Group Fitness Instructor",
    "Individual Fitness Instructor",
    "Sport Talent Scout"
  ],
  "Agriculture & Environment": [
    "Crop Produce Analyst",
    "Environmental Officer",
    "Tractor Operator"
  ],
  "Construction & Building": [
    "Assistant Handyperson",
    "Construction Artisan",
    "General Residential Repairer"
  ],
  "Facilities & Cleaning": [
    "Cleaner",
    "Laundry Worker"
  ],
  "Mining": [
    "Fraud Examiner",
    "Mine Overseer"
  ],
  "Public Sector": [
    "Clearing and Forwarding Agent",
    "Government Official"
  ],
  "Real Estate & Property": [
    "Principal Real Estate Agent",
    "Real Estate Agent"
  ],
  "Emergency Services": [
    "Emergency Services Responder"
  ],
  "Plant & Equipment Operations": [
    "Plant Operator"
  ],
  "Religious & Charitable": [
    "Community / Religious Worker"
  ],
  "Other": [
    "Aalim",
    "Abattoir Foreman",
    "Abattoir Process Worker",
    "Adhesive Binding Machine Operator",
    "Administrative Attache",
    "Advertiser",
    "Aerial Chainsaw Operator",
    "Aircraft Structures Technician",
    "Aircraft Structures Worker",
    "Airline Ground Crew",
    "Animation Artist",
    "Annealing Operator",
    "Anti Money Laundering Analyst",
    "Apparel Pattern Designer Assistant",
    "Apparel Pattern Maker and Grader",
    "Armature Winder",
    "Art & Design Assistant",
    "Asphalt Tester",
    "Assistant Baker",
    "Assistant Baker (Fermented Dough Products)",
    "Assistant Baker: Fermented Dough Products",
    "Auctioneer",
    "Bamboo Floor Finisher",
    "Basic Food Safety Complier",
    "Basic Furniture Upholster",
    "Basic Kitchen Appliance Repairer",
    "Bath Operator",
    "Beam House Machine Operator",
    "Beaming and Sizing Machine Operator",
    "Bicycle Repairer",
    "Bicycle Special Components Repairer",
    "Binder and Finisher",
    "Bitumen Spray Equipment Operator",
    "Bituminous Binders Tester",
    "Blacksmith",
    "Blow Moulding Machine Setter",
    "BodyTalk Practitioner",
    "Braiding Machine Operator",
    "Brush Hand",
    "Butter Maker",
    "Buyer",
    "C++ Programmer",
    "Carpet Floor Finisher",
    "Chainsaw Operator",
    "Chemical Hair Reformation Attendant",
    "Chemical Laboratory Analyst",
    "Chemical Manufacturing Technician",
    "Chemical Plant Controller",
    "Chemical Production Machine Operator",
    "Chemist (Surface Coatings Technologist)",
    "Civic and Soft Skills",
    "Clothing Production",
    "CNC Milling Machinist",
    "CNC Turning Machinist",
    "Coldset Rotary Offset Lithography Printing Technician",
    "Coldset Rotary Offset Lithography Technician",
    "Collaborative Recycler",
    "Commercial Diver",
    "Commercial Housekeeper",
    "Company Secretary",
    "Concrete Tester",
    "Condensed Liquid Dairy Products Maker",
    "Continuous Bucket Trencher Operator",
    "Corrugated Board Manufacturing Machine Minder",
    "Cottage Cheesemaker",
    "Craft Bookbinding Technician",
    "Creeling and Warping Machine Operator",
    "Crystal Healing Practitioner",
    "Cutting Machine Maintenance Assistant",
    "Deck Hand (Able Seaman)",
    "Detective",
    "Diamond and Gemstone Setter",
    "Diamond Cutter",
    "Diplomat",
    "Dock Master",
    "Dried Dairy Products Maker",
    "Driving Instructor",
    "Dry Kiln Operator",
    "Dry Mill Operator",
    "Dump Truck Operator",
    "Eco Ranger",
    "EDM Plunge Operator",
    "EDM Wire Operator",
    "Electronic Originator",
    "Electronic Pre-press Gravure Technician",
    "Emotional Freedom Techniques (EFT) Tapping Practitioner",
    "Energy Kinesiology Practitioner",
    "Energy Performance Certificate (EPC) Practitioner",
    "Engine Able Seafarer",
    "Equestrian Coach or Instructor Level 1",
    "Events Coordinator",
    "Extrusion Machine Setter",
    "Fabricated Glazing Solution Installer",
    "Face Shovel Operator",
    "Family Law Practitioner",
    "Fermented Dairy Products Maker",
    "Fertilizer Manufacturing",
    "Fire Alarm Commissioner",
    "Fire Alarm Designer",
    "Fire Alarm Installer",
    "Fire Alarm Technician",
    "Fishing Hand",
    "Folding Machine Operator",
    "Footwear Closing Production Machine Operator",
    "Footwear Cutting Machine Operator",
    "Footwear Finishing Production Machine Operator",
    "Forestry Incident Investigator",
    "Forestry Production Foreman",
    "Forestry SHE Representative",
    "Forestry Technician",
    "Fossil Power Plant Process Controller",
    "Fresh Dairy Products Maker",
    "Front-End Web Designer",
    "Fuel Pipeline Controller",
    "Furniture Designer",
    "Furniture Maker",
    "Furniture Upholsterer",
    "Garden Designer",
    "Gathering Arm Loader Operator",
    "General Garden Maintenance Worker",
    "General Glazing Installer",
    "Glass Forming Operator",
    "Glass Melt Operator",
    "Glass Process Operator",
    "Goldsmith",
    "Grain Grader",
    "Gravure Cylinder Preperation Technician",
    "Guillotine Operator",
    "Hair and Scalp Treatment Attendant",
    "Hair Colouring Attendant",
    "Hair Cutting Attendant",
    "Hairstylist",
    "Handicraft Footwear Maker",
    "Handicraft Frame Weaver",
    "Handicraft Knitter",
    "Handicraft Sewer",
    "Head Saw Doctor",
    "Heart Resonance Practitioner",
    "Heatset Rotary Offset Lithography Technician",
    "Heavy Duty Clutch and Brake Repairer",
    "Heavy Duty Hydraulic and Pneumatic Repairer",
    "Heavy Duty Workshop Assistant",
    "Hot Mix Asphalt Paving Machine Operator",
    "Hot Water System Installer (Heat Pump Installer)",
    "Hot Water System Installer (Solar Water Installer)",
    "Hydrogen Fuel Cell System Practitioner",
    "Hypertext Markup Language (HTML) Programmer",
    "Ice Cream Products Maker",
    "Imaam",
    "Industrial Water Process Controller",
    "Injection Moulding Machine Setter",
    "Insulation Installer",
    "Interior Decorator",
    "Java Programmer",
    "JavaScript Programmer",
    "Joiner",
    "Labour Inspector",
    "Landscape Designer",
    "Laptop Repairer",
    "Lathe Operator",
    "Leather Tanning Machine Operator",
    "Legislation Administrative Assistant",
    "Library Assistant",
    "Liquid Long Life Dairy Products Maker",
    "Loader Operator",
    "Log Yard Operator",
    "Magazine Master",
    "Maintenance Planner",
    "Major Domestic Appliance Repairer",
    "Man-made Fibre Extrusion Machine Operator",
    "Man-made Fibre Texturing Production Machine Operator",
    "Manufacturing Production Process Controller",
    "Manufacturing Workshop Assistant",
    "Marine Electro-Technical Rating",
    "Market Research Analyst",
    "Master Toolmaker (Purpose Built Machine Master Toolmaker)",
    "Materials Recycler (Paper and Packaging Collector)",
    "Mechanised Hard Cover Bookbinding Technician",
    "Mechanised Soft-Cover Bookbinding Technician",
    "Mechatronics Technician",
    "Melter",
    "Metal Manufacturing",
    "Metal Manufacturing Finishing Process Controller",
    "Metal Manufacturing Material Preparation Process Controller",
    "Metal Manufacturing Rolling Process Controller",
    "Metaphysics Practitioner",
    "Military Police Official",
    "Miller",
    "Milling Machine Operator",
    "Mobile Device Repairer",
    "Mobile Device Technician",
    "Mobile Phone Repairer",
    "Motion Graphics Designer",
    "Moulder",
    "Muallim",
    "Natural Energy Healing Practitioner",
    "Non-Commissioned Police Official",
    "Non-woven Thermo-Bonding Textile Production Machine Operator",
    "Nuclear Power Plant Process Controller",
    "Occupational Screening Spirometry",
    "Orchard and Vineyard Foreman",
    "Orientation and Mobility Practitioner",
    "Packaging Manufacturing Machine Minder",
    "Packaging Rotary Printing and Re-reeling Flexographic Machine Minder",
    "Paintless Dent Remover",
    "Panel Beater",
    "Panelbeater",
    "Paper Process Controller",
    "Paper Sheetfed offset Lithography Technician",
    "Parole Board Member (Offender Placement and Release Practitioner)",
    "Pattern Grader",
    "Pattern Making Assistant",
    "Patternmaker",
    "Paving Screed Operator",
    "Performing Artist",
    "Pharmacist's Assistant (Basic)",
    "Pharmacist's Assistant (Post Basic)",
    "Physical Asset Practitioner",
    "Planner",
    "Plastics Manufacturing Machine Operator",
    "Plastics Manufacturing Machine Setter",
    "Popular Music: Composition",
    "Popular Music: Studio Work",
    "Pothole Repair Person",
    "Pre-Fabricated Glazing Solution Installer",
    "Printing Machinist",
    "Processed Cheese Maker",
    "Production Operator",
    "Production Process Controller",
    "Production Process Machine Operator and Assembler",
    "Proof reader",
    "Pulp Process Controller",
    "Python Developer",
    "Quality Inspector",
    "Quality Test Automator",
    "Radio Operator",
    "Railway Safety Inspector",
    "Railway Signal Operator (Functional Yard Operator)",
    "Railway Signalling Assembler and Wirer",
    "Railway Signalling Installer",
    "Railway Track Constructor",
    "Reach Stacker C48 Operator",
    "Red Meat De-Boner",
    "Refractory Mason",
    "Refrigerant Safe Handling",
    "Reiki Practitioner",
    "Renewable Energy Workshop Assistant",
    "Ringframe Spinning and Yarn Packaging Machine Operator",
    "Ripened Cheesemaker",
    "Roll Label Machine Technician",
    "Room Attendant",
    "Rotary Printing and Re-reeling Flexographic Machine Technician",
    "Rotary Printing And Re-Reeling Gravure Machine Technician",
    "Rotor Spinning and Yarn Packaging Machine Operator",
    "Saddle Stitching Machine Operator",
    "Saw Doctor",
    "Saw Filer",
    "Seamstress",
    "Self-employed re-cycling materials collector",
    "Service Truck Operator",
    "Sewing Machine Maintenance and Repair Technician Assistant",
    "Sewing Machine Operator",
    "Sheetfed Lithography Technician",
    "Side Loader Container C56 Operator",
    "Sideboom Operator",
    "Skid Steer Loader Operator",
    "Small Domestic Appliance Repairer",
    "Soils",
    "Sound Operator",
    "Specialised Chainsaw Operator",
    "Specialised Glazing Solution Installer",
    "Speciality Yarn Assembly Machine Operator",
    "Spout Operator",
    "Stonemason",
    "Straddle Carrier C49 Operator",
    "Structural Plater",
    "Sugar Processing Controller",
    "Sugar Processing Machine Operator",
    "Surface Grinding Operator",
    "Surface Safe Declarer",
    "Survey Interviewer",
    "Text Editor",
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
    "Tissue Backstand Operator",
    "Tissue Converter Machine Operator",
    "Tissue Packaging Attendant",
    "Tooling CAD Operator",
    "Tooling Machinist",
    "Toolmaker",
    "Trustee",
    "Tufting Machine Operator",
    "Underground Hardrock Safe Declarer",
    "Underground Hardrock Support Installer",
    "Unitary Air Conditioning Installer",
    "Upholstery Frame Preparer",
    "Vehicle Damage Quantifier",
    "Viticulture Worker",
    "Warp Knitting Machine Operator",
    "Warping Machine Operator",
    "Water and Sanitation Coordinator",
    "Water Cart Operator",
    "Water Process Controller",
    "Water Regulation Practitioner",
    "Wearables",
    "Weaving Machine Operator",
    "Weft Knitting Machine Operator",
    "Wet Mill Operator",
    "Wheel Balancer",
    "Wind Turbine Service Technician",
    "Winemaker's Assistant",
    "Wood Processing Machine Operator",
    "Work Place Preparedness and Risk Control Assistant-Communicable & Other occupational Diseases",
    "Workshop Tool Assistant"
  ]
};

  const CAREER_FAMILY_META = {
  "Business & Management": {
    "icon": "briefcase",
    "description": "Manage teams, operations and organisational growth."
  },
  "Engineering & Trades": {
    "icon": "gear",
    "description": "Build, install, repair and maintain technical systems."
  },
  "ICT & Data": {
    "icon": "monitor",
    "description": "Work with data, software, systems and digital tools."
  },
  "Health & Social Services": {
    "icon": "heart",
    "description": "Support health, care, wellness and community services."
  },
  "Media & Communications": {
    "icon": "pencil",
    "description": "Create, design and communicate ideas with impact."
  },
  "Marketing, Sales & Retail": {
    "icon": "chart",
    "description": "Serve customers, grow sales and support retail operations."
  },
  "Hospitality & Tourism": {
    "icon": "cloche",
    "description": "Create guest experiences in food, travel and tourism."
  },
  "Logistics & Supply Chain": {
    "icon": "route",
    "description": "Move goods, coordinate transport and support supply chains."
  },
  "Finance & Accounting": {
    "icon": "chart",
    "description": "Work with financial records, reporting and business controls."
  },
  "HR & Training": {
    "icon": "user",
    "description": "Support people, workplace learning and staff development."
  },
  "Beauty & Personal Care": {
    "icon": "user",
    "description": "Provide grooming, wellness and personal care services."
  },
  "Insurance & Banking": {
    "icon": "briefcase",
    "description": "Support financial services, insurance and client operations."
  },
  "Legal & Compliance": {
    "icon": "book",
    "description": "Support rules, documentation, compliance and legal processes."
  },
  "Quality & Risk Management": {
    "icon": "grid",
    "description": "Improve standards, manage risks and support compliance."
  },
  "Sport & Fitness": {
    "icon": "heart",
    "description": "Promote movement, fitness, coaching and active lifestyles."
  },
  "Agriculture & Environment": {
    "icon": "gear",
    "description": "Work with natural resources, farming and environmental care."
  },
  "Construction & Building": {
    "icon": "tools",
    "description": "Build, inspect and maintain structures and sites."
  },
  "Facilities & Cleaning": {
    "icon": "tools",
    "description": "Maintain safe, clean and functional spaces."
  },
  "Mining": {
    "icon": "gear",
    "description": "Support mining operations, safety and technical processes."
  },
  "Public Sector": {
    "icon": "grid",
    "description": "Serve communities through public administration and services."
  },
  "Real Estate & Property": {
    "icon": "pin",
    "description": "Support property services, facilities and real estate operations."
  },
  "Emergency Services": {
    "icon": "heart",
    "description": "Respond to incidents and support safety-critical services."
  },
  "Plant & Equipment Operations": {
    "icon": "tools",
    "description": "Operate machinery, plant equipment and site systems."
  },
  "Religious & Charitable": {
    "icon": "user",
    "description": "Support community, charitable and faith-based services."
  },
  "Other": {
    "icon": "grid",
    "description": "Additional careers available in the current dataset."
  }
};


  function loadExploreTableData() {
    return new Promise((resolve, reject) => {
      if (window.QCTO_EXPLORE_TABLE_DATA) {
        resolve(window.QCTO_EXPLORE_TABLE_DATA);
        return;
      }

      const existingScript = document.querySelector('script[data-explore-table-data="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.QCTO_EXPLORE_TABLE_DATA || []), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "assets/explore-table-data.js";
      script.dataset.exploreTableData = "true";
      script.onload = () => resolve(window.QCTO_EXPLORE_TABLE_DATA || []);
      script.onerror = () => reject(new Error("Could not load Explore table data."));
      document.body.appendChild(script);
    });
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

  async function ensureExploreRowsLoaded() {
    if (exploreTableAllRows.length) return exploreTableAllRows;

    const rawRows = await loadExploreTableData();
    exploreTableAllRows = rawRows.map(prepareExploreTableRow);
    exploreSearchIndex = buildExploreSearchIndex(exploreTableAllRows);
    homeSearchIndex = buildHomeSearchIndex(exploreTableAllRows);
    careerSearchIndex = buildCareerSearchIndex();
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
    populateSelect("explore-filter-city-town", getUniqueSortedValues(rows, "cityTown"));
    populateSelect("explore-filter-status", getUniqueSortedValues(rows, "accreditationStatus"));
    populateSelect("explore-filter-partner", getUniqueSortedValues(rows, "setaPartner"));

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
      <td class="email-cell">${escapeHtml(row.email)}</td>
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

    const uniqueProviders = new Set();
    const uniquePartners = new Set();
    let activeCount = 0;

    rows.forEach((row) => {
      const provider = String(row.providerName || "").trim();
      const partner = String(row.setaPartner || "").trim();
      const status = String(row.accreditationStatus || "").trim().toLowerCase();

      if (provider && provider !== "Not specified") uniqueProviders.add(provider);
      if (partner && partner !== "Not specified") uniquePartners.add(partner);
      if (status === "active" || status.startsWith("active ")) activeCount += 1;
    });

    updateExploreStats({
      accreditationRecords: rows.length,
      uniqueOrganisations: uniqueProviders.size,
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
      try {
        await ensureExploreRowsLoaded();
      } catch (error) {
        console.error(error);
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
        await ensureExploreRowsLoaded();
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
    const normalizedCareer = String(careerName || "").trim().toLowerCase();
    if (!normalizedCareer || !exploreTableAllRows.length) return "NQF Level not listed";

    const levels = Array.from(new Set(
      exploreTableAllRows
        .filter((row) => String(row.career || "").trim().toLowerCase() === normalizedCareer)
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
    ensureExploreRowsLoaded()
      .then(() => renderPopularCareersList())
      .catch((error) => console.error(error));

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
    const countText = roles.length === 1 ? "1 role" : roles.length + " roles";

    title.textContent = familyName;
    summary.textContent = countText + " available in this family. Choose a role to open Explore with matching records.";
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

  function showView(viewName, updateHash = true) {
    const nextView = validViews.includes(viewName) ? viewName : "home";

    pageViews.forEach((view) => {
      view.classList.toggle("active", view.dataset.page === nextView);
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.view === nextView);
    });

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
