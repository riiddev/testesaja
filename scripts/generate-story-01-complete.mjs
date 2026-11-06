import fs from "fs";
import path from "path";

// Read existing story-01
const existingStory = JSON.parse(fs.readFileSync("src/data/stories/story-01.json", "utf8"));
const ep1 = existingStory.episodes[0];
const ep2 = existingStory.episodes[1];

// Episode 3: Boleh Saya Duduk di Sini? (May I Sit Here?)
const ep3 = {
  id: 3,
  number: 3,
  title: "Boleh Saya Duduk di Sini?",
  titleEn: "May I Sit Here?",
  estimatedMinutes: 10,
  recap: "Setelah menikmati beberapa teguk cappuccino hangat di meja empat dekat jendela 'The Corner Cup', suasana kafe semakin ramai. Seorang pemuda berjaket biru membawa ransel dan kamera profesional mendekati tokomu.",
  dialogue: [
    {
      id: "ep3_d1",
      speaker: "Narator",
      en: "The morning sun fills the café. Many people are chatting and drinking coffee.",
      idText: "Sinar matahari pagi memenuhi kedai kopi. Banyak orang sedang mengobrol dan menikmati kopi."
    },
    {
      id: "ep3_d2",
      speaker: "Stranger",
      en: "Excuse me, is this seat taken? The café is very crowded this morning.",
      idText: "Permisi, apakah kursi ini sudah ada yang menempati? Kedai kopi ini sangat padat pagi ini."
    },
    {
      id: "ep3_choice_1",
      type: "interactive_choice",
      prompt: "Bagaimana caramu mengizinkannya duduk dengan ramah?",
      options: [
        {
          id: "ep3_opt_1a",
          text: "No, it is not taken. Please, have a seat!",
          speakerReply: "Stranger",
          reactionEn: "Thank you so much! My name is Leo, by the way.",
          reactionId: "Terima kasih banyak! Ngomong-ngomong, namaku Leo."
        },
        {
          id: "ep3_opt_1b",
          text: "Of course! Please sit down. The chair is completely free.",
          speakerReply: "Stranger",
          reactionEn: "Appreciate it! I was worried I would have to drink my espresso standing up.",
          reactionId: "Terima kasih banyak! Tadinya kukira aku harus minum espresso sambil berdiri."
        }
      ]
    },
    {
      id: "ep3_d3",
      speaker: "You",
      en: "Nice to meet you, Leo. I just arrived in this city today.",
      idText: "Senang bertemu denganmu, Leo. Aku baru saja tiba di kota ini hari ini."
    },
    {
      id: "ep3_d4",
      speaker: "Leo",
      en: "Welcome! It is a wonderful place, but it can be busy in the morning.",
      idText: "Selamat datang! Tempat ini sangat indah, tapi memang bisa cukup sibuk di pagi hari."
    },
    {
      id: "ep3_d5",
      speaker: "Kanci",
      en: "Hebat! Kamu telah mempraktikkan etika berbagi meja (table sharing) dengan sangat sopan dan percaya diri!",
      idText: "Hebat! Kamu telah mempraktikkan etika berbagi meja (table sharing) dengan sangat sopan dan percaya diri!"
    }
  ],
  highlightedVocab: [
    {
      wordId: "batch-seat-noun",
      word: "seat",
      partOfSpeech: "noun",
      enDefinition: "A place to sit, such as a chair.",
      idMeaning: "kursi; tempat duduk",
      contextSentence: "Excuse me, is this seat taken?"
    },
    {
      wordId: "batch-table-noun",
      word: "table",
      partOfSpeech: "noun",
      enDefinition: "A piece of furniture with a flat top and legs.",
      idMeaning: "meja",
      contextSentence: "We share a small table near the window."
    },
    {
      wordId: "batch-sit-verb",
      word: "sit",
      partOfSpeech: "verb",
      enDefinition: "To rest with the body supported on the buttocks.",
      idMeaning: "duduk",
      contextSentence: "Please sit down and enjoy your drink."
    },
    {
      wordId: "batch-friend-noun",
      word: "friend",
      partOfSpeech: "noun",
      enDefinition: "A person you know well and like.",
      idMeaning: "teman; kawan",
      contextSentence: "It is nice to make a new friend on your first day."
    },
    {
      wordId: "batch-near-preposition",
      word: "near",
      partOfSpeech: "preposition",
      enDefinition: "Not far away in distance.",
      idMeaning: "dekat; di dekat",
      contextSentence: "Our table is near the front door."
    },
    {
      wordId: "batch-crowded-adjective",
      word: "crowded",
      partOfSpeech: "adjective",
      enDefinition: "Full of people.",
      idMeaning: "ramai; padat orang",
      contextSentence: "The coffee shop is crowded this morning."
    }
  ],
  grammarFocus: {
    title: "Kalimat Izin Sopan: 'Is this seat taken?' & 'May I...?'",
    topicId: "present-simple",
    explanation: "Dalam situasi publik seperti kafe atau transportasi umum, gunakan frasa 'Is this seat taken?' (Apakah kursi ini ada orangnya?) atau 'May I sit here?' untuk meminta izin duduk dengan sopan tanpa terkesan memaksa.",
    formula: "Is this seat taken? / May I sit here, please?"
  },
  culturalTip: {
    title: "Etika Berbagi Meja (Table Sharing) di Kedai Kopi",
    content: "Di kota-kota besar di luar negeri yang padat saat jam sibuk, berbagi meja (table sharing) adalah hal yang sangat wajar. Selalu tanyakan izin sebelum menarik kursi, dan hormati ruang pribadi orang lain selama menikmati hidangan."
  },
  quiz: [
    {
      id: "s1_ep3_q1",
      question: "What is the most polite and natural way to ask if an empty chair is available in a cafe?",
      options: [
        "Give me this chair immediately!",
        "Excuse me, is this seat taken?",
        "Why are you sitting alone here?",
        "This chair is mine now."
      ],
      correctIndex: 1,
      explanation: "'Excuse me, is this seat taken?' adalah ungkapan standar internasional yang sangat sopan untuk menanyakan kursi kosong."
    },
    {
      id: "s1_ep3_q2",
      question: "What does the word 'crowded' mean in the sentence: 'The cafe is very crowded'?",
      options: [
        "Penuh dan dipadati banyak orang",
        "Sepi dan hening tanpa pengunjung",
        "Sangat kotor dan berantakan",
        "Sangat mahal harganya"
      ],
      correctIndex: 0,
      explanation: "'Crowded' berarti dipadati oleh banyak orang (ramai pengunjung)."
    },
    {
      id: "s1_ep3_q3",
      question: "What is the name of the new person who sits at your table?",
      options: [
        "Arthur",
        "Leo",
        "David",
        "Sarah"
      ],
      correctIndex: 1,
      explanation: "Pemuda pembawa kamera memperkenalkan namanya sebagai Leo ('My name is Leo, by the way')."
    },
    {
      id: "s1_ep3_q4",
      question: "Which of the following is a polite affirmative reply when someone asks to sit down?",
      options: [
        "Go away, I do not like you.",
        "Of course, please have a seat!",
        "No, you cannot breathe here.",
        "I need all chairs in this room."
      ],
      correctIndex: 1,
      explanation: "'Of course, please have a seat!' mempersilakan orang lain duduk dengan hangat dan ramah."
    },
    {
      id: "s1_ep3_q5",
      question: "Complete the polite request: 'May I ______ here, please?'",
      options: [
        "sit",
        "sitting",
        "sat",
        "sits"
      ],
      correctIndex: 0,
      explanation: "Setelah modal verb 'May', kita selalu menggunakan kata kerja bentuk dasar (base form / bare infinitive), yaitu 'sit'."
    }
  ],
  summary: {
    takeaways: [
      "Menguasai ungkapan sopan meminta izin kursi: 'Is this seat taken?'",
      "Merespon permintaan orang asing dengan ramah: 'Please, have a seat!'",
      "Memahami budaya berbagi meja (table sharing) di kedai kopi metropolitan."
    ]
  },
  cliffhanger: "Leo meletakkan kameranya di meja dan melirik ransel besarmu. 'Kamu tampak seperti pengelana yang baru tiba. Dari mana asalmu?'"
};

