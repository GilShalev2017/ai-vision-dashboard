export interface Language {
  englishName: string;
  displayName: string;
  isocode: string; // This is useful for general display/identification
  azureLocaleCode: string | null; // Null if not directly supported by Azure Speech Service for STT/TTS
}

// languages.ts
export const allLanguages: Language[] = [
  { englishName: "Afrikaans", displayName: "Afrikaans", isocode: "af", azureLocaleCode: "af-ZA" },
  { englishName: "Albanian", displayName: "Shqip", isocode: "sq", azureLocaleCode: "sq-AL" },
  { englishName: "Amharic", displayName: "አማርኛ", isocode: "am", azureLocaleCode: "am-ET" },
  { englishName: "Arabic", displayName: "العربية", isocode: "ar", azureLocaleCode: "ar-SA" }, // Defaulting to Saudi Arabic; many other Arabic locales exist (e.g., ar-EG, ar-AE)
  { englishName: "Armenian", displayName: "Հայերեն", isocode: "hy", azureLocaleCode: "hy-AM" },
  { englishName: "Azerbaijani", displayName: "Azərbaycanca", isocode: "az", azureLocaleCode: "az-AZ" },
  { englishName: "Basque", displayName: "Euskara", isocode: "eu", azureLocaleCode: "eu-ES" },
  { englishName: "Belarusian", displayName: "Беларуская", isocode: "be", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Bengali", displayName: "বাংলা", isocode: "bn", azureLocaleCode: "bn-IN" }, // Defaulting to India; bn-BD for Bangladesh
  { englishName: "Bosnian", displayName: "Bosanski", isocode: "bs", azureLocaleCode: "bs-BA" },
  { englishName: "Bulgarian", displayName: "Български", isocode: "bg", azureLocaleCode: "bg-BG" },
  { englishName: "Burmese", displayName: "မြန်မာ", isocode: "my", azureLocaleCode: "my-MM" },
  { englishName: "Catalan", displayName: "Català", isocode: "ca", azureLocaleCode: "ca-ES" },
  { englishName: "Cebuano", displayName: "Cebuano", isocode: "ce", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Chichewa", displayName: "Chichewa", isocode: "ny", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Chinese (Simplified)", displayName: "中文 (简体)", isocode: "zh-Hans", azureLocaleCode: "zh-CN" }, // Common for STT/TTS Simplified Chinese
  { englishName: "Chinese (Traditional)", displayName: "中文 (繁體)", isocode: "zh-Hant", azureLocaleCode: "zh-TW" }, // Common for STT/TTS Traditional Chinese
  { englishName: "Corsican", displayName: "Corsican", isocode: "co", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Croatian", displayName: "Hrvatski", isocode: "hr", azureLocaleCode: "hr-HR" },
  { englishName: "Czech", displayName: "Čeština", isocode: "cs", azureLocaleCode: "cs-CZ" },
  { englishName: "Danish", displayName: "Dansk", isocode: "da", azureLocaleCode: "da-DK" },
  { englishName: "Dutch", displayName: "Nederlands", isocode: "nl", azureLocaleCode: "nl-NL" },
  { englishName: "English (UK)", displayName: "English (UK)", isocode: "en-GB", azureLocaleCode: "en-GB" },
  { englishName: "English", displayName: "English", isocode: "en", azureLocaleCode: "en-US" }, // Defaulting generic "English" to US
  { englishName: "Esperanto", displayName: "Esperanto", isocode: "eo", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Estonian", displayName: "Eesti", isocode: "et", azureLocaleCode: "et-EE" },
  { englishName: "Ewe", displayName: "Ewe", isocode: "ee", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Fijian", displayName: "Fijian", isocode: "fj", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Finnish", displayName: "Suomi", isocode: "fi", azureLocaleCode: "fi-FI" },
  { englishName: "French", displayName: "Français", isocode: "fr", azureLocaleCode: "fr-FR" }, // Defaulting to France French; many other French locales exist (e.g., fr-CA, fr-BE)
  { englishName: "Frisian (Western)", displayName: "Frisian (Western)", isocode: "fy", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Galician", displayName: "Galician", isocode: "gl", azureLocaleCode: "gl-ES" },
  { englishName: "Georgian", displayName: "ქართული", isocode: "ka", azureLocaleCode: "ka-GE" },
  { englishName: "German", displayName: "Deutsch", isocode: "de", azureLocaleCode: "de-DE" },
  { englishName: "Greek", displayName: "Ελληνικά", isocode: "el", azureLocaleCode: "el-GR" },
  { englishName: "Gujarati", displayName: "ગુજરાતી", isocode: "gu", azureLocaleCode: "gu-IN" },
  { englishName: "Haitian Creole", displayName: "Haitian Creole", isocode: "ht", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Hausa", displayName: "Hausa", isocode: "ha", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Hebrew", displayName: "עברית", isocode: "he", azureLocaleCode: "he-IL" },
  { englishName: "Hindi", displayName: "हिन्दी", isocode: "hi", azureLocaleCode: "hi-IN" },
  { englishName: "Hmong Daw", displayName: "Hmong Daw", isocode: "hmn", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Hungarian", displayName: "Magyar", isocode: "hu", azureLocaleCode: "hu-HU" },
  { englishName: "Icelandic", displayName: "Íslenska", isocode: "is", azureLocaleCode: "is-IS" },
  { englishName: "Igbo", displayName: "Igbo", isocode: "ig", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Indonesian", displayName: "Bahasa Indonesia", isocode: "id", azureLocaleCode: "id-ID" },
  { englishName: "Irish", displayName: "Irish", isocode: "ga", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Italian", displayName: "Italiano", isocode: "it", azureLocaleCode: "it-IT" },
  { englishName: "Japanese", displayName: "日本語", isocode: "ja", azureLocaleCode: "ja-JP" },
  { englishName: "Javanese", displayName: "Javanese", isocode: "jv", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Kannada", displayName: "ಕನ್ನಡ", isocode: "kn", azureLocaleCode: "kn-IN" },
  { englishName: "Kazakh", displayName: "Қазақша", isocode: "kk", azureLocaleCode: "kk-KZ" },
  { englishName: "Khmer", displayName: "ភាសាខ្មែរ", isocode: "km", azureLocaleCode: "km-KH" },
  { englishName: "Kinyarwanda", displayName: "Kinyarwanda", isocode: "rw", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Korean", displayName: "한국어", isocode: "ko", azureLocaleCode: "ko-KR" },
  { englishName: "Kurdish (Northern)", displayName: "Kurdish (Northern)", isocode: "ku", azureLocaleCode: "ku-TR" }, // Often associated with Turkey for Azure
  { englishName: "Kyrgyz", displayName: "Kyrgyz", isocode: "ky", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Lao", displayName: "ພາສາລາວ", isocode: "lo", azureLocaleCode: "lo-LA" },
  { englishName: "Latin", displayName: "Latin", isocode: "la", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Latvian", displayName: "Latviešu", isocode: "lv", azureLocaleCode: "lv-LV" },
  { englishName: "Lithuanian", displayName: "Lietuvių", isocode: "lt", azureLocaleCode: "lt-LT" },
  { englishName: "Luganda", displayName: "Luganda", isocode: "lg", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Luxembourgish", displayName: "Luxembourgish", isocode: "lb", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Macedonian", displayName: "Македонски", isocode: "mk", azureLocaleCode: "mk-MK" },
  { englishName: "Malagasy", displayName: "Malagasy", isocode: "mg", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Malay", displayName: "Bahasa Melayu", isocode: "ms", azureLocaleCode: "ms-MY" },
  { englishName: "Malayalam", displayName: "മലയാളം", isocode: "ml", azureLocaleCode: "ml-IN" },
  { englishName: "Maltese", displayName: "Malti", isocode: "mt", azureLocaleCode: "mt-MT" },
  { englishName: "Maori", displayName: "Maori", isocode: "mi", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Marathi", displayName: "मराठी", isocode: "mr", azureLocaleCode: "mr-IN" },
  { englishName: "Mongolian", displayName: "Монгол", isocode: "mn", azureLocaleCode: "mn-MN" },
  { englishName: "Myanmar (Burmese)", displayName: "Myanmar (Burmese)", isocode: "my", azureLocaleCode: "my-MM" }, // Duplicate, kept for consistency with your list
  { englishName: "Nepali", displayName: "नेपाली", isocode: "ne", azureLocaleCode: "ne-NP" },
  { englishName: "Norwegian Bokmål", displayName: "Norwegian Bokmål", isocode: "nb", azureLocaleCode: "nb-NO" },
  { englishName: "Norwegian Nynorsk", displayName: "Norwegian Nynorsk", isocode: "nn", azureLocaleCode: "nn-NO" },
  { englishName: "Pashto", displayName: "Pashto", isocode: "ps", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Persian", displayName: "فارسی", isocode: "fa", azureLocaleCode: "fa-IR" },
  { englishName: "Polish", displayName: "Polski", isocode: "pl", azureLocaleCode: "pl-PL" },
  { englishName: "Portuguese (Brazil)", displayName: "Português (Brasil)", isocode: "pt-BR", azureLocaleCode: "pt-BR" },
  { englishName: "Portuguese (Portugal)", displayName: "Português (Portugal)", isocode: "pt", azureLocaleCode: "pt-PT" },
  { englishName: "Punjabi", displayName: "ਪੰਜਾਬੀ", isocode: "pa", azureLocaleCode: "pa-IN" },
  { englishName: "Romanian", displayName: "Română", isocode: "ro", azureLocaleCode: "ro-RO" },
  { englishName: "Russian", displayName: "Русский", isocode: "ru", azureLocaleCode: "ru-RU" },
  { englishName: "Samoan", displayName: "Samoan", isocode: "sm", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Scots Gaelic", displayName: "Scots Gaelic", isocode: "gd", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Serbian", displayName: "Српски", isocode: "sr", azureLocaleCode: "sr-RS" }, // Defaulting to Serbia; sr-Cyrl-RS for Cyrillic
  { englishName: "Sesotho", displayName: "Sesotho", isocode: "st", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Shona", displayName: "Shona", isocode: "sn", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Sindhi", displayName: "Sindhi", isocode: "sd", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Sinhalese", displayName: "සිංහල", isocode: "si", azureLocaleCode: "si-LK" },
  { englishName: "Slovak", displayName: "Slovenčina", isocode: "sk", azureLocaleCode: "sk-SK" },
  { englishName: "Slovenian", displayName: "Slovenščina", isocode: "sl", azureLocaleCode: "sl-SI" },
  { englishName: "Somali", displayName: "Somali", isocode: "so", azureLocaleCode: "so-SO" },
  { englishName: "Spanish", displayName: "Español", isocode: "es", azureLocaleCode: "es-ES" }, // Defaulting to Spain; many other Spanish locales exist (e.g., es-MX, es-AR)
  { englishName: "Sundanese", displayName: "Sundanese", isocode: "su", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Swahili", displayName: "Swahili", isocode: "sw", azureLocaleCode: "sw-KE" }, // Defaulting to Kenya; sw-TZ for Tanzania
  { englishName: "Swedish", displayName: "Svenska", isocode: "sv", azureLocaleCode: "sv-SE" },
  { englishName: "Tagalog (Filipino)", displayName: "Tagalog (Filipino)", isocode: "tl", azureLocaleCode: "fil-PH" }, // Azure uses fil-PH for Filipino/Tagalog
  { englishName: "Tajik", displayName: "Tajik", isocode: "tg", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Tamil", displayName: "தமிழ்", isocode: "ta", azureLocaleCode: "ta-IN" }, // Defaulting to India; ta-LK, ta-MY, ta-SG also exist
  { englishName: "Tatar", displayName: "Tatar", isocode: "tt", azureLocaleCode: "tt-RU" },
  { englishName: "Telugu", displayName: "తెలుగు", isocode: "te", azureLocaleCode: "te-IN" },
  { englishName: "Thai", displayName: "ไทย", isocode: "th", azureLocaleCode: "th-TH" },
  { englishName: "Tongan", displayName: "Tongan", isocode: "to", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Turkish", displayName: "Türkçe", isocode: "tr", azureLocaleCode: "tr-TR" },
  { englishName: "Ukrainian", displayName: "Українська", isocode: "uk", azureLocaleCode: "uk-UA" },
  { englishName: "Urdu", displayName: "اردو", isocode: "ur", azureLocaleCode: "ur-PK" }, // Defaulting to Pakistan; ur-IN for India
  { englishName: "Uzbek", displayName: "Uzbek", isocode: "uz", azureLocaleCode: "uz-Latn-UZ" }, // Often uz-Latn-UZ or uz-Cyrl-UZ
  { englishName: "Vietnamese", displayName: "Tiếng Việt", isocode: "vi", azureLocaleCode: "vi-VN" },
  { englishName: "Welsh", displayName: "Welsh", isocode: "cy", azureLocaleCode: "cy-GB" },
  { englishName: "Yiddish", displayName: "Yiddish", isocode: "yi", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Yoruba", displayName: "Yoruba", isocode: "yo", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Zulu", displayName: "IsiZulu", isocode: "zu", azureLocaleCode: "zu-ZA" },

  // Supported by Google Transcriber! (and my best guess for Azure, or null if not likely)
  { englishName: "Assamese", displayName: "Assamese", isocode: "as", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Aymara", displayName: "Aymara", isocode: "ay", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Bambara", displayName: "Bambara", isocode: "bm", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Bhojpuri", displayName: "Bhojpuri", isocode: "bho", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Dhivehi", displayName: "Dhivehi", isocode: "dv", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Dogri", displayName: "Dogri", isocode: "doi", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Filipino", displayName: "Filipino", isocode: "fil", azureLocaleCode: "fil-PH" }, // Azure uses fil-PH
  { englishName: "Guarani", displayName: "Guarani", isocode: "gn", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Hawaiian", displayName: "Hawaiian", isocode: "haw", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Ilocano", displayName: "Ilocano", isocode: "ilo", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Konkani", displayName: "Konkani", isocode: "gom", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Krio", displayName: "Krio", isocode: "kri", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Kurdish (Sorani)", displayName: "Kurdish (Sorani)", isocode: "ckb", azureLocaleCode: "ckb-IQ" }, // ckb-IQ or ckb-IR
  { englishName: "Lingala", displayName: "Lingala", isocode: "ln", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Maithili", displayName: "Maithili", isocode: "mai", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Meiteilon (Manipuri)", displayName: "Meiteilon (Manipuri)", isocode: "mni-Mtei", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Mizo", displayName: "Mizo", isocode: "lus", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Norwegian", displayName: "Norwegian", isocode: "no", azureLocaleCode: "nb-NO" }, // Mapping generic Norwegian to Bokmål
  { englishName: "Odia (Oriya)", displayName: "Odia (Oriya)", isocode: "or", azureLocaleCode: "or-IN" },
  { englishName: "Oromo", displayName: "Oromo", isocode: "om", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Quechua", displayName: "Quechua", isocode: "qu", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Sanskrit", displayName: "Sanskrit", isocode: "sa", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Sepedi", displayName: "Sepedi", isocode: "nso", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Tigrinya", displayName: "Tigrinya", isocode: "ti", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Tsonga", displayName: "Tsonga", isocode: "ts", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Turkmen", displayName: "Turkmen", isocode: "tk", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Twi (Akan)", displayName: "Twi (Akan)", isocode: "ak", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Uyghur", displayName: "Uyghur", isocode: "ug", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Xhosa", displayName: "Xhosa", isocode: "xh", azureLocaleCode: null }, // Not commonly listed for STT/TTS

  // Supported by Speechmatix Transcriber (and my best guess for Azure, or null if not likely)
  { englishName: "Bashkir", displayName: "Башҡортса", isocode: "ba", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Cantonese", displayName: "粵語", isocode: "yue", azureLocaleCode: "zh-HK" }, // zh-HK is common for Cantonese
  { englishName: "Interlingua", displayName: "Interlingua", isocode: "ia", azureLocaleCode: null }, // Not commonly listed for STT/TTS
  { englishName: "Mandarin", displayName: "普通话", isocode: "cmn", azureLocaleCode: "zh-CN" } // cmn is common for Mandarin, mapping to zh-CN
].sort((a, b) => a.englishName.localeCompare(b.englishName));