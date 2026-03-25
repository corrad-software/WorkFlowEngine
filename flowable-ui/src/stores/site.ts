import { defineStore } from "pinia";

export const useSiteStore = defineStore("site", {
  state: () => ({
    siteTitle: "Flowable",
    titleFormat: "%page% | %site%",
    footerText: "Flowable Workflow Engine v8.0",
  }),
  actions: {
    load() {
      // static config
    },
    setDocumentTitle(pageTitle: string) {
      document.title = this.titleFormat
        .replace("%page%", pageTitle)
        .replace("%site%", this.siteTitle);
    },
  },
});
