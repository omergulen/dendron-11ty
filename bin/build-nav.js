const { NOTE_UTILS, getNavOutput, getMetaPath } = require("../libs/utils");
const _ = require("lodash");
const fs = require("fs-extra");

function createNav(noteIdsAtLevel, notesDict) {
  let out = [`<ul class="nav-list">`];
  // since some notes won't be avaible due to published = false, filter out undefined
  let notesAtLevel = noteIdsAtLevel
    .map((ent) => notesDict[ent])
    .filter((ent) => !_.isUndefined(ent));
  notesAtLevel = _.filter(notesAtLevel, (ent) => {
    return !_.get(ent, "custom.nav_exclude", false);
  });
  // copied at libs/shortcodes.js
  notesAtLevel = _.sortBy(notesAtLevel, ["custom.nav_order", "title"]);
  const allLevels = _.map(notesAtLevel, (node) => {
    let level = [];
    let permalink = _.get(node, "custom.permalink", "");
    const elemId = permalink === "/" ? "root" : node.id;
    level.push(`<li class="nav-list-item" id="${elemId}">`);
    let hasChildren = (node.children.length > 0 && permalink != "/" && !_.get(node, "custom.has_collection", false));
    // $("ul").find(`[data-slide='${current}']`)
    if (hasChildren) {
      level.push(
        `<a href="" class="nav-list-expander"><svg viewBox="0 0 24 24"><use xlink:href="#svg-arrow-right"></use></svg></a>`
      );
    }
    let href = NOTE_UTILS.getAbsUrl(NOTE_UTILS.getUrl(node));
    level.push(
      `<a id="a-${elemId}" href="${href}" class="nav-list-link">${node.title}</a>`
    );
    if (hasChildren) {
      level.push(_.flatMap(createNav(node.children, notesDict)));
    }
    level.push(`</li>`);
    return _.flatMap(level);
  });
  return out.concat(_.flatMap(allLevels)).concat(["</ul>"]);
}

async function buildNav() {
  const { notes, domains } = await require("../_data/notes.js")();
  const nav = createNav(
    domains.map((ent) => ent.id),
    notes
  );
  const navPath = getNavOutput();
  fs.ensureFileSync(navPath);
  fs.writeFileSync(navPath, nav.join("\n"), { encoding: "utf8" });
  fs.writeFileSync(getMetaPath(), _.toString(_.now()));
}

module.exports = { buildNav };