// Episode 4: Dari Mana Asalmu? (Where Are You From?)
const ep4 = {
  id: 4,
  number: 4,
  title: "Dari Mana Asalmu?",
  titleEn: "Where Are You From?",
  estimatedMinutes: 10,
  recap: "Leo duduk di depanmu sambil menikmati secangkir espresso. Percakapan santai (small talk) pun dimulai, dan Leo tertarik mengetahui asal-usulmu.",
  dialogue: [
    {
      id: "ep4_d1",
      speaker: "Leo",
      en: "So, where are you from? I hear a friendly accent in your voice.",
      idText: "Jadi, dari mana asalmu? Aku mendengar aksen ramah dalam suaramu."
    },
    {
      id: "ep4_choice_1",
      type: "interactive_choice",
      prompt: "Bagaimana caramu menjelaskan asal negaramu dengan jelas?",
      options: [
        {
          id: "ep4_opt_1a",
          text: "I am from Indonesia. It is a beautiful tropical country in Southeast Asia.",
          speakerReply: "Leo",
          reactionEn: "Awesome! I have always wanted to visit Bali and see the temples.",
          reactionId: "Keren sekali! Aku selalu ingin mengunjungi Bali dan melihat candi-candinya."
        },
        {
          id: "ep4_opt_1b",
          text: "I come from Indonesia. I traveled very far to study and learn English here.",
          speakerReply: "Leo",
          reactionEn: "That is fantastic! Your English sounds very clear and confident.",
          reactionId: "Luar biasa! Bahasa Inggrismu terdengar sangat jelas dan percaya diri."
        }
      ]
    },
    {
      id: "ep4_d2",
      speaker: "You",
      en: "Thank you, Leo. What about you? Are you from this city?",
      idText: "Terima kasih, Leo. Bagaimana denganmu? Apakah kamu berasal dari kota ini?"
    },
    {
      id: "ep4_d3",
      speaker: "Leo",
      en: "Yes, I was born right here. But the people and the weather change every season!",
      idText: "Ya, aku lahir tepat di sini. Tapi orang-orang dan cuaca selalu berubah di setiap musim!"
    },
    {
      id: "ep4_d4",
      speaker: "Kanci",
      en: "Bagus sekali! Membalikkan pertanyaan dengan 'What about you?' membuat percakapan terasa hidup dan seimbang!",
      idText: "Bagus sekali! Membalikkan pertanyaan dengan 'What about you?' membuat percakapan terasa hidup dan seimbang!"
    }
  ],
  highlightedVocab: [
    {
      wordId: "batch-country-noun",
      word: "country",
      partOfSpeech: "noun",
      enDefinition: "An area of land that has its own government and border.",
      idMeaning: "negara; negeri",
      contextSentence: "Indonesia is a beautiful archipelago country."
    },
    {
      wordId: "batch-travel-verb",
      word: "travel",
      partOfSpeech: "verb",
      enDefinition: "To go from one place to another.",
      idMeaning: "bepergian; melakukan perjalanan",
      contextSentence: "I love to travel to new cities and meet new people."
    },
    {
      wordId: "batch-learn-verb",
      word: "learn",
      partOfSpeech: "verb",
      enDefinition: "To gain knowledge or skill in a new subject.",
      idMeaning: "belajar; mempelajari",
      contextSentence: "I came here to learn English and gain new experience."
    },
    {
      wordId: "batch-people-noun",
      word: "people",
      partOfSpeech: "noun",
      enDefinition: "Human beings in general or of a particular group.",
      idMeaning: "orang-orang; masyarakat",
      contextSentence: "The people in this town are very polite."
    },
    {
      wordId: "batch-weather-noun",
      word: "weather",
      partOfSpeech: "noun",
      enDefinition: "The state of the atmosphere with respect to wind, temperature, and moisture.",
      idMeaning: "cuaca",
      contextSentence: "The morning weather is crisp and cool."
    },
    {
      wordId: "batch-different-adjective",
      word: "different",
      partOfSpeech: "adjective",
      enDefinition: "Not the same as another or each other.",
      idMeaning: "berbeda; berlainan",
      contextSentence: "The architecture here is very different from home."
    }
  ],
  grammarFocus: {
    title: "Menyatakan Asal Negara: 'I am from...' & 'Where are you from?'",
    topicId: "present-simple",
    explanation: "Gunakan pola 'Subject + am/is/are + from + Nama Tempat' untuk menyatakan asal tempat tinggal atau kewarganegaraan. Untuk bertanya kembali dengan sopan, gunakan 'What about you?'.",
    formula: "I am from [Place]. / Where are you from?"
  },
  culturalTip: {
    title: "Seni 'Small Talk' dan Rasa Ingin Tahu Ramah",
    content: "Di budaya Barat, bertanya 'Where are you from?' pada pendatang baru adalah tanda ketertarikan ramah untuk membuka percakapan, bukan interogasi. Cukup sebutkan negara atau kota asalmu dengan senyum percaya diri."
  },
  quiz: [
    {
      id: "s1_ep4_q1",
      question: "Which question is used to ask about someone's origin or home country?",
      options: [
        "What time is your lunch?",
        "Where are you from?",
        "Why do you have two shoes?",
        "When does the bus finish?"
      ],
      correctIndex: 1,
      explanation: "'Where are you from?' adalah pertanyaan baku untuk menanyakan asal daerah atau negara seseorang."
    },
    {
      id: "s1_ep4_q2",
      question: "What is the correct response to 'Where are you from?'",
      options: [
        "I am from Indonesia.",
        "I like eating coffee.",
        "Yes, I am yesterday.",
        "Because it is very green."
      ],
      correctIndex: 0,
      explanation: "'I am from [Nama Negara/Kota]' adalah struktur jawaban yang tepat."
    },
    {
      id: "s1_ep4_q3",
      question: "How do you politely return a question back to your conversation partner?",
      options: [
        "Stop talking to me.",
        "What about you?",
        "Give me your bag.",
        "I don't care about you."
      ],
      correctIndex: 1,
      explanation: "'What about you?' atau 'How about you?' digunakan untuk membalikkan pertanyaan secara sopan."
    },
    {
      id: "s1_ep4_q4",
      question: "What does the word 'different' mean in Indonesian?",
      options: [
        "Sama persis",
        "Berbeda",
        "Sangat lambat",
        "Murah"
      ],
      correctIndex: 1,
      explanation: "'Different' berarti berbeda atau berlainan."
    },
    {
      id: "s1_ep4_q5",
      question: "Choose the correct verb form: 'Many people ______ to this city every year.'",
      options: [
        "travel",
        "travels",
        "traveling",
        "traveled to"
      ],
      correctIndex: 0,
      explanation: "Subjek 'people' berbentuk jamak (plural), sehingga kata kerja bentuk Present Simple menggunakan 'travel' (tanpa akhiran -s)."
    }
  ],
  summary: {
    takeaways: [
      "Mampu memperkenalkan asal negara dengan percaya diri.",
      "Menggunakan frasa pembalik percakapan 'What about you?'",
      "Memahami esensi 'small talk' sebagai jembatan silaturahmi antarbudaya."
    ]
  },
  cliffhanger: "Ponselmu tiba-tiba bergetar di atas meja. Sebuah pesan masuk dari pengelola kos: 'Kunci kamarmu disimpan di kotak pos Maple Lodge No. 7. Harap tiba sebelum pukul 13.00 WIB!' Kamu melihat jam, tersisa 45 menit lagi!"
};

