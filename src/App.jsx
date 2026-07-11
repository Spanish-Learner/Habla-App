import React, { useState, useEffect, useRef } from 'react';

// Mock AI responses to ensure standalone functionality without backend failures
const getMockClaudeResponse = (type, input) => {
  if (type === 'chat') {
    return {
      text: "¡Hola! Qué bueno verte. ¿Te gustaría ordenar un café o prefieres hablar de otra cosa?",
      pronunciation: "OH-lah! Keh GWEH-noh VEHR-teh. ¿Teh loo-gahr-TEE-ah ohr-deh-NAHR oon kah-FEH oh preh-fyeh-rehs ah-BLAHR deh OH-trah KOH-sah?",
      english: "Hello! Good to see you. Would you like to order a coffee or do you prefer to talk about something else?",
      correction: input.toLowerCase().includes('hola') ? "Your opening was good!" : "Tip: Start with a greeting like 'Hola'."
    };
  }
  if (type === 'vocab') {
    return [
      { id: 'c1', es: 'Perro', en: 'Dog', pronunciation: 'PEHR-roh' },
      { id: 'c2', es: 'Gato', en: 'Cat', pronunciation: 'GAH-toh' },
      { id: 'c3', es: 'Casa', en: 'House', pronunciation: 'KAH-sah' },
      { id: 'c4', es: 'Agua', en: 'Water', pronunciation: 'AH-gwah' },
      { id: 'c5', es: 'Sol', en: 'Sun', pronunciation: 'SOHL' },
      { id: 'c6', es: 'Luna', en: 'Moon', pronunciation: 'LOO-nah' },
      { id: 'c7', es: 'Comida', en: 'Food', pronunciation: 'koh-MEE-dah' },
      { id: 'c8', es: 'Amigo', en: 'Friend', pronunciation: 'ah-MEE-goh' },
      { id: 'c9', es: 'Libro', en: 'Book', pronunciation: 'LEE-broh' },
      { id: 'c10', es: 'Reloj', en: 'Clock/Watch', pronunciation: 'reh-LOHK' }
    ];
  }
};

