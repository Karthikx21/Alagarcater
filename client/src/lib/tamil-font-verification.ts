/**
 * Tamil Font Verification and Management System
 * Ensures proper Tamil font rendering across all platforms and contexts
 */

export interface TamilFontInfo {
  name: string;
  family: string;
  available: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  platform: string[];
  unicode: boolean;
}

export interface FontTestResult {
  fontName: string;
  available: boolean;
  renderQuality: number;
  unicodeSupport: boolean;
  printCompatible: boolean;
}

class TamilFontManager {
  private static instance: TamilFontManager;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private testText = 'தமிழ் உணவு வகைகள் - Tamil Food Varieties';
  private fallbackText = 'Tamil Food Varieties';

  // Comprehensive list of Tamil fonts
  private tamilFonts: TamilFontInfo[] = [
    {
      name: 'Noto Sans Tamil',
      family: '"Noto Sans Tamil", sans-serif',
      available: false,
      quality: 'excellent',
      platform: ['Windows', 'macOS', 'Linux', 'Web', 'Desktop'],
      unicode: true
    },
    {
      name: 'Tamil Sangam MN',
      family: '"Tamil Sangam MN", sans-serif',
      available: false,
      quality: 'excellent',
      platform: ['macOS', 'iOS', 'Desktop'],
      unicode: true
    },
    {
      name: 'Tamil MN',
      family: '"Tamil MN", sans-serif',
      available: false,
      quality: 'good',
      platform: ['macOS', 'iOS', 'Desktop'],
      unicode: true
    },
    {
      name: 'Latha',
      family: '"Latha", sans-serif',
      available: false,
      quality: 'good',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    {
      name: 'Vijaya',
      family: '"Vijaya", serif',
      available: false,
      quality: 'fair',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    {
      name: 'Nirmala UI',
      family: '"Nirmala UI", sans-serif',
      available: false,
      quality: 'good',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    {
      name: 'Segoe UI',
      family: '"Segoe UI", sans-serif',
      available: false,
      quality: 'fair',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    {
      name: 'Shruti',
      family: '"Shruti", sans-serif',
      available: false,
      quality: 'fair',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    {
      name: 'Tunga',
      family: '"Tunga", sans-serif',
      available: false,
      quality: 'fair',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    {
      name: 'Raavi',
      family: '"Raavi", sans-serif',
      available: false,
      quality: 'fair',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    {
      name: 'Mangal',
      family: '"Mangal", sans-serif',
      available: false,
      quality: 'fair',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    {
      name: 'Aparajita',
      family: '"Aparajita", serif',
      available: false,
      quality: 'fair',
      platform: ['Windows', 'Desktop'],
      unicode: true
    },
    // Add embedded fonts for desktop app
    {
      name: 'Tamil-Embedded',
      family: '"Tamil-Embedded", sans-serif',
      available: true, // Assume available in desktop app
      quality: 'excellent',
      platform: ['Desktop'],
      unicode: true
    }
  ];

  private constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 300;
    this.canvas.height = 100;
    this.context = this.canvas.getContext('2d')!;
  }

  public static getInstance(): TamilFontManager {
    if (!TamilFontManager.instance) {
      TamilFontManager.instance = new TamilFontManager();
    }
    return TamilFontManager.instance;
  }

  public async verifyAllFonts(): Promise<FontTestResult[]> {
    console.log('🔤 Verifying Tamil fonts...');
    
    const results: FontTestResult[] = [];
    
    for (const font of this.tamilFonts) {
      const result = await this.testFont(font);
      results.push(result);

      // Update font availability
      font.available = result.available;
    }

    console.log(`✅ Font verification complete. ${results.filter(r => r.available).length}/${results.length} fonts available`);
    return results;
  }

  private async testFont(font: TamilFontInfo): Promise<FontTestResult> {
    try {
      // Test 1: Font availability using canvas
      const available = this.isFontAvailable(font.family);
      
      // Test 2: Render quality assessment
      const renderQuality = available ? this.assessRenderQuality(font.family) : 0;
      
      // Test 3: Unicode support test
      const unicodeSupport = available ? this.testUnicodeSupport(font.family) : false;
      
      // Test 4: Print compatibility (simulated)
      const printCompatible = available && unicodeSupport && renderQuality > 0.7;

      return {
        fontName: font.name,
        available,
        renderQuality,
        unicodeSupport,
        printCompatible
      };
    } catch (error) {
      console.warn(`Font test failed for ${font.name}:`, error);
      return {
        fontName: font.name,
        available: false,
        renderQuality: 0,
        unicodeSupport: false,
        printCompatible: false
      };
    }
  }

  private isFontAvailable(fontFamily: string): boolean {
    // Create a test element
    const testElement = document.createElement('span');
    testElement.style.fontFamily = fontFamily;
    testElement.style.fontSize = '16px';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    testElement.textContent = this.testText;
    
    document.body.appendChild(testElement);
    
    // Measure with test font
    const testWidth = testElement.offsetWidth;
    const testHeight = testElement.offsetHeight;
    
    // Measure with fallback font
    testElement.style.fontFamily = 'Arial, sans-serif';
    const fallbackWidth = testElement.offsetWidth;
    const fallbackHeight = testElement.offsetHeight;
    
    document.body.removeChild(testElement);
    
    // Font is available if dimensions differ significantly
    const widthDiff = Math.abs(testWidth - fallbackWidth);
    const heightDiff = Math.abs(testHeight - fallbackHeight);
    
    return widthDiff > 5 || heightDiff > 2;
  }

  private assessRenderQuality(fontFamily: string): number {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.font = `16px ${fontFamily}`;
    this.context.fillStyle = '#000000';
    this.context.textBaseline = 'top';
    
    // Render Tamil text
    this.context.fillText(this.testText, 10, 10);
    
    // Get image data and analyze
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    let pixelCount = 0;
    let blackPixels = 0;
    
    // Count black pixels (text)
    for (let i = 0; i < data.length; i += 4) {
      pixelCount++;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Consider pixel as text if it's dark
      if (r < 128 && g < 128 && b < 128) {
        blackPixels++;
      }
    }
    
    // Quality based on text density
    const textDensity = blackPixels / pixelCount;
    
    // Normalize to 0-1 scale
    return Math.min(textDensity * 10, 1);
  }

  private testUnicodeSupport(fontFamily: string): boolean {
    // Test specific Tamil Unicode characters
    const tamilChars = ['த', 'மி', 'ழ்', 'உ', 'ண', 'வு'];
    
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.font = `16px ${fontFamily}`;
    
    let supportedChars = 0;
    
    tamilChars.forEach((char, index) => {
      this.context.fillText(char, 10 + (index * 20), 10);
      
      // Check if character was rendered (simplified test)
      const imageData = this.context.getImageData(10 + (index * 20), 10, 15, 20);
      const hasPixels = Array.from(imageData.data).some((value, i) => i % 4 < 3 && value < 200);
      
      if (hasPixels) {
        supportedChars++;
      }
    });
    
    // Consider Unicode supported if most characters render
    return supportedChars >= tamilChars.length * 0.8;
  }

  public getBestAvailableFont(): TamilFontInfo | null {
    const availableFonts = this.tamilFonts.filter(font => font.available);
    
    if (availableFonts.length === 0) return null;
    
    // Sort by quality
    const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
    
    return availableFonts.sort((a, b) => {
      return qualityOrder[b.quality] - qualityOrder[a.quality];
    })[0];
  }

  public getOptimalFontStack(): string {
    const availableFonts = this.tamilFonts.filter(font => font.available);
    
    if (availableFonts.length === 0) {
      return '"Arial Unicode MS", Arial, sans-serif';
    }
    
    // Create font stack with best fonts first
    const fontFamilies = availableFonts
      .sort((a, b) => {
        const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
        return qualityOrder[b.quality] - qualityOrder[a.quality];
      })
      .map(font => font.family);
    
    // Add fallbacks
    fontFamilies.push('"Arial Unicode MS"', 'Arial', 'sans-serif');
    
    return fontFamilies.join(', ');
  }

  public generateFontCSS(): string {
    const fontStack = this.getOptimalFontStack();
    
    return `
/* Optimized Tamil font stack */
.tamil-text-optimized {
  font-family: ${fontStack};
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Print-specific Tamil fonts */
@media print {
  .tamil-text-optimized {
    font-family: ${fontStack};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color: #000 !important;
  }
}

/* High DPI display optimizations */
@media screen and (min-resolution: 192dpi) {
  .tamil-text-optimized {
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
  }
}
`;
  }

  public async injectOptimizedCSS(): Promise<void> {
    // Verify fonts first
    await this.verifyAllFonts();
    
    // Generate and inject CSS
    const css = this.generateFontCSS();
    
    // Remove existing optimized styles
    const existingStyle = document.getElementById('tamil-font-optimized');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Inject new styles
    const styleElement = document.createElement('style');
    styleElement.id = 'tamil-font-optimized';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    
    console.log('✅ Optimized Tamil font CSS injected');
  }

  public getFontReport(): {
    totalFonts: number;
    availableFonts: number;
    bestFont: string | null;
    fontStack: string;
    recommendations: string[];
  } {
    const availableFonts = this.tamilFonts.filter(font => font.available);
    const bestFont = this.getBestAvailableFont();
    
    const recommendations: string[] = [];
    
    if (availableFonts.length === 0) {
      recommendations.push('No Tamil fonts detected. Install Noto Sans Tamil for best results.');
    } else if (availableFonts.length < 3) {
      recommendations.push('Limited Tamil fonts available. Consider installing additional fonts.');
    }
    
    if (!bestFont || bestFont.quality === 'poor') {
      recommendations.push('Current Tamil font quality is poor. Install Noto Sans Tamil or Tamil Sangam MN.');
    }
    
    return {
      totalFonts: this.tamilFonts.length,
      availableFonts: availableFonts.length,
      bestFont: bestFont?.name || null,
      fontStack: this.getOptimalFontStack(),
      recommendations
    };
  }

  public testPrintCompatibility(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create a test print element
      const testElement = document.createElement('div');
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.top = '-9999px';
      testElement.className = 'tamil-text-optimized';
      testElement.textContent = this.testText;
      
      document.body.appendChild(testElement);
      
      // Simulate print media query
      const printStyles = window.getComputedStyle(testElement);
      const fontFamily = printStyles.fontFamily;
      
      document.body.removeChild(testElement);
      
      // Check if Tamil fonts are in the computed font stack
      const hasTamilFonts = this.tamilFonts.some(font => 
        fontFamily.includes(font.name) && font.available
      );
      
      resolve(hasTamilFonts);
    });
  }
}

// Export singleton instance
export const tamilFontManager = TamilFontManager.getInstance();

// Convenience functions
export const verifyTamilFonts = () => tamilFontManager.verifyAllFonts();
export const getBestTamilFont = () => tamilFontManager.getBestAvailableFont();
export const getOptimalTamilFontStack = () => tamilFontManager.getOptimalFontStack();
export const injectOptimizedTamilCSS = () => tamilFontManager.injectOptimizedCSS();
export const getTamilFontReport = () => tamilFontManager.getFontReport();
export const testTamilPrintCompatibility = () => tamilFontManager.testPrintCompatibility();

export default tamilFontManager;
