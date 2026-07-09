const { chromium } = require("@playwright/test");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    isMobile: true,
    viewport: { height: 844, width: 390 },
  });

  await page.goto("http://localhost:3007/", { waitUntil: "networkidle" });
  await page.screenshot({
    fullPage: true,
    path: "audit/playwright/web-home-mobile.png",
  });
  const homeText = await page.locator("body").innerText();

  const admin = await browser.newPage({ viewport: { height: 900, width: 1280 } });
  await admin.goto("http://localhost:3007/admin", { waitUntil: "networkidle" });
  await admin.screenshot({
    fullPage: true,
    path: "audit/playwright/admin.png",
  });
  const adminText = await admin.locator("body").innerText();

  console.log(
    JSON.stringify(
      {
        adminHasContent: adminText.length > 100,
        adminLength: adminText.length,
        homeHasContent: homeText.length > 100,
        homeLength: homeText.length,
      },
      null,
      2,
    ),
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
