/* Contextual entry from Fieldwork; the Knowledge Hub remains an independent workspace. */
(function () {
  const examples = [
    [
      "MRI Planning Checklist",
      "Pet hospital / Medical imaging",
      "Equipment coordination",
    ],
    [
      "Radiation Shielding Standard",
      "Pet hospital / Medical imaging",
      "Shielding",
    ],
    ["Structural Loading Guide", "Pet hospital / Medical imaging", "Structure"],
    [
      "Previous MRI Projects",
      "Pet hospital / Medical imaging",
      "Project references",
    ],
    ["Cinema Acoustic Design Standard", "Cinema", "Acoustics"],
    ["Projection / AV Coordination Checklist", "Cinema", "AV"],
    ["Previous Cinema Projects", "Cinema", "Project references"],
    ["Commercial Delivery Checklist", "Other commercial", "Delivery"],
    ...[
      "Health screening centre",
      "Hotel",
      "Chain restaurant",
      "Other commercial",
    ].map((sector) => [sector + " Design Standards", sector, "Design"]),
  ];
  examples.forEach(([title, sector, discipline], i) => {
    const id = "fieldwork-standard-" + i;
    DOCS[id] = {
      id,
      title,
      section: "Demo reference — validate company source before use",
      type: "Report",
      project: "Firm-wide",
      version: "Sample",
      updated: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      ageMonths: 0,
      owner: "Delivery Standards",
      status: "doc",
      uploadedBy: "Prototype seed",
      verifiedOn: "—",
      sector,
      discipline,
      region: "Company-wide",
      snippet:
        "Contextual sample reference for " +
        sector +
        " · " +
        discipline +
        ". Replace with the controlled company document. No technical specification is implied by this placeholder.",
    };
  });
  const params = new URLSearchParams(location.search),
    query = params.get("q");
  if (query) {
    showView("search");
    document.getElementById("search-input").value = query.slice(0, 240);
    submitSearch();
    const context = document.createElement("p");
    context.className = "search-filter-summary";
    context.textContent = [
      "From Fieldwork",
      params.get("sector"),
      params.get("city"),
    ]
      .filter(Boolean)
      .join(" · ");
    document.getElementById("view-search").prepend(context);
  } else renderSearch();
})();
