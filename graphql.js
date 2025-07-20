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
    ayatBySection(versi: String!, section: String!): [Ayat]
  }
`);

export const createResolvers = (DATA) => ({
      versi: () => Object.keys(DATA),

      kitab: ({ versi }) => {
            const versiData = DATA[versi];
            if (!versiData) throw new Error("Versi tidak ditemukan");
            return Object.keys(versiData);
      },

      pasal: ({ versi, kitab }) => {
            const pasalData = DATA[versi]?.[kitab];
            if (!pasalData) throw new Error("Kitab tidak ditemukan");
            return Object.keys(pasalData);
      },

      ayat: ({ versi, kitab, pasal }) => {
            const ayats = DATA[versi]?.[kitab]?.[pasal];
            if (!ayats) throw new Error("Pasal tidak ditemukan");
            return Object.entries(ayats).map(([nomor, { text, section }]) => ({
                  nomor,
                  teks: text,
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
                                          data?.text
                                                ?.toLowerCase()
                                                .includes(teks.toLowerCase())
                                    ) {
                                          hasil.push({
                                                nomor: `${kitab} ${pasal}:${ayat}`,
                                                teks: data.text,
                                                section: data.section,
                                          });
                                    }
                              }
                        }
                  }
            }
            return hasil;
      },

      ayatBySection: ({ versi, section }) => {
            const hasil = [];
            const versiData = DATA[versi];
            if (!versiData) throw new Error("Versi tidak ditemukan");

            for (const kitab of Object.keys(versiData)) {
                  for (const pasal of Object.keys(versiData[kitab])) {
                        for (const [ayat, data] of Object.entries(
                              versiData[kitab][pasal]
                        )) {
                              if (data.section === section) {
                                    hasil.push({
                                          nomor: `${kitab} ${pasal}:${ayat}`,
                                          teks: data.text,
                                          section: data.section,
                                    });
                              }
                        }
                  }
            }
            return hasil;
      },
});
