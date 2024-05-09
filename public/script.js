function testNotEval() {
  console.log('console.log from same domain not in eval');
}
testNotEval();


const code = 'function testEval() { console.log(\'Another console.log from same domain using eval\');} testEval();';
eval(code);