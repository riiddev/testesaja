import fs from "fs";
import path from "path";

// Define the full Story 4 data
const story04 = {
  id: "story-04",
  number: 4,
  title: "Surat dari Kakek",
  titleEn: "Letters from Grandfather",
  level: "A2",
  levelReq: 4,
  totalEpisodes: 10,
  themeColor: "#D69E2E",
  description: "Menemukan amplop surat tua peninggalan kakek yang ditulis tiga puluh tahun silam, membandingkan kehidupan masa lalu dan masa kini, serta menelusuri jejak bengkel arloji sahabat lama kakek di kota tua.",
  learningFocus: "Family Vocabulary, Past vs Present ('Used to' vs 'Now'), Reading Informal Letters, Expressing Nostalgia, Family Heirlooms.",
  episodes: [
    // EPISODE 1
    {
      id: 1,
      number: 1,
      title: "Amplop Berdebu di Laci Meja",
      titleEn: "The Dusty Envelope in the Drawer",
      estimatedMinutes: 10,
      recap: "Saat merapikan barang bawaan di kamar 305 Grand Heritage Hotel, kamu membuka laci kayu jati nakas samping ranjang dan menemukan sebuah amplop surat tebal berstempel pos tua tahun 1994.",
      dialogue: [
        {
          id: "s4e1_d1",
          speaker: "Narator",
          en: "At the very back of the cedarwood drawer lies a thick yellowed envelope tied with faded twine.",
          idText: "Di bagian paling belakang laci kayu cedar, tergeletak sebuah amplop tebal menguning yang diikat dengan tali rami usang."
        },
        {
          id: "s4e1_d2",
          speaker: "Kanci",
          en: "Lihat perangko kuno di sudut amplop itu! Stempel posnya bertarikh musim gugur tiga puluh tahun yang lalu!",
          idText: "Lihat perangko kuno di sudut amplop itu! Stempel posnya bertarikh musim gugur tiga puluh tahun yang lalu!"
        },
        {
          id: "s4e1_d3",
          speaker: "You",
          en: "There is handwriting on the front: 'To my dearest grandchild, for when you journey to this city.'",
          idText: "Ada tulisan tangan di bagian depan: 'Untuk cucuku tercinta, saat kelak kamu berkelana ke kota ini.'"
        },
        {
          id: "s4e1_choice_1",
          type: "interactive_choice",
          prompt: "Jantungmu berdebar membaca tulisan tangan yang sangat kamu kenali itu. Apa yang kamu lakukan?",
          options: [
            {
              id: "s4e1_opt_1a",
              text: "I will gently untie the twine and open the envelope under the warm desk lamp.",
              speakerReply: "Kanci",
              reactionEn: "Be very gentle. The paper is delicate and holds precious family memories.",
              reactionId: "Berhati-hatilah. Kertasnya rapuh dan menyimpan kenangan keluarga yang berharga."
            },
            {
              id: "s4e1_opt_1b",
              text: "I want to examine the postmark and the vintage red stamp first.",
              speakerReply: "Kanci",
              reactionEn: "The stamp features the old clock tower of this city. Grandfather planned this long ago!",
              reactionId: "Perangko itu bergambar menara jam tua kota ini. Kakek merencanakan ini sejak lama!"
            }
          ]
        },
        {
          id: "s4e1_d4",
          speaker: "You",
          en: "It really is from my grandfather. His warm, elegant handwriting is unmistakable.",
          idText: "Ini sungguh dari kakekku. Tulisan tangannya yang hangat dan anggun sangat tidak asing."
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-envelope-noun",
          word: "envelope",
          partOfSpeech: "noun",
          enDefinition: "A flat paper container with a sealable flap, used to enclose a letter or document.",
          idMeaning: "amplop surat",
          contextSentence: "The thick envelope was sealed with dark red wax."
        },
        {
          wordId: "batch-drawer-noun",
          word: "drawer",
          partOfSpeech: "noun",
          enDefinition: "A box-like storage compartment without a lid, made to slide horizontally in and out of a desk.",
          idMeaning: "laci meja",
          contextSentence: "The old bedside drawer held forgotten keepsakes."
        },
        {
          wordId: "batch-letter-noun",
          word: "letter",
          partOfSpeech: "noun",
          enDefinition: "A written, typed, or printed communication sent in an envelope by post.",
          idMeaning: "surat",
          contextSentence: "Grandfather wrote this letter three decades ago."
        },
        {
          wordId: "batch-stamp-noun",
          word: "stamp",
          partOfSpeech: "noun",
          enDefinition: "A small adhesive piece of paper stuck to something to show that postal fees have been paid.",
          idMeaning: "perangko",
          contextSentence: "The vintage stamp depicts the city's historic clock tower."
        },
        {
          wordId: "batch-discover-verb",
          word: "discover",
          partOfSpeech: "verb",
          enDefinition: "To find unexpectedly or in the course of a search.",
          idMeaning: "menemukan",
          contextSentence: "I was surprised to discover my family's heritage here."
        },
        {
          wordId: "batch-grandpa-noun",
          word: "grandfather",
          partOfSpeech: "noun",
          enDefinition: "The father of one's father or mother.",
          idMeaning: "kakek",
          contextSentence: "My grandfather was a wise and adventurous man."
        }
      ],
      grammarFocus: {
        title: "Simple Past Tense untuk Penemuan Mendadak ('I discovered...')",
        topicId: "past-simple",
        explanation: "Gunakan Simple Past Tense ('I discovered', 'I opened', 'I found') untuk menceritakan momen penemuan barang bersejarah yang terjadi pada saat tertentu di masa lampau.",
        formula: "Subject + [Past Simple V2] + [Object] / I discovered an old envelope."
      },
      culturalTip: {
        title: "Tradisi Menyimpan Surat Kenangan Keluarga",
        content: "Di masa sebelum surat elektronik (email), surat tulisan tangan di atas kertas linen tebal merupakan sarana utama penyampaian pesan antar-generasi yang disimpan sebagai benda pusaka bernilai emosional tinggi."
      },
      quiz: [
        {
          id: "s4_ep1_q1",
          question: "Where did you discover the yellowed envelope?",
          options: [
            "Inside the hotel swimming pool",
            "At the back of the bedside cedarwood drawer",
            "On top of the bus roof",
            "Under the restaurant carpet"
          ],
          correctIndex: 1,
          explanation: "Amplop tersebut ditemukan di bagian belakang laci kayu cedar samping ranjang kamar hotel."
        },
        {
          id: "s4_ep1_q2",
          question: "What was written on the front of the envelope?",
          options: [
            "Throw this away immediately",
            "To my dearest grandchild, for when you journey to this city",
            "Pay ten dollars to the driver",
            "Secret code for the elevator"
          ],
          correctIndex: 1,
          explanation: "Tulisan di depan amplop berbunyi: 'To my dearest grandchild, for when you journey to this city'."
        },
        {
          id: "s4_ep1_q3",
          question: "What is the past tense form of the verb 'discover'?",
          options: [
            "Discovering",
            "Discovered",
            "Discovers",
            "Discovery"
          ],
          correctIndex: 1,
          explanation: "Bentuk Simple Past beraturan (regular verb) dari 'discover' adalah 'discovered'."
        },
        {
          id: "s4_ep1_q4",
          question: "What image was depicted on the vintage postage stamp?",
          options: [
            "A modern airplane",
            "The historic clock tower of the city",
            "A bowl of noodles",
            "A yellow taxi"
          ],
          correctIndex: 1,
          explanation: "Perangko antik tersebut menggambarkan menara jam bersejarah di kota tua (*the historic clock tower*)."
        },
        {
          id: "s4_ep1_q5",
          question: "Complete the sentence: 'Grandfather ______ this letter thirty years ago.'",
          options: [
            "wrote",
            "write",
            "writing",
            "written"
          ],
          correctIndex: 0,
          explanation: "Bentuk Past Simple tidak beraturan (irregular past tense) dari 'write' adalah 'wrote'."
        }
      ],
      summary: {
        takeaways: [
          "Menemukan surat peninggalan kakek dengan Simple Past: 'I discovered an envelope.'",
          "Mengenali kosakata surat pos: envelope, drawer, letter, stamp, postmark.",
          "Menghargai tradisi berkirim surat tulisan tangan antar-generasi."
        ]
      },
      cliffhanger: "Saat kamu membuka lipatan kertas pertama dengan hati-hati, aroma tinta kayu manis tercium lembut. Tinta hitam tulisan tangan tegak bersambung kakek mulai menampakkan kisah masa mudanya..."
    },

    // EPISODE 2
    {
      id: 2,
      number: 2,
      title: "Membaca Tulisan Tangan Masa Lalu",
      titleEn: "Reading the Cursive Handwriting",
      estimatedMinutes: 10,
      recap: "Kamu mulai membaca lembaran pertama surat kakek. Beliau menceritakan masa mudanya tiga puluh tahun yang lalu saat pertama kali merantau ke kota tua ini.",
      dialogue: [
        {
          id: "s4e2_d1",
          speaker: "Grandfather",
          en: "'My dear grandchild, when I was twenty-one, I arrived in this city with only a small bag and a big dream.'",
          idText: "'Cucuku tersayang, saat kakek berusia dua puluh satu tahun, kakek tiba di kota ini hanya berbekal tas kecil dan mimpi yang besar.'"
        },
        {
          id: "s4e2_d2",
          speaker: "You",
          en: "Kakek dulu bekerja sebagai pemagang pembuat roti di toko roti dekat katedral tua.",
          idText: "Kakek dulu bekerja sebagai pemagang pembuat roti di toko roti dekat katedral tua."
        },
        {
          id: "s4e2_choice_1",
          type: "interactive_choice",
          prompt: "Kakek menulis: 'I used to wake up at 4 AM every morning to bake fresh sourdough bread.' Bagaimana kamu meresponnya?",
          options: [
            {
              id: "s4e2_opt_1a",
              text: "Grandfather was so hardworking and disciplined in his youth.",
              speakerReply: "Kanci",
              reactionEn: "Indeed! Hard work builds character and opens remarkable opportunities.",
              reactionId: "Tepat sekali! Kerja keras membentuk karakter dan membuka peluang-peluang hebat."
            },
            {
              id: "s4e2_opt_1b",
              text: "I wonder if that ancient bakery by the cathedral is still standing today.",
              speakerReply: "Kanci",
              reactionEn: "We can check the city map tomorrow! Old bakeries often survive for centuries.",
              reactionId: "Kita bisa cek peta kota besok! Toko roti kuno sering kali bertahan berabad-abad."
            }
          ]
        },
        {
          id: "s4e2_d3",
          speaker: "Grandfather",
          en: "'Remember this: skills and kindness are the greatest wealth you will ever possess.'",
          idText: "'Ingatlah ini: keterampilan dan kebaikan hati adalah kekayaan terbesar yang akan pernah kamu miliki.'"
        },
        {
          id: "s4e2_d4",
          speaker: "Kanci",
          en: "Nasihat yang sangat menyentuh hati! Struktur 'used to' digunakan kakek untuk menceritakan kebiasaan masa mudanya!",
          idText: "Nasihat yang sangat menyentuh hati! Struktur 'used to' digunakan kakek untuk menceritakan kebiasaan masa mudanya!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-handwriting-noun",
          word: "handwriting",
          partOfSpeech: "noun",
          enDefinition: "Writing done with a pen or pencil in the hand, as opposed to typing or printing.",
          idMeaning: "tulisan tangan",
          contextSentence: "His elegant cursive handwriting is easy to read."
        },
        {
          wordId: "batch-read-verb",
          word: "read",
          partOfSpeech: "verb",
          enDefinition: "To look at and comprehend the meaning of written or printed characters.",
          idMeaning: "membaca",
          contextSentence: "I read each paragraph with deep admiration."
        },
        {
          wordId: "batch-young-adjective",
          word: "young",
          partOfSpeech: "adjective",
          enDefinition: "Having lived or existed for only a short time; not old.",
          idMeaning: "muda; di usia belia",
          contextSentence: "When grandfather was young, he traveled extensively."
        },
        {
          wordId: "batch-remember-verb",
          word: "remember",
          partOfSpeech: "verb",
          enDefinition: "To have in or be able to bring to one's mind an awareness of someone or something from the past.",
          idMeaning: "mengingat; mengenang",
          contextSentence: "Always remember the valuable advice of your elders."
        },
        {
          wordId: "batch-dream-noun",
          word: "dream",
          partOfSpeech: "noun",
          enDefinition: "A cherished aspiration, ambition, or ideal.",
          idMeaning: "mimpi; cita-cita luhur",
          contextSentence: "He came to the metropolis with a big dream."
        },
        {
          wordId: "batch-work-verb",
          word: "work",
          partOfSpeech: "verb",
          enDefinition: "To be engaged in physical or mental activity in order to achieve a purpose or result.",
          idMeaning: "bekerja",
          contextSentence: "He used to work long hours at the bakery."
        }
      ],
      grammarFocus: {
        title: "Menceritakan Kebiasaan Masa Lalu dengan 'used to + verb'",
        topicId: "past-simple",
        explanation: "Gunakan 'used to + kata kerja dasar' untuk menyatakan kebiasaan atau rutinitas yang dulu sering dilakukan di masa lalu tetapi sudah tidak dilakukan lagi sekarang: 'He used to wake up at dawn'.",
        formula: "Subject + used to + [Verb Base] / I used to live in a village."
      },
      culturalTip: {
        title: "Membaca Tulisan Tegak Bersambung (Cursive Script)",
        content: "Banyak surat pribadi berbahasa Inggris abad ke-20 ditulis dalam huruf 'cursive' (tegak bersambung). Gaya penulisan ini dianggap formal, personal, dan mencerminkan keanggunan sang penulis."
      },
      quiz: [
        {
          id: "s4_ep2_q1",
          question: "What grammatical structure is used to describe a past habit that no longer happens today?",
          options: [
            "Will be going to",
            "Used to + verb base",
            "Present continuous",
            "Imperative command"
          ],
          correctIndex: 1,
          explanation: "'Used to + verb base' digunakan secara khusus untuk kebiasaan lampau yang kini sudah tidak dilakukan lagi."
        },
        {
          id: "s4_ep2_q2",
          question: "What job did Grandfather do when he first arrived in the city thirty years ago?",
          options: [
            "A baker's apprentice baking bread",
            "An airplane pilot flying jets",
            "A submarine captain",
            "A police officer on a horse"
          ],
          correctIndex: 0,
          explanation: "Kakek bekerja sebagai pemagang pembuat roti (*baker's apprentice*) di toko roti dekat katedral."
        },
        {
          id: "s4_ep2_q3",
          question: "What did Grandfather describe as 'the greatest wealth' in his letter?",
          options: [
            "Gold coins and expensive cars",
            "Skills and kindness",
            "Sleeping all day in a hotel",
            "Buying big mansions"
          ],
          correctIndex: 1,
          explanation: "Kakek menasihati bahwa keterampilan dan kebaikan hati (*skills and kindness*) adalah kekayaan terbesar."
        },
        {
          id: "s4_ep2_q4",
          question: "What does the word 'handwriting' mean?",
          options: [
            "Tulisan tangan pribadi",
            "Gambar komputer cetak",
            "Suara musik di radio",
            "Pintu gerbang besi"
          ],
          correctIndex: 0,
          explanation: "'Handwriting' merujuk pada tulisan yang dibuat langsung dengan tangan menggunakan pena atau pensil."
        },
        {
          id: "s4_ep2_q5",
          question: "Complete the sentence: 'Grandfather used to ______ up before sunrise.'",
          options: [
            "wake",
            "waking",
            "woke",
            "wakes"
          ],
          correctIndex: 0,
          explanation: "Setelah frasa 'used to', kata kerja selalu berbentuk dasar (bare infinitive): 'wake'."
        }
      ],
      summary: {
        takeaways: [
          "Mengekspresikan kebiasaan masa lalu dengan pola: 'used to + verb'.",
          "Mengenal kosakata nostalgia: handwriting, read, young, remember, dream, work.",
          "Memahami nilai hidup ketekunan dan keramahan yang diwariskan kakek."
        ]
      },
      cliffhanger: "Kamu membalik lembar surat kedua. Di sana terdapat sebuah bagan pohon silsilah keluarga kecil yang digambar tangan dengan tinta cokelat, menyebutkan nama-nama yang belum pernah kamu dengar..."
    },

    // EPISODE 3
    {
      id: 3,
      number: 3,
      title: "Silsilah Keluarga yang Hangat",
      titleEn: "The Warm Family Roots",
      estimatedMinutes: 10,
      recap: "Pada lembar surat kedua, kakek menggambar sketsa pohon silsilah keluarga dan menceritakan sanak saudaranya yang penuh kehangatan.",
      dialogue: [
        {
          id: "s4e3_d1",
          speaker: "Grandfather",
          en: "'Our family was not wealthy, but our home was always filled with laughter, songs, and warm soup.'",
          idText: "'Keluarga kita tidak bergelimang harta, tapi rumah kita selalu dipenuhi tawa, nyanyian, dan semangkuk sup hangat.'"
        },
        {
          id: "s4e3_d2",
          speaker: "You",
          en: "Kakek menyebutkan Paman Thomas yang berjiwa petualang dan Bibi Martha yang menjahit selimut keluarga.",
          idText: "Kakek menyebutkan Paman Thomas yang berjiwa petualang dan Bibi Martha yang menjahit selimut keluarga."
        },
        {
          id: "s4e3_choice_1",
          type: "interactive_choice",
          prompt: "Kakek menulis: 'Every holiday, all the cousins gathered together around the long wooden table.' Apa yang kamu rasakan?",
          options: [
            {
              id: "s4e3_opt_1a",
              text: "It feels so heartwarming to imagine our big family gathered together in unity.",
              speakerReply: "Kanci",
              reactionEn: "Family traditions keep people connected across generations and oceans.",
              reactionId: "Tradisi keluarga menjaga hubungan antargenerasi tetap erat melintasi samudra."
            },
            {
              id: "s4e3_opt_1b",
              text: "I want to memorize all my uncles, aunts, and cousins in English properly.",
              speakerReply: "Kanci",
              reactionEn: "A wonderful goal! Mastering family terms helps you share your heritage proudly.",
              reactionId: "Tujuan yang bagus! Menguasai istilah keluarga membantumu menceritakan asal-usulmu."
            }
          ]
        },
        {
          id: "s4e3_d3",
          speaker: "Grandfather",
          en: "'Never forget where you come from, for your roots give you strength to grow tall.'",
          idText: "'Jangan pernah lupakan dari mana kamu berasal, karena akar keluargamu memberimu kekuatan untuk tumbuh tinggi.'"
        },
        {
          id: "s4e3_d4",
          speaker: "Kanci",
          en: "Istilah keluarga: 'uncle' (paman), 'aunt' (bibi), dan 'cousin' (saudara sepupu) sangat penting dikuasai!",
          idText: "Istilah keluarga: 'uncle' (paman), 'aunt' (bibi), dan 'cousin' (saudara sepupu) sangat penting dikuasai!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-family-noun",
          word: "family",
          partOfSpeech: "noun",
          enDefinition: "A group of one or more parents and their children living together as a unit.",
          idMeaning: "keluarga",
          contextSentence: "Family bonds remain strong across miles and years."
        },
        {
          wordId: "batch-uncle-noun",
          word: "uncle",
          partOfSpeech: "noun",
          enDefinition: "The brother of one's father or mother or the husband of one's aunt.",
          idMeaning: "paman; om",
          contextSentence: "My adventurous uncle traveled on merchant ships."
        },
        {
          wordId: "batch-aunt-noun",
          word: "aunt",
          partOfSpeech: "noun",
          enDefinition: "The sister of one's father or mother or the wife of one's uncle.",
          idMeaning: "bibi; tante",
          contextSentence: "Aunt Martha baked apple pies for holiday dinners."
        },
        {
          wordId: "batch-cousin-noun",
          word: "cousin",
          partOfSpeech: "noun",
          enDefinition: "A child of one's uncle or aunt.",
          idMeaning: "sepupu; saudara sepupu",
          contextSentence: "I used to play hide-and-seek with my cousins."
        },
        {
          wordId: "batch-together-adverb",
          word: "together",
          partOfSpeech: "adverb",
          enDefinition: "With or in proximity to another person or people; in combination.",
          idMeaning: "bersama-sama; berkumpul",
          contextSentence: "The whole family sat together around the hearth."
        },
        {
          wordId: "batch-tradition-noun",
          word: "tradition",
          partOfSpeech: "noun",
          enDefinition: "The transmission of customs or beliefs from generation to generation.",
          idMeaning: "tradisi; adat kebiasaan keluarga",
          contextSentence: "Sharing stories after dinner is an old family tradition."
        }
      ],
      grammarFocus: {
        title: "Possessive Nouns & Istilah Hubungan Keluarga ('Uncle's workshop')",
        topicId: "present-simple",
        explanation: "Gunakan tanda apostrof s ('s) untuk menyatakan kepemilikan anggota keluarga: 'my grandfather's letter' (surat kakekku), 'my uncle's workshop' (bengkel pamanku).",
        formula: "[Family Member] + 's + [Noun] / My aunt's house."
      },
      culturalTip: {
        title: "Pohon Silsilah Keluarga (Family Tree)",
        content: "Di budaya Barat, menggambar dan menelusuri 'Family Tree' (pohon silsilah) hingga buyut (*great-grandparents*) adalah kegiatan yang sangat populer di sekolah dan perkumpulan keluarga untuk menumbuhkan rasa bangga akan asal-usul."
      },
      quiz: [
        {
          id: "s4_ep3_q1",
          question: "What is the English word for the brother of your father or mother?",
          options: [
            "Sister",
            "Uncle",
            "Nephew",
            "Daughter"
          ],
          correctIndex: 1,
          explanation: "Saudara laki-laki dari ayah atau ibu disebut 'Uncle' (paman)."
        },
        {
          id: "s4_ep3_q2",
          question: "What do you call the child of your aunt or uncle?",
          options: [
            "Grandmother",
            "Cousin",
            "Brother-in-law",
            "Neighbor"
          ],
          correctIndex: 1,
          explanation: "Anak dari paman atau bibi adalah saudara sepupu ('Cousin')."
        },
        {
          id: "s4_ep3_q3",
          question: "Which of the following correctly uses the possessive apostrophe for family belonging?",
          options: [
            "My grandfathers letter was yellowed.",
            "My grandfather's letter was yellowed.",
            "My grandfather is letter was yellowed.",
            "My grandfather letter was yellowed."
          ],
          correctIndex: 1,
          explanation: "Bentuk kepemilikan tunggal menggunakan tanda apostrof s ('s): 'My grandfather's letter'."
        },
        {
          id: "s4_ep3_q4",
          question: "What does the word 'tradition' mean?",
          options: [
            "Kebiasaan atau adat yang diwariskan turun-temurun",
            "Tiket pesawat terbang",
            "Pintu darurat gedung",
            "Cuaca dingin di pagi hari"
          ],
          correctIndex: 0,
          explanation: "'Tradition' berarti adat kebiasaan atau nilai yang diteruskan dari generasi ke generasi."
        },
        {
          id: "s4_ep3_q5",
          question: "Complete the sentence: 'During the holidays, we always gathered ______.'",
          options: [
            "together",
            "togethering",
            "togethered",
            "togethers"
          ],
          correctIndex: 0,
          explanation: "Adverb yang berarti 'bersama-sama' adalah 'together'."
        }
      ],
      summary: {
        takeaways: [
          "Menguasai kosakata silsilah keluarga: family, uncle, aunt, cousin, tradition.",
          "Menerapkan possessive apostrophe: 'My uncle's workshop'.",
          "Memahami nilai kebersamaan dan tradisi keluarga (togetherness)."
        ]
      },
      cliffhanger: "Pada lembaran surat berikutnya, kakek mulai membandingkan suasana kota tempo dulu dengan masa kini: 'Dulu tidak ada mobil bising atau layar kaca bersinar di saku celana...'"
    },

    // EPISODE 4
    {
      id: 4,
      number: 4,
      title: "Kenangan Kota yang Berbeda",
      titleEn: "Memories of a Different City",
      estimatedMinutes: 10,
      recap: "Kakek mendeskripsikan betapa berbedanya lanskap kota ini tiga puluh tahun yang lalu dibanding gedung-gedung kaca metropolitan saat ini.",
      dialogue: [
        {
          id: "s4e4_d1",
          speaker: "Grandfather",
          en: "'In my days, there used to be cobbled stone lanes and gas lanterns that flickered at dusk.'",
          idText: "'Di zaman kakek dulu, jalanan berupa batu-batu kali berbatu dan lentera gas yang berkedip di senja hari.'"
        },
        {
          id: "s4e4_d2",
          speaker: "You",
          en: "Kakek menceritakan bahwa di tempat Grand Heritage Hotel berdiri, dulu adalah taman bunga mawar yang sunyi.",
          idText: "Kakek menceritakan bahwa di tempat Grand Heritage Hotel berdiri, dulu adalah taman bunga mawar yang sunyi."
        },
        {
          id: "s4e4_choice_1",
          type: "interactive_choice",
          prompt: "Kakek menulis: 'Cities change, but the historic soul remains in small alleys.' Bagaimana pendapatmu?",
          options: [
            {
              id: "s4e4_opt_1a",
              text: "I love modern convenience, but historic alleys have so much character and soul.",
              speakerReply: "Kanci",
              reactionEn: "That is the magic of old cities: modern technology blending with antique charm.",
              reactionId: "Itulah keajaiban kota tua: teknologi modern berpadu dengan pesona antik."
            },
            {
              id: "s4e4_opt_1b",
              text: "It is fascinating to compare how people used to live without smartphones.",
              speakerReply: "Kanci",
              reactionEn: "People used to talk face-to-face much more and write beautiful paper letters!",
              reactionId: "Dulu orang-orang lebih banyak mengobrol tatap muka dan menulis surat indah!"
            }
          ]
        },
        {
          id: "s4e4_d3",
          speaker: "Grandfather",
          en: "'Look closely at the alleyways behind the modern high-rises. That is where time stands still.'",
          idText: "'Perhatikan baik-baik gang-gang kecil di balik gedung bertingkat modern. Di sanalah waktu seolah berhenti berputar.'"
        },
        {
          id: "s4e4_d4",
          speaker: "Kanci",
          en: "Membandingkan masa lalu ('used to be') dan masa kini ('now there is') melatih kemampuan kontras Bahasa Inggrismu!",
          idText: "Membandingkan masa lalu ('used to be') dan masa kini ('now there is') melatih kemampuan kontras Bahasa Inggrismu!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-past-noun",
          word: "past",
          partOfSpeech: "noun",
          enDefinition: "The time or a period of time before the moment of speaking or writing.",
          idMeaning: "masa lalu; masa lampau",
          contextSentence: "The past holds fascinating lessons for our present."
        },
        {
          wordId: "batch-present-noun",
          word: "present",
          partOfSpeech: "noun",
          enDefinition: "The period of time now occurring.",
          idMeaning: "masa kini; masa sekarang",
          contextSentence: "We live in the modern present, but cherish our heritage."
        },
        {
          wordId: "batch-change-verb",
          word: "change",
          partOfSpeech: "verb",
          enDefinition: "To make or become different.",
          idMeaning: "berubah; mengubah",
          contextSentence: "City skylines change dramatically over thirty years."
        },
        {
          wordId: "batch-city-noun",
          word: "city",
          partOfSpeech: "noun",
          enDefinition: "A large town.",
          idMeaning: "kota; kota besar",
          contextSentence: "This city preserved its cobblestone historic district."
        },
        {
          wordId: "batch-lantern-noun",
          word: "lantern",
          partOfSpeech: "noun",
          enDefinition: "A lamp with a transparent case protecting the flame or electric bulb, and typically having a handle.",
          idMeaning: "lentera; lampu minyak/gas kuno",
          contextSentence: "Antique brass lanterns lit the cobblestone street."
        },
        {
          wordId: "batch-modern-adjective",
          word: "modern",
          partOfSpeech: "adjective",
          enDefinition: "Relating to the present or recent times as opposed to the remote past.",
          idMeaning: "modern; mutakhir",
          contextSentence: "Modern skyscrapers stand side by side with vintage chapels."
        }
      ],
      grammarFocus: {
        title: "Membandingkan Masa Lalu & Masa Kini ('There used to be... but now...')",
        topicId: "past-simple",
        explanation: "Gunakan formula kontras: 'There used to be + [Past Noun], but now there is/are + [Present Noun]' untuk membandingkan perubahan zaman secara elegan.",
        formula: "There used to be [Plural Noun], but now there are [Modern Noun]."
      },
      culturalTip: {
        title: "Pelestarian Cagar Budaya Kota (Heritage Preservation)",
        content: "Banyak kota di Eropa dan Asia melindungi kawasan kota tua (*old quarter*) dengan peraturan ketat: fasad bangunan kuno tidak boleh diubah atau diganti dinding kaca modern agar warisan sejarahnya tetap lestari."
      },
      quiz: [
        {
          id: "s4_ep4_q1",
          question: "How did Grandfather describe the street lighting in his youth thirty years ago?",
          options: [
            "Solar LED laser lights",
            "Gas lanterns that flickered at dusk",
            "Complete darkness without any lamps",
            "Car headlights only"
          ],
          correctIndex: 1,
          explanation: "Kakek mendeskripsikan penerangan jalan masa mudanya menggunakan lentera gas yang berkedip di senja hari (*gas lanterns*)."
        },
        {
          id: "s4_ep4_q2",
          question: "Which sentence correctly contrasts the past with the present?",
          options: [
            "There will be cars yesterday.",
            "There used to be quiet lanes, but now there are busy highways.",
            "There is quiet lanes tomorrow.",
            "There were no sky thirty years ago."
          ],
          correctIndex: 1,
          explanation: "'There used to be quiet lanes, but now there are busy highways' membandingkan masa lalu dan masa kini dengan tata bahasa yang benar."
        },
        {
          id: "s4_ep4_q3",
          question: "What is the antonym of 'past'?",
          options: [
            "Ancient",
            "Present",
            "Yesterday",
            "Before"
          ],
          correctIndex: 1,
          explanation: "Lawan kata dari 'past' (masa lalu) adalah 'present' (masa kini) atau 'future' (masa depan)."
        },
        {
          id: "s4_ep4_q4",
          question: "What is a 'lantern'?",
          options: [
            "Lampu atau lentera berpelindung kaca",
            "Koper pakaian beroda",
            "Kunci kuningan berukir",
            "Sepatu bot kulit"
          ],
          correctIndex: 0,
          explanation: "'Lantern' adalah lentera atau lampu dengan wadah pelindung transparan."
        },
        {
          id: "s4_ep4_q5",
          question: "Complete the sentence: 'The old city ______ dramatically over the last few decades.'",
          options: [
            "changed",
            "changing",
            "changes will",
            "change"
          ],
          correctIndex: 0,
          explanation: "Perubahan yang sudah terjadi di masa lampau menggunakan bentuk Past Simple: 'changed'."
        }
      ],
      summary: {
        takeaways: [
          "Membandingkan kondisi masa lalu dan masa kini: 'There used to be... but now...'",
          "Menguasai kosakata transformasi zaman: past, present, change, city, lantern, modern.",
          "Menghargai cagar budaya sejarah di tengah pembangunan kota metropolitan."
        ]
      },
      cliffhanger: "Tiba di lembar surat keempat, nada tulisan kakek berubah menjadi sangat serius dan penuh rahasia: 'Dan sekarang, cucuku, kakek ingin menceritakan tentang sahabat terbaik kakek dan arloji perak yang berharga...'"
    },

    // EPISODE 5
    {
      id: 5,
      number: 5,
      title: "Arloji Saku yang Dititipkan",
      titleEn: "The Entrusted Pocket Watch",
      estimatedMinutes: 10,
      recap: "Kakek menceritakan kisah sebuah jam saku perak antik pemberian buyutmu, yang pernah kakek titipkan untuk diperbaiki kepada sahabat karibnya sebelum pulang ke tanah air.",
      dialogue: [
        {
          id: "s4e5_d1",
          speaker: "Grandfather",
          en: "'Before I returned home, I entrusted my father's silver pocket watch to my dearest friend, Arthur Barnaby.'",
          idText: "'Sebelum kakek pulang ke kampung halaman, kakek menitipkan jam saku perak milik ayah kakek kepada sahabat tersayang kakek, Arthur Barnaby.'"
        },
        {
          id: "s4e5_d2",
          speaker: "You",
          en: "Kakek menulis bahwa jam saku itu sempat terjatuh dan pegasnya macet. Pak Barnaby berjanji akan memperbaikinya dengan tangannya sendiri.",
          idText: "Kakek menulis bahwa jam saku itu sempat terjatuh dan pegasnya macet. Pak Barnaby berjanji akan memperbaikinya dengan tangannya sendiri."
        },
        {
          id: "s4e5_choice_1",
          type: "interactive_choice",
          prompt: "Kakek menulis: 'Barnaby promised to keep the watch safely in his workshop until one of my family comes to claim it.' Apa tekadmu?",
          options: [
            {
              id: "s4e5_opt_1a",
              text: "I must find Mr. Barnaby's clock workshop tomorrow and see if the heirloom is still there!",
              speakerReply: "Kanci",
              reactionEn: "A noble mission! Thirty years have passed, but true craftsmen keep their promises.",
              reactionId: "Misi yang mulia! Tiga puluh tahun telah berlalu, tapi perajin sejati selalu memegang janji."
            },
            {
              id: "s4e5_opt_1b",
              text: "I should check whether the old clock shop still exists in the city directory first.",
              speakerReply: "Kanci",
              reactionEn: "Very practical. We can ask William at the hotel reception desk downstairs!",
              reactionId: "Sangat praktis. Kita bisa bertanya pada William di meja resepsionis bawah!"
            }
          ]
        },
        {
          id: "s4e5_d3",
          speaker: "Grandfather",
          en: "'The watch has a small engraved swallow bird on the inside cover. It symbolizes coming home safely.'",
          idText: "'Jam saku itu memiliki ukiran burung walet kecil di bagian dalam penutupnya. Itu melambangkan kepulangan yang selamat.'"
        },
        {
          id: "s4e5_d4",
          speaker: "Kanci",
          en: "Ukiran burung walet (*swallow bird*) adalah tanda pengenal kuncinya! Ingat ciri-ciri itu baik-baik!",
          idText: "Ukiran burung walet (*swallow bird*) adalah tanda pengenal kuncinya! Ingat ciri-ciri itu baik-baik!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-watch-noun",
          word: "watch",
          partOfSpeech: "noun",
          enDefinition: "A small timepiece worn typically on a strap on one's wrist or carried in a pocket.",
          idMeaning: "arloji; jam saku",
          contextSentence: "The silver pocket watch was a family heirloom."
        },
        {
          wordId: "batch-pocket-noun",
          word: "pocket",
          partOfSpeech: "noun",
          enDefinition: "A small pouch sewn into clothing, often used to carry a pocket watch.",
          idMeaning: "saku rompi/baju",
          contextSentence: "He slipped the timepiece into his waistcoat pocket."
        },
        {
          wordId: "batch-silver-noun",
          word: "silver",
          partOfSpeech: "noun",
          enDefinition: "A precious shiny, greyish-white metallic element.",
          idMeaning: "perak",
          contextSentence: "The watch case was polished silver."
        },
        {
          wordId: "batch-friend-noun",
          word: "friend",
          partOfSpeech: "noun",
          enDefinition: "A person whom one knows and with whom one has a bond of mutual affection.",
          idMeaning: "sahabat karib; kawan sejati",
          contextSentence: "Arthur Barnaby was grandfather's most trusted friend."
        },
        {
          wordId: "batch-repair-verb",
          word: "repair",
          partOfSpeech: "verb",
          enDefinition: "To fix or mend a thing suffering from damage or a fault.",
          idMeaning: "memperbaiki; mereparasi",
          contextSentence: "The master watchmaker agreed to repair the delicate spring."
        },
        {
          wordId: "batch-trust-verb",
          word: "trust",
          partOfSpeech: "verb",
          enDefinition: "To believe in the reliability, truth, ability, or strength of someone.",
          idMeaning: "memercayai; menitipkan dengan percaya",
          contextSentence: "You can always trust a person of honor."
        }
      ],
      grammarFocus: {
        title: "Penggabungan Past Continuous & Past Simple dengan 'When'",
        topicId: "past-continuous",
        explanation: "Gunakan klausa waktu 'When + Past Continuous' dipadukan dengan Past Simple untuk menyatakan peristiwa yang terjadi di tengah aksi lain yang sedang berlangsung: 'When he was leaving the city, he entrusted the watch'.",
        formula: "When Subject + was/were + [Verb-ing], Subject + [Past Simple V2]."
      },
      culturalTip: {
        title: "Tradisi Jam Saku Sebagai Pusaka Keluarga (Heirloom)",
        content: "Di masa lampau, jam saku perak (*pocket watch*) adalah lambang kedewasaan yang diwariskan dari ayah ke anak laki-laki saat mereka mulai bekerja atau merantau mandiri."
      },
      quiz: [
        {
          id: "s4_ep5_q1",
          question: "Who was Grandfather's trusted friend who agreed to repair the pocket watch?",
          options: [
            "William the receptionist",
            "Arthur Barnaby the clockmaker",
            "Leo the student photographer",
            "Dave the airport security guard"
          ],
          correctIndex: 1,
          explanation: "Sahabat kakek yang diserahi tugas memperbaiki jam saku adalah Arthur Barnaby sang perajin jam."
        },
        {
          id: "s4_ep5_q2",
          question: "What animal engraving is etched on the inside cover of the pocket watch?",
          options: [
            "A roaring lion",
            "A small swallow bird",
            "A golden fish",
            "A flying dragon"
          ],
          correctIndex: 1,
          explanation: "Ukiran penanda khusus di bagian dalam penutup arloji adalah burung walet (*swallow bird*)."
        },
        {
          id: "s4_ep5_q3",
          question: "What does the swallow engraving symbolize in the story?",
          options: [
            "Coming home safely",
            "Flying fast in the storm",
            "Hunting insects",
            "Eating breadcrumbs"
          ],
          correctIndex: 0,
          explanation: "Ukiran burung walet tersebut melambangkan kepulangan yang selamat (*coming home safely*)."
        },
        {
          id: "s4_ep5_q4",
          question: "Which English verb means to fix or mend something that is broken?",
          options: [
            "Break",
            "Repair",
            "Forget",
            "Delay"
          ],
          correctIndex: 1,
          explanation: "'Repair' berarti memperbaiki atau mereparasi benda yang rusak."
        },
        {
          id: "s4_ep5_q5",
          question: "Complete the sentence: 'Grandfather ______ his best friend with his father's silver watch.'",
          options: [
            "trusted",
            "trusting",
            "trusts",
            "trust"
          ],
          correctIndex: 0,
          explanation: "Tindakan mempercayai di masa lampau menggunakan bentuk Past Simple: 'trusted'."
        }
      ],
      summary: {
        takeaways: [
          "Mengenal kisah pusaka jam saku keluarga (silver pocket watch).",
          "Memahami simbol ukiran burung walet sebagai lambang kepulangan yang selamat.",
          "Menguasai kosakata pusaka: watch, pocket, silver, friend, repair, trust."
        ]
      },
      cliffhanger: "Di bagian paling bawah surat, kakek mencantumkan alamat bengkel Pak Barnaby tiga puluh tahun lalu: 'Barnaby's Clockwork - Number 14, Clockmaker's Lane, Old Town District'. Apakah toko itu masih ada hingga hari ini?"
    },

    // EPISODE 6
    {
      id: 6,
      number: 6,
      title: "Mencari Alamat Bengkel Tua",
      titleEn: "Searching for the Old Workshop",
      estimatedMinutes: 10,
      recap: "Keesokan paginya, kamu turun ke lobi hotel untuk sarapan dan menanyakan keberadaan alamat 'Clockmaker's Lane' kepada resepsionis William.",
      dialogue: [
        {
          id: "s4e6_d1",
          speaker: "You",
          en: "Good morning, William. Could you tell me if 'Clockmaker's Lane' still exists in the city?",
          idText: "Selamat pagi, William. Bisakah Anda memberi tahu saya apakah 'Clockmaker's Lane' masih ada di kota ini?"
        },
        {
          id: "s4e6_d2",
          speaker: "Receptionist",
          en: "Good morning! Why yes, of course! Clockmaker's Lane is a charming pedestrian alley just behind St. Jude's Cathedral.",
          idText: "Selamat pagi! Tentu saja ada! Clockmaker's Lane adalah gang pejalan kaki yang indah tepat di belakang Katedral St. Jude."
        },
        {
          id: "s4e6_choice_1",
          type: "interactive_choice",
          prompt: "William membuka peta wisata kota tua dan melingkari sebuah titik merah. Bagaimana responmu?",
          options: [
            {
              id: "s4e6_opt_1a",
              text: "Is there still an antique watch repair shop at Number 14?",
              speakerReply: "Receptionist",
              reactionEn: "Yes! Old Mr. Barnaby still opens his shop every morning. He is a living legend!",
              reactionId: "Ya! Pak Barnaby tua masih membuka bengkelnya tiap pagi. Beliau adalah legenda hidup!"
            },
            {
              id: "s4e6_opt_1b",
              text: "How do I get there on foot from the hotel front door?",
              speakerReply: "Receptionist",
              reactionEn: "Turn right past the fountain, walk through the botanical park, and cross the stone bridge.",
              reactionId: "Belok kanan lewati air mancur, jalan menembus taman botani, dan seberangi jembatan batu."
            }
          ]
        },
        {
          id: "s4e6_d3",
          speaker: "You",
          en: "Mr. Barnaby is still there! That is incredible news! Thank you so much, William!",
          idText: "Pak Barnaby masih ada di sana! Itu berita yang luar biasa! Terima kasih banyak, William!"
        },
        {
          id: "s4e6_d4",
          speaker: "Kanci",
          en: "Luar biasa! Takdir mempertemukan kita! Segera siapkan surat kakek dan mari kita melangkah ke Clockmaker's Lane!",
          idText: "Luar biasa! Takdir mempertemukan kita! Segera siapkan surat kakek dan mari kita melangkah ke Clockmaker's Lane!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-address-noun",
          word: "address",
          partOfSpeech: "noun",
          enDefinition: "The particulars of the place where someone lives or an organization is situated.",
          idMeaning: "alamat tempat",
          contextSentence: "The historic address is printed on the old postcard."
        },
        {
          wordId: "batch-lane-noun",
          word: "lane",
          partOfSpeech: "noun",
          enDefinition: "A narrow road, especially in a rural area or in a historic city quarter.",
          idMeaning: "gang sempit; jalan kecil",
          contextSentence: "Clockmaker's Lane is paved with smooth cobblestones."
        },
        {
          wordId: "batch-clock-noun",
          word: "clock",
          partOfSpeech: "noun",
          enDefinition: "A mechanical or electrical device for measuring time, not worn on the person.",
          idMeaning: "jam dinding; lonceng jam",
          contextSentence: "Grandfather clocks tick rhythmically in the hallway."
        },
        {
          wordId: "batch-maker-noun",
          word: "maker",
          partOfSpeech: "noun",
          enDefinition: "A person or thing that makes or produces something.",
          idMeaning: "pembuat; perajin",
          contextSentence: "The master clockmaker inherited his father's craft."
        },
        {
          wordId: "batch-direction-noun",
          word: "direction",
          partOfSpeech: "noun",
          enDefinition: "A course along which someone or something moves.",
          idMeaning: "petunjuk arah; jalan menuju",
          contextSentence: "William provided clear walking directions on the map."
        },
        {
          wordId: "batch-search-verb",
          word: "search",
          partOfSpeech: "verb",
          enDefinition: "To try to find something by looking or otherwise seeking carefully and thoroughly.",
          idMeaning: "mencari; menelusuri",
          contextSentence: "We search for the hidden workshop in the old town."
        }
      ],
      grammarFocus: {
        title: "Menanyakan Keberadaan Tempat Bersejarah ('Does ... still exist?')",
        topicId: "present-simple",
        explanation: "Gunakan 'Does [Place] still exist?' atau 'Is [Person] still there?' untuk menanyakan apakah sebuah toko tua atau orang masa lampau masih aktif ada di lokasi tersebut.",
        formula: "Could you tell me if [Place] still exists? / Is the shop still there?"
      },
      culturalTip: {
        title: "Istilah Jalan di Kota-Kota Bersejarah (Lane, Alley, Court)",
        content: "Di kota-kota tua Inggris, nama jalan sering kali memiliki makna historis: 'Lane' adalah jalan kecil berliku, 'Alley' adalah gang sempit antar-gedung, dan 'Court' adalah pelataran buntu."
      },
      quiz: [
        {
          id: "s4_ep6_q1",
          question: "How do you politely inquire whether an old historic location still exists?",
          options: [
            "Why did you destroy this place?",
            "Could you tell me if Clockmaker's Lane still exists in the city?",
            "I want to tear down your cathedral.",
            "Tell me jokes right now."
          ],
          correctIndex: 1,
          explanation: "'Could you tell me if [Location] still exists in the city?' adalah ungkapan santun untuk menanyakan keberadaan tempat tua."
        },
        {
          id: "s4_ep6_q2",
          question: "Where is Clockmaker's Lane located according to William?",
          options: [
            "Inside the international airport runway",
            "Just behind St. Jude's Cathedral",
            "At the bottom of the ocean",
            "Across the interstate highway"
          ],
          correctIndex: 1,
          explanation: "William menjelaskan bahwa Clockmaker's Lane berada tepat di belakang Katedral St. Jude."
        },
        {
          id: "s4_ep6_q3",
          question: "Is Mr. Barnaby's workshop still operating today?",
          options: [
            "No, it became a car dealership twenty years ago",
            "Yes, old Mr. Barnaby still opens his shop every morning",
            "No, it was closed yesterday forever",
            "The shop was never built"
          ],
          correctIndex: 1,
          explanation: "William mengonfirmasi dengan antusias bahwa Pak Barnaby masih membuka bengkelnya setiap pagi."
        },
        {
          id: "s4_ep6_q4",
          question: "What does the English word 'lane' mean?",
          options: [
            "Gang sempit atau jalan kecil berliku",
            "Piring kaca makan malam",
            "Koper pakaian beroda",
            "Sayap pesawat terbang"
          ],
          correctIndex: 0,
          explanation: "'Lane' adalah jalan kecil atau gang sempit yang khas pada tata kota bersejarah."
        },
        {
          id: "s4_ep6_q5",
          question: "Complete the sentence: 'We will ______ for the clock shop behind the cathedral.'",
          options: [
            "search",
            "searched",
            "searching",
            "searches"
          ],
          correctIndex: 0,
          explanation: "Setelah modal auxiliary 'will', kata kerja selalu menggunakan bentuk dasar (bare infinitive): 'search'."
        }
      ],
      summary: {
        takeaways: [
          "Menanyakan keberadaan lokasi bersejarah: 'Does ... still exist?'",
          "Mengenali toponimi jalanan kota tua: lane, alley, court, cathedral.",
          "Mendapatkan kepastian bahwa sahabat kakek masih hidup dan aktif berkarya."
        ]
      },
      cliffhanger: "Berbekal peta kota bertanda lingkaran merah dan surat kakek di dalam saku jaket, kamu melangkah menyusuri gang berbatu Clockmaker's Lane. Di depan bangunan nomor 14, sebuah plang kayu berukir roda gigi jam menyambutmu!"
    },

    // EPISODE 7
    {
      id: 7,
      number: 7,
      title: "Bengkel Arloji di Gang Sunyi",
      titleEn: "The Watchmaker's Workshop in the Alley",
      estimatedMinutes: 10,
      recap: "Kamu tiba di depan bangunan nomor 14 Clockmaker's Lane. Pintu kaca patri hijau berderit lembut saat kamu mendorongnya perlahan.",
      dialogue: [
        {
          id: "s4e7_d1",
          speaker: "Narator",
          en: "As you step inside, a symphony of gentle ticking sounds fills the quiet, sun-dappled workshop.",
          idText: "Saat kamu melangkah masuk, simfoni detak jam yang lembut memenuhi bengkel hening bermandikan berkas sinar matahari itu."
        },
        {
          id: "s4e7_d2",
          speaker: "You",
          en: "Listen to that, Kanci! Hundreds of grandfather clocks, cuckoo clocks, and pocket watches are all ticking in harmony!",
          idText: "Dengarkan itu, Kanci! Ratusan jam dinding besar, jam kukuk, dan arloji saku berdetik dalam harmoni yang teratur!"
        },
        {
          id: "s4e7_choice_1",
          type: "interactive_choice",
          prompt: "Seorang pria tua berambut putih dengan kaca pembesar melingkar di matanya menoleh dari meja kerjanya. Bagaimana kamu menyapanya?",
          options: [
            {
              id: "s4e7_opt_1a",
              text: "Good morning, Sir. Are you Mr. Arthur Barnaby, the master watchmaker?",
              speakerReply: "Barnaby",
              reactionEn: "Good morning! Yes, I am Arthur Barnaby. Welcome to my humble workshop.",
              reactionId: "Selamat pagi! Ya, saya Arthur Barnaby. Selamat datang di bengkel sederhana saya."
            },
            {
              id: "s4e7_opt_1b",
              text: "Hello! What a magical and peaceful shop you have here with all these clocks.",
              speakerReply: "Barnaby",
              reactionEn: "Thank you kindly, young visitor! Time is my life's passion. How may I help you?",
              reactionId: "Terima kasih banyak, pengunjung muda! Waktu adalah gairah hidup saya. Ada yang bisa saya bantu?"
            }
          ]
        },
        {
          id: "s4e7_d3",
          speaker: "Barnaby",
          en: "I was just calibrating the balance wheel on a vintage pendulum clock. Do you have a timepiece to repair?",
          idText: "Saya baru saja mengkalibrasi roda penyeimbang pada jam pendulum antik. Apakah Anda membawa jam untuk diperbaiki?"
        },
        {
          id: "s4e7_d4",
          speaker: "Kanci",
          en: "Suasananya sangat magis dan menenangkan! Katakan padanya bahwa kamu datang membawa surat dari kakekmu!",
          idText: "Suasananya sangat magis dan menenangkan! Katakan padanya bahwa kamu datang membawa surat dari kakekmu!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-shop-noun",
          word: "shop",
          partOfSpeech: "noun",
          enDefinition: "A building or part of a building where goods or services are sold; a workshop.",
          idMeaning: "toko; bengkel kerja",
          contextSentence: "The watchmaker's shop has served three generations of townspeople."
        },
        {
          wordId: "batch-sound-noun",
          word: "sound",
          partOfSpeech: "noun",
          enDefinition: "Vibrations traveling through the air or another medium, especially those within the range of human hearing.",
          idMeaning: "suara; bunyi",
          contextSentence: "The rhythmic ticking sound was surprisingly soothing."
        },
        {
          wordId: "batch-gear-noun",
          word: "gear",
          partOfSpeech: "noun",
          enDefinition: "A toothed wheel that engages with another toothed mechanism to change the speed or direction of motion.",
          idMeaning: "roda gigi mekanik",
          contextSentence: "Tiny golden gears mesh together inside the watch mechanism."
        },
        {
          wordId: "batch-tick-verb",
          word: "tick",
          partOfSpeech: "verb",
          enDefinition: "To make a regular short sharp sound, especially as made by a clock or watch.",
          idMeaning: "berdetik; berbunyi tik-tok",
          contextSentence: "Dozens of antique clocks tick softly on the walls."
        },
        {
          wordId: "batch-open-verb",
          word: "open",
          partOfSpeech: "verb",
          enDefinition: "To move so as to leave an opening; to conduct business.",
          idMeaning: "buka; membuka",
          contextSentence: "He opens his workshop punctually at eight every morning."
        },
        {
          wordId: "batch-enter-verb",
          word: "enter",
          partOfSpeech: "verb",
          enDefinition: "To come or go into a place.",
          idMeaning: "masuk; melangkah ke dalam",
          contextSentence: "Customers enter the quiet workshop with a sense of wonder."
        }
      ],
      grammarFocus: {
        title: "Sensory Verbs & Sounds ('The clocks were ticking softly')",
        topicId: "past-continuous",
        explanation: "Gunakan kata kerja indrawi pendengaran (auditory sensory verbs) seperti 'tick', 'sound', 'hum' dalam Past Continuous untuk mendeskripsikan atmosfer ruangan: 'The clocks were ticking in harmony'.",
        formula: "Subject + was/were + [Sensory Verb-ing] + [Adverb]."
      },
      culturalTip: {
        title: "Menghormati Ruang Kerja Perajin Tradisional (Master Craftsmen)",
        content: "Di bengkel perajin arloji atau biola tradisional, keheningan sangat dijaga agar perajin dapat mendengarkan detak ritme pegas mikroskopis. Masuklah dengan langkah pelan dan nada suara yang santun."
      },
      quiz: [
        {
          id: "s4_ep7_q1",
          question: "What sound filled Mr. Barnaby's workshop when you stepped inside?",
          options: [
            "Loud rock music and drums",
            "A gentle symphony of hundreds of clocks ticking in harmony",
            "Cars honking continuously",
            "Complete silence without any sound"
          ],
          correctIndex: 1,
          explanation: "Ruangan dipenuhi suara lembut ratusan jam yang berdetik serempak dalam harmoni (*clocks ticking in harmony*)."
        },
        {
          id: "s4_ep7_q2",
          question: "What small toothed mechanical parts are found inside a mechanical clock?",
          options: [
            "Plastic spoons",
            "Gears",
            "Rubber tires",
            "Paper cups"
          ],
          correctIndex: 1,
          explanation: "Komponen mekanis bergerigi penggerak jam adalah roda gigi ('gears')."
        },
        {
          id: "s4_ep7_q3",
          question: "What is the meaning of the verb 'tick' when describing a clock?",
          options: [
            "Meledak menjadi serpihan",
            "Berdetik atau mengeluarkan bunyi ritmis jarum jam",
            "Mencair karena panas",
            "Terbang keluar jendela"
          ],
          correctIndex: 1,
          explanation: "'Tick' adalah kata kerja onomatope untuk bunyi detak jarum jam."
        },
        {
          id: "s4_ep7_q4",
          question: "How did Mr. Barnaby greet you at his workbench?",
          options: [
            "He shouted angrily and threw a wrench",
            "He welcomed you politely and asked how he could assist you",
            "He pretended to be asleep",
            "He told you to leave immediately"
          ],
          correctIndex: 1,
          explanation: "Pak Barnaby menyapa dengan ramah dan menanyakan bagaimana beliau bisa membantu."
        },
        {
          id: "s4_ep7_q5",
          question: "Complete the sentence: 'The grandfather clocks were ______ rhythmically on the wall.'",
          options: [
            "tick",
            "ticking",
            "ticked",
            "ticks"
          ],
          correctIndex: 1,
          explanation: "Past Continuous setelah auxiliary 'were' menggunakan bentuk verb-ing: 'ticking'."
        }
      ],
      summary: {
        takeaways: [
          "Mendeskripsikan atmosfer suara ruangan: 'The clocks were ticking softly.'",
          "Mengenal kosakata bengkel mekanik arloji: shop, sound, gear, tick, open, enter.",
          "Menghormati kesantunan memasuki ruang kerja perajin tradisional."
        ]
      },
      cliffhanger: "Kamu menarik napas dalam-dalam, lalu merogoh saku jaketmu. Kamu mengeluarkan amplop surat kuning berstempel tahun 1994 dan meletakkannya dengan takzim di atas meja kerja kayu Pak Barnaby..."
    },

    // EPISODE 8
    {
      id: 8,
      number: 8,
      title: "Pertemuan Dua Generasi",
      titleEn: "A Meeting of Two Generations",
      estimatedMinutes: 10,
      recap: "Kamu menyerahkan surat kakek kepada Pak Barnaby. Pria tua itu melepaskan kacamata pembesarnya dan menatap amplop itu dengan mata berkaca-kaca.",
      dialogue: [
        {
          id: "s4e8_d1",
          speaker: "Barnaby",
          en: "Mercy on me... That handwriting... That is Johannes' handwriting! Are you his grandchild?",
          idText: "Ya Tuhan... Tulisan tangan itu... Itu tulisan tangan Johannes! Apakah kamu cucunya?"
        },
        {
          id: "s4e8_d2",
          speaker: "You",
          en: "Yes, Sir. I am Johannes' grandchild. I found his letter at the Grand Heritage Hotel last night.",
          idText: "Benar, Pak. Saya cucu Johannes. Saya menemukan surat beliau di Grand Heritage Hotel tadi malam."
        },
        {
          id: "s4e8_choice_1",
          type: "interactive_choice",
          prompt: "Pak Barnaby mengusap air mata haru di sudut matanya dan tersenyum lebar. Bagaimana kamu meresponnya?",
          options: [
            {
              id: "s4e8_opt_1a",
              text: "He wrote so warmly about you and your lifelong friendship in his letter.",
              speakerReply: "Barnaby",
              reactionEn: "Johannes was the brother I never had. We shared our youth, dreams, and hardships together.",
              reactionId: "Johannes adalah saudara yang tak pernah kumiliki. Kami berbagi masa muda, mimpi, dan suka duka bersama."
            },
            {
              id: "s4e8_opt_1b",
              text: "He mentioned a silver pocket watch that he entrusted to you thirty years ago.",
              speakerReply: "Barnaby",
              reactionEn: "The swallow pocket watch! I have kept it wound, polished, and safe all these thirty years!",
              reactionId: "Jam saku burung walet itu! Sudah kujaga, kukalibrasi, dan kusimpan aman selama tiga puluh tahun ini!"
            }
          ]
        },
        {
          id: "s4e8_d3",
          speaker: "Barnaby",
          en: "I always believed in my heart that one day, his family would walk through that green glass door.",
          idText: "Kakek selalu yakin dalam hati bahwa suatu hari nanti, keluarganya akan melangkah melewati pintu kaca hijau itu."
        },
        {
          id: "s4e8_d4",
          speaker: "Kanci",
          en: "Momen yang luar biasa mengharukan! Janji persahabatan sejati tetap abadi melintasi waktu tiga dekade!",
          idText: "Momen yang luar biasa mengharukan! Janji persahabatan sejati tetap abadi melintasi waktu tiga dekade!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-meet-verb",
          word: "meet",
          partOfSpeech: "verb",
          enDefinition: "To come into the presence of or contact with someone.",
          idMeaning: "bertemu; berjumpa",
          contextSentence: "It is an emotional moment to meet a lifelong friend of grandfather."
        },
        {
          wordId: "batch-old-adjective",
          word: "old",
          partOfSpeech: "adjective",
          enDefinition: "Having lived for a long time; no longer young.",
          idMeaning: "tua; berusia lanjut",
          contextSentence: "The old watchmaker spoke with gentle warmth."
        },
        {
          wordId: "batch-remember-verb",
          word: "remember",
          partOfSpeech: "verb",
          enDefinition: "To recall to the mind with emotion.",
          idMeaning: "mengingat; mengenang",
          contextSentence: "He remembered Johannes as if they had spoken yesterday."
        },
        {
          wordId: "batch-friendship-noun",
          word: "friendship",
          partOfSpeech: "noun",
          enDefinition: "The emotions or conduct of friends; the state of being friends.",
          idMeaning: "persahabatan; tali persaudaraan",
          contextSentence: "Their enduring friendship survived thirty long years."
        },
        {
          wordId: "batch-tear-noun",
          word: "tear",
          partOfSpeech: "noun",
          enDefinition: "A drop of clear salty liquid produced by the eye when crying with emotion.",
          idMeaning: "air mata (terharu/bahagia)",
          contextSentence: "A tear of joy glistened in the old man's eyes."
        },
        {
          wordId: "batch-smile-verb",
          word: "smile",
          partOfSpeech: "verb",
          enDefinition: "To form one's features into a pleased, kind, or amused expression.",
          idMeaning: "tersenyum",
          contextSentence: "He smiled warmly as he recognized the handwriting."
        }
      ],
      grammarFocus: {
        title: "Present Perfect untuk Hubungan yang Berlangsung Hingga Kini ('I have kept...')",
        topicId: "present-simple",
        explanation: "Gunakan Present Perfect ('have/has + V3') dipadukan dengan 'for + durasi' untuk menyatakan tindakan atau janji yang telah dijaga terus-menerus selama periode waktu hingga saat ini: 'I have kept it safe for thirty years'.",
        formula: "Subject + have/has + [Past Participle V3] + for [Duration]."
      },
      culturalTip: {
        title: "Kekuatan Janji Verbal di Kalangan Generasi Terdahulu",
        content: "Di kalangan perajin dan sahabat generasi terdahulu, janji lisan (*a gentleman's word*) memiliki kekuatan hukum moral yang setara dengan kontrak tertulis. Integritas menjaga amanah adalah kebanggaan terbesar dalam hidup mereka."
      },
      quiz: [
        {
          id: "s4_ep8_q1",
          question: "How did Mr. Barnaby react when he saw the handwriting on the envelope?",
          options: [
            "He threw it into the wastebasket",
            "He recognized Johannes' handwriting immediately with joyful tears",
            "He called the police",
            "He asked for payment"
          ],
          correctIndex: 1,
          explanation: "Pak Barnaby langsung mengenali tulisan tangan sahabatnya (Johannes) dengan air mata bahagia dan haru."
        },
        {
          id: "s4_ep8_q2",
          question: "How long had Mr. Barnaby kept the silver pocket watch safe in his workshop?",
          options: [
            "Two days",
            "Thirty years",
            "Five minutes",
            "One hundred years"
          ],
          correctIndex: 1,
          explanation: "Pak Barnaby telah menjaga dan merawat jam saku tersebut selama tiga puluh tahun (*thirty years*)."
        },
        {
          id: "s4_ep8_q3",
          question: "Which tense correctly expresses an action continuing over a thirty-year duration up to now?",
          options: [
            "I keep it yesterday.",
            "I have kept it safe for thirty years.",
            "I will keeping it tomorrow.",
            "I kept it never."
          ],
          correctIndex: 1,
          explanation: "'I have kept it safe for thirty years' menggunakan Present Perfect Tense dengan penanda waktu durasi 'for'."
        },
        {
          id: "s4_ep8_q4",
          question: "What does the noun 'friendship' mean?",
          options: [
            "Kapal pengangkut barang",
            "Tali persahabatan atau hubungan pertemanan sejati",
            "Mesin pembuat roti",
            "Jalan raya beraspal"
          ],
          correctIndex: 1,
          explanation: "'Friendship' berarti hubungan persahabatan sejati."
        },
        {
          id: "s4_ep8_q5",
          question: "Complete the sentence: 'Mr. Barnaby ______ warmly as he held the letter.'",
          options: [
            "smiled",
            "smiling",
            "smiles",
            "smile"
          ],
          correctIndex: 0,
          explanation: "Tindakan tersenyum di masa lampau menggunakan bentuk Past Simple: 'smiled'."
        }
      ],
      summary: {
        takeaways: [
          "Menyaksikan reuni emosional persahabatan sejati antargenerasi.",
          "Menggunakan Present Perfect untuk amanah berkelanjutan: 'I have kept it safe for thirty years.'",
          "Mengenal kosakata emosional: meet, old, remember, friendship, tear, smile."
        ]
      },
      cliffhanger: "Pak Barnaby berdiri dari meja kerjanya dan melangkah menuju sebuah brankas besi kuno beroda putar di sudut ruangan. Beliau memutar kodenya: KLIK, KLIK, KLAK! Pintu besi tebal berayun terbuka..."
    },

    // EPISODE 9
    {
      id: 9,
      number: 9,
      title: "Arloji yang Berdetik Kembali",
      titleEn: "The Watch That Ticks Again",
      estimatedMinutes: 10,
      recap: "Dari dalam brankas besi tua, Pak Barnaby mengeluarkan sebuah kotak beludru merah marun dan meletakkannya di hadapanmu.",
      dialogue: [
        {
          id: "s4e9_d1",
          speaker: "Barnaby",
          en: "Here it is. I fixed the balance spring, cleaned the ruby jewels, and polished the silver case every single year.",
          idText: "Ini dia. Kakek memperbaiki pegas penyeimbangnya, membersihkan bantalan batu rubi, dan memoles badan peraknya setiap tahun."
        },
        {
          id: "s4e9_d2",
          speaker: "Narator",
          en: "He opens the velvet box. Inside rests a gleaming silver pocket watch on a braided silver chain.",
          idText: "Beliau membuka kotak beludru. Di dalamnya terbaring arloji saku perak berkilau dengan rantai kepang perak."
        },
        {
          id: "s4e9_choice_1",
          type: "interactive_choice",
          prompt: "Pak Barnaby menekan tombol mahkota jam kecil. Tutup peraknya terbuka dan memperlihatkan ukiran burung walet kecil. Apa reaksimu?",
          options: [
            {
              id: "s4e9_opt_1a",
              text: "It is ticking so rhythmically and beautifully! It sounds like a gentle heartbeat.",
              speakerReply: "Barnaby",
              reactionEn: "That heartbeat has waited thirty years to beat for Johannes' grandchild.",
              reactionId: "Detak jantung itu telah menanti tiga puluh tahun untuk berdetik bagi cucu Johannes."
            },
            {
              id: "s4e9_opt_1b",
              text: "The swallow engraving is so delicate. This is the greatest gift of my life.",
              speakerReply: "Barnaby",
              reactionEn: "It belongs to you now. Carry it with honor and keep your grandfather's spirit alive.",
              reactionId: "Benda ini milikmu sekarang. Bawalah dengan penuh kehormatan dan hidupkan semangat kakekmu."
            }
          ]
        },
        {
          id: "s4e9_d3",
          speaker: "You",
          en: "I do not know how to thank you enough, Mr. Barnaby. Your loyalty is truly inspiring.",
          idText: "Saya tidak tahu bagaimana harus berterima kasih secukupnya, Pak Barnaby. Kesetiaan Anda sungguh menginspirasi."
        },
        {
          id: "s4e9_d4",
          speaker: "Kanci",
          en: "Amanah kakek telah tuntas! Arloji perak ini kini kembali berdetik di tangan keluarga yang tepat!",
          idText: "Amanah kakek telah tuntas! Arloji perak ini kini kembali berdetik di tangan keluarga yang tepat!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-box-noun",
          word: "box",
          partOfSpeech: "noun",
          enDefinition: "A container with a flat base and sides; in this context, a velvet jeweler's case.",
          idMeaning: "kotak beludru penyimpan perhiasan",
          contextSentence: "The crimson velvet box protected the vintage watch."
        },
        {
          wordId: "batch-silver-noun",
          word: "silver",
          partOfSpeech: "noun",
          enDefinition: "A valuable shiny, greyish-white metal.",
          idMeaning: "perak murni",
          contextSentence: "The polished silver glistened in the morning sunlight."
        },
        {
          wordId: "batch-clean-adjective",
          word: "clean",
          partOfSpeech: "adjective",
          enDefinition: "Free from dirt, marks, or stains; spotless.",
          idMeaning: "bersih terawat",
          contextSentence: "The internal gears were immaculately clean."
        },
        {
          wordId: "batch-perfect-adjective",
          word: "perfect",
          partOfSpeech: "adjective",
          enDefinition: "Having all the required or desirable elements, qualities, or characteristics; as good as it is possible to be.",
          idMeaning: "sempurna tanpa cacat",
          contextSentence: "The timepiece kept perfect, precise time."
        },
        {
          wordId: "batch-heirloom-noun",
          word: "heirloom",
          partOfSpeech: "noun",
          enDefinition: "A valuable object that has belonged to a family for several generations.",
          idMeaning: "benda pusaka warisan keluarga",
          contextSentence: "This heirloom links our family's past with our present."
        },
        {
          wordId: "batch-gift-noun",
          word: "gift",
          partOfSpeech: "noun",
          enDefinition: "A thing given willingly to someone without payment; a present.",
          idMeaning: "hadiah; pemberian bernilai luhur",
          contextSentence: "Returning the watch was a sacred gift of honor."
        }
      ],
      grammarFocus: {
        title: "Menyatakan Narasi Tindakan Sempurna Lampau (Past Narrative Action)",
        topicId: "past-simple",
        explanation: "Gunakan rentetan kata kerja Past Simple berurutan untuk menceritakan tindakan restorasi yang telah dilakukan: 'He fixed the spring, cleaned the jewels, and polished the case'.",
        formula: "Subject + [Verb 1 Past], [Verb 2 Past], and [Verb 3 Past]."
      },
      culturalTip: {
        title: "Perawatan Jam Mekanik Manual (Mechanical Watch Care)",
        content: "Berbeda dengan jam baterai kuarsa, jam mekanik antik dijalankan oleh pegas putar (*winding crown*). Memutar mahkota jam 15–20 putaran secara teratur tiap pagi akan menjaga akurasi pelumas gir dan keawetan jam selama ratusan tahun."
      },
      quiz: [
        {
          id: "s4_ep9_q1",
          question: "What color was the velvet box that held the silver pocket watch?",
          options: [
            "Bright yellow",
            "Crimson red / maroon",
            "Neon green",
            "Pitch black"
          ],
          correctIndex: 1,
          explanation: "Kotak beludru penyimpan jam saku tersebut berwarna merah marun (*crimson red / maroon velvet*)."
        },
        {
          id: "s4_ep9_q2",
          question: "What is an 'heirloom' in family vocabulary?",
          options: [
            "Makanan cepat saji",
            "Benda pusaka berharga yang diwariskan turun-temurun dalam keluarga",
            "Tiket bioskop kemarin malam",
            "Surat kabar harian"
          ],
          correctIndex: 1,
          explanation: "'Heirloom' adalah benda pusaka berharga yang diwariskan dari satu generasi ke generasi berikutnya."
        },
        {
          id: "s4_ep9_q3",
          question: "How did the ticking sound of the restored watch feel to you?",
          options: [
            "Like an exploding car",
            "Like a gentle, beautiful heartbeat",
            "Like an angry siren",
            "Like water dripping"
          ],
          correctIndex: 1,
          explanation: "Kamu mendeskripsikan detak arloji perak tersebut berirama indah layaknya detak jantung yang lembut (*gentle heartbeat*)."
        },
        {
          id: "s4_ep9_q4",
          question: "What does the adjective 'perfect' mean?",
          options: [
            "Rusak parah",
            "Sempurna tanpa cacat",
            "Sangat kotor",
            "Penuh duri"
          ],
          correctIndex: 1,
          explanation: "'Perfect' berarti sempurna dan berfungsi secara prima tanpa cela."
        },
        {
          id: "s4_ep9_q5",
          question: "Complete the sentence: 'He ______ the spring, cleaned the gears, and polished the case.'",
          options: [
            "fixed",
            "fixing",
            "fixes",
            "fix"
          ],
          correctIndex: 0,
          explanation: "Dalam rentetan narasi lampau sejajar (parallel past tense), kata kerja beraturan 'fix' menggunakan bentuk past: 'fixed'."
        }
      ],
      summary: {
        takeaways: [
          "Menerima kembali jam saku pusaka perak keluarga dari tangan Pak Barnaby.",
          "Mendeskripsikan keindahan fisik arloji: box, silver, clean, perfect, heirloom, gift.",
          "Memahami cara merawat dan mengapresiasi jam saku mekanik bersejarah."
        ]
      },
      cliffhanger: "Sambil menggenggam arloji perak yang berdetik hangat di tanganmu, kamu berpamitan dengan pelukan hangat kepada Pak Barnaby. Sore itu di balkon hotel, secarik kertas putih kosong dan pena tinta telah menanti di mejamu..."
    },

    // EPISODE 10
    {
      id: 10,
      number: 10,
      title: "Menulis Balasan di Masa Kini",
      titleEn: "Writing Back from the Present",
      estimatedMinutes: 10,
      recap: "Kembali ke kamar hotel dengan arloji saku tersemat rapi di saku rompi, kamu duduk di meja kerja menghadap pemandangan senja kota. Inilah saatnya membalas surat kakek dari masa kini.",
      dialogue: [
        {
          id: "s4e10_d1",
          speaker: "Narator",
          en: "The golden evening sun casts long, gentle shadows across the wooden desk as the pocket watch ticks softly beside your journal.",
          idText: "Sinar matahari senja keemasan membiaskan bayang-bayang lembut di atas meja kayu saat jam saku berdetik pelan di samping buku jurnalmu."
        },
        {
          id: "s4e10_d2",
          speaker: "You",
          en: "Dearest Grandfather, I received your letter. I met Mr. Barnaby, and your silver swallow watch is ticking proudly once more.",
          idText: "Kakekku tercinta, cucumu telah menerima surat kakek. Cucumu telah bertemu Pak Barnaby, dan jam walet perak kakek kini berdetik gagah kembali."
        },
        {
          id: "s4e10_choice_1",
          type: "interactive_choice",
          prompt: "Bagaimana kamu menutup baris surat balasan ini dengan tekad hidupmu?",
          options: [
            {
              id: "s4e10_opt_1a",
              text: "I promise to carry your kindness, hard work, and values wherever my future journey leads me.",
              speakerReply: "Kanci",
              reactionEn: "Grandfather would be weeping with profound pride to read those words.",
              reactionId: "Kakek pasti akan menitikkan air mata haru dan bangga membaca kata-kata itu."
            },
            {
              id: "s4e10_opt_1b",
              text: "Your legacy is alive. I am ready to step forward into tomorrow with courage and confidence.",
              speakerReply: "Kanci",
              reactionEn: "Courage and confidence! That is the true spirit of an English scholar adventurer!",
              reactionId: "Keberanian dan rasa percaya diri! Itulah jiwa sejati seorang petualang cendekiawan!"
            }
          ]
        },
        {
          id: "s4e10_d3",
          speaker: "You",
          en: "With all my heart and everlasting love, your grandchild.",
          idText: "Dengan sepenuh hatiku dan cinta abadi, cucumu."
        },
        {
          id: "s4e10_d4",
          speaker: "Kanci",
          en: "Luar biasa! Kamu telah menuntaskan perjalanan emosional yang indah: menghubungkan masa lalu, masa kini, dan masa depan!",
          idText: "Luar biasa! Kamu telah menuntaskan perjalanan emosional yang indah: menghubungkan masa lalu, masa kini, dan masa depan!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "batch-write-verb",
          word: "write",
          partOfSpeech: "verb",
          enDefinition: "To mark letters, words, or other symbols on a surface with a pen.",
          idMeaning: "menulis; mencatat",
          contextSentence: "I write these lines with profound gratitude."
        },
        {
          wordId: "batch-heart-noun",
          word: "heart",
          partOfSpeech: "noun",
          enDefinition: "The center of a person's thoughts, feelings, and emotions.",
          idMeaning: "hati; sanubari",
          contextSentence: "I thank you with all my heart."
        },
        {
          wordId: "batch-future-noun",
          word: "future",
          partOfSpeech: "noun",
          enDefinition: "A period of time following the moment of speaking or writing; time regarded as still to come.",
          idMeaning: "masa depan",
          contextSentence: "We carry our ancestors' wisdom into our bright future."
        },
        {
          wordId: "batch-proud-adjective",
          word: "proud",
          partOfSpeech: "adjective",
          enDefinition: "Feeling deep pleasure or satisfaction as a result of one's own achievements or qualities.",
          idMeaning: "bangga",
          contextSentence: "I am proud to belong to this family."
        },
        {
          wordId: "batch-ready-adjective",
          word: "ready",
          partOfSpeech: "adjective",
          enDefinition: "In a suitable state for an activity or situation; fully prepared.",
          idMeaning: "siap; bersiap",
          contextSentence: "I am ready for the next chapter of my student life."
        },
        {
          wordId: "batch-life-noun",
          word: "life",
          partOfSpeech: "noun",
          enDefinition: "The existence of an individual human being or animal.",
          idMeaning: "kehidupan; jalan hidup",
          contextSentence: "Life is a continuous journey of learning and discovery."
        }
      ],
      grammarFocus: {
        title: "Menulis Penutup Surat Pribadi Informal ('With all my heart, ...')",
        topicId: "present-simple",
        explanation: "Pelajari konvensi penutup surat pribadi dalam Bahasa Inggris: 'With love', 'With all my heart', 'Yours sincerely', diikuti koma dan nama pengirim di baris bawah.",
        formula: "Closing Phrase + Comma + [Your Name] / With all my love, your grandchild."
      },
      culturalTip: {
        title: "Etika Menulis Surat Pribadi (Informal Letter Conventions)",
        content: "Dalam surat pribadi berbahasa Inggris, pembuka diawali dengan 'Dearest [Name],' dan diakhiri ungkapan kasih sayang seperti 'Warmest regards,' atau 'With all my love,'. Tulisan penutup ini memberikan kesan intim dan hangat."
      },
      quiz: [
        {
          id: "s4_ep10_q1",
          question: "Which of the following is a traditional affectionate sign-off for a personal family letter?",
          options: [
            "Pay me immediately, driver",
            "With all my love and gratitude, your grandchild",
            "Delete this paper now",
            "End of file"
          ],
          correctIndex: 1,
          explanation: "'With all my love and gratitude, your grandchild' adalah salam penutup surat keluarga yang hangat dan santun."
        },
        {
          id: "s4_ep10_q2",
          question: "What is the English word for the time that is still to come?",
          options: [
            "Yesterday",
            "Future",
            "Past",
            "Ancient"
          ],
          correctIndex: 1,
          explanation: "Waktu yang akan datang di masa depan disebut 'Future'."
        },
        {
          id: "s4_ep10_q3",
          question: "How did writing back to Grandfather complete your journey in Story 4?",
          options: [
            "It wasted lots of ink",
            "It bridged the past, present, and future with family gratitude",
            "It bought an airplane ticket",
            "It broke the watch again"
          ],
          correctIndex: 1,
          explanation: "Menulis surat balasan menjembatani masa lalu, masa kini, dan masa depan dengan rasa syukur keluarga."
        },
        {
          id: "s4_ep10_q4",
          question: "What does the adjective 'proud' mean?",
          options: [
            "Merasa malu dan takut",
            "Merasa bangga dan bahagia atas pencapaian atau asal-usul",
            "Merasa lapar ingin makan roti",
            "Sangat mengantuk di malam hari"
          ],
          correctIndex: 1,
          explanation: "'Proud' berarti merasa bangga atas nilai, pencapaian, atau keluarga."
        },
        {
          id: "s4_ep10_q5",
          question: "Complete the sentence: 'I ______ this journal entry with joy in my heart.'",
          options: [
            "write",
            "writing",
            "wrote",
            "written"
          ],
          correctIndex: 0,
          explanation: "Pernyataan yang sedang dilakukan saat menulis di masa sekarang menggunakan Simple Present: 'write'."
        }
      ],
      summary: {
        takeaways: [
          "Menulis surat balasan pribadi dengan konvensi informal yang hangat.",
          "Menghubungkan masa lalu kakek dengan tekad masa depan cucu.",
          "Menguasai kosakata penutup kehidupan: write, heart, future, proud, ready, life."
        ]
      },
      cliffhanger: "Setelah menutup buku jurnalmu, ponselmu berdering. Sebuah panggilan masuk dari pemilik rumah kos mahasiswa di University District: 'Halo, apakah ini calon penghuni baru Kos Nomor 7? Teman sekamarmu sudah tiba dan menunggumu di teras kos!' Petualangan Cerita 5 siap dimulai!"
    }
  ]
};

// Validate consistency
if (story04.episodes.length !== 10) {
  throw new Error("Story 4 must have exactly 10 episodes!");
}

story04.episodes.forEach((ep) => {
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

fs.writeFileSync("src/data/stories/story-04.json", JSON.stringify(story04, null, 2), "utf8");
console.log("✓ SUCCESS: Story 4 (story-04.json) successfully created with all 10 full-length episodes!");
console.log("Total Episodes:", story04.episodes.length);
console.log("Total Quiz Questions:", story04.episodes.length * 5);
console.log("Total Oxford 3000 Vocabularies:", story04.episodes.length * 6);
