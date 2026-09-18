const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const output = path.resolve(__dirname, "../test-results");
fs.mkdirSync(output, { recursive: true });
let activeBrowser, activePage;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  activeBrowser = browser;
  const context = await browser.newContext({
    viewport: { width: 1680, height: 1050 },
  });
  const page = await context.newPage();
  activePage = page;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:8089/app.html");
  await page
    .getByRole("navigation", { name: "Work", exact: true })
    .waitFor({ timeout: 30000 });
  const logs = [];
  const pass = (name) => {
    logs.push(name);
    console.log("PASS", name);
  };
  const dialog = () => page.getByRole("dialog");
  const state = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem("fieldwork.operations.v3")),
    );
  const button = (name, scope = page) =>
    scope.getByRole("button", { name, exact: true });
  const click = async (name, scope = page) => button(name, scope).click();
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
    if (await toggle.isVisible())
      await page.locator(".app-aside").waitFor({ state: "hidden" });
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
  };
  const openPaws = async () => {
    await nav("Projects");
    await click("Paws & Care Veterinary Hospital");
    await click("Open full project");
  };
  const manage = async () => click("Manage milestones");
  const openMilestone = async (title) => {
    await manage();
    await click(title, dialog());
  };
  const closeEditor = async () => click("Close editor", dialog());
  await page.screenshot({
    path: path.join(output, "desktop-portfolio.png"),
    fullPage: true,
  });
  await nav("Locations");
  const harbin = page.locator("tr").filter({ has: button("Harbin") });
  assert.match(await harbin.innerText(), /Harbin\s+4\s+3\s+1/);
  await click("Harbin");
  await page
    .getByRole("heading", { name: "Harbin · City detail", exact: true })
    .waitFor();
  assert.match(await page.locator("main").innerText(), /MRI \/ CT Suite/);
  pass(
    "Locations: Harbin 4 projects / 3 enquiries / 1 at risk; city detail and coverage",
  );
  await openPaws();
  await page
    .getByRole("heading", {
      name: "Paws & Care Veterinary Hospital",
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "MRI / CT Suite", exact: true })
      .count(),
    1,
  );
  await page.screenshot({
    path: path.join(output, "desktop-project.png"),
    fullPage: true,
  });
  await openMilestone("Construction Drawing Package");
  assert.match(await dialog().innerText(), /Ready for review/);
  await closeEditor();
  await role("Li Wei");
  assert(
    await page
      .getByRole("heading", { name: "My Work", exact: true })
      .isVisible(),
  );
  const review = page.locator(".fw-panel").filter({
    has: page.getByRole("heading", { name: "Needs my review", exact: true }),
  });
  await click("Construction Drawing Package", review);
  await dialog()
    .getByLabel("Update / review comment / external outcome")
    .fill("Coordinate equipment clearances before issue.");
  await click("Request changes", dialog());
  assert.match(await dialog().innerText(), /Changes requested/);
  await closeEditor();
  await role("Amy Liu");
  await button("Construction Drawing Package").first().click();
  await click("Start / resume", dialog());
  await dialog()
    .getByLabel("Deliverable link or document reference", { exact: true })
    .fill("Drawing Package V05");
  await dialog()
    .locator("input[type=file]")
    .setInputFiles({
      name: "drawing-v05.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Coordinated V05 deliverable"),
    });
  await click("Submit for review", dialog());
  assert.match(await dialog().innerText(), /Ready for review/);
  await closeEditor();
  await role("Li Wei");
  await button("Construction Drawing Package").first().click();
  await dialog()
    .getByLabel("Update / review comment / external outcome")
    .fill("Approved for issue.");
  await click("Approve", dialog());
  assert.match(await dialog().innerText(), /Complete/);
  assert.match(await dialog().innerText(), /Drawing Package V04/);
  assert.match(await dialog().innerText(), /Drawing Package V05/);
  await page.screenshot({
    path: path.join(output, "review-history.png"),
    fullPage: true,
  });
  await closeEditor();
  const reviewed = (await state()).projects
    .find((p) => p.id === "061")
    .milestones.find((m) => m.title === "Construction Drawing Package");
  assert.equal(reviewed.status, "Complete");
  assert.equal(reviewed.attachments.length, 1);
  assert.equal(reviewed.reviewHistory.length, 4);
  pass(
    "Designer → change request → new deliverable upload → resubmit → assigned reviewer approval",
  );
  await role("Claire Wang");
  await openPaws();
  await openMilestone("Concept approval");
  await dialog()
    .getByLabel("Update / review comment / external outcome")
    .fill("Client confirmed externally by WeChat on 17 September.");
  await click("Record external confirmation", dialog());
  await click("Mark complete", dialog());
  assert.match(await dialog().innerText(), /Confirmed/);
  await closeEditor();
  await openMilestone("Shielding design approved");
  await dialog()
    .getByLabel("Due date (optional)", { exact: true })
    .fill("2026-12-01");
  await click("Save milestone plan", dialog());
  await nav("Schedule");
  await page.getByLabel("City", { exact: true }).selectOption("Harbin");
  const shielding = page
    .locator("tr")
    .filter({ has: button("Shielding design approved") });
  assert.match(await shielding.innerText(), /1 Dec/);
  assert.match(await shielding.innerText(), /Harbin/);
  assert.equal(await button("Construction Drawing Package").count(), 0);
  pass(
    "External confirmation and milestone completion; all-date Schedule and city filter reflect edits",
  );
  await nav("Projects");
  await click("By city");
  assert.match(await page.locator("main").innerText(), /Shenyang/);
  await click("All projects");
  await openPaws();
  await click("Project brief");
  await click("✎ Edit brief");
  const brief = page.locator("textarea").first();
  await brief.fill("Updated internal veterinary hospital scope.");
  await click("Save project");
  await nav("Projects");
  await openPaws();
  await click("Project brief");
  assert.match(
    await page.locator("main").innerText(),
    /Updated internal veterinary hospital scope/,
  );
  await click("Activity");
  await page
    .locator("#project-comment-input")
    .fill("Internal review workflow verified.");
  await page.getByLabel("Private note", { exact: true }).check();
  await click("Post comment");
  await role("Amy Liu");
  await openPaws();
  await click("Activity");
  assert(
    !/Internal review workflow verified/.test(
      await page.locator("main").innerText(),
    ),
  );
  await click("Delivery");
  assert.equal(await button("Edit health & programme").count(), 0);
  assert.equal(await button("+ Add collaborator").count(), 0);
  assert.equal(
    await page
      .getByRole("button", { name: "Change phase", exact: true })
      .count(),
    0,
  );
  pass(
    "Brief persistence, private-note visibility and Designer action restrictions",
  );
  await role("Sophia Chen");
  await nav("Enquiries");
  await click("+ New enquiry");
  await page
    .getByPlaceholder("Pet Hospital Expansion", { exact: true })
    .fill("Pet Hospital Expansion browser test");
  await page
    .locator("textarea")
    .fill("Expand imaging and treatment rooms with internal coordination.");
  await click("Continue");
  await page
    .getByPlaceholder("Paws & Care Vet", { exact: true })
    .fill("Paws & Care Vet");
  await page.getByLabel("City *", { exact: true }).fill("Harbin");
  const sector = page
    .locator("select")
    .filter({ has: page.locator('option[value="Pet hospital"]') });
  await sector.selectOption("Pet hospital");
  await page.getByLabel("MRI involved?", { exact: true }).fill("Yes");
  await page.getByLabel("Target opening", { exact: true }).fill("2027-04-01");
  await page.getByPlaceholder("¥12.0M", { exact: true }).fill("¥12M");
  await page.locator("#new-project-file-upload").setInputFiles({
    name: "intake-brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("MRI expansion brief"),
  });
  await click("Continue");
  await click("Log enquiry");
  await click("View enquiries");
  const intake = page
    .locator("tr")
    .filter({ hasText: "Pet Hospital Expansion browser test" });
  await intake.getByRole("button", { name: /More actions/ }).click();
  await click("Review enquiry", intake);
  await dialog()
    .getByLabel("Qualification status", { exact: true })
    .selectOption("Under review");
  await click("Save qualification", dialog());
  await dialog()
    .getByLabel("Qualification status", { exact: true })
    .selectOption("Ready to scope");
  await dialog()
    .getByLabel("Project Lead", { exact: true })
    .selectOption("claire");
  await click("Convert to project", dialog());
  await page
    .getByRole("heading", {
      name: "Pet Hospital Expansion browser test",
      exact: true,
    })
    .waitFor();
  assert.match(await page.locator("main").innerText(), /Project setup pending/);
  const converted = (await state()).projects.find(
    (p) => p.name === "Pet Hospital Expansion browser test",
  );
  assert.equal(converted.location.city, "Harbin");
  assert.equal(converted.attachments.length, 1);
  assert.equal(converted.budgetBand, "¥12M");
  for (const [person, roleName] of [
    ["Li Wei", "Design lead"],
    ["Amy Liu", "Designer"],
    ["Daniel Wu", "Construction lead"],
  ]) {
    await click("+ Add collaborator");
    await button(person).click();
    await page
      .locator("select")
      .filter({ has: page.locator('option[value="Design lead"]') })
      .selectOption(roleName);
    await click("Add");
    await click("Save project");
  }
  for (const name of [
    "MRI / CT Suite",
    "Radiation Shielding",
    "MEP",
    "Interior Fit-out",
  ]) {
    await click("+ Add work package");
    await dialog().getByLabel("Scope name", { exact: true }).fill(name);
    await dialog()
      .getByLabel("Scope / description", { exact: true })
      .fill("Internal delivery scope for " + name);
    await click("Save work package", dialog());
  }
  const dbAfterPackages = await state(),
    created = dbAfterPackages.projects.find((p) => p.id === converted.id);
  assert.equal(created.workPackages.length, 4);
  assert.equal(dbAfterPackages.projects.length, 14);
  await click("Confirm project setup");
  await manage();
  await click("+ Add milestone", dialog());
  await dialog()
    .getByLabel("Milestone title", { exact: true })
    .fill("Custom equipment coordination");
  await dialog().getByLabel("Phase", { exact: true }).selectOption("design");
  await dialog()
    .getByLabel("Internal owner", { exact: true })
    .selectOption("amy");
  await dialog().getByLabel("Review required", { exact: true }).check();
  await dialog()
    .getByLabel("Internal reviewer", { exact: true })
    .selectOption("li");
  await dialog()
    .getByLabel("Due date (optional)", { exact: true })
    .fill("2026-10-05");
  await click("Create milestone", dialog());
  pass(
    "Enquiry qualification/conversion carries location, budget, files; team, four optional packages and real milestone created",
  );
  await page.reload();
  await page.getByRole("navigation", { name: "Work", exact: true }).waitFor();
  const reloaded = await state();
  assert.equal(
    reloaded.projects.find((p) => p.id === converted.id).workPackages.length,
    4,
  );
  assert.equal(
    reloaded.projects.find((p) => p.id === converted.id).milestones.at(-1)
      .ownerId,
    "amy",
  );
  acting = "Claire Wang";
  for (const [width, height] of [
    [1680, 1050],
    [1366, 900],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await nav("Projects");
    await page.getByPlaceholder("Search projects or clients").fill("Paws");
    await page.getByPlaceholder("Search projects or clients").press("Tab");
    assert(await button("Paws & Care Veterinary Hospital").isVisible());
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    assert.equal(overflow, false, "Portfolio overflow at " + width);
    await page.screenshot({
      path: path.join(output, "portfolio-" + width + ".png"),
      fullPage: true,
    });
    await click("Paws & Care Veterinary Hospital");
    assert(await clickVisible(page, "Open full project"));
    await click("Open full project");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      ),
      false,
      "Detail overflow at " + width,
    );
    await manage();
    await page.screenshot({
      path: path.join(output, "milestones-" + width + ".png"),
      fullPage: true,
    });
    await closeEditor();
    await nav("Schedule");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      ),
      false,
      "Schedule overflow at " + width,
    );
    pass(
      "Responsive portfolio / peek / detail / milestone editor / Schedule at " +
        width +
        "px",
    );
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  for (const name of [
    "Weekly reports",
    "Delivery Standards",
    "Team",
    "Locations",
    "Support",
  ]) {
    await nav(name);
    assert((await page.locator("main").innerText()).trim().length > 0);
  }
  await role("Sophia Chen");
  await nav("Settings");
  assert.match(await page.locator("main").innerText(), /Delivery defaults/);
  await page.goto(
    "http://127.0.0.1:8089/knowledge-hub/?q=Radiation%20Shielding%20Standard&sector=Pet%20hospital&city=Harbin",
  );
  await page
    .getByText("Radiation Shielding Standard", { exact: false })
    .first()
    .waitFor();
  assert.match(
    await page.locator("#res-list").innerText(),
    /Radiation Shielding Standard/,
  );
  assert.equal(
    await page.locator("#search-input").inputValue(),
    "Radiation Shielding Standard",
  );
  pass(
    "Major existing pages, role-specific settings and contextual Knowledge Hub entry",
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    path.join(output, "browser-results.json"),
    JSON.stringify(
      { passed: logs.length, checks: logs, consoleErrors: errors },
      null,
      2,
    ),
  );
  await browser.close();
})().catch(async (e) => {
  console.error(e);
  if (activePage) {
    console.log("FAILURE UI", await activePage.locator("body").innerText());
    await activePage.screenshot({
      path: path.join(output, "failure.png"),
      fullPage: true,
    });
  }
  if (activeBrowser) await activeBrowser.close();
  process.exitCode = 1;
});
async function clickVisible(page, name) {
  return page.getByRole("button", { name, exact: true }).isVisible();
}