// Episode 5: Peta dan Rencana (The Map and the Plan)
const ep5 = {
  id: 5,
  number: 5,
  title: "Peta dan Rencana",
  titleEn: "The Map and the Plan",
  estimatedMinutes: 10,
  recap: "Pesan dari pengelola kos membuatmu harus bergegas. Kamu perlu mencari jalan tercepat menuju Maple Street sebelum pukul 13.00.",
  dialogue: [
    {
      id: "ep5_d1",
      speaker: "You",
      en: "Excuse me, Leo. I need to reach Maple Street before 1 PM. Do you know where it is?",
      idText: "Permisi, Leo. Aku harus sampai di Maple Street sebelum jam 1 siang. Apakah kamu tahu di mana itu?"
    },
    {
      id: "ep5_d2",
      speaker: "Leo",
      en: "Sure! Maple Street is not far. It is only about three blocks away.",
      idText: "Tentu! Maple Street tidak jauh. Hanya berjarak sekitar tiga blok dari sini."
    },
    {
      id: "ep5_choice_1",
      type: "interactive_choice",
      prompt: "Bagaimana kamu menanyakan petunjuk arah kepadanya?",
      options: [
        {
          id: "ep5_opt_1a",
          text: "Can you tell me how to get there on foot?",
          speakerReply: "Leo",
          reactionEn: "Walk straight out of the cafe, turn left at the corner, and walk two blocks.",
          reactionId: "Jalan lurus keluar kafe, belok kiri di sudut jalan, lalu jalan dua blok."
        },
        {
          id: "ep5_opt_1b",
          text: "Is it faster to take a bus or walk?",
          speakerReply: "Leo",
          reactionEn: "Walking is much faster! Traffic on Main Street is very crowded right now.",
          reactionId: "Jalan kaki jauh lebih cepat! Lalu lintas di Main Street sangat padat saat ini."
        }
      ]
    },
    {
      id: "ep5_d3",
      speaker: "Leo",
      en: "Turn right after the post office. Maple Street is right across from the park.",
      idText: "Belok kanan setelah kantor pos. Maple Street berada tepat di seberang taman kota."
    },
    {
      id: "ep5_d4",
      speaker: "Kanci",
      en: "Ingat kata kunci arah: 'turn left' (belok kiri), 'turn right' (belok kanan), dan 'go straight' (jalan lurus)!",
      idText: "Ingat kata kunci arah: 'turn left' (belok kiri), 'turn right' (belok kanan), dan 'go straight' (jalan lurus)!"
    }
  ],
  highlightedVocab: [
    {
      wordId: "batch-map-noun",
      word: "map",
      partOfSpeech: "noun",
      enDefinition: "A diagrammatic representation of an area of land or sea.",
      idMeaning: "peta",
      contextSentence: "Leo sketches a simple route on the paper map."
    },
    {
      wordId: "batch-street-noun",
      word: "street",
      partOfSpeech: "noun",
      enDefinition: "A public road in a city or town.",
      idMeaning: "jalan; jalan raya",
      contextSentence: "Maple Street is a quiet residential street."
    },
    {
      wordId: "batch-turn-verb",
      word: "turn",
      partOfSpeech: "verb",
      enDefinition: "To change direction when moving.",
      idMeaning: "berbelok; memutar",
      contextSentence: "Turn left at the traffic light."
    },
    {
      wordId: "batch-walk-verb",
      word: "walk",
      partOfSpeech: "verb",
      enDefinition: "To move at a regular pace by lifting and setting down each foot in turn.",
      idMeaning: "berjalan; jalan kaki",
      contextSentence: "You can walk to the train station in five minutes."
    },
    {
      wordId: "batch-left-adverb",
      word: "left",
      partOfSpeech: "adverb",
      enDefinition: "Toward or on the side of the human body which is toward the west when facing north.",
      idMeaning: "kiri; ke arah kiri",
      contextSentence: "The cafe entrance is on your left."
    },
    {
      wordId: "batch-right-adverb",
      word: "right",
      partOfSpeech: "adverb",
      enDefinition: "Toward or on the side of the human body which is toward the east when facing north.",
      idMeaning: "kanan; ke arah kanan",
      contextSentence: "Turn right after the post office."
    }
  ],
  grammarFocus: {
    title: "Memberi & Memahami Petunjuk Arah (Imperatives for Directions)",
    topicId: "present-simple",
    explanation: "Petunjuk arah menggunakan kalimat perintah (imperative sentence) yang diawali kata kerja dasar tanpa subjek, seperti 'Turn left', 'Turn right', atau 'Go straight'.",
    formula: "Turn + left / right. / Walk + for + [Distance]. / Go straight."
  },
  culturalTip: {
    title: "Memahami Sistem 'City Block' di Tata Kota Luar Negeri",
    content: "Di banyak kota mancanegara, jarak sering kali diukur dalam satuan 'blocks' (jarak antar persimpangan jalan). Satu blok biasanya berjarak 100–200 meter."
  },
  quiz: [
    {
      id: "s1_ep5_q1",
      question: "What does 'Turn left at the corner' mean in Indonesian?",
      options: [
        "Belok kanan di perempatan",
        "Belok kiri di sudut jalan",
        "Jalan terus tanpa henti",
        "Berbalik arah ke belakang"
      ],
      correctIndex: 1,
      explanation: "'Turn left' berarti belok kiri, dan 'corner' adalah sudut jalan."
    },
    {
      id: "s1_ep5_q2",
      question: "Which phrase means 'jalan lurus terus'?",
      options: [
        "Go straight ahead",
        "Stop and turn around",
        "Fly high in the sky",
        "Sit on the sidewalk"
      ],
      correctIndex: 0,
      explanation: "'Go straight' atau 'Go straight ahead' adalah frasa standar untuk jalan lurus ke depan."
    },
    {
      id: "s1_ep5_q3",
      question: "What does Leo recommend as the fastest way to reach Maple Street?",
      options: [
        "Take a helicopter",
        "Walking on foot",
        "Wait for tomorrow's train",
        "Rent a huge truck"
      ],
      correctIndex: 1,
      explanation: "Leo menjelaskan bahwa jalan kaki jauh lebih cepat karena lalu lintas jalan raya sedang padat."
    },
    {
      id: "s1_ep5_q4",
      question: "Where is Maple Street located according to Leo?",
      options: [
        "Right across from the park",
        "Inside the ocean",
        "On top of the mountain",
        "Behind the airport runway"
      ],
      correctIndex: 0,
      explanation: "Leo menyebutkan: 'Maple Street is right across from the park'."
    },
    {
      id: "s1_ep5_q5",
      question: "Complete the imperative direction: '______ right after you pass the supermarket.'",
      options: [
        "Turn",
        "Turning",
        "Turned",
        "Turns"
      ],
      correctIndex: 0,
      explanation: "Kalimat perintah (imperative) selalu menggunakan kata kerja dasar (base form) tanpa imbuhan: 'Turn'."
    }
  ],
  summary: {
    takeaways: [
      "Mampu menanyakan petunjuk arah jalan dengan percaya diri.",
      "Menguasai kosakata kunci arah: turn left, turn right, go straight.",
      "Memahami konsep jarak blok kota (city blocks)."
    ]
  },
  cliffhanger: "Saat kamu membuka aplikasi peta di ponsel untuk memastikan rute, layarmu berkedip merah: 'Koneksi Terputus - Tidak Ada Sinyal Wi-Fi!'"
};

