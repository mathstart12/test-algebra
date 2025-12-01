#!/usr/bin/env node

/**
 * SSR Build Script for KaTeX Math Rendering
 *
 * This script pre-renders all LaTeX math expressions to HTML,
 * eliminating client-side rendering flicker.
 */

const fs = require('fs');
const katex = require('katex');

// Read the source HTML file
const htmlPath = './index.html';
let html = fs.readFileSync(htmlPath, 'utf-8');

console.log('🔍 Starting SSR build process...\n');

// Counter for rendered expressions
let renderCount = 0;
let errorCount = 0;

/**
 * Render a single LaTeX expression to HTML
 */
function renderLatex(latex, displayMode = false) {
  try {
    const rendered = katex.renderToString(latex, {
      displayMode: displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
      output: 'html'
    });
    renderCount++;
    return rendered;
  } catch (e) {
    console.error(`❌ Error rendering: ${latex}`);
    console.error(`   ${e.message}`);
    errorCount++;
    // Return original if rendering fails
    return displayMode ? `\\[${latex}\\]` : `$${latex}$`;
  }
}

/**
 * Replace all LaTeX expressions with pre-rendered HTML
 * Handles both inline ($...$) and display (\[...\]) math
 */
function replaceLatexWithHtml(text) {
  // First, replace display math \[...\]
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
    return renderLatex(latex.trim(), true);
  });

  // Then replace inline math $...$
  // But avoid matching $$ or escaped \$
  text = text.replace(/(?<!\\)\$(?!\$)([^\$]+?)(?<!\\)\$(?!\$)/g, (match, latex) => {
    return renderLatex(latex.trim(), false);
  });

  return text;
}

console.log('📝 Processing HTML file...');

// Replace LaTeX in the entire HTML
html = replaceLatexWithHtml(html);

// Comment out KaTeX JavaScript (keep CSS for styling)
console.log('🚫 Commenting out KaTeX JavaScript...');
html = html.replace(
  /<script defer src="https:\/\/cdn\.jsdelivr\.net\/npm\/katex@[\d.]+\/dist\/katex\.min\.js"><\/script>/g,
  '<!-- KaTeX JS not needed - using SSR -->\n  <!-- <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script> -->'
);

html = html.replace(
  /<script defer src="https:\/\/cdn\.jsdelivr\.net\/npm\/katex@[\d.]+\/dist\/contrib\/auto-render\.min\.js"><\/script>/g,
  '<!-- <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script> -->'
);

// Disable renderMath() function
console.log('🚫 Disabling renderMath() function...');
html = html.replace(
  /renderMath\(\);/g,
  '// renderMath(); // Disabled - using SSR'
);

// Also disable the renderMath function definition
html = html.replace(
  /function renderMath\(\) \{/g,
  'function renderMath() { return; // Disabled - using SSR\n    /*'
);

// Close the comment block for renderMath function
html = html.replace(
  /(function renderMath\(\) \{ return;[\s\S]*?)(requestAnimationFrame\(\(\) => \{[\s\S]*?\}\);[\s]*\}, 150\);[\s]*\})/,
  '$1$2 */'
);

// Write the output file
const outputPath = './index.html';
fs.writeFileSync(outputPath, html, 'utf-8');

console.log('\n✅ SSR Build Complete!\n');
console.log(`📊 Statistics:`);
console.log(`   ✓ ${renderCount} LaTeX expressions rendered`);
if (errorCount > 0) {
  console.log(`   ⚠️  ${errorCount} expressions failed to render`);
}
console.log(`   📄 Output: ${outputPath}`);
console.log('\n🚀 Result:');
console.log('   - All math expressions pre-rendered to HTML');
console.log('   - KaTeX JavaScript commented out');
console.log('   - renderMath() function disabled');
console.log('   - No more rendering flicker! 🎉\n');
