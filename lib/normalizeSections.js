export function normalizeSections(data) {
      for (const versi in data) {
            for (const kitab in data[versi]) {
                  for (const pasal in data[versi][kitab]) {
                        let lastSection = null;
                        const ayatKeys = Object.keys(
                              data[versi][kitab][pasal]
                        ).sort((a, b) => parseInt(a) - parseInt(b));
                        for (const ayat of ayatKeys) {
                              const obj = data[versi][kitab][pasal][ayat];
                              if (obj.section == null || obj.section === "") {
                                    obj.section = lastSection;
                              } else {
                                    lastSection = obj.section;
                              }
                        }
                  }
            }
      }
}
