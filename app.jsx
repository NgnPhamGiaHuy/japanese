import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    BarChart2,
    Brain,
    Check,
    ChevronRight,
    Crown,
    Eye,
    EyeOff,
    Flame,
    Headphones,
    Heart,
    Infinity as InfinityIcon,
    Keyboard,
    PenTool,
    Play,
    RotateCcw,
    Settings,
    Share2,
    Shuffle,
    Target,
    Timer,
    Trash2,
    Trophy,
    Type,
    Users,
    Volume2,
    X,
    Zap
} from "lucide-react";

// --- FIREBASE CLOUD STORAGE SETUP ---
import { initializeApp } from "firebase/app";
import {
    browserLocalPersistence,
    getAuth,
    onAuthStateChanged,
    setPersistence,
    signInAnonymously,
    signInWithCustomToken
} from "firebase/auth";
import { collection, doc, getFirestore, onSnapshot, setDoc } from "firebase/firestore";


let app, auth, db, appId = "kana-master-global";
try {
    if (MY_FIREBASE_CONFIG && MY_FIREBASE_CONFIG.apiKey) {
        app = initializeApp(MY_FIREBASE_CONFIG);
        auth = getAuth(app);
        db = getFirestore(app);
    } else if (typeof __firebase_config !== "undefined") {
        const config = JSON.parse(__firebase_config);
        app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
        if (typeof __app_id !== "undefined") appId = __app_id;
    }
} catch (e) {
    console.error("Firebase init error:", e);
}

// --- UTILS & ALGORITHMS ---
const getDeviceId = () => {
    try {
        let id = localStorage.getItem("hm_device_id");
        if (!id) {
            id = "dev_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("hm_device_id", id);
        }
        return id;
    } catch (e) {
        return "dev_fallback_" + Math.random().toString(36).substr(2, 9);
    }
};

const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const VISUAL_GROUPS = [
    ["あ", "お", "め", "ぬ"], ["い", "り"], ["き", "さ", "ち"], ["け", "に", "は", "ほ"],
    ["わ", "れ", "ね"], ["る", "ろ", "そ"], ["た", "だ"], ["て", "で", "そ", "を"], ["こ", "ご"],
    ["ば", "ぱ", "は"], ["び", "ぴ", "ひ"], ["ぶ", "ぷ", "ふ"], ["べ", "ぺ", "へ"], ["ぼ", "ぽ", "ほ"],
    ["ア", "マ", "ヤ"], ["シ", "ツ", "ン", "ソ"], ["ウ", "ワ", "フ", "ヴ"], ["コ", "ユ"], ["チ", "テ"], ["ハ", "八"]
];

const recordCharStat = (char, isCorrect) => {
    try {
        const stats = JSON.parse(localStorage.getItem("hm_char_stats") || "{}");
        if (!stats[char]) stats[char] = {correct: 0, attempts: 0};
        stats[char].attempts += 1;
        if (isCorrect) stats[char].correct += 1;
        localStorage.setItem("hm_char_stats", JSON.stringify(stats));
    } catch (e) {
    }
};

const ROMAJI_ALTERNATIVES = {
    "shi": ["si"], "chi": ["ti"], "tsu": ["tu"], "fu": ["hu"],
    "ji": ["zi", "dji"], "zu": ["dzu"], "ja": ["zya"], "ju": ["zyu"], "jo": ["zyo"],
    "sha": ["sya"], "shu": ["syu"], "sho": ["syo"],
    "cha": ["tya", "cya"], "chu": ["tyu", "cyu"], "cho": ["tyo", "cyo"],
    "o": ["wo"]
};

const getValidRomaji = (romajiStr) => {
    const cleanRomaji = romajiStr.toLowerCase().replace(/[()]/g, "").trim();
    const validAnswers = cleanRomaji.split(" ").filter(r => r.length > 0);
    const expandedAnswers = [...validAnswers];

    validAnswers.forEach(ans => {
        if (ROMAJI_ALTERNATIVES[ans]) {
            expandedAnswers.push(...ROMAJI_ALTERNATIVES[ans]);
        }
    });
    return [...new Set(expandedAnswers)];
};

const checkTypedAnswer = (input, romajiStr) => {
    const expandedAnswers = getValidRomaji(romajiStr);
    return expandedAnswers.includes(input.trim().toLowerCase());
};

const PRINT_FONT = "\"ヒラギノ角ゴ Pro W3\", \"Hiragino Kaku Gothic Pro\", \"メイリオ\", Meiryo, Osaka, \"ＭＳ Ｐゴシック\", \"MS PGothic\", sans-serif";
const HANDWRITING_FONT = "\"Klee One\", \"Yuji Syuku\", \"Yu Mincho\", \"Hiragino Mincho Pro\", \"MS PMincho\", serif";

// --- ENHANCED AUDIO PLAYER ---
let currentUtterance = null;
if ("speechSynthesis" in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

const playAudio = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = "ja-JP";
    currentUtterance.rate = 0.75;
    currentUtterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const jpVoices = voices.filter(v => v.lang === "ja-JP" || v.lang === "ja_JP" || v.lang.includes("ja"));

    if (jpVoices.length > 0) {
        const preferredVoice =
            jpVoices.find(v => v.name.includes("Google 日本語") || v.name.includes("Google Japanese")) ||
            jpVoices.find(v => v.name.includes("Kyoko") || v.name.includes("Otoya")) ||
            jpVoices.find(v => v.name.includes("Ayumi") || v.name.includes("Haruka") || v.name.includes("Ichiro")) ||
            jpVoices[0];

        currentUtterance.voice = preferredVoice;
    }

    currentUtterance.onend = () => {
        currentUtterance = null;
    };
    currentUtterance.onerror = () => {
        currentUtterance = null;
    };
    window.speechSynthesis.speak(currentUtterance);
};

