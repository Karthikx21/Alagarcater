/**
 * Enhanced Tamil Translation Service
 * Comprehensive offline Tamil translation with auto-suggestion and phonetic input
 */

import { comprehensiveTamilDictionary } from './comprehensive-tamil-dictionary';

export interface TamilTranslationResult {
  tamil: string;
  confidence: number;
  category: string;
  alternatives: string[];
}

export interface TamilSuggestion {
  english: string;
  tamil: string;
  category: string;
  score: number;
}

class EnhancedTamilTranslationService {
  private static instance: EnhancedTamilTranslationService;
  private combinedDictionary: Record<string, string> = {};
  private reverseDictionary: Record<string, string> = {};
  private categoryMapping: Record<string, string> = {};
  private initialized = false;

  private constructor() {
    this.initializeDictionaries();
  }

  public static getInstance(): EnhancedTamilTranslationService {
    if (!EnhancedTamilTranslationService.instance) {
      EnhancedTamilTranslationService.instance = new EnhancedTamilTranslationService();
    }
    return EnhancedTamilTranslationService.instance;
  }

  private initializeDictionaries(): void {
    if (this.initialized) return;

    console.log('🔤 Initializing comprehensive Tamil dictionaries...');

    // Combine all dictionaries with category mapping
    Object.entries(comprehensiveTamilDictionary).forEach(([categoryName, dictionary]) => {
      Object.entries(dictionary).forEach(([english, tamil]) => {
        // Store in combined dictionary
        this.combinedDictionary[english.toLowerCase()] = tamil;
        
        // Store reverse mapping (Tamil to English)
        this.reverseDictionary[tamil] = english;
        
        // Store category mapping
        this.categoryMapping[english.toLowerCase()] = categoryName;
      });
    });

    // Add common variations and synonyms
    this.addCommonVariations();
    
    this.initialized = true;
    console.log(`✅ Tamil dictionaries initialized with ${Object.keys(this.combinedDictionary).length} entries`);
  }

  private addCommonVariations(): void {
    // Add plural forms
    const pluralMappings: Record<string, string> = {
      'idlis': this.combinedDictionary['idli'],
      'dosas': this.combinedDictionary['dosa'],
      'vadas': this.combinedDictionary['vada'],
      'samosas': this.combinedDictionary['samosa'],
      'rotis': this.combinedDictionary['roti'],
      'naans': this.combinedDictionary['naan'],
      'parathas': this.combinedDictionary['paratha']
    };

    Object.entries(pluralMappings).forEach(([english, tamil]) => {
      if (tamil) {
        this.combinedDictionary[english] = tamil;
        this.categoryMapping[english] = 'variations';
      }
    });

    // Add common spelling variations
    const spellingVariations: Record<string, string> = {
      'dhal': this.combinedDictionary['dal'],
      'dhall': this.combinedDictionary['dal'],
      'daal': this.combinedDictionary['dal'],
      'biriyani': this.combinedDictionary['biryani'],
      'biriani': this.combinedDictionary['biryani'],
      'briyani': this.combinedDictionary['biryani'],
      'chapathi': this.combinedDictionary['chapati'],
      'chappati': this.combinedDictionary['chapati'],
      'chappathi': this.combinedDictionary['chapati'],
      'dosai': this.combinedDictionary['dosa'],
      'thosai': this.combinedDictionary['dosa'],
      'vadai': this.combinedDictionary['vada'],
      'wadai': this.combinedDictionary['vada']
    };

    Object.entries(spellingVariations).forEach(([english, tamil]) => {
      if (tamil) {
        this.combinedDictionary[english] = tamil;
        this.categoryMapping[english] = 'variations';
      }
    });

    // Add common food terms
    const commonTerms: Record<string, string> = {
      'food': 'உணவு',
      'meal': 'உணவு',
      'dish': 'உணவு வகை',
      'recipe': 'செய்முறை',
      'menu': 'உணவு பட்டியல்',
      'breakfast': 'காலை உணவு',
      'lunch': 'மதிய உணவு',
      'dinner': 'இரவு உணவு',
      'snack': 'சிற்றுண்டி',
      'sweet': 'இனிப்பு',
      'curry': 'கறி',
      'gravy': 'குழம்பு',
      'rice': 'சாதம்',
      'bread': 'ரொட்டி',
      'vegetarian': 'சைவ உணவு',
      'non-vegetarian': 'அசைவ உணவு',
      'veg': 'சைவம்',
      'non-veg': 'அசைவம்',
      'spicy': 'காரமான',
      'mild': 'மிதமான',
      'hot': 'சூடான',
      'cold': 'குளிர்ந்த',
      'fresh': 'புதிய',
      'special': 'சிறப்பு',
      'traditional': 'பாரம்பரிய',
      'homemade': 'வீட்டில் செய்த',
      'authentic': 'உண்மையான',
      'delicious': 'சுவையான',
      'tasty': 'சுவையான',
      'yummy': 'சுவையான'
    };

    Object.entries(commonTerms).forEach(([english, tamil]) => {
      this.combinedDictionary[english] = tamil;
      this.categoryMapping[english] = 'common';
    });
  }

