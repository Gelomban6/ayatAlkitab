import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs-extra";

// Daftar kitab (TB 1974)
const books = [
      { id: "kej", name: "Kejadian", chapters: 50 },
      { id: "kel", name: "Keluaran", chapters: 40 },
      { id: "im", name: "Imamat", chapters: 27 },
      { id: "bil", name: "Bilangan", chapters: 36 },
      { id: "ul", name: "Ulangan", chapters: 34 },
      { id: "yos", name: "Yosua", chapters: 24 },
      { id: "hak", name: "Hakim-hakim", chapters: 21 },
      { id: "rut", name: "Rut", chapters: 4 },
      { id: "1sam", name: "1 Samuel", chapters: 31 },
      { id: "2sam", name: "2 Samuel", chapters: 24 },
      { id: "1raj", name: "1 Raja-raja", chapters: 22 },
      { id: "2raj", name: "2 Raja-raja", chapters: 25 },
      { id: "1taw", name: "1 Tawarikh", chapters: 29 },
      { id: "2taw", name: "2 Tawarikh", chapters: 36 },
      { id: "ezr", name: "Ezra", chapters: 10 },
      { id: "neh", name: "Nehemia", chapters: 13 },
      { id: "est", name: "Ester", chapters: 10 },
      { id: "ayb", name: "Ayub", chapters: 42 },
      { id: "maz", name: "Mazmur", chapters: 150 },
      { id: "ams", name: "Amsal", chapters: 31 },
      { id: "pkh", name: "Pengkhotbah", chapters: 12 },
      { id: "kid", name: "Kidung Agung", chapters: 8 },
      { id: "yes", name: "Yesaya", chapters: 66 },
      { id: "yer", name: "Yeremia", chapters: 52 },
      { id: "rat", name: "Ratapan", chapters: 5 },
      { id: "yez", name: "Yehezkiel", chapters: 48 },
      { id: "dan", name: "Daniel", chapters: 12 },
      { id: "hos", name: "Hosea", chapters: 14 },
      { id: "yoel", name: "Yoel", chapters: 3 },
      { id: "amos", name: "Amos", chapters: 9 },
      { id: "ob", name: "Obaja", chapters: 1 },
      { id: "yun", name: "Yunus", chapters: 4 },
      { id: "mik", name: "Mikha", chapters: 7 },
      { id: "nam", name: "Nahum", chapters: 3 },
      { id: "hab", name: "Habakuk", chapters: 3 },
      { id: "zef", name: "Zefanya", chapters: 3 },
      { id: "hag", name: "Hagai", chapters: 2 },
      { id: "zak", name: "Zakharia", chapters: 14 },
      { id: "mal", name: "Maleakhi", chapters: 4 },
      { id: "mat", name: "Matius", chapters: 28 },
      { id: "mrk", name: "Markus", chapters: 16 },
      { id: "luk", name: "Lukas", chapters: 24 },
      { id: "yoh", name: "Yohanes", chapters: 21 },
      { id: "kis", name: "Kisah Para Rasul", chapters: 28 },
      { id: "rom", name: "Roma", chapters: 16 },
      { id: "1kor", name: "1 Korintus", chapters: 16 },
      { id: "2kor", name: "2 Korintus", chapters: 13 },
      { id: "gal", name: "Galatia", chapters: 6 },
      { id: "ef", name: "Efesus", chapters: 6 },
      { id: "flp", name: "Filipi", chapters: 4 },
      { id: "kol", name: "Kolose", chapters: 4 },
      { id: "1tes", name: "1 Tesalonika", chapters: 5 },
      { id: "2tes", name: "2 Tesalonika", chapters: 3 },
      { id: "1tim", name: "1 Timotius", chapters: 6 },
      { id: "2tim", name: "2 Timotius", chapters: 4 },
      { id: "tit", name: "Titus", chapters: 3 },
      { id: "flm", name: "Filemon", chapters: 1 },
      { id: "ibr", name: "Ibrani", chapters: 13 },
      { id: "yak", name: "Yakobus", chapters: 5 },
      { id: "1ptr", name: "1 Petrus", chapters: 5 },
      { id: "2ptr", name: "2 Petrus", chapters: 3 },
      { id: "1yoh", name: "1 Yohanes", chapters: 5 },
      { id: "2yoh", name: "2 Yohanes", chapters: 1 },
      { id: "3yoh", name: "3 Yohanes", chapters: 1 },
      { id: "yud", name: "Yudas", chapters: 1 },
      { id: "why", name: "Wahyu", chapters: 22 },
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const result = [];

async function fetchWithRetry(url, retries = 3) {
      for (let i = 1; i <= retries; i++) {
            try {
                  const res = await axios.get(url, {
                        headers: { "User-Agent": "Mozilla/5.0" },
                  });
                  return res.data;
            } catch (e) {
                  console.warn(`❗ Gagal fetch ${url} [percobaan ${i}]`);
                  await delay(i * 1000);
            }
      }
      throw new Error(`Gagal fetch ${url} setelah ${retries} percobaan`);
}

(async () => {
      for (const book of books) {
            for (let chapter = 1; chapter <= book.chapters; chapter++) {
                  const url = `https://alkitab.mobi/tb/${book.id}/${chapter}`;
                  console.log(`${book.name} ${chapter}...`);

                  try {
                        const html = await fetchWithRetry(url);
                        const $ = cheerio.load(html);

                        // Ambil perikop
                        const perikops = [];
                        $("span.paragraphtitle").each((_, el) => {
                              const title = $(el).text().trim();
                              const nextVerse = $(el)
                                    .closest("p")
                                    .nextAll("p")
                                    .find('a[name^="v"]')
                                    .first()
                                    .attr("name");
                              const match = nextVerse?.match(/^v(\d+)/);
                              if (match) {
                                    perikops.push({
                                          startVerse: parseInt(match[1]),
                                          title,
                                    });
                              }
                        });

                        // Ambil perikop aktif
                        const getPerikopForVerse = (v) => {
                              let current = null;
                              for (const p of perikops) {
                                    if (v >= p.startVerse) current = p.title;
                                    else break;
                              }
                              return current;
                        };

                        // Ambil semua ayat
                        $("span.reftext > a[name^='v']").each((_, el) => {
                              const name = $(el).attr("name");
                              const match = name?.match(/^v(\d+)$/);
                              const verseNum = match
                                    ? parseInt(match[1])
                                    : null;
                              const verseText = $(el)
                                    .parent()
                                    .nextAll("span[data-dur]")
                                    .first()
                                    .text()
                                    .trim();

                              if (verseNum && verseText) {
                                    result.push({
                                          book: book.name,
                                          chapter,
                                          verse: verseNum,
                                          text: verseText,
                                          section:
                                                getPerikopForVerse(verseNum) ||
                                                null,
                                    });
                              }
                        });

                        await delay(1000);
                  } catch (err) {
                        console.error(
                              `Gagal memuat ${book.name} ${chapter}: ${err.message}`
                        );
                  }
            }
      }

      await fs.writeJson("Alkitab-TB.json", result, { spaces: 2 });
      console.log(`Selesai! ${result.length} ayat disimpan ke Alkitab-TB.json`);
})();