// --- FEATURE: KANJIVG STATIC STROKE GUIDE ENGINE ---
const svgCache = {};
const fetchKanaSvg = async (char) => {
    if (svgCache[char]) return svgCache[char];
    const hex = char.charCodeAt(0).toString(16).padStart(5, "0");
    try {
        const res = await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`);
        if (!res.ok) return null;
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "image/svg+xml");
        const paths = Array.from(doc.querySelectorAll("path")).map(p => p.getAttribute("d"));
        const texts = Array.from(doc.querySelectorAll("text")).map(t => ({
            text: t.textContent,
            transform: t.getAttribute("transform")
        }));
        const data = {paths, texts};
        svgCache[char] = data;
        return data;
    } catch (e) {
        return null;
    }
};

const KanaStrokeAnimation = ({
                                 charStr,
                                 activeFont,
                                 svgClassName = "w-12 h-12 md:w-24 md:h-24",
                                 strokeColor = "#1cb0f6"
                             }) => {
    const [svgData, setSvgData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            const chars = charStr.split("");
            const data = [];
            for (const c of chars) {
                const d = await fetchKanaSvg(c);
                data.push({char: c, data: d});
            }
            if (isMounted) {
                setSvgData(data);
                setLoading(false);
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [charStr]);

    if (loading) return <div className={`animate-pulse bg-gray-200 rounded-xl ${svgClassName}`}></div>;

    return (
        <div className="flex items-center justify-center w-full h-full gap-1">
            {svgData.map((item, idx) => (
                item.data ? (
                    <svg key={idx} viewBox="0 0 109 109" className={`${svgClassName} drop-shadow-sm`}>
                        <g fill="none" stroke="#e5e7eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            {item.data.paths.map((d, i) => <path key={`bg-${i}`} d={d}/>)}
                        </g>
                        <g fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round"
                           strokeLinejoin="round">
                            {item.data.paths.map((d, i) => (
                                <path key={`fg-${i}`} d={d}/>
                            ))}
                        </g>
                        <g fill="#ff9600" fontSize="8" fontWeight="bold">
                            {item.data.texts.map((t, i) => (
                                <text key={`txt-${i}`} transform={t.transform}>{t.text}</text>
                            ))}
                        </g>
                    </svg>
                ) : (
                    <span key={idx} className="text-3xl md:text-5xl font-medium text-gray-300"
                          style={{fontFamily: activeFont}}>{item.char}</span>
                )
            ))}
        </div>
    );
};

// --- DATASETS ---
const HIRAGANA_DATA = [
    {char: "あ", romaji: "a", group: "vowels"}, {char: "い", romaji: "i", group: "vowels"}, {
        char: "う",
        romaji: "u",
        group: "vowels"
    }, {char: "え", romaji: "e", group: "vowels"}, {char: "お", romaji: "o", group: "vowels"},
    {char: "か", romaji: "ka", group: "k-row"}, {char: "き", romaji: "ki", group: "k-row"}, {
        char: "く",
        romaji: "ku",
        group: "k-row"
    }, {char: "け", romaji: "ke", group: "k-row"}, {char: "こ", romaji: "ko", group: "k-row"},
    {char: "さ", romaji: "sa", group: "s-row"}, {char: "し", romaji: "shi", group: "s-row"}, {
        char: "す",
        romaji: "su",
        group: "s-row"
    }, {char: "せ", romaji: "se", group: "s-row"}, {char: "そ", romaji: "so", group: "s-row"},
    {char: "た", romaji: "ta", group: "t-row"}, {char: "ち", romaji: "chi", group: "t-row"}, {
        char: "つ",
        romaji: "tsu",
        group: "t-row"
    }, {char: "て", romaji: "te", group: "t-row"}, {char: "と", romaji: "to", group: "t-row"},
    {char: "な", romaji: "na", group: "n-row"}, {char: "に", romaji: "ni", group: "n-row"}, {
        char: "ぬ",
        romaji: "nu",
        group: "n-row"
    }, {char: "ね", romaji: "ne", group: "n-row"}, {char: "の", romaji: "no", group: "n-row"},
    {char: "は", romaji: "ha", group: "h-row"}, {char: "ひ", romaji: "hi", group: "h-row"}, {
        char: "ふ",
        romaji: "fu",
        group: "h-row"
    }, {char: "へ", romaji: "he", group: "h-row"}, {char: "ほ", romaji: "ho", group: "h-row"},
    {char: "ま", romaji: "ma", group: "m-row"}, {char: "み", romaji: "mi", group: "m-row"}, {
        char: "む",
        romaji: "mu",
        group: "m-row"
    }, {char: "め", romaji: "me", group: "m-row"}, {char: "も", romaji: "mo", group: "m-row"},
    {char: "や", romaji: "ya", group: "y-row"}, {char: "ゆ", romaji: "yu", group: "y-row"}, {
        char: "よ",
        romaji: "yo",
        group: "y-row"
    },
    {char: "ら", romaji: "ra", group: "r-row"}, {char: "り", romaji: "ri", group: "r-row"}, {
        char: "る",
        romaji: "ru",
        group: "r-row"
    }, {char: "れ", romaji: "re", group: "r-row"}, {char: "ろ", romaji: "ro", group: "r-row"},
    {char: "わ", romaji: "wa", group: "w-row"}, {char: "を", romaji: "wo", group: "w-row"}, {
        char: "ん",
        romaji: "n",
        group: "n-misc"
    },
    {char: "が", romaji: "ga", group: "dakuten"}, {char: "ぎ", romaji: "gi", group: "dakuten"}, {
        char: "ぐ",
        romaji: "gu",
        group: "dakuten"
    }, {char: "げ", romaji: "ge", group: "dakuten"}, {char: "ご", romaji: "go", group: "dakuten"},
    {char: "ざ", romaji: "za", group: "dakuten"}, {char: "じ", romaji: "ji", group: "dakuten"}, {
        char: "ず",
        romaji: "zu",
        group: "dakuten"
    }, {char: "ぜ", romaji: "ze", group: "dakuten"}, {char: "ぞ", romaji: "zo", group: "dakuten"},
    {char: "だ", romaji: "da", group: "dakuten"}, {char: "ぢ", romaji: "ji (dji)", group: "dakuten"}, {
        char: "づ",
        romaji: "zu (dzu)",
        group: "dakuten"
    }, {char: "で", romaji: "de", group: "dakuten"}, {char: "ど", romaji: "do", group: "dakuten"},
    {char: "ば", romaji: "ba", group: "dakuten"}, {char: "び", romaji: "bi", group: "dakuten"}, {
        char: "ぶ",
        romaji: "bu",
        group: "dakuten"
    }, {char: "べ", romaji: "be", group: "dakuten"}, {char: "ぼ", romaji: "bo", group: "dakuten"},
    {char: "ぱ", romaji: "pa", group: "handakuten"}, {char: "ぴ", romaji: "pi", group: "handakuten"}, {
        char: "ぷ",
        romaji: "pu",
        group: "handakuten"
    }, {char: "ぺ", romaji: "pe", group: "handakuten"}, {char: "ぽ", romaji: "po", group: "handakuten"},
    {char: "きゃ", romaji: "kya", group: "yōon"}, {char: "きゅ", romaji: "kyu", group: "yōon"}, {
        char: "きょ",
        romaji: "kyo",
        group: "yōon"
    },
    {char: "しゃ", romaji: "sha", group: "yōon"}, {char: "しゅ", romaji: "shu", group: "yōon"}, {
        char: "しょ",
        romaji: "sho",
        group: "yōon"
    },
    {char: "ちゃ", romaji: "cha", group: "yōon"}, {char: "ちゅ", romaji: "chu", group: "yōon"}, {
        char: "ちょ",
        romaji: "cho",
        group: "yōon"
    },
    {char: "にゃ", romaji: "nya", group: "yōon"}, {char: "にゅ", romaji: "nyu", group: "yōon"}, {
        char: "にょ",
        romaji: "nyo",
        group: "yōon"
    },
    {char: "ひゃ", romaji: "hya", group: "yōon"}, {char: "ひゅ", romaji: "hyu", group: "yōon"}, {
        char: "ひょ",
        romaji: "hyo",
        group: "yōon"
    },
    {char: "みゃ", romaji: "mya", group: "yōon"}, {char: "みゅ", romaji: "myu", group: "yōon"}, {
        char: "みょ",
        romaji: "myo",
        group: "yōon"
    },
    {char: "りゃ", romaji: "rya", group: "yōon"}, {char: "りゅ", romaji: "ryu", group: "yōon"}, {
        char: "りょ",
        romaji: "ryo",
        group: "yōon"
    },
    {char: "ぎゃ", romaji: "gya", group: "yōon-voiced"}, {
        char: "ぎゅ",
        romaji: "gyu",
        group: "yōon-voiced"
    }, {char: "ぎょ", romaji: "gyo", group: "yōon-voiced"},
    {char: "じゃ", romaji: "ja", group: "yōon-voiced"}, {
        char: "じゅ",
        romaji: "ju",
        group: "yōon-voiced"
    }, {char: "じょ", romaji: "jo", group: "yōon-voiced"},
    {char: "びゃ", romaji: "bya", group: "yōon-voiced"}, {
        char: "びゅ",
        romaji: "byu",
        group: "yōon-voiced"
    }, {char: "びょ", romaji: "byo", group: "yōon-voiced"},
    {char: "ぴゃ", romaji: "pya", group: "yōon-voiced"}, {
        char: "ぴゅ",
        romaji: "pyu",
        group: "yōon-voiced"
    }, {char: "ぴょ", romaji: "pyo", group: "yōon-voiced"}
];

const KATAKANA_DATA = [
    {char: "ア", romaji: "a", group: "vowels"}, {char: "イ", romaji: "i", group: "vowels"}, {
        char: "ウ",
        romaji: "u",
        group: "vowels"
    }, {char: "エ", romaji: "e", group: "vowels"}, {char: "オ", romaji: "o", group: "vowels"},
    {char: "カ", romaji: "ka", group: "k-row"}, {char: "キ", romaji: "ki", group: "k-row"}, {
        char: "ク",
        romaji: "ku",
        group: "k-row"
    }, {char: "ケ", romaji: "ke", group: "k-row"}, {char: "コ", romaji: "ko", group: "k-row"},
    {char: "サ", romaji: "sa", group: "s-row"}, {char: "シ", romaji: "shi", group: "s-row"}, {
        char: "ス",
        romaji: "su",
        group: "s-row"
    }, {char: "セ", romaji: "se", group: "s-row"}, {char: "ソ", romaji: "so", group: "s-row"},
    {char: "タ", romaji: "ta", group: "t-row"}, {char: "チ", romaji: "chi", group: "t-row"}, {
        char: "ツ",
        romaji: "tsu",
        group: "t-row"
    }, {char: "テ", romaji: "te", group: "t-row"}, {char: "ト", romaji: "to", group: "t-row"},
    {char: "ナ", romaji: "na", group: "n-row"}, {char: "ニ", romaji: "ni", group: "n-row"}, {
        char: "ヌ",
        romaji: "nu",
        group: "n-row"
    }, {char: "ネ", romaji: "ne", group: "n-row"}, {char: "ノ", romaji: "no", group: "n-row"},
    {char: "ハ", romaji: "ha", group: "h-row"}, {char: "ヒ", romaji: "hi", group: "h-row"}, {
        char: "フ",
        romaji: "fu",
        group: "h-row"
    }, {char: "ヘ", romaji: "he", group: "h-row"}, {char: "ホ", romaji: "ho", group: "h-row"},
    {char: "マ", romaji: "ma", group: "m-row"}, {char: "ミ", romaji: "mi", group: "m-row"}, {
        char: "ム",
        romaji: "mu",
        group: "m-row"
    }, {char: "メ", romaji: "me", group: "m-row"}, {char: "モ", romaji: "mo", group: "m-row"},
    {char: "ヤ", romaji: "ya", group: "y-row"}, {char: "ユ", romaji: "yu", group: "y-row"}, {
        char: "ヨ",
        romaji: "yo",
        group: "y-row"
    },
    {char: "ラ", romaji: "ra", group: "r-row"}, {char: "リ", romaji: "ri", group: "r-row"}, {
        char: "ル",
        romaji: "ru",
        group: "r-row"
    }, {char: "レ", romaji: "re", group: "r-row"}, {char: "ロ", romaji: "ro", group: "r-row"},
    {char: "ワ", romaji: "wa", group: "w-row"}, {char: "ヲ", romaji: "wo", group: "w-row"}, {
        char: "ン",
        romaji: "n",
        group: "n-misc"
    },
    {char: "ガ", romaji: "ga", group: "dakuten"}, {char: "ギ", romaji: "gi", group: "dakuten"}, {
        char: "グ",
        romaji: "gu",
        group: "dakuten"
    }, {char: "ゲ", romaji: "ge", group: "dakuten"}, {char: "ゴ", romaji: "go", group: "dakuten"},
    {char: "ザ", romaji: "za", group: "dakuten"}, {char: "ジ", romaji: "ji", group: "dakuten"}, {
        char: "ズ",
        romaji: "zu",
        group: "dakuten"
    }, {char: "ゼ", romaji: "ze", group: "dakuten"}, {char: "ゾ", romaji: "zo", group: "dakuten"},
    {char: "ダ", romaji: "da", group: "dakuten"}, {char: "ヂ", romaji: "ji (dji)", group: "dakuten"}, {
        char: "ヅ",
        romaji: "zu (dzu)",
        group: "dakuten"
    }, {char: "デ", romaji: "de", group: "dakuten"}, {char: "ド", romaji: "do", group: "dakuten"},
    {char: "バ", romaji: "ba", group: "dakuten"}, {char: "ビ", romaji: "bi", group: "dakuten"}, {
        char: "ブ",
        romaji: "bu",
        group: "dakuten"
    }, {char: "ベ", romaji: "be", group: "dakuten"}, {char: "ボ", romaji: "bo", group: "dakuten"},
    {char: "パ", romaji: "pa", group: "handakuten"}, {char: "ピ", romaji: "pi", group: "handakuten"}, {
        char: "プ",
        romaji: "pu",
        group: "handakuten"
    }, {char: "ペ", romaji: "pe", group: "handakuten"}, {char: "ポ", romaji: "po", group: "handakuten"},
    {char: "キャ", romaji: "kya", group: "yōon"}, {char: "キュ", romaji: "kyu", group: "yōon"}, {
        char: "キョ",
        romaji: "kyo",
        group: "yōon"
    },
    {char: "シャ", romaji: "sha", group: "yōon"}, {char: "シュ", romaji: "shu", group: "yōon"}, {
        char: "ショ",
        romaji: "sho",
        group: "yōon"
    },
    {char: "チャ", romaji: "cha", group: "yōon"}, {char: "チュ", romaji: "chu", group: "yōon"}, {
        char: "チョ",
        romaji: "cho",
        group: "yōon"
    },
    {char: "ニャ", romaji: "nya", group: "yōon"}, {char: "ニュ", romaji: "nyu", group: "yōon"}, {
        char: "ニョ",
        romaji: "nyo",
        group: "yōon"
    },
    {char: "ヒャ", romaji: "hya", group: "yōon"}, {char: "ヒュ", romaji: "hyu", group: "yōon"}, {
        char: "ヒョ",
        romaji: "hyo",
        group: "yōon"
    },
    {char: "ミャ", romaji: "mya", group: "yōon"}, {char: "ミュ", romaji: "myu", group: "yōon"}, {
        char: "ミョ",
        romaji: "myo",
        group: "yōon"
    },
    {char: "リャ", romaji: "rya", group: "yōon"}, {char: "リュ", romaji: "ryu", group: "yōon"}, {
        char: "リョ",
        romaji: "ryo",
        group: "yōon"
    },
    {char: "ギャ", romaji: "gya", group: "yōon-voiced"}, {
        char: "ギュ",
        romaji: "gyu",
        group: "yōon-voiced"
    }, {char: "ギョ", romaji: "gyo", group: "yōon-voiced"},
    {char: "ジャ", romaji: "ja", group: "yōon-voiced"}, {
        char: "ジュ",
        romaji: "ju",
        group: "yōon-voiced"
    }, {char: "ジョ", romaji: "jo", group: "yōon-voiced"},
    {char: "ビャ", romaji: "bya", group: "yōon-voiced"}, {
        char: "ビュ",
        romaji: "byu",
        group: "yōon-voiced"
    }, {char: "ビョ", romaji: "byo", group: "yōon-voiced"},
    {char: "ピャ", romaji: "pya", group: "yōon-voiced"}, {
        char: "ピュ",
        romaji: "pyu",
        group: "yōon-voiced"
    }, {char: "ピョ", romaji: "pyo", group: "yōon-voiced"},

    // Extended Foreign Sounds (Katakana Only)
    {char: "ヴァ", romaji: "va", group: "extended"}, {char: "ヴィ", romaji: "vi", group: "extended"}, {
        char: "ヴ",
        romaji: "vu",
        group: "extended"
    }, {char: "ヴェ", romaji: "ve", group: "extended"}, {char: "ヴォ", romaji: "vo", group: "extended"},
    {char: "ファ", romaji: "fa", group: "extended"}, {char: "フィ", romaji: "fi", group: "extended"}, {
        char: "フェ",
        romaji: "fe",
        group: "extended"
    }, {char: "フォ", romaji: "fo", group: "extended"},
    {char: "ウィ", romaji: "wi", group: "extended"}, {char: "ウェ", romaji: "we", group: "extended"}, {
        char: "ウォ",
        romaji: "wo",
        group: "extended"
    },
    {char: "ティ", romaji: "ti", group: "extended"}, {char: "ディ", romaji: "di", group: "extended"}, {
        char: "トゥ",
        romaji: "tu",
        group: "extended"
    }, {char: "ドゥ", romaji: "du", group: "extended"},
    {char: "ツァ", romaji: "tsa", group: "extended"}, {char: "ツィ", romaji: "tsi", group: "extended"}, {
        char: "ツェ",
        romaji: "tse",
        group: "extended"
    }, {char: "ツォ", romaji: "tso", group: "extended"},
    {char: "シェ", romaji: "she", group: "extended"}, {char: "ジェ", romaji: "je", group: "extended"}, {
        char: "チェ",
        romaji: "che",
        group: "extended"
    },
    {char: "ヴュ", romaji: "vyu", group: "extended-yōon"}, {
        char: "フュ",
        romaji: "fyu",
        group: "extended-yōon"
    }, {char: "テュ", romaji: "tyu", group: "extended-yōon"}, {char: "デュ", romaji: "dyu", group: "extended-yōon"}
];

// --- COMPONENTS ---

const Button = ({
                    children,
                    onClick,
                    variant = "primary",
                    className = "",
                    icon: Icon,
                    disabled,
                    alphabet = "hiragana"
                }) => {
    const baseStyle = "flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-[1rem] md:rounded-2xl font-extrabold transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const isH = alphabet === "hiragana";
    const isBoth = alphabet === "both";

    const primaryBg = isBoth ? "bg-[#ce82ff]" : isH ? "bg-[#58cc02]" : "bg-[#1cb0f6]";
    const primaryBorderB = isBoth ? "border-[#b65ce8]" : isH ? "border-[#58a700]" : "border-[#1899d6]";
    const primaryHover = isBoth ? "hover:bg-[#b65ce8]" : isH ? "hover:bg-[#46a302]" : "hover:bg-[#149fdf]";
    const secondaryText = isBoth ? "text-[#ce82ff]" : isH ? "text-[#1cb0f6]" : "text-[#00d1e0]";

    const variants = {
        primary: `${primaryBg} text-white border-b-4 ${primaryBorderB} ${primaryHover} hover:-translate-y-1 hover:shadow-lg active:border-b-0 active:translate-y-[4px]`,
        secondary: `bg-white ${secondaryText} border-2 border-b-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 hover:shadow-md active:border-b-2 active:translate-y-[2px]`,
        outline: "bg-transparent text-gray-500 border-2 border-b-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 hover:shadow-md active:border-b-2 active:translate-y-[2px]",
        ghost: "text-gray-500 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200 rounded-xl"
    };

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {Icon && <Icon size={20} strokeWidth={2.5}/>}
            {children}
        </button>
    );
};

const DrawingCanvas = ({char, activeFont, showGuide = true, stepKey = 1, alphabet}) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const strokeColor = alphabet === "both" ? "#ce82ff" : alphabet === "hiragana" ? "#58cc02" : "#1cb0f6";

    const getCoordinates = (canvas, e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        return {x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY};
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const {x, y} = getCoordinates(canvas, e);
        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const {x, y} = getCoordinates(canvas, e);
        const ctx = canvas.getContext("2d");
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#3c3c3c";
        ctx.lineWidth = 32;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const stopDrawing = () => setIsDrawing(false);
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    useEffect(() => clearCanvas(), [char, stepKey]);

    return (
        <div
            className="relative w-full max-w-[200px] md:max-w-[280px] aspect-square mx-auto bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center shrink-0">
            {showGuide && (
                <div className="absolute inset-0 pointer-events-none opacity-25 flex items-center justify-center">
                    <KanaStrokeAnimation charStr={char} activeFont={activeFont} svgClassName="w-[80%] h-[80%]"
                                         strokeColor={strokeColor}/>
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="w-full h-full touch-none cursor-crosshair relative z-10"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
            />
            <button onClick={clearCanvas}
                    className="absolute bottom-2 right-2 md:bottom-3 md:right-3 z-20 p-2 bg-white rounded-lg md:rounded-xl shadow-md border border-gray-100 hover:bg-gray-50 text-gray-500 active:scale-95 transition-transform">
                <RotateCcw size={16} strokeWidth={2.5} className="md:w-5 md:h-5"/>
            </button>
        </div>
    );
};

// --- SCREENS ---

const MainMenu = ({
                      onSelectMode,
                      bestScores,
                      activeFont,
                      onToggleFont,
                      isHandwriting,
                      learnedCount,
                      alphabet,
                      setAlphabet,
                      globalAutoPlay,
                      setGlobalAutoPlay,
                      onResetProgress,
                      currentDataSet
                  }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const totalChars = currentDataSet.length;
    const progressPct = Math.min(Math.round((learnedCount / totalChars) * 100), 100);
    const isBeginner = progressPct < 80;

    const isH = alphabet === "hiragana";
    const isBoth = alphabet === "both";

    const primaryBg = isBoth ? "bg-[#ce82ff]" : isH ? "bg-[#58cc02]" : "bg-[#1cb0f6]";
    const primaryBorderB = isBoth ? "border-[#b65ce8]" : isH ? "border-[#58a700]" : "border-[#1899d6]";
    const primaryHover = isBoth ? "hover:bg-[#b65ce8]" : isH ? "hover:bg-[#46a302]" : "hover:bg-[#149fdf]";
    const primaryText = isBoth ? "text-[#ce82ff]" : isH ? "text-[#58cc02]" : "text-[#1cb0f6]";
    const primaryBgLight = isBoth ? "bg-[#ce82ff]/10" : isH ? "bg-[#58cc02]/10" : "bg-[#1cb0f6]/10";

    const SettingsDropdown = () => (
        <div
            className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-gray-200 rounded-[1rem] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div
                className="px-3 py-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">Audio
                Preferences
            </div>
            <button onClick={() => {
                setGlobalAutoPlay(!globalAutoPlay);
                setShowSettings(false);
            }}
                    className="w-full text-left px-3 py-3 text-sm font-bold text-[#3c3c3c] hover:bg-gray-50 rounded-xl flex items-center justify-between transition-colors">
                <span className="flex items-center gap-2"><Volume2 size={16} className="text-gray-500"/> Autoplay Audio</span>
                <div
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${globalAutoPlay ? primaryBg : "bg-gray-200"}`}>
                    <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${globalAutoPlay ? "translate-x-4" : "translate-x-0"}`}/>
                </div>
            </button>

            <div
                className="px-3 py-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 mt-2 mb-1">Display
                Preferences
            </div>
            <button onClick={() => {
                onToggleFont();
                setShowSettings(false);
            }}
                    className="w-full text-left px-3 py-3 text-sm font-bold text-[#3c3c3c] hover:bg-gray-50 rounded-xl flex items-center justify-between transition-colors">
                <span className="flex items-center gap-2"><Type size={16}
                                                                className="text-gray-500"/> Handwriting Font</span>
                <div
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${isHandwriting ? primaryBg : "bg-gray-200"}`}>
                    <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${isHandwriting ? "translate-x-4" : "translate-x-0"}`}/>
                </div>
            </button>

            <div
                className="px-3 py-2 text-xs font-black text-red-500 uppercase tracking-wider border-b border-gray-100 mt-2 mb-1">Danger
                Zone
            </div>
            {!showConfirmReset ? (
                <button onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirmReset(true);
                }}
                        className="w-full text-left px-3 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2">
                    <Trash2 size={16}/> Reset Progress
                </button>
            ) : (
                <div
                    className="px-3 py-2 flex flex-col gap-2 animate-in zoom-in duration-200 bg-red-50 rounded-xl mt-1 border border-red-100">
                    <span className="text-xs font-bold text-red-600">Are you sure? This cannot be undone.</span>
                    <div className="flex gap-2">
                        <button onClick={() => {
                            onResetProgress();
                            setShowSettings(false);
                            setShowConfirmReset(false);
                        }}
                                className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors">Wipe
                            it
                        </button>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmReset(false);
                        }}
                                className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50">Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const LearnActionCard = ({primary}) => (
        <button
            onClick={() => onSelectMode("learn")}
            className={`w-full h-full flex items-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none shadow-sm group hover:-translate-y-1 hover:shadow-lg active:translate-y-[2px] active:scale-[0.99] ${primary ? `${primaryBg} text-white border-b-4 ${primaryBorderB} ${primaryHover} active:border-b-0` : `bg-white ${primaryText} border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2`}`}
        >
            <div
                className={`${primary ? "bg-white/20" : primaryBgLight} p-3 md:p-4 rounded-xl md:rounded-2xl mr-4 group-hover:scale-110 transition-transform`}>
                <Play size={28} strokeWidth={2.5} fill="currentColor" className="md:w-8 md:h-8"/>
            </div>
            <div className="text-left flex-1 flex flex-col justify-center">
                <div className="text-xl md:text-2xl text-[#3c3c3c] group-hover:text-black"
                     style={primary ? {color: "white"} : {}}>Learn Characters
                </div>
                <div className="w-full bg-black/10 rounded-full h-1.5 md:h-2 my-2 md:my-3 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${primary ? "bg-white" : primaryBg}`}
                        style={{width: `${progressPct}%`}}/>
                </div>
                <div className={`text-[10px] md:text-xs font-bold ${primary ? "text-white/80" : "text-gray-500"}`}>
                    {learnedCount} / {totalChars} Mastered
                </div>
            </div>
            <ChevronRight size={28} strokeWidth={3}
                          className={`ml-2 opacity-50 md:w-8 md:h-8 flex-shrink-0 ${primary ? "text-white" : "text-gray-500"}`}/>
        </button>
    );

    const QuizActionCard = ({primary}) => (
        <button
            onClick={() => onSelectMode("quiz")}
            className={`w-full h-full flex ${primary ? "flex-row items-center text-left" : "flex-col items-center justify-center text-center"} p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none shadow-sm group hover:-translate-y-1 hover:shadow-lg active:translate-y-[2px] active:scale-[0.99] ${primary ? "bg-[#ce82ff] text-white border-b-4 border-[#b65ce8] hover:bg-[#b65ce8] active:border-b-0" : "bg-white text-[#ce82ff] border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2"}`}
        >
            <div
                className={`${primary ? "bg-white/20 mr-4" : "bg-[#ce82ff]/10 mb-3 md:mb-4"} p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform flex items-center justify-center`}>
                <Brain size={primary ? 28 : 32} strokeWidth={2.5} className="md:w-10 md:h-10"/>
            </div>
            <div className={`flex flex-col justify-center ${primary ? "flex-1" : ""}`}>
                <span
                    className={`text-lg md:text-2xl ${primary ? "text-white" : "text-[#3c3c3c] group-hover:text-black"}`}>Recall Quiz</span>
                {primary && <div className="text-[10px] md:text-xs font-bold text-white/80 mt-1 md:mt-2">Daily review
                    ready!</div>}
            </div>
            {primary && <ChevronRight size={28} strokeWidth={3}
                                      className="ml-2 opacity-50 text-white md:w-8 md:h-8 flex-shrink-0"/>}
        </button>
    );

    return (
        <div
            className="flex flex-col h-full w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 md:pt-8 pb-6 overflow-y-auto hide-scrollbar px-3 md:px-6 relative">

            {/* Top Nav: Alphabet Switcher */}
            <div
                className="w-full flex bg-gray-200/70 p-1.5 md:p-2 rounded-2xl md:rounded-3xl mb-6 shadow-inner max-w-md mx-auto">
                <button onClick={() => setAlphabet("hiragana")}
                        className={`flex-1 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-black text-sm md:text-base transition-all duration-300 ${alphabet === "hiragana" ? "bg-white text-[#58cc02] shadow-sm" : "text-gray-400 hover:text-gray-500"}`}>Hiragana
                </button>
                <button onClick={() => setAlphabet("katakana")}
                        className={`flex-1 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-black text-sm md:text-base transition-all duration-300 ${alphabet === "katakana" ? "bg-white text-[#1cb0f6] shadow-sm" : "text-gray-400 hover:text-gray-500"}`}>Katakana
                </button>
                <button onClick={() => setAlphabet("both")}
                        className={`flex-1 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-black text-sm md:text-base transition-all duration-300 ${alphabet === "both" ? "bg-white text-[#ce82ff] shadow-sm" : "text-gray-400 hover:text-gray-500"}`}>Both
                </button>
            </div>

            <div className="w-full flex justify-between items-center mb-6 md:mb-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div
                        className={`w-12 h-12 md:w-16 md:h-16 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-medium ${isBoth ? "text-xl md:text-2xl font-black px-1 leading-tight text-center" : "text-3xl md:text-4xl"} shadow-sm border-b-4 transform -rotate-6 transition-colors duration-500 ${primaryBg} ${primaryBorderB}`}
                        style={{fontFamily: activeFont}}>
                        {isBoth ? "あ/ア" : (isH ? "あ" : "ア")}
                    </div>
                    <div>
                        <h1 className="font-extrabold text-[#3c3c3c] text-xl md:text-3xl leading-tight">Kana Master</h1>
                        <p className="text-xs md:text-sm font-bold text-[#afafaf]">Level: <span
                            className={primaryText}>{isBeginner ? "Novice" : "Scholar"}</span></p>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 md:p-3 border-2 rounded-xl md:rounded-2xl transition-all duration-200 hover:shadow-md active:scale-95 ${showSettings ? "bg-gray-100 border-gray-300 text-gray-800" : "bg-white border-gray-200 text-gray-500 hover:text-gray-700"}`}
                        title="Settings"
                    >
                        <Settings size={20} strokeWidth={2.5} className="md:w-6 md:h-6"/>
                    </button>
                    {showSettings && <SettingsDropdown/>}
                </div>
            </div>

            <div className="w-full flex flex-col gap-8 md:gap-10 pb-6">

                <div className="flex flex-col gap-3 md:gap-4">
                    <h2 className="text-xs md:text-sm font-black text-gray-600 uppercase tracking-widest pl-2">Up Next
                        For You</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                        <div className="md:col-span-2">
                            {isBeginner ? <LearnActionCard primary/> : <QuizActionCard primary/>}
                        </div>
                        <div className="md:col-span-1">
                            {isBeginner ? <QuizActionCard primary={false}/> : <LearnActionCard primary={false}/>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:gap-4">
                    <h2 className="text-xs md:text-sm font-black text-gray-600 uppercase tracking-widest pl-2">Practice
                        & Challenges</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">

                        <button
                            onClick={() => onSelectMode("practice")}
                            className="w-full h-full bg-white text-[#00d1e0] border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2 active:translate-y-[2px] flex flex-col items-center justify-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none shadow-sm group hover:-translate-y-1 hover:shadow-md"
                        >
                            <div
                                className="bg-[#00d1e0]/10 p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform mb-3 md:mb-4 flex items-center justify-center">
                                <PenTool size={28} strokeWidth={2.5} className="md:w-8 md:h-8"/>
                            </div>
                            <span className="text-sm md:text-lg text-[#3c3c3c] group-hover:text-black">Writing</span>
                        </button>

                        <button
                            onClick={() => onSelectMode("survival")}
                            className="w-full h-full bg-white text-[#ff9600] border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2 active:translate-y-[2px] flex flex-col items-center justify-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none group shadow-sm relative hover:-translate-y-1 hover:shadow-md"
                        >
                            <div
                                className="bg-[#ff9600]/10 p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform mb-3 md:mb-4 flex items-center justify-center">
                                <Flame size={28} strokeWidth={2.5} className="md:w-8 md:h-8"/>
                            </div>
                            <span className="text-sm md:text-lg text-[#3c3c3c] group-hover:text-black">Survival</span>
                            {(bestScores && bestScores[`infinity_${alphabet}`] > 0) ? (
                                <span
                                    className="absolute top-3 right-3 bg-[#ff9600] text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">Inf: {bestScores[`infinity_${alphabet}`]}</span>
                            ) : null}
                        </button>

                        <button
                            onClick={() => onSelectMode("chart")}
                            className="w-full h-full bg-white text-slate-500 border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2 active:translate-y-[2px] flex flex-col items-center justify-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none group shadow-sm col-span-2 md:col-span-1 hover:-translate-y-1 hover:shadow-md hover:text-slate-700"
                        >
                            <div
                                className="bg-slate-100 p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform text-slate-500 group-hover:text-slate-700 mb-3 md:mb-4 flex items-center justify-center">
                                <BarChart2 size={28} strokeWidth={2.5} className="md:w-8 md:h-8"/>
                            </div>
                            <span
                                className="text-sm md:text-lg text-[#3c3c3c] group-hover:text-black">Reference Chart</span>
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
};

const LearnScreen = ({onBack, activeFont, onCharLearned, currentDataSet, alphabet, globalAutoPlay}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRandomMode, setIsRandomMode] = useState(false);
    const char = currentDataSet[currentIndex];

    useEffect(() => {
        setCurrentIndex(0);
    }, [alphabet]);

    useEffect(() => {
        if (globalAutoPlay && char) {
            playAudio(char.char);
        }
    }, [currentIndex, char, globalAutoPlay]);

    const getNextRandomIndex = () => {
        let nextIdx = Math.floor(Math.random() * currentDataSet.length);
        while (nextIdx === currentIndex && currentDataSet.length > 1) {
            nextIdx = Math.floor(Math.random() * currentDataSet.length);
        }
        return nextIdx;
    };

    const handleNext = () => {
        onCharLearned(char.char);
        if (isRandomMode) {
            setCurrentIndex(getNextRandomIndex());
        } else {
            setCurrentIndex((prev) => (prev + 1) % currentDataSet.length);
        }
    };

    const handlePrev = () => {
        if (isRandomMode) {
            setCurrentIndex(getNextRandomIndex());
        } else {
            setCurrentIndex((prev) => (prev - 1 + currentDataSet.length) % currentDataSet.length);
        }
    };

    if (!char) return null;

    const isBoth = alphabet === "both";
    const isH = alphabet === "hiragana";
    const primaryText = isBoth ? "text-[#ce82ff]" : isH ? "text-[#58cc02]" : "text-[#1cb0f6]";
    const primaryBg = isBoth ? "bg-[#ce82ff]" : isH ? "bg-[#58cc02]" : "bg-[#1cb0f6]";
    const primaryBorder = isBoth ? "border-[#ce82ff]" : isH ? "border-[#58cc02]" : "border-[#1cb0f6]";
    const primaryLightBg = isBoth ? "bg-[#faeaff]" : isH ? "bg-[#e5f7d8]" : "bg-[#e5f5ff]";

    return (
        <div
            className="flex flex-col h-full items-center py-2 sm:py-4 max-w-3xl mx-auto w-full overflow-y-auto hide-scrollbar animate-in fade-in duration-300">

            {/* Top Navigation & Progress */}
            <div className="w-full flex items-center justify-between gap-2 sm:gap-4 mb-2 md:mb-8 px-4 shrink-0">
                <Button variant="ghost" onClick={onBack} icon={ArrowLeft} className="px-2 md:px-3 py-1.5 md:py-2"/>

                <div className="flex-1 hidden sm:block h-2.5 md:h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ease-out ${primaryBg}`}
                         style={{width: `${((currentIndex + 1) / currentDataSet.length) * 100}%`}}></div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <div
                        className={`text-[10px] md:text-sm font-black flex items-center gap-1 shrink-0 ${primaryText}`}>
                        {currentIndex + 1} / {currentDataSet.length}
                    </div>
                    <button
                        onClick={() => setIsRandomMode(!isRandomMode)}
                        className={`flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 border-2 shrink-0 ${
                            isRandomMode ? `${primaryLightBg} ${primaryBorder} ${primaryText} shadow-sm` : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        <Shuffle size={14} strokeWidth={isRandomMode ? 3 : 2}/>
                        <span className="hidden sm:inline">{isRandomMode ? "Random" : "Sequential"}</span>
                    </button>
                </div>
            </div>

            <div className="w-full px-4 sm:hidden mb-4 shrink-0">
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden w-full">
                    <div className={`h-full rounded-full transition-all duration-500 ease-out ${primaryBg}`}
                         style={{width: `${((currentIndex + 1) / currentDataSet.length) * 100}%`}}></div>
                </div>
            </div>

            {/* Main Flashcard */}
            <div className="flex-1 flex flex-col items-center justify-center w-full px-4 my-auto shrink-0">
                <div
                    className="w-full max-w-sm md:max-w-lg bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 border-b-8 border-gray-200 shadow-sm flex flex-col items-center relative transition-transform">

                    {/* Group Label */}
                    <span
                        className="absolute top-4 md:top-6 left-4 md:left-6 text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-widest">{char.group}</span>

                    {/* Audio Button */}
                    <button onClick={() => playAudio(char.char)}
                            className={`absolute top-4 md:top-6 right-4 md:right-6 p-2 md:p-3 bg-gray-50 rounded-full border-2 border-gray-100 hover:bg-gray-100 active:scale-95 transition-transform ${primaryText}`}>
                        <Volume2 size={20} strokeWidth={2.5} className="w-5 h-5 md:w-6 md:h-6"/>
                    </button>

                    {/* Character / Stroke Animation */}
                    <div
                        className="flex items-center justify-center min-h-[140px] md:min-h-[220px] mt-8 md:mt-12 mb-4 md:mb-6 w-full">
                        {char.char.length > 1 ? (
                            <span
                                className="text-[5rem] md:text-[8rem] font-medium text-[#3c3c3c] leading-none select-none drop-shadow-sm"
                                style={{fontFamily: activeFont}}>{char.char}</span>
                        ) : (
                            <div className="w-32 h-32 md:w-48 md:h-48">
                                <KanaStrokeAnimation charStr={char.char} activeFont={activeFont}
                                                     svgClassName="w-full h-full drop-shadow-sm"
                                                     strokeColor={isBoth ? "#ce82ff" : isH ? "#58cc02" : "#1cb0f6"}/>
                            </div>
                        )}
                    </div>

                    {/* Romaji Details */}
                    <div className="text-center w-full border-t-2 border-gray-100 pt-4 md:pt-6">
                        <p className="text-[#afafaf] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-1">Romaji</p>
                        <p className="text-4xl md:text-6xl font-black text-[#3c3c3c] uppercase tracking-wider">{char.romaji}</p>
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div
                className="w-full max-w-sm md:max-w-lg flex justify-between mt-6 md:mt-8 gap-3 md:gap-4 px-4 sm:px-0 shrink-0">
                <Button variant="outline" onClick={handlePrev}
                        className="flex-1 py-3.5 md:py-5 text-base md:text-xl">Prev</Button>
                <Button alphabet={alphabet} onClick={handleNext}
                        className="flex-1 py-3.5 md:py-5 text-base md:text-xl">Next <ChevronRight size={24}
                                                                                                  strokeWidth={3}/></Button>
            </div>

        </div>
    );
};

const PracticeScreen = ({onBack, activeFont, currentDataSet, alphabet}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRandomMode, setIsRandomMode] = useState(false);
    const [practiceMode, setPracticeMode] = useState(1);

    const char = currentDataSet[currentIndex];
    useEffect(() => {
        setCurrentIndex(0);
    }, [alphabet]);

    useEffect(() => {
        if (practiceMode === 3 && char) playAudio(char.char);
    }, [currentIndex, practiceMode, char?.char]);

    const getNextRandomIndex = () => {
        let nextIdx = Math.floor(Math.random() * currentDataSet.length);
        while (nextIdx === currentIndex && currentDataSet.length > 1) nextIdx = Math.floor(Math.random() * currentDataSet.length);
        return nextIdx;
    };

    const handleNext = () => {
        if (isRandomMode) setCurrentIndex(getNextRandomIndex());
        else setCurrentIndex((prev) => (prev + 1) % currentDataSet.length);
    };

    const handlePrev = () => {
        if (isRandomMode) setCurrentIndex(getNextRandomIndex());
        else setCurrentIndex((prev) => (prev - 1 + currentDataSet.length) % currentDataSet.length);
    };

    const togglePracticeMode = () => setPracticeMode(prev => prev >= 3 ? 1 : prev + 1);

    if (!char) return null;

    let instructionText = "Step 1: Trace the character";
    if (practiceMode === 2) instructionText = "Step 2: Draw with reference";
    if (practiceMode === 3) instructionText = "Step 3: Draw from memory";

    const isBoth = alphabet === "both";
    const isH = alphabet === "hiragana";
    const primaryText = isBoth ? "text-[#ce82ff]" : isH ? "text-[#58cc02]" : "text-[#1cb0f6]";
    const primaryBorder = isBoth ? "border-[#ce82ff]" : isH ? "border-[#58cc02]" : "border-[#1cb0f6]";
    const primaryLightBg = isBoth ? "bg-[#faeaff]" : isH ? "bg-[#e5f7d8]" : "bg-[#e5f5ff]";
    const strokeColor = isBoth ? "#ce82ff" : isH ? "#58cc02" : "#1cb0f6";

    return (
        <div className="flex flex-col h-full items-center justify-between py-2 sm:py-4 overflow-y-auto hide-scrollbar">
            <div className="w-full max-w-3xl flex justify-between items-center mb-2 md:mb-4 shrink-0 px-2 sm:px-0">
                <Button variant="ghost" onClick={onBack} icon={ArrowLeft} className="px-2 md:px-3 py-1.5 md:py-2"/>
                <span
                    className="text-[10px] md:text-xs font-black text-[#afafaf] tracking-widest uppercase truncate px-2">
          Draw: {practiceMode === 3 ? "???" : char.romaji}
        </span>

                <div className="flex items-center gap-1 md:gap-2">
                    <button
                        onClick={togglePracticeMode}
                        className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 border-2 shrink-0 bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    >
                        {practiceMode === 1 && <PenTool size={14} strokeWidth={2.5}/>}
                        {practiceMode === 2 && <Eye size={14} strokeWidth={2.5}/>}
                        {practiceMode === 3 && <Brain size={14} strokeWidth={2.5}/>}
                        <span className="hidden sm:inline">
              {practiceMode === 1 ? "Mode: Trace" : practiceMode === 2 ? "Mode: Copy" : "Mode: Recall"}
            </span>
                    </button>

                    <button
                        onClick={() => setIsRandomMode(!isRandomMode)}
                        className={`flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 border-2 shrink-0 ${
                            isRandomMode ? `${primaryLightBg} ${primaryText} ${primaryBorder} shadow-sm` : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        <Shuffle size={14} strokeWidth={isRandomMode ? 3 : 2}/>
                        <span className="hidden sm:inline">{isRandomMode ? "Random" : "Sequential"}</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full px-2 my-auto">
                <div
                    className="flex gap-3 md:gap-8 items-center flex-col md:flex-row w-full max-w-sm md:max-w-3xl justify-center bg-white p-3 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-b-8 border-gray-200 shadow-sm shrink-0">

                    <div
                        className="flex flex-row md:flex-col items-center gap-3 md:gap-4 w-full md:w-auto bg-gray-50 rounded-xl md:rounded-[1.5rem] p-2 md:p-4 shrink-0 md:h-[260px] md:justify-center relative">
                        <span
                            className="text-[#afafaf] text-[10px] md:text-sm font-bold hidden md:block">Reference</span>

                        {practiceMode === 3 ? (
                            <div
                                className="w-16 h-16 md:w-32 md:h-32 bg-white rounded-lg md:rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-300 shadow-sm shrink-0">
                                <span className="text-3xl md:text-5xl font-black">?</span>
                            </div>
                        ) : (
                            <div
                                className="w-16 h-16 md:w-32 md:h-32 bg-white rounded-lg md:rounded-2xl border-2 border-gray-100 flex items-center justify-center shadow-sm shrink-0">
                                <KanaStrokeAnimation charStr={char.char} activeFont={activeFont}
                                                     svgClassName="w-[80%] h-[80%]" strokeColor={strokeColor}/>
                            </div>
                        )}

                        <button onClick={() => playAudio(char.char)}
                                className={`ml-auto md:ml-0 p-2 md:p-3 bg-white ${primaryText} rounded-full border-2 border-gray-100 hover:bg-gray-50 active:scale-95 transition-transform hover:scale-105`}>
                            <Volume2 size={18} strokeWidth={2.5} className="md:w-6 md:h-6"/>
                        </button>
                    </div>

                    <div className="flex flex-col items-center w-full md:w-auto">
                        <span
                            className="text-gray-500 font-bold mb-2 md:mb-3 text-xs md:text-sm">{instructionText}</span>
                        <DrawingCanvas char={char.char} activeFont={activeFont} showGuide={practiceMode === 1}
                                       stepKey={practiceMode} alphabet={alphabet}/>
                    </div>

                </div>
            </div>

            <div
                className="w-full max-w-sm md:max-w-3xl flex justify-between mt-4 md:mt-6 gap-2 md:gap-4 px-2 sm:px-0 shrink-0">
                <Button variant="outline" onClick={handlePrev}
                        className="flex-1 py-2.5 md:py-4 text-sm md:text-lg">Prev</Button>
                <Button alphabet={alphabet} onClick={handleNext}
                        className="flex-1 py-2.5 md:py-4 text-sm md:text-lg">Next <ChevronRight size={20}
                                                                                                strokeWidth={3}/></Button>
            </div>
        </div>
    );
};

