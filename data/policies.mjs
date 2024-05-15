const policies = {
  //configure Content Security Policy (CSP) directives to allow script execution from certain domains while blocking the use of eval()
  'block_eval': "script-src 'self' {{allowDomain}}; script-src-elem 'self' {{allowDomain}}; script-src-attr 'self' {{allowDomain}} 'unsafe-inline'; object-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests; default-src 'none'; manifest-src 'self'; font-src 'self'; connect-src 'self'",
  'allow_same_origin': "default-src 'self' 'unsafe-eval'",
  'allow_same_origin_blocking_eval': "script-src 'self'; script-src-elem 'self'; script-src-attr 'self' 'unsafe-inline'; object-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests; default-src 'none'; manifest-src 'self'; font-src 'self'; connect-src 'self'",
  'allow_other_origin': "script-src-elem {{allowDomain}}",
};
export { policies };