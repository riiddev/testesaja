import fs from "fs";
import path from "path";

// Define the full Story 2 data
const story02 = {
  id: "story-02",
  number: 2,
  title: "Tersesat di Bandara",
  titleEn: "Lost at the Airport",
  level: "A1",
  levelReq: 2,
  totalEpisodes: 10,
  themeColor: "#2B6CB0",
  description: "Menavigasi aula terminal internasional yang megah, membaca papan petunjuk, melewati pemeriksaan imigrasi dan keamanan, hingga menemukan pintu garbarata pesawat tepat waktu.",
  learningFocus: "Airport Signs, Travel Documents, Flight Boarding Times, Imperative Instructions, Asking Airport Staff for Direction.",
  episodes: [
    // EPISODE 1
    {
      id: 1,
      number: 1,
      title: "Tiba di Terminal Internasional",
      titleEn: "Arriving at the International Terminal",
      estimatedMinutes: 10,
      recap: "Kamu tiba di Bandara Internasional Metropolitan dengan membawa koper beroda dan ransel. Suasana aula terminal sangat luas, megah, dan dipenuhi papan penunjuk arah bercahaya.",
      dialogue: [
        {
          id: "s2e1_d1",
          speaker: "Narator",
          en: "The glass sliding doors open into a huge terminal filled with travelers from all over the world.",
          idText: "Pintu geser kaca terbuka menuju aula terminal megah yang dipenuhi pengelana dari seluruh penjuru dunia."
        },
        {
          id: "s2e1_d2",
          speaker: "Kanci",
          en: "Selamat datang di bandara internasional! Di tempat seluas ini, papan penunjuk arah kuning adalah sahabat terbaikmu!",
          idText: "Selamat datang di bandara internasional! Di tempat seluas ini, papan penunjuk arah kuning adalah sahabat terbaikmu!"
        },
        {
          id: "s2e1_d3",
          speaker: "You",
          en: "Look at that big sign. 'Arrivals' is on the left, and 'Departures' is on the right.",
          idText: "Lihat papan tanda besar itu. 'Arrivals' (Kedatangan) ada di sebelah kiri, dan 'Departures' (Keberangkatan) di sebelah kanan."
        },
        {
          id: "s2e1_choice_1",
          type: "interactive_choice",
          prompt: "Kamu perlu menuju area keberangkatan untuk penerbangan transitmu. Ke mana kamu melangkah?",
          options: [
            {
              id: "s2e1_opt_1a",
              text: "I am going to follow the Departures sign on the right.",
              speakerReply: "Kanci",
              reactionEn: "Excellent choice! Departures is where all flights take off.",
              reactionId: "Pilihan tepat! Departures adalah area di mana semua penerbangan diberangkatkan."
            },
            {
              id: "s2e1_opt_1b",
              text: "Let me check the airport directory map near the entrance first.",
              speakerReply: "Kanci",
              reactionEn: "Very smart! A quick look at the terminal map saves you a lot of walking.",
              reactionId: "Sangat cerdas! Melihat peta terminal sebentar menghemat banyak langkah kakimu."
            }
          ]
        },
        {
          id: "s2e1_d4",
          speaker: "You",
          en: "I am ready. My flight is in Terminal 2.",
          idText: "Aku siap. Penerbanganku ada di Terminal 2."
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-airport-noun",
          word: "airport",
          partOfSpeech: "noun",
          enDefinition: "A complex of runways and buildings for the take-off, landing, and maintenance of aircraft.",
          idMeaning: "bandara; bandar udara",
          contextSentence: "The international airport operates twenty-four hours a day."
        },
        {
          wordId: "batch-terminal-noun",
          word: "terminal",
          partOfSpeech: "noun",
          enDefinition: "A building at an airport where passengers transfer between ground transportation and the aircraft.",
          idMeaning: "terminal bandara",
          contextSentence: "Our flight departs from Terminal 2."
        },
        {
          wordId: "batch-sign-noun",
          word: "sign",
          partOfSpeech: "noun",
          enDefinition: "A board or notice displaying information or directions.",
          idMeaning: "tanda; papan petunjuk",
          contextSentence: "Follow the yellow sign to find the exit."
        },
        {
          wordId: "batch-arrive-verb",
          word: "arrive",
          partOfSpeech: "verb",
          enDefinition: "To reach a destination.",
          idMeaning: "tiba; sampai",
          contextSentence: "Passengers arrive at the terminal three hours before departure."
        },
        {
          wordId: "batch-gate-noun",
          word: "gate",
          partOfSpeech: "noun",
          enDefinition: "An exit from an airport terminal to an aircraft.",
          idMeaning: "pintu gerbang keberangkatan; gate",
          contextSentence: "Please proceed directly to gate B24."
        },
        {
          wordId: "batch-flight-noun",
          word: "flight",
          partOfSpeech: "noun",
          enDefinition: "A journey made through the air by a plane.",
          idMeaning: "penerbangan",
          contextSentence: "My connecting flight is scheduled for noon."
        }
      ],
      grammarFocus: {
        title: "Present Continuous untuk Rencana & Tindakan Saat Ini",
        topicId: "present-continuous",
        explanation: "Dalam navigasi bandara, gunakan Present Continuous ('I am going to...', 'I am looking for...') untuk menyatakan tindakan yang sedang kamu lakukan atau rencana terdekat.",
        formula: "Subject + am/is/are + verb-ing + [Object/Complement]"
      },
      culturalTip: {
        title: "Arti Warna Papan Petunjuk Bandara Internasional",
        content: "Di bandara internasional, papan berwarna kuning cerah dengan huruf hitam pekat dirancang khusus sebagai panduan navigasi prioritas tinggi agar mudah dibaca dari kejauhan."
      },
      quiz: [
        {
          id: "s2_ep1_q1",
          question: "What does the word 'Departures' on an airport sign indicate?",
          options: [
            "Tempat pengambilan bagasi tiba",
            "Area keberangkatan pesawat terbang",
            "Area parkir kendaraan umum",
            "Pintu darurat pemadam kebakaran"
          ],
          correctIndex: 1,
          explanation: "'Departures' menunjukkan area keberangkatan pesawat ke kota tujuan."
        },
        {
          id: "s2_ep1_q2",
          question: "Which of the following refers to a journey made by an airplane?",
          options: [
            "Train",
            "Flight",
            "Bicycle",
            "Subway"
          ],
          correctIndex: 1,
          explanation: "'Flight' adalah istilah bahasa Inggris untuk perjalanan menggunakan pesawat udara."
        },
        {
          id: "s2_ep1_q3",
          question: "Complete the sentence: 'I am ______ for the connecting flight terminal.'",
          options: [
            "look",
            "looking",
            "looked",
            "looks"
          ],
          correctIndex: 1,
          explanation: "Setelah to be 'am', kata kerja dalam bentuk Present Continuous harus berakhiran -ing: 'looking'."
        },
        {
          id: "s2_ep1_q4",
          question: "What is the area where passengers wait before entering the airplane called?",
          options: [
            "Kitchen",
            "Gate",
            "Garage",
            "Balcony"
          ],
          correctIndex: 1,
          explanation: "Pintu atau ruang tunggu keberangkatan pesawat di bandara disebut 'Gate'."
        },
        {
          id: "s2_ep1_q5",
          question: "What does the antonym of 'Departures' at an airport sign?",
          options: [
            "Arrivals",
            "Stations",
            "Restrooms",
            "Offices"
          ],
          correctIndex: 0,
          explanation: "Lawan kata dari 'Departures' (keberangkatan) adalah 'Arrivals' (kedatangan)."
        }
      ],
      summary: {
        takeaways: [
          "Mengenali perbedaan papan 'Departures' (keberangkatan) dan 'Arrivals' (kedatangan).",
          "Menggunakan struktur Present Continuous: 'I am looking for...'",
          "Memahami fungsi papan navigasi berkode warna standar internasional."
        ]
      },
      cliffhanger: "Saat kamu melangkah menuju lorong transit, seorang petugas imigrasi berseragam rapi melambaikan tangan mengarahkan antrean: 'Next passenger, please step up to Counter 4!'"
    },

    // EPISODE 2
    {
      id: 2,
      number: 2,
      title: "Menunjukkan Paspor dan Dokumen",
      titleEn: "Showing the Passport and Documents",
      estimatedMinutes: 10,
      recap: "Kamu tiba di konter pemeriksaan imigrasi dan verifikasi dokumen perjalanan. Petugas imigrasi bersiap memeriksa paspor dan tiketmu.",
      dialogue: [
        {
          id: "s2e2_d1",
          speaker: "Officer",
          en: "Good morning. May I see your passport and boarding pass, please?",
          idText: "Selamat pagi. Boleh saya lihat paspor dan boarding pass Anda?"
        },
        {
          id: "s2e2_d2",
          speaker: "You",
          en: "Good morning, Officer. Here they are.",
          idText: "Selamat pagi, Petugas. Ini dokumennya."
        },
        {
          id: "s2e2_choice_1",
          type: "interactive_choice",
          prompt: "Petugas bertanya: 'What is the purpose of your trip?' Bagaimana kamu menjawabnya dengan ringkas dan lugas?",
          options: [
            {
              id: "s2e2_opt_1a",
              text: "I am traveling for education and English language study.",
              speakerReply: "Officer",
              reactionEn: "Very good. Which school or academy will you attend?",
              reactionId: "Bagus sekali. Sekolah atau akademi mana yang akan Anda masuki?"
            },
            {
              id: "s2e2_opt_1b",
              text: "I am here on vacation as a tourist to visit the city.",
              speakerReply: "Officer",
              reactionEn: "Welcome. How long are you planning to stay in the country?",
              reactionId: "Selamat datang. Berapa lama Anda berencana tinggal di negara ini?"
            }
          ]
        },
        {
          id: "s2e2_d3",
          speaker: "You",
          en: "I will stay for two weeks. Here is my return flight confirmation.",
          idText: "Saya akan tinggal selama dua minggu. Ini bukti konfirmasi tiket pulang saya."
        },
        {
          id: "s2e2_d4",
          speaker: "Officer",
          en: "Everything looks in order. Enjoy your stay in the city!",
          idText: "Semuanya lengkap dan teratur. Nikmati masa tinggal Anda di kota ini!"
        },
        {
          id: "s2e2_d5",
          speaker: "Kanci",
          en: "Luar biasa! Memberikan jawaban yang tenang, jujur, dan menunjukkan tiket pulang adalah kunci kelancaran imigrasi!",
          idText: "Luar biasa! Memberikan jawaban yang tenang, jujur, dan menunjukkan tiket pulang adalah kunci kelancaran imigrasi!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-passport-noun",
          word: "passport",
          partOfSpeech: "noun",
          enDefinition: "An official document issued by a government certifying identity and citizenship.",
          idMeaning: "paspor",
          contextSentence: "Keep your passport in a secure front pocket."
        },
        {
          wordId: "batch-show-verb",
          word: "show",
          partOfSpeech: "verb",
          enDefinition: "To allow or cause something to be visible.",
          idMeaning: "menunjukkan; memperlihatkan",
          contextSentence: "Please show your identity document to the officer."
        },
        {
          wordId: "batch-officer-noun",
          word: "officer",
          partOfSpeech: "noun",
          enDefinition: "A person holding a position of authority in an organization or government.",
          idMeaning: "petugas; pejabat berwenang",
          contextSentence: "The customs officer verified the travel visa."
        },
        {
          wordId: "batch-visit-verb",
          word: "visit",
          partOfSpeech: "verb",
          enDefinition: "To go to see and spend time with someone or at a place socially.",
          idMeaning: "mengunjungi; bertandang",
          contextSentence: "I plan to visit historical museums during my trip."
        },
        {
          wordId: "batch-stay-verb",
          word: "stay",
          partOfSpeech: "verb",
          enDefinition: "To remain in a specified state or place.",
          idMeaning: "tinggal; menetap sementara",
          contextSentence: "How many days will you stay at the hotel?"
        },
        {
          wordId: "batch-purpose-noun",
          word: "purpose",
          partOfSpeech: "noun",
          enDefinition: "The reason for which something is done or created.",
          idMeaning: "tujuan; maksud",
          contextSentence: "What is the primary purpose of your travel?"
        }
      ],
      grammarFocus: {
        title: "Menjawab Pertanyaan Wh- Imigrasi ('What is the purpose...?')",
        topicId: "present-simple",
        explanation: "Pertanyaan 'What is the purpose of your trip?' dijawab dengan frasa tujuan langsung: 'I am here for [study / tourism / business]'.",
        formula: "I am here for [Noun] / I plan to stay for [Duration]."
      },
      culturalTip: {
        title: "Etika di Meja Imigrasi Bandara Internasional",
        content: "Saat berada di konter imigrasi, lepas kacamata hitam atau topi, tatap mata petugas secara wajar, dan simpan ponsel di saku. Menjawab dengan singkat dan percaya diri akan mempercepat proses pemeriksaan."
      },
      quiz: [
        {
          id: "s2_ep2_q1",
          question: "What is the meaning of the question: 'What is the purpose of your visit?'",
          options: [
            "Berapa harga tiket pesawatmu?",
            "Apa tujuan dari kunjungan Anda?",
            "Siapa nama saudaramu di kampung?",
            "Jam berapa kamu bangun tidur?"
          ],
          correctIndex: 1,
          explanation: "'What is the purpose of your visit?' berarti menanyakan apa maksud atau tujuan kedatanganmu."
        },
        {
          id: "s2_ep2_q2",
          question: "Which of the following is a polite way to hand your documents to an officer?",
          options: [
            "Take it and do not talk.",
            "Here they are, Officer.",
            "Why do you want my paper?",
            "Catch this book!"
          ],
          correctIndex: 1,
          explanation: "'Here they are, Officer' atau 'Here you are, Sir/Ma'am' adalah ucapan yang sangat santun saat menyerahkan dokumen."
        },
        {
          id: "s2_ep2_q3",
          question: "How should you answer the question: 'How long will you stay?'",
          options: [
            "I will stay for two weeks.",
            "Because I love airplanes.",
            "At the coffee table.",
            "Yesterday afternoon."
          ],
          correctIndex: 0,
          explanation: "'How long' menanyakan durasi waktu, sehingga dijawab dengan satuan waktu (misal: 'for two weeks')."
        },
        {
          id: "s2_ep2_q4",
          question: "What does the phrase 'Everything looks in order' mean?",
          options: [
            "Semua dokumen Anda hilang",
            "Semuanya lengkap, benar, dan teratur",
            "Anda harus membayar denda mahal",
            "Penerbangan dibatalkan hari ini"
          ],
          correctIndex: 1,
          explanation: "'Everything looks in order' menandakan seluruh berkas lengkap dan telah diverifikasi dengan baik."
        },
        {
          id: "s2_ep2_q5",
          question: "Complete the sentence: 'Please ______ your passport at the counter.'",
          options: [
            "show",
            "shows",
            "showing",
            "showed"
          ],
          correctIndex: 0,
          explanation: "Kalimat permohonan santun dengan 'Please' menggunakan kata kerja dasar (base form): 'show'."
        }
      ],
      summary: {
        takeaways: [
          "Menyerahkan paspor dan tiket dengan santun: 'Here they are, Officer.'",
          "Menjawab pertanyaan tujuan perjalanan: 'I am here for study/tourism.'",
          "Memahami etika verifikasi imigrasi internasional."
        ]
      },
      cliffhanger: "Setelah stempel imigrasi dibubuhkan pada paspormu, kamu melangkah masuk ke aula transit. Di hadapanmu, terpampang layar FIDS raksasa dengan ratusan baris nomor penerbangan yang berkedip!"
    },

    // EPISODE 3
    {
      id: 3,
      number: 3,
      title: "Membaca Layar Informasi Penerbangan",
      titleEn: "Reading the Flight Board",
      estimatedMinutes: 10,
      recap: "Kamu berdiri di aula transit utama menatap layar raksasa FIDS (Flight Information Display System). Kamu perlu memeriksa jadwal penerbangan transitmu.",
      dialogue: [
        {
          id: "s2e3_d1",
          speaker: "You",
          en: "Let me check my ticket: Flight SE-402 to Singapore. Where is it on the board?",
          idText: "Biar kulihat tiketku: Penerbangan SE-402 ke Singapura. Di mana posisinya di papan layar?"
        },
        {
          id: "s2e3_d2",
          speaker: "Narator",
          en: "The electronic board flickers. The lines are sorted alphabetically by destination city.",
          idText: "Papan elektronik berkedip. Baris jadwal diurutkan berdasarkan abjad kota tujuan."
        },
        {
          id: "s2e3_choice_1",
          type: "interactive_choice",
          prompt: "Kamu menemukan baris 'SINGAPORE | SE-402 | 14:15 | GATE B24 | ON TIME'. Apa artinya?",
          options: [
            {
              id: "s2e3_opt_1a",
              text: "The flight departs at 2:15 PM from Gate B24 and it is on schedule.",
              speakerReply: "Kanci",
              reactionEn: "Spot on! 'On Time' means there are no delays at all.",
              reactionId: "Tepat sekali! 'On Time' berarti penerbangan tepat waktu tanpa penundaan."
            },
            {
              id: "s2e3_opt_1b",
              text: "The flight is already leaving right now and I must run immediately.",
              speakerReply: "Kanci",
              reactionEn: "No need to panic! It departs at 14:15, so you still have plenty of time.",
              reactionId: "Tidak perlu panik! Berangkat jam 14:15, jadi kamu masih punya banyak waktu."
            }
          ]
        },
        {
          id: "s2e3_d3",
          speaker: "You",
          en: "Good, there is no delay. The departure time is fourteen-fifteen.",
          idText: "Bagus, tidak ada keterlambatan. Waktu keberangkatan pukul 14.15."
        },
        {
          id: "s2e3_d4",
          speaker: "Kanci",
          en: "Selalu perhatikan layar ini setiap 15 menit, karena nomor gate bisa berubah sewaktu-waktu!",
          idText: "Selalu perhatikan layar ini setiap 15 menit, karena nomor gate bisa berubah sewaktu-waktu!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-board-noun",
          word: "board",
          partOfSpeech: "noun",
          enDefinition: "A display screen showing flight departure and arrival times.",
          idMeaning: "papan pengumuman; layar informasi",
          contextSentence: "Check the flight board for gate updates."
        },
        {
          wordId: "batch-screen-noun",
          word: "screen",
          partOfSpeech: "noun",
          enDefinition: "A flat panel or area on an electronic device displaying data.",
          idMeaning: "layar monitor",
          contextSentence: "The screen displays all departing international flights."
        },
        {
          wordId: "batch-time-noun",
          word: "time",
          partOfSpeech: "noun",
          enDefinition: "A point of time as measured in hours and minutes.",
          idMeaning: "waktu; jam keberangkatan",
          contextSentence: "What time does our boarding gate open?"
        },
        {
          wordId: "batch-delay-noun",
          word: "delay",
          partOfSpeech: "noun",
          enDefinition: "A period of time by which something is late or postponed.",
          idMeaning: "penundaan; keterlambatan",
          contextSentence: "Heavy rain caused a one-hour flight delay."
        },
        {
          wordId: "batch-change-verb",
          word: "change",
          partOfSpeech: "verb",
          enDefinition: "To make or become different.",
          idMeaning: "mengubah; berganti",
          contextSentence: "The departure gate can change at short notice."
        },
        {
          wordId: "batch-information-noun",
          word: "information",
          partOfSpeech: "noun",
          enDefinition: "Facts provided or learned about something or someone.",
          idMeaning: "informasi; keterangan",
          contextSentence: "Visit the information desk if you have questions."
        }
      ],
      grammarFocus: {
        title: "Preposisi Waktu Jam ('at 14:15') & Status Jadwal ('On Time')",
        topicId: "present-simple",
        explanation: "Gunakan preposisi 'at' untuk jam yang tepat ('at 14:15'). Istilah 'On Time' berarti sesuai jadwal, sedangkan 'Delayed' berarti mengalami penundaan.",
        formula: "The flight departs at + [Time]. / Status: On Time / Delayed."
      },
      culturalTip: {
        title: "Perbedaan Antara Departure Time dan Boarding Time",
        content: "Banyak pemula salah mengira bahwa mereka boleh datang ke gate saat 'Departure Time'. Faktanya, pintu pesawat ditutup saat 'Boarding Time' (sekitar 20–30 menit sebelum jam keberangkatan)."
      },
      quiz: [
        {
          id: "s2_ep3_q1",
          question: "What does the status 'On Time' mean on a flight information board?",
          options: [
            "Penerbangan dibatalkan sama sekali",
            "Penerbangan berangkat tepat sesuai jadwal",
            "Pesawat sudah terbang satu jam lalu",
            "Tiket pesawat Anda sudah kadaluwarsa"
          ],
          correctIndex: 1,
          explanation: "'On Time' berarti penerbangan beroperasi tepat sesuai waktu yang dijadwalkan."
        },
        {
          id: "s2_ep3_q2",
          question: "What does the word 'Delayed' indicate when shown next to a flight number?",
          options: [
            "Penerbangan mengalami penundaan waktu",
            "Penerbangan mendarat lebih awal",
            "Semua kursi penumpang gratis",
            "Pesawat terbang tanpa bahan bakar"
          ],
          correctIndex: 0,
          explanation: "'Delayed' menandakan adanya penundaan jam keberangkatan atau kedatangan."
        },
        {
          id: "s2_ep3_q3",
          question: "Which preposition of time is correct for a specific clock hour?",
          options: [
            "In 14:15",
            "On 14:15",
            "At 14:15",
            "By 14:15 under"
          ],
          correctIndex: 2,
          explanation: "Preposisi yang tepat untuk menunjukkan jam tertentu adalah 'at' (contoh: 'at 14:15')."
        },
        {
          id: "s2_ep3_q4",
          question: "Why should passengers arrive at the gate before 'Boarding Time'?",
          options: [
            "Because gate doors close before the plane departs",
            "To clean the airplane windows",
            "To sell extra tickets to tourists",
            "To sing songs with the pilot"
          ],
          correctIndex: 0,
          explanation: "Pintu gate ditutup beberapa puluh menit sebelum jam lepas landas, sehingga penumpang wajib tiba saat boarding time."
        },
        {
          id: "s2_ep3_q5",
          question: "What does FIDS stand for in an airport terminal?",
          options: [
            "Fast Internet Dining Service",
            "Flight Information Display System",
            "Foreign Immigration Department Station",
            "Final International Duty Shop"
          ],
          correctIndex: 1,
          explanation: "FIDS adalah singkatan dari Flight Information Display System (layar penampil jadwal penerbangan)."
        }
      ],
      summary: {
        takeaways: [
          "Membaca kolom kota tujuan, nomor penerbangan, gate, dan jam di layar FIDS.",
          "Membedakan arti status 'On Time' dan 'Delayed'.",
          "Memahami selisih waktu antara Boarding Time dan Departure Time."
        ]
      },
      cliffhanger: "Kamu sudah tahu penerbanganmu berangkat dari Gate B24. Tapi saat melihat ke ujung koridor, lorong menuju Concourse B tampak membentang sangat jauh tanpa batas!"
    },

    // EPISODE 4
    {
      id: 4,
      number: 4,
      title: "Menemukan Pintu Keberangkatan",
      titleEn: "Finding the Right Departure Gate",
      estimatedMinutes: 10,
      recap: "Kamu mulai menelusuri koridor terminal yang panjang untuk mencari Gate B24. Jalur pejalan kaki bergerak (moving walkway) tampak membentang di tengah lorong.",
      dialogue: [
        {
          id: "s2e4_d1",
          speaker: "You",
          en: "Concourse B seems very far. Let me check the signs above.",
          idText: "Concourse B tampaknya sangat jauh. Biar kuperiksa papan petunjuk di atas."
        },
        {
          id: "s2e4_d2",
          speaker: "Narator",
          en: "Above your head, a sign says: 'Gates B1–B20: Straight Ahead. Gates B21–B30: Turn Left at the Rotunda.'",
          idText: "Di atas kepalamu, papan petunjuk tertulis: 'Gates B1–B20: Lurus Terus. Gates B21–B30: Belok Kiri di Bundaran.'"
        },
        {
          id: "s2e4_choice_1",
          type: "interactive_choice",
          prompt: "Kamu mencari Gate B24. Jalur mana yang harus kamu tempuh?",
          options: [
            {
              id: "s2e4_opt_1a",
              text: "I must turn left at the rotunda to reach Gate B24.",
              speakerReply: "Kanci",
              reactionEn: "Exactly! B24 is between numbers 21 and 30.",
              reactionId: "Tepat sekali! B24 berada di rentang angka 21 sampai 30."
            },
            {
              id: "s2e4_opt_1b",
              text: "I will keep walking straight ahead toward Gate B1.",
              speakerReply: "Kanci",
              reactionEn: "Careful! Straight ahead is only for Gates B1 to B20. You will miss your flight!",
              reactionId: "Hati-hati! Lurus terus hanya untuk Gates B1 sampai B20. Kamu bisa ketinggalan pesawat!"
            }
          ]
        },
        {
          id: "s2e4_d3",
          speaker: "You",
          en: "Excuse me, Sir. How far is Gate B24 from here?",
          idText: "Permisi, Pak. Seberapa jauh Gate B24 dari sini?"
        },
        {
          id: "s2e4_d4",
          speaker: "Officer",
          en: "It is about a ten-minute walk. If you hurry and use the moving walkway, you will make it easily.",
          idText: "Kira-kira sepuluh menit jalan kaki. Jika Anda bergegas dan memakai eskalator datar, Anda akan sampai dengan mudah."
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-walk-verb",
          word: "walk",
          partOfSpeech: "verb",
          enDefinition: "To move at a regular pace on foot.",
          idMeaning: "berjalan; jalan kaki",
          contextSentence: "You can walk faster by using the moving travelator."
        },
        {
          wordId: "batch-far-adverb",
          word: "far",
          partOfSpeech: "adverb",
          enDefinition: "At, to, or by a great distance.",
          idMeaning: "jauh",
          contextSentence: "How far is the international boarding gate?"
        },
        {
          wordId: "batch-hurry-verb",
          word: "hurry",
          partOfSpeech: "verb",
          enDefinition: "To move or act with great speed.",
          idMeaning: "bergegas; buru-buru",
          contextSentence: "We need to hurry because the gate closes soon."
        },
        {
          wordId: "batch-left-adverb",
          word: "left",
          partOfSpeech: "adverb",
          enDefinition: "Toward or on the left-hand side.",
          idMeaning: "kiri; ke arah kiri",
          contextSentence: "Turn left after the duty-free perfume shop."
        },
        {
          wordId: "batch-right-adverb",
          word: "right",
          partOfSpeech: "adverb",
          enDefinition: "Toward or on the right-hand side.",
          idMeaning: "kanan; ke arah kanan",
          contextSentence: "Restrooms are on your right."
        },
        {
          wordId: "batch-corner-noun",
          word: "corner",
          partOfSpeech: "noun",
          enDefinition: "A place or angle where two or more sides or edges meet.",
          idMeaning: "sudut; tikungan",
          contextSentence: "Turn around the corner to find the gate lounge."
        }
      ],
      grammarFocus: {
        title: "Menanyakan Jarak Tempuh dengan 'How far is...?'",
        topicId: "present-simple",
        explanation: "Gunakan 'How far is [Location]?' untuk menanyakan jarak atau estimasi waktu tempuh berjalan kaki ke sebuah lokasi di dalam bandara.",
        formula: "How far is + [Gate/Location] + from here?"
      },
      culturalTip: {
        title: "Aturan Jalur 'Moving Walkway' (Travelator)",
        content: "Di bandara internasional, jika Anda berdiri diam di atas travelator datar, berdirilah di sisi kanan (*stand on the right*), agar sisi kiri tetap terbuka bagi penumpang yang sedang bergegas mengejar pesawat (*walk on the left*)."
      },
      quiz: [
        {
          id: "s2_ep4_q1",
          question: "How do you ask someone about the distance to a departure gate in English?",
          options: [
            "How heavy is Gate B24?",
            "How far is Gate B24 from here?",
            "Why is Gate B24 sleeping?",
            "What color is Gate B24 singing?"
          ],
          correctIndex: 1,
          explanation: "'How far is [Location] from here?' adalah pertanyaan baku untuk menanyakan jarak."
        },
        {
          id: "s2_ep4_q2",
          question: "If a sign says 'Gates B21–B30: Turn Left', which way should a passenger for B24 go?",
          options: [
            "Belok kanan",
            "Belok kiri",
            "Kembali ke pintu keluar",
            "Duduk di lantai"
          ],
          correctIndex: 1,
          explanation: "Karena Gate B24 berada di rentang B21–B30, penumpang harus belok kiri (*turn left*)."
        },
        {
          id: "s2_ep4_q3",
          question: "What does the word 'hurry' mean?",
          options: [
            "Berjalan sangat lambat",
            "Bergegas atau bergerak cepat",
            "Tidur siang di sofa",
            "Membaca majalah tebal"
          ],
          correctIndex: 1,
          explanation: "'Hurry' berarti bergegas atau mempercepat langkah karena waktu yang terbatas."
        },
        {
          id: "s2_ep4_q4",
          question: "On a moving walkway (travelator), where should you stand if you are not walking?",
          options: [
            "Stand in the middle with your arms open",
            "Stand on the right side",
            "Lie down on the floor",
            "Block everyone behind you"
          ],
          correctIndex: 1,
          explanation: "Sesuai etika internasional: berdiri di sebelah kanan agar penumpang yang terburu-buru bisa lewat di sebelah kiri."
        },
        {
          id: "s2_ep4_q5",
          question: "Complete the sentence: 'It is about a ten-minute ______ to the gate.'",
          options: [
            "walk",
            "walking",
            "walked",
            "walker"
          ],
          correctIndex: 0,
          explanation: "Frasa 'a ten-minute walk' menggunakan kata 'walk' sebagai kata benda (noun) yang berarti 'jarak jalan kaki sepuluh menit'."
        }
      ],
      summary: {
        takeaways: [
          "Menanyakan jarak dan durasi: 'How far is Gate B24 from here?'",
          "Membaca rentang nomor gate pada papan petunjuk terminal.",
          "Menerapkan etika berdiri di sisi kanan pada travelator bandara."
        ]
      },
      cliffhanger: "Kamu tiba di bundaran Concourse B dan siap berbelok ke Gate B24. Tiba-tiba, suara denting lonceng 'ding-dong-dang' bergema keras dari seluruh pengeras suara atap bandara!"
    },

    // EPISODE 5
    {
      id: 5,
      number: 5,
      title: "Pengumuman Darurat di Pengeras Suara",
      titleEn: "The Urgent Announcement",
      estimatedMinutes: 10,
      recap: "Lonceng pengumuman pengeras suara berbunyi nyaring membelah keramaian aula terminal. Suara operator bandara terdengar menyiarkan pengumuman penting.",
      dialogue: [
        {
          id: "s2e5_d1",
          speaker: "Narator",
          en: "A clear chime echoes through the concourse: 'Ding-dong-dang.'",
          idText: "Lonceng jernih bergema di seluruh koridor: 'Ding-dong-dang.'"
        },
        {
          id: "s2e5_d2",
          speaker: "Speaker",
          en: "Attention, please. Attention all passengers on flight SE-402 to Singapore.",
          idText: "Mohon perhatian. Perhatian bagi seluruh penumpang penerbangan SE-402 menuju Singapura."
        },
        {
          id: "s2e5_d3",
          speaker: "You",
          en: "Wait! That is my flight number! Listen carefully!",
          idText: "Tunggu! Itu nomor penerbanganku! Dengarkan baik-baik!"
        },
        {
          id: "s2e5_d4",
          speaker: "Speaker",
          en: "There is an immediate gate change. Flight SE-402 will now depart from Gate B28. I repeat: Gate B28.",
          idText: "Terdapat perubahan pintu segera. Penerbangan SE-402 sekarang akan diberangkatkan dari Gate B28. Saya ulangi: Gate B28."
        },
        {
          id: "s2e5_choice_1",
          type: "interactive_choice",
          prompt: "Apa yang kamu lakukan setelah mendengar pengumuman pemindahan gate tersebut?",
          options: [
            {
              id: "s2e5_opt_1a",
              text: "I will check the nearest monitor to confirm that B24 changed to B28.",
              speakerReply: "Kanci",
              reactionEn: "Smart thinking! Always verify announcements on the screen.",
              reactionId: "Pemikiran cerdas! Selalu pastikan pengumuman suara di layar monitor."
            },
            {
              id: "s2e5_opt_1b",
              text: "I will head directly to Gate B28 right away without delay.",
              speakerReply: "Kanci",
              reactionEn: "Good urgency! Gate B28 is further down the hall, so start walking now.",
              reactionId: "Kecepatan yang bagus! Gate B28 berada lebih jauh di ujung lorong, jalanlah sekarang."
            }
          ]
        },
        {
          id: "s2e5_d5",
          speaker: "Kanci",
          en: "Kata kunci pengumuman bandara: 'Attention please' (mohon perhatian) dan 'Gate change' (perubahan pintu keberangkatan)!",
          idText: "Kata kunci pengumuman bandara: 'Attention please' (mohon perhatian) dan 'Gate change' (perubahan pintu keberangkatan)!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-listen-verb",
          word: "listen",
          partOfSpeech: "verb",
          enDefinition: "To give one's attention to a sound.",
          idMeaning: "mendengarkan; menyimak",
          contextSentence: "Please listen closely to all public address announcements."
        },
        {
          wordId: "batch-hear-verb",
          word: "hear",
          partOfSpeech: "verb",
          enDefinition: "To perceive with the ear the sound made by someone or something.",
          idMeaning: "mendengar",
          contextSentence: "Did you hear the announcement about our flight?"
        },
        {
          wordId: "batch-voice-noun",
          word: "voice",
          partOfSpeech: "noun",
          enDefinition: "The sound produced in a person's larynx and uttered through the mouth.",
          idMeaning: "suara; vokal",
          contextSentence: "The operator's voice was calm and distinct."
        },
        {
          wordId: "batch-attention-noun",
          word: "attention",
          partOfSpeech: "noun",
          enDefinition: "Notice taken of someone or something; the regarding of someone or something as interesting.",
          idMeaning: "perhatian",
          contextSentence: "Attention please, boarding will commence shortly."
        },
        {
          wordId: "batch-passenger-noun",
          word: "passenger",
          partOfSpeech: "noun",
          enDefinition: "A traveler on a public or private conveyance other than the driver, pilot, or crew.",
          idMeaning: "penumpang",
          contextSentence: "All transit passengers should keep their boarding cards ready."
        },
        {
          wordId: "batch-move-verb",
          word: "move",
          partOfSpeech: "verb",
          enDefinition: "To go in a specified direction or manner; change position.",
          idMeaning: "berpindah; bergerak",
          contextSentence: "Passengers must move to the newly assigned gate."
        }
      ],
      grammarFocus: {
        title: "Mengenali Struktur Pengumuman Formal ('Passengers are requested to...')",
        topicId: "present-simple",
        explanation: "Pengumuman bandara memakai kalimat formal pasif: 'Passengers are requested to move to Gate [Number]' atau bentuk masa depan 'Flight [Code] will depart from Gate [Number]'.",
        formula: "Attention please. Flight [Code] will now depart from Gate [New Gate]."
      },
      culturalTip: {
        title: "Kosakata Krusial Pengumuman Bandara",
        content: "Kenali frasa-frasa standar ini: 'Final boarding call' (panggilan terakhir penumpang), 'Gate change' (pintu keberangkatan pindah), dan 'Immediate boarding' (segera naik pesawat)."
      },
      quiz: [
        {
          id: "s2_ep5_q1",
          question: "What does the phrase 'Gate Change' mean in an airport broadcast?",
          options: [
            "Semua pintu bandara dikunci",
            "Pesawat pindah ke pintu keberangkatan yang berbeda",
            "Pintu gerbang bandara dicat ulang",
            "Penumpang harus keluar dari terminal"
          ],
          correctIndex: 1,
          explanation: "'Gate Change' berarti pesawat dipindahkan ke pintu keberangkatan lain yang baru."
        },
        {
          id: "s2_ep5_q2",
          question: "What standard phrase is used to ask for the listeners' focus before an announcement?",
          options: [
            "Sleep please",
            "Attention please",
            "Forget everything",
            "Run away now"
          ],
          correctIndex: 1,
          explanation: "'Attention please' adalah frasa standar untuk meminta perhatian seluruh pendengar."
        },
        {
          id: "s2_ep5_q3",
          question: "Which gate was flight SE-402 moved to according to the announcement?",
          options: [
            "Gate A1",
            "Gate B24",
            "Gate B28",
            "Gate C99"
          ],
          correctIndex: 2,
          explanation: "Pengumuman menyebutkan: 'Flight SE-402 will now depart from Gate B28'."
        },
        {
          id: "s2_ep5_q4",
          question: "What does 'Final Call' mean in an airport announcement?",
          options: [
            "Panggilan pertama untuk makan siang",
            "Panggilan terakhir bagi penumpang yang belum naik sebelum pintu ditutup",
            "Telepon dari keluarga di rumah",
            "Pemberitahuan bahwa tiket gratis"
          ],
          correctIndex: 1,
          explanation: "'Final Call' adalah panggilan terakhir bagi penumpang yang tersisa sebelum pintu keberangkatan dikunci."
        },
        {
          id: "s2_ep5_q5",
          question: "Complete the sentence: 'Passengers are requested to ______ to Gate B28.'",
          options: [
            "move",
            "moving",
            "moved",
            "moves"
          ],
          correctIndex: 0,
          explanation: "Setelah konstruksi 'to' infinitive ('to + verb base'), gunakan kata kerja dasar: 'move'."
        }
      ],
      summary: {
        takeaways: [
          "Memahami pengumuman pengeras suara bandara: 'Attention please.'",
          "Merespons informasi krusial pemindahan pintu: 'Gate change'.",
          "Mengecek ulang informasi di monitor terdekat sebelum melangkah."
        ]
      },
      cliffhanger: "Kamu hendak menuju Gate B28, tetapi di persimpangan lorong, petunjuk arah ke Gate B28 tampak tertutup tirai perbaikan. Di sampingmu terdapat meja bundar 'Customer Information Desk'."
    },

    // EPISODE 6
    {
      id: 6,
      number: 6,
      title: "Bertanya ke Meja Informasi",
      titleEn: "Asking at the Information Desk",
      estimatedMinutes: 10,
      recap: "Lorong menuju Gate B28 sedang dalam perbaikan sebagian. Untuk memastikan jalur pintas yang aman, kamu mendekati Meja Informasi Pelanggan.",
      dialogue: [
        {
          id: "s2e6_d1",
          speaker: "You",
          en: "Excuse me. Could you help me with directions to Gate B28, please?",
          idText: "Permisi. Bisakah Anda membantu saya dengan petunjuk arah menuju Gate B28?"
        },
        {
          id: "s2e6_d2",
          speaker: "Officer",
          en: "Certainly! The main hallway is undergoing maintenance. May I see your boarding card?",
          idText: "Tentu saja! Lorong utama sedang dalam pemeliharaan. Boleh saya lihat kartu boarding Anda?"
        },
        {
          id: "s2e6_choice_1",
          type: "interactive_choice",
          prompt: "Petugas menjelaskan: 'Take the elevator to the 3rd floor and cross Skybridge 2.' Bagaimana kamu mengonfirmasinya?",
          options: [
            {
              id: "s2e6_opt_1a",
              text: "So I take the elevator up to level 3 and walk across Skybridge 2?",
              speakerReply: "Officer",
              reactionEn: "Yes, exactly! Skybridge 2 brings you right in front of Gate B28.",
              reactionId: "Ya, tepat sekali! Jembatan penyeberangan 2 membawa Anda tepat ke depan Gate B28."
            },
            {
              id: "s2e6_opt_1b",
              text: "Could you please explain that once more slowly?",
              speakerReply: "Officer",
              reactionEn: "Of course! Elevator on your left, press 3, then follow the green signs for Skybridge 2.",
              reactionId: "Tentu! Lift di sebelah kiri Anda, tekan lantai 3, lalu ikuti papan hijau Skybridge 2."
            }
          ]
        },
        {
          id: "s2e6_d3",
          speaker: "You",
          en: "I understand now. Thank you so much for your explanation!",
          idText: "Saya paham sekarang. Terima kasih banyak atas penjelasannya!"
        },
        {
          id: "s2e6_d4",
          speaker: "Kanci",
          en: "Hebat! Jangan ragu mengulang penjelasan petugas ('Could you please explain that once more?') bila belum yakin!",
          idText: "Hebat! Jangan ragu mengulang penjelasan petugas ('Could you please explain that once more?') bila belum yakin!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-desk-noun",
          word: "desk",
          partOfSpeech: "noun",
          enDefinition: "A counter or table at which specific information or services are provided.",
          idMeaning: "meja layanan; konter informasi",
          contextSentence: "The customer information desk is staffed around the clock."
        },
        {
          wordId: "batch-ask-verb",
          word: "ask",
          partOfSpeech: "verb",
          enDefinition: "To say something in order to obtain an answer or some information.",
          idMeaning: "bertanya; meminta",
          contextSentence: "Do not hesitate to ask ground staff for guidance."
        },
        {
          wordId: "batch-help-noun",
          word: "help",
          partOfSpeech: "noun",
          enDefinition: "The action of helping someone to do something; assistance.",
          idMeaning: "bantuan; pertolongan",
          contextSentence: "Thank you for your timely help."
        },
        {
          wordId: "batch-direction-noun",
          word: "direction",
          partOfSpeech: "noun",
          enDefinition: "Instructions or indications on how to reach a destination.",
          idMeaning: "arah; petunjuk arah",
          contextSentence: "Follow the clear direction signs to the departure gate."
        },
        {
          wordId: "batch-understand-verb",
          word: "understand",
          partOfSpeech: "verb",
          enDefinition: "To perceive the intended meaning of words or instructions.",
          idMeaning: "memahami; mengerti",
          contextSentence: "Did you understand the clerk's instructions?"
        },
        {
          wordId: "batch-explain-verb",
          word: "explain",
          partOfSpeech: "verb",
          enDefinition: "To make an idea, situation, or problem clear to someone by describing it in more detail.",
          idMeaning: "menjelaskan; menerangkan",
          contextSentence: "The agent will explain how to reach the upper level."
        }
      ],
      grammarFocus: {
        title: "Klarifikasi Pemahaman: 'So I need to...?' & 'I understand now'",
        topicId: "present-simple",
        explanation: "Saat menerima instruksi arah yang rumit di bandara, gunakan teknik parafrase: 'So I take the [Elevator/Train] and [Action]?' untuk memastikan kamu tidak salah jalan.",
        formula: "So I need to + [Verb] + and then + [Verb]? / I understand now."
      },
      culturalTip: {
        title: "Memanfaatkan Meja Informasi (Customer Service) Bandara",
        content: "Petugas meja informasi bandara memiliki akses langsung ke peta sistem terminal dan nomor kontak operasional seluruh maskapai. Menanyakan petunjuk ke meja informasi selalu jauh lebih aman daripada menebak-nebak jalan sendiri."
      },
      quiz: [
        {
          id: "s2_ep6_q1",
          question: "Which of the following is the most polite question to ask for directions at an information desk?",
          options: [
            "Hey, tell me where B28 is or else!",
            "Could you please help me with directions to Gate B28?",
            "Your airport is terrible and confusing.",
            "I want to sit on your desk."
          ],
          correctIndex: 1,
          explanation: "'Could you please help me with directions to Gate B28?' adalah permintaan bantuan yang sangat sopan dan profesional."
        },
        {
          id: "s2_ep6_q2",
          question: "What should you say if you did not clearly catch what the officer just explained?",
          options: [
            "Stop talking forever.",
            "Could you please explain that once more slowly?",
            "You are wrong and I am right.",
            "Never mind, I will sleep here."
          ],
          correctIndex: 1,
          explanation: "'Could you please explain that once more slowly?' adalah cara santun meminta pengulangan penjelasan."
        },
        {
          id: "s2_ep6_q3",
          question: "How did the clerk instruct you to reach Gate B28?",
          options: [
            "Swim across the lake",
            "Take the elevator to level 3 and cross Skybridge 2",
            "Climb out the window to the roof",
            "Take a taxi outside the airport"
          ],
          correctIndex: 1,
          explanation: "Petugas menjelaskan: naik lift ke lantai 3 dan lewati Skybridge 2."
        },
        {
          id: "s2_ep6_q4",
          question: "What does the word 'understand' mean in Indonesian?",
          options: [
            "Menolak",
            "Memahami / Mengerti",
            "Melupakan",
            "Membayar"
          ],
          correctIndex: 1,
          explanation: "'Understand' berarti memahami atau mengerti maksud perkataan."
        },
        {
          id: "s2_ep6_q5",
          question: "Complete the sentence: 'Thank you for your clear ______.'",
          options: [
            "explain",
            "explaining",
            "explanation",
            "explains"
          ],
          correctIndex: 2,
          explanation: "Setelah kata sifat 'clear', kita membutuhkan bentuk kata benda (noun): 'explanation'."
        }
      ],
      summary: {
        takeaways: [
          "Bertanya petunjuk jalan di meja informasi dengan kalimat santun.",
          "Melakukan konfirmasi ulang arah jalan dengan teknik parafrase.",
          "Memahami instruksi transit elevator dan jembatan penghubung (Skybridge)."
        ]
      },
      cliffhanger: "Setelah menyeberangi Skybridge 2, kamu melihat pos pemeriksaan keamanan transit (Security Check) dengan mesin X-ray scanner dan deretan keranjang plastik abu-abu!"
    },

    // EPISODE 7
    {
      id: 7,
      number: 7,
      title: "Melewati Pemeriksaan Keamanan",
      titleEn: "Going Through Security Check",
      estimatedMinutes: 10,
      recap: "Sebelum memasuki area Gate B28, seluruh penumpang transit wajib melewati pos pemeriksaan keamanan dan mesin pemindai sinar-X.",
      dialogue: [
        {
          id: "s2e7_d1",
          speaker: "Officer",
          en: "Please take off your jacket and empty your pockets into the plastic tray.",
          idText: "Silakan lepas jaket Anda dan kosongkan saku celana Anda ke dalam baki plastik."
        },
        {
          id: "s2e7_d2",
          speaker: "You",
          en: "Should I take my laptop out of my backpack?",
          idText: "Apakah saya harus mengeluarkan laptop dari ransel saya?"
        },
        {
          id: "s2e7_choice_1",
          type: "interactive_choice",
          prompt: "Petugas keamanan menjawab: 'Yes, all electronic devices and liquids must be placed in a separate bin.' Bagaimana responmu?",
          options: [
            {
              id: "s2e7_opt_1a",
              text: "Understood. I will place my laptop and small toiletry pouch here.",
              speakerReply: "Officer",
              reactionEn: "Thank you. Please ensure all liquids are under 100 milliliters.",
              reactionId: "Terima kasih. Pastikan seluruh cairan berukuran di bawah 100 mililiter."
            },
            {
              id: "s2e7_opt_1b",
              text: "I only have my phone and keys in my pocket. Can they go in the tray?",
              speakerReply: "Officer",
              reactionEn: "Yes, exactly. Place all metal items and belts in the tray as well.",
              reactionId: "Ya, tepat sekali. Taruh juga semua benda logam dan ikat pinggang di baki."
            }
          ]
        },
        {
          id: "s2e7_d3",
          speaker: "Officer",
          en: "Now, please walk through the metal detector frame when the light turns green.",
          idText: "Sekarang, silakan melangkah melewati bingkai detektor logam saat lampu berwarna hijau."
        },
        {
          id: "s2e7_d4",
          speaker: "Kanci",
          en: "Bagus sekali! Siapkan laptop, sabuk, dan barang logammu sebelum tiba di bibir meja agar antrean tidak macet!",
          idText: "Bagus sekali! Siapkan laptop, sabuk, dan barang logammu sebelum tiba di bibir meja agar antrean tidak macet!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-security-noun",
          word: "security",
          partOfSpeech: "noun",
          enDefinition: "The state of being free from danger or threat; the procedures for safety inspection.",
          idMeaning: "keamanan; pos pemeriksaan keamanan",
          contextSentence: "Pass through airport security with your boarding pass in hand."
        },
        {
          wordId: "batch-bag-noun",
          word: "bag",
          partOfSpeech: "noun",
          enDefinition: "A container made of flexible material with an opening at the top.",
          idMeaning: "tas; ransel",
          contextSentence: "Place your carry-on bag flat on the conveyor belt."
        },
        {
          wordId: "batch-pocket-noun",
          word: "pocket",
          partOfSpeech: "noun",
          enDefinition: "A small bag sewn into or on clothing for carrying small articles.",
          idMeaning: "saku; kantong pakaian",
          contextSentence: "Empty all coins and keys from your front pockets."
        },
        {
          wordId: "batch-take-verb",
          word: "take",
          partOfSpeech: "verb",
          enDefinition: "To remove from a place or container.",
          idMeaning: "mengambil; mengeluarkan (dengan out/off)",
          contextSentence: "Take off your winter coat before stepping forward."
        },
        {
          wordId: "batch-liquid-noun",
          word: "liquid",
          partOfSpeech: "noun",
          enDefinition: "A substance that flows freely but is of constant volume, having a consistency like that of water.",
          idMeaning: "cairan",
          contextSentence: "Liquids over one hundred milliliters are strictly prohibited."
        },
        {
          wordId: "batch-metal-noun",
          word: "metal",
          partOfSpeech: "noun",
          enDefinition: "A solid material that is typically hard, shiny, and good at conducting electricity.",
          idMeaning: "logam; benda besi",
          contextSentence: "Remove your metal belt buckle to prevent the alarm from beeping."
        }
      ],
      grammarFocus: {
        title: "Instruksi Imperatif Pemeriksaan Keamanan ('Take off...', 'Place...')",
        topicId: "present-simple",
        explanation: "Petugas bandara memakai kalimat perintah instruksi (imperative) langsung yang sopan dengan kata 'Please': 'Please take off [Clothing]' atau 'Please place [Item] in the tray'.",
        formula: "Please + [Verb Base] + [Object] + [Location]."
      },
      culturalTip: {
        title: "Aturan Internasional Cairan Kabin 100ml (3-1-1 Rule)",
        content: "Di sebagian besar bandara dunia, cairan di tas jinjing (*carry-on bag*) tidak boleh melebihi 100ml per wadah dan harus dimasukkan dalam kantong plastik transparan bersegel rapat."
      },
      quiz: [
        {
          id: "s2_ep7_q1",
          question: "What is the maximum liquid volume allowed per bottle in carry-on baggage at airport security?",
          options: [
            "100 milliliters",
            "2 liters",
            "500 milliliters",
            "Unlimited volume"
          ],
          correctIndex: 0,
          explanation: "Aturan internasional standar penerbangan membatasi wadah cairan maksimal 100ml di tas kabin."
        },
        {
          id: "s2_ep7_q2",
          question: "What should you do with your laptop when passing through the security checkpoint?",
          options: [
            "Hide it deep under your winter clothes",
            "Take it out of your bag and place it in a separate tray",
            "Throw it into the trash can",
            "Give it to another passenger"
          ],
          correctIndex: 1,
          explanation: "Laptop dan tablet berukuran besar harus dikeluarkan dari ransel dan ditaruh di baki terpisah agar terbaca jelas oleh mesin X-ray."
        },
        {
          id: "s2_ep7_q3",
          question: "What does the instruction 'Empty your pockets' mean?",
          options: [
            "Isi saku Anda dengan banyak permen",
            "Kosongkan semua isi saku pakaian Anda",
            "Jahit saku celana Anda sampai rapat",
            "Gunting saku baju Anda"
          ],
          correctIndex: 1,
          explanation: "'Empty your pockets' berarti mengeluarkan semua benda yang ada di dalam saku (koin, kunci, ponsel)."
        },
        {
          id: "s2_ep7_q4",
          question: "Why should you remove metal items before passing through the scanner?",
          options: [
            "Metal items make the detector beep an alarm",
            "Metal is too heavy to carry on a plane",
            "Metal changes the weather outside",
            "The officer wants to collect metal souvenirs"
          ],
          correctIndex: 0,
          explanation: "Benda logam (kunci, koin, kepala gesper sabuk) akan memicu bunyi alarm pada alat pendeteksi logam."
        },
        {
          id: "s2_ep7_q5",
          question: "Complete the sentence: 'Please ______ off your coat before scanning.'",
          options: [
            "take",
            "taking",
            "took",
            "taken"
          ],
          correctIndex: 0,
          explanation: "Kalimat perintah santun diawali dengan kata kerja bentuk dasar (base form): 'take'."
        }
      ],
      summary: {
        takeaways: [
          "Memahami aturan pelepasan jaket, sabuk, dan barang logam di pos sekuriti.",
          "Menerapkan aturan batas cairan 100ml pada tas kabin.",
          "Mengikuti instruksi imperatif petugas: 'Please take off...' dan 'Please place...'"
        ]
      },
      cliffhanger: "Setelah berhasil melewati bingkai detektor logam tanpa alarm berbunyi, kamu mengambil kembali barangmu dari sabuk berjalan. Tapi tiba-tiba hatimu berdegup kencang: di mana ransel kecil warna birumu?!"
    },

    // EPISODE 8
    {
      id: 8,
      number: 8,
      title: "Koper yang Nyaris Tertinggal",
      titleEn: "The Forgotten Carry-on Bag",
      estimatedMinutes: 10,
      recap: "Kamu tersadar bahwa tas ransel kecil warna birumu tertinggal di bangku tunggu sebelum pos pemeriksaan. Kamu harus segera meminta bantuan petugas keamanan.",
      dialogue: [
        {
          id: "s2e8_d1",
          speaker: "You",
          en: "Excuse me, Officer! I have an emergency. I think I left my small blue bag on the bench outside!",
          idText: "Permisi, Petugas! Saya mengalami keadaan darurat. Sepertinya tas kecil biru saya tertinggal di bangku luar!"
        },
        {
          id: "s2e8_d2",
          speaker: "Officer",
          en: "Calm down, please. What color is the bag, and what items are inside?",
          idText: "Harap tenang. Apa warna tasnya, dan benda apa saja yang ada di dalamnya?"
        },
        {
          id: "s2e8_choice_1",
          type: "interactive_choice",
          prompt: "Bagaimana caramu mendeskripsikan ciri-ciri tasmu dengan jelas?",
          options: [
            {
              id: "s2e8_opt_1a",
              text: "It is a navy blue backpack with a yellow leather keychain and a water bottle.",
              speakerReply: "Officer",
              reactionEn: "Hold on. Our floor patrol officer just brought in a matching blue bag.",
              reactionId: "Tunggu sebentar. Petugas patroli kami baru saja membawa tas biru yang cocok."
            },
            {
              id: "s2e8_opt_1b",
              text: "It has my diary and a travel guide book inside, with a small brass zipper.",
              speakerReply: "Officer",
              reactionEn: "Let me check the custody log. Yes, we found it safely near Bench 12.",
              reactionId: "Biar kuperiksa catatan pengamanan. Ya, kami menemukannya dengan aman dekat Bangku 12."
            }
          ]
        },
        {
          id: "s2e8_d3",
          speaker: "Officer",
          en: "Here it is! Please check your belongings and make sure nothing is missing.",
          idText: "Ini dia! Silakan periksa barang bawaan Anda dan pastikan tidak ada yang hilang."
        },
        {
          id: "s2e8_d4",
          speaker: "You",
          en: "Everything is safe! Thank you from the bottom of my heart, Officer!",
          idText: "Semuanya aman! Terima kasih dari lubuk hati saya yang terdalam, Petugas!"
        },
        {
          id: "s2e8_d5",
          speaker: "Kanci",
          en: "Fiuh! Untung lekas tersadar! Jangan pernah meninggalkan tas tanpa pengawasan di bandara, ya!",
          idText: "Fiuh! Untung lekas tersadar! Jangan pernah meninggalkan tas tanpa pengawasan di bandara, ya!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-leave-verb",
          word: "leave",
          partOfSpeech: "verb",
          enDefinition: "To go away from a place without taking something.",
          idMeaning: "meninggalkan; tertinggal",
          contextSentence: "I accidentally left my backpack on the airport chair."
        },
        {
          wordId: "batch-forget-verb",
          word: "forget",
          partOfSpeech: "verb",
          enDefinition: "To fail to remember or think of something.",
          idMeaning: "lupa; melupakan",
          contextSentence: "Do not forget your wallet on the counter."
        },
        {
          wordId: "batch-find-verb",
          word: "find",
          partOfSpeech: "verb",
          enDefinition: "To discover after searching for something lost.",
          idMeaning: "menemukan",
          contextSentence: "The ground staff helped me find my lost pouch."
        },
        {
          wordId: "batch-color-noun",
          word: "color",
          partOfSpeech: "noun",
          enDefinition: "The property possessed by an object of producing different sensations on the eye.",
          idMeaning: "warna",
          contextSentence: "The bag is a distinctive navy blue color."
        },
        {
          wordId: "batch-look-verb",
          word: "look",
          partOfSpeech: "verb",
          enDefinition: "To search or examine carefully.",
          idMeaning: "mencari; memeriksa",
          contextSentence: "Let me look through the lost property database."
        },
        {
          wordId: "batch-thank-verb",
          word: "thank",
          partOfSpeech: "verb",
          enDefinition: "To express gratitude to someone.",
          idMeaning: "berterima kasih; bersyukur",
          contextSentence: "I want to thank the officers for their fast response."
        }
      ],
      grammarFocus: {
        title: "Mendeskripsikan Barang Hilang dengan Simple Past & Adjectives",
        topicId: "past-simple",
        explanation: "Gunakan Simple Past Tense ('I left...', 'I forgot...') digabung kata sifat deskriptif (warna, ukuran, bahan) saat melaporkan barang tertinggal kepada petugas.",
        formula: "I left my + [Adjective: Size/Color] + [Noun] + near [Location]."
      },
      culturalTip: {
        title: "Peringatan Keamanan Terkait 'Unattended Baggage'",
        content: "Di bandara internasional terdapat peringatan ketat: tas yang ditinggalkan tanpa pemilik (*unattended baggage*) dapat diamankan atau dimusnahkan oleh tim penjinak bom karena alasan keselamatan. Jangan pernah meninggalkan barang bawaanmu sedetik pun."
      },
      quiz: [
        {
          id: "s2_ep8_q1",
          question: "What does the phrase 'unattended baggage' mean in airport security terms?",
          options: [
            "Tas yang dibeli dengan diskon besar",
            "Barang atau koper yang ditinggalkan tanpa pemilik di dekatnya",
            "Tas yang diisi dengan hadiah oleh pramugari",
            "Koper yang memiliki roda empat"
          ],
          correctIndex: 1,
          explanation: "'Unattended baggage' adalah tas yang ditinggalkan tanpa pengawasan pemilik, yang memicu peringatan keselamatan darurat di bandara."
        },
        {
          id: "s2_ep8_q2",
          question: "How did you describe your lost bag to the security officer?",
          options: [
            "A heavy wooden box with gold coins",
            "A navy blue backpack with a yellow leather keychain",
            "A giant red umbrella with flowers",
            "A dirty plastic bag filled with rocks"
          ],
          correctIndex: 1,
          explanation: "Kamu mendeskripsikan ciri-cirinya: ransel biru tua (navy blue backpack) dengan gantungan kunci kuning."
        },
        {
          id: "s2_ep8_q3",
          question: "Choose the correct past tense sentence to report a forgotten item:",
          options: [
            "I leave my bag tomorrow morning.",
            "I left my small bag on the bench outside.",
            "I am leave my bag right now.",
            "I will leaving my bag yesterday."
          ],
          correctIndex: 1,
          explanation: "Bentuk lampau (Past Tense) dari 'leave' adalah 'left': 'I left my small bag on the bench outside'."
        },
        {
          id: "s2_ep8_q4",
          question: "What did the officer instruct you to do after returning the bag?",
          options: [
            "Throw it on the floor immediately",
            "Check your belongings to ensure nothing is missing",
            "Run out of the airport into the street",
            "Pay one million dollars cash"
          ],
          correctIndex: 1,
          explanation: "Petugas meminta: 'Please check your belongings and make sure nothing is missing'."
        },
        {
          id: "s2_ep8_q5",
          question: "What is the past tense form of the verb 'find'?",
          options: [
            "Finded",
            "Found",
            "Finding",
            "Finds"
          ],
          correctIndex: 1,
          explanation: "Bentuk lampau tidak beraturan (irregular past tense) dari 'find' adalah 'found'."
        }
      ],
      summary: {
        takeaways: [
          "Melaporkan barang tertinggal dengan Simple Past: 'I left my bag...'",
          "Memberikan deskripsi warna, ukuran, dan ciri unik barang bawaan.",
          "Memahami risiko keamanan meninggalkan tas tanpa pengawasan (unattended baggage)."
        ]
      },
      cliffhanger: "Ranselmu sudah kembali aman di pundakmu. Saat melangkah ke ruang tunggu Gate B28, tenggorokanmu terasa sangat kering dan haus setelah ketegangan tadi. Di depan gate terdapat sebuah kios air minum bebas bea!"
    },

    // EPISODE 9
    {
      id: 9,
      number: 9,
      title: "Membeli Air Mineral di Area Transit",
      titleEn: "Buying Water in the Transit Area",
      estimatedMinutes: 10,
      recap: "Setelah melewati pos sekuriti, kamu berada di area steril keberangkatan (airside). Sebelum naik pesawat, kamu mampir ke kios toko swalayan bandara untuk membeli sebotol air minum mineral.",
      dialogue: [
        {
          id: "s2e9_d1",
          speaker: "You",
          en: "Good day. Can I have a cold bottle of mineral water, please?",
          idText: "Selamat siang. Boleh saya minta sebotol air mineral dingin?"
        },
        {
          id: "s2e9_d2",
          speaker: "Shopkeeper",
          en: "Of course! Still water or sparkling water?",
          idText: "Tentu saja! Air mineral biasa (still) atau air berkarbonasi (sparkling)?"
        },
        {
          id: "s2e9_choice_1",
          type: "interactive_choice",
          prompt: "Bagaimana kamu memilih jenis air dan menanyakan harganya?",
          options: [
            {
              id: "s2e9_opt_1a",
              text: "Still water, please. How much does it cost?",
              speakerReply: "Shopkeeper",
              reactionEn: "That will be three dollars and fifty cents.",
              reactionId: "Harganya tiga dollar lima puluh sen."
            },
            {
              id: "s2e9_opt_1b",
              text: "Sparkling water with lemon, please. Can I pay with credit card?",
              speakerReply: "Shopkeeper",
              reactionEn: "Certainly! You can tap your contactless card right on the reader.",
              reactionId: "Tentu saja! Anda bisa menempelkan kartu nirsentuh Anda di mesin pembaca."
            }
          ]
        },
        {
          id: "s2e9_d3",
          speaker: "You",
          en: "Here is my card. Thank you very much!",
          idText: "Ini kartu saya. Terima kasih banyak!"
        },
        {
          id: "s2e9_d4",
          speaker: "Shopkeeper",
          en: "Here is your receipt and cold bottle. Have a safe and pleasant flight!",
          idText: "Ini struk dan botol dingin Anda. Semoga penerbangan Anda aman dan menyenangkan!"
        },
        {
          id: "s2e9_d5",
          speaker: "Kanci",
          en: "Ingat istilah penting di luar negeri: 'Still water' artinya air mineral biasa tanpa soda, sedangkan 'Sparkling water' berkarbonasi!",
          idText: "Ingat istilah penting di luar negeri: 'Still water' artinya air mineral biasa tanpa soda, sedangkan 'Sparkling water' berkarbonasi!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-water-noun",
          word: "water",
          partOfSpeech: "noun",
          enDefinition: "A colorless, transparent, odorless liquid that forms the seas, lakes, rivers, and rain.",
          idMeaning: "air; air minum",
          contextSentence: "Drink plenty of water to stay hydrated during a long flight."
        },
        {
          wordId: "batch-bottle-noun",
          word: "bottle",
          partOfSpeech: "noun",
          enDefinition: "A container with a narrow neck, used for storing drinks or other liquids.",
          idMeaning: "botol",
          contextSentence: "You can buy a sealed bottle of water after the security checkpoint."
        },
        {
          wordId: "batch-buy-verb",
          word: "buy",
          partOfSpeech: "verb",
          enDefinition: "To obtain in exchange for payment.",
          idMeaning: "membeli",
          contextSentence: "I need to buy a small snack before boarding the plane."
        },
        {
          wordId: "batch-pay-verb",
          word: "pay",
          partOfSpeech: "verb",
          enDefinition: "To give someone money that is due for work done, goods received, or a debt incurred.",
          idMeaning: "membayar",
          contextSentence: "May I pay using foreign currency or card?"
        },
        {
          wordId: "batch-coin-noun",
          word: "coin",
          partOfSpeech: "noun",
          enDefinition: "A flat, typically round piece of metal with an official stamp, used as money.",
          idMeaning: "koin; uang logam",
          contextSentence: "Keep your spare foreign coins for vending machines."
        },
        {
          wordId: "batch-price-noun",
          word: "price",
          partOfSpeech: "noun",
          enDefinition: "The amount of money expected, required, or given in payment for something.",
          idMeaning: "harga",
          contextSentence: "Airport kiosk prices are slightly higher than city shops."
        }
      ],
      grammarFocus: {
        title: "Countable vs Uncountable Nouns: 'Water' vs 'A bottle of water'",
        topicId: "present-simple",
        explanation: "Kata 'water' adalah uncountable noun (tidak bisa dihitung dengan angka langsung). Untuk menyatakan jumlahnya, gunakan penghitung kuantitas (partitive noun): 'a bottle of water' atau 'two cups of water'.",
        formula: "A bottle of + [Uncountable Liquid] / Can I have a bottle of water?"
      },
      culturalTip: {
        title: "Perbedaan 'Still Water' vs 'Sparkling Water' di Kafe/Kios Asing",
        content: "Di Eropa dan banyak negara Barat, jika Anda hanya meminta 'water', pelayan sering kali memberikan 'sparkling water' (air bersoda). Jika Anda ingin air mineral tawar biasa tanpa gelembung gas, selalu katakan 'Still water'."
      },
      quiz: [
        {
          id: "s2_ep9_q1",
          question: "What is the difference between 'still water' and 'sparkling water'?",
          options: [
            "Still water is warm milk; sparkling water is orange juice",
            "Still water is plain non-carbonated water; sparkling water contains fizzy carbonation",
            "Still water is salty; sparkling water is sweet chocolate",
            "There is no difference at all"
          ],
          correctIndex: 1,
          explanation: "'Still water' adalah air putih biasa tanpa soda/gelembung, sedangkan 'sparkling water' adalah air berkarbonasi."
        },
        {
          id: "s2_ep9_q2",
          question: "Why is water permitted to be carried into the plane when purchased after the security gate?",
          options: [
            "Because it was already screened inside the sterile transit zone",
            "Because airplanes do not have clean air",
            "Because airport water is made of magic gold",
            "Because the pilot loves collecting empty bottles"
          ],
          correctIndex: 0,
          explanation: "Minuman yang dibeli setelah pos sekuriti berada di zona steril yang aman dan diperiksa, sehingga boleh dibawa ke kabin pesawat."
        },
        {
          id: "s2_ep9_q3",
          question: "Which of the following is grammatically correct to order liquid?",
          options: [
            "Can I have two waters bottles please?",
            "Can I have a bottle of water, please?",
            "Give me one liquid now.",
            "I want drink three raindrops."
          ],
          correctIndex: 1,
          explanation: "'A bottle of water' adalah frasa wadah (container quantifier) yang tepat untuk uncountable noun 'water'."
        },
        {
          id: "s2_ep9_q4",
          question: "What does the phrase 'tap your contactless card' mean?",
          options: [
            "Pukul mesin kartu sampai pecah",
            "Tempelkan kartu pembayaran nirsentuh pada sensor mesin",
            "Gunting kartu Anda menjadi dua bagian",
            "Sembunyikan kartu di dalam kaus kaki"
          ],
          correctIndex: 1,
          explanation: "'Tap your contactless card' berarti menempelkan kartu debit/kredit nirsentuh pada mesin reader pembayaran."
        },
        {
          id: "s2_ep9_q5",
          question: "Complete the sentence: 'How much does this bottle of water ______?'",
          options: [
            "cost",
            "costing",
            "costs",
            "costed"
          ],
          correctIndex: 0,
          explanation: "Setelah auxiliary verb 'does', kata kerja utama kembali ke bentuk dasar (base form): 'cost'."
        }
      ],
      summary: {
        takeaways: [
          "Membedakan istilah 'still water' (air tawar biasa) dan 'sparkling water' (air bersoda).",
          "Menggunakan partitive noun untuk cairan: 'a bottle of water'.",
          "Melakukan pembayaran praktis dengan contactless card di toko transit."
        ]
      },
      cliffhanger: "Sambil meneguk air mineral dingin yang menyegarkan, kamu menoleh ke layar Gate B28. Lampu hijau di atas pintu gate menyala terang dengan teks berkedip: 'NOW BOARDING — ROW 15 TO 30'!"
    },

    // EPISODE 10
    {
      id: 10,
      number: 10,
      title: "Melangkah ke Pintu Garbarata Pesawat",
      titleEn: "Stepping Onto the Boarding Bridge",
      estimatedMinutes: 10,
      recap: "Inilah puncak petualangan bandaramu. Setelah mengatasi kebingungan tanda terminal, lolos pemeriksaan imigrasi, menyimak perubahan gate B28, dan mengambil tas yang tertinggal, panggilan boarding resmi diumumkan!",
      dialogue: [
        {
          id: "s2e10_d1",
          speaker: "Agent",
          en: "Welcome, passengers for flight SE-402. Please have your boarding pass and passport open to the photo page.",
          idText: "Selamat datang, para penumpang penerbangan SE-402. Harap buka boarding pass dan paspor Anda pada halaman foto."
        },
        {
          id: "s2e10_d2",
          speaker: "You",
          en: "Here is my boarding pass for seat 18A.",
          idText: "Ini boarding pass saya untuk kursi nomor 18A."
        },
        {
          id: "s2e10_choice_1",
          type: "interactive_choice",
          prompt: "Pemindai tiket berbunyi bip hijau 'BEEP!'. Petugas tersenyum: 'Have a pleasant flight!' Apa responmu?",
          options: [
            {
              id: "s2e10_opt_1a",
              text: "Thank you so much! Have a great day ahead.",
              speakerReply: "Agent",
              reactionEn: "Thank you! Proceed down the jet bridge on your right.",
              reactionId: "Terima kasih! Silakan melangkah menuruni garbarata di sebelah kanan Anda."
            },
            {
              id: "s2e10_opt_1b",
              text: "I am ready for takeoff! Thank you for all your help today.",
              speakerReply: "Agent",
              reactionEn: "You are very welcome. The cabin crew is waiting at the door.",
              reactionId: "Sama-sama. Awak kabin telah menanti Anda di pintu masuk pesawat."
            }
          ]
        },
        {
          id: "s2e10_d3",
          speaker: "Narator",
          en: "You step onto the glass boarding bridge. The giant turbine engines of the airplane gleam in the afternoon sun.",
          idText: "Kamu melangkah memasuki jembatan garbarata kaca. Mesin turbin raksasa pesawat berkilau di bawah sinar matahari sore."
        },
        {
          id: "s2e10_d4",
          speaker: "Attendant",
          en: "Welcome aboard! Seat 18A is just past the wing on your left, by the window.",
          idText: "Selamat datang di kabin! Kursi 18A berada tepat di belakang sayap di sebelah kiri Anda, dekat jendela."
        },
        {
          id: "s2e10_d5",
          speaker: "Kanci",
          en: "Luar biasa! Kamu berhasil menaklukkan seluruh tantangan bandara internasional dengan bahasa Inggris yang matang dan percaya diri!",
          idText: "Luar biasa! Kamu berhasil menaklukkan seluruh tantangan bandara internasional dengan bahasa Inggris yang matang dan percaya diri!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-plane-noun",
          word: "plane",
          partOfSpeech: "noun",
          enDefinition: "An airplane; a powered flying vehicle with fixed wings.",
          idMeaning: "pesawat; pesawat terbang",
          contextSentence: "The plane is scheduled to depart in fifteen minutes."
        },
        {
          wordId: "batch-seat-noun",
          word: "seat",
          partOfSpeech: "noun",
          enDefinition: "A designated place on an aircraft for a passenger to sit.",
          idMeaning: "kursi; nomor kursi",
          contextSentence: "My assigned seat is 18A next to the window."
        },
        {
          wordId: "batch-window-noun",
          word: "window",
          partOfSpeech: "noun",
          enDefinition: "An opening in the side or wall of an aircraft to admit light and allow passengers to see outside.",
          idMeaning: "jendela pesawat",
          contextSentence: "I love sitting by the window to watch the clouds."
        },
        {
          wordId: "batch-ready-adjective",
          word: "ready",
          partOfSpeech: "adjective",
          enDefinition: "In a suitable state for an action or situation; fully prepared.",
          idMeaning: "siap; bersiap",
          contextSentence: "All passengers are ready for the safety demonstration."
        },
        {
          wordId: "batch-start-verb",
          word: "start",
          partOfSpeech: "verb",
          enDefinition: "To begin an activity or journey.",
          idMeaning: "memulai; berangkat",
          contextSentence: "Our journey into the skies starts right now."
        },
        {
          wordId: "batch-smile-verb",
          word: "smile",
          partOfSpeech: "verb",
          enDefinition: "To form one's features into a pleased, kind, or amused expression.",
          idMeaning: "tersenyum",
          contextSentence: "The flight attendants smile warmly as you enter."
        }
      ],
      grammarFocus: {
        title: "Menyatakan Rencana Masa Depan yang Pasti ('We are going to...')",
        topicId: "present-simple",
        explanation: "Gunakan konstruksi 'be going to + verb' ('We are going to take off', 'I am going to sit') untuk menyatakan peristiwa atau rencana yang segera terjadi di hadapanmu.",
        formula: "Subject + am/is/are + going to + [Verb Base] / We are going to fly."
      },
      culturalTip: {
        title: "Etika Menyapa Awak Kabin & Menemukan Nomor Kursi",
        content: "Saat memasuki pintu pesawat (*boarding*), sapa pramugari dengan 'Hello' atau 'Good afternoon'. Tunjukkan boarding pass Anda; mereka akan langsung menunjukkan lorong (*aisle*) mana yang paling dekat dengan nomor kursimu."
      },
      quiz: [
        {
          id: "s2_ep10_q1",
          question: "What is a 'window seat' on an airplane?",
          options: [
            "Kursi yang berada tepat di samping jendela kabin",
            "Kursi yang berada di samping toilet darurat",
            "Kursi pilot di kokpit depan",
            "Kursi cadangan di dalam bagasi bawah"
          ],
          correctIndex: 0,
          explanation: "'Window seat' adalah kursi penumpang yang terletak persis di sebelah jendela kabin pesawat."
        },
        {
          id: "s2_ep10_q2",
          question: "What is the enclosed bridge connecting the terminal gate to the airplane door called?",
          options: [
            "Subway tunnel",
            "Jet bridge / Boarding bridge (Garbarata)",
            "Wooden rope ladder",
            "Emergency slide"
          ],
          correctIndex: 1,
          explanation: "Jembatan penghubung antara pintu gate terminal dan pintu pesawat disebut 'Jet bridge' atau 'Boarding bridge' (dalam bahasa Indonesia: garbarata)."
        },
        {
          id: "s2_ep10_q3",
          question: "What does the phrase 'Welcome aboard' mean when spoken by flight attendants?",
          options: [
            "Tolong bersihkan lantai kabin",
            "Selamat datang di dalam pesawat / kapal",
            "Tiket Anda tidak berlaku hari ini",
            "Harap keluar dari pintu darurat"
          ],
          correctIndex: 1,
          explanation: "'Welcome aboard' adalah sapaan standar untuk menyambut penumpang saat melangkah masuk ke dalam pesawat."
        },
        {
          id: "s2_ep10_q4",
          question: "Which of the following expresses an immediate future action with 'going to'?",
          options: [
            "We were flew yesterday.",
            "We are going to take off soon.",
            "We sleeping every night.",
            "We not having plane."
          ],
          correctIndex: 1,
          explanation: "'We are going to take off soon' menggunakan pola be going to untuk menyatakan peristiwa yang segera terjadi."
        },
        {
          id: "s2_ep10_q5",
          question: "What seat number did you have on flight SE-402?",
          options: [
            "1A",
            "18A",
            "99Z",
            "50C"
          ],
          correctIndex: 1,
          explanation: "Nomor kursi yang tercantum pada tiket dan disebutkan di dialog adalah 18A dekat jendela."
        }
      ],
      summary: {
        takeaways: [
          "Menunjukkan boarding pass dan paspor pada mesin pemindai gerbang garbarata.",
          "Menyapa awak kabin dan menemukan nomor kursi kabin (18A - window seat).",
          "Menguasai pola masa depan terencana dengan struktur 'be going to'."
        ]
      },
      cliffhanger: "Kamu duduk nyaman di kursi 18A dan mengenakan sabuk pengaman. Melalui jendela pesawat, kamu melihat sayap perak berkilau. Di saku kursi depanmu, terselip sebuah kartu pos kuno bergambar hotel megah bertuliskan: 'Welcome to Grand Heritage Hotel — Your key awaits in Room 303'..."
    }
  ]
};

// Validate consistency
if (story02.episodes.length !== 10) {
  throw new Error("Story 2 must have exactly 10 episodes!");
}

story02.episodes.forEach((ep) => {
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

fs.writeFileSync("src/data/stories/story-02.json", JSON.stringify(story02, null, 2), "utf8");
console.log("✓ SUCCESS: Story 2 (story-02.json) successfully created with all 10 full-length episodes!");
console.log("Total Episodes:", story02.episodes.length);
console.log("Total Quiz Questions:", story02.episodes.length * 5);
console.log("Total Oxford 3000 Vocabularies:", story02.episodes.length * 6);

