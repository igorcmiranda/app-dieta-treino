/**
 * 🎨 Font Configuration for Lasy AI Templates
 * 
 * Font families configuration for easy use.
 * Fonts are loaded via Next.js font optimization and @fontsource packages.
 */

/**
 * Font family configurations for easy use
 */
export const fontFamilies = {
  // Sans-serif fonts
  geist: '"Geist Sans", ui-sans-serif, system-ui, sans-serif',
  inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
  roboto: '"Roboto", ui-sans-serif, system-ui, sans-serif',
  openSans: '"Open Sans", ui-sans-serif, system-ui, sans-serif',
  
  // Monospace fonts
  geistMono: '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", monospace',
  sourceCode: '"Source Code Pro", ui-monospace, SFMono-Regular, monospace',
  firaCode: '"Fira Code", ui-monospace, SFMono-Regular, monospace',
  jetbrains: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const

/**
 * CSS custom properties for fonts (use in globals.css)
 */
export const fontCSSVars = `
  --font-geist-sans: ${fontFamilies.geist};
  --font-geist-mono: ${fontFamilies.geistMono};
  --font-inter: ${fontFamilies.inter};
  --font-roboto: ${fontFamilies.roboto};
  --font-open-sans: ${fontFamilies.openSans};
  --font-source-code: ${fontFamilies.sourceCode};
  --font-fira-code: ${fontFamilies.firaCode};
  --font-jetbrains: ${fontFamilies.jetbrains};
`

/**
 * Tailwind CSS font family configuration
 * Add this to your tailwind.config.js
 */
export const tailwindFontConfig = {
  fontFamily: {
    'geist-sans': ['var(--font-geist-sans)'],
    'geist-mono': ['var(--font-geist-mono)'],
    'inter': ['var(--font-inter)'],
    'roboto': ['var(--font-roboto)'],
    'open-sans': ['var(--font-open-sans)'],
    'source-code': ['var(--font-source-code)'],
    'fira-code': ['var(--font-fira-code)'],
    'jetbrains': ['var(--font-jetbrains)'],
  }
}

/**
 * Usage Examples:
 * 
 * 1. In CSS/Tailwind:
 *    className="font-geist-sans"
 *    className="font-geist-mono"
 * 
 * 2. In styled-components:
 *    font-family: ${fontFamilies.geist};
 * 
 * 3. In component styles:
 *    style={{ fontFamily: fontFamilies.geistMono }}
 * 
 * 4. For AI: All fonts are available, just import this file and use the fontFamilies object
 */