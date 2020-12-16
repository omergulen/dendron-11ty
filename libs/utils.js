const path = require("path");
const { createLogger } = require('@dendronhq/common-server');
const env = require(path.join(__dirname, "..", "_data", "processEnv.js"));
const {
    EngineConnector,
    DConfig
} = require("@dendronhq/engine-server");


const getEngine = async () => {
  const engineConnector = EngineConnector.getOrCreate({
    wsRoot: env.wsRoot,
  });
  if (!engineConnector.initialized) {
    console.log("init engine")
    await engineConnector.init({ portOverride: env.enginePort });
  }
  const engine = engineConnector.engine;
  return engine;
};

const getDendronConfig = () => {
    const wsRoot = env.wsRoot
    return DConfig.getOrCreate(wsRoot)
}

const logger = () => {
  const logger = createLogger();
  return logger;
}


module.exports = { getEngine, env, getDendronConfig, logger };
