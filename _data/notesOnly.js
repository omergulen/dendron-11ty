const path = require("path");
const fs = require("fs-extra");
const _ = require("lodash");
const { SiteUtils } = require("@dendronhq/engine-server");
const { env, getEngine, getDendronConfig } = require(path.join(
  __dirname,
  "..",
  "libs",
  "utils.js"
));

async function getNotes() {
  if (env.proto) {
    const notes = fs.readJSONSync(path.join(__dirname, "notes-proto.json"));
    return notes;
  }
  const engine = await getEngine();
  const config = getDendronConfig();
  let {notes} = await SiteUtils.filterByConfig({ engine, config: config.site });
  return notes;
}

module.exports = async function () {
  return getNotes();
};