const QuizScreen = ({onBack, activeFont, currentDataSet, alphabet}) => {
    const [phase, setPhase] = useState("setup");
    const [targetCount, setTargetCount] = useState(10);
    const [question, setQuestion] = useState(null);
    const [questionType, setQuestionType] = useState("read");
    const [options, setOptions] = useState([]);
    const [status, setStatus] = useState("idle");
    const [score, setScore] = useState({correct: 0, total: 0});
    const [streak, setStreak] = useState(0);
    const [typedAnswer, setTypedAnswer] = useState("");

    const [isTimerEnabled, setIsTimerEnabled] = useState(false);
    const [timeLimit, setTimeLimit] = useState(5000);
    const [timeLeft, setTimeLeft] = useState(5000);
    const [isSmartReviewMode, setIsSmartReviewMode] = useState(false);

    const quizDeckRef = useRef([]);
    const statusRef = useRef(status);
    const inputRef = useRef(null);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        if (phase === "playing" && status === "idle" && questionType === "type" && inputRef.current) {
            setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 50);
        }
    }, [phase, status, questionType, question]);

    const startQuiz = (target, isSmartReview = false) => {
        setTargetCount(target);
        setScore({correct: 0, total: 0});
        setStreak(0);
        setIsSmartReviewMode(isSmartReview);

        if (isSmartReview) {
            const stats = JSON.parse(localStorage.getItem("hm_char_stats") || "{}");
            const sortedDeck = [...currentDataSet].sort((a, b) => {
                const statA = stats[a.char] || {correct: 0, attempts: 0};
                const statB = stats[b.char] || {correct: 0, attempts: 0};

                let scoreA = statA.attempts > 0 ? (statA.correct / statA.attempts) : 0.4;
                let scoreB = statB.attempts > 0 ? (statB.correct / statB.attempts) : 0.4;

                if (statA.attempts === 0) scoreA -= 0.5;
                if (statB.attempts === 0) scoreB -= 0.5;

                return scoreA - scoreB;
            });
            quizDeckRef.current = shuffleArray(sortedDeck.slice(0, target));
        } else {
            quizDeckRef.current = shuffleArray([...currentDataSet]);
        }
        generateQuestion(isSmartReview);
        setPhase("playing");
    };

    const generateQuestion = useCallback((isSmartMode) => {
        if (quizDeckRef.current.length === 0) quizDeckRef.current = shuffleArray([...currentDataSet]);
        const target = quizDeckRef.current.pop();

        const visualMatch = VISUAL_GROUPS.find(g => g.includes(target.char)) || [];
        const phoneticMatch = currentDataSet.filter(item => item.group === target.group).map(i => i.char);

        let smartPool = currentDataSet.filter(item =>
            item.char !== target.char &&
            item.romaji !== target.romaji &&
            (visualMatch.includes(item.char) || phoneticMatch.includes(item.char))
        );
        smartPool = shuffleArray(smartPool);

        if (smartPool.length < 3) {
            const remaining = currentDataSet.filter(item => item.char !== target.char && item.romaji !== target.romaji && !smartPool.includes(item.char));
            smartPool = [...smartPool, ...shuffleArray(remaining)];
        }

        let wrongOptions = smartPool.slice(0, 3);
        const allOptions = shuffleArray([...wrongOptions, target]);

        const types = ["read", "reverse", "listen", "type"];
        const selectedType = isSmartMode ? "type" : types[Math.floor(Math.random() * types.length)];

        const limit = selectedType === "type" ? 8000 : 5000;
        setTimeLimit(limit);
        setTimeLeft(limit);

        setQuestion(target);
        setQuestionType(selectedType);
        setOptions(allOptions);
        setStatus("idle");
        setTypedAnswer("");
        if (selectedType === "listen") setTimeout(() => playAudio(target.char), 300);
    }, [currentDataSet]);

    const processAnswer = useCallback((isCorrect) => {
        setStatus(isCorrect ? "correct" : "wrong");
        const newTotal = score.total + 1;
        setScore(s => ({...s, correct: s.correct + (isCorrect ? 1 : 0), total: newTotal}));

        recordCharStat(question.char, isCorrect);

        if (isCorrect) {
            setStreak(s => s + 1);
            playAudio(question.char);
        } else setStreak(0);

        setTimeout(() => {
            if (newTotal >= targetCount) setPhase("finished");
            else generateQuestion(isSmartReviewMode);
        }, isCorrect ? 800 : 1500);
    }, [question, score.total, targetCount, generateQuestion, isSmartReviewMode]);

    const handleTimeOut = useCallback(() => {
        if (statusRef.current === "idle") {
            processAnswer(false);
        }
    }, [processAnswer]);

    useEffect(() => {
        if (phase !== "playing" || status !== "idle" || !isTimerEnabled) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 100) {
                    clearInterval(interval);
                    handleTimeOut();
                    return 0;
                }
                return prev - 100;
            });
        }, 100);
        return () => clearInterval(interval);
    }, [phase, status, handleTimeOut, isTimerEnabled]);

    const handleSelect = (selected) => {
        if (status !== "idle") return;
        if (isTimerEnabled && timeLeft === 0) return;
        processAnswer(selected.char === question.char);
    };

    const handleTypeSubmit = () => {
        if (status !== "idle" || !typedAnswer.trim()) return;
        if (isTimerEnabled && timeLeft === 0) return;
        const isCorrect = checkTypedAnswer(typedAnswer, question.romaji);
        processAnswer(isCorrect);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (phase !== "playing" || status !== "idle" || questionType === "type") return;
            if (e.key >= "1" && e.key <= "4") {
                const index = parseInt(e.key) - 1;
                if (options[index]) handleSelect(options[index]);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [phase, status, options, questionType, handleSelect]);

    const isBoth = alphabet === "both";
    const isH = alphabet === "hiragana";
    const primaryBg = isBoth ? "bg-[#ce82ff]" : isH ? "bg-[#58cc02]" : "bg-[#1cb0f6]";
    const primaryBorder = isBoth ? "border-[#ce82ff]" : isH ? "border-[#58cc02]" : "border-[#1cb0f6]";
    const primaryText = isBoth ? "text-[#ce82ff]" : isH ? "text-[#58cc02]" : "text-[#1cb0f6]";
    const primaryLightBg = isBoth ? "bg-[#faeaff]" : isH ? "bg-[#e5f7d8]" : "bg-[#e5f5ff]";

    if (phase === "setup") {
        return (
            <div
                className="flex flex-col h-full items-center justify-center py-4 md:py-6 animate-in fade-in zoom-in duration-300 overflow-y-auto hide-scrollbar">
                <div
                    className="w-16 h-16 md:w-20 md:h-20 bg-[#ce82ff] text-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 shadow-sm border-b-4 border-[#b65ce8] transform -rotate-6 shrink-0">
                    <Target size={32} strokeWidth={3} className="md:w-10 md:h-10"/>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#3c3c3c] mb-1 md:mb-2 shrink-0">Set Target</h2>
                <p className="text-[#afafaf] text-sm md:text-base font-bold mb-6 md:mb-8 shrink-0">How many
                    characters?</p>

                <div className="flex flex-col w-full max-w-xs md:max-w-sm gap-2 md:gap-3 px-4 sm:px-0 shrink-0 mb-4">
                    <Button variant="secondary" onClick={() => startQuiz(10)}
                            className="py-2.5 md:py-3 text-sm md:text-base">10 Questions</Button>
                    <Button variant="secondary" onClick={() => startQuiz(20)}
                            className="py-2.5 md:py-3 text-sm md:text-base">20 Questions</Button>
                    <Button variant="secondary" onClick={() => startQuiz(50)}
                            className="py-2.5 md:py-3 text-sm md:text-base">50 Questions</Button>
                    <Button variant="secondary" onClick={() => startQuiz(currentDataSet.length)}
                            className="py-2.5 md:py-3 text-sm md:text-base text-[#ce82ff]">All {currentDataSet.length}</Button>
                </div>

                <div className="w-full max-w-xs md:max-w-sm px-4 sm:px-0 shrink-0 border-t-2 border-gray-100 pt-4">
                    <button
                        onClick={() => setIsTimerEnabled(!isTimerEnabled)}
                        className={`w-full mb-3 flex items-center justify-between px-4 py-2.5 md:py-3 text-sm md:text-base font-bold rounded-xl md:rounded-2xl transition-all border-2 active:scale-95 ${isTimerEnabled ? `${primaryLightBg} ${primaryText} ${primaryBorder}` : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"}`}
                    >
                        <span className="flex items-center gap-2"><Timer size={18} strokeWidth={2.5}/> Enable Time Limit</span>
                        <div
                            className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${isTimerEnabled ? primaryBg : "bg-gray-200"}`}>
                            <div
                                className={`w-4 h-4 bg-white rounded-full transition-transform ${isTimerEnabled ? "translate-x-4" : "translate-x-0"}`}/>
                        </div>
                    </button>

                    <Button variant="outline" onClick={() => startQuiz(20, true)}
                            className="w-full py-2.5 md:py-3 text-sm md:text-base border-[#ce82ff] text-[#ce82ff] hover:bg-[#faeaff] hover:border-[#b65ce8]">
                        <Brain size={18}/> Smart Review (Strict Typing)
                    </Button>
                </div>

                <Button variant="ghost" onClick={onBack}
                        className="mt-4 md:mt-6 text-sm md:text-base shrink-0">Cancel</Button>
            </div>
        );
    }

    if (phase === "finished") {
        return (
            <div
                className="flex flex-col h-full items-center justify-center py-4 md:py-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 overflow-y-auto hide-scrollbar">
                <div
                    className="w-16 h-16 md:w-20 md:h-20 bg-[#ffc800] text-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 shadow-sm border-b-4 border-[#e5b400] shrink-0">
                    <Trophy size={32} strokeWidth={2.5} className="md:w-10 md:h-10"/>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#3c3c3c] mb-2 shrink-0">Quiz Complete!</h2>

                <div
                    className="text-center mb-6 md:mb-8 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-b-8 border-gray-200 w-full max-w-xs md:max-w-sm mt-2 shadow-sm shrink-0">
                    <p className="text-[#afafaf] font-bold text-xs md:text-sm mb-1 md:mb-2">Your Score</p>
                    <div className={`text-4xl md:text-5xl font-black ${primaryText}`}>{score.correct}<span
                        className="text-xl md:text-2xl text-gray-300">/{targetCount}</span></div>
                    <p className="text-[#afafaf] font-bold text-xs md:text-sm mt-3 md:mt-4">
                        {score.correct === targetCount ? "Perfect! Outstanding!" : "Great effort!"}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row w-full max-w-xs md:max-w-sm gap-2 md:gap-3 shrink-0">
                    <Button variant="secondary" onClick={onBack}
                            className="flex-1 py-2.5 md:py-3 text-sm md:text-base order-2 md:order-1">Menu</Button>
                    <Button alphabet={alphabet} onClick={() => setPhase("setup")}
                            className="flex-1 py-2.5 md:py-3 text-sm md:text-base order-1 md:order-2">Play
                        Again</Button>
                </div>
            </div>
        );
    }

    if (!question) return null;

    const isJpOption = questionType !== "read" && questionType !== "type";
    const isMultiQuestion = question.char.length > 1;

    const qReadSize = isMultiQuestion ? "text-[min(20vw,5rem)] md:text-[6rem]" : "text-[min(30vw,6rem)] md:text-[8rem]";
    const qRevSize = isMultiQuestion ? "text-[min(15vw,3rem)] md:text-[4rem]" : "text-[min(18vw,4rem)] md:text-[5rem]";

    return (
        <div
            className="flex flex-col h-full items-center py-2 sm:py-4 max-w-3xl mx-auto w-full overflow-y-auto hide-scrollbar">
            <div className="w-full flex items-center justify-between gap-2 sm:gap-4 mb-2 md:mb-6 px-2 shrink-0">
                <Button variant="ghost" onClick={() => setPhase("setup")} icon={ArrowLeft}
                        className="px-2 md:px-3 py-1.5 md:py-2"/>
                <div className="flex-1 h-2.5 md:h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ease-out ${primaryBg}`}
                         style={{width: `${(score.total / targetCount) * 100}%`}}></div>
                </div>
                <div
                    className={`text-[10px] md:text-sm font-black flex items-center gap-1 transition-all duration-300 ${streak >= 10 ? "text-[#ce82ff] scale-110" : streak >= 5 ? "text-[#ff9600] scale-105" : primaryText}`}>
                    {streak >= 10 ?
                        <Flame size={16} fill="#ce82ff" className="animate-bounce md:w-6 md:h-6"/> : streak >= 5 ?
                            <Flame size={16} fill="#ff9600" className="md:w-6 md:h-6"/> : null}
                    {streak >= 5 ? `Combo x${Math.floor(streak / 5) + 1} (${score.total}/${targetCount})` : `${score.total}/${targetCount}`}
                </div>
            </div>

            <div
                className="flex-1 flex flex-col md:flex-row items-center justify-center w-full gap-2 md:gap-8 px-2 my-auto shrink-0">

                <div
                    className="w-full md:flex-1 flex flex-col items-center justify-center min-h-[100px] md:min-h-[240px] shrink-0">
                    <div
                        className={`transition-all duration-300 transform ${status === "wrong" ? "animate-shake" : ""} flex flex-col items-center justify-center w-full relative`}>
                        {(questionType === "read" || questionType === "type") &&
                            <h2 className={`${qReadSize} font-medium text-[#3c3c3c] drop-shadow-sm pb-1 leading-none select-none`}
                                style={{fontFamily: activeFont}}>{question.char}</h2>}
                        {questionType === "reverse" &&
                            <h2 className={`${qRevSize} font-black text-[#afafaf] drop-shadow-sm pb-1 leading-none select-none uppercase tracking-widest`}>{question.romaji}</h2>}
                        {questionType === "listen" && (
                            <button onClick={() => playAudio(question.char)}
                                    className={`w-16 h-16 md:w-28 md:h-28 text-white rounded-[1.25rem] md:rounded-[2rem] border-b-4 md:border-b-8 flex items-center justify-center active:translate-y-2 active:border-b-0 transition-all shadow-sm hover:scale-105 ${isBoth ? "bg-[#ce82ff] border-[#b65ce8] hover:bg-[#b65ce8]" : isH ? "bg-[#58cc02] border-[#58a700] hover:bg-[#46a302]" : "bg-[#1cb0f6] border-[#1899d6] hover:bg-[#149fdf]"}`}>
                                <Headphones size={32} className="md:w-14 md:h-14"/>
                            </button>
                        )}

                        {isTimerEnabled && (
                            <div
                                className="w-3/4 max-w-[12rem] h-1.5 md:h-2 bg-gray-100 rounded-full mt-4 md:mt-8 overflow-hidden shadow-inner">
                                <div
                                    className={`h-full rounded-full transition-all duration-100 ease-linear ${timeLeft < timeLimit * 0.3 ? "bg-[#ea2b2b]" : primaryBg}`}
                                    style={{width: `${(timeLeft / timeLimit) * 100}%`}}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full md:flex-1 flex flex-col justify-center shrink-0">
                    {questionType === "type" ? (
                        <div className="w-full flex flex-col gap-3 md:gap-4 animate-in zoom-in duration-200">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleTypeSubmit();
                            }} className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={typedAnswer}
                                    onChange={(e) => setTypedAnswer(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
                                    disabled={status !== "idle"}
                                    placeholder="Type romaji..."
                                    className={`flex-1 bg-white border-2 border-gray-200 rounded-[1rem] md:rounded-2xl px-4 py-3 md:py-5 text-xl md:text-2xl font-black text-center outline-none transition-all shadow-sm disabled:opacity-50 focus:ring-2 ${status === "wrong" ? "border-[#ea2b2b] bg-[#ffdfe0] text-[#ea2b2b] animate-shake" : `text-[#3c3c3c] ${isBoth ? "focus:border-[#ce82ff] focus:ring-[#ce82ff]/20" : isH ? "focus:border-[#58cc02] focus:ring-[#58cc02]/20" : "focus:border-[#1cb0f6] focus:ring-[#1cb0f6]/20"}`}`}
                                    autoFocus
                                />
                                <Button alphabet={alphabet} disabled={status !== "idle" || !typedAnswer}
                                        className="px-5 md:px-8">
                                    <ChevronRight size={24} strokeWidth={3}/>
                                </Button>
                            </form>
                            <p className="text-center text-xs md:text-sm font-bold text-gray-400">Type the Romaji for
                                the character above.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 md:gap-4 w-full relative">
                            {options.map((opt, i) => {
                                const baseClass = "min-h-[64px] md:min-h-[100px] border-2 border-b-4 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all duration-150 select-none relative overflow-hidden flex items-center justify-center";
                                let stateClass = "bg-white text-[#4b4b4b] border-gray-200 hover:bg-gray-50 active:border-b-2 active:translate-y-[2px] hover:-translate-y-1 hover:shadow-md hover:border-gray-300";
                                if (status !== "idle") {
                                    if (opt.char === question?.char) stateClass = `text-white translate-y-[2px] border-b-2 z-10 ${isBoth ? "bg-[#ce82ff] border-[#b65ce8]" : isH ? "bg-[#58cc02] border-[#58a700]" : "bg-[#1cb0f6] border-[#1899d6]"}`;
                                    else stateClass = "bg-white border-gray-200 text-gray-300 opacity-50";
                                }
                                const isMultiOpt = isJpOption && opt.char.length > 1;
                                const optTextSize = isJpOption ? (isMultiOpt ? "text-xl md:text-3xl" : "text-2xl md:text-4xl") : "text-base md:text-2xl font-extrabold";

                                return (
                                    <button key={i} onClick={() => handleSelect(opt)} disabled={status !== "idle"}
                                            className={`${baseClass} ${stateClass} shadow-sm`}>
                    <span className={`${optTextSize} ${isJpOption ? "font-medium leading-none" : ""}`}
                          style={isJpOption ? {fontFamily: activeFont} : {}}>
                       {isJpOption ? opt.char : opt.romaji}
                    </span>
                                        <span
                                            className="absolute top-1.5 left-2 text-[9px] md:text-xs font-black opacity-30">{i + 1}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div
                        className="mt-4 md:mt-6 h-12 md:h-16 w-full flex items-center justify-center rounded-xl md:rounded-2xl font-black text-base md:text-xl shrink-0 px-2">
                        {status === "correct" && (
                            <div
                                className={`text-white w-full h-full flex items-center justify-center rounded-xl gap-1.5 md:gap-2 animate-in zoom-in shadow-sm ${primaryBg}`}>
                                <Check size={20} strokeWidth={3} className="md:w-6 md:h-6 shrink-0"/>
                                <span className="truncate">Brilliant!</span>
                                <span
                                    className="bg-black/10 px-2 py-0.5 rounded-lg text-xs md:text-sm ml-1 flex items-center gap-1 font-bold shrink-0">
                     <span style={{fontFamily: activeFont}}
                           className="text-base md:text-lg font-medium leading-none mt-0.5">{question?.char}</span>
                     <span className="opacity-50 mx-0.5">-</span>
                     <span className="uppercase tracking-wider">{question?.romaji}</span>
                  </span>
                            </div>
                        )}
                        {status === "wrong" && (
                            <div
                                className="text-[#ea2b2b] bg-[#ffdfe0] w-full h-full flex items-center justify-center rounded-xl gap-1.5 md:gap-2 animate-in zoom-in shadow-sm">
                                <X size={20} strokeWidth={3} className="md:w-6 md:h-6 shrink-0"/>
                                <span className="truncate">Answer:</span>
                                <span
                                    className="bg-[#ea2b2b]/10 text-[#ea2b2b] px-2 py-0.5 rounded-lg text-xs md:text-sm ml-1 flex items-center gap-1 font-bold shrink-0">
                      <span style={{fontFamily: activeFont}}
                            className="text-base md:text-lg font-medium leading-none mt-0.5">{question?.char}</span>
                      <span className="opacity-50 mx-0.5">-</span>
                      <span className="uppercase tracking-wider">{question?.romaji}</span>
                   </span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-25px) scale(1.2); }
        }
        .animate-float-up { animation: floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes drawStroke {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
        </div>
    );
};

const ChartScreen = ({onBack, activeFont, learnedChars = [], currentDataSet, alphabet}) => {
    const [hideRomaji, setHideRomaji] = useState(false);
    const getCharData = (charStr) => currentDataSet.find(c => c && c.char === charStr);

    const alphabetsToRender = alphabet === "both" ? ["hiragana", "katakana"] : [alphabet];

    const getLayouts = (isH) => {
        const layouts = [
            {
                title: "Basic Characters",
                cols: "grid-cols-5",
                headers: ["a", "i", "u", "e", "o"],
                grid: [
                    isH ? ["あ", "い", "う", "え", "お"] : ["ア", "イ", "ウ", "エ", "オ"],
                    isH ? ["か", "き", "く", "け", "こ"] : ["カ", "キ", "ク", "ケ", "コ"],
                    isH ? ["さ", "し", "す", "せ", "そ"] : ["サ", "シ", "ス", "セ", "ソ"],
                    isH ? ["た", "ち", "つ", "て", "と"] : ["タ", "チ", "ツ", "テ", "ト"],
                    isH ? ["な", "に", "ぬ", "ね", "の"] : ["ナ", "ニ", "ヌ", "ネ", "ノ"],
                    isH ? ["は", "ひ", "ふ", "へ", "ほ"] : ["ハ", "ヒ", "フ", "ヘ", "ホ"],
                    isH ? ["ま", "み", "む", "め", "も"] : ["マ", "ミ", "ム", "メ", "モ"],
                    isH ? ["や", null, "ゆ", null, "よ"] : ["ヤ", null, "ユ", null, "ヨ"],
                    isH ? ["ら", "り", "る", "れ", "ろ"] : ["ラ", "リ", "ル", "レ", "ロ"],
                    isH ? ["わ", null, null, null, "を"] : ["ワ", null, null, null, "ヲ"],
                    isH ? ["ん", null, null, null, null] : ["ン", null, null, null, null]
                ]
            },
            {
                title: "Voiced (Dakuten & Handakuten)",
                cols: "grid-cols-5",
                headers: ["a", "i", "u", "e", "o"],
                grid: [
                    isH ? ["が", "ぎ", "ぐ", "げ", "ご"] : ["ガ", "ギ", "グ", "ゲ", "ゴ"],
                    isH ? ["ざ", "じ", "ず", "ぜ", "ぞ"] : ["ザ", "ジ", "ズ", "ゼ", "ゾ"],
                    isH ? ["だ", "ぢ", "づ", "で", "ど"] : ["ダ", "ヂ", "ヅ", "デ", "ド"],
                    isH ? ["ば", "び", "ぶ", "べ", "ぼ"] : ["バ", "ビ", "ブ", "ベ", "ボ"],
                    isH ? ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"] : ["パ", "ピ", "プ", "ペ", "ポ"]
                ]
            },
            {
                title: "Contracted (Yōon)",
                cols: "grid-cols-3",
                headers: ["ya", "yu", "yo"],
                grid: [
                    isH ? ["きゃ", "きゅ", "きょ"] : ["キャ", "キュ", "キョ"],
                    isH ? ["しゃ", "しゅ", "しょ"] : ["シャ", "シュ", "ショ"],
                    isH ? ["ちゃ", "ちゅ", "ちょ"] : ["チャ", "チュ", "チョ"],
                    isH ? ["にゃ", "にゅ", "にょ"] : ["ニャ", "ニュ", "ニョ"],
                    isH ? ["ひゃ", "ひゅ", "ひょ"] : ["ヒャ", "ヒュ", "ヒョ"],
                    isH ? ["みゃ", "みゅ", "みょ"] : ["ミャ", "ミュ", "ミョ"],
                    isH ? ["りゃ", "りゅ", "りょ"] : ["リャ", "リュ", "リョ"],
                    isH ? ["ぎゃ", "ぎゅ", "ぎょ"] : ["ギャ", "ギュ", "ギョ"],
                    isH ? ["じゃ", "じゅ", "じょ"] : ["ジャ", "ジュ", "ジョ"],
                    isH ? ["びゃ", "びゅ", "びょ"] : ["ビャ", "ビュ", "ビョ"],
                    isH ? ["ぴゃ", "ぴゅ", "ぴょ"] : ["ピャ", "ピュ", "ピョ"]
                ]
            }
        ];

        if (!isH) {
            layouts.push({
                title: "Extended (Foreign Sounds)",
                cols: "grid-cols-5",
                headers: ["a", "i", "u", "e", "o"],
                grid: [
                    ["ヴァ", "ヴィ", "ヴ", "ヴェ", "ヴォ"],
                    ["ファ", "フィ", null, "フェ", "フォ"],
                    [null, "ウィ", null, "ウェ", "ウォ"],
                    [null, "ティ", "トゥ", null, null],
                    [null, "ディ", "ドゥ", null, null],
                    ["ツァ", "ツィ", null, "ツェ", "ツォ"],
                    [null, null, null, "シェ", null],
                    [null, null, null, "ジェ", null],
                    [null, null, null, "チェ", null]
                ]
            });
            layouts.push({
                title: "Extended Yōon",
                cols: "grid-cols-3",
                headers: ["ya", "yu", "yo"],
                grid: [
                    [null, "ヴュ", null],
                    [null, "フュ", null],
                    [null, "テュ", null],
                    [null, "デュ", null]
                ]
            });
        }

        return layouts;
    };

    const isBoth = alphabet === "both";
    const primaryLightBg = isBoth ? "bg-[#faeaff]" : alphabet === "hiragana" ? "bg-[#e5f7d8]" : "bg-[#e5f5ff]";
    const primaryText = isBoth ? "text-[#ce82ff]" : alphabet === "hiragana" ? "text-[#58cc02]" : "text-[#1cb0f6]";
    const primaryBorder = isBoth ? "border-[#ce82ff]" : alphabet === "hiragana" ? "border-[#58cc02]" : "border-[#1cb0f6]";

    return (
        <div className="flex flex-col h-full py-2 sm:py-4 animate-in fade-in duration-300">
            <div
                className="w-full flex justify-between items-center mb-3 md:mb-6 shrink-0 px-2 sm:px-0 max-w-4xl mx-auto">
                <Button variant="ghost" onClick={onBack} icon={ArrowLeft} className="px-2 md:px-3 py-1.5 md:py-2"/>
                <span className="text-[10px] md:text-sm font-black text-gray-500 tracking-widest uppercase">Character Chart</span>
                <button onClick={() => setHideRomaji(!hideRomaji)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold transition-all border-2 active:scale-95 ${hideRomaji ? "bg-[#ffdfe0] text-[#ea2b2b] border-[#ea2b2b]" : `${primaryLightBg} ${primaryText} ${primaryBorder}`}`}>
                    {hideRomaji ? <EyeOff size={14} strokeWidth={3}/> : <Eye size={14} strokeWidth={3}/>}
                    <span className="hidden sm:inline">Romaji</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 sm:px-1 pb-6 w-full hide-scrollbar">
                <div className="max-w-3xl mx-auto">
                    {alphabetsToRender.map((currentAlpha, alphaIdx) => {
                        const isH = currentAlpha === "hiragana";
                        const layouts = getLayouts(isH);

                        return (
                            <div key={currentAlpha}
                                 className={alphaIdx > 0 ? "mt-12 pt-8 border-t-4 border-gray-200 border-dashed space-y-8 md:space-y-12" : "space-y-8 md:space-y-12"}>

                                {isBoth && (
                                    <h2 className={`text-xl md:text-3xl font-black text-center uppercase tracking-widest ${isH ? "text-[#58cc02]" : "text-[#1cb0f6]"}`}>
                                        {currentAlpha}
                                    </h2>
                                )}

                                {layouts.map((section, idx) => (
                                    <div key={idx}
                                         className={`space-y-2 md:space-y-4 ${section.cols === "grid-cols-3" ? "max-w-xl mx-auto" : ""}`}>
                                        <h3 className="text-xs md:text-base font-extrabold text-gray-500 border-b-2 border-gray-200 pb-1 md:pb-2 text-center md:text-left">{section.title}</h3>

                                        <div
                                            className={`grid ${section.cols} gap-1.5 md:gap-4 mb-1 md:mb-2 text-center text-gray-400 font-black text-[10px] md:text-sm uppercase`}>
                                            {section.headers.map((h, i) => <div key={i}>{h}</div>)}
                                        </div>

                                        <div className={`grid ${section.cols} gap-1.5 md:gap-4`}>
                                            {section.grid.flat().map((charStr, i) => {
                                                if (!charStr) return <div key={`empty-${i}`}
                                                                          className="aspect-square"></div>;

                                                const charData = getCharData(charStr);
                                                const isLearned = learnedChars.includes(charStr);

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => playAudio(charStr)}
                                                        className={`bg-white aspect-square rounded-xl md:rounded-2xl border-2 border-b-4 active:translate-y-[2px] active:border-b-2 transition-all flex flex-col items-center justify-center p-1 md:p-2 group shadow-sm relative hover:-translate-y-1 hover:shadow-md ${isLearned ? (isH ? "border-[#58cc02] hover:bg-[#f2fbf0]" : "border-[#1cb0f6] hover:bg-[#f0f9ff]") : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"}`}
                                                    >
                                                        {isLearned && (
                                                            <div
                                                                className={`absolute top-1 right-1 md:top-2 md:right-2 opacity-50 group-hover:opacity-100 transition-opacity ${isH ? "text-[#58cc02]" : "text-[#1cb0f6]"}`}>
                                                                <Check size={10} strokeWidth={4}
                                                                       className="md:w-4 md:h-4"/>
                                                            </div>
                                                        )}
                                                        <span
                                                            className={`${charStr.length > 1 ? "text-sm md:text-2xl" : "text-lg md:text-[2rem]"} font-medium text-[#3c3c3c] transition-colors leading-none mt-1 md:mt-2 ${isH ? "group-hover:text-[#58cc02]" : "group-hover:text-[#1cb0f6]"}`}
                                                            style={{fontFamily: activeFont}}>{charStr}</span>
                                                        <span
                                                            className={`text-[9px] md:text-xs font-bold mt-1 md:mt-2 transition-opacity ${isLearned ? (isH ? "text-[#58cc02]" : "text-[#1cb0f6]") : "text-gray-400"} ${hideRomaji ? "opacity-0" : "opacity-100"}`}>{charData?.romaji || ""}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const SurvivalScreen = ({
                            onBack,
                            currentUser,
                            bestScores,
                            playerName,
                            onSaveScore,
                            setDbError,
                            activeFont,
                            currentDataSet,
                            alphabet
                        }) => {
    const [phase, setPhase] = useState("setup");
    const [question, setQuestion] = useState(null);
    const [questionType, setQuestionType] = useState("read");
    const [options, setOptions] = useState([]);
    const [status, setStatus] = useState("idle");
    const [typedAnswer, setTypedAnswer] = useState("");
    const [errorFlash, setErrorFlash] = useState(false);

    const [challengeMode, setChallengeMode] = useState("infinity");
    const [timeMinutes, setTimeMinutes] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);

    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);
    const [lastPoints, setLastPoints] = useState(0);
    const [pointsAnimKey, setPointsAnimKey] = useState(0);

    const [localName, setLocalName] = useState(playerName || "");
    useEffect(() => {
        if (playerName && !localName) setLocalName(playerName);
    }, [playerName]);

    const [lbMainMode, setLbMainMode] = useState("infinity");
    const [lbTimeMode, setLbTimeMode] = useState(1);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoadingBoard, setIsLoadingBoard] = useState(false);
    const quizDeckRef = useRef([]);
    const isGameOverRef = useRef(false);

    const activeModeKey = challengeMode === "infinity" ? `infinity_${alphabet}` : challengeMode === "time" ? `time_${timeMinutes}_${alphabet}` : `drop_${alphabet}`;
    const activeLbModeKey = lbMainMode === "infinity" ? `infinity_${alphabet}` : lbMainMode === "time" ? `time_${lbTimeMode}_${alphabet}` : `drop_${alphabet}`;
    const currentBestScore = bestScores?.[activeModeKey] || 0;

    const isBoth = alphabet === "both";
    const isH = alphabet === "hiragana";
    const primaryBg = isBoth ? "bg-[#ce82ff]" : isH ? "bg-[#58cc02]" : "bg-[#1cb0f6]";
    const primaryBorder = isBoth ? "border-[#ce82ff]" : isH ? "border-[#58cc02]" : "border-[#1cb0f6]";
    const primaryText = isBoth ? "text-[#ce82ff]" : isH ? "text-[#58cc02]" : "text-[#1cb0f6]";

    const loadLeaderboard = useCallback(() => {
        if (!db || !appId || !currentUser) {
            setIsLoadingBoard(false);
            return;
        }
        setIsLoadingBoard(true);

        const lbRef = collection(db, "artifacts", appId, "public", "data", `leaderboard_${activeLbModeKey}`);

        const unsubscribe = onSnapshot(lbRef,
            (snapshot) => {
                let scores = [];
                snapshot.forEach(doc => {
                    scores.push({id: doc.id, ...doc.data()});
                });
                scores.sort((a, b) => b.score - a.score);
                setLeaderboard(scores.slice(0, 10));
                setIsLoadingBoard(false);
            },
            (error) => {
                console.error("Leaderboard fetch error:", error);
                if (error.code === "permission-denied" || error.message?.includes("permission")) {
                    setDbError(true);
                }
                setIsLoadingBoard(false);
            }
        );
        return unsubscribe;
    }, [currentUser, setDbError, activeLbModeKey]);

    useEffect(() => {
        let unsub;
        if (phase === "leaderboard" && currentUser) unsub = loadLeaderboard();
        return () => {
            if (unsub) unsub();
        };
    }, [phase, currentUser, loadLeaderboard, activeLbModeKey]);

    useEffect(() => {
        let timer;
        if (phase === "playing" && challengeMode === "time" && timeLeft > 0 && !isGameOverRef.current) {
            timer = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [phase, challengeMode, timeLeft]);

    useEffect(() => {
        if (phase === "playing" && challengeMode === "time" && timeLeft === 0 && !isGameOverRef.current) {
            isGameOverRef.current = true;
            onSaveScore(score, localName, activeModeKey);
            setPhase("gameover");
        }
    }, [timeLeft, phase, challengeMode, score, localName, activeModeKey, onSaveScore]);

    // --- DROP DEFENSE GAME LOOP STATE ---
    const dropGameState = useRef({
        words: [],
        activeId: null,
        lastTime: 0,
        startTime: 0,
        lastSpawn: 0
    });
    const [dropTick, setDropTick] = useState(0);
    const requestRef = useRef();
    const scoreRef = useRef(0);
    const dropInputRef = useRef(null);

    const updateDropGame = useCallback((time) => {
        if (isGameOverRef.current) return;
        const state = dropGameState.current;

        if (!state.lastTime) state.lastTime = time;
        if (!state.startTime) state.startTime = time;

        let deltaTime = time - state.lastTime;
        if (deltaTime > 100) deltaTime = 100; // Clamp delta time to prevent massive jumps when tab is inactive
        state.lastTime = time;

        const elapsedSec = (time - state.startTime) / 1000;

        // Dynamic difficulty curve based on TIME
        // Speed: starts very slow (1.5% per sec), gradually increases
        const speedPerSecond = 1.5 + Math.min(10.5, elapsedSec * 0.04);
        const speedPerMs = speedPerSecond / 1000;

        // Spawn interval: starts at 4000ms, decreases to min 600ms
        const spawnInterval = Math.max(600, 4000 - (elapsedSec * 25));

        // Hard cap on concurrent characters early on (Starts at 2 max, adds 1 every 12 seconds)
        const maxWordsOnScreen = Math.min(12, 2 + Math.floor(elapsedSec / 12));

        if (time - (state.lastSpawn || 0) > spawnInterval && state.words.length < maxWordsOnScreen) {
            // Logical Progression: Start with basic characters, add Dakuten after 30s, add Yōon after 60s
            let allowedGroups = ["vowels", "k-row", "s-row", "t-row", "n-row", "h-row", "m-row", "y-row", "r-row", "w-row", "n-misc"];
            if (elapsedSec > 30) allowedGroups.push("dakuten", "handakuten");
            if (elapsedSec > 60) allowedGroups.push("yōon", "yōon-voiced");
            if (elapsedSec > 90) allowedGroups.push("extended", "extended-yōon"); // Introduce complex extended katakana

            const availableChars = currentDataSet.filter(c => allowedGroups.includes(c.group));
            const charData = availableChars[Math.floor(Math.random() * availableChars.length)];

            const validOptions = getValidRomaji(charData.romaji);

            const lanes = [15, 30, 45, 60, 75, 85];
            let lane = lanes[Math.floor(Math.random() * lanes.length)];
            if (state.words.length > 0) {
                const lastWord = state.words[state.words.length - 1];
                if (Math.abs(lastWord.x - lane) < 10) {
                    lane = lanes[(lanes.indexOf(lane) + 1) % lanes.length];
                }
            }

            state.words.push({
                id: Math.random().toString(36).substr(2, 9),
                char: charData.char,
                validOptions: validOptions,
                typed: "",
                x: lane,
                y: -10
            });
            state.lastSpawn = time;
        }

        let lostLives = 0;
        for (let i = state.words.length - 1; i >= 0; i--) {
            const w = state.words[i];
            w.y += speedPerMs * deltaTime;
            if (w.y > 105) { // let it go slightly off screen before dying
                state.words.splice(i, 1);
                lostLives++;
                if (state.activeId === w.id) state.activeId = null;
            }
        }

        if (lostLives > 0) {
            setLives(l => {
                const n = l - lostLives;
                if (n <= 0 && !isGameOverRef.current) {
                    isGameOverRef.current = true;
                    onSaveScore(scoreRef.current, localName, activeModeKey);
                    setPhase("gameover");
                }
                return n;
            });
            setStreak(0); // Reset combo when letting a word fall
            setErrorFlash(true);
            setTimeout(() => setErrorFlash(false), 200);
        }

        setDropTick(t => t + 1);
        if (!isGameOverRef.current) requestRef.current = requestAnimationFrame(updateDropGame);
    }, [currentDataSet, localName, activeModeKey, onSaveScore]);

    useEffect(() => {
        if (phase === "playing" && challengeMode === "drop") {
            dropGameState.current = {
                words: [],
                activeId: null,
                lastTime: performance.now(),
                startTime: performance.now(),
                lastSpawn: 0
            };
            requestRef.current = requestAnimationFrame(updateDropGame);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [phase, challengeMode, updateDropGame]);

    const handleDropTyping = (e) => {
        const inputStr = e.target.value.toLowerCase();
        e.target.value = "";
        if (!inputStr) return;

        const inputChar = inputStr.slice(-1);
        if (!inputChar.match(/[a-z]/)) return;

        const state = dropGameState.current;
        let isHit = false;

        if (state.activeId) {
            const target = state.words.find(w => w.id === state.activeId);
            if (target) {
                const newTyped = target.typed + inputChar;
                const stillValid = target.validOptions.filter(opt => opt.startsWith(newTyped));

                if (stillValid.length > 0) {
                    target.typed = newTyped;
                    target.validOptions = stillValid;
                    isHit = true;
                    if (stillValid.some(opt => opt === newTyped)) {
                        // Destroyed
                        state.words = state.words.filter(w => w.id !== target.id);
                        state.activeId = null;
                        setScore(s => {
                            scoreRef.current = s + 1;
                            return s + 1;
                        });
                        setStreak(s => s + 1);
                        playAudio(target.char);
                    }
                }
            }
        } else {
            const possible = state.words.filter(w => w.y > 0 && w.validOptions.some(opt => opt.startsWith(inputChar)));
            if (possible.length > 0) {
                possible.sort((a, b) => b.y - a.y);
                const target = possible[0];
                target.typed = inputChar;
                target.validOptions = target.validOptions.filter(opt => opt.startsWith(inputChar));
                state.activeId = target.id;
                isHit = true;

                if (target.validOptions.some(opt => opt === inputChar)) {
                    state.words = state.words.filter(w => w.id !== target.id);
                    state.activeId = null;
                    setScore(s => {
                        scoreRef.current = s + 1;
                        return s + 1;
                    });
                    setStreak(s => s + 1);
                    playAudio(target.char);
                }
            }
        }

        if (!isHit) {
            setStreak(0);
            setErrorFlash(true);
            setTimeout(() => setErrorFlash(false), 200);
        }

        setDropTick(t => t + 1);
    };

    const startQuiz = () => {
        setScore(0);
        scoreRef.current = 0;
        setLives(3);
        setStreak(0);
        setLastPoints(0);
        setErrorFlash(false);
        isGameOverRef.current = false;

        if (challengeMode === "drop") {
            dropGameState.current = {
                words: [],
                activeId: null,
                lastTime: performance.now(),
                startTime: performance.now(),
                lastSpawn: 0
            };
        } else {
            setTimeLeft(challengeMode === "time" ? timeMinutes * 60 : 0);
            quizDeckRef.current = shuffleArray([...currentDataSet]);
            generateQuestion();
        }
        setPhase("playing");
    };

    const generateQuestion = useCallback(() => {
        if (quizDeckRef.current.length === 0) quizDeckRef.current = shuffleArray([...currentDataSet]);
        const target = quizDeckRef.current.pop();

        const visualMatch = VISUAL_GROUPS.find(g => g.includes(target.char)) || [];
        const phoneticMatch = currentDataSet.filter(item => item.group === target.group).map(i => i.char);

        let smartPool = currentDataSet.filter(item =>
            item.char !== target.char &&
            item.romaji !== target.romaji &&
            (visualMatch.includes(item.char) || phoneticMatch.includes(item.char))
        );
        if (smartPool.length < 3) {
            const remaining = currentDataSet.filter(item => item.char !== target.char && item.romaji !== target.romaji && !smartPool.includes(item.char));
            smartPool = [...smartPool, ...shuffleArray(remaining)];
        }

        let wrongOptions = shuffleArray(smartPool).slice(0, 3);
        const allOptions = shuffleArray([...wrongOptions, target]);

        const types = ["read", "reverse", "listen", "type"];
        const selectedType = types[Math.floor(Math.random() * types.length)];

        setQuestion(target);
        setQuestionType(selectedType);
        setOptions(shuffleArray([...wrongOptions, target]));
        setStatus("idle");
        setTypedAnswer("");
        if (selectedType === "listen") setTimeout(() => playAudio(target.char), 300);
    }, [currentDataSet]);

    const processAnswer = useCallback((isCorrect) => {
        setStatus(isCorrect ? "correct" : "wrong");
        recordCharStat(question.char, isCorrect);

        let currentScore = score;
        let currentLives = lives;

        if (isCorrect) {
            const multiplier = Math.floor(streak / 5) + 1;
            currentScore += multiplier;
            setScore(currentScore);
            setStreak(s => s + 1);
            setLastPoints(multiplier);
            setPointsAnimKey(Date.now());
            playAudio(question.char);
        } else {
            setStreak(0);
            if (challengeMode === "infinity") {
                currentLives--;
                setLives(currentLives);
            }
        }

        setTimeout(() => {
            if (isGameOverRef.current) return;
            if (challengeMode === "infinity" && currentLives <= 0) {
                isGameOverRef.current = true;
                onSaveScore(currentScore, localName, activeModeKey);
                setPhase("gameover");
            } else {
                generateQuestion();
            }
        }, isCorrect ? 800 : 1500);
    }, [question, score, lives, streak, challengeMode, localName, onSaveScore, generateQuestion, activeModeKey]);

    const handleSelect = (selected) => {
        if (status !== "idle") return;
        if (challengeMode === "time" && timeLeft === 0) return;
        processAnswer(selected.char === question.char);
    };

    const handleTypeSubmit = () => {
        if (status !== "idle" || !typedAnswer.trim()) return;
        if (challengeMode === "time" && timeLeft === 0) return;
        const isCorrect = checkTypedAnswer(typedAnswer, question.romaji);
        processAnswer(isCorrect);
    };

    useEffect(() => {
        if (challengeMode === "drop") return;
        const handleKeyDown = (e) => {
            if (phase !== "playing" || status !== "idle" || questionType === "type") return;
            if (e.key >= "1" && e.key <= "4") {
                const index = parseInt(e.key) - 1;
                if (options[index]) handleSelect(options[index]);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [phase, status, options, questionType, handleSelect, challengeMode]);

    const handleShareScore = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 420;
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(0, 0, 800, 420);
        gradient.addColorStop(0, isBoth ? "#ce82ff" : isH ? "#58cc02" : "#1cb0f6");
        gradient.addColorStop(1, "#ce82ff");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 420);

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(20, 20, 760, 380, 20);
        ctx.fill();

        ctx.fillStyle = "#3c3c3c";
        ctx.font = "900 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("KANA MASTER", 400, 80);

        ctx.fillStyle = "#afafaf";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(`Survival Mode: ${challengeMode.toUpperCase()}`, 400, 130);

        ctx.fillStyle = isBoth ? "#ce82ff" : isH ? "#58cc02" : "#1cb0f6";
        ctx.font = "900 100px sans-serif";
        ctx.fillText(score.toString(), 400, 250);

        ctx.fillStyle = "#ff9600";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText(`Words Typed & Enemies Destroyed!`, 400, 310);

        ctx.fillStyle = "#3c3c3c";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("Can you beat my score?", 400, 360);

        canvas.toBlob(async (blob) => {
            if (navigator.share) {
                const file = new File([blob], "kana-master-score.png", {type: "image/png"});
                try {
                    await navigator.share({
                        title: "Kana Master",
                        text: `I scored ${score} in Kana Flow! Can you beat me?`,
                        files: [file]
                    });
                } catch (err) {
                    console.log("Share failed", err);
                }
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "kana-master-score.png";
                a.click();
            }
        });
    };

    if (phase === "setup") {
        return (
            <div
                className="flex flex-col h-full items-center justify-center py-4 md:py-6 animate-in fade-in zoom-in duration-300 overflow-y-auto hide-scrollbar">
                <div
                    className="w-16 h-16 md:w-20 md:h-20 bg-[#ff9600] text-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 shadow-sm border-b-4 border-[#cc7800] transform -rotate-6 shrink-0">
                    <Flame size={32} strokeWidth={3} className="md:w-10 md:h-10"/>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#3c3c3c] mb-1 md:mb-2 text-center shrink-0">Survival
                    Challenge</h2>
                <p className="text-[#afafaf] text-xs md:text-sm font-bold mb-4 md:mb-6 text-center px-4 shrink-0">Choose
                    your challenge mode!</p>

                <div className="w-full max-w-xs md:max-w-sm mb-4 px-2 sm:px-0 shrink-0">
                    <div className="flex bg-gray-100 rounded-xl p-1 w-full">
                        <button onClick={() => setChallengeMode("infinity")}
                                className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${challengeMode === "infinity" ? "bg-white shadow-sm text-[#ff9600]" : "text-gray-400 hover:text-gray-600"}`}>
                            <InfinityIcon size={14} strokeWidth={3}/> Infinity
                        </button>
                        <button onClick={() => setChallengeMode("time")}
                                className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${challengeMode === "time" ? `bg-white shadow-sm ${primaryText}` : "text-gray-400 hover:text-gray-600"}`}>
                            <Timer size={14} strokeWidth={3}/> Time
                        </button>
                        <button onClick={() => setChallengeMode("drop")}
                                className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${challengeMode === "drop" ? "bg-white shadow-sm text-[#ce82ff]" : "text-gray-400 hover:text-gray-600"}`}>
                            <Zap size={14} strokeWidth={3}/> Drop
                        </button>
                    </div>
                </div>

                {challengeMode === "time" && (
                    <div
                        className="w-full max-w-xs md:max-w-sm mb-4 px-2 sm:px-0 shrink-0 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between gap-2">
                            {[1, 2, 3, 4, 5].map(m => (
                                <button key={m} onClick={() => setTimeMinutes(m)}
                                        className={`flex-1 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border-2 active:scale-95 ${timeMinutes === m ? `${primaryBorder} ${primaryText} ${isH ? "bg-[#e5f7d8]" : "bg-[#e5f5ff]"}` : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"}`}>
                                    {m}m
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="w-full max-w-xs md:max-w-sm mb-4 px-4 sm:px-0 shrink-0">
                    <input
                        type="text"
                        maxLength={10}
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value.toUpperCase())}
                        placeholder="ENTER NAME"
                        className="w-full bg-white border-2 border-gray-200 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 text-lg md:text-xl font-black text-center text-[#3c3c3c] outline-none focus:border-[#ff9600] focus:ring-2 focus:ring-[#ff9600]/20 transition-all uppercase shadow-sm hover:border-gray-300"
                    />
                </div>

                <div
                    className="flex flex-col md:flex-row w-full max-w-xs md:max-w-sm gap-2 md:gap-3 px-4 sm:px-0 shrink-0">
                    <Button onClick={startQuiz} disabled={!localName.trim()}
                            className="flex-1 py-2.5 md:py-3 text-sm md:text-base bg-[#ff9600] border-[#cc7800] hover:bg-[#e68700] text-white">Start {challengeMode === "infinity" ? "Infinity" : challengeMode === "drop" ? "Drop Mode" : "Timer"}</Button>
                    <Button variant="secondary" icon={Crown} onClick={() => {
                        setLbMainMode(challengeMode === "drop" ? "drop" : challengeMode);
                        setLbTimeMode(timeMinutes);
                        setPhase("leaderboard");
                    }} className="flex-1 py-2.5 md:py-3 text-sm md:text-base text-[#ffc800]">Leaderboards</Button>
                </div>
                <Button variant="ghost" onClick={onBack} className="mt-2 text-sm md:text-base shrink-0">Cancel</Button>
            </div>
        );
    }

    if (phase === "leaderboard") {
        return (
            <div
                className="flex flex-col h-full py-4 sm:py-6 animate-in fade-in duration-300 w-full max-w-2xl mx-auto overflow-y-auto hide-scrollbar">
                <div className="w-full flex items-center gap-2 mb-2 shrink-0 px-2 sm:px-0">
                    <Button variant="ghost" onClick={() => setPhase("setup")} icon={ArrowLeft}
                            className="px-2 md:px-3 py-1.5 md:py-2 shrink-0"/>
                    <div className="flex-1 flex bg-gray-100 rounded-xl p-1">
                        <button onClick={() => setLbMainMode("infinity")}
                                className={`flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${lbMainMode === "infinity" ? "bg-white shadow-sm text-[#ff9600]" : "text-gray-400 hover:text-gray-600"}`}>
                            <InfinityIcon size={14} strokeWidth={3}/> Infinity
                        </button>
                        <button onClick={() => setLbMainMode("time")}
                                className={`flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${lbMainMode === "time" ? `bg-white shadow-sm ${primaryText}` : "text-gray-400 hover:text-gray-600"}`}>
                            <Timer size={14} strokeWidth={3}/> Time
                        </button>
                        <button onClick={() => setLbMainMode("drop")}
                                className={`flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${lbMainMode === "drop" ? "bg-white shadow-sm text-[#ce82ff]" : "text-gray-400 hover:text-gray-600"}`}>
                            <Zap size={14} strokeWidth={3}/> Drop
                        </button>
                    </div>
                </div>

                {lbMainMode === "time" && (
                    <div
                        className="w-full flex justify-between gap-1 px-2 sm:px-0 mb-2 shrink-0 animate-in fade-in zoom-in duration-200">
                        {[1, 2, 3, 4, 5].map(m => (
                            <button key={m} onClick={() => setLbTimeMode(m)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all border-2 active:scale-95 ${lbTimeMode === m ? `${primaryBorder} ${primaryText} ${isH ? "bg-[#e5f7d8]" : "bg-[#e5f5ff]"}` : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"}`}>
                                {m}m
                            </button>
                        ))}
                    </div>
                )}

                <div
                    className="flex-1 w-full bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 border-b-8 border-gray-200 overflow-hidden flex flex-col p-2 md:p-4 shadow-sm shrink-0 min-h-[300px] mt-2">
                    <div
                        className="bg-gray-50 rounded-lg md:rounded-xl p-2 md:p-3 flex text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        <span className="w-10 md:w-12 text-center">Rank</span>
                        <span className="flex-1">Player</span>
                        <span className="w-12 md:w-16 text-right pr-2">Score</span>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                        {isLoadingBoard ? (
                            <div
                                className="h-full flex items-center justify-center text-gray-400 font-bold text-sm md:text-base">Loading
                                scores...</div>
                        ) : leaderboard.length === 0 ? (
                            <div
                                className="h-full flex flex-col items-center justify-center text-gray-400 font-bold gap-2 text-sm md:text-base">
                                <Users size={32} className="opacity-50"/>
                                Be the first!
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {leaderboard.map((entry, idx) => {
                                    const isMe = entry.deviceId === getDeviceId() || entry.userId === currentUser?.uid;
                                    return (
                                        <div key={entry.id}
                                             className={`flex items-center p-2.5 md:p-3 rounded-lg md:rounded-xl font-black transition-colors ${isMe ? (isH ? "bg-[#e5f7d8] text-[#58cc02]" : "bg-[#e5f5ff] text-[#1cb0f6]") : idx === 0 ? "bg-[#fff5e6] text-[#ff9600]" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-[#fcf3e8] text-[#c97a48]" : "text-[#4b4b4b] hover:bg-gray-50"}`}>
                                            <span
                                                className="w-10 md:w-12 text-center text-base md:text-lg">{idx + 1}</span>
                                            <span
                                                className="flex-1 truncate uppercase text-sm md:text-base">{entry.name}</span>
                                            <span
                                                className="w-12 md:w-16 text-right text-base md:text-lg pr-2">{entry.score}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full mt-4 md:mt-6 px-2 sm:px-0 shrink-0">
                    <Button onClick={() => setPhase("setup")}
                            className="w-full py-3 md:py-4 text-base md:text-lg bg-[#ff9600] border-[#cc7800] hover:bg-[#e68700] text-white">Back
                        to Setup</Button>
                </div>
            </div>
        );
    }

    if (phase === "gameover") {
        const isNewBest = score > currentBestScore && score > 0;

        return (
            <div
                className="flex flex-col h-full items-center justify-center py-4 md:py-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 overflow-y-auto hide-scrollbar">
                <div
                    className="w-16 h-16 md:w-20 md:h-20 bg-[#ea2b2b] text-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 shadow-sm border-b-4 border-[#b82222] shrink-0">
                    <Heart size={32} strokeWidth={2.5} className="md:w-10 md:h-10"/>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#3c3c3c] mb-2 shrink-0">Game Over</h2>

                <div
                    className="text-center mb-4 md:mb-6 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-b-8 border-gray-200 w-full max-w-xs md:max-w-sm mt-2 relative shadow-sm shrink-0 hover:-translate-y-1 transition-transform">
                    {isNewBest && (
                        <div
                            className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-[#ff9600] text-white text-[10px] md:text-xs font-black px-3 md:px-4 py-1 rounded-full border-2 border-white shadow-sm animate-bounce whitespace-nowrap">
                            NEW RECORD!
                        </div>
                    )}
                    <p className="text-[#afafaf] font-bold text-xs md:text-sm mb-1 md:mb-2">Final Score
                        ({challengeMode === "infinity" ? "Infinity" : challengeMode === "drop" ? "Drop Mode" : `${timeMinutes} Min`})</p>
                    <div className="text-4xl md:text-5xl font-black text-[#ea2b2b]">{score}</div>
                    <p className="text-[#afafaf] font-bold text-[10px] md:text-xs mt-3 md:mt-4">
                        Personal Best: {Math.max(score, currentBestScore)}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row w-full max-w-xs md:max-w-sm gap-2 md:gap-3 shrink-0">
                    <Button variant="secondary" icon={Share2} onClick={handleShareScore}
                            className="flex-1 py-2.5 md:py-3 text-sm md:text-base order-2 md:order-1">Share</Button>
                    <Button onClick={startQuiz}
                            className="flex-1 py-2.5 md:py-3 text-sm md:text-base bg-[#ff9600] border-[#cc7800] hover:bg-[#e68700] text-white order-1 md:order-2">Play
                        Again</Button>
                </div>
                <Button variant="ghost" onClick={() => setPhase("setup")}
                        className="mt-3 md:mt-4 text-sm md:text-base shrink-0">Change Mode</Button>
            </div>
        );
    }

    const isJpOption = questionType !== "read" && questionType !== "type";
    const isMultiQuestion = question && question.char.length > 1;

    const qReadSize = isMultiQuestion ? "text-[min(20vw,5rem)] md:text-[6rem]" : "text-[min(30vw,6rem)] md:text-[8rem]";
    const qRevSize = isMultiQuestion ? "text-[min(15vw,3rem)] md:text-[4rem]" : "text-[min(18vw,4rem)] md:text-[5rem]";

    return (
        <div
            className="flex flex-col h-full items-center py-2 sm:py-4 max-w-3xl mx-auto w-full overflow-y-auto hide-scrollbar">
            <div className="w-full flex items-center justify-between gap-2 sm:gap-4 mb-2 md:mb-6 px-2 shrink-0">
                <Button variant="ghost" onClick={() => setPhase("setup")} icon={ArrowLeft}
                        className="px-2 md:px-3 py-1.5 md:py-2"/>

                <div className="flex-1 flex justify-center gap-1 md:gap-2">
                    {challengeMode === "infinity" || challengeMode === "drop" ? (
                        [...Array(3)].map((_, i) => (
                            <Heart key={i} fill={i < lives ? "#ea2b2b" : "transparent"}
                                   color={i < lives ? "#ea2b2b" : "#d1d5db"}
                                   className="w-5 h-5 md:w-8 md:h-8 transition-colors duration-300"/>
                        ))
                    ) : (
                        <div
                            className={`flex items-center gap-2 font-black text-xl md:text-2xl ${timeLeft <= 10 ? "text-[#ea2b2b] animate-pulse" : primaryText}`}>
                            <Timer size={24} strokeWidth={3} className="md:w-8 md:h-8"/>
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>

                {/* Gamification Combos & Boosts for Survival */}
                <div
                    className="relative flex flex-col items-end w-auto min-w-[6rem] justify-end whitespace-nowrap ml-auto">
                    <div
                        className={`text-[10px] md:text-sm font-black flex items-center gap-1 transition-all duration-300 ${streak >= 10 ? "text-[#ce82ff] scale-110" : streak >= 5 ? "text-[#ff9600] scale-105" : primaryText}`}>
                        {streak >= 10 ?
                            <Flame size={16} fill="#ce82ff" className="animate-bounce md:w-6 md:h-6"/> : streak >= 5 ?
                                <Flame size={16} fill="#ff9600" className="md:w-6 md:h-6"/> : null}
                        <div className="text-right flex flex-col items-end">
                            {streak >= 5 && challengeMode !== "drop" && <span
                                className="text-[8px] md:text-[10px] leading-none mb-0.5">COMBO x{Math.floor(streak / 5) + 1}</span>}
                            <span className="text-sm md:text-xl">Score: {score}</span>
                        </div>
                    </div>
                    {status === "correct" && lastPoints > 0 && challengeMode !== "drop" && (
                        <div key={pointsAnimKey}
                             className="absolute top-full right-0 mt-1 text-sm md:text-base font-black text-[#ff9600] animate-float-up pointer-events-none drop-shadow-md">
                            +{lastPoints}
                        </div>
                    )}
                </div>
            </div>

            {challengeMode === "drop" ? (
                <div
                    className={`relative flex-1 w-full rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-b-8 overflow-hidden shadow-sm transition-colors duration-150 ${errorFlash ? "bg-[#ffdfe0] border-[#ea2b2b]" : "bg-white border-gray-200"}`}
                    onClick={() => dropInputRef.current?.focus()}
                >
                    {dropGameState.current.words.map(w => (
                        <div key={w.id} className="absolute flex flex-col items-center transition-transform duration-75"
                             style={{left: `${w.x}%`, top: `${w.y}%`, transform: "translate(-50%, -50%)"}}>
                <span
                    className={`text-4xl md:text-5xl font-medium ${dropGameState.current.activeId === w.id ? "text-[#ff9600] scale-125" : "text-[#3c3c3c]"}`}
                    style={{fontFamily: activeFont}}>
                   {w.char}
                </span>
                        </div>
                    ))}

                    <input
                        ref={dropInputRef}
                        type="text"
                        className="absolute bottom-0 left-0 opacity-0 pointer-events-none h-0 w-0"
                        onChange={handleDropTyping}
                        autoFocus
                        onBlur={(e) => {
                            if (phase === "playing" && challengeMode === "drop" && !isGameOverRef.current) {
                                setTimeout(() => {
                                    if (e.target) e.target.focus();
                                }, 10);
                            }
                        }}
                    />

                    <div className="absolute bottom-4 w-full flex justify-center pointer-events-none">
                        <div
                            className="bg-gray-800 text-white px-6 py-2 rounded-full font-bold opacity-50 flex items-center gap-2">
                            <Keyboard size={16}/> Type to destroy...
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="flex-1 flex flex-col md:flex-row items-center justify-center w-full gap-2 md:gap-8 px-2 my-auto shrink-0">
                    <div
                        className="w-full md:flex-1 flex flex-col items-center justify-center min-h-[100px] md:min-h-[240px] shrink-0">
                        <div
                            className={`transition-all duration-300 transform ${status === "wrong" ? "animate-shake" : ""} flex flex-col items-center justify-center w-full relative`}>
                            {(questionType === "read" || questionType === "type") &&
                                <h2 className={`${qReadSize} font-medium text-[#3c3c3c] drop-shadow-sm pb-1 leading-none select-none`}
                                    style={{fontFamily: activeFont}}>{question?.char}</h2>}
                            {questionType === "reverse" &&
                                <h2 className={`${qRevSize} font-black text-[#afafaf] drop-shadow-sm pb-1 leading-none select-none uppercase tracking-widest`}>{question?.romaji}</h2>}
                            {questionType === "listen" && (
                                <button onClick={() => playAudio(question?.char)}
                                        className={`w-16 h-16 md:w-28 md:h-28 text-white rounded-[1.25rem] md:rounded-[2rem] border-b-4 md:border-b-8 flex items-center justify-center active:translate-y-2 active:border-b-0 transition-all shadow-sm hover:scale-105 ${isBoth ? "bg-[#ce82ff] border-[#b65ce8] hover:bg-[#b65ce8]" : isH ? "bg-[#58cc02] border-[#58a700] hover:bg-[#46a302]" : "bg-[#1cb0f6] border-[#1899d6] hover:bg-[#149fdf]"}`}>
                                    <Headphones size={32} className="md:w-14 md:h-14"/>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:flex-1 flex flex-col justify-center shrink-0">
                        {questionType === "type" ? (
                            <div className="w-full flex flex-col gap-3 md:gap-4 animate-in zoom-in duration-200">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleTypeSubmit();
                                }} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={typedAnswer}
                                        onChange={(e) => setTypedAnswer(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
                                        disabled={status !== "idle"}
                                        placeholder="Type romaji..."
                                        className={`flex-1 bg-white border-2 border-gray-200 rounded-[1rem] md:rounded-2xl px-4 py-3 md:py-5 text-xl md:text-2xl font-black text-center outline-none transition-all shadow-sm disabled:opacity-50 focus:ring-2 ${status === "wrong" ? "border-[#ea2b2b] bg-[#ffdfe0] text-[#ea2b2b] animate-shake" : `text-[#3c3c3c] ${isBoth ? "focus:border-[#ce82ff] focus:ring-[#ce82ff]/20" : isH ? "focus:border-[#58cc02] focus:ring-[#58cc02]/20" : "focus:border-[#1cb0f6] focus:ring-[#1cb0f6]/20"}`}`}
                                        autoFocus
                                    />
                                    <Button alphabet={alphabet} disabled={status !== "idle" || !typedAnswer}
                                            className="px-5 md:px-8">
                                        <ChevronRight size={24} strokeWidth={3}/>
                                    </Button>
                                </form>
                                <p className="text-center text-xs md:text-sm font-bold text-gray-400">Type the Romaji
                                    for the character above.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 md:gap-4 w-full relative">
                                {options.map((opt, i) => {
                                    const baseClass = "min-h-[64px] md:min-h-[100px] border-2 border-b-4 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all duration-150 select-none relative overflow-hidden flex items-center justify-center";
                                    let stateClass = "bg-white text-[#4b4b4b] border-gray-200 hover:bg-gray-50 active:border-b-2 active:translate-y-[2px] hover:-translate-y-1 hover:shadow-md hover:border-gray-300";
                                    if (status !== "idle") {
                                        if (opt.char === question?.char) stateClass = `text-white translate-y-[2px] border-b-2 z-10 ${isBoth ? "bg-[#ce82ff] border-[#b65ce8]" : isH ? "bg-[#58cc02] border-[#58a700]" : "bg-[#1cb0f6] border-[#1899d6]"}`;
                                        else stateClass = "bg-white border-gray-200 text-gray-300 opacity-50";
                                    }
                                    const isMultiOpt = isJpOption && opt.char.length > 1;
                                    const optTextSize = isJpOption ? (isMultiOpt ? "text-xl md:text-3xl" : "text-2xl md:text-4xl") : "text-base md:text-2xl font-extrabold";

                                    return (
                                        <button key={i} onClick={() => handleSelect(opt)} disabled={status !== "idle"}
                                                className={`${baseClass} ${stateClass} shadow-sm`}>
                      <span className={`${optTextSize} ${isJpOption ? "font-medium leading-none" : ""}`}
                            style={isJpOption ? {fontFamily: activeFont} : {}}>
                         {isJpOption ? opt.char : opt.romaji}
                      </span>
                                            <span
                                                className="absolute top-1.5 left-2 text-[9px] md:text-xs font-black opacity-30">{i + 1}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div
                            className="mt-4 md:mt-6 h-12 md:h-16 w-full flex items-center justify-center rounded-xl md:rounded-2xl font-black text-base md:text-xl shrink-0 px-2">
                            {status === "correct" && (
                                <div
                                    className={`text-white w-full h-full flex items-center justify-center rounded-xl gap-1.5 md:gap-2 animate-in zoom-in shadow-sm ${primaryBg}`}>
                                    <Check size={20} strokeWidth={3} className="md:w-6 md:h-6 shrink-0"/>
                                    <span className="truncate">Brilliant!</span>
                                    <span
                                        className="bg-black/10 px-2 py-0.5 rounded-lg text-xs md:text-sm ml-1 flex items-center gap-1 font-bold shrink-0">
                       <span style={{fontFamily: activeFont}}
                             className="text-base md:text-lg font-medium leading-none mt-0.5">{question?.char}</span>
                       <span className="opacity-50 mx-0.5">-</span>
                       <span className="uppercase tracking-wider">{question?.romaji}</span>
                    </span>
                                </div>
                            )}
                            {status === "wrong" && (
                                <div
                                    className="text-[#ea2b2b] bg-[#ffdfe0] w-full h-full flex items-center justify-center rounded-xl gap-1.5 md:gap-2 animate-in zoom-in shadow-sm">
                                    <X size={20} strokeWidth={3} className="md:w-6 md:h-6 shrink-0"/>
                                    <span className="truncate">Answer:</span>
                                    <span
                                        className="bg-[#ea2b2b]/10 text-[#ea2b2b] px-2 py-0.5 rounded-lg text-xs md:text-sm ml-1 flex items-center gap-1 font-bold shrink-0">
                        <span style={{fontFamily: activeFont}}
                              className="text-base md:text-lg font-medium leading-none mt-0.5">{question?.char}</span>
                        <span className="opacity-50 mx-0.5">-</span>
                        <span className="uppercase tracking-wider">{question?.romaji}</span>
                     </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-25px) scale(1.2); }
        }
        .animate-float-up { animation: floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
        </div>
    );
};

// --- APP CONTAINER ---

export default function App() {
    const [mode, setMode] = useState("menu");
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [dbError, setDbError] = useState(false);
    const [bestScores, setBestScores] = useState({});
    const [playerName, setPlayerName] = useState("");

    // ALPHABET SWITCHER STATE
    const [alphabet, setAlphabet] = useState("hiragana");

    const currentDataSet = alphabet === "both"
        ? [...HIRAGANA_DATA, ...KATAKANA_DATA]
        : (alphabet === "hiragana" ? HIRAGANA_DATA : KATAKANA_DATA);

    // SETTINGS STATE
    const [useHandwriting, setUseHandwriting] = useState(false);
    const [globalAutoPlay, setGlobalAutoPlay] = useState(true);
    const activeFont = useHandwriting ? HANDWRITING_FONT : PRINT_FONT;

    const [learnedChars, setLearnedChars] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("hm_learned") || "[]");
        } catch (e) {
            return [];
        }
    });

    const currentLearnedCount = learnedChars.filter(char => currentDataSet.some(d => d.char === char)).length;

    const handleCharLearned = useCallback((char) => {
        setLearnedChars(prev => {
            if (prev.includes(char)) return prev;
            const updated = [...prev, char];
            localStorage.setItem("hm_learned", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const handleResetProgress = () => {
        localStorage.removeItem("hm_learned");
        localStorage.removeItem("hm_char_stats");
        setLearnedChars([]);
    };

    useEffect(() => {
        if (!auth) {
            setIsAuthReady(true);
            return;
        }

        const initAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
                const hasCustomConfig = MY_FIREBASE_CONFIG && MY_FIREBASE_CONFIG.apiKey;
                if (hasCustomConfig) {
                    await signInAnonymously(auth);
                } else if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Critical Authentication Error:", error);
                setAuthError(error);
            } finally {
                setIsAuthReady(true);
            }
        };

        initAuth();
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isAuthReady || !user || !db) return;

        const handleError = (e) => {
            console.error(e);
            if (e.code === "permission-denied" || e.message?.includes("permission")) setDbError(true);
        };

        const statsRef = collection(db, "artifacts", appId, "users", user.uid, "stats");
        const unsubStats = onSnapshot(statsRef, (snap) => {
            const scores = {};
            snap.forEach(doc => {
                scores[doc.id] = doc.data().bestScore || 0;
            });
            setBestScores(scores);
        }, handleError);

        const profileRef = doc(db, "artifacts", appId, "users", user.uid, "profile", "info");
        const unsubProfile = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) setPlayerName(docSnap.data().name || "");
        }, handleError);

        return () => {
            unsubStats();
            unsubProfile();
        };
    }, [user, isAuthReady]);

    const updateBestScore = async (newScore, nameInput, modeKey) => {
        if (!user || !db) return;
        const finalName = nameInput || playerName || "ANON";

        try {
            if (nameInput && nameInput !== playerName) {
                await setDoc(doc(db, "artifacts", appId, "users", user.uid, "profile", "info"), {name: finalName}, {merge: true});
            }
            const currentBest = bestScores[modeKey] || 0;
            if (newScore > currentBest) {
                await setDoc(doc(db, "artifacts", appId, "users", user.uid, "stats", modeKey), {
                    bestScore: newScore,
                    lastUpdated: new Date().toISOString()
                }, {merge: true});
            }
            const scoreToSubmit = Math.max(newScore, currentBest);
            if (scoreToSubmit > 0) {
                const deviceId = getDeviceId();
                await setDoc(doc(db, "artifacts", appId, "public", "data", `leaderboard_${modeKey}`, deviceId), {
                    userId: user.uid,
                    deviceId: deviceId,
                    name: finalName.substring(0, 10).toUpperCase(),
                    score: scoreToSubmit,
                    timestamp: new Date().toISOString()
                }, {merge: true});
            }
        } catch (e) {
            console.error("Firestore write error", e);
            if (e.code === "permission-denied" || e.message?.includes("permission")) setDbError(true);
        }
    };

    if (dbError) {
        return (
            <div
                className="min-h-[100dvh] bg-[#f7f7f8] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300"
                style={{fontFamily: PRINT_FONT}}>
                <div className="text-[#ea2b2b] mb-4"><X size={56} strokeWidth={3}/></div>
                <h1 className="text-xl md:text-2xl font-black text-[#3c3c3c] mb-2">データベース権限エラー</h1>
                <p className="text-[#ea2b2b] font-bold mb-6 text-xs md:text-sm">Missing or insufficient permissions.</p>
                <div
                    className="text-xs md:text-sm text-[#4b4b4b] max-w-md w-full bg-white p-4 md:p-6 rounded-2xl border-2 border-gray-200 shadow-sm text-left space-y-4">
                    <p className="font-black text-black text-base md:text-lg border-b pb-2">解決方法 (How to fix):</p>
                    <div className="space-y-1">
                        <p className="font-bold text-[#ff9600]">A. 独自のFirebaseを使用している場合</p>
                        <p className="text-[10px] md:text-xs font-bold leading-relaxed">
                            Firestore Databaseの「ルール (Rules)」タブを開き、アクセス権限を許可（テストモード）に変更して公開してください。
                        </p>
                        <code
                            className="block bg-gray-50 p-2 md:p-3 mt-2 text-[10px] md:text-xs rounded-xl border border-gray-100 text-gray-800 font-mono">
                            allow read, write: if true;
                        </code>
                    </div>
                    <div className="space-y-1 pt-2">
                        <p className="font-bold text-[#1cb0f6]">B. デフォルト環境で友達にシェアした場合</p>
                        <p className="text-[10px] md:text-xs font-bold leading-relaxed">
                            サンドボックスのデータベースは作成者しかアクセスできません。全体公開するには、アプリのコード内に独自のFirebase
                            Configを設定する必要があります。
                        </p>
                    </div>
                </div>
                <Button onClick={() => window.location.reload()} className="mt-6 md:mt-8 shadow-md">再読み込み
                    (Reload)</Button>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="min-h-[100dvh] bg-[#f7f7f8] flex flex-col items-center justify-center p-6 text-center"
                 style={{fontFamily: PRINT_FONT}}>
                <div className="text-[#ea2b2b] mb-4"><X size={56} strokeWidth={3}/></div>
                <h1 className="text-xl md:text-2xl font-black text-[#3c3c3c] mb-2">認証エラー (Auth Error)</h1>
                <p className="text-[#ea2b2b] font-bold mb-4 break-all text-xs md:text-sm">{authError.message}</p>
                <div
                    className="text-xs md:text-sm text-[#4b4b4b] max-w-md w-full bg-white p-4 md:p-6 rounded-2xl border-2 border-gray-200 shadow-sm text-left">
                    <p className="mb-3 font-black text-black text-base md:text-lg border-b pb-2">独自のFirebaseを使用している場合、以下の設定が必要です：</p>
                    <ol className="list-decimal pl-5 space-y-2 font-bold text-[10px] md:text-xs leading-relaxed">
                        <li>Firebase Consoleで <b>Authentication (認証)</b> を開く</li>
                        <li><b>Sign-in method (ログイン方法)</b> タブを選択する</li>
                        <li><b>Anonymous (匿名)</b> プロバイダを有効にして保存する</li>
                        <li>Cloud Firestoreデータベースが作成されていることを確認する</li>
                    </ol>
                </div>
                <Button onClick={() => window.location.reload()} className="mt-6 md:mt-8 shadow-md">再読み込み
                    (Reload)</Button>
            </div>
        );
    }

    if (!isAuthReady) {
        return (
            <div className="min-h-[100dvh] bg-[#f7f7f8] flex items-center justify-center">
                <div
                    className="animate-pulse text-[#afafaf] font-bold text-base md:text-lg tracking-widest uppercase">Connecting...
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <div
                className="min-h-[100dvh] bg-[#f7f7f8] text-[#3c3c3c] font-sans flex justify-center overflow-hidden selection:bg-[#1cb0f6] selection:text-white transition-colors duration-500">
                <div className="w-full max-w-5xl px-0 sm:px-6 h-[100dvh] flex flex-col relative"
                     style={{fontFamily: "\"Nunito\", \"Segoe UI\", system-ui, sans-serif"}}>
                    {mode === "menu" && <MainMenu onSelectMode={setMode} bestScores={bestScores} activeFont={activeFont}
                                                  onToggleFont={() => setUseHandwriting(!useHandwriting)}
                                                  isHandwriting={useHandwriting} learnedCount={currentLearnedCount}
                                                  alphabet={alphabet} setAlphabet={setAlphabet}
                                                  globalAutoPlay={globalAutoPlay} setGlobalAutoPlay={setGlobalAutoPlay}
                                                  onResetProgress={handleResetProgress}
                                                  currentDataSet={currentDataSet}/>}
                    {mode === "learn" && <LearnScreen onBack={() => setMode("menu")} activeFont={activeFont}
                                                      onCharLearned={handleCharLearned} currentDataSet={currentDataSet}
                                                      alphabet={alphabet} globalAutoPlay={globalAutoPlay}/>}
                    {mode === "practice" && <PracticeScreen onBack={() => setMode("menu")} activeFont={activeFont}
                                                            currentDataSet={currentDataSet} alphabet={alphabet}/>}
                    {mode === "quiz" && <QuizScreen onBack={() => setMode("menu")} activeFont={activeFont}
                                                    currentDataSet={currentDataSet} alphabet={alphabet}/>}
                    {mode === "chart" &&
                        <ChartScreen onBack={() => setMode("menu")} activeFont={activeFont} learnedChars={learnedChars}
                                     currentDataSet={currentDataSet} alphabet={alphabet}/>}
                    {mode === "survival" &&
                        <SurvivalScreen onBack={() => setMode("menu")} currentUser={user} bestScores={bestScores}
                                        playerName={playerName} onSaveScore={updateBestScore} setDbError={setDbError}
                                        activeFont={activeFont} currentDataSet={currentDataSet} alphabet={alphabet}/>}
                </div>
            </div>
        </>
    );
}