// Episode 6: Koneksi Wi-Fi yang Hilang (The Lost Wi-Fi Signal)
const ep6 = {
  id: 6,
  number: 6,
  title: "Koneksi Wi-Fi yang Hilang",
  titleEn: "The Lost Wi-Fi Signal",
  estimatedMinutes: 10,
  recap: "Sinyal internet di ponselmu tiba-tiba putus. Padahal kamu perlu mengecek kode sandi kotak pos hunian kos. Kamu kembali mendekati konter kasir kafe.",
  dialogue: [
    {
      id: "ep6_d1",
      speaker: "You",
      en: "Excuse me, Sarah. Could you help me? My phone disconnected from the Wi-Fi.",
      idText: "Permisi, Sarah. Bisakah kamu membantuku? Ponselku terputus dari jaringan Wi-Fi."
    },
    {
      id: "ep6_d2",
      speaker: "Sarah",
      en: "Oh, no problem! The guest network resets every hour. Do you still have your receipt?",
      idText: "Oh, tidak masalah! Jaringan tamu direset setiap jam. Apakah kamu masih memegang struk belanjamu?"
    },
    {
      id: "ep6_choice_1",
      type: "interactive_choice",
      prompt: "Bagaimana responmu saat Sarah menanyakan struk pembelian?",
      options: [
        {
          id: "ep6_opt_1a",
          text: "Yes, I have it right here in my wallet!",
          speakerReply: "Sarah",
          reactionEn: "Look at the bottom line. The password is printed right there: 'CORNER2026'.",
          reactionId: "Lihat baris paling bawah. Kata sandinya tercetak tepat di situ: 'CORNER2026'."
        },
        {
          id: "ep6_opt_1b",
          text: "I think I threw it away. Is there another password?",
          speakerReply: "Sarah",
          reactionEn: "Don't worry! Let me write the new access code on a napkin for you.",
          reactionId: "Jangan khawatir! Biar kutuliskan kode akses yang baru di atas tisu untukmu."
        }
      ]
    },
    {
      id: "ep6_d3",
      speaker: "You",
      en: "Thank you so much, Sarah. You are very kind.",
      idText: "Terima kasih banyak, Sarah. Kamu sangat baik."
    },
    {
      id: "ep6_d4",
      speaker: "Kanci",
      en: "Ingat, huruf 'p' pada kata 'receipt' tidak diucapkan (silent letter), dibaca /rɪˈsiːt/!",
      idText: "Ingat, huruf 'p' pada kata 'receipt' tidak diucapkan (silent letter), dibaca /rɪˈsiːt/!"
    }
  ],
  highlightedVocab: [
    {
      wordId: "batch-internet-noun",
      word: "internet",
      partOfSpeech: "noun",
      enDefinition: "The global communication network.",
      idMeaning: "internet",
      contextSentence: "I need to connect to the internet to check my map."
    },
    {
      wordId: "batch-password-noun",
      word: "password",
      partOfSpeech: "noun",
      enDefinition: "A secret word or phrase that must be used to gain access.",
      idMeaning: "kata sandi; password",
      contextSentence: "The Wi-Fi password is typed in capital letters."
    },
    {
      wordId: "batch-connect-verb",
      word: "connect",
      partOfSpeech: "verb",
      enDefinition: "To join together so as to provide access and communication.",
      idMeaning: "menghubungkan; tersambung",
      contextSentence: "My laptop can connect to the cafe network."
    },
    {
      wordId: "batch-receipt-noun",
      word: "receipt",
      partOfSpeech: "noun",
      enDefinition: "A written acknowledgment of having received a specified amount of money or goods.",
      idMeaning: "struk pembelian; tanda terima",
      contextSentence: "The access code is printed on the receipt."
    },
    {
      wordId: "batch-problem-noun",
      word: "problem",
      partOfSpeech: "noun",
      enDefinition: "A matter or situation regarded as unwelcome or harmful.",
      idMeaning: "masalah; kendala",
      contextSentence: "Do you have any problem with your connection?"
    },
    {
      wordId: "batch-help-verb",
      word: "help",
      partOfSpeech: "verb",
      enDefinition: "To make it easier for someone to do something.",
      idMeaning: "membantu; menolong",
      contextSentence: "Could you please help me with the login screen?"
    }
  ],
  grammarFocus: {
    title: "Permintaan Tolong yang Sangat Santun: 'Could you help me...?'",
    topicId: "present-simple",
    explanation: "Kata 'Could you...' terdengar jauh lebih lembut dan santun dibandingkan 'Can you...'. Gunakan frasa ini saat meminta pertolongan kepada pelayan atau orang baru.",
    formula: "Could you + [verb base] + me, please? / Could you help me?"
  },
  culturalTip: {
    title: "Pengucapan 'Silent Letter' pada Kata 'Receipt'",
    content: "Kata 'receipt' (tanda terima / struk) memiliki silent letter pada huruf 'p'. Pengucapan yang benar adalah /rɪˈsiːt/ (seperti 're-seet'), bukan 're-sep-t'."
  },
  quiz: [
    {
      id: "s1_ep6_q1",
      question: "Which of the following is the most polite phrase to ask for assistance?",
      options: [
        "Help me right now!",
        "Could you please help me?",
        "Why is your shop broken?",
        "Give me the internet."
      ],
      correctIndex: 1,
      explanation: "'Could you please help me?' adalah cara paling sopan dan terhormat untuk meminta bantuan."
    },
    {
      id: "s1_ep6_q2",
      question: "How is the English word 'receipt' pronounced?",
      options: [
        "/rɪˈsiːt/ (huruf p tidak diucapkan)",
        "/re-sep-t/ (huruf p diucapkan jelas)",
        "/raɪ-kɪpt/",
        "/rɪ-kɪt/"
      ],
      correctIndex: 0,
      explanation: "Huruf 'p' pada kata 'receipt' adalah silent letter, sehingga dibaca /rɪˈsiːt/."
    },
    {
      id: "s1_ep6_q3",
      question: "Where is the guest Wi-Fi code usually found in modern cafes?",
      options: [
        "Under the coffee machine",
        "At the bottom of the purchase receipt",
        "Inside the trash bin",
        "Painted on the street road"
      ],
      correctIndex: 1,
      explanation: "Kode akses Wi-Fi tamu umumnya tercetak di bagian bawah struk pembelian (*receipt*)."
    },
    {
      id: "s1_ep6_q4",
      question: "What does the phrase 'No problem' mean when said by a service staff?",
      options: [
        "Sama-sama / Dengan senang hati",
        "Saya menolak membantumu",
        "Kedai kopi ini sedang bermasalah",
        "Harga kopi sangat mahal"
      ],
      correctIndex: 0,
      explanation: "'No problem' adalah ungkapan ramah yang setara dengan 'Sama-sama' atau 'Tidak masalah'."
    },
    {
      id: "s1_ep6_q5",
      question: "Complete the sentence: 'My phone can ______ to the guest Wi-Fi.'",
      options: [
        "connect",
        "connected",
        "connecting",
        "connection"
      ],
      correctIndex: 0,
      explanation: "Setelah modal auxiliary 'can', gunakan kata kerja dasar (base form) yaitu 'connect'."
    }
  ],
  summary: {
    takeaways: [
      "Menguasai permohonan santun dengan modal 'Could you help me?'",
      "Memahami tata cara bertanya kode Wi-Fi kafe lewat receipt.",
      "Melafalkan kata 'receipt' dengan benar tanpa bunyi huruf 'p'."
    ]
  },
  cliffhanger: "Koneksi ponselmu kembali pulih. Leo menghampirimu sambil tersenyum: 'Hei, sebelum kamu pergi, simpan nomorku. Kalau ada kendala di kota ini, hubungi aku!'"
};

