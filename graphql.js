// graphql.js
import { buildSchema } from "graphql";

export const schema = buildSchema(`
  type Ayat {
    nomor: String
    teks: String
    section: String
  }

  type Query {
    versi: [String]
    kitab(versi: String!): [String]
    pasal(versi: String!, kitab: String!): [String]
    ayat(versi: String!, kitab: String!, pasal: String!): [Ayat]
    cari(teks: String!): [Ayat]
  }
`);

export const createResolvers = (DATA) => ({
      versi: () => Object.keys(DATA),
      kitab: ({ versi }) => Object.keys(DATA[versi] || {}),
      pasal: ({ versi, kitab }) => Object.keys(DATA[versi]?.[kitab] || {}),
      ayat: ({ versi, kitab, pasal }) => {
            const ayats = DATA[versi]?.[kitab]?.[pasal];
            if (!ayats) return [];
            return Object.entries(ayats).map(([nomor, { teks, section }]) => ({
                  nomor,
                  teks,
                  section,
            }));
      },
      cari: ({ teks }) => {
            const hasil = [];
            for (const versi of Object.keys(DATA)) {
                  for (const kitab of Object.keys(DATA[versi])) {
                        for (const pasal of Object.keys(DATA[versi][kitab])) {
                              for (const [ayat, data] of Object.entries(
                                    DATA[versi][kitab][pasal]
                              )) {
                                    if (
                                          data.teks
                                                .toLowerCase()
                                                .includes(teks.toLowerCase())
                                    ) {
                                          hasil.push({
                                                nomor: `${kitab} ${pasal}:${ayat}`,
                                                teks: data.teks,
                                                section: data.section,
                                          });
                                    }
                              }
                        }
                  }
            }
            return hasil;
      },
});
