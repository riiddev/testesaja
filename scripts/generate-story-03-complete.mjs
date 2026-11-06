import fs from "fs";
import path from "path";

// Define the full Story 3 data
const story03 = {
  id: "story-03",
  number: 3,
  title: "Kunci yang Tertukar",
  titleEn: "The Swapped Keys",
  level: "A2",
  levelReq: 3,
  totalEpisodes: 10,
  themeColor: "#9B2C2C",
  description: "Setibanya di Grand Heritage Hotel yang klasik dan megah, kunci kamarmu tertukar di meja resepsionis. Kamu menemukan sebuah kamar antik dengan kotak kayu berukir misterius di atas meja kerja.",
  learningFocus: "Hotel Reservations, Check-in Procedures, Polite Complaints, Describing Objects and Rooms, Past Simple vs Present Perfect.",
  episodes: [
    // EPISODE 1
    {
      id: 1,
      number: 1,
      title: "Lobi Hotel Bersejarah",
      titleEn: "The Grand Heritage Lobby",
      estimatedMinutes: 10,
      recap: "Setelah perjalanan panjang dari bandara, kamu tiba di depan Grand Heritage Hotel, sebuah bangunan kolonial bergaya klasik dengan tiang marmer dan lampu kristal gantung yang berkilau.",
      dialogue: [
        {
          id: "s3e1_d1",
          speaker: "Narator",
          en: "The doorman bows politely as you enter the warm, carpeted lobby of the historic hotel.",
          idText: "Petugas pintu membungkuk sopan saat kamu melangkah masuk ke dalam lobi hotel bersejarah yang hangat dan berkarpet tebal."
        },
        {
          id: "s3e1_d2",
          speaker: "Kanci",
          en: "Wah, megah sekali hotel ini! Suasananya tenang dan berkelas. Ayo kita hampiri meja resepsionis untuk check-in!",
          idText: "Wah, megah sekali hotel ini! Suasananya tenang dan berkelas. Ayo kita hampiri meja resepsionis untuk check-in!"
        },
        {
          id: "s3e1_d3",
          speaker: "You",
          en: "Good evening. I have a room reservation under my name.",
          idText: "Selamat malam. Saya memiliki reservasi kamar atas nama saya."
        },
        {
          id: "s3e1_choice_1",
          type: "interactive_choice",
          prompt: "Resepsionis tersenyum: 'Good evening, welcome to the Grand Heritage. May I have your name and booking reference?' Bagaimana kamu menjawabnya?",
          options: [
            {
              id: "s3e1_opt_1a",
              text: "My name is on the booking, and here is my digital reservation voucher on my phone.",
              speakerReply: "Receptionist",
              reactionEn: "Thank you. Let me look up your reservation in our central system right away.",
              reactionId: "Terima kasih. Biar segera kucari reservasi Anda di sistem pusat kami."
            },
            {
              id: "s3e1_opt_1b",
              text: "Here is my passport and the printed confirmation paper for two nights.",
              speakerReply: "Receptionist",
              reactionEn: "Splendid! Having the printed confirmation makes the check-in process very swift.",
              reactionId: "Luar biasa! Membawa bukti cetak membuat proses check-in berjalan sangat cepat."
            }
          ]
        },
        {
          id: "s3e1_d4",
          speaker: "Receptionist",
          en: "Yes, I have found your booking. A standard single deluxe suite for two nights.",
          idText: "Ya, saya sudah menemukan pemesanan Anda. Sebuah kamar standar single deluxe suite untuk dua malam."
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-hotel-noun",
          word: "hotel",
          partOfSpeech: "noun",
          enDefinition: "An establishment providing accommodation, meals, and other services for travelers and tourists.",
          idMeaning: "hotel; penginapan",
          contextSentence: "The Grand Heritage is one of the oldest hotels in the city."
        },
        {
          wordId: "batch-lobby-noun",
          word: "lobby",
          partOfSpeech: "noun",
          enDefinition: "A room providing a space out of which one or more other rooms or corridors lead; an entrance hall.",
          idMeaning: "lobi; ruang tunggu utama",
          contextSentence: "Guests gather in the hotel lobby near the fireplace."
        },
        {
          wordId: "batch-guest-noun",
          word: "guest",
          partOfSpeech: "noun",
          enDefinition: "A person who is invited to visit someone's home or who stays at a hotel.",
          idMeaning: "tamu",
          contextSentence: "Every guest receives a complimentary welcome drink."
        },
        {
          wordId: "batch-arrive-verb",
          word: "arrive",
          partOfSpeech: "verb",
          enDefinition: "To reach a place at the end of a journey or a stage in a journey.",
          idMeaning: "tiba; sampai",
          contextSentence: "I have just arrived after a long international flight."
        },
        {
          wordId: "batch-reception-noun",
          word: "reception",
          partOfSpeech: "noun",
          enDefinition: "The area in a hotel where visitors are greeted and registrations are dealt with.",
          idMeaning: "meja resepsionis; meja pendaftaran",
          contextSentence: "Please proceed to the reception desk for your key card."
        },
        {
          wordId: "batch-luggage-noun",
          word: "luggage",
          partOfSpeech: "noun",
          enDefinition: "Suitcases or other bags in which to pack personal belongings for traveling.",
          idMeaning: "bagasi; barang bawaan koper",
          contextSentence: "The porter will assist you with your heavy luggage."
        }
      ],
      grammarFocus: {
        title: "Present Perfect untuk Kedatangan Baru Saja ('I have just arrived')",
        topicId: "present-simple",
        explanation: "Gunakan Present Perfect Tense ('I have arrived', 'I have booked') untuk menyatakan tindakan yang baru saja selesai dilakukan dan dampaknya masih relevan saat berbicara.",
        formula: "Subject + have/has + [Past Participle V3] / I have a reservation."
      },
      culturalTip: {
        title: "Etika Menunjukkan Reservasi Hotel",
        content: "Saat check-in hotel di luar negeri, siapkan paspor dan nomor booking reference (bisa berupa kode QR di ponsel atau cetakan kertas) sebelum mencapai meja resepsionis agar proses verifikasi berlangsung cepat."
      },
      quiz: [
        {
          id: "s3_ep1_q1",
          question: "What is the English phrase to announce that you have booked a room at the hotel reception?",
          options: [
            "I want to sleep on your lobby rug.",
            "I have a room reservation under my name.",
            "Why is your chandelier shining?",
            "Give me money right now."
          ],
          correctIndex: 1,
          explanation: "'I have a room reservation under my name' adalah kalimat baku yang sangat sopan saat check-in hotel."
        },
        {
          id: "s3_ep1_q2",
          question: "What is the person staying at a hotel called in English?",
          options: [
            "Host",
            "Guest",
            "Driver",
            "Pilot"
          ],
          correctIndex: 1,
          explanation: "Orang yang menginap di hotel disebut 'guest' (tamu)."
        },
        {
          id: "s3_ep1_q3",
          question: "What does the word 'luggage' mean?",
          options: [
            "Buku catatan harian",
            "Barang bawaan koper atau tas perjalanan",
            "Kunci kamar besi",
            "Menu sarapan pagi"
          ],
          correctIndex: 1,
          explanation: "'Luggage' (atau baggage) merujuk pada tas, koper, dan barang bawaan pengelana."
        },
        {
          id: "s3_ep1_q4",
          question: "Which of the following is correct to show a reservation document?",
          options: [
            "Here is my booking confirmation paper.",
            "Take my shoes and run.",
            "I forget where I live.",
            "I dislike beds."
          ],
          correctIndex: 0,
          explanation: "'Here is my booking confirmation paper' adalah kalimat santun saat menyerahkan bukti reservasi."
        },
        {
          id: "s3_ep1_q5",
          question: "Complete the sentence: 'I have ______ arrived at the Grand Heritage Hotel.'",
          options: [
            "just",
            "nevering",
            "tomorrows",
            "yesterday"
          ],
          correctIndex: 0,
          explanation: "Adverb 'just' diselipkan di antara have dan past participle untuk menyatakan tindakan yang baru saja terjadi: 'I have just arrived'."
        }
      ],
      summary: {
        takeaways: [
          "Menyatakan reservasi kamar di meja resepsionis dengan percaya diri.",
          "Menyerahkan dokumen identitas dan voucher pemesanan dengan sopan.",
          "Menggunakan struktur Present Perfect: 'I have just arrived'."
        ]
      },
      cliffhanger: "Resepsionis mengambil sebuah kunci kuningan antik dari laci meja kayu. Gantungan kuningan berat itu terukir angka: 303. Namun di samping laci, terdapat kunci lain bernomor 305 yang memiliki bentuk gantungan identik!"
    },

    // EPISODE 2
    {
      id: 2,
      number: 2,
      title: "Kunci Kuningan Nomor 303",
      titleEn: "Brass Key Number 303",
      estimatedMinutes: 10,
      recap: "Proses verifikasi identitas selesai. Resepsionis menyerahkan kunci fisik kuningan antik dengan gantungan nomor 303 dan menjelaskan fasilitas hotel.",
      dialogue: [
        {
          id: "s3e2_d1",
          speaker: "Receptionist",
          en: "Here is your key, room number 303 on the third floor. Breakfast is served in the garden dining room from 7 to 10 AM.",
          idText: "Ini kunci Anda, kamar nomor 303 di lantai tiga. Sarapan disajikan di ruang makan taman mulai pukul 7 hingga 10 pagi."
        },
        {
          id: "s3e2_d2",
          speaker: "You",
          en: "Thank you. Which way is the elevator, please?",
          idText: "Terima kasih. Ke arah mana letak liftnya?"
        },
        {
          id: "s3e2_choice_1",
          type: "interactive_choice",
          prompt: "Resepsionis menjelaskan: 'Take the vintage cage elevator down the hallway on your left, or use the grand stairs.' Bagaimana kamu memilih rutenya?",
          options: [
            {
              id: "s3e2_opt_1a",
              text: "I will take the elevator with my heavy rolling suitcase.",
              speakerReply: "Receptionist",
              reactionEn: "Good idea. The vintage lift is slow, but it spares your back.",
              reactionId: "Ide bagus. Lift antik memang pelan, tapi menghemat tenagamu."
            },
            {
              id: "s3e2_opt_1b",
              text: "I would love to walk up the grand marble staircase to admire the paintings.",
              speakerReply: "Receptionist",
              reactionEn: "Wonderful choice! The 19th-century oil paintings on the staircase are magnificent.",
              reactionId: "Pilihan luar biasa! Lukisan cat minyak abad ke-19 di tangga sangatlah menakjubkan."
            }
          ]
        },
        {
          id: "s3e2_d3",
          speaker: "You",
          en: "The brass key feels very heavy and solid in my hand.",
          idText: "Kunci kuningan ini terasa sangat berat dan kokoh di genggamanku."
        },
        {
          id: "s3e2_d4",
          speaker: "Kanci",
          en: "Hotel klasik seperti ini jarang memakai kartu magnetik; mereka mempertahankan kunci kuningan fisik warisan sejarah!",
          idText: "Hotel klasik seperti ini jarang memakai kartu magnetik; mereka mempertahankan kunci kuningan fisik warisan sejarah!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-key-noun",
          word: "key",
          partOfSpeech: "noun",
          enDefinition: "A small piece of shaped metal with incisions cut to fit the warded parts of a lock.",
          idMeaning: "kunci",
          contextSentence: "The room key is attached to a heavy brass tag."
        },
        {
          wordId: "batch-room-noun",
          word: "room",
          partOfSpeech: "noun",
          enDefinition: "A part or division of a building enclosed by walls, floor, and ceiling.",
          idMeaning: "kamar; ruangan",
          contextSentence: "Our room is located on the third floor."
        },
        {
          wordId: "batch-floor-noun",
          word: "floor",
          partOfSpeech: "noun",
          enDefinition: "All the rooms or areas on the same level of a building; a storey.",
          idMeaning: "lantai (tingkat gedung)",
          contextSentence: "Press the button for the third floor in the lift."
        },
        {
          wordId: "batch-elevator-noun",
          word: "elevator",
          partOfSpeech: "noun",
          enDefinition: "A platform or compartment housed in a shaft for raising and lowering people or things; a lift.",
          idMeaning: "lift; elevator",
          contextSentence: "The elevator takes you smoothly to level three."
        },
        {
          wordId: "batch-breakfast-noun",
          word: "breakfast",
          partOfSpeech: "noun",
          enDefinition: "A meal eaten in the morning, the first of the day.",
          idMeaning: "sarapan; makan pagi",
          contextSentence: "Continental breakfast is included in your booking."
        },
        {
          wordId: "batch-stairs-noun",
          word: "stairs",
          partOfSpeech: "noun",
          enDefinition: "A set of steps leading from one floor of a building to another, typically inside the building.",
          idMeaning: "tangga",
          contextSentence: "Walk up the spiral stairs to reach the hallway."
        }
      ],
      grammarFocus: {
        title: "Menanyakan Letak Fasilitas Hotel ('Which way is...?')",
        topicId: "present-simple",
        explanation: "Gunakan 'Which way is [Facility], please?' untuk menanyakan arah menuju lift, ruang sarapan, atau tangga secara santun.",
        formula: "Which way is + [Facility], please? / The elevator is down the hall on the left."
      },
      culturalTip: {
        title: "Perbedaan Penomoran Lantai: British vs American English",
        content: "Di Inggris (UK) dan banyak negara Persemakmuran, lantai dasar disebut 'Ground Floor' (G), sedangkan lantai 1 adalah satu tingkat di atasnya. Di Amerika (US), lantai dasar langsung dihitung sebagai '1st Floor'."
      },
      quiz: [
        {
          id: "s3_ep2_q1",
          question: "How do you ask for the location of the hotel elevator politely?",
          options: [
            "Where is your roof ladder?",
            "Which way is the elevator, please?",
            "Why do you have walls?",
            "I refuse to move my feet."
          ],
          correctIndex: 1,
          explanation: "'Which way is the elevator, please?' adalah cara santun dan alami menanyakan arah lift."
        },
        {
          id: "s3_ep2_q2",
          question: "What room number was assigned to you on the brass key?",
          options: [
            "Room 101",
            "Room 303",
            "Room 777",
            "Room 99"
          ],
          correctIndex: 1,
          explanation: "Nomor kamar yang tertulis pada gantungan kunci kuningan adalah kamar 303."
        },
        {
          id: "s3_ep2_q3",
          question: "What is the British English term for the ground level entrance floor?",
          options: [
            "10th Floor",
            "Ground Floor (G)",
            "Sky Basement",
            "Roof deck"
          ],
          correctIndex: 1,
          explanation: "Dalam bahasa Inggris British, lantai dasar disebut 'Ground Floor' (biasanya disimbolkan tombol 'G' di lift)."
        },
        {
          id: "s3_ep2_q4",
          question: "At what time is breakfast served in the hotel garden dining room?",
          options: [
            "From 7 to 10 AM",
            "At midnight only",
            "From 3 to 4 PM",
            "Breakfast is not served"
          ],
          correctIndex: 0,
          explanation: "Resepsionis menyebutkan sarapan disajikan mulai pukul 7 hingga 10 pagi ('from 7 to 10 AM')."
        },
        {
          id: "s3_ep2_q5",
          question: "Complete the sentence: 'The elevator is down the hallway on your ______.'",
          options: [
            "left",
            "lefting",
            "leaved",
            "lefts"
          ],
          correctIndex: 0,
          explanation: "Kata penunjuk arah sisi adalah 'left' (kiri) atau 'right' (kanan): 'on your left'."
        }
      ],
      summary: {
        takeaways: [
          "Menanyakan arah fasilitas hotel dengan: 'Which way is the elevator, please?'",
          "Memahami informasi jadwal sarapan dan nomor lantai kamar.",
          "Mengenali perbedaan penomoran Ground Floor vs 1st Floor."
        ]
      },
      cliffhanger: "Kamu menaiki lift antik berkisi-kisi besi menuju lantai 3. Saat memasukkan anak kunci kuningan ke lubang pintu nomor 303, daun pintu kayu jati tebal itu berderit terbuka perlahan..."
    },

    // EPISODE 3
    {
      id: 3,
      number: 3,
      title: "Pintu Kamar yang Berbeda",
      titleEn: "A Different Kind of Room",
      estimatedMinutes: 10,
      recap: "Kamu melangkah masuk ke dalam kamar 303. Namun tata letak dan perabotannya sangat berbeda dari foto kamar standar modern yang kamu pesan di aplikasi.",
      dialogue: [
        {
          id: "s3e3_d1",
          speaker: "Narator",
          en: "The heavy wooden door swings open into a spacious, dimly lit suite smelling of aged cedarwood and old paper.",
          idText: "Pintu kayu yang berat berayun terbuka menuju kamar suite luas dan temaram dengan aroma kayu cedar kuno dan kertas tua."
        },
        {
          id: "s3e3_d2",
          speaker: "You",
          en: "Wait a minute. This doesn't look like a standard modern single room at all!",
          idText: "Tunggu sebentar. Ini sama sekali tidak terlihat seperti kamar standar modern yang kupesan!"
        },
        {
          id: "s3e3_choice_1",
          type: "interactive_choice",
          prompt: "Di sudut kamar terdapat lemari kaca antik dan ranjang bertiang empat bertirai sutra. Apa yang kamu perhatikan pertama kali?",
          options: [
            {
              id: "s3e3_opt_1a",
              text: "The vintage furniture and the framed oil paintings on the dark red walls.",
              speakerReply: "Kanci",
              reactionEn: "Indeed! This room looks like a private library or a collector's executive suite.",
              reactionId: "Benar sekali! Kamar ini tampak seperti perpustakaan pribadi atau suite eksekutif seorang kolektor."
            },
            {
              id: "s3e3_opt_1b",
              text: "The large wooden desk near the balcony window with a brass reading lamp.",
              speakerReply: "Kanci",
              reactionEn: "Look closely at that desk. There are leather notebooks and strange items on it!",
              reactionId: "Lihat lebih dekat meja itu. Ada buku catatan kulit dan benda-benda aneh di atasnya!"
            }
          ]
        },
        {
          id: "s3e3_d3",
          speaker: "You",
          en: "The room is very beautiful, but it feels strange. Someone might already be staying here.",
          idText: "Kamarnya sangat indah, tapi terasa aneh. Jangan-jangan sudah ada orang yang menginap di sini."
        },
        {
          id: "s3e3_d4",
          speaker: "Kanci",
          en: "Perhatikan baik-baik sekelilingmu sebelum membongkar koper! Kita harus memastikan tidak ada barang orang lain!",
          idText: "Perhatikan baik-baik sekelilingmu sebelum membongkar koper! Kita harus memastikan tidak ada barang orang lain!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-door-noun",
          word: "door",
          partOfSpeech: "noun",
          enDefinition: "A hinged, sliding, or revolving barrier at the entrance to a building, room, or vehicle.",
          idMeaning: "pintu",
          contextSentence: "The carved wooden door opened with a gentle creak."
        },
        {
          wordId: "batch-window-noun",
          word: "window",
          partOfSpeech: "noun",
          enDefinition: "An opening in the wall of a building fitted with glass in a frame.",
          idMeaning: "jendela",
          contextSentence: "The balcony window overlooks the private courtyard."
        },
        {
          wordId: "batch-mirror-noun",
          word: "mirror",
          partOfSpeech: "noun",
          enDefinition: "A surface, typically of glass coated with a metal amalgam, that reflects a clear image.",
          idMeaning: "cermin",
          contextSentence: "An ornate gold mirror hangs above the mantelpiece."
        },
        {
          wordId: "batch-furniture-noun",
          word: "furniture",
          partOfSpeech: "noun",
          enDefinition: "The movable articles that are used to make a room or building suitable for living or working in.",
          idMeaning: "perabotan; mebel",
          contextSentence: "The antique furniture was crafted from polished mahogany."
        },
        {
          wordId: "batch-ancient-adjective",
          word: "ancient",
          partOfSpeech: "adjective",
          enDefinition: "Belonging to the very distant past and no longer in existence; very old.",
          idMeaning: "kuno; purba; sangat tua",
          contextSentence: "The library shelf holds ancient historical manuscripts."
        },
        {
          wordId: "batch-strange-adjective",
          word: "strange",
          partOfSpeech: "adjective",
          enDefinition: "Unusual or surprising in a way that is unsettling or hard to understand.",
          idMeaning: "aneh; ganjil; tak biasa",
          contextSentence: "It is strange that the wardrobe contains an old wool coat."
        }
      ],
      grammarFocus: {
        title: "Membandingkan Kenyataan dengan Harapan ('This doesn't look like...')",
        topicId: "present-simple",
        explanation: "Gunakan 'This doesn't look like + [Noun Phrase]' untuk menyatakan rasa heran ketika sesuatu tidak sesuai dengan gambar atau harapan awalmu.",
        formula: "This doesn't look like [Expected Item] at all. / It feels strange."
      },
      culturalTip: {
        title: "Perbedaan Karakteristik 'Heritage Hotel'",
        content: "Di hotel bersejarah (*heritage hotel*), tiap kamar sering kali memiliki denah dan furnitur unik (*individually styled*), berbeda dengan hotel jaringan modern yang kamarnya seragam."
      },
      quiz: [
        {
          id: "s3_ep3_q1",
          question: "What does the expression 'This doesn't look like a standard room' imply?",
          options: [
            "Kamar ini tampak sangat biasa saja",
            "Kamar ini terlihat berbeda dan tidak seperti kamar standar pada umumnya",
            "Kamar ini tidak memiliki pintu masuk",
            "Kamar ini kotor dan penuh sampah"
          ],
          correctIndex: 1,
          explanation: "Ungkapan ini menyatakan bahwa penampakan kamar berbeda dari kamar standar yang biasa dijumpai."
        },
        {
          id: "s3_ep3_q2",
          question: "Which English word refers to movable objects like chairs, tables, and wardrobes in a room?",
          options: [
            "Weather",
            "Furniture",
            "Passenger",
            "Terminal"
          ],
          correctIndex: 1,
          explanation: "'Furniture' adalah kata benda kolektif untuk seluruh perabotan rumah/kamar (meja, kursi, lemari)."
        },
        {
          id: "s3_ep3_q3",
          question: "What does the adjective 'ancient' mean?",
          options: [
            "Sangat modern dan canggih",
            "Sangat tua, kuno, atau bernilai sejarah lampau",
            "Sangat murah harganya",
            "Berwarna biru terang"
          ],
          correctIndex: 1,
          explanation: "'Ancient' berarti kuno atau berusia sangat tua dari masa lampau."
        },
        {
          id: "s3_ep3_q4",
          question: "Why did you hesitate to unpack your bags in room 303?",
          options: [
            "Because you lost your suitcase key",
            "Because the room felt strange and might belong to someone else",
            "Because you wanted to sleep on the bus",
            "Because the floor was made of water"
          ],
          correctIndex: 1,
          explanation: "Kamu menunda membongkar koper karena merasa kamar ini aneh dan curiga sudah ada orang lain yang menempatinya."
        },
        {
          id: "s3_ep3_q5",
          question: "Complete the sentence: 'The old room smelled of aged cedarwood and looked very ______.'",
          options: [
            "strange",
            "strangely",
            "strangers",
            "stranged"
          ],
          correctIndex: 0,
          explanation: "Setelah linking verb 'looked', kita menggunakan kata sifat (adjective): 'strange'."
        }
      ],
      summary: {
        takeaways: [
          "Mengekspresikan ketidaksesuaian: 'This doesn't look like...'",
          "Menguasai kosakata perabotan kamar: furniture, mirror, window, desk.",
          "Mengenali nuansa arsitektur kamar bersejarah (heritage suites)."
        ]
      },
      cliffhanger: "Saat melangkah mendekati meja kerja kayu di dekat jendela, matamu terpaku pada sebuah kotak kayu berukir motif daun yang terkunci rapat dengan gembok kuningan kecil!"
    },

    // EPISODE 4
    {
      id: 4,
      number: 4,
      title: "Kotak Kayu di Atas Meja",
      titleEn: "The Wooden Box on the Desk",
      estimatedMinutes: 10,
      recap: "Di atas meja kerja kamar 303, kamu mendapati sebuah kotak kayu jati berukir motif daun tradisional dengan gembok kuningan kecil, dikelilingi buku catatan tua.",
      dialogue: [
        {
          id: "s3e4_d1",
          speaker: "You",
          en: "Look at this box, Kanci. It has intricate leaf carvings and a solid brass lock.",
          idText: "Lihat kotak ini, Kanci. Terdapat ukiran daun yang rumit dan gembok kuningan yang kokoh."
        },
        {
          id: "s3e4_d2",
          speaker: "Kanci",
          en: "Hati-hati! Ini jelas barang pribadi milik tamu lain! Jangan coba-coba membukanya tanpa izin!",
          idText: "Hati-hati! Ini jelas barang pribadi milik tamu lain! Jangan coba-coba membukanya tanpa izin!"
        },
        {
          id: "s3e4_choice_1",
          type: "interactive_choice",
          prompt: "Di samping kotak terdapat kartu nama bertuliskan: 'Prof. Alistair Sterling - Historian & Antiquities Fellow'. Apa kesimpulanmu?",
          options: [
            {
              id: "s3e4_opt_1a",
              text: "This room belongs to Professor Sterling. My key was definitely swapped at the desk!",
              speakerReply: "Kanci",
              reactionEn: "Exactly! The receptionist must have handed you the wrong key by mistake.",
              reactionId: "Tepat sekali! Resepsionis pasti keliru menyerahkan kunci yang salah padamu."
            },
            {
              id: "s3e4_opt_1b",
              text: "Perhaps this is a decorative display provided by the hotel management.",
              speakerReply: "Kanci",
              reactionEn: "No, there are reading glasses and an open fountain pen. Someone lives here!",
              reactionId: "Bukan, ada kacamata baca dan pena tinta yang terbuka. Seseorang tinggal di sini!"
            }
          ]
        },
        {
          id: "s3e4_d3",
          speaker: "You",
          en: "You are right. There has been a serious mix-up. I must contact the front desk immediately.",
          idText: "Kamu benar. Telah terjadi kekeliruan besar. Aku harus segera menghubungi meja resepsionis."
        },
        {
          id: "s3e4_d4",
          speaker: "Kanci",
          en: "Bagus! Jangan sentuh barang-barang di meja dan segera angkat gagang telepon kamar!",
          idText: "Bagus! Jangan sentuh barang-barang di meja dan segera angkat gagang telepon kamar!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-box-noun",
          word: "box",
          partOfSpeech: "noun",
          enDefinition: "A container with a flat base and sides, typically square or rectangular and having a lid.",
          idMeaning: "kotak; peti kecil",
          contextSentence: "The wooden box is secured with a small brass lock."
        },
        {
          wordId: "batch-wood-noun",
          word: "wood",
          partOfSpeech: "noun",
          enDefinition: "The hard fibrous material that forms the main substance of the trunk or branches of a tree.",
          idMeaning: "kayu",
          contextSentence: "The desk is carved from dark polished teak wood."
        },
        {
          wordId: "batch-desk-noun",
          word: "desk",
          partOfSpeech: "noun",
          enDefinition: "A piece of furniture with a flat or sloped surface and typically with drawers, at which one can read or write.",
          idMeaning: "meja tulis; meja kerja",
          contextSentence: "The guest left his research papers on the study desk."
        },
        {
          wordId: "batch-lock-noun",
          word: "lock",
          partOfSpeech: "noun",
          enDefinition: "A mechanism for keeping a door, lid, etc., fastened, typically operated by a key.",
          idMeaning: "gembok; kunci pengaman",
          contextSentence: "Do not attempt to force the antique lock open."
        },
        {
          wordId: "batch-secret-noun",
          word: "secret",
          partOfSpeech: "noun",
          enDefinition: "Something that is kept or meant to be kept unknown or unseen by others.",
          idMeaning: "rahasia",
          contextSentence: "What secret does this old wooden box conceal?"
        },
        {
          wordId: "batch-carving-noun",
          word: "carving",
          partOfSpeech: "noun",
          enDefinition: "An object or design cut from a hard material as an artistic work.",
          idMeaning: "ukiran; pahatan seni",
          contextSentence: "The delicate leaf carving reveals master craftsmanship."
        }
      ],
      grammarFocus: {
        title: "Menyatakan Dugaan & Kepastian Logis ('must have + V3')",
        topicId: "past-simple",
        explanation: "Gunakan modal 'must have + past participle' untuk menyimpulkan dugaan yang hampir pasti terjadi di masa lampau: 'The receptionist must have handed me the wrong key' (Resepsionis pasti telah keliru memberikan kunci).",
        formula: "Subject + must have + [Past Participle V3] / There must be a mistake."
      },
      culturalTip: {
        title: "Etika Privasi Barang Tamu Lain di Penginapan",
        content: "Jika Anda tanpa sengaja memasuki kamar yang berisi barang milik orang lain, jangan menyentuh, membuka, atau memindahkan barang-barang tersebut. Menghormati privasi dan segera melapor adalah tindakan yang beretika."
      },
      quiz: [
        {
          id: "s3_ep4_q1",
          question: "Whose name was printed on the business card next to the wooden box?",
          options: [
            "Leo the photographer",
            "Prof. Alistair Sterling",
            "Sarah the barista",
            "Arthur the bookseller"
          ],
          correctIndex: 1,
          explanation: "Nama yang tertera pada kartu nama di meja adalah Prof. Alistair Sterling (seorang sejarawan)."
        },
        {
          id: "s3_ep4_q2",
          question: "What modal structure expresses a logical deduction about a past mistake?",
          options: [
            "The clerk will sleep tonight.",
            "The clerk must have made a mistake.",
            "The clerk is eating breakfast.",
            "The clerk never wears shoes."
          ],
          correctIndex: 1,
          explanation: "'Must have made a mistake' menyatakan kesimpulan logis bahwa kekeliruan pasti telah terjadi."
        },
        {
          id: "s3_ep4_q3",
          question: "What design was carved into the wooden box on the desk?",
          options: [
            "Intricate leaf carvings",
            "Pictures of airplanes",
            "Bright neon numbers",
            "No design at all"
          ],
          correctIndex: 0,
          explanation: "Kotak kayu tersebut berhiaskan ukiran motif daun yang rumit (*intricate leaf carvings*)."
        },
        {
          id: "s3_ep4_q4",
          question: "What is the proper ethical action when you discover someone else's personal belongings in your assigned room?",
          options: [
            "Open their wallet and take the money",
            "Do not touch their belongings and notify the front desk immediately",
            "Throw the box out the balcony window",
            "Pack their clothes into your suitcase"
          ],
          correctIndex: 1,
          explanation: "Tindakan beretika adalah tidak menyentuh barang-barang tersebut dan segera menghubungi meja resepsionis."
        },
        {
          id: "s3_ep4_q5",
          question: "Complete the sentence: 'The wooden box was secured with a solid brass ______.'",
          options: [
            "lock",
            "locking",
            "locked",
            "locker"
          ],
          correctIndex: 0,
          explanation: "Kata benda yang berarti gembok/kunci pengaman adalah 'lock'."
        }
      ],
      summary: {
        takeaways: [
          "Menyimpulkan kekeliruan dengan modal: 'There must have been a mistake.'",
          "Mendeskripsikan material dan ukiran: wooden box, brass lock, leaf carving.",
          "Menjaga etika privasi barang tamu lain di kamar hotel."
        ]
      },
      cliffhanger: "Kamu melangkah ke nakas samping ranjang. Di atasnya terdapat sebuah telepon kabel hitam kuno dengan tombol putar dial bertuliskan '0 - Front Desk / Reception'!"
    },

    // EPISODE 5
    {
      id: 5,
      number: 5,
      title: "Menghubungi Bagian Resepsionis",
      titleEn: "Calling the Front Desk",
      estimatedMinutes: 10,
      recap: "Kamu mengangkat gagang telepon kamar kuno untuk menghubungi operator resepsionis dan melaporkan kekeliruan kamar.",
      dialogue: [
        {
          id: "s3e5_d1",
          speaker: "Narator",
          en: "You dial zero. After two short rings, a polite voice answers the line.",
          idText: "Kamu memutar angka nol. Setelah dua kali nada dering pendek, suara sopan menyahut di seberang saluran."
        },
        {
          id: "s3e5_d2",
          speaker: "Receptionist",
          en: "Front desk, William speaking. How may I assist you this evening?",
          idText: "Meja resepsionis, dengan William. Ada yang bisa saya bantu malam ini?"
        },
        {
          id: "s3e5_choice_1",
          type: "interactive_choice",
          prompt: "Bagaimana caramu menjelaskan situasinya secara tenang dan profesional melalui telepon?",
          options: [
            {
              id: "s3e5_opt_1a",
              text: "Hello William, I am calling from room 303. I believe there has been a mistake with my room key.",
              speakerReply: "Receptionist",
              reactionEn: "Oh dear! What seems to be the issue with the room, Sir?",
              reactionId: "Ya ampun! Tampaknya ada masalah apa dengan kamarnya, Pak?"
            },
            {
              id: "s3e5_opt_1b",
              text: "Good evening. I just entered room 303, but it appears to be currently occupied by another guest.",
              speakerReply: "Receptionist",
              reactionEn: "Occupied?! Goodness gracious! Are there personal belongings inside?",
              reactionId: "Sudah ditempati?! Astaga naga! Apakah ada barang-barang pribadi di dalam?"
            }
          ]
        },
        {
          id: "s3e5_d3",
          speaker: "You",
          en: "Yes, there is personal luggage, research books, and a wooden box on the desk.",
          idText: "Ya, ada koper pribadi, buku-buku riset, dan kotak kayu di atas meja."
        },
        {
          id: "s3e5_d4",
          speaker: "Receptionist",
          en: "Please stay right there by the door. I am coming up to floor 3 immediately with the manager!",
          idText: "Harap tetap berdiri di dekat pintu. Saya akan segera naik ke lantai 3 bersama manajer!"
        },
        {
          id: "s3e5_d5",
          speaker: "Kanci",
          en: "Cara bicaramu di telepon sangat tenang dan teratur! Resepsionis langsung merespons dengan sigap!",
          idText: "Cara bicaramu di telepon sangat tenang dan teratur! Resepsionis langsung merespons dengan sigap!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-call-verb",
          word: "call",
          partOfSpeech: "verb",
          enDefinition: "To contact or attempt to contact someone by phone.",
          idMeaning: "menelepon; memanggil",
          contextSentence: "I am calling to report an urgent room issue."
        },
        {
          wordId: "batch-phone-noun",
          word: "phone",
          partOfSpeech: "noun",
          enDefinition: "A device used to transmit sound or speech over a distance.",
          idMeaning: "telepon",
          contextSentence: "Dial zero on the room phone to reach the front desk."
        },
        {
          wordId: "batch-speak-verb",
          word: "speak",
          partOfSpeech: "verb",
          enDefinition: "To say something in order to convey information or an opinion.",
          idMeaning: "berbicara",
          contextSentence: "This is William speaking from the reception."
        },
        {
          wordId: "batch-mistake-noun",
          word: "mistake",
          partOfSpeech: "noun",
          enDefinition: "An action or judgment that is misguided or wrong.",
          idMeaning: "kesalahan; kekeliruan",
          contextSentence: "I believe there has been an administrative mistake."
        },
        {
          wordId: "batch-trouble-noun",
          word: "trouble",
          partOfSpeech: "noun",
          enDefinition: "Difficulty or problems.",
          idMeaning: "masalah; kesulitan",
          contextSentence: "We apologize for the trouble this has caused you."
        },
        {
          wordId: "batch-staff-noun",
          word: "staff",
          partOfSpeech: "noun",
          enDefinition: "All the people employed by a particular organization.",
          idMeaning: "staf; petugas karyawan",
          contextSentence: "Hotel staff members are trained to handle emergencies."
        }
      ],
      grammarFocus: {
        title: "Memulai Panggilan Telepon Formal ('I am calling to report...')",
        topicId: "present-continuous",
        explanation: "Saat menelepon layanan hotel atau kantor formal, perkenalkan diri dan sebutkan maksud panggilan: 'I am calling from Room [Number] to report [Issue]'.",
        formula: "I am calling from Room [Number]. / I believe there has been a mistake."
      },
      culturalTip: {
        title: "Etika Menggunakan Telepon Kamar Hotel",
        content: "Di hampir semua hotel dunia, menekan angka '0' pada telepon kamar akan langsung menyambungkan Anda ke operator resepsionis utama tanpa perlu menghafal nomor panjang."
      },
      quiz: [
        {
          id: "s3_ep5_q1",
          question: "Which single digit is universally dialed on a hotel phone to reach the front desk?",
          options: [
            "Digit 9",
            "Digit 0",
            "Digit 5",
            "Digit 1"
          ],
          correctIndex: 1,
          explanation: "Angka '0' adalah nomor panggilan universal di hotel untuk menghubungi meja resepsionis/operator."
        },
        {
          id: "s3_ep5_q2",
          question: "How does hotel staff typically answer an internal phone call?",
          options: [
            "Who are you and why do you disturb me?",
            "Front desk, William speaking. How may I assist you?",
            "Do not talk, I am busy.",
            "Hang up immediately."
          ],
          correctIndex: 1,
          explanation: "'Front desk, [Name] speaking. How may I assist you?' adalah sapaan standar profesional layanan perhotelan."
        },
        {
          id: "s3_ep5_q3",
          question: "What is a polite and calm phrase to report a room issue over the phone?",
          options: [
            "Your hotel is the worst in the universe!",
            "I believe there has been a mistake with my room key.",
            "I will burn down the lobby.",
            "Give me ten free pizzas right now."
          ],
          correctIndex: 1,
          explanation: "'I believe there has been a mistake with my room key' menyampaikan masalah dengan tenang, terdidik, dan sangat jelas."
        },
        {
          id: "s3_ep5_q4",
          question: "What does the word 'occupied' mean regarding a hotel room?",
          options: [
            "Kamar kosong dan belum dibersihkan",
            "Kamar sedang dihuni atau ditempati oleh tamu lain",
            "Kamar tidak memiliki pintu",
            "Kamar dicat warna hijau"
          ],
          correctIndex: 1,
          explanation: "'Occupied' berarti kamar sedang dihuni atau ditempati oleh tamu."
        },
        {
          id: "s3_ep5_q5",
          question: "Complete the sentence: 'I am ______ from room 303 to report an issue.'",
          options: [
            "call",
            "calling",
            "called",
            "calls"
          ],
          correctIndex: 1,
          explanation: "Present Continuous setelah to be 'am' menggunakan bentuk verb-ing: 'calling'."
        }
      ],
      summary: {
        takeaways: [
          "Menghubungi resepsionis via dial '0' pada telepon kamar.",
          "Membuka percakapan keluhan formal: 'I am calling to report...'",
          "Menggambarkan kondisi kamar yang terlanjur ditempati (occupied)."
        ]
      },
      cliffhanger: "Dua menit kemudian, suara langkah kaki terburu-buru terdengar di lorong karpet luar. Terdengar ketukan pelan dan santun di pintu kamar: 'Housekeeping and Front Desk!'"
    },

    // EPISODE 6
    {
      id: 6,
      number: 6,
      title: "Komplain yang Santun dan Tegas",
      titleEn: "A Polite but Firm Complaint",
      estimatedMinutes: 10,
      recap: "Resepsionis William tiba di depan kamar 303 didampingi asisten manajer. Kamu menjelaskan duduk perkaranya secara santun namun tegas.",
      dialogue: [
        {
          id: "s3e6_d1",
          speaker: "Receptionist",
          en: "Good evening again, Sir. I rushed up as soon as you called. May I step inside to inspect the situation?",
          idText: "Selamat malam kembali, Pak. Saya bergegas naik begitu Anda menelepon. Boleh saya masuk untuk memeriksa situasinya?"
        },
        {
          id: "s3e6_d2",
          speaker: "You",
          en: "Please, come in. As you can see, there is personal luggage and research papers everywhere.",
          idText: "Silakan masuk. Seperti yang Anda lihat, ada koper pribadi dan kertas riset di mana-mana."
        },
        {
          id: "s3e6_choice_1",
          type: "interactive_choice",
          prompt: "William memeriksa meja dan tampak terkejut. Bagaimana caramu menyampaikan komplain dengan santun namun menuntut solusi pasti?",
          options: [
            {
              id: "s3e6_opt_1a",
              text: "I understand mistakes happen, but I would appreciate being moved to a clean, vacant room immediately.",
              speakerReply: "Receptionist",
              reactionEn: "Absolutely! You are completely right. We take full responsibility for this mix-up.",
              reactionId: "Tentu saja! Anda sepenuhnya benar. Kami bertanggung jawab penuh atas kekeliruan ini."
            },
            {
              id: "s3e6_opt_1b",
              text: "I am quite exhausted from my flight, so I need this issue resolved without further delay.",
              speakerReply: "Receptionist",
              reactionEn: "Of course, Sir. We will arrange a proper, upgraded suite for you right this second.",
              reactionId: "Tentu, Pak. Kami akan menyiapkan kamar suite yang lebih baik untuk Anda detik ini juga."
            }
          ]
        },
        {
          id: "s3e6_d3",
          speaker: "Receptionist",
          en: "I am terribly sorry for this inconvenience. Let me examine the brass key I gave you.",
          idText: "Saya sungguh mohon maaf atas ketidaknyamanan ini. Biar kuperiksa kunci kuningan yang tadi kuberikan pada Anda."
        },
        {
          id: "s3e6_d4",
          speaker: "Kanci",
          en: "Hebat! Menyampaikan keluhan dengan santun ('I would appreciate being moved...') jauh lebih cepat menghasilkan solusi dibanding marah-marah!",
          idText: "Hebat! Menyampaikan keluhan dengan santun ('I would appreciate being moved...') jauh lebih cepat menghasilkan solusi dibanding marah-marah!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-complain-verb",
          word: "complain",
          partOfSpeech: "verb",
          enDefinition: "To express dissatisfaction or annoyance about something.",
          idMeaning: "mengeluh; menyampaikan komplain",
          contextSentence: "You have every right to complain when an error occurs."
        },
        {
          wordId: "batch-polite-adjective",
          word: "polite",
          partOfSpeech: "adjective",
          enDefinition: "Having or showing behavior that is respectful and considerate of other people.",
          idMeaning: "sopan; santun",
          contextSentence: "A polite complaint is always treated with top priority."
        },
        {
          wordId: "batch-wrong-adjective",
          word: "wrong",
          partOfSpeech: "adjective",
          enDefinition: "Not correct or true; incorrect.",
          idMeaning: "salah; keliru",
          contextSentence: "I was accidentally given the wrong room key."
        },
        {
          wordId: "batch-exchange-verb",
          word: "exchange",
          partOfSpeech: "verb",
          enDefinition: "To give something and receive something else in return.",
          idMeaning: "menukar; menukarkan",
          contextSentence: "We will exchange your key for the correct suite."
        },
        {
          wordId: "batch-check-verb",
          word: "check",
          partOfSpeech: "verb",
          enDefinition: "To examine something in order to determine its accuracy, quality, or condition.",
          idMeaning: "memeriksa; mengecek",
          contextSentence: "Let me check the front desk key ledger."
        },
        {
          wordId: "batch-correct-adjective",
          word: "correct",
          partOfSpeech: "adjective",
          enDefinition: "Free from error; in accordance with fact or truth.",
          idMeaning: "benar; tepat",
          contextSentence: "We must ensure you receive the correct room."
        }
      ],
      grammarFocus: {
        title: "Mengajukan Komplain Santun: 'I would appreciate it if you could...'",
        topicId: "present-simple",
        explanation: "Struktur 'I would appreciate it if you could + [Action]' adalah formula komplain tingkat tinggi dalam Bahasa Inggris profesional yang terdengar tegas tanpa emosi kasar.",
        formula: "I would appreciate being moved to [Room] / I need this resolved."
      },
      culturalTip: {
        title: "Seni Menyampaikan Komplain di Industri Hospitality Barat",
        content: "Di budaya Barat, marah berteriak (*shouting*) justru sering membuat staf defensif. Pendekatan terbaik adalah 'polite but firm' (santun namun tegas): jelaskan fakta yang terjadi secara runut, dan nyatakan solusi yang Anda harapkan."
      },
      quiz: [
        {
          id: "s3_ep6_q1",
          question: "Which of the following is the most professional and polite way to request a room change?",
          options: [
            "I would appreciate being moved to a clean, vacant room immediately.",
            "You are stupid and your hotel smells bad!",
            "I will break all the windows unless you give me free gold.",
            "I like sleeping on dirty floors."
          ],
          correctIndex: 0,
          explanation: "'I would appreciate being moved to a clean, vacant room immediately' adalah ungkapan santun, tegas, dan berbobot profesional."
        },
        {
          id: "s3_ep6_q2",
          question: "What does the phrase 'take full responsibility' mean when stated by a hotel manager?",
          options: [
            "Menyalahkan tamu atas kekeliruan",
            "Bertanggung jawab sepenuhnya atas kesalahan yang terjadi",
            "Menutup hotel untuk selamanya",
            "Menolak berbicara dengan tamu"
          ],
          correctIndex: 1,
          explanation: "'Take full responsibility' berarti pihak manajemen mengakui kesalahan dan bertanggung jawab penuh memberikan solusi."
        },
        {
          id: "s3_ep6_q3",
          question: "What is the opposite of 'correct'?",
          options: [
            "Polite",
            "Wrong",
            "Clean",
            "Fast"
          ],
          correctIndex: 1,
          explanation: "Lawan kata dari 'correct' (benar/tepat) adalah 'wrong' (salah/keliru)."
        },
        {
          id: "s3_ep6_q4",
          question: "Why is being 'polite but firm' more effective than shouting?",
          options: [
            "Because staff will cooperate and prioritize your issue faster",
            "Because shouting gives you more food",
            "Because hotel walls are made of paper",
            "Because the doorman likes quiet music"
          ],
          correctIndex: 0,
          explanation: "Sikap santun dan tegas mendorong staf untuk bekerja sama dan menyelesaikan masalahmu sebagai prioritas utama."
        },
        {
          id: "s3_ep6_q5",
          question: "Complete the sentence: 'We will ______ your room key immediately.'",
          options: [
            "exchange",
            "exchanging",
            "exchanged",
            "exchanges"
          ],
          correctIndex: 0,
          explanation: "Setelah modal auxiliary 'will', kata kerja selalu berbentuk dasar (bare infinitive): 'exchange'."
        }
      ],
      summary: {
        takeaways: [
          "Menerapkan teknik komplain santun namun tegas (polite but firm).",
          "Menggunakan formula: 'I would appreciate it if you could...'",
          "Memahami respon profesional pihak manajemen perhotelan."
        ]
      },
      cliffhanger: "William mengambil kunci kuningan nomor 303 dari tanganmu dan membaliknya. Matanya terbelalak melihat bagian belakang gantungan: di sana tertempel stiker kecil bertuliskan 'Prof. Sterling'!"
    },

    // EPISODE 7
    {
      id: 7,
      number: 7,
      title: "Kunci yang Tertukar",
      titleEn: "The Accidental Key Swap",
      estimatedMinutes: 10,
      recap: "Misteri terpecahkan! Gantungan kunci kuningan kamarmu tertukar di meja resepsionis saat jam sibuk kedatangan rombongan tamu sore tadi.",
      dialogue: [
        {
          id: "s3e7_d1",
          speaker: "Receptionist",
          en: "Aha! Look here on the back of the brass tag. It says 'Reserved for Prof. Sterling - Room 303'.",
          idText: "Aha! Lihat di sini pada bagian belakang gantungan kuningan. Tertulis 'Dipesan untuk Prof. Sterling - Kamar 303'."
        },
        {
          id: "s3e7_d2",
          speaker: "You",
          en: "So which room was originally booked for me?",
          idText: "Jadi kamar mana yang sebenarnya dipesan untuk saya?"
        },
        {
          id: "s3e7_choice_1",
          type: "interactive_choice",
          prompt: "William memeriksa catatannya: 'Your reservation was for Room 305, the newly renovated Heritage Garden Suite!' Bagaimana reaksimu?",
          options: [
            {
              id: "s3e7_opt_1a",
              text: "Room 305? I see! The numbers 303 and 305 were placed side by side on your desk.",
              speakerReply: "Receptionist",
              reactionEn: "Precisely! During the afternoon rush, I grabbed 303 instead of 305. I deeply apologize.",
              reactionId: "Tepat sekali! Saat jam sibuk sore tadi, saya mengambil 303 bukannya 305. Saya sungguh minta maaf."
            },
            {
              id: "s3e7_opt_1b",
              text: "Is Room 305 vacant, clean, and ready for me right now?",
              speakerReply: "Receptionist",
              reactionEn: "Yes! It is completely empty, freshly cleaned, and has a breathtaking garden balcony.",
              reactionId: "Ya! Kamar itu kosong, baru saja dibersihkan, dan memiliki balkon taman yang indah."
            }
          ]
        },
        {
          id: "s3e7_d3",
          speaker: "Receptionist",
          en: "Prof. Sterling is currently having dinner in the dining hall. He hasn't noticed the swap yet.",
          idText: "Prof. Sterling saat ini sedang makan malam di ruang makan. Beliau belum menyadari kuncinya tertukar."
        },
        {
          id: "s3e7_d4",
          speaker: "Kanci",
          en: "Syukurlah! Masalahnya murni kekeliruan nomor gantungan 303 dan 305! Kamar 305 bahkan jauh lebih mewah!",
          idText: "Syukurlah! Masalahnya murni kekeliruan nomor gantungan 303 dan 305! Kamar 305 bahkan jauh lebih mewah!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-swap-verb",
          word: "swap",
          partOfSpeech: "verb",
          enDefinition: "To take part in an exchange of.",
          idMeaning: "menukar; tertukar",
          contextSentence: "The room keys were accidentally swapped at the desk."
        },
        {
          wordId: "batch-number-noun",
          word: "number",
          partOfSpeech: "noun",
          enDefinition: "An arithmetical value expressed by a word, symbol, or figure.",
          idMeaning: "nomor; angka",
          contextSentence: "The room numbers 303 and 305 look very similar on brass tags."
        },
        {
          wordId: "batch-gentleman-noun",
          word: "gentleman",
          partOfSpeech: "noun",
          enDefinition: "A chivalrous, courteous, or honorable man.",
          idMeaning: "tuan; pria terhormat",
          contextSentence: "Professor Sterling is an elderly gentleman who loves history."
        },
        {
          wordId: "batch-history-noun",
          word: "history",
          partOfSpeech: "noun",
          enDefinition: "The study of past events, particularly in human affairs.",
          idMeaning: "sejarah",
          contextSentence: "The professor specializes in local architectural history."
        },
        {
          wordId: "batch-sorry-adjective",
          word: "sorry",
          partOfSpeech: "adjective",
          enDefinition: "Feeling regret or penitence.",
          idMeaning: "menyesal; maaf",
          contextSentence: "We are deeply sorry for the confusion tonight."
        },
        {
          wordId: "batch-solve-verb",
          word: "solve",
          partOfSpeech: "verb",
          enDefinition: "To find an answer to, explanation for, or means of effectively dealing with a problem.",
          idMeaning: "memecahkan; menyelesaikan masalah",
          contextSentence: "The staff worked quickly to solve the mix-up."
        }
      ],
      grammarFocus: {
        title: "Past Simple Passive untuk Peristiwa Tak Sengaja ('Keys were swapped')",
        topicId: "past-simple",
        explanation: "Gunakan kalimat pasif Past Simple ('The keys were swapped', 'The mistake was made') untuk menjelaskan kejadian yang tidak disengaja tanpa menyudutkan seseorang secara kasar.",
        formula: "Subject + was/were + [Past Participle V3] / The keys were swapped."
      },
      culturalTip: {
        title: "Kompensasi Layanan Hotel (Service Recovery)",
        content: "Saat hotel bintang melakukan kekeliruan administrasi kamar, mereka umumnya menawarkan kompensasi permohonan maaf (*service recovery*), seperti upgrade kamar gratis, voucher sarapan, atau diskon khusus."
      },
      quiz: [
        {
          id: "s3_ep7_q1",
          question: "How did the key mix-up happen at the front desk?",
          options: [
            "A bird flew into the lobby and stole the key",
            "The clerk grabbed key 303 instead of 305 during the afternoon rush",
            "The guest broke the computer system",
            "The keys melted in the fireplace"
          ],
          correctIndex: 1,
          explanation: "Kekeliruan terjadi saat jam sibuk sore hari ketika resepsionis tidak sengaja mengambil kunci 303 bukannya 305."
        },
        {
          id: "s3_ep7_q2",
          question: "What is the past passive form of the sentence: 'Someone swapped the keys'?",
          options: [
            "The keys are swap today.",
            "The keys were swapped.",
            "The keys will swapping.",
            "The keys has swap."
          ],
          correctIndex: 1,
          explanation: "Bentuk pasif lampau jamak menggunakan were + V3: 'The keys were swapped'."
        },
        {
          id: "s3_ep7_q3",
          question: "Where was Professor Sterling while this mix-up was being resolved?",
          options: [
            "Sleeping inside the wardrobe",
            "Having dinner in the hotel dining hall",
            "Swimming in the ocean",
            "Flying in an airplane"
          ],
          correctIndex: 1,
          explanation: "Prof. Sterling sedang bersantap malam di ruang makan hotel (*having dinner in the dining hall*)."
        },
        {
          id: "s3_ep7_q4",
          question: "Which room is your actual, freshly cleaned room?",
          options: [
            "Room 303",
            "Room 305 (Heritage Garden Suite)",
            "Room 999",
            "The basement garage"
          ],
          correctIndex: 1,
          explanation: "Kamar yang sesungguhnya dipesan untukmu adalah kamar 305 (Heritage Garden Suite)."
        },
        {
          id: "s3_ep7_q5",
          question: "Complete the sentence: 'The manager promised to ______ the issue immediately.'",
          options: [
            "solve",
            "solving",
            "solved",
            "solves"
          ],
          correctIndex: 0,
          explanation: "Setelah to-infinitive ('to + verb base'), gunakan kata kerja bentuk dasar: 'solve'."
        }
      ],
      summary: {
        takeaways: [
          "Mengetahui akar masalah kunci tertukar antara kamar 303 dan 305.",
          "Menggunakan struktur Past Simple Passive: 'The keys were swapped.'",
          "Memahami konsep service recovery dalam perhotelan internasional."
        ]
      },
      cliffhanger: "William menyerahkan kunci kuningan berkilau nomor 305 dan mengambil alih pegangan kopermu: 'Mari, ikuti saya ke seberang lorong. Kamar 305 telah menanti Anda!'"
    },

    // EPISODE 8
    {
      id: 8,
      number: 8,
      title: "Pindah ke Kamar yang Tepat",
      titleEn: "Moving to the Correct Suite",
      estimatedMinutes: 10,
      recap: "Kamu melangkah melintasi lorong menuju kamar 305. William membuka pintu kamar barumu yang sesungguhnya.",
      dialogue: [
        {
          id: "s3e8_d1",
          speaker: "Receptionist",
          en: "Welcome to Room 305! As you can see, this suite is much larger, brighter, and completely fresh.",
          idText: "Selamat datang di Kamar 305! Seperti yang Anda lihat, suite ini jauh lebih luas, lebih terang, dan sangat segar."
        },
        {
          id: "s3e8_d2",
          speaker: "You",
          en: "Wow! Look at that king-size bed and the private balcony overlooking the botanical garden!",
          idText: "Wah! Lihat ranjang king-size itu dan balkon pribadi yang menghadap ke kebun raya!"
        },
        {
          id: "s3e8_choice_1",
          type: "interactive_choice",
          prompt: "William meletakkan kopermu di rak koper dan meletakkan voucher buah selamat datang di meja. Apa yang kamu katakan?",
          options: [
            {
              id: "s3e8_opt_1a",
              text: "This room is so comfortable and clean. Thank you for resolving everything so quickly!",
              speakerReply: "Receptionist",
              reactionEn: "It is our absolute pleasure, Sir. We have also credited complimentary breakfast to your stay.",
              reactionId: "Dengan segala senang hati, Pak. Kami juga menambahkan fasilitas sarapan gratis untuk Anda."
            },
            {
              id: "s3e8_opt_1b",
              text: "I really appreciate your help, William. Here is a small tip for your assistance.",
              speakerReply: "Receptionist",
              reactionEn: "You are far too kind, Sir! Thank you very much indeed. Sleep peacefully tonight.",
              reactionId: "Anda sungguh teramat baik, Pak! Terima kasih banyak. Semoga tidur nyenyak malam ini."
            }
          ]
        },
        {
          id: "s3e8_d3",
          speaker: "You",
          en: "Now I can finally unpack my clothes and take a relaxing warm shower.",
          idText: "Sekarang akhirnya aku bisa membongkar pakaianku dan mandi air hangat yang menyegarkan."
        },
        {
          id: "s3e8_d4",
          speaker: "Kanci",
          en: "Lihat betapa nyamannya kamar barumu! Sikap sabar dan komunikasimu yang baik berbuah kamar terbaik!",
          idText: "Lihat betapa nyamannya kamar barumu! Sikap sabar dan komunikasimu yang baik berbuah kamar terbaik!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-move-verb",
          word: "move",
          partOfSpeech: "verb",
          enDefinition: "To go from one place of residence or stay to another.",
          idMeaning: "pindah; berpindah kamar",
          contextSentence: "The porter helped me move into Room 305."
        },
        {
          wordId: "batch-suite-noun",
          word: "suite",
          partOfSpeech: "noun",
          enDefinition: "A set of rooms designated for one person's or family's use or for a particular purpose.",
          idMeaning: "kamar suite (kamar luas berpintu/balkon)",
          contextSentence: "The garden suite features an expansive balcony."
        },
        {
          wordId: "batch-view-noun",
          word: "view",
          partOfSpeech: "noun",
          enDefinition: "The ability to see something or to be seen from a particular place; a sight or prospect.",
          idMeaning: "pemandangan; view",
          contextSentence: "The private balcony offers a panoramic park view."
        },
        {
          wordId: "batch-modern-adjective",
          word: "modern",
          partOfSpeech: "adjective",
          enDefinition: "Relating to the present or recent times as opposed to the remote past.",
          idMeaning: "modern; mutakhir",
          contextSentence: "The bathroom features modern Italian marble fixtures."
        },
        {
          wordId: "batch-comfortable-adjective",
          word: "comfortable",
          partOfSpeech: "adjective",
          enDefinition: "Providing physical ease and relaxation.",
          idMeaning: "nyaman; empuk",
          contextSentence: "The king-size bed is exceptionally comfortable."
        },
        {
          wordId: "batch-clean-adjective",
          word: "clean",
          partOfSpeech: "adjective",
          enDefinition: "Free from dirt, marks, or stains.",
          idMeaning: "bersih",
          contextSentence: "Freshly laundered white towels are clean and soft."
        }
      ],
      grammarFocus: {
        title: "Perbandingan Komparatif Sifat ('much larger and brighter')",
        topicId: "present-simple",
        explanation: "Gunakan bentuk komparatif adjective berakhiran -er ('larger', 'brighter', 'cleaner') diawali kata penegas 'much' untuk membandingkan dua kamar: 'This room is much larger than the previous one'.",
        formula: "Subject + is + much + [Comparative Adjective -er / more Adjective] + than..."
      },
      culturalTip: {
        title: "Etika Memberi Uang Tip (Tipping) di Hotel Berbintang",
        content: "Memberikan tip kecil (\$2–\$5 atau setara mata uang lokal) kepada porter atau staf hotel yang telah membantu memindahkan koper dan menyelesaikan masalah adalah bentuk apresiasi yang sangat dihargai di banyak negara."
      },
      quiz: [
        {
          id: "s3_ep8_q1",
          question: "How did Room 305 compare to Room 303?",
          options: [
            "It was smaller and had no windows",
            "It was much larger, brighter, and freshly cleaned",
            "It was filled with water",
            "It was located outside on the street"
          ],
          correctIndex: 1,
          explanation: "Kamar 305 jauh lebih luas, lebih terang, dan baru saja dibersihkan (*much larger, brighter, and clean*)."
        },
        {
          id: "s3_ep8_q2",
          question: "What is the comparative form of the adjective 'large'?",
          options: [
            "Larger",
            "More large",
            "Largest",
            "Larging"
          ],
          correctIndex: 0,
          explanation: "Bentuk komparatif dari kata sifat satu suku kata 'large' adalah 'larger'."
        },
        {
          id: "s3_ep8_q3",
          question: "What view did the balcony in Room 305 overlook?",
          options: [
            "A dark basement",
            "The botanical garden",
            "A brick wall",
            "An empty highway"
          ],
          correctIndex: 1,
          explanation: "Balkon kamar 305 menghadap ke pemandangan kebun raya (*botanical garden*)."
        },
        {
          id: "s3_ep8_q4",
          question: "What additional complimentary service did the hotel grant to apologize for the mix-up?",
          options: [
            "Complimentary breakfast",
            "Free airplane ticket to the moon",
            "A live elephant",
            "Nothing at all"
          ],
          correctIndex: 0,
          explanation: "Pihak hotel memberikan layanan sarapan gratis (*complimentary breakfast*) sebagai kompensasi pelayanan."
        },
        {
          id: "s3_ep8_q5",
          question: "Complete the sentence: 'The bed in the new suite is very ______.'",
          options: [
            "comfortable",
            "comfortably",
            "comforting",
            "comforted"
          ],
          correctIndex: 0,
          explanation: "Setelah linking verb 'is' dan adverb 'very', gunakan bentuk kata sifat (adjective): 'comfortable'."
        }
      ],
      summary: {
        takeaways: [
          "Membandingkan kualitas ruangan dengan comparative adjectives: 'much larger and brighter'.",
          "Mengapresiasi penyelesaian masalah oleh staf hotel.",
          "Mengenali budaya tipping sukarela bagi porter hotel."
        ]
      },
      cliffhanger: "Setelah mandi dan berganti pakaian santai, perutmu mulai terasa lapar. Kamu memutuskan turun ke ruang makan lantai dasar untuk menikmati secangkir teh hangat dan makan malam ringan."
    },

    // EPISODE 9
    {
      id: 9,
      number: 9,
      title: "Pertemuan Singkat di Restoran",
      titleEn: "A Chance Meeting at the Dining Hall",
      estimatedMinutes: 10,
      recap: "Di ruang makan restoran hotel yang temaram dan hangat, kamu duduk menikmati hidangan malam. Di meja sebelah, seorang pria tua berkacamata sedang membaca buku tua.",
      dialogue: [
        {
          id: "s3e9_d1",
          speaker: "Narator",
          en: "Soft classical violin music plays in the hotel dining hall as you sip your chamomile tea.",
          idText: "Alunan musik biola klasik yang lembut mengalun di ruang makan hotel saat kamu menyeruput teh kamomil hangatmu."
        },
        {
          id: "s3e9_d2",
          speaker: "Professor",
          en: "Excuse me, young traveler. William at the desk told me about our little key mix-up earlier this evening!",
          idText: "Permisi, pengelana muda. William di meja depan menceritakan kepadaku tentang kunci kita yang sempat tertukar tadi sore!"
        },
        {
          id: "s3e9_choice_1",
          type: "interactive_choice",
          prompt: "Prof. Sterling tersenyum ramah dan memegang cangkir tehnya. Bagaimana kamu merespons perkenalannya?",
          options: [
            {
              id: "s3e9_opt_1a",
              text: "Good evening, Professor Sterling! It is an honor to meet you. No harm was done at all.",
              speakerReply: "Professor",
              reactionEn: "Delighted to meet you! William told me you respected my research desk and didn't touch a thing.",
              reactionId: "Senang sekali bertemu denganmu! William bilang kamu menghormati meja risetku dan tidak menyentuh apa pun."
            },
            {
              id: "s3e9_opt_1b",
              text: "Good evening! I was fascinated by the intricate wooden box on your desk.",
              speakerReply: "Professor",
              reactionEn: "Ah! The carved teak box! That box contains manuscripts from the old city cathedral.",
              reactionId: "Ah! Kotak jati berukir itu! Kotak itu memuat manuskrip tua dari katedral kota kuno."
            }
          ]
        },
        {
          id: "s3e9_d3",
          speaker: "Professor",
          en: "I was researching the ancient archives when the keys got swapped. I am glad you have the lovely garden suite!",
          idText: "Aku sedang meneliti arsip kuno saat kuncinya tertukar. Aku senang kamu mendapatkan kamar suite taman yang indah!"
        },
        {
          id: "s3e9_d4",
          speaker: "Kanci",
          en: "Luar biasa! Dari sebuah kekeliruan kecil, kamu justru berkenalan dengan seorang sejarawan hebat!",
          idText: "Luar biasa! Dari sebuah kekeliruan kecil, kamu justru berkenalan dengan seorang sejarawan hebat!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-dinner-noun",
          word: "dinner",
          partOfSpeech: "noun",
          enDefinition: "The main meal of the day, taken either around midday or in the evening.",
          idMeaning: "makan malam",
          contextSentence: "Guests enjoy a warm dinner by the dining room fireplace."
        },
        {
          wordId: "batch-meal-noun",
          word: "meal",
          partOfSpeech: "noun",
          enDefinition: "Any of the regular occasions in a day when a reasonably large amount of food is eaten.",
          idMeaning: "hidangan makanan; santapan",
          contextSentence: "The chef prepared a delicious three-course meal."
        },
        {
          wordId: "batch-tell-verb",
          word: "tell",
          partOfSpeech: "verb",
          enDefinition: "To communicate information, facts, or news to someone in spoken or written words.",
          idMeaning: "menceritakan; memberi tahu",
          contextSentence: "Let me tell you the story behind the wooden box."
        },
        {
          wordId: "batch-story-noun",
          word: "story",
          partOfSpeech: "noun",
          enDefinition: "An account of imaginary or real people and events told for entertainment.",
          idMeaning: "cerita; kisah",
          contextSentence: "The professor shared a fascinating historical story."
        },
        {
          wordId: "batch-curious-adjective",
          word: "curious",
          partOfSpeech: "adjective",
          enDefinition: "Eager to know or learn something.",
          idMeaning: "penasaran; ingin tahu",
          contextSentence: "I was curious about the ancient carvings on the lid."
        },
        {
          wordId: "batch-history-noun",
          word: "history",
          partOfSpeech: "noun",
          enDefinition: "The whole series of past events connected with a someone or something.",
          idMeaning: "sejarah masa lalu",
          contextSentence: "This city is filled with rich history and folklore."
        }
      ],
      grammarFocus: {
        title: "Past Continuous untuk Latar Belakang Peristiwa ('While I was researching...')",
        topicId: "past-continuous",
        explanation: "Gunakan Past Continuous ('was/were + verb-ing') untuk mendeskripsikan aktivitas yang sedang berlangsung di masa lampau ketika kejadian lain terjadi: 'While I was researching, the keys got swapped'.",
        formula: "While + Subject + was/were + [Verb-ing], Subject + [Past Simple V2]."
      },
      culturalTip: {
        title: "Etika Percakapan Santai di Ruang Makan Bersama",
        content: "Di hotel-hotel bersejarah bergaya Eropa, tamu sering kali menyapa dan mengobrol santai (*casual dining banter*) di ruang makan. Menghargai cerita orang tua atau akademisi adalah bagian dari etiket keramahan internasional."
      },
      quiz: [
        {
          id: "s3_ep9_q1",
          question: "What was inside the mysterious carved wooden box according to Professor Sterling?",
          options: [
            "Diamonds and golden rings",
            "Ancient manuscripts from the old city cathedral",
            "Dirty laundry socks",
            "A live pigeon"
          ],
          correctIndex: 1,
          explanation: "Prof. Sterling menjelaskan bahwa kotak tersebut berisi manuskrip kuno dari katedral kota tua."
        },
        {
          id: "s3_ep9_q2",
          question: "Which tense is used to describe a background action in progress in the past: 'While I was researching...'?",
          options: [
            "Past Continuous Tense",
            "Simple Future Tense",
            "Present Simple Tense",
            "Imperative Mood"
          ],
          correctIndex: 0,
          explanation: "'While I was researching' menggunakan Past Continuous Tense (was + verb-ing) untuk aksi yang sedang berlangsung di masa lalu."
        },
        {
          id: "s3_ep9_q3",
          question: "What adjective describes someone who is eager to know or learn new things?",
          options: [
            "Sleepy",
            "Curious",
            "Angry",
            "Crowded"
          ],
          correctIndex: 1,
          explanation: "'Curious' berarti memiliki rasa ingin tahu yang besar atau penasaran."
        },
        {
          id: "s3_ep9_q4",
          question: "Why was Professor Sterling pleased with you?",
          options: [
            "Because you broke his pen",
            "Because you respected his privacy and didn't touch his research materials",
            "Because you took his coat",
            "Because you ran away"
          ],
          correctIndex: 1,
          explanation: "Prof. Sterling menghargai sikapmu yang menjaga etika privasi dan tidak menyentuh bahan risetnya di kamar 303."
        },
        {
          id: "s3_ep9_q5",
          question: "Complete the sentence: 'The professor liked to ______ historical tales.'",
          options: [
            "tell",
            "telling",
            "told",
            "tells"
          ],
          correctIndex: 0,
          explanation: "Setelah konstruksi 'liked to' (infinitive), gunakan kata kerja bentuk dasar: 'tell'."
        }
      ],
      summary: {
        takeaways: [
          "Membangun percakapan hangat dengan tamu hotel lain di ruang makan.",
          "Mengetahui rahasia isi kotak kayu berukir (manuskrip katedral kuno).",
          "Menggunakan struktur Past Continuous: 'While I was researching...'"
        ]
      },
      cliffhanger: "Prof. Sterling tersenyum dan mengangkat cangkir tehnya: 'Kota ini menyimpan banyak rahasia menarik. Besok, nikmatilah harimu dan kunjungi museum tua di ujung jalan!' Kamu membalas senyumnya dan bersiap kembali ke kamarmu."
    },

    // EPISODE 10
    {
      id: 10,
      number: 10,
      title: "Malam Pertama yang Tenang",
      titleEn: "A Peaceful First Night",
      estimatedMinutes: 10,
      recap: "Kembali ke kamar 305 setelah obrolan hangat dan makan malam, kamu bersiap untuk beristirahat. Hari yang penuh kejutan telah kamu lewati dengan sukses dan kepala dingin.",
      dialogue: [
        {
          id: "s3e10_d1",
          speaker: "Narator",
          en: "The room is quiet and peaceful. Cool evening breeze drifts through the balcony door.",
          idText: "Kamar terasa hening dan damai. Angin malam yang sejuk berhembus melalui pintu balkon."
        },
        {
          id: "s3e10_d2",
          speaker: "Kanci",
          en: "Kerja yang luar biasa hari ini! Dari kunci yang tertukar, komplain santun, sampai berteman dengan profesor sejarawan!",
          idText: "Kerja yang luar biasa hari ini! Dari kunci yang tertukar, komplain santun, sampai berteman dengan profesor sejarawan!"
        },
        {
          id: "s3e10_choice_1",
          type: "interactive_choice",
          prompt: "Sebelum mematikan lampu meja, apa yang kamu tulis di jurnal harian belajarmu?",
          options: [
            {
              id: "s3e10_opt_1a",
              text: "I learned how to resolve unexpected problems with polite and confident communication.",
              speakerReply: "Kanci",
              reactionEn: "A golden lesson! Courtesy and confidence open every door in the world.",
              reactionId: "Pelajaran emas! Kesantunan dan rasa percaya diri membuka setiap pintu di dunia."
            },
            {
              id: "s3e10_opt_1b",
              text: "Tomorrow I will explore the historic cathedral museum and practice more English.",
              speakerReply: "Kanci",
              reactionEn: "Rest well tonight. Tomorrow brings even greater adventures and new words!",
              reactionId: "Istirahatlah dengan nyenyak malam ini. Hari esok membawa petualangan dan kata-kata baru yang lebih hebat!"
            }
          ]
        },
        {
          id: "s3e10_d3",
          speaker: "You",
          en: "Good night, Kanci. I feel very peaceful and ready for a good sleep.",
          idText: "Selamat malam, Kanci. Aku merasa sangat damai dan siap untuk tidur nyenyak."
        },
        {
          id: "s3e10_d4",
          speaker: "Narator",
          en: "You switch off the bedside lamp. Outside the window, the stars shine brightly over the Grand Heritage Hotel.",
          idText: "Kamu mematikan lampu nakas. Di luar jendela, bintang-bintang bersinar terang di atas Grand Heritage Hotel."
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-sleep-verb",
          word: "sleep",
          partOfSpeech: "verb",
          enDefinition: "To be in a state of rest in which the eyes are closed and consciousness is suspended.",
          idMeaning: "tidur",
          contextSentence: "I can finally sleep comfortably after an eventful day."
        },
        {
          wordId: "batch-night-noun",
          word: "night",
          partOfSpeech: "noun",
          enDefinition: "The period of darkness in each twenty-four hours; the time from sunset to sunrise.",
          idMeaning: "malam; malam hari",
          contextSentence: "The cool night air is calm and quiet."
        },
        {
          wordId: "batch-rest-verb",
          word: "rest",
          partOfSpeech: "verb",
          enDefinition: "To cease work or movement in order to relax, refresh oneself, or recover strength.",
          idMeaning: "beristirahat",
          contextSentence: "You need to rest your body after traveling."
        },
        {
          wordId: "batch-relax-verb",
          word: "relax",
          partOfSpeech: "verb",
          enDefinition: "To make or become less tense or anxious.",
          idMeaning: "santai; rileks",
          contextSentence: "Sit on the balcony and relax with a book."
        },
        {
          wordId: "batch-peaceful-adjective",
          word: "peaceful",
          partOfSpeech: "adjective",
          enDefinition: "Free from disturbance; tranquil, quiet, and calm.",
          idMeaning: "damai; tenang; tenteram",
          contextSentence: "The hotel garden is exceptionally peaceful at night."
        },
        {
          wordId: "batch-tomorrow-noun",
          word: "tomorrow",
          partOfSpeech: "noun",
          enDefinition: "On the day after today.",
          idMeaning: "besok; hari esok",
          contextSentence: "Tomorrow promises new discoveries and historical sights."
        }
      ],
      grammarFocus: {
        title: "Modals untuk Rencana Masa Depan yang Fleksibel ('I might explore...')",
        topicId: "present-simple",
        explanation: "Gunakan modal verb 'might' atau 'will' ('Tomorrow I will explore...', 'I might visit...') untuk mengekspresikan rencana atau kemungkinan yang akan kamu lakukan esok hari.",
        formula: "Tomorrow + Subject + will / might + [Verb Base] / I will rest tonight."
      },
      culturalTip: {
        title: "Tanda 'Do Not Disturb' di Pintu Kamar Hotel",
        content: "Jika Anda ingin tidur larut pagi tanpa terganggu oleh ketukan staf pembersih kamar (*housekeeping*), gantungkan tanda 'Do Not Disturb' (DND) di gagang luar pintu kamar sebelum tidur."
      },
      quiz: [
        {
          id: "s3_ep10_q1",
          question: "What sign should you hang on your hotel door handle if you do not want housekeeping to wake you up in the morning?",
          options: [
            "Fire Exit Only",
            "Do Not Disturb (DND)",
            "Room Free for All",
            "Please Paint the Wall"
          ],
          correctIndex: 1,
          explanation: "Tanda 'Do Not Disturb' (DND) digantung di gagang pintu luar agar staf tidak mengetuk kamar saat Anda beristirahat."
        },
        {
          id: "s3_ep10_q2",
          question: "What does the adjective 'peaceful' mean?",
          options: [
            "Bising dan penuh suara klakson",
            "Damai, tenang, dan bebas dari gangguan",
            "Sangat berbahaya dan gelap",
            "Penuh dengan orang asing"
          ],
          correctIndex: 1,
          explanation: "'Peaceful' berarti tenang, damai, dan tenteram."
        },
        {
          id: "s3_ep10_q3",
          question: "Which modal verb expresses a possible future plan with less certainty than 'will'?",
          options: [
            "Might",
            "Must",
            "Was",
            "Did"
          ],
          correctIndex: 0,
          explanation: "'Might' digunakan untuk kemungkinan di masa depan yang fleksibel (contoh: 'I might visit the museum tomorrow')."
        },
        {
          id: "s3_ep10_q4",
          question: "What was the main lesson learned from resolving the key mix-up?",
          options: [
            "Shouting always gets you free food",
            "Courteous, calm, and clear communication leads to the best solution",
            "Never sleep in a hotel again",
            "Keys should be thrown in the river"
          ],
          correctIndex: 1,
          explanation: "Pelajaran berharga adalah komunikasi yang santun, tenang, dan jelas selalu menghasilkan solusi terbaik."
        },
        {
          id: "s3_ep10_q5",
          question: "Complete the sentence: 'I feel very ______ after resolving the problem today.'",
          options: [
            "peaceful",
            "peacefully",
            "peaced",
            "peaces"
          ],
          correctIndex: 0,
          explanation: "Setelah linking verb 'feel', gunakan bentuk kata sifat (adjective): 'peaceful'."
        }
      ],
      summary: {
        takeaways: [
          "Merefleksikan keberhasilan komunikasi santun mengatasi masalah tak terduga.",
          "Mengenali fungsi gantungan pintu 'Do Not Disturb' (DND).",
          "Merencanakan kegiatan esok hari dengan modal 'will' dan 'might'."
        ]
      },
      cliffhanger: "Saat kamu menarik selimut hangat, selembar surat kuno beramplop krem terselip di laci nakas meja samping ranjang: 'Kepada cucuku tercinta... jika kamu membaca surat ini di Grand Heritage Hotel, carilah petunjuk berikutnya di loteng rumah tua keluarga kita...' Petualangan Cerita 4 telah menantimu!"
    }
  ]
};

// Validate consistency
if (story03.episodes.length !== 10) {
  throw new Error("Story 3 must have exactly 10 episodes!");
}

story03.episodes.forEach((ep) => {
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

fs.writeFileSync("src/data/stories/story-03.json", JSON.stringify(story03, null, 2), "utf8");
console.log("✓ SUCCESS: Story 3 (story-03.json) successfully created with all 10 full-length episodes!");
console.log("Total Episodes:", story03.episodes.length);
console.log("Total Quiz Questions:", story03.episodes.length * 5);
console.log("Total Oxford 3000 Vocabularies:", story03.episodes.length * 6);