// Episode 7: Nomor dan Kontak Darurat (Numbers and Contact Info)
const ep7 = {
  id: 7,
  number: 7,
  title: "Nomor dan Kontak Darurat",
  titleEn: "Numbers and Contact Info",
  estimatedMinutes: 10,
  recap: "Leo dengan baik hati menawarkan nomor teleponnya untuk berjaga-jaga jika kamu tersesat atau butuh bantuan darurat di lingkungan barumu.",
  dialogue: [
    {
      id: "ep7_d1",
      speaker: "Leo",
      en: "Here, let me give you my phone number. Just in case you get lost.",
      idText: "Ini, biar kuberikan nomor teleponku. Jaga-jaga bila kamu tersesat."
    },
    {
      id: "ep7_d2",
      speaker: "You",
      en: "That is very helpful! How do you say your number?",
      idText: "Itu sangat membantu! Bagaimana caramu mengeja nomormu?"
    },
    {
      id: "ep7_d3",
      speaker: "Leo",
      en: "It is: zero-eight-one, double two, five-four, nine-three.",
      idText: "Nomornya adalah: 081-22-54-93."
    },
    {
      id: "ep7_choice_1",
      type: "interactive_choice",
      prompt: "Bagaimana kamu mengonfirmasi nomor tersebut dengan cermat?",
      options: [
        {
          id: "ep7_opt_1a",
          text: "Let me check: is it 081-22-54-93?",
          speakerReply: "Leo",
          reactionEn: "Exactly! You got it right on the first try.",
          reactionId: "Tepat sekali! Kamu mencatatnya dengan benar di percobaan pertama."
        },
        {
          id: "ep7_opt_1b",
          text: "Could you please repeat the last four digits?",
          speakerReply: "Leo",
          reactionEn: "Sure thing! The last four digits are five-four, nine-three.",
          reactionId: "Tentu! Empat angka terakhir adalah lima-empat, sembilan-tiga."
        }
      ]
    },
    {
      id: "ep7_d4",
      speaker: "Kanci",
      en: "Perhatikan: orang penutur asli sering membaca angka berulang sebagai 'double two' (dua-dua) atau 'triple five'!",
      idText: "Perhatikan: orang penutur asli sering membaca angka berulang sebagai 'double two' (dua-dua) atau 'triple five'!"
    }
  ],
  highlightedVocab: [
    {
      wordId: "batch-number-noun",
      word: "number",
      partOfSpeech: "noun",
      enDefinition: "An arithmetical value expressed by a word, symbol, or figure.",
      idMeaning: "nomor; angka",
      contextSentence: "Please write down your contact number."
    },
    {
      wordId: "batch-phone-noun",
      word: "phone",
      partOfSpeech: "noun",
      enDefinition: "A device used to transmit sound over a distance.",
      idMeaning: "telepon; ponsel",
      contextSentence: "I save the contact on my mobile phone."
    },
    {
      wordId: "batch-call-verb",
      word: "call",
      partOfSpeech: "verb",
      enDefinition: "To contact or attempt to contact by telephone.",
      idMeaning: "menelepon; memanggil",
      contextSentence: "Call me if you cannot find the door."
    },
    {
      wordId: "batch-write-verb",
      word: "write",
      partOfSpeech: "verb",
      enDefinition: "To mark letters, words, or other symbols on a surface.",
      idMeaning: "menulis; mencatat",
      contextSentence: "Write the address clearly in your notebook."
    },
    {
      wordId: "batch-message-noun",
      word: "message",
      partOfSpeech: "noun",
      enDefinition: "A verbal, written, or recorded communication sent to a person.",
      idMeaning: "pesan; SMS",
      contextSentence: "Send me a quick message when you arrive safely."
    },
    {
      wordId: "batch-repeat-verb",
      word: "repeat",
      partOfSpeech: "verb",
      enDefinition: "To say or do something again.",
      idMeaning: "mengulangi; mengulang",
      contextSentence: "Could you repeat that slowly, please?"
    }
  ],
  grammarFocus: {
    title: "Mengeja Angka & Meminta Pengulangan: 'Could you repeat that...?'",
    topicId: "present-simple",
    explanation: "Dalam percakapan telepon atau dikte kontak, gunakan 'Could you repeat that slowly, please?' bila ada bagian yang terlewat. Angka kembar sering dibaca dengan awalan 'double' (misal: 22 dibaca 'double two').",
    formula: "Could you repeat + [noun phrase], please? / Let me check: is it...?"
  },
  culturalTip: {
    title: "Kebiasaan Membaca Angka Nol: 'Oh' vs 'Zero'",
    content: "Di negara-negara berbahasa Inggris, angka nol pada nomor telepon atau nomor kamar hotel sering kali diucapkan sebagai 'oh' (seperti huruf O) selain 'zero'. Keduanya sama-sama benar dan dimengerti."
  },
  quiz: [
    {
      id: "s1_ep7_q1",
      question: "How do native English speakers commonly say the number pair '22' in a telephone number?",
      options: [
        "Two and two together",
        "Double two",
        "Twenty second",
        "Two times two"
      ],
      correctIndex: 1,
      explanation: "Pasangan angka yang sama dalam nomor telepon umum dibaca dengan kata 'double', seperti 'double two' untuk 22."
    },
    {
      id: "s1_ep7_q2",
      question: "What should you say if someone dictates a number too quickly?",
      options: [
        "You speak terribly!",
        "Could you please repeat that slowly?",
        "I will delete your number.",
        "Silence right now."
      ],
      correctIndex: 1,
      explanation: "'Could you please repeat that slowly?' adalah cara sopan meminta lawan bicara mengulangi dengan tempo lebih pelan."
    },
    {
      id: "s1_ep7_q3",
      question: "Besides 'zero', what letter sound is frequently used to pronounce '0' in phone numbers?",
      options: [
        "'Zee'",
        "'Oh'",
        "'Ah'",
        "'Yu'"
      ],
      correctIndex: 1,
      explanation: "Angka nol sering kali diucapkan sebagai huruf 'Oh' dalam penuturan nomor telepon (misal: 081 dibaca 'oh-eight-one')."
    },
    {
      id: "s1_ep7_q4",
      question: "What does the word 'message' mean?",
      options: [
        "Makanan ringan",
        "Pesan tertulis atau komunikasi singkat",
        "Jalan raya beraspal",
        "Kunci pintu besi"
      ],
      correctIndex: 1,
      explanation: "'Message' berarti pesan, baik berupa teks singkat, surat, maupun pesan suara."
    },
    {
      id: "s1_ep7_q5",
      question: "Choose the correct verb: 'Please ______ your name on the sheet.'",
      options: [
        "write",
        "writes",
        "writing",
        "written"
      ],
      correctIndex: 0,
      explanation: "Kalimat permohonan/perintah diawali kata kerja dasar (base form): 'write'."
    }
  ],
  summary: {
    takeaways: [
      "Menguasai cara menyimak dan mendikte nomor kontak dengan istilah 'double'.",
      "Memahami pelafalan angka nol sebagai 'oh' atau 'zero'.",
      "Menggunakan ungkapan klarifikasi: 'Could you repeat that slowly, please?'"
    ]
  },
  cliffhanger: "Setelah mencatat nomor Leo, kamu merapikan ranselmu. Saat melangkah keluar kafe, matamu tertumbuk pada plang kayu kuno di ruko sebelah: 'The Scholar's Corner Bookshop'."
};

