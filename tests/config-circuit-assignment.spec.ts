import { test, expect, type Page, type Locator } from "@playwright/test";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { start, stop, restart, baseUrl } from "./evcc";
import { expectModalVisible } from "./utils";

test.use({ baseURL: baseUrl() });
test.afterEach(async () => {
  await stop();
});

async function openAssignment(page: Page) {
  await page.goto("/#/config?circuits");
  const modal = page.getByTestId("circuits-modal");
  await expectModalVisible(modal);
  await expect(modal.getByRole("listitem", { name: "Draggable: Wallbox left" })).toBeVisible({
    timeout: 20000,
  });
  return modal;
}

async function storedCircuit(title = "Wallbox left") {
  const port = new URL(baseUrl()).port;
  const db = path.join(os.tmpdir(), `evcc-${port}.db`);
  const configs = JSON.parse(
    execFileSync("sqlite3", ["-json", db, "SELECT value FROM configs WHERE class = 5"], {
      encoding: "utf8",
    })
  );
  return configs
    .map((row: { value: string }) => JSON.parse(row.value))
    .find((lp: { title: string }) => lp.title === title)?.circuit;
}

async function drag(_page: Page, source: Locator, target: Locator) {
  await source.dragTo(target);
}

test.describe("circuit assignment", () => {
  test("drag to circuit, empty pool and empty circuit", async ({ page }) => {
    await start("fast.evcc.yaml", "config-circuit-tree.sql");
    const modal = await openAssignment(page);
    const item = () => modal.getByRole("listitem", { name: "Draggable: Wallbox left" });
    const workshop = modal.getByRole("list", { name: "Workshop in the basement", exact: true });
    const pool = modal.getByRole("list", { name: "Not assigned", exact: true });
    await drag(page, item(), workshop);
    await expect(workshop).toContainText("Wallbox left");
    await expect.poll(() => storedCircuit()).toBe("db:12");
    await drag(page, item(), pool);
    await expect(pool).toContainText("Wallbox left");
    await expect.poll(() => storedCircuit()).toBeUndefined();
    await drag(page, item(), modal.getByRole("list", { name: "Home", exact: true }));
    await expect(modal.getByRole("list", { name: "Home", exact: true })).toContainText(
      "Wallbox left"
    );
    await expect.poll(() => storedCircuit()).toBe("db:8");
    await restart("fast.evcc.yaml");
    await page.goto("/#/config?circuits");
    await expect(modal.getByRole("list", { name: "Home", exact: true })).toContainText(
      "Wallbox left"
    );
  });

  test("select device then destination with keyboard", async ({ page }) => {
    await start("fast.evcc.yaml", "config-circuit-tree.sql");
    const modal = await openAssignment(page);
    const item = () => modal.getByRole("listitem", { name: "Draggable: Wallbox left" });
    await item().focus();
    await item().press("Enter");
    await modal.getByRole("button", { name: "Home", exact: true }).press("Enter");
    await expect(modal.getByRole("list", { name: "Home", exact: true })).toContainText(
      "Wallbox left"
    );
    await expect.poll(() => storedCircuit()).toBe("db:8");
    await item().press("Space");
    await modal.getByRole("button", { name: "Not assigned", exact: true }).press("Enter");
    await expect(modal.getByRole("list", { name: "Not assigned", exact: true })).toContainText(
      "Wallbox left"
    );
    await expect.poll(() => storedCircuit()).toBeUndefined();
    await item().press("Enter");
    await modal.getByRole("button", { name: "Garage", exact: true }).press("Enter");
    await expect.poll(() => storedCircuit()).toBe("db:9");
    await restart("fast.evcc.yaml");
    await page.goto("/#/config?circuits");
    await expect(modal.getByRole("list", { name: "Garage", exact: true })).toContainText(
      "Wallbox left"
    );
  });

  test("rejected save retains the assignment", async ({ page }) => {
    await start("fast.evcc.yaml", "config-circuit-tree.sql");
    const modal = await openAssignment(page);
    await page.route("**/api/config/loadpoints/13", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Save rejected" }),
      })
    );
    const response = page.waitForResponse(
      (res) => res.url().endsWith("/api/config/loadpoints/13") && res.request().method() === "PUT"
    );
    await modal.getByRole("listitem", { name: "Draggable: Wallbox left" }).press("Enter");
    await modal.getByRole("button", { name: "Home", exact: true }).press("Enter");
    expect((await response).status()).toBe(500);
    await expect(modal.getByRole("list", { name: "Garage", exact: true })).toContainText(
      "Wallbox left"
    );
    await expect.poll(() => storedCircuit()).toBe("db:9");
  });
});
