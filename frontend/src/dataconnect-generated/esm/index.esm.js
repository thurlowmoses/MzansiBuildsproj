import { queryRef, executeQuery, validateArgsWithOptions, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'mzansibuildsproj',
  location: 'europe-west3'
};
export const getPublicProjectsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicProjects');
}
getPublicProjectsRef.operationName = 'GetPublicProjects';

export function getPublicProjects(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getPublicProjectsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