// Episode 8: Toko Buku di Samping Kafe (The Bookshop Next Door)
const ep8 = {
  id: 8,
  number: 8,
  title: "Toko Buku di Samping Kafe",
  titleEn: "The Bookshop Next Door",
  estimatedMinutes: 10,
  recap: "Sebelum melangkah menuju hunian kos, kamu tertarik mampir lima menit ke toko buku klasik di samping kafe untuk membeli peta saku lipat kota.",
  dialogue: [
    {
      id: "ep8_d1",
      speaker: "Narator",
      en: "A small brass bell chimes above the door as you step inside the cozy bookshop.",
      idText: "Lonceng kuningan kecil berdenting di atas pintu saat kamu melangkah masuk ke dalam toko buku yang nyaman."
    },
    {
      id: "ep8_d2",
      speaker: "Shopkeeper",
      en: "Good day, traveler! Can I help you find something special today?",
      idText: "Selamat siang, pengelana! Bisakah aku membantumu menemukan sesuatu yang istimewa hari ini?"
    },
    {
      id: "ep8_choice_1",
      type: "interactive_choice",
      prompt: "Bagaimana caramu menanyakan peta saku kota kepadanya?",
      options: [
        {
          id: "ep8_opt_1a",
          text: "Do you have a pocket map of this district?",
          speakerReply: "Shopkeeper",
          reactionEn: "Yes, we do! They are right on the front shelf near the counter.",
          reactionId: "Ya, kami punya! Peta-peta itu ada tepat di rak depan dekat meja kasir."
        },
        {
          id: "ep8_opt_1b",
          text: "I am looking for a street map. How much is it?",
          speakerReply: "Shopkeeper",
          reactionEn: "This compact pocket edition is only five dollars.",
          reactionId: "Edisi saku ringkas ini harganya hanya lima dollar."
        }
      ]
    },
    {
      id: "ep8_d3",
      speaker: "You",
      en: "Perfect! I will take this one, please.",
      idText: "Sempurna! Saya akan mengambil yang ini."
    },
    {
      id: "ep8_d4",
      speaker: "Kanci",
      en: "Hebat! Pertanyaan 'Do you have...?' dan 'How much is it?' adalah senjata utama saat berbelanja di luar negeri!",
      idText: "Hebat! Pertanyaan 'Do you have...?' dan 'How much is it?' adalah senjata utama saat berbelanja di luar negeri!"
    }
  ],
  highlightedVocab: [
    {
      wordId: "batch-book-noun",
      word: "book",
      partOfSpeech: "noun",
      enDefinition: "A written or printed work consisting of pages glued or sewn together.",
      idMeaning: "buku",
      contextSentence: "The bookshop has thousands of vintage books."
    },
    {
      wordId: "batch-shop-noun",
      word: "shop",
      partOfSpeech: "noun",
      enDefinition: "A building or part of a building where goods or services are sold.",
      idMeaning: "toko; kedai",
      contextSentence: "This independent bookshop opened fifty years ago."
    },
    {
      wordId: "batch-look-verb",
      word: "look",
      partOfSpeech: "verb",
      enDefinition: "To direct one's gaze toward someone or something.",
      idMeaning: "melihat; mencari (dengan for)",
      contextSentence: "I am looking for a detailed neighborhood guide."
    },
    {
      wordId: "batch-find-verb",
      word: "find",
      partOfSpeech: "verb",
      enDefinition: "To discover or perceive by chance or for the first time.",
      idMeaning: "menemukan",
      contextSentence: "Can you help me find the history section?"
    },
    {
      wordId: "batch-cheap-adjective",
      word: "cheap",
      partOfSpeech: "adjective",
      enDefinition: "Low in price, especially in relation to similar items.",
      idMeaning: "murah; terjangkau",
      contextSentence: "The paperback pocket map is very cheap."
    },
    {
      wordId: "batch-price-noun",
      word: "price",
      partOfSpeech: "noun",
      enDefinition: "The amount of money expected or required in payment.",
      idMeaning: "harga",
      contextSentence: "The price tag is clearly marked on the back cover."
    }
  ],
  grammarFocus: {
    title: "Menanyakan Ketersediaan & Harga Barang: 'Do you have...?' & 'How much is...?'",
    topicId: "present-simple",
    explanation: "Gunakan 'Do you have + [Nama Barang]?' untuk menanyakan ketersediaan barang di toko, dan gunakan 'How much is this / that?' untuk menanyakan harganya.",
    formula: "Do you have [item]? / How much is [item]?"
  },
  culturalTip: {
    title: "Etika Menyapa Pemilik Toko Kecil Mandiri (Independent Shops)",
    content: "Di toko buku atau butik kecil mandiri, menyapa pemilik toko dengan 'Good morning' atau 'Hello' saat melangkah masuk adalah tanda keramahan yang sangat dihargai, bukan sekadar langsung mengambil barang tanpa kata."
  },
  quiz: [
    {
      id: "s1_ep8_q1",
      question: "Which question is used to ask if a shop sells a specific item?",
      options: [
        "Where is your bedroom?",
        "Do you have a pocket map?",
        "Why do you open this door?",
        "Are you eating lunch right now?"
      ],
      correctIndex: 1,
      explanation: "'Do you have [item]?' adalah pola baku untuk menanyakan apakah sebuah toko menjual atau memiliki barang tertentu."
    },
    {
      id: "s1_ep8_q2",
      question: "What is the proper question to ask for the price of a single book?",
      options: [
        "How much is this book?",
        "How many is this book?",
        "What time is this book?",
        "Where does this book run?"
      ],
      correctIndex: 0,
      explanation: "Untuk harga (uang), kita selalu menggunakan 'How much', bukan 'How many'."
    },
    {
      id: "s1_ep8_q3",
      question: "What is the opposite of 'cheap'?",
      options: [
        "Quiet",
        "Expensive",
        "Short",
        "Clean"
      ],
      correctIndex: 1,
      explanation: "Lawan kata dari 'cheap' (murah) adalah 'expensive' (mahal)."
    },
    {
      id: "s1_ep8_q4",
      question: "What phrase indicates that you want to purchase an item after looking at it?",
      options: [
        "I will take this one, please.",
        "Throw this away immediately.",
        "I hate this paper.",
        "You must pay me now."
      ],
      correctIndex: 0,
      explanation: "'I will take this one, please' adalah ungkapan natural saat memutuskan membeli barang pilihanmu."
    },
    {
      id: "s1_ep8_q5",
      question: "Complete the sentence: 'Can you help me ______ the travel section?'",
      options: [
        "find",
        "finding",
        "found",
        "finds"
      ],
      correctIndex: 0,
      explanation: "Setelah konstruksi 'help me', kita menggunakan kata kerja dasar (base infinitive): 'find'."
    }
  ],
  summary: {
    takeaways: [
      "Menguasai pertanyaan ketersediaan stok: 'Do you have...?'",
      "Menanyakan harga barang dengan tepat: 'How much is this?'",
      "Menunjukkan etika santun saat memasuki toko buku mandiri."
    ]
  },
  cliffhanger: "Sambil menyerahkan kembalian uang, pemilik toko tersenyum hangat: 'Maple Street ada di gang pintas sebelah tokomu. Jalur itu sangat tenang dan aman.' Di luar, lonceng menara kota berdentang: pukul 12.30!"
};

