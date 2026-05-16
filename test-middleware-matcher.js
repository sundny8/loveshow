// Test script to verify middleware matcher pattern
const matcherPattern = /^((?!api|_next|static|.*\..*|favicon\.ico|robots\.txt).*)$/;

const testPaths = [
  // Should match (target pages)
  '/zh/workspace',
  '/en/workspace',
  '/zh/portrait',
  '/en/portrait',
  '/zh/music',
  '/en/music',
  '/zh',
  '/en',
  '/',
  
  // Should NOT match (excluded paths)
  '/api/admin/users',
  '/_next/static/chunks/main.js',
  '/static/image.png',
  '/favicon.ico',
  '/robots.txt',
  '/image.png',
  '/styles.css',
  '/script.js',
];

console.log('Testing middleware matcher pattern:\n');
console.log('Pattern:', matcherPattern.toString(), '\n');

testPaths.forEach(path => {
  // Remove leading slash for the actual matcher test
  const pathWithoutLeadingSlash = path.substring(1);
  const matches = matcherPattern.test(pathWithoutLeadingSlash);
  const expected = !path.includes('api') && 
                   !path.includes('_next') && 
                   !path.includes('static') &&
                   !path.includes('favicon.ico') &&
                   !path.includes('robots.txt') &&
                   !/\.[^/]+$/.test(path); // has file extension
  
  const status = matches === expected ? '✅' : '❌';
  console.log(`${status} ${path.padEnd(30)} -> ${matches ? 'MATCH' : 'NO MATCH'} (expected: ${expected ? 'MATCH' : 'NO MATCH'})`);
});
