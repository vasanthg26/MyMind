const { USE_DUMMY, MODEL_MAP } = require('./config');
const dummyLLM = require('./dummyLLM');
const claudeAPI = require('./claudeAPI');

function selectModel(taskType) {
  return MODEL_MAP[taskType] || 'claude-haiku-4-5-20251001';
}

async function callLLM(taskType, input) {
  if (USE_DUMMY) {
    return dummyLLM.call(taskType, input);
  }
  const model = selectModel(taskType);
  return claudeAPI.call(taskType, model, input);
}

module.exports = { selectModel, callLLM };
