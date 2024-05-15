import { policies } from './../data/policies.mjs';

function getDomainFromPath(script) {
  // const url = 'https://omerherera.github.io/cdn/src/script.js';
  const regex = /^(https?:\/\/[^/]+)(?:\/|$)/;
  const match = script.match(regex);
  const path = match ? match[1] : null;
  return path; // Output: https://omerherera.github.io
}
function getPolicy(policyFromQuery, domainAllow) {
  // if no policy passed on the request allow all
  const policy = (policyFromQuery && policies[policyFromQuery]) ?
    policies[policyFromQuery].replaceAll('{{allowDomain}}', domainAllow) :
    '';
  return policy;
}
export { getDomainFromPath, getPolicy };