// Episode 9: Janji Bertemu Esok Hari (A Promise to Meet Tomorrow)
const ep9 = {
  id: 9,
  number: 9,
  title: "Janji Bertemu Esok Hari",
  titleEn: "A Promise to Meet Tomorrow",
  estimatedMinutes: 10,
  recap: "Keluar dari toko buku dengan peta saku baru di tangan, kamu kembali berpapasan dengan Leo yang baru saja selesai membereskan peralatannya di teras kafe.",
  dialogue: [
    {
      id: "ep9_d1",
      speaker: "Leo",
      en: "Hey! You got a map from Mr. Arthur? He is a lovely old gentleman.",
      idText: "Hei! Kamu mendapat peta dari Pak Arthur? Beliau adalah pria tua yang sangat ramah."
    },
    {
      id: "ep9_d2",
      speaker: "You",
      en: "Yes, he gave me great directions for the shortcut to Maple Street.",
      idText: "Ya, dia memberiku petunjuk jalan pintas yang sangat bagus menuju Maple Street."
    },
    {
      id: "ep9_d3",
      speaker: "Leo",
      en: "Tomorrow is Saturday. There is a lively farmer's market in the park. Do you want to meet there?",
      idText: "Besok hari Sabtu. Ada pasar tani yang ramai di taman. Apakah kamu mau bertemu di sana?"
    },
    {
      id: "ep9_choice_1",
      type: "interactive_choice",
      prompt: "Bagaimana responmu menyetujui ajakan bertemu besok pagi?",
      options: [
        {
          id: "ep9_opt_1a",
          text: "That sounds wonderful! Let's meet at 10 AM near the fountain.",
          speakerReply: "Leo",
          reactionEn: "Deal! 10 AM by the water fountain. I will show you the best bakery in town.",
          reactionId: "Sepakat! Jam 10 pagi di dekat air mancur. Aku akan mengajakmu ke toko roti terbaik di kota ini."
        },
        {
          id: "ep9_opt_1b",
          text: "I would love to, but I might wake up a bit late after unpacking. How about 11 AM?",
          speakerReply: "Leo",
          reactionEn: "11 AM works perfectly for me! See you tomorrow morning.",
          reactionId: "Jam 11 sangat cocok untukku! Sampai bertemu besok pagi."
        }
      ]
    },
    {
      id: "ep9_d4",
      speaker: "Kanci",
      en: "Luar biasa! Mengusulkan waktu spesifik dengan 'Let's meet at [time]' adalah cara efektif membuat janji temu!",
      idText: "Luar biasa! Mengusulkan waktu spesifik dengan 'Let's meet at [time]' adalah cara efektif membuat janji temu!"
    }
  ],
  highlightedVocab: [
    {
      wordId: "batch-meet-verb",
      word: "meet",
      partOfSpeech: "verb",
      enDefinition: "To come into the presence of or contact with someone.",
      idMeaning: "bertemu; berjumpa",
      contextSentence: "Let's meet tomorrow at the park entrance."
    },
    {
      wordId: "batch-tomorrow-noun",
      word: "tomorrow",
      partOfSpeech: "noun",
      enDefinition: "On the day after today.",
      idMeaning: "besok; hari esok",
      contextSentence: "I have an important appointment tomorrow morning."
    },
    {
      wordId: "batch-morning-noun",
      word: "morning",
      partOfSpeech: "noun",
      enDefinition: "The period of time between midnight and noon.",
      idMeaning: "pagi; pagi hari",
      contextSentence: "The fresh morning air is so refreshing."
    },
    {
      wordId: "batch-time-noun",
      word: "time",
      partOfSpeech: "noun",
      enDefinition: "A point of time as measured in hours and minutes.",
      idMeaning: "waktu; jam",
      contextSentence: "What time does the market open?"
    },
    {
      wordId: "batch-agree-verb",
      word: "agree",
      partOfSpeech: "verb",
      enDefinition: "To have the same opinion about something.",
      idMeaning: "setuju; sepakat",
      contextSentence: "We both agree that ten o'clock is ideal."
    },
    {
      wordId: "batch-promise-verb",
      word: "promise",
      partOfSpeech: "verb",
      enDefinition: "To assure someone that one will definitely do something.",
      idMeaning: "berjanji",
      contextSentence: "I promise I will bring my new camera."
    }
  ],
  grammarFocus: {
    title: "Membuat Rencana & Janji Temu: 'Let's meet at...' & 'See you...'",
    topicId: "present-simple",
    explanation: "Gunakan 'Let's meet at + [Jam]' untuk mengusulkan waktu pertemuan. Preposisi waktu yang tepat untuk menunjukkan jam selalu menggunakan kata depan 'at' (contoh: at 10 AM).",
    formula: "Let's meet at + [Time] + near [Location]. / See you tomorrow!"
  },
  culturalTip: {
    title: "Etika Ketepatan Waktu (Punctuality) dalam Janji Temu",
    content: "Di sebagian besar negara berbahasa Inggris, ketepatan waktu (*punctuality*) sangat dihormati. Tiba 5 menit sebelum waktu yang disepakati menunjukkan rasa hormat kepada kawan atau rekan janjimu."
  },
  quiz: [
    {
      id: "s1_ep9_q1",
      question: "Which preposition is always used before a specific clock time?",
      options: [
        "In",
        "On",
        "At",
        "Under"
      ],
      correctIndex: 2,
      explanation: "Untuk waktu jam spesifik, preposisi yang benar selalu 'at' (contoh: at 10 AM, at noon)."
    },
    {
      id: "s1_ep9_q2",
      question: "What is a natural phrase to suggest meeting someone tomorrow?",
      options: [
        "Let's meet tomorrow morning.",
        "You must run away tomorrow.",
        "Never look at me again.",
        "I forget your face."
      ],
      correctIndex: 0,
      explanation: "'Let's meet tomorrow morning' adalah ungkapan yang ramah dan alami untuk mengajak bertemu."
    },
    {
      id: "s1_ep9_q3",
      question: "What does 'See you tomorrow' mean in Indonesian?",
      options: [
        "Sampai jumpa besok",
        "Kemarin kamu ke mana",
        "Jangan datang ke sini",
        "Tolong tutup pintunya"
      ],
      correctIndex: 0,
      explanation: "'See you tomorrow' berarti sampai jumpa besok."
    },
    {
      id: "s1_ep9_q4",
      question: "What event is happening at the park tomorrow?",
      options: [
        "A rocket launch",
        "A lively farmer's market",
        "A swimming race in the snow",
        "A closed festival"
      ],
      correctIndex: 1,
      explanation: "Leo menyebutkan ada pasar tani lokal yang ramai (*lively farmer's market*) di taman besok pagi."
    },
    {
      id: "s1_ep9_q5",
      question: "Complete the sentence: 'We ______ to meet at 11 o'clock.'",
      options: [
        "agree",
        "agrees",
        "agreeing",
        "agreement"
      ],
      correctIndex: 0,
      explanation: "Subjek 'We' menggunakan kata kerja bentuk dasar dalam Present Simple: 'agree'."
    }
  ],
  summary: {
    takeaways: [
      "Menguasai pembuatan janji temu dengan struktur: 'Let's meet at...'",
      "Menggunakan preposisi waktu yang tepat ('at' untuk jam).",
      "Memahami pentingnya budaya tepat waktu (punctuality)."
    ]
  },
  cliffhanger: "Kamu melambaikan tangan kepada Leo, memanggul ranselmu yang berat, dan melangkah masuk ke gang samping toko buku. Menit demi menit berjalan, dan rumah penginapanmu sudah di depan mata!"
};

