window.QCTO_HOME_PROVINCE_STATS = {
  source: "Final_Cleaned_data_export(1).csv",
  note: "Generated from the uploaded cleaned SDP dataset. accreditationRecords = row count, uniqueOrganisations = unique Provider Trading Name, activeAccreditations = rows where Status is Active, setaQualityPartners = unique Quality Partner values.",

  default: {
    label: "South Africa",
    accreditationRecords: 48716,
    uniqueOrganisations: 8667,
    activeAccreditations: 40916,
    setaQualityPartners: 25
  },

  provinceOrder: [
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Western Cape",
    "Eastern Cape",
    "Mpumalanga",
    "North West",
    "Free State",
    "Northern Cape"
  ],

  provinceColors: {
    "Gauteng": "#8E3FAE",
    "KwaZulu-Natal": "#D85AA7",
    "Limpopo": "#8B6ED6",
    "Western Cape": "#38B66B",
    "Eastern Cape": "#263FA8",
    "Mpumalanga": "#D1B600",
    "North West": "#D94A55",
    "Free State": "#E9783A",
    "Northern Cape": "#1F8A8C"
  },

  provinces: {
    "Gauteng": {
      label: "Gauteng",
      accreditationRecords: 22176,
      uniqueOrganisations: 4212,
      activeAccreditations: 19026,
      setaQualityPartners: 25,
      color: "#8E3FAE"
    },

    "KwaZulu-Natal": {
      label: "KwaZulu-Natal",
      accreditationRecords: 7317,
      uniqueOrganisations: 1364,
      activeAccreditations: 6170,
      setaQualityPartners: 24,
      color: "#D85AA7"
    },

    "Limpopo": {
      label: "Limpopo",
      accreditationRecords: 5070,
      uniqueOrganisations: 836,
      activeAccreditations: 3990,
      setaQualityPartners: 23,
      color: "#8B6ED6"
    },

    "Western Cape": {
      label: "Western Cape",
      accreditationRecords: 4607,
      uniqueOrganisations: 960,
      activeAccreditations: 3934,
      setaQualityPartners: 24,
      color: "#38B66B"
    },

    "Eastern Cape": {
      label: "Eastern Cape",
      accreditationRecords: 2198,
      uniqueOrganisations: 480,
      activeAccreditations: 1891,
      setaQualityPartners: 24,
      color: "#263FA8"
    },

    "Mpumalanga": {
      label: "Mpumalanga",
      accreditationRecords: 3207,
      uniqueOrganisations: 535,
      activeAccreditations: 2465,
      setaQualityPartners: 24,
      color: "#D1B600"
    },

    "North West": {
      label: "North West",
      accreditationRecords: 1934,
      uniqueOrganisations: 330,
      activeAccreditations: 1524,
      setaQualityPartners: 23,
      color: "#D94A55"
    },

    "Free State": {
      label: "Free State",
      accreditationRecords: 1386,
      uniqueOrganisations: 293,
      activeAccreditations: 1174,
      setaQualityPartners: 24,
      color: "#E9783A"
    },

    "Northern Cape": {
      label: "Northern Cape",
      accreditationRecords: 819,
      uniqueOrganisations: 188,
      activeAccreditations: 740,
      setaQualityPartners: 21,
      color: "#1F8A8C"
    }
  }
};