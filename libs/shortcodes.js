const remarkRehype = require("remark-rehype");
const rehypeStringify = require("rehype-stringify");
const raw = require("rehype-raw");
const { MDUtilsV4, DendronASTDest } = require("@dendronhq/engine-server");
const path = require("path");
const {
  getEngine,
  getSiteConfig,
  NOTE_UTILS,
  getNavOutput,
  getMetaPath,
  env
} = require("./utils");
const fs = require("fs");
const _ = require("lodash");

async function toMarkdown2(contents, vault) {
  const absUrl = NOTE_UTILS.getAbsUrl();
  const sconfig = getSiteConfig();
  const siteNotesDir = sconfig.siteNotesDir;
  const linkPrefix = absUrl + "/" + siteNotesDir + "/";
  const engine = await getEngine();
  const wikiLinksOpts = { useId: true, prefix: linkPrefix };
  (env.stage === "prod") 
  const proc = MDUtilsV4.procFull({
    engine,
    dest: DendronASTDest.HTML,
    vault,
    wikiLinksOpts,
    noteRefOpts: { wikiLinkOpts: wikiLinksOpts, prettyRefs: true },
    publishOpts: {
      assetsPrefix: (env.stage === "prod") ? sconfig.assetsPrefix : undefined
    },
  });
  return proc.process(contents);
}

async function toHTML(contents) {
  const engine = await getEngine();
  let processor = MDUtilsV4.proc(engine)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(raw)
    .use(rehypeStringify);
  return processor.process(contents);
}

let _NAV_CACHE = undefined;

function toNav(note) {
  const ts = fs.readFileSync(getMetaPath(), {encoding: "utf-8"})
  if (!_NAV_CACHE || _NAV_CACHE[0] !== ts) {
    _NAV_CACHE = [ts, fs.readFileSync(getNavOutput(), {encoding: "utf-8"})];
  }
  return _NAV_CACHE[1];
}

function toToc(note, notesDict) {
  if (note.children.length <= 0) {
    return "";
  }
  const out = [`<hr>`, `<h2 class="text-delta">Table of contents</h2>`, `<ul>`];
  // copied from bin/build-nav.js
  let notesAtLevel = note.children.map((ent) => notesDict[ent]);
  notesAtLevel = _.filter(notesAtLevel, (ent) => {
    return !_.get(ent, "custom.nav_exclude", false);
  });
  notesAtLevel = _.sortBy(notesAtLevel, ["custom.nav_order", "title"]);
  const allLevels = _.map(notesAtLevel, (node) => {
    let level = [`<li>`];
    let href = NOTE_UTILS.getAbsUrl(NOTE_UTILS.getUrl(node));

    level.push(`<a href="${href}">${node.title}</a>`);
    level.push(`</li>`);
    return level;
  });
  return _.flatMap(out.concat(allLevels).concat(["</ul>"])).join("\n");
}

module.exports = {
  configFunction: function (eleventyConfig, options = {}) {
    eleventyConfig.addPairedShortcode("html", toHTML);
    eleventyConfig.addPairedShortcode("markdown", toMarkdown2);
    eleventyConfig.addLiquidFilter("toNav", toNav);
    eleventyConfig.addLiquidFilter("toToc", toToc);
  },
};
