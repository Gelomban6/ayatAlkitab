import express from "express";
import cors from "cors";
import fs from "fs-extra";
import { graphqlHTTP } from "express-graphql";
import { schema, createResolvers } from "./graphql.js";
import rateLimit from "express-rate-limit";

import { normalizeSections } from "./lib/normalizeSections.js";

const app = express();
const PORT = process.env.PORT || 3000;

const DATA = await fs.readJson("alkitab.json");
normalizeSections(DATA);

// Rate limiter: maksimal 100 request per 15 menit per IP
const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
            error: "Terlalu banyak permintaan dari IP ini, coba lagi nanti.",
      },
});

app.use(limiter);

app.use(cors());

// GET versi yang tersedia
app.get("/api/versi", (req, res) => {
      res.json(Object.keys(DATA));
});

// GET semua kitab untuk versi tertentu
app.get("/api/:versi", (req, res) => {
      const { versi } = req.params;
      const data = DATA[versi];
      if (!data)
            return res.status(404).json({ error: "Versi tidak ditemukan" });
      res.json(Object.keys(data));
});

// GET semua pasal dalam kitab tertentu
app.get("/api/:versi/:kitab", (req, res) => {
      const { versi, kitab } = req.params;
      const kitabData = DATA[versi]?.[kitab];
      if (!kitabData)
            return res.status(404).json({ error: "Kitab tidak ditemukan" });
      res.json(Object.keys(kitabData));
});

// GET ayat dalam pasal tertentu
app.get("/api/:versi/:kitab/:pasal", (req, res) => {
      const { versi, kitab, pasal } = req.params;
      const ayatData = DATA[versi]?.[kitab]?.[pasal];
      if (!ayatData)
            return res.status(404).json({ error: "Pasal tidak ditemukan" });
      res.json(ayatData);
});

// GET ayat spesifik
app.get("/api/:versi/:kitab/:pasal/:ayat", (req, res) => {
      const { versi, kitab, pasal, ayat } = req.params;
      const data = DATA[versi]?.[kitab]?.[pasal]?.[ayat];
      if (!data) return res.status(404).json({ error: "Ayat tidak ditemukan" });
      res.json(data);
});

// Pencarian teks di seluruh ayat
app.get("/api/search", (req, res) => {
      const query = req.query.q?.toLowerCase();
      if (!query)
            return res.status(400).json({ error: "Parameter ?q diperlukan" });

      const results = [];

      for (const versi of Object.keys(DATA)) {
            for (const kitab of Object.keys(DATA[versi])) {
                  for (const pasal of Object.keys(DATA[versi][kitab])) {
                        for (const [ayat, data] of Object.entries(
                              DATA[versi][kitab][pasal]
                        )) {
                              if (data.teks.toLowerCase().includes(query)) {
                                    results.push({
                                          versi,
                                          kitab,
                                          pasal,
                                          ayat,
                                          teks: data.teks,
                                          section: data.section,
                                    });
                              }
                        }
                  }
            }
      }

      res.json(results);
});

app.use(
      "/graphql",
      graphqlHTTP({
            schema,
            rootValue: createResolvers(DATA),
            graphiql: true, // aktifkan GraphiQL UI
      })
);

app.listen(PORT, () => {
      console.log(`🚀 Alkitab API running at http://localhost:${PORT}`);
});
