const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/tools", async (req, res) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto("https://topai.tools/", { waitUntil: "networkidle2" });

    const tools = await page.evaluate(() => {
      const results = [];
      const justLandedHeader = Array.from(document.querySelectorAll("h2, h3")).find(el => el.textContent.includes("Just landed"));
      if (!justLandedHeader) return [];

      const container = justLandedHeader.closest("section") || justLandedHeader.parentElement;
      const cards = container.querySelectorAll("a[href*='/tool/']");

      cards.forEach(card => {
        const name = card.querySelector("h2")?.innerText || "";
        const desc = card.querySelector("p")?.innerText || "";
        const href = card.getAttribute("href");
        results.push({
          name: name.trim(),
          url: `https://topai.tools${href}`,
          description: desc.trim()
        });
      });

      return results;
    });

    await browser.close();
    res.status(200).json(tools);
  } catch (err) {
    console.error("Error:", err);
    await browser.close();
    res.status(500).send("Scraping failed.");
  }
});

app.get("/", (req, res) => {
  res.send("TopAI Tools Scraper is Running ✅");
});

app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
