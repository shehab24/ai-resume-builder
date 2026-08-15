// Clean background.js by removing orphaned junk block
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'background.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find boundary: line after "  }" closing the AI block at ~line 920
// The AI block ends with "  }" and the next non-empty content starts the junk
// The good tail starts with "  // 6. Close the tab only if"
const goodTailMarker = '  // 6. Close the tab only if successfully auto-submitted.';

let goodTailStart = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i] === goodTailMarker) {
    goodTailStart = i;
    break;
  }
}

if (goodTailStart === -1) {
  console.error('Could not find good tail marker!');
  process.exit(1);
}

// Find the last clean line of the AI block before the junk
// The AI block ends at line with "  }" which should be around line 920
// We know lines 0-919 are good (1-indexed: 1-920)
const aiBlockEnd = 920; // 1-indexed, so index 919

// Build clean file: lines 0 to aiBlockEnd-1, then blank, then goodTail onwards
const cleanLines = [
  ...lines.slice(0, aiBlockEnd),          // 0 to 919 (lines 1-920)
  '',                                       // blank separator
  ...lines.slice(goodTailStart)            // good tail
];

fs.writeFileSync(filePath, cleanLines.join('\n'), 'utf8');
console.log(`✅ Cleaned background.js: removed lines ${aiBlockEnd+1} to ${goodTailStart} (junk block)`);
console.log(`Final line count: ${cleanLines.length}`);
