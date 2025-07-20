import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs-extra";
import path from "path";

// Ganti versi & URL dasar di sini
const VERSION = "TB";
const BASE_URL = `https://alkitab.mobi/${VERSION}/`;

const daftarKitab = [
      ["Kej", 50],
      ["Kel", 40],
      ["Im", 27],
      ["Bil", 36],
      ["Ul", 34],
      ["Yos", 24],
      ["Hak", 21],
      ["Rut", 4],
      ["1Sam", 31],
      ["2Sam", 24],
      ["1Raj", 22],
      ["2Raj", 25],
      ["1Taw", 29],
      ["2Taw", 36],
      ["Ezr", 10],
      ["Neh", 13],
      ["Est", 10],
      ["Ayb", 42],
      ["Mzm", 150],
      ["Ams", 31],
      ["Pkh", 12],
      ["Kid", 8],
      ["Yes", 66],
      ["Yer", 52],
      ["Rat", 5],
      ["Yeh", 48],
      ["Dan", 12],
      ["Hos", 14],
      ["Yl", 3],
      ["Am", 9],
      ["Ob", 1],
      ["Yun", 4],
      ["Mi", 7],
      ["Nah", 3],
      ["Hab", 3],
      ["Zef", 3],
      ["Hag", 2],
      ["Zak", 14],
      ["Mal", 4],
      ["Mat", 28],
      ["Mrk", 16],
      ["Luk", 24],
      ["Yoh", 21],
      ["Kis", 28],
      ["Rom", 16],
      ["1Kor", 16],
      ["2Kor", 13],
      ["Gal", 6],
      ["Ef", 6],
      ["Flp", 4],
      ["Kol", 4],
      ["1Tes", 5],
      ["2Tes", 3],
      ["1Tim", 6],
      ["2Tim", 4],
      ["Tit", 3],
      ["Flm", 1],
      ["Ibr", 13],
      ["Yak", 5],
      ["1Ptr", 5],
      ["2Ptr", 3],
      ["1Yoh", 5],
      ["2Yoh", 1],
      ["3Yoh", 1],
      ["Yud", 1],
      ["Why", 22],
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function scrape() {
      const result = {};
      for (const [kitab, totalPasal] of daftarKitab) {
            for (let pasal = 1; pasal <= totalPasal; pasal++) {
                  const url = `${BASE_URL}${kitab}/${pasal}/`;
                  console.log(`🔍 Scraping ${kitab} ${pasal}`);
                  try {
                        const { data: html } = await axios.get(url);
                        const $ = cheerio.load(html);

                        // Save debug (optional)
                        // const debugDir = path.join("debug");
                        // await fs.ensureDir(debugDir);
                        // await fs.writeFile(
                        //       path.join(debugDir, `${kitab}_${pasal}.html`),
                        //       html
                        // );

                        let currentSection = null;

                        $("p").each((_, el) => {
                              const spanTitle = $(el).find(".paragraphtitle");
                              if (spanTitle.length) {
                                    currentSection = spanTitle.text().trim();
                              }

                              const ref = $(el).find("a[name^='v']");
                              const text = $(el)
                                    .find("span[data-dur]")
                                    .text()
                                    .trim();

                              if (ref.length && text) {
                                    const nomorAyat = ref.text().trim();
                                    if (!result[kitab]) result[kitab] = {};
                                    if (!result[kitab][pasal])
                                          result[kitab][pasal] = {};
                                    result[kitab][pasal][nomorAyat] = {
                                          text,
                                          section: currentSection || null,
                                    };
                              }
                        });

                        await delay(500); // Hindari ban
                  } catch (err) {
                        console.warn(
                              `❌ Gagal mengambil ${kitab} ${pasal}: ${err.message}`
                        );
                  }
            }
      }

      return result;
}

(async () => {
      const scraped = await scrape();

      // Baca isi alkitab.json yang ada
      const filepath = "alkitab.json";
      let existing = {};

      if (fs.existsSync(filepath)) {
            try {
                  existing = await fs.readJson(filepath);
            } catch (e) {
                  console.error(
                        "⚠️ Gagal membaca alkitab.json, membuat baru..."
                  );
                  existing = {};
            }
      }

      // Tambahkan versi baru
      existing[VERSION] = scraped;

      // Simpan file akhir
      await fs.writeJson(filepath, existing, { spaces: 2 });
      console.log(
            `✅ Data versi "${VERSION}" berhasil disimpan ke ${filepath}`
      );
})();
