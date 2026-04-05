const { queryRef, executeQuery, validateArgsWithOptions, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'mzansibuildsproj',
  location: 'europe-west3'
};
exports.connectorConfig = connectorConfig;

const getPublicProjectsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicProjects');
}
getPublicProjectsRef.operationName = 'GetPublicProjects';
exports.getPublicProjectsRef = getPublicProjectsRef;

exports.getPublicProjects = function getPublicProjects(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getPublicProjectsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