  public translateToTamil(englishText: string): TamilTranslationResult {
    if (!this.initialized) {
      this.initializeDictionaries();
    }

    const cleanText = englishText.toLowerCase().trim();
    
    // Direct match
    if (this.combinedDictionary[cleanText]) {
      return {
        tamil: this.combinedDictionary[cleanText],
        confidence: 1.0,
        category: this.categoryMapping[cleanText] || 'unknown',
        alternatives: []
      };
    }

    // Fuzzy matching for partial matches
    const suggestions = this.findSimilarTerms(cleanText);
    
    if (suggestions.length > 0) {
      const bestMatch = suggestions[0];
      return {
        tamil: bestMatch.tamil,
        confidence: bestMatch.score,
        category: bestMatch.category,
        alternatives: suggestions.slice(1, 4).map(s => s.tamil)
      };
    }

    // Word-by-word translation for compound terms
    const words = cleanText.split(/[\s\-_]+/);
    if (words.length > 1) {
      const translatedWords = words.map(word => {
        const translation = this.combinedDictionary[word];
        return translation || word;
      });
      
      return {
        tamil: translatedWords.join(' '),
        confidence: 0.7,
        category: 'compound',
        alternatives: []
      };
    }

    // No translation found
    return {
      tamil: englishText,
      confidence: 0.0,
      category: 'unknown',
      alternatives: []
    };
  }

  public translateToEnglish(tamilText: string): string {
    if (!this.initialized) {
      this.initializeDictionaries();
    }

    return this.reverseDictionary[tamilText] || tamilText;
  }

  public getSuggestions(partialText: string, limit: number = 10): TamilSuggestion[] {
    if (!this.initialized) {
      this.initializeDictionaries();
    }

    const cleanText = partialText.toLowerCase().trim();
    if (cleanText.length < 2) return [];

    return this.findSimilarTerms(cleanText, limit);
  }

  private findSimilarTerms(searchTerm: string, limit: number = 10): TamilSuggestion[] {
    const suggestions: TamilSuggestion[] = [];

    Object.entries(this.combinedDictionary).forEach(([english, tamil]) => {
      const score = this.calculateSimilarity(searchTerm, english);
      
      if (score > 0.3) { // Minimum similarity threshold
        suggestions.push({
          english,
          tamil,
          category: this.categoryMapping[english] || 'unknown',
          score
        });
      }
    });

    // Sort by score (descending) and return top results
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateSimilarity(term1: string, term2: string): number {
    // Exact match
    if (term1 === term2) return 1.0;
    
    // Starts with match
    if (term2.startsWith(term1)) return 0.9;
    
    // Contains match
    if (term2.includes(term1)) return 0.8;
    
    // Levenshtein distance based similarity
    const distance = this.levenshteinDistance(term1, term2);
    const maxLength = Math.max(term1.length, term2.length);
    
    if (maxLength === 0) return 1.0;
    
    const similarity = 1 - (distance / maxLength);
    return similarity > 0.5 ? similarity : 0;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  public getAvailableCategories(): string[] {
    if (!this.initialized) {
      this.initializeDictionaries();
    }

    return Array.from(new Set(Object.values(this.categoryMapping)));
  }

  public getTermsByCategory(category: string): Array<{ english: string; tamil: string }> {
    if (!this.initialized) {
      this.initializeDictionaries();
    }

    const terms: Array<{ english: string; tamil: string }> = [];
    
    Object.entries(this.categoryMapping).forEach(([english, cat]) => {
      if (cat === category) {
        terms.push({
          english,
          tamil: this.combinedDictionary[english]
        });
      }
    });

    return terms.sort((a, b) => a.english.localeCompare(b.english));
  }

  public getDictionaryStats(): {
    totalTerms: number;
    categoryCounts: Record<string, number>;
    coverage: string[];
  } {
    if (!this.initialized) {
      this.initializeDictionaries();
    }

    const categoryCounts: Record<string, number> = {};
    Object.values(this.categoryMapping).forEach(category => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return {
      totalTerms: Object.keys(this.combinedDictionary).length,
      categoryCounts,
      coverage: [
        'South Indian Breakfast Items',
        'South Indian Rice Dishes',
        'South Indian Curries',
        'North Indian Dishes',
        'Rice and Biryani',
        'Sweets and Desserts',
        'Snacks and Street Food',
        'Spices and Ingredients',
        'Cooking Methods',
        'Beverages',
        'Common Food Terms'
      ]
    };
  }

  public validateTamilText(text: string): boolean {
    // Check if text contains Tamil Unicode characters
    const tamilRange = /[\u0B80-\u0BFF]/;
    return tamilRange.test(text);
  }

  public isOfflineReady(): boolean {
    return this.initialized && Object.keys(this.combinedDictionary).length > 0;
  }
}

// Export singleton instance
export const tamilTranslationService = EnhancedTamilTranslationService.getInstance();

// Convenience functions
export const translateToTamil = (text: string) => tamilTranslationService.translateToTamil(text);
export const translateToEnglish = (text: string) => tamilTranslationService.translateToEnglish(text);
export const getTamilSuggestions = (text: string, limit?: number) => tamilTranslationService.getSuggestions(text, limit);
export const validateTamilText = (text: string) => tamilTranslationService.validateTamilText(text);

export default tamilTranslationService;
