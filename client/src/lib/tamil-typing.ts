// Simple Tamil phonetic typing implementation
const tamilMap: Record<string, string> = {
  // Vowels
  a: "அ", aa: "ஆ", i: "இ", ii: "ஈ", u: "உ", uu: "ஊ", e: "எ", ee: "ஏ", o: "ஒ", oo: "ஓ", au: "ஔ",

  // Consonants
  ka: "க", kaa: "கா", ki: "கி", kii: "கீ", ku: "கு", kuu: "கூ", ke: "கே", kee: "கே", ko: "கோ", koo: "கோ",
  nga: "ங", ngaa: "ஙா", ngi: "ஙி", ngii: "ஙீ", ngu: "ஙு", nguu: "ஙூ", nge: "ஙே", ngee: "ஙே", ngo: "ஙோ", ngoo: "ஙோ",
  cha: "ச", chaa: "சா", chi: "சி", chii: "சீ", chu: "சு", chuu: "சூ", che: "சே", chee: "சே", cho: "சோ", choo: "சோ",
  ja: "ஜ", jaa: "ஜா", ji: "ஜி", jii: "ஜீ", ju: "ஜு", juu: "ஜூ", je: "ஜே", jee: "ஜே", jo: "ஜோ", joo: "ஜோ",
  nya: "ஞ", nyaa: "ஞா", nyi: "ஞி", nyii: "ஞீ", nyu: "ஞு", nyuu: "ஞூ", nye: "ஞே", nyee: "ஞே", nyo: "ஞோ", nyoo: "ஞோ",
  ta: "ட", taa: "டா", ti: "டி", tii: "டீ", tu: "டு", tuu: "டூ", te: "டே", tee: "டே", to: "டோ", too: "டோ",
  na: "ண", naa: "ணா", ni: "ணி", nii: "ணீ", nu: "ணு", nuu: "ணூ", ne: "ணே", nee: "ணே", no: "ணோ", noo: "ணோ",
  tha: "த", thaa: "தா", thi: "தி", thii: "தீ", thu: "து", thuu: "தூ", the: "தே", thee: "தே", tho: "தோ", thoo: "தோ",
  dha: "த", dhaa: "தா", dhi: "தி", dhii: "தீ", dhu: "து", dhuu: "தூ", dhe: "தே", dhee: "தே", dho: "தோ", dhoo: "தோ",
  nna: "ந", nnaa: "நா", nni: "நி", nnii: "நீ", nnu: "நு", nnuu: "நூ", nne: "நே", nnee: "நே", nno: "நோ", nnoo: "நோ",
  pa: "ப", paa: "பா", pi: "பி", pii: "பீ", pu: "பு", puu: "பூ", pe: "பே", pee: "பே", po: "போ", poo: "போ",
  ma: "ம", maa: "மா", mi: "மி", mii: "மீ", mu: "மு", muu: "மூ", me: "மே", mee: "மே", mo: "மோ", moo: "மோ",
  ya: "ய", yaa: "யா", yi: "யி", yii: "யீ", yu: "யு", yuu: "யூ", ye: "யே", yee: "யே", yo: "யோ", yoo: "யோ",
  ra: "ர", raa: "ரா", ri: "ரி", rii: "ரீ", ru: "ரு", ruu: "ரூ", re: "ரே", ree: "ரே", ro: "ரோ", roo: "ரோ",
  la: "ல", laa: "லா", li: "லி", lii: "லீ", lu: "லு", luu: "லூ", le: "லே", lee: "லே", lo: "லோ", loo: "லோ",
  va: "வ", vaa: "வா", vi: "வி", vii: "வீ", vu: "வு", vuu: "வூ", ve: "வே", vee: "வே", vo: "வோ", voo: "வோ",
  zha: "ழ", zhaa: "ழா", zhi: "ழி", zhii: "ழீ", zhu: "ழு", zhuu: "ழூ", zhe: "ழே", zhee: "ழே", zho: "ழோ", zhoo: "ழோ",
  lla: "ள", llaa: "ளா", lli: "ளி", llii: "ளீ", llu: "ளு", lluu: "ளூ", lle: "ளே", llee: "ளே", llo: "ளோ", lloo: "ளோ",
  rra: "ற", rraa: "றா", rri: "றி", rrii: "றீ", rru: "று", rruu: "றூ", rre: "றே", rree: "றே", rro: "றோ", rroo: "றோ",
  ha: "ஹ", haa: "ஹா", hi: "ஹி", hii: "ஹீ", hu: "ஹு", huu: "ஹூ", he: "ஹே", hee: "ஹே", ho: "ஹோ", hoo: "ஹோ",

  // Numbers
  "0": "௦", "1": "௧", "2": "௨", "3": "௩", "4": "௪", "5": "௫", "6": "௬", "7": "௭", "8": "௮", "9": "௯",

  // Common words
  "namaste": "நமஸ்தே",
  "vanakkam": "வணக்கம்",
  "nandri": "நன்றி",
  "enna": "என்ன",
  "eppadhi": "எப்படி",
  "engae": "எங்கே",
  "yaar": "யார்",
  "eppozhudu": "எப்போது",
};

export class TamilTyping {
  private buffer: string = "";
  private element: HTMLInputElement | HTMLTextAreaElement | null = null;

  attach(element: HTMLInputElement | HTMLTextAreaElement) {
    this.element = element;
    element.addEventListener('input', this.handleInput.bind(this));
    element.addEventListener('keydown', this.handleKeyDown.bind(this) as EventListener);
    return this;
  }

  detach() {
    if (this.element) {
      this.element.removeEventListener('input', this.handleInput.bind(this));
      this.element.removeEventListener('keydown', this.handleKeyDown.bind(this) as EventListener);
      this.element = null;
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Tab') {
      this.convertBuffer();
    }
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.value;
    const cursorPos = target.selectionStart || 0;

    // Get the word at cursor position
    const words = value.split(/\s+/);
    let currentWordStart = 0;
    let currentWord = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordEnd = currentWordStart + word.length;

      if (cursorPos >= currentWordStart && cursorPos <= wordEnd) {
        currentWord = word;
        break;
      }

      currentWordStart = wordEnd + 1;
    }

    this.buffer = currentWord;
  }

  private convertBuffer() {
    if (!this.element || !this.buffer) return;

    const converted = this.convertWord(this.buffer);
    if (converted !== this.buffer) {
      const value = this.element.value;
      const cursorPos = this.element.selectionStart || 0;
      const wordStart = value.lastIndexOf(this.buffer, cursorPos - 1);

      if (wordStart !== -1) {
        const newValue = value.substring(0, wordStart) + converted + value.substring(wordStart + this.buffer.length);
        this.element.value = newValue;

        // Update cursor position
        const newCursorPos = wordStart + converted.length;
        this.element.setSelectionRange(newCursorPos, newCursorPos);

        // Trigger change event
        this.element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    this.buffer = "";
  }

  private convertWord(word: string): string {
    // Check for exact matches first
    if (tamilMap[word.toLowerCase()]) {
      return tamilMap[word.toLowerCase()];
    }

    // Try to convert character by character for longer words
    let result = "";
    let i = 0;

    while (i < word.length) {
      let matched = false;

      // Try longest matches first
      for (let len = Math.min(4, word.length - i); len > 0; len--) {
        const substr = word.substring(i, i + len).toLowerCase();
        if (tamilMap[substr]) {
          result += tamilMap[substr];
          i += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        result += word[i];
        i++;
      }
    }

    return result;
  }
}

export const tamilTyping = new TamilTyping();