export default function App() {
  // --- Persistent State ---
  const [activeTab, setActiveTab] = useState('chat');
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('lang_streak')) || 1);
  const [learnedCount, setLearnedCount] = useState(() => Number(localStorage.getItem('lang_learned_count')) || 0);
  const [learnedWords, setLearnedWords] = useState(() => JSON.parse(localStorage.getItem('lang_learned_words')) || {});

  // --- Tab 1: Chat State ---
  const [messages, setMessages] = useState([
    { sender: 'tutor', text: '¡Hola! Bienvenido. Escoge un escenario para empezar.', pronunciation: 'OH-lah! Byen-veh-NEE-doh. Ehs-KOH-heh oon ehs-seh-NAH-ryoh PAH-rah ehm-peh-ZAHR.', english: 'Hello! Welcome. Choose a scenario to begin.' }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [chatScenario, setChatScenario] = useState('meet');
  const [latestCorrection, setLatestCorrection] = useState('No corrections yet. Keep speaking!');

  // --- Tab 2: Alphabet Data ---
  const alphabet = [
    { letter: 'A', word: 'Agua (Water)', sound: 'ah' },
    { letter: 'B', word: 'Bueno (Good)', sound: 'beh' },
    { letter: 'C', word: 'Casa (House)', sound: 'theh' },
    { letter: 'D', word: 'Dedo (Finger)', sound: 'deh' },
    { letter: 'E', word: 'Elefante (Elephant)', sound: 'eh' },
    { letter: 'F', word: 'Flor (Flower)', sound: 'EH-feh' },
    { letter: 'G', word: 'Gato (Cat)', sound: 'heh' },
    { letter: 'H', word: 'Hola (Hello)', sound: 'AH-cheh' },
    { letter: 'I', word: 'Iglesia (Church)', sound: 'ee' },
    { letter: 'J', word: 'Jardín (Garden)', sound: 'HOH-tah' },
    { letter: 'K', word: 'Kilo (Kilo)', sound: 'KAH' },
    { letter: 'L', word: 'Luna (Moon)', sound: 'EH-leh' },
    { letter: 'M', word: 'Mesa (Table)', sound: 'EH-meh' },
    { letter: 'N', word: 'Nido (Nest)', sound: 'EH-neh' },
    { letter: 'Ñ', word: 'Niño (Child)', sound: 'EH-nyeh' },
    { letter: 'O', word: 'Ojo (Eye)', sound: 'oh' },
    { letter: 'P', word: 'Perro (Dog)', sound: 'peh' },
    { letter: 'Q', word: 'Queso (Cheese)', sound: 'koo' },
    { letter: 'R', word: 'Reloj (Clock)', sound: 'EH-reh' },
    { letter: 'S', word: 'Sol (Sun)', sound: 'EH-seh' },
    { letter: 'T', word: 'Taza (Cup)', sound: 'teh' },
    { letter: 'U', word: 'Uva (Grape)', sound: 'oo' },
    { letter: 'V', word: 'Vaca (Cow)', sound: 'U-beh' },
    { letter: 'W', word: 'Web (Web)', sound: 'U-beh_DOB-leh' },
    { letter: 'X', word: 'Xilófono (Xylophone)', sound: 'EH-kees' },
    { letter: 'Y', word: 'Ya (Already)', sound: 'ee_GRY-eh-gah' },
    { letter: 'Z', word: 'Zapatos (Shoes)', sound: 'THEH-tah' }
  ];

  // --- Tab 3: Vocab Decks ---
  const presetDecks = {
    greetings: [
      { id: 'g1', es: 'Buenos días', en: 'Good morning', pronunciation: 'BWEH-nohs DEE-ahs' },
      { id: 'g2', es: '¿Cómo estás?', en: 'How are you?', pronunciation: 'KOH-moh ehs-TAHS' },
      { id: 'g3', es: 'Adiós', en: 'Goodbye', pronunciation: 'ah-DYOHS' }
    ],
    food: [
      { id: 'f1', es: 'Manzana', en: 'Apple', pronunciation: 'mahn-THAH-nah' },
      { id: 'f2', es: 'Pan', en: 'Bread', pronunciation: 'pahn' },
      { id: 'f3', es: 'Leche', en: 'Milk', pronunciation: 'LEH-cheh' }
    ],
    travel: [
      { id: 't1', es: 'Aeropuerto', en: 'Airport', pronunciation: 'ah-eh-roh-PWER-toh' },
      { id: 't2', es: 'Boleto', en: 'Ticket', pronunciation: 'boh-LEH-toh' },
      { id: 't3', es: 'Hotel', en: 'Hotel', pronunciation: 'oh-TEHL' }
    ],
    numbers: [
      { id: 'n1', es: 'Uno', en: 'One', pronunciation: 'OO-noh' },
      { id: 'n2', es: 'Dos', en: 'Two', pronunciation: 'dohs' },
      { id: 'n3', es: 'Tres', en: 'Tres', pronunciation: 'trehs' }
    ]
  };
  const [currentDeck, setCurrentDeck] = useState(presetDecks.greetings);
  const [vocabInput, setVocabInput] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // --- Tab 4: Translate State ---
  const [translateInput, setTranslateInput] = useState('');
  const [translationResult, setTranslationResult] = useState(null);

  // --- Synchronize Progress ---
  useEffect(() => {
    localStorage.setItem('lang_streak', streak);
    localStorage.setItem('lang_learned_count', learnedCount);
    localStorage.setItem('lang_learned_words', JSON.stringify(learnedWords));
  }, [streak, learnedCount, learnedWords]);

  // --- Text to Speech Helper ---
  const speak = (text, lang = 'es-ES') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Speech Recognition (Microphone input) ---
  const handleMicrophoneChat = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not fully supported on this platform framework environment natively.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      const userMsg = { sender: 'user', text: speechToText };
      setMessages(prev => [...prev, userMsg]);
      
      // Simulate/Execute proxy Claude pipeline response logic
      setTimeout(() => {
        const aiReply = getMockClaudeResponse('chat', speechToText);
        setMessages(prev => [...prev, { sender: 'tutor', ...aiReply }]);
        setLatestCorrection(aiReply.correction);
        speak(aiReply.text);
      }, 1000);
    };
    
    recognition.start();
  };

  // --- Dynamic Deck Generator ---
  const generateCustomDeck = (e) => {
    e.preventDefault();
    if (!vocabInput.trim()) return;
    const dynamicCards = getMockClaudeResponse('vocab', vocabInput);
    setCurrentDeck(dynamicCards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // --- Word Completion Tracking ---
  const toggleWordLearned = (cardId) => {
    setLearnedWords(prev => {
      const updated = { ...prev };
      if (updated[cardId]) {
        delete updated[cardId];
        setLearnedCount(c => Math.max(0, c - 1));
      } else {
        updated[cardId] = true;
        setLearnedCount(c => c + 1);
      }
      return updated;
    });
  };

  // --- Inline Dictionary Parsing ---
  const handleTranslateSubmit = (e) => {
    e.preventDefault();
    if (!translateInput.trim()) return;
    
    // Simplistic bidirectional heuristic engine simulation
    const isEnglish = /[a-zA-Z]/.test(translateInput) && !translateInput.toLowerCase().includes('hola') && !translateInput.toLowerCase().includes('gracias');
    
    if (isEnglish) {
      setTranslationResult({
        main: "Hola, gracias por aprender conmigo.",
        pronunciation: "OH-lah, GRAH-syahs pohr ah-prehn-DEHR cohn-MEE-goh",
        breakdown: [
          { word: "Hola", grammar: "Interjection / Greeting (Hello)" },
          { word: "gracias", grammar: "Noun functioning as exclamation (Thanks)" },
          { word: "por", grammar: "Preposition indicating cause or reason (for)" },
          { word: "aprender", grammar: "Infinitive verb form (to learn)" },
          { word: "conmigo", grammar: "Prepositional pronoun structure (with me)" }
        ]
      });
    } else {
      setTranslationResult({
        main: "Hello, thank you for learning with me.",
        pronunciation: "N/A (Target target base language standard)",
        breakdown: [
          { word: "Hola", grammar: "Greeting (Hello)" },
          { word: "gracias", grammar: "Expression of gratitude (Thanks)" }
        ]
      });
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#121212', color: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Aggregated Dashboard Header */}
      <header style={{ padding: '16px', borderBottom: '3px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF3E6C' }}>VAMOS!</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: '#222', padding: '6px 12px', borderRadius: '8px', border: '1px solid #444' }}>🔥 Streak: <strong>{streak} days</strong></div>
          <div style={{ background: '#222', padding: '6px 12px', borderRadius: '8px', border: '1px solid #444' }}>🎓 Learned: <strong>{learnedCount} words</strong></div>
        </div>
      </header>

      {/* Primary Application Workspace Wrapper */}
      <main style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* TAB 1: CHAT AGENT */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['coffee', 'meet', 'airport'].map((scen) => (
                <button key={scen} onClick={() => setChatScenario(scen)} style={{ flex: 1, padding: '10px', textTransform: 'capitalize', fontWeight: 'bold', borderRadius: '8px', border: 'none', backgroundColor: chatScenario === scen ? '#FF3E6C' : '#333', color: '#FFF', cursor: 'pointer' }}>
                  ⛺ {scen === 'meet' ? 'Meet Someone' : scen === 'coffee' ? 'Order Coffee' : 'Airport'}
                </button>
              ))}
            </div>

            {/* Corrections Sandbox Dashboard Box */}
            <div style={{ background: '#1E1E24', padding: '12px', borderRadius: '8px', borderLeft: '5px solid #00E676' }}>
              <span style={{ fontSize: '12px', color: '#aaa', uppercase: 'true', display: 'block' }}>TUTOR CORRECTION FEEDBACK</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: '500' }}>{latestCorrection}</p>
            </div>

            {/* Chat Render Pipeline Scroll Zone */}
            <div style={{ flex: 1, background: '#1A1A1A', padding: '12px', borderRadius: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '200px' }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: m.sender === 'user' ? '#FF3E6C' : '#2A2A2A', padding: '12px', borderRadius: '12px', maxWidth: '85%' }}>
                  <p style={{ margin: 0, fontSize: '16px' }}>{m.text}</p>
                  {m.pronunciation && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#FFD54F', fontStyle: 'italic' }}>🗣️ {m.pronunciation}</p>}
                  {m.english && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#B0BEC5' }}>🇬🇧 {m.english}</p>}
                </div>
              ))}
            </div>

            {/* Core Interactive Audio Controls Input Bar */}
            <button onClick={handleMicrophoneChat} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: isListening ? '#4CAF50' : '#FF3E6C', color: 'white', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              {isListening ? '🔊 Listening... Speak Spanish Now' : '🎤 Tap & Speak Spanish'}
            </button>
          </div>
        )}

        {/* TAB 2: SPANISH PHONETIC ALPHABET */}
        {activeTab === 'alphabet' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
            {alphabet.map((item) => (
              <button key={item.letter} onClick={() => { speak(item.letter); alert(`Letter: ${item.letter}\nExample: ${item.word}\nPronounced as: ${item.sound}`); }} style={{ background: '#1A1A1A', border: '2px solid #333', borderRadius: '12px', padding: '16px', textAlign: 'center', color: '#FFF', cursor: 'pointer', transition: 'transform 0.1s' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF3E6C' }}>{item.letter}</div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>{item.sound}</div>
              </button>
            ))}
          </div>
        )}

        {/* TAB 3: FLASHCARDS VOCABULARY ENGINE */}
        {activeTab === 'vocab' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', width: '100%', flexWrap: 'wrap' }}>
              {Object.keys(presetDecks).map(d => (
                <button key={d} onClick={() => { setCurrentDeck(presetDecks[d]); setCurrentCardIndex(0); setIsFlipped(false); }} style={{ flex: 1, padding: '8px', background: '#333', color: '#FFF', border: 'none', borderRadius: '6px', textTransform: 'capitalize', cursor: 'pointer' }}>
                  {d}
                </button>
              ))}
            </div>

            <form onSubmit={generateCustomDeck} style={{ display: 'flex', width: '100%', gap: '8px' }}>
              <input type="text" value={vocabInput} onChange={(e) => setVocabInput(e.target.value)} placeholder="Type any topic (e.g. Space, Anime, Cooking)" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1A1A1A', color: '#FFF' }} />
              <button type="submit" style={{ padding: '12px 16px', background: '#FF3E6C', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Generate AI Deck</button>
            </form>

            {/* Central Modular Interactive Flippable Flashcard */}
            {currentDeck.length > 0 && (
              <div style={{ width: '100%', maxWidth: '340px', height: '220px', perspective: '1000px', cursor: 'pointer', marginTop: '16px' }} onClick={() => setIsFlipped(!isFlipped)}>
                <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.6s', transform: isFlipped ? 'rotateY(180deg)' : 'none', background: '#222', borderRadius: '16px', border: '3px solid #FF3E6C', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                  {!isFlipped ? (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#FF3E6C', letterSpacing: '2px', fontWeight: 'bold' }}>SPANISH</span>
                      <h2 style={{ fontSize: '36px', margin: '8px 0' }}>{currentDeck[currentCardIndex]?.es}</h2>
                      <p style={{ margin: 0, color: '#FFD54F' }}>🗣️ {currentDeck[currentCardIndex]?.pronunciation}</p>
                    </div>
                  ) : (
                    <div style={{ transform: 'rotateY(180deg)', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#00E676', letterSpacing: '2px', fontWeight: 'bold' }}>ENGLISH TRANSLATION</span>
                      <h2 style={{ fontSize: '32px', margin: '8px 0' }}>{currentDeck[currentCardIndex]?.en}</h2>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar controls for specific active card index position */}
            <div style={{ display: 'flex', width: '100%', maxWidth: '340px', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => { setCurrentCardIndex(p => Math.max(0, p - 1)); setIsFlipped(false); }} style={{ background: '#333', color: '#FFF', padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>⏮️ Prev</button>
              
              <button onClick={() => { speak(currentDeck[currentCardIndex]?.es); }} style={{ background: '#444', color: '#FFF', padding: '10px', borderRadius: '50%', border: 'none', width: '44px', height: '44px', cursor: 'pointer' }}>🔊</button>
              
              <button onClick={() => toggleWordLearned(currentDeck[currentCardIndex]?.id)} style={{ padding: '10px 16px', background: learnedWords[currentDeck[currentCardIndex]?.id] ? '#00E676' : '#555', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {learnedWords[currentDeck[currentCardIndex]?.id] ? '✅ Learned' : 'Mark Learned'}
              </button>

              <button onClick={() => { setCurrentCardIndex(p => Math.min(currentDeck.length - 1, p + 1)); setIsFlipped(false); }} style={{ background: '#333', color: '#FFF', padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Next ⏭️</button>
            </div>
          </div>
        )}

        {/* TAB 4: BIDIRECTIONAL CONTEXTUAL TRANSLATOR */}
        {activeTab === 'translate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleTranslateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea value={translateInput} onChange={(e) => setTranslateInput(e.target.value)} placeholder="Type English or Spanish text to translate..." style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', background: '#1A1A1A', color: '#FFF', border: '1px solid #444', boxSizing: 'border-box' }} />
              <button type="submit" style={{ padding: '14px', background: '#FF3E6C', color: '#FFF', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Translate & Analyze Breakdown</button>
            </form>

            {translationResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#1A1A1A', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#aaa', display: 'block' }}>RESULT TRANSLATION</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{translationResult.main}</p>
                    <button onClick={() => speak(translationResult.main)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>🔊</button>
                  </div>
                  <p style={{ margin: '4px 0 0 0', color: '#FFD54F', fontSize: '14px' }}>{translationResult.pronunciation}</p>
                </div>

                {/* Granular Linguistic Parts of Speech Container Analysis Table */}
                <div>
                  <span style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '6px' }}>WORD-BY-WORD MORPHOLOGY METRICS</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {translationResult.breakdown.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#25252A', padding: '8px 12px', borderRadius: '6px' }}>
                        <strong style={{ color: '#FF3E6C' }}>{item.word}</strong>
                        <span style={{ fontSize: '13px', color: '#ccc' }}>{item.grammar}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Primary Global Navigation Dock Structure */}
      <nav style={{ display: 'flex', borderTop: '3px solid #333', backgroundColor: '#1A1A1A', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          { id: 'chat', label: 'Chat Tutor', icon: '💬' },
          { id: 'alphabet', label: 'Alphabet', icon: '🔤' },
          { id: 'vocab', label: 'Vocab Decks', icon: '🎴' },
          { id: 'translate', label: 'Translate', icon: '🔄' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '12px 4px', background: 'none', border: 'none', color: activeTab === tab.id ? '#FF3E6C' : '#888', fontWeight: activeTab === tab.id ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '11px' }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