// Episode 10: Melangkah Menuju Penginapan (Stepping Toward the Lodging)
const ep10 = {
  id: 10,
  number: 10,
  title: "Melangkah Menuju Penginapan",
  titleEn: "Stepping Toward the Lodging",
  estimatedMinutes: 10,
  recap: "Inilah puncak perjalanan hari pertamamu di kota baru. Setelah memesan kopi sendiri, berkenalan dengan Leo, membeli peta saku, dan berjalan menyusuri gang pintas yang tenang, kamu tiba di depan gerbang Maple Lodge No. 7.",
  dialogue: [
    {
      id: "ep10_d1",
      speaker: "Narator",
      en: "A white wooden fence and a quiet flower garden welcome you to Maple Lodge No. 7.",
      idText: "Pagar kayu putih dan taman bunga yang tenang menyambutmu di Maple Lodge No. 7."
    },
    {
      id: "ep10_d2",
      speaker: "Kanci",
      en: "Lihat jam tanganmu! Tepat pukul 12.50 WIB! Kamu tiba sepuluh menit lebih awal dari batas waktu pengelola!",
      idText: "Lihat jam tanganmu! Tepat pukul 12.50 WIB! Kamu tiba sepuluh menit lebih awal dari batas waktu pengelola!"
    },
    {
      id: "ep10_d3",
      speaker: "You",
      en: "Here is mailbox number seven. Let me enter the lock code: four-two-zero.",
      idText: "Ini dia kotak pos nomor tujuh. Biar kumasukkan kode kuncinya: 4-2-0."
    },
    {
      id: "ep10_choice_1",
      type: "interactive_choice",
      prompt: "Gembok terbuka dengan bunyi klik lembut. Apa yang kamu rasakan saat memegang kunci kamarmu?",
      options: [
        {
          id: "ep10_opt_1a",
          text: "I did it! I survived my first day and spoke English with real confidence.",
          speakerReply: "Kanci",
          reactionEn: "I am so proud of you! You handled everything like a true English scholar.",
          reactionId: "Aku sangat bangga padamu! Kamu mengatasi segalanya layaknya seorang cendekiawan sejati."
        },
        {
          id: "ep10_opt_1b",
          text: "This golden brass key represents the start of my brand new life here.",
          speakerReply: "Kanci",
          reactionEn: "Welcome home! Step inside, unpack your bags, and get ready for greater journeys.",
          reactionId: "Selamat datang di rumah barumu! Masuklah, bongkar kopermu, dan bersiaplah untuk petualangan yang lebih hebat."
        }
      ]
    },
    {
      id: "ep10_d4",
      speaker: "Narator",
      en: "The heavy wooden door opens smoothly into a warm, sunlit room with clean white sheets.",
      idText: "Pintu kayu yang kokoh terbuka perlahan menuju kamar hangat bermandikan sinar matahari dengan seprai putih yang bersih."
    }
  ],
  highlightedVocab: [
    {
      wordId: "batch-house-noun",
      word: "house",
      partOfSpeech: "noun",
      enDefinition: "A building for human habitation.",
      idMeaning: "rumah; tempat tinggal",
      contextSentence: "Maple Lodge is a lovely guest house."
    },
    {
      wordId: "batch-door-noun",
      word: "door",
      partOfSpeech: "noun",
      enDefinition: "A hinged, sliding, or revolving barrier at the entrance to a building, room, or vehicle.",
      idMeaning: "pintu",
      contextSentence: "The room door has a brass number on it."
    },
    {
      wordId: "batch-key-noun",
      word: "key",
      partOfSpeech: "noun",
      enDefinition: "A small piece of shaped metal with incisions cut to fit the warded parts of a lock.",
      idMeaning: "kunci",
      contextSentence: "The room key is waiting inside the mailbox."
    },
    {
      wordId: "batch-open-verb",
      word: "open",
      partOfSpeech: "verb",
      enDefinition: "To move so as to leave an opening.",
      idMeaning: "membuka",
      contextSentence: "Turn the key to open the front door."
    },
    {
      wordId: "batch-safe-adjective",
      word: "safe",
      partOfSpeech: "adjective",
      enDefinition: "Protected from or not exposed to danger or risk.",
      idMeaning: "aman; selamat",
      contextSentence: "I feel safe and comfortable in my new room."
    },
    {
      wordId: "batch-happy-adjective",
      word: "happy",
      partOfSpeech: "adjective",
      enDefinition: "Feeling or showing pleasure or contentment.",
      idMeaning: "bahagia; senang",
      contextSentence: "I am happy that I reached my lodging on time."
    }
  ],
  grammarFocus: {
    title: "Refleksi Sukses Hari Pertama: 'I arrived...' & 'I feel ready for...'",
    topicId: "past-simple",
    explanation: "Gunakan Simple Past Tense ('I arrived', 'I spoke', 'I ordered') untuk merefleksikan keberhasilan tindakan yang telah selesai kamu lakukan hari ini.",
    formula: "I arrived on time. / I spoke English today. / I feel happy."
  },
  culturalTip: {
    title: "Etika 'Self Check-in' dan Tanggung Jawab Kunci Hunian",
    content: "Di akomodasi modern mandiri (*self check-in*), kunci yang diambil dari kotak pos (*lockbox*) adalah tanggung jawab penuh penyewa. Mengganti kunci fisik yang hilang bisa memakan biaya denda yang cukup besar, jadi simpanlah selalu di tempat yang aman."
  },
  quiz: [
    {
      id: "s1_ep10_q1",
      question: "What is the English word for the metal tool used to unlock a door?",
      options: [
        "Card",
        "Key",
        "Fork",
        "Bottle"
      ],
      correctIndex: 1,
      explanation: "'Key' adalah kunci untuk membuka pintu atau gembok."
    },
    {
      id: "s1_ep10_q2",
      question: "What is the opposite of the adjective 'safe'?",
      options: [
        "Dangerous",
        "Clean",
        "Warm",
        "Friendly"
      ],
      correctIndex: 0,
      explanation: "Lawan kata dari 'safe' (aman) adalah 'dangerous' (berbahaya)."
    },
    {
      id: "s1_ep10_q3",
      question: "At what time did you arrive at Maple Lodge No. 7?",
      options: [
        "12:50 PM (10 minutes before the deadline)",
        "3:00 AM in the middle of the night",
        "Yesterday morning",
        "After midnight"
      ],
      correctIndex: 0,
      explanation: "Kanci mencatat kamu tiba tepat pukul 12.50 WIB, sepuluh menit sebelum batas jam 13.00."
    },
    {
      id: "s1_ep10_q4",
      question: "Which tense is used to reflect on completed actions of the day?",
      options: [
        "Simple Past Tense (e.g. 'I arrived safely')",
        "Future Continuous Tense",
        "Imperative Command",
        "Passive Hypothetical"
      ],
      correctIndex: 0,
      explanation: "Untuk peristiwa yang sudah tuntas terjadi di masa lampau (hari ini), kita menggunakan Simple Past Tense."
    },
    {
      id: "s1_ep10_q5",
      question: "Complete the sentence: 'I am ______ to start my new journey in this city.'",
      options: [
        "ready",
        "reading",
        "read",
        "readily"
      ],
      correctIndex: 0,
      explanation: "Frasa 'ready to [verb]' menyatakan kesiapan mental atau fisik untuk memulai sesuatu: 'I am ready to start'."
    }
  ],
  summary: {
    takeaways: [
      "Menyelesaikan hari pertama dengan mandiri dan tiba tepat waktu.",
      "Menguasai kosakata hunian: house, door, key, lockbox, safe.",
      "Merefleksikan pencapaian hari pertama dengan Simple Past Tense."
    ]
  },
  cliffhanger: "Saat kamu meletakkan ranselmu di atas meja kamar, matamu menangkap sebuah amplop cokelat tebal tanpa nama di samping vas bunga. Di atasnya tertulis dengan tinta hitam: 'Selamat datang, penjelajah. Petualanganmu yang sesungguhnya menanti di Bandara Kota...'"
};

// Combine all 10 episodes
const completeStory01 = {
  ...existingStory,
  episodes: [
    ep1,
    ep2,
    ep3,
    ep4,
    ep5,
    ep6,
    ep7,
    ep8,
    ep9,
    ep10
  ]
};

// Validate consistency
if (completeStory01.episodes.length !== 10) {
  throw new Error("Story 1 must have exactly 10 episodes!");
}

completeStory01.episodes.forEach((ep) => {
  if (!ep.dialogue || ep.dialogue.length < 3) {
    throw new Error(`Episode ${ep.id} dialogue is too short!`);
  }
  if (!ep.highlightedVocab || ep.highlightedVocab.length !== 6) {
    throw new Error(`Episode ${ep.id} must have exactly 6 highlightedVocab! Got: ${ep.highlightedVocab ? ep.highlightedVocab.length : 0}`);
  }
  if (!ep.quiz || ep.quiz.length !== 5) {
    throw new Error(`Episode ${ep.id} must have exactly 5 quiz questions! Got: ${ep.quiz ? ep.quiz.length : 0}`);
  }
  ep.quiz.forEach((q, idx) => {
    if (!q.options || q.options.length !== 4) {
      throw new Error(`Episode ${ep.id} quiz Q${idx + 1} must have 4 options!`);
    }
    if (q.correctIndex < 0 || q.correctIndex > 3) {
      throw new Error(`Episode ${ep.id} quiz Q${idx + 1} correctIndex out of range: ${q.correctIndex}`);
    }
  });
});

fs.writeFileSync("src/data/stories/story-01.json", JSON.stringify(completeStory01, null, 2), "utf8");
console.log("✓ SUCCESS: Story 1 (story-01.json) successfully populated with all 10 full-length episodes!");
console.log("Total Episodes:", completeStory01.episodes.length);
console.log("Total Quiz Questions:", completeStory01.episodes.length * 5);
console.log("Total Oxford 3000 Vocabularies:", completeStory01.episodes.length * 6);

