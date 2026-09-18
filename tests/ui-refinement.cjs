const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const output = path.resolve(__dirname, "../test-results");
fs.mkdirSync(output, { recursive: true });
let browser, page;
(async () => {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
  const errors = [],
    checks = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const pass = (s) => {
    checks.push(s);
    console.log("PASS " + s);
  };
  const click = (name, scope = page) =>
    scope.getByRole("button", { name, exact: true }).click();
  const nav = async (name) => {
    const toggle = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (await toggle.isVisible()) await toggle.click();
    await page
      .locator(".app-aside")
      .getByRole("link", { name, exact: true })
      .click();
    if (await toggle.isVisible()) await page.locator(".app-aside").waitFor({state:"hidden"});
  };
  let acting = "Claire Wang";
  const role = async (name) => {
    const toggle = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (await toggle.isVisible()) await toggle.click();
    await page
      .locator(".app-aside")
      .getByRole("button", { name: new RegExp(acting) })
      .click();
    await page
      .locator(".app-aside")
      .getByRole("button", { name: new RegExp(name) })
      .click();
    acting = name;
    if (await toggle.isVisible()) await page.locator(".app-aside").waitFor({state:"hidden"});
  };
  const shot = (name) =>
    page.screenshot({ path: path.join(output, name + ".png"), fullPage: true, animations: "disabled" });
  const overflow = async (label) =>
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      label,
    );
  const project = async () => {
    await nav("Projects");
    await click("Paws & Care Veterinary Hospital");
    await click("Open full project");
  };
  await page.goto("http://127.0.0.1:8089/app.html");
  await page.getByRole("navigation", { name: "Work", exact: true }).waitFor();
  console.log(
    "HEADING",
    await page
      .locator(".list-heading h1")
      .evaluate((e) => ({
        size: getComputedStyle(e).fontSize,
        weight: getComputedStyle(e).fontWeight,
        style: e.getAttribute("style"),
      })),
  );
  assert.equal(
    await page.getByLabel("Filter by client", { exact: true }).count(),
    0,
  );
  await page
    .getByLabel("Filter by city", { exact: true })
    .selectOption("Harbin");
  await page.getByRole("button", { name: /^Filters/ }).click();
  await page
    .getByLabel("Filter by sector", { exact: true })
    .selectOption("Pet hospital");
  assert.equal(
    await page.locator('table[aria-label="Projects"] tbody tr').count(),
    1,
  );
  await page.getByRole("button", { name: /^Filters/ }).click();
  assert.equal(
    await page.getByLabel("Filter by sector", { exact: true }).count(),
    0,
  );
  await click("Remove Sector: Pet hospital");
  assert.equal(
    await page.locator('table[aria-label="Projects"] tbody tr').count(),
    4,
  );
  await click("Clear filters");
  await page
    .getByLabel("Sort projects", { exact: true })
    .selectOption("phase:desc");
  await page
    .getByLabel("Sort projects", { exact: true })
    .selectOption("milestone:asc");
  await shot("refined-projects");
  pass("Collapsed filters, AND matching, removable chips, reset and sorting");
  for (const name of [
    "Amy Liu",
    "Li Wei",
    "Daniel Wu",
    "Mei Lin",
    "Ben Zhao",
  ]) {
    await role(name);
    await project();
    let text = await page.locator("main").innerText();
    assert(
      !/¥|Contract value|Approved budget|Forecast final cost|On budget|Forecast over/.test(
        text,
      ),
      name + " delivery",
    );
    await click("Project brief");
    text = await page.locator("main").innerText();
    assert(!/Budget band|Contract basis|¥/.test(text), name + " brief");
    await click("Delivery");
    await click("MRI / CT Suite");
    assert.equal(
      await page
        .getByRole("dialog")
        .getByLabel("Optional budget", { exact: true })
        .count(),
      0,
    );
    await click("Close editor", page.getByRole("dialog"));
    await nav("Projects");
    assert.equal(
      await page
        .getByRole("columnheader", { name: "Commercial", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: /^Filters/ }).click();
    assert.equal(
      await page
        .getByLabel("Filter by commercial health", { exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: /^Filters/ }).click();
  }
  for (const name of [
    "Sophia Chen",
    "Grace Sun",
    "Jordan Park",
    "Claire Wang",
  ]) {
    await role(name);
    await project();
    assert.match(await page.locator("main").innerText(), /¥12,000,000/);
    assert.equal(
      await page
        .getByRole("button", { name: "Edit health & programme", exact: true })
        .count(),
      name === "Jordan Park" ? 0 : 1,
    );
  }
  await nav("Projects");
  await click("Dalian cinema site assessment");
  await click("Open full project");
  assert(
    !/Contract value|On budget|Forecast over/.test(
      await page.locator("main").innerText(),
    ),
  );
  pass(
    "Five delivery roles see no money; authorized roles can read; unrelated Project Lead and Director write access restricted",
  );
  await nav("Delivery Standards");
  assert.equal(await page.locator(".standards-sheet table").count(), 0);
  await page
    .getByLabel("Template sector", { exact: true })
    .selectOption("Cinema");
  await page
    .getByLabel("Template service", { exact: true })
    .selectOption("Design only");
  assert.equal(
    await page
      .getByRole("heading", { name: "Construction", exact: true })
      .count(),
    0,
  );
  assert.match(
    await page.locator("main").innerText(),
    /Acoustic strategy approved/,
  );
  await page.getByRole("tab", { name: "Lifecycle", exact: true }).click();
  assert.equal(await page.locator(".lifecycle-guide li").count(), 6);
  await page
    .getByRole("tab", { name: "Responsibilities", exact: true })
    .click();
  assert.equal(
    await page.locator(".responsibility-list .standard-phase").count(),
    7,
  );
  await page
    .getByRole("tab", { name: "Milestone templates", exact: true })
    .click();
  await page
    .getByLabel("Template service", { exact: true })
    .selectOption("Design & build");
  await shot("refined-standards");
  pass(
    "Standards browse one sector/service at a time; lifecycle and responsibilities remain accessible",
  );
  await role("Amy Liu");
  await nav("Weekly reports");
  assert.equal(
    await page.getByRole("tab", { name: "Team reports", exact: true }).count(),
    0,
  );
  await page
    .getByLabel("This week", { exact: true })
    .fill("Construction drawings coordinated.");
  await page.getByLabel("This week", { exact: true }).press("Tab");
  await nav("Delivery Standards");
  assert(
    await page
      .getByRole("button", { name: "Save and leave", exact: true })
      .isVisible(),
  );
  await click("Save and leave");
  await nav("Weekly reports");
  assert.equal(
    await page.getByLabel("This week", { exact: true }).inputValue(),
    "Construction drawings coordinated.",
  );
  await click("Add from project activity");
  await click("Add to report");
  const imported = await page
    .getByLabel("Projects worked on", { exact: true })
    .inputValue();
  await click("Add from project activity");
  await click("Add to report");
  assert.equal(
    await page.getByLabel("Projects worked on", { exact: true }).inputValue(),
    imported,
  );
  await page
    .getByLabel("Issues & support needed", { exact: true })
    .fill("Vendor dimensions needed.");
  await page
    .getByRole("textbox", { name: "Next week", exact: true })
    .fill("Issue drawing package.");
  await click("Update report");
  await shot("refined-weekly");
  await role("Sophia Chen");
  await nav("Weekly reports");
  await page.getByRole("tab", { name: "Team reports", exact: true }).click();
  await click("Read Amy Liu report");
  assert.match(
    await page.locator(".report-read").innerText(),
    /Vendor dimensions needed/,
  );
  await shot("refined-weekly-team");
  pass(
    "Weekly report save-on-leave, duplicate-free imports, update and authorized team reading",
  );
  await page.reload();
  acting = "Claire Wang";
  await page.getByRole("navigation", { name: "Work", exact: true }).waitFor();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fieldwork.operations.v3")),
  );
  assert.equal(
    saved.weeklyReports.find((r) => r.personId === "amy").issues,
    "Vendor dimensions needed.",
  );
  await role("Sophia Chen");
  for (const width of [1680, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 950 });
    await nav("Projects");
    await page.getByRole("button", { name: /^Filters/ }).click();
    await overflow("Expanded project filters " + width);
    await shot("filters-" + width);
    await page.getByRole("button", { name: /^Filters/ }).click();
    for (const name of [
      "Schedule",
      "Delivery Standards",
      "Weekly reports",
      "Enquiries",
      "Locations",
      "Team",
      "Support",
      "Settings",
    ]) {
      await nav(name);
      await overflow(name + " " + width);
      if (["Delivery Standards", "Weekly reports"].includes(name))
        await shot(name.replaceAll(" ", "-") + "-" + width);
    }
    const toggle = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (await toggle.isVisible()) await toggle.click();
    await click("+ New enquiry");
    await overflow("New enquiry " + width);
    pass("All main pages and expanded filters fit " + width + "px");
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    path.join(output, "ui-refinement-results.json"),
    JSON.stringify({ checks, consoleErrors: errors }, null, 2),
  );
  await browser.close();
})().catch(async (e) => {
  console.error(e);
  if (page) {
    console.error(await page.locator("main").innerText());
    await page.screenshot({
      path: path.join(output, "refinement-failure.png"),
      fullPage: true,
    });
  }
  if (browser) await browser.close();
  process.exitCode = 1;
});
