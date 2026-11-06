import fs from "fs";
import path from "path";

const story09 = {
  id: "story-09",
  title: "Pulau Tanpa Sinyal",
  titleEn: "The Off-Grid Island",
  level: "B2",
  theme: "Conservation & Off-Grid Science",
  description: "Ikuti ekspedisi konservasi laut di stasiun riset kepulauan terpencil tanpa sinyal seluler atau internet. Pelajari conditional lanjutan, hipotesis ilmiah, dan protokol penyelamatan alam.",
  descriptionEn: "Join an ecological marine research expedition on a remote off-grid archipelago station. Master advanced conditionals, scientific hedging, and maritime emergency protocols.",
  icon: "🏝️",
  accentColor: "#0d9488",
  rewardExp: 50,
  rewardCoins: 30,
  episodes: [
    // EPISODE 1
    {
      id: 1,
      number: 1,
      title: "Tiba di Stasiun Riset Terpencil",
      titleEn: "Arrival at the Off-Grid Station",
      estimatedMinutes: 8,
      recap: "Maya tiba di Pulau Karang Merah bersama tim peneliti kelautan untuk memulai program magang konservasi selama tiga pekan.",
      dialogue: [
        {
          id: "s9e1_d1",
          speaker: "Captain Riko",
          speakerRole: "Ferry Captain",
          textEn: "Welcome to Coral Crest Island, researchers. Once my boat leaves this dock, your mobile phones will become nothing more than fancy pocket mirrors.",
          textId: "Selamat datang di Pulau Karang Merah, para peneliti. Begitu perahu saya meninggalkan dermaga ini, ponsel kalian tidak lebih dari sekadar cermin saku mewah.",
          audioText: "Welcome to Coral Crest Island, researchers. Once my boat leaves this dock, your mobile phones will become nothing more than fancy pocket mirrors."
        },
        {
          id: "s9e1_d2",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "I checked my signal bar immediately, and it truly shows zero service. It feels both thrilling and slightly terrifying to be completely detached from civilization.",
          textId: "Saya langsung memeriksa bilah sinyal, dan benar-benar menunjukkan nol layanan. Rasanya mendebarkan sekaligus sedikit menegangkan terpisah total dari peradaban.",
          audioText: "I checked my signal bar immediately, and it truly shows zero service. It feels both thrilling and slightly terrifying to be completely detached from civilization."
        },
        {
          id: "s9e1_d3",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "That detachment is precisely why our ecological sanctuary remains undisturbed, Maya. Let us haul our equipment up to the station before the tide rises.",
          textId: "Keterpisahan itulah alasan utama suaka ekologis kita tetap tak terganggu, Maya. Mari kita angkut peralatan ke stasiun sebelum air pasang naik.",
          audioText: "That detachment is precisely why our ecological sanctuary remains undisturbed, Maya. Let us haul our equipment up to the station before the tide rises."
        },
        {
          id: "s9e1_choice_1",
          type: "interactive_choice",
          promptEn: "How does Maya reply as they carry the heavy field boxes?",
          promptId: "Bagaimana tanggapan Maya saat mereka mengangkat kotak perlengkapan lapangan yang berat?",
          options: [
            {
              id: "s9e1_opt_1a",
              textEn: "I am ready, Dr. Vance. I came here to observe pristine marine life, not scroll through social feeds.",
              textId: "Saya siap, Dr. Vance. Saya datang ke sini untuk mengamati kehidupan laut murni, bukan menggulir media sosial.",
              feedbackEn: "Admirable scientific dedication! Dr. Vance nods with quiet approval.",
              feedbackId: "Dedikasi ilmiah yang mengagumkan! Dr. Vance mengangguk dengan persetujuan penuh."
            },
            {
              id: "s9e1_opt_1b",
              textEn: "Should we conserve our flashlight batteries right away in case power is limited?",
              textId: "Haruskah kita segera menghemat baterai senter kita jika daya listrik terbatas?",
              feedbackEn: "A very sensible precaution in off-grid field conditions.",
              feedbackId: "Tindakan pencegahan yang sangat bijaksana dalam kondisi lapangan terpencil."
            }
          ]
        },
        {
          id: "s9e1_d4",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "Well said! The main station generator and solar arrays are just ahead. Let us settle in and log our arrival time on the analog chalkboard.",
          textId: "Tepat sekali! Generator utama dan susunan panel surya berada tepat di depan. Mari kita menetap dan mencatat waktu kedatangan di papan tulis analog.",
          audioText: "Well said! The main station generator and solar arrays are just ahead. Let us settle in and log our arrival time on the analog chalkboard."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-island",
          word: "island",
          partOfSpeech: "noun",
          enDefinition: "A piece of land surrounded by water.",
          idMeaning: "pulau",
          contextSentenceEn: "Coral Crest is a remote island situated fifty miles from the mainland coast.",
          contextSentenceId: "Karang Merah adalah pulau terpencil yang terletak lima puluh mil dari pesisir daratan utama."
        },
        {
          wordId: "oxford-remote",
          word: "remote",
          partOfSpeech: "adjective",
          enDefinition: "Situated far from the main centers of population; distant.",
          idMeaning: "terpencil, jauh dari keramaian",
          contextSentenceEn: "Living at a remote research station requires strict resourcefulness and mental discipline.",
          contextSentenceId: "Tinggal di stasiun riset terpencil membutuhkan ketangkasan sumber daya dan disiplin mental yang ketat."
        },
        {
          wordId: "oxford-battery",
          word: "battery",
          partOfSpeech: "noun",
          enDefinition: "A container consisting of one or more cells, in which chemical energy is converted into electricity.",
          idMeaning: "baterai penyimpan daya",
          contextSentenceEn: "Maya switched her phone to airplane mode to preserve its internal battery for photo documentation.",
          contextSentenceId: "Maya mengalihkan ponselnya ke mode pesawat untuk menghemat baterai internal demi dokumentasi foto."
        },
        {
          wordId: "oxford-device",
          word: "device",
          partOfSpeech: "noun",
          enDefinition: "A thing made or adapted for a particular purpose, especially a piece of mechanical or electronic equipment.",
          idMeaning: "peranti, gawai elektronik",
          contextSentenceEn: "Each digital device brought onto the island must be kept in waterproof casing.",
          contextSentenceId: "Setiap peranti digital yang dibawa ke pulau harus disimpan di wadah kedap air."
        },
        {
          wordId: "oxford-separate",
          word: "separate",
          partOfSpeech: "verb",
          enDefinition: "Cause to move or be apart; divide into constituent parts.",
          idMeaning: "memisahkan, membagi",
          contextSentenceEn: "A deep ocean trench separates the island from commercial shipping lanes.",
          contextSentenceId: "Palung laut yang dalam memisahkan pulau ini dari jalur pelayaran komersial."
        },
        {
          wordId: "oxford-arrival",
          word: "arrival",
          partOfSpeech: "noun",
          enDefinition: "The action or process of arriving somewhere.",
          idMeaning: "kedatangan, ketibaan",
          contextSentenceEn: "Upon their arrival, the research team immediately logged their emergency contact protocols.",
          contextSentenceId: "Setelah kedatangan mereka, tim peneliti segera mencatat protokol kontak darurat mereka."
        }
      ],
      grammarFocus: {
        topic: "Expressing Contrast and Temporal Sequence in Field Narratives",
        explanationEn: "In advanced descriptive writing (B2), conjunctions such as 'once', 'precisely why', and 'whereas' connect causes and consequences across shifts in environment.",
        explanationId: "Dalam penulisan naratif deskriptif tingkat lanjut (B2), kata hubung seperti 'once' (begitu/setelah), 'precisely why' (justru karena alasan itulah), dan klausa kontras menghubungkan sebab-akibat secara elegan.",
        examples: [
          {
            en: "Once the boat leaves the pier, our digital connectivity ceases entirely.",
            id: "Begitu perahu meninggalkan dermaga, konektivitas digital kita berhenti seutuhnya."
          },
          {
            en: "Isolation is precisely why this coral ecosystem thrives without contamination.",
            id: "Keterisolasian inilah alasan tepat mengapa ekosistem terumbu karang ini berkembang pesat tanpa pencemaran."
          }
        ]
      },
      culturalTip: {
        titleEn: "Field Station Digital Detox Etiquette",
        titleId: "Etika Detoks Digital di Stasiun Riset Lapangan",
        contentEn: "At remote scientific sanctuaries worldwide, researchers practice 'digital mindfulness'. Devices are strictly reserved for data logging, specimen photography, and safety diagnostics rather than recreational distraction.",
        contentId: "Di suaka penelitian ilmiah terpencil di seluruh dunia, para peneliti menerapkan 'kesadaran digital'. Peranti elektronik hanya digunakan khusus untuk pencatatan data, fotografi spesimen, dan diagnostik keselamatan, bukan untuk hiburan pribadi."
      },
      quiz: [
        {
          id: "s9_ep1_q1",
          questionEn: "Why will the researchers' phones act as 'pocket mirrors' according to Captain Riko?",
          questionId: "Mengapa ponsel para peneliti hanya akan berfungsi sebagai 'cermin saku' menurut Kapten Riko?",
          options: [
            "Because the bright sunlight reflects off the phone screens",
            "Because there is zero cellular signal coverage on the island",
            "Because phone cameras are strictly prohibited in the nature sanctuary",
            "Because the electrical outlets have different pin configurations"
          ],
          correctIndex: 1,
          explanationEn: "Captain Riko uses a humorous metaphor to emphasize that without cellular reception, smartphone screens offer no online functionality.",
          explanationId: "Kapten Riko menggunakan metafora jenaka untuk menegaskan bahwa tanpa jangkauan sinyal seluler, layar ponsel pintar tidak memiliki fungsi daring."
        },
        {
          id: "s9_ep1_q2",
          questionEn: "What is the primary benefit of the island's isolation mentioned by Dr. Vance?",
          questionId: "Apa manfaat utama keterisolasian pulau yang disebutkan oleh Dr. Vance?",
          options: [
            "It cuts down the station's monthly electricity expenditure",
            "It ensures the pristine coral sanctuary remains undisturbed by human activity",
            "It prevents researchers from having to work long hours",
            "It allows the team to skip standard laboratory safety guidelines"
          ],
          correctIndex: 1,
          explanationEn: "Dr. Vance notes that physical and digital detachment keeps the ecological sanctuary pristine and undisturbed.",
          explanationId: "Dr. Vance menekankan bahwa keterpisahan fisik dan digital menjaga suaka ekologi tetap murni dan tidak terganggu."
        },
        {
          id: "s9_ep1_q3",
          questionEn: "Which word best completes: 'The stormy channel _____ the island from mainland emergency services'?",
          questionId: "Kata mana yang paling tepat melengkapi: 'The stormy channel _____ the island from mainland emergency services'?",
          options: [
            "separates",
            "recharges",
            "arrives",
            "signals"
          ],
          correctIndex: 0,
          explanationEn: "'Separates' correctly denotes physical dividing distance between the island and mainland facilities.",
          explanationId: "'Separates' (memisahkan) secara tepat menunjukkan jarak pemisah fisik antara pulau dan fasilitas daratan."
        },
        {
          id: "s9_ep1_q4",
          questionEn: "What did Maya do with her mobile device upon landing?",
          questionId: "Apa yang dilakukan Maya terhadap peranti selulernya setelah mendarat?",
          options: [
            "Switched it to airplane mode to conserve battery life for documentation",
            "Threw it into the sea to prove her complete devotion to nature",
            "Tried climbing the highest hill to search for mobile broadband",
            "Left it on Captain Riko's boat to return to the city"
          ],
          correctIndex: 0,
          explanationEn: "Maya wisely preserved battery life by turning on airplane mode so the device wouldn't drain power searching for signals.",
          explanationId: "Maya secara bijak menghemat daya baterai dengan mengaktifkan mode pesawat agar peranti tidak menguras daya saat mencari sinyal."
        },
        {
          id: "s9_ep1_q5",
          questionEn: "In the sentence: 'Once my boat leaves, connectivity ends', what grammatical role does 'Once' play?",
          questionId: "Dalam kalimat: 'Once my boat leaves, connectivity ends', apa peran gramatikal kata 'Once'?",
          options: [
            "A conjunction indicating 'as soon as' or 'from the moment that'",
            "A numeral indicating the quantity one",
            "An adverb of frequency meaning rarely",
            "A preposition of place"
          ],
          correctIndex: 0,
          explanationEn: "'Once' operates as a subordinating conjunction signifying 'as soon as' or temporal occurrence.",
          explanationId: "'Once' berfungsi sebagai konjungsi subordinatif yang bermakna 'segera setelah' atau 'begitu'."
        }
      ],
      takeaways: [
        "Menyambut kondisi terisolasi (*off-grid*) dengan kesiapan mental dan penghematan daya baterai.",
        "Menggunakan konjungsi temporal tingkat lanjut seperti *once* dan klausa kontras *precisely why*.",
        "Menguasai kosakata Oxford 3000: *island*, *remote*, *battery*, *device*, *separate*, *arrival*."
      ],
      cliffhanger: "Namun saat Liam membuka pintu ruang pembangkit stasiun, lampu indikator inverter surya berkedip merah padam..."
    },

    // EPISODE 2
    {
      id: 2,
      number: 2,
      title: "Malafungsi Sistem Tenaga Surya",
      titleEn: "The Solar Power Malfunction",
      estimatedMinutes: 8,
      recap: "Liam mendapati susunan panel surya mengalami lonjakan arus dan baterai cadangan stasiun tidak mengisi daya secara optimal.",
      dialogue: [
        {
          id: "s9e2_d1",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "Dr. Vance, we have a critical power issue. The main breaker tripped during yesterday's lightning storm, and the solar array is producing zero electric current.",
          textId: "Dr. Vance, kita mengalami masalah daya kritis. Pemutus arus utama mati saat badai petir kemarin, dan susunan panel surya menghasilkan nol arus listrik.",
          audioText: "Dr. Vance, we have a critical power issue. The main breaker tripped during yesterday's lightning storm, and the solar array is producing zero electric current."
        },
        {
          id: "s9e2_d2",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Our refrigerated specimen freezers require constant energy. If that temperature rises above minus twenty Celsius, two years of deep-sea coral samples will spoil.",
          textId: "Freezer spesimen berpendingin kita membutuhkan energi konstan. Jika suhu itu naik di atas minus dua puluh Celsius, sampel karang laut dalam selama dua tahun akan rusak.",
          audioText: "Our refrigerated specimen freezers require constant energy. If that temperature rises above minus twenty Celsius, two years of deep-sea coral samples will spoil."
        },
        {
          id: "s9e2_d3",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "Let me assist you, Liam. Did lightning physically damage the outdoor regulator, or is it an internal fuse burnout?",
          textId: "Biar saya bantu, Liam. Apakah petir merusak regulator luar secara fisik, atau ini kerusakan sekring internal?",
          audioText: "Let me assist you, Liam. Did lightning physically damage the outdoor regulator, or is it an internal fuse burnout?"
        },
        {
          id: "s9e2_choice_1",
          type: "interactive_choice",
          promptEn: "What diagnostic step does Maya propose?",
          promptId: "Langkah diagnostik apa yang diusulkan Maya?",
          options: [
            {
              id: "s9e2_opt_1a",
              textEn: "We should isolate the backup generator circuit first to prevent any electric shock while inspecting the inverter.",
              textId: "Kita harus mengisolasi sirkuit generator cadangan terlebih dahulu untuk mencegah sengatan listrik saat memeriksa inverter.",
              feedbackEn: "Safety first! Dr. Vance praises your protocol discipline.",
              feedbackId: "Keselamatan nomor satu! Dr. Vance memuji kedisiplinan protokol Anda."
            },
            {
              id: "s9e2_opt_1b",
              textEn: "Can we manually bypass the regulator to quickly jump-start the freezer compressor?",
              textId: "Bisakah kita melewati regulator secara manual untuk langsung menyalakan kompresor freezer?",
              feedbackEn: "Too risky! An unregulated surge could permanently fry the refrigeration unit.",
              feedbackId: "Terlalu berisiko! Lonjakan tanpa regulasi dapat merusak unit pendingin secara permanen."
            }
          ]
        },
        {
          id: "s9e2_d4",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "Spot on, Maya. Safety first. Once the master switch is disconnected, we can repair the scorched copper terminal with our spare parts kit.",
          textId: "Tepat sekali, Maya. Keselamatan utama. Begitu sakelar utama diputus, kita bisa memperbaiki terminal tembaga yang hangus dengan kotak suku cadang kita.",
          audioText: "Spot on, Maya. Safety first. Once the master switch is disconnected, we can repair the scorched copper terminal with our spare parts kit."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-power",
          word: "power",
          partOfSpeech: "noun",
          enDefinition: "Supply of electricity or other form of energy to a machine or community.",
          idMeaning: "daya listrik, tenaga",
          contextSentenceEn: "Without sufficient power, the marine laboratory cannot maintain climate-controlled incubators.",
          contextSentenceId: "Tanpa daya yang memadai, laboratorium kelautan tidak dapat mempertahankan inkubator bersuhu terkendali."
        },
        {
          wordId: "oxford-solar",
          word: "solar",
          partOfSpeech: "adjective",
          enDefinition: "Relating to or determined by the sun.",
          idMeaning: "tenaga surya, matahari",
          contextSentenceEn: "The station relies on high-efficiency solar cells to charge its lithium battery bank.",
          contextSentenceId: "Stasiun mengandalkan sel surya berefisiensi tinggi untuk mengisi daya bank baterai litiumnya."
        },
        {
          wordId: "oxford-energy",
          word: "energy",
          partOfSpeech: "noun",
          enDefinition: "Power derived from the utilization of physical or chemical resources, especially to provide light and heat or to work machines.",
          idMeaning: "energi, sumber daya kerja",
          contextSentenceEn: "Conserving energy during cloudy days is vital for island survival.",
          contextSentenceId: "Menghemat energi selama hari berawan sangat penting bagi kelangsungan hidup di pulau."
        },
        {
          wordId: "oxford-damage",
          word: "damage",
          partOfSpeech: "verb",
          enDefinition: "Inflict physical harm on something so as to impair its value, usefulness, or normal function.",
          idMeaning: "merusak, menyebabkan kerusakan",
          contextSentenceEn: "A high-voltage surge can severely damage delicate scientific sensors.",
          contextSentenceId: "Lonjakan voltase tinggi dapat merusak sensor ilmiah yang sensitif secara parah."
        },
        {
          wordId: "oxford-repair",
          word: "repair",
          partOfSpeech: "verb",
          enDefinition: "Restore (something that is damaged, faulty, or worn) to a good condition.",
          idMeaning: "memperbaiki, mereparasi",
          contextSentenceEn: "Liam used soldering wire to repair the severed connection on the regulator board.",
          contextSentenceId: "Liam menggunakan kawat solder untuk memperbaiki sambungan yang terputus pada papan regulator."
        },
        {
          wordId: "oxford-electric",
          word: "electric",
          partOfSpeech: "adjective",
          enDefinition: "Of, worked by, charged with, or producing electricity.",
          idMeaning: "bertenaga listrik, elektris",
          contextSentenceEn: "All electric cabling running between the huts is heavily insulated against saltwater corrosion.",
          contextSentenceId: "Semua kabel listrik yang menghubungkan antar pondok diisolasi tebal terhadap korosi air asin."
        }
      ],
      grammarFocus: {
        topic: "Zero & First Conditionals with Cause-Effect in Technical Diagnostics",
        explanationEn: "When diagnosing technical equipment, Zero Conditional expresses invariable scientific facts ('If temperature rises, samples spoil'), while First Conditional expresses real future consequences ('If we isolate the circuit, we will prevent shocks').",
        explanationId: "Dalam diagnosis teknis, Zero Conditional menyatakan fakta ilmiah mutlak ('If temperature rises, samples spoil'), sedangkan First Conditional menyatakan konsekuensi nyata di masa depan ('If we isolate the circuit, we will prevent shocks').",
        examples: [
          {
            en: "If the voltage fluctuates, sensitive circuit boards burn out.",
            id: "Jika voltase berfluktuasi, papan sirkuit sensitif akan terbakar."
          },
          {
            en: "If we replace the melted fuse today, the solar system will resume charging by noon.",
            id: "Jika kita mengganti sekring yang meleleh hari ini, sistem surya akan melanjutkan pengisian daya menjelang siang."
          }
        ]
      },
      culturalTip: {
        titleEn: "Island Energy Independence",
        titleId: "Kemandirian Energi di Pulau Terpencil",
        contentEn: "Off-grid eco-stations operate on a strict energy hierarchy: life support and specimen preservation take priority over creature comforts like hot water or overhead lighting.",
        contentId: "Stasiun ekologi terpencil beroperasi dengan hierarki energi yang ketat: pendukung kehidupan dan pengawetan spesimen selalu diprioritaskan di atas kenyamanan seperti air panas atau penerangan berlebih."
      },
      quiz: [
        {
          id: "s9_ep2_q1",
          questionEn: "Why is an immediate power loss dangerous to Dr. Vance's research?",
          questionId: "Mengapa kehilangan daya seketika berbahaya bagi penelitian Dr. Vance?",
          options: [
            "Because the internet connection will be permanently deleted",
            "Because irreplaceable coral specimen freezers will warm up and ruin two years of data",
            "Because the research station lights will scare away nocturnal seabirds",
            "Because Captain Riko will cancel his return voyage"
          ],
          correctIndex: 1,
          explanationEn: "The freezers hold delicate deep-sea coral samples that require continuous sub-zero temperatures.",
          explanationId: "Freezer menyimpan sampel karang laut dalam yang sangat rapuh dan membutuhkan suhu di bawah nol secara terus-menerus."
        },
        {
          id: "s9_ep2_q2",
          questionEn: "What initial safety precaution did Maya advise before examining the inverter?",
          questionId: "Tindakan pencegahan keselamatan awal apa yang disarankan Maya sebelum memeriksa inverter?",
          options: [
            "Disconnecting and isolating the backup generator circuit to prevent electric shock",
            "Pouring sea water over the hot cables to cool them down",
            "Turning on all laboratory lights to check brightness",
            "Waiting for Captain Riko to bring a new generator next month"
          ],
          correctIndex: 0,
          explanationEn: "Isolating the live electrical circuit ensures technicians don't get electrocuted during diagnostic repairs.",
          explanationId: "Mengisolasi sirkuit listrik aktif memastikan teknisi tidak tersengat listrik selama perbaikan diagnostik."
        },
        {
          id: "s9_ep2_q3",
          questionEn: "Choose the correct First Conditional sentence:",
          questionId: "Pilihlah kalimat First Conditional yang tepat:",
          options: [
            "If we repaired the wire, the freezer had started immediately.",
            "If we repair the wire now, the solar array will resume charging the batteries.",
            "If we would repair the wire, electricity was returning.",
            "If we repair the wire, electricity would be happy."
          ],
          correctIndex: 1,
          explanationEn: "A standard First Conditional follows the pattern: 'If + present simple, will + base verb'.",
          explanationId: "Bentuk baku First Conditional mengikuti pola: 'If + present simple, will + base verb'."
        },
        {
          id: "s9_ep2_q4",
          questionEn: "Which word means 'to restore something broken or malfunctioning to good working order'?",
          questionId: "Kata mana yang bermakna 'mengembalikan sesuatu yang rusak atau malafungsi ke kondisi kerja yang baik'?",
          options: [
            "damage",
            "repair",
            "disconnect",
            "separate"
          ],
          correctIndex: 1,
          explanationEn: "'Repair' means to fix or restore something damaged to functional order.",
          explanationId: "'Repair' bermakna memperbaiki atau mereparasi sesuatu yang rusak ke kondisi berfungsi."
        },
        {
          id: "s9_ep2_q5",
          questionEn: "What caused the power regulator failure according to Liam?",
          questionId: "Apa penyebab kegagalan regulator daya menurut Liam?",
          options: [
            "A lightning storm the previous day that tripped the main breaker and scorched terminals",
            "A salty ocean wave that flooded the control room",
            "Mice chewing through the fiber optic cords",
            "Maya leaving her laptop plugged in overnight"
          ],
          correctIndex: 0,
          explanationEn: "Yesterday's lightning storm tripped the breakers and overloaded the copper connections.",
          explanationId: "Badai petir kemarin memicu pemutus arus dan membebani sambungan tembaga secara berlebih."
        }
      ],
      takeaways: [
        "Mendahulukan protokol keselamatan kelistrikan sebelum melakukan reparasi sirkuit.",
        "Menerapkan *Zero* dan *First Conditional* dalam menjelaskan sebab-akibat operasional teknis.",
        "Menguasai kosakata Oxford 3000: *power*, *solar*, *energy*, *damage*, *repair*, *electric*."
      ],
      cliffhanger: "Sistem daya kembali stabil tepat waktu, namun saat fajar tiba, Dr. Vance menemukan kawanan satwa laut aneh berkumpul di laguna barat..."
    },

    // EPISODE 3
    {
      id: 3,
      number: 3,
      title: "Ekspedisi Pengambilan Sampel Samudra",
      titleEn: "Oceanic Specimen Sampling",
      estimatedMinutes: 8,
      recap: "Maya dan Dr. Vance berkano ke laguna terumbu luar untuk mendokumentasikan keanekaragaman hayati laut dan mengambil sampel air.",
      dialogue: [
        {
          id: "s9e3_d1",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Look into the clear shallows, Maya. This pristine reef hosts several rare species of soft coral and bioluminescent algae that cannot survive in warmer waters.",
          textId: "Lihatlah ke perairan dangkal yang jernih, Maya. Terumbu karang murni ini menjadi rumah bagi beberapa spesies langka karang lunak dan alga bercahaya yang tidak dapat bertahan di air yang lebih hangat.",
          audioText: "Look into the clear shallows, Maya. This pristine reef hosts several rare species of soft coral and bioluminescent algae that cannot survive in warmer waters."
        },
        {
          id: "s9e3_d2",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "The water is breathtakingly transparent. Every tiny creature darting among the sea anemones seems oblivious to our small wooden canoe.",
          textId: "Airnya luar biasa jernih. Setiap makhluk kecil yang melesat di antara anemon laut tampak tidak terganggu oleh kano kayu kecil kita.",
          audioText: "The water is breathtakingly transparent. Every tiny creature darting among the sea anemones seems oblivious to our small wooden canoe."
        },
        {
          id: "s9e3_d3",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Our goal today is to collect three sterilized water samples from different depths and observe the micro-plankton density under our field microscope.",
          textId: "Tujuan kita hari ini adalah mengumpulkan tiga sampel air steril dari kedalaman berbeda dan mengamati kepadatan mikro-plankton di bawah mikroskop lapangan.",
          audioText: "Our goal today is to collect three sterilized water samples from different depths and observe the micro-plankton density under our field microscope."
        },
        {
          id: "s9e3_choice_1",
          type: "interactive_choice",
          promptEn: "How should Maya lower the sampling flask into the reef trench?",
          promptId: "Bagaimana seharusnya Maya menurunkan labu sampel ke palung terumbu karang?",
          options: [
            {
              id: "s9e3_opt_1a",
              textEn: "Lower it steadily along the weighted line to avoid disturbing delicate seafloor sediment.",
              textId: "Menurunkannya secara perlahan di sepanjang tali pemberat agar tidak mengganggu sedimen dasar laut yang rapuh.",
              feedbackEn: "Flawless field technique! The sample remains unclouded by stirred sand.",
              feedbackId: "Teknik lapangan sempurna! Sampel tetap jernih tanpa tercampur pasir yang teraduk."
            },
            {
              id: "s9e3_opt_1b",
              textEn: "Drop it rapidly to reach the deepest thermal layer as fast as possible.",
              textId: "Menjatuhkannya dengan cepat untuk mencapai lapisan termal terdalam secepat mungkin.",
              feedbackEn: "Too aggressive; dropping it rapidly kicks up sediment and distorts clarity.",
              feedbackId: "Terlalu terburu-buru; menjatuhkannya cepat mengaduk endapan lumpur dan merusak kejernihan."
            }
          ]
        },
        {
          id: "s9e3_d4",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Excellent composure, Maya. The ocean rewards patience. Label each glass vial with the exact coordinates and depth before the sunlight alters the temperature.",
          textId: "Ketenangan yang luar biasa, Maya. Samudra selalu membalas kesabaran. Beri label pada setiap botol kaca dengan koordinat dan kedalaman presisi sebelum sinar matahari mengubah suhunya.",
          audioText: "Excellent composure, Maya. The ocean rewards patience. Label each glass vial with the exact coordinates and depth before the sunlight alters the temperature."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-ocean",
          word: "ocean",
          partOfSpeech: "noun",
          enDefinition: "A very large expanse of sea, in particular each of the main areas into which the sea is divided geographically.",
          idMeaning: "samudra, lautan lepas",
          contextSentenceEn: "The deep ocean currents bring cold, nutrient-rich water to the island's perimeter.",
          contextSentenceId: "Arus samudra yang dalam membawa air dingin kaya nutrisi ke sekeliling pulau."
        },
        {
          wordId: "oxford-species",
          word: "species",
          partOfSpeech: "noun",
          enDefinition: "A group of living organisms consisting of similar individuals capable of exchanging genes or interbreeding.",
          idMeaning: "spesies, jenis makhluk hayati",
          contextSentenceEn: "Scientists have cataloged over two hundred species of fish along this single coral shelf.",
          contextSentenceId: "Para ilmuwan telah mengatalogkan lebih dari dua ratus spesies ikan di sepanjang paparan terumbu ini."
        },
        {
          wordId: "oxford-creature",
          word: "creature",
          partOfSpeech: "noun",
          enDefinition: "An animal, as distinct from a human being, or an animate being.",
          idMeaning: "makhluk hidup, satwa",
          contextSentenceEn: "Every tiny marine creature plays an irreplaceable ecological role in the food web.",
          contextSentenceId: "Setiap makhluk laut kecil memainkan peran ekologis yang tak tergantikan dalam rantai makanan."
        },
        {
          wordId: "oxford-sample",
          word: "sample",
          partOfSpeech: "noun",
          enDefinition: "A small quantity of a substance taken for analysis or testing.",
          idMeaning: "sampel contoh penelitian",
          contextSentenceEn: "Maya sealed each water sample in an amber glass bottle to prevent photodegradation.",
          contextSentenceId: "Maya menyegel setiap sampel air di botol kaca kuning kecokelatan untuk mencegah kerusakan akibat cahaya."
        },
        {
          wordId: "oxford-collect",
          word: "collect",
          partOfSpeech: "verb",
          enDefinition: "Bring or gather together (a number of things).",
          idMeaning: "mengumpulkan, mengambil",
          contextSentenceEn: "The research team will collect ocean temperature readings every four hours.",
          contextSentenceId: "Tim peneliti akan mengumpulkan data suhu samudra setiap empat jam."
        },
        {
          wordId: "oxford-observe",
          word: "observe",
          partOfSpeech: "verb",
          enDefinition: "Notice or perceive (something) and register it as being significant.",
          idMeaning: "mengamati, memperhatikan secara cermat",
          contextSentenceEn: "Field biologists must quietly observe animal behavior without causing distress.",
          contextSentenceId: "Ahli biologi lapangan harus mengamati perilaku hewan secara hening tanpa menimbulkan kepanikan."
        }
      ],
      grammarFocus: {
        topic: "Hedging Language in Scientific Observation",
        explanationEn: "In academic English (B2), researchers avoid absolute claims, using cautious hedging verbs and modal qualifiers such as 'appears to', 'seems to', 'indicates', and 'suggests'.",
        explanationId: "Dalam bahasa Inggris akademik (B2), peneliti menghindari klaim mutlak dengan menggunakan kata kerja pelindung (hedging) seperti 'appears to' (tampaknya), 'seems to', 'indicates' (mengindikasikan), dan 'suggests' (menunjukkan).",
        examples: [
          {
            en: "The specimen appears to belong to an unrecorded subspecies of sea anemone.",
            id: "Spesimen tersebut tampaknya tergolong ke dalam subspesies anemon laut yang belum pernah tercatat."
          },
          {
            en: "Preliminary data suggests that water salinity remains unusually stable across seasons.",
            id: "Data awal menunjukkan bahwa salinitas air relatif stabil di sepanjang musim."
          }
        ]
      },
      culturalTip: {
        titleEn: "Leave No Trace in Marine Sanctuaries",
        titleId: "Etika Tanpa Jejak di Suaka Terumbu Karang",
        contentEn: "Marine conservationists adhere to a strict golden rule: 'Take only data and pictures, leave only ripples, kill only time.' Touching living coral can destroy decades of fragile growth in seconds.",
        contentId: "Pencinta konservasi laut mematuhi aturan emas: 'Hanya ambil data dan foto, hanya tinggalkan riak air, hanya bunuh waktu.' Menyentuh karang hidup dapat mematikan pertumbuhan rapuh selama puluhan tahun dalam hitungan detik."
      },
      quiz: [
        {
          id: "s9_ep3_q1",
          questionEn: "Why did Maya lower the sampling vial gradually instead of throwing it quickly?",
          questionId: "Mengapa Maya menurunkan botol sampel secara perlahan bukan melemparkannya dengan cepat?",
          options: [
            "To avoid disturbing delicate seafloor sediments and clouding the water sample",
            "Because the rope was slippery and difficult to hold",
            "To give swimming fish time to bite the glass bottle",
            "Because Dr. Vance forgot the stopwatch timer on the boat"
          ],
          correctIndex: 0,
          explanationEn: "Lowering equipment steadily prevents stirring up benthic silt, ensuring pristine sample collection.",
          explanationId: "Menurunkan peranti secara perlahan mencegah teraduknya lumpur dasar laut sehingga kemurnian sampel terjaga."
        },
        {
          id: "s9_ep3_q2",
          questionEn: "Which sentence utilizes appropriate scientific 'hedging'?",
          questionId: "Kalimat mana yang memanfaatkan 'hedging' ilmiah secara tepat?",
          options: [
            "This fish is 100% undeniably the smartest animal in the whole ocean.",
            "Preliminary microscopic examination appears to indicate a higher concentration of phytoplankton.",
            "I know for a fact that the reef will never change.",
            "Everyone agrees that this coral is the best coral ever created."
          ],
          correctIndex: 1,
          explanationEn: "'Appears to indicate' is a classic academic hedging phrase that avoids dogmatic certainty.",
          explanationId: "'Appears to indicate' adalah frasa pembatas ilmiah klasik yang menghindari kepastian berlebihan sebelum pembuktian tuntas."
        },
        {
          id: "s9_ep3_q3",
          questionEn: "What does the word 'species' refer to in biological classification?",
          questionId: "Apa yang dimaksud dengan kata 'species' dalam klasifikasi biologis?",
          options: [
            "A group of living organisms consisting of similar individuals capable of exchanging genes",
            "The monetary cost of buying diving equipment",
            "The specific temperature of boiling saltwater",
            "A type of metal used to construct marine antennas"
          ],
          correctIndex: 0,
          explanationEn: "A species is the fundamental unit of biological classification comprising similar organisms that can interbreed.",
          explanationId: "Spesies adalah unit fundamental klasifikasi hayati yang terdiri atas organisme serupa yang mampu saling berkembang biak."
        },
        {
          id: "s9_ep3_q4",
          questionEn: "Why is water temperature conservation critical during specimen storage?",
          questionId: "Mengapa penjagaan suhu air sangat penting selama penyimpanan spesimen?",
          options: [
            "Sunlight and warming temperature alter delicate chemical balances and kill micro-organisms",
            "Warm water makes the glass vial crack instantly",
            "Dr. Vance dislikes touching warm bottles",
            "The local fish will get angry if the water warms up"
          ],
          correctIndex: 0,
          explanationEn: "Fluctuating thermal levels degrade biological samples and destroy plankton viability.",
          explanationId: "Perubahan suhu merusak sampel biologis dan mematikan viabilitas mikroorganisme plankton."
        },
        {
          id: "s9_ep3_q5",
          questionEn: "Which verb describes gathering scientific data or physical items systematically?",
          questionId: "Kata kerja mana yang menggambarkan mengumpulkan data ilmiah atau barang fisik secara sistematis?",
          options: [
            "collect",
            "damage",
            "separate",
            "disconnect"
          ],
          correctIndex: 0,
          explanationEn: "'Collect' means to systematically gather items or information together for analysis.",
          explanationId: "'Collect' bermakna menghimpun atau mengumpulkan data/benda secara terencana untuk analisis."
        }
      ],
      takeaways: [
        "Menerapkan teknik pengambilan sampel kelautan steril tanpa mengotori dasar laut.",
        "Menggunakan bahasa akademik pelindung (*hedging language*) seperti *appears to indicate*.",
        "Menguasai kosakata Oxford 3000: *ocean*, *species*, *creature*, *sample*, *collect*, *observe*."
      ],
      cliffhanger: "Saat kembali ke pondok lab, jarum barometer dinding anjlok drastis dan suara statis berderak keras dari radio analog..."
    },

    // EPISODE 4
    {
      id: 4,
      number: 4,
      title: "Peringatan Badai di Radio Analog",
      titleEn: "Storm Warning on the Analog Radio",
      estimatedMinutes: 8,
      recap: "Barometer stasiun jatuh ke angka terendah dalam setahun. Liam dan Maya menyetel radio gelombang pendek untuk mendengarkan siaran cuaca resmi.",
      dialogue: [
        {
          id: "s9e4_d1",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "Listen closely through the static, Maya. I am tuning our shortwave radio to the coastal weather maritime frequency at 2182 kilohertz.",
          textId: "Dengarkan baik-baik melalui suara statis ini, Maya. Saya sedang menyetel radio gelombang pendek ke frekuensi maritim cuaca pesisir di 2182 kilohertz.",
          audioText: "Listen closely through the static, Maya. I am tuning our shortwave radio to the coastal weather maritime frequency at 2182 kilohertz."
        },
        {
          id: "s9e4_d2",
          speaker: "Radio Announcer",
          speakerRole: "Meteorological Broadcast",
          textEn: "...Gale warning issued for Sector Four... Severe tropical storm accelerating eastward... Meteorologists predict wind gusts exceeding fifty knots with dangerous ocean swells...",
          textId: "...Peringatan badai dikeluarkan untuk Sektor Empat... Badai tropis parah berakselerasi ke arah timur... Ahli meteorologi memperkirakan hembusan angin melebihi lima puluh knot dengan gelombang samudra berbahaya...",
          audioText: "Gale warning issued for Sector Four. Severe tropical storm accelerating eastward. Meteorologists predict wind gusts exceeding fifty knots with dangerous ocean swells."
        },
        {
          id: "s9e4_d3",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "That puts Coral Crest Island directly in the path of the storm vortex within fourteen hours. We must initiate our Category Three preparedness plan immediately.",
          textId: "Itu menempatkan Pulau Karang Merah tepat di jalur pusaran badai dalam waktu empat belas jam. Kita harus segera memulai rencana kesiapsiagaan Kategori Tiga.",
          audioText: "That puts Coral Crest Island directly in the path of the storm vortex within fourteen hours. We must initiate our Category Three preparedness plan immediately."
        },
        {
          id: "s9e4_choice_1",
          type: "interactive_choice",
          promptEn: "What is Maya's immediate communication responsibility?",
          promptId: "Apa tanggung jawab komunikasi segera yang harus diambil Maya?",
          options: [
            {
              id: "s9e4_opt_1a",
              textEn: "Acknowledge the broadcast on the marine log and broadcast a confirmation message before atmospheric interference worsens.",
              textId: "Mencatat siaran pada log maritim dan menyiarkan pesan konfirmasi sebelum gangguan atmosfer memburuk.",
              feedbackEn: "Professional radio discipline! Mainland coast guards need to know remote teams are alert.",
              feedbackId: "Disiplin radio profesional! Penjaga pantai daratan perlu mengetahui tim terpencil dalam status siaga."
            },
            {
              id: "s9e4_opt_1b",
              textEn: "Turn off the radio immediately to save two watts of battery power.",
              textId: "Mematikan radio segera untuk menghemat daya baterai dua watt.",
              feedbackEn: "Dangerous oversight; staying tuned for radar updates is worth the minimal power cost.",
              feedbackId: "Kelalaian berbahaya; tetap memantau pembaruan radar sangat penting melampaui biaya listrik yang kecil."
            }
          ]
        },
        {
          id: "s9e4_d4",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "Good call, Maya. I have transmitted our acknowledgment. The air pressure is dropping by three millibars every hour—this weather event is arriving earlier than predicted.",
          textId: "Keputusan tepat, Maya. Saya telah mengirimkan konfirmasi penerimaan kita. Tekanan udara turun tiga milibar setiap jam—fenomena cuaca ini tiba lebih cepat dari perkiraan.",
          audioText: "Good call, Maya. I have transmitted our acknowledgment. The air pressure is dropping by three millibars every hour—this weather event is arriving earlier than predicted."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-weather",
          word: "weather",
          partOfSpeech: "noun",
          enDefinition: "The state of the atmosphere at a place and time as regards heat, dryness, sunshine, wind, rain, etc.",
          idMeaning: "cuaca, kondisi atmosfer",
          contextSentenceEn: "Severe island weather can shift from calm sunshine to torrential gale in less than an hour.",
          contextSentenceId: "Cuaca pulau yang ekstrem dapat berubah dari cerah tenang menjadi badai lebat dalam waktu kurang dari satu jam."
        },
        {
          wordId: "oxford-predict",
          word: "predict",
          partOfSpeech: "verb",
          enDefinition: "Say or estimate that (a specified thing) will happen in the future or will be a consequence of something.",
          idMeaning: "memperkirakan, meramalkan",
          contextSentenceEn: "Barometric charts help meteorologists predict maritime storms with remarkable precision.",
          contextSentenceId: "Grafik barometrik membantu ahli meteorologi memperkirakan badai maritim dengan ketepatan luar biasa."
        },
        {
          wordId: "oxford-storm",
          word: "storm",
          partOfSpeech: "noun",
          enDefinition: "A violent disturbance of the atmosphere with strong winds and usually rain, thunder, lightning, or snow.",
          idMeaning: "badai, topan kencang",
          contextSentenceEn: "The incoming storm will generate eight-meter waves crashing against the outer reef barrier.",
          contextSentenceId: "Badai yang datang akan menghasilkan ombak setinggi delapan meter yang menghantam dinding karang luar."
        },
        {
          wordId: "oxford-warning",
          word: "warning",
          partOfSpeech: "noun",
          enDefinition: "A statement or event that indicates a possible or impending danger, problem, or other unpleasant situation.",
          idMeaning: "peringatan bahaya",
          contextSentenceEn: "The naval station broadcast an urgent gale warning to all vessels at sea.",
          contextSentenceId: "Pangkalan angkatan laut menyiarkan peringatan badai mendesak kepada semua kapal di laut."
        },
        {
          wordId: "oxford-broadcast",
          word: "broadcast",
          partOfSpeech: "noun",
          enDefinition: "Transmit (a program or some information) by radio or television.",
          idMeaning: "siaran radio, menyiarkan",
          contextSentenceEn: "The national maritime agency transmitted an emergency broadcast over shortwave bands.",
          contextSentenceId: "Badan maritim nasional mengirimkan siaran darurat melalui frekuensi gelombang pendek."
        },
        {
          wordId: "oxford-frequency",
          word: "frequency",
          partOfSpeech: "noun",
          enDefinition: "The rate at which a vibration occurs that constitutes a wave, either in a material or in an electromagnetic field.",
          idMeaning: "frekuensi gelombang radio",
          contextSentenceEn: "In case of primary radio failure, the secondary frequency is set to channel sixteen.",
          contextSentenceId: "Jika radio utama mengalami kegagalan, frekuensi sekunder dialihkan ke saluran enam belas."
        }
      ],
      grammarFocus: {
        topic: "Reported Speech with Scientific Verbs of Announcement",
        explanationEn: "In formal reports (B2), information from broadcasts is relayed using reporting verbs such as 'warned that', 'predicted that', 'confirmed that', with necessary tense backshifting.",
        explanationId: "Dalam laporan formal (B2), informasi dari siaran disampaikan menggunakan kata kerja pelapor seperti 'warned that' (memperingatkan bahwa), 'predicted that' (memperkirakan bahwa), dan penyesuaian kala waktu lampau (*backshifting*).",
        examples: [
          {
            en: "The announcer stated that wind gusts would exceed fifty knots by midnight.",
            id: "Penyiar menyatakan bahwa hembusan angin akan melampaui lima puluh knot menjelang tengah malam."
          },
          {
            en: "Meteorologists warned that low atmospheric pressure indicated an intensifying cyclone.",
            id: "Ahli meteorologi memperingatkan bahwa tekanan atmosfer yang rendah mengindikasikan siklon yang kian menguat."
          }
        ]
      },
      culturalTip: {
        titleEn: "Maritime Radio Phonetic Alphabet & Etiquette",
        titleId: "Alfabet Fonetis & Etika Radio Maritim Internasional",
        contentEn: "Over static-filled radio frequencies, numbers and call signs are spelled using NATO phonetic conventions (Alpha, Bravo, Charlie) to prevent fatal misinterpretations during coastal emergencies.",
        contentId: "Melalui frekuensi radio yang penuh gangguan statis, angka dan kode panggilan dieja menggunakan konvensi fonetis NATO (Alpha, Bravo, Charlie) untuk mencegah salah tafsir fatal selama keadaan darurat pesisir."
      },
      quiz: [
        {
          id: "s9_ep4_q1",
          questionEn: "What critical message was broadcast over the radio frequency?",
          questionId: "Pesan penting apa yang disiarkan melalui frekuensi radio?",
          options: [
            "A gale warning predicting a severe tropical storm heading directly toward the island",
            "A musical concert sponsored by a mainland radio station",
            "An announcement that Captain Riko had arrived back in the city harbor",
            "An advertisement for new high-tech solar panels"
          ],
          correctIndex: 0,
          explanationEn: "The maritime radio issued a Category Three gale warning with wind gusts exceeding fifty knots.",
          explanationId: "Radio maritim mengeluarkan peringatan badai Kategori Tiga dengan hembusan angin melampaui lima puluh knot."
        },
        {
          id: "s9_ep4_q2",
          questionEn: "Which reporting sentence correctly backshifts the announcer's words: 'A severe storm is accelerating'?",
          questionId: "Kalimat pelaporan mana yang secara tepat menyesuaikan kala waktu ucapan penyiar: 'A severe storm is accelerating'?",
          options: [
            "The announcer warned that a severe storm was accelerating.",
            "The announcer warns that a severe storm will been accelerating.",
            "The announcer has warning that a storm is accelerates.",
            "The announcer said a storm would be accelerating yesterday."
          ],
          correctIndex: 0,
          explanationEn: "In standard indirect reported speech, 'is accelerating' backshifts to past continuous 'was accelerating'.",
          explanationId: "Dalam kalimat tidak langsung standar, present continuous 'is accelerating' mundur menjadi past continuous 'was accelerating'."
        },
        {
          id: "s9_ep4_q3",
          questionEn: "Why is a rapid drop in barometric air pressure significant in meteorology?",
          questionId: "Mengapa penurunan drastis pada tekanan udara barometrik sangat signifikan dalam meteorologi?",
          options: [
            "It indicates an intensifying low-pressure system and incoming violent weather",
            "It means the weather will be sunny and warm all week",
            "It shows that the batteries in the barometer are empty",
            "It proves that the ocean water is evaporating into thin air"
          ],
          correctIndex: 0,
          explanationEn: "A steep fall in barometric pressure is a definitive physical indicator of an approaching cyclone or severe storm.",
          explanationId: "Penurunan tajam pada tekanan barometer adalah indikator fisik pasti dari mendekatnya siklon atau badai dahsyat."
        },
        {
          id: "s9_ep4_q4",
          questionEn: "What is the primary meaning of the noun 'frequency' in telecommunications?",
          questionId: "Apa arti utama dari kata benda 'frequency' dalam telekomunikasi?",
          options: [
            "The rate of electromagnetic wave oscillation designating a specific radio communication band",
            "How often a person eats lunch during field work",
            "The volume level of a loudspeaker",
            "The thickness of a copper wire"
          ],
          correctIndex: 0,
          explanationEn: "Frequency designates the specific electromagnetic carrier band (in kHz or MHz) used for radio transmissions.",
          explanationId: "Frekuensi menunjukkan pita pembawa elektromagnetik tertentu (dalam kHz atau MHz) yang dipakai untuk transmisi radio."
        },
        {
          id: "s9_ep4_q5",
          questionEn: "What action did Maya and Liam take after hearing the emergency warning?",
          questionId: "Tindakan apa yang diambil Maya dan Liam setelah mendengar peringatan darurat?",
          options: [
            "Logged the bulletin and transmitted a formal radio acknowledgment before interference worsened",
            "Packed their bags and jumped into the ocean to swim away",
            "Turned off the radio and went to sleep",
            "Built a campfire on the beach"
          ],
          correctIndex: 0,
          explanationEn: "Transmitting acknowledgment ensures maritime search-and-rescue centers know the island station is informed.",
          explanationId: "Mengirimkan konfirmasi penerimaan memastikan pusat pencarian dan pertolongan maritim tahu bahwa stasiun pulau telah waspada."
        }
      ],
      takeaways: [
        "Memantau dan mendokumentasikan siaran frekuensi maritim darurat secara berdisiplin.",
        "Menggunakan kalimat pelaporan tidak langsung (*reported speech*) dengan *backshifting* akurat.",
        "Menguasai kosakata Oxford 3000: *weather*, *predict*, *storm*, *warning*, *broadcast*, *frequency*."
      ],
      cliffhanger: "Angin kencang mulai mengguncang atap seng stasiun riset saat malam turun, dan tirai badai harus segera dipasang..."
    },

    // EPISODE 5
    {
      id: 5,
      number: 5,
      title: "Protokol Kesiapsiagaan Badai",
      titleEn: "Storm Preparedness & Third Conditionals",
      estimatedMinutes: 8,
      recap: "Tim bekerja di bawah terpaan angin kencang untuk mengamankan laboratorium, memindahkan pasokan makanan, dan membentengi dinding stasiun.",
      dialogue: [
        {
          id: "s9e5_d1",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Team, we must secure every loose item outside! If we had checked the roof lashings yesterday morning, we wouldn't be struggling against gale-force gusts right now.",
          textId: "Tim, kita harus mengamankan setiap barang yang longgar di luar! Seandainya kita telah memeriksa ikatan atap kemarin pagi, kita tidak akan kesulitan melawan hembusan angin kencang sekarang.",
          audioText: "Team, we must secure every loose item outside. If we had checked the roof lashings yesterday morning, we would not be struggling against gale force gusts right now."
        },
        {
          id: "s9e5_d2",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "Liam and I have moved all potable water containers and the medical emergency supply boxes inside the concrete bunker.",
          textId: "Liam dan saya telah memindahkan semua wadah air minum dan kotak pasokan darurat medis ke dalam bunker beton.",
          audioText: "Liam and I have moved all potable water containers and the medical emergency supply boxes inside the concrete bunker."
        },
        {
          id: "s9e5_d3",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "I also bolted heavy plywood shutters over the lab glass to prevent flying debris from shattering our incubation tanks.",
          textId: "Saya juga telah membaut penutup kayu lapis tebal di atas kaca lab untuk mencegah serpihan beterbangan memecahkan tangki inkubasi kita.",
          audioText: "I also bolted heavy plywood shutters over the lab glass to prevent flying debris from shattering our incubation tanks."
        },
        {
          id: "s9e5_choice_1",
          type: "interactive_choice",
          promptEn: "What final defensive measure should Maya check before sealing the bunker doors?",
          promptId: "Tindakan pengamanan terakhir apa yang harus diperiksa Maya sebelum menutup pintu bunker rapat-rapat?",
          options: [
            {
              id: "s9e5_opt_1a",
              textEn: "Verify that drainage trenches around the perimeter are clear to protect the foundation from torrential flooding.",
              textId: "Memastikan parit drainase di sekeliling pondasi bersih untuk melindungi pondasi dari banjir bandang.",
              feedbackEn: "Crucial foresight! Unblocked trenches keep rising water out of electrical conduits.",
              feedbackId: "Kewaspadaan krusial! Parit yang lancar mencegah naiknya air ke saluran pipa listrik."
            },
            {
              id: "s9e5_opt_1b",
              textEn: "Leave the rear door slightly cracked open to let fresh air circulate during the gale.",
              textId: "Membiarkan pintu belakang terbuka sedikit agar udara segar mengalir selama badai.",
              feedbackEn: "Catastrophic mistake! High wind can rip doors off hinges and flood the room.",
              feedbackId: "Kesalahan fatal! Angin kencang dapat merobek pintu dari engselnya dan membanjiri ruangan."
            }
          ]
        },
        {
          id: "s9e5_d4",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Excellent thinking, Maya. The trenches will channel runoff directly into the mangroves. Now, let us batten down the hatches and wait out this tempest.",
          textId: "Pemikiran yang luar biasa, Maya. Parit itu akan mengalirkan limpasan langsung ke hutan bakau. Sekarang, mari kita kunci semua palka rapat-rapat dan menunggu badai ini reda.",
          audioText: "Excellent thinking, Maya. The trenches will channel runoff directly into the mangroves. Now, let us batten down the hatches and wait out this tempest."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-protect",
          word: "protect",
          partOfSpeech: "verb",
          enDefinition: "Keep safe from harm or injury.",
          idMeaning: "melindungi, menjaga keamanan",
          contextSentenceEn: "Heavy wooden shutters protect the laboratory windows against high-velocity gale debris.",
          contextSentenceId: "Penutup kayu tebal melindungi jendela laboratorium dari serpihan badai berkecepatan tinggi."
        },
        {
          wordId: "oxford-secure",
          word: "secure",
          partOfSpeech: "verb",
          enDefinition: "Fix or fasten (something) so that it cannot move, fall, or become loose.",
          idMeaning: "mengencangkan, mengunci kuat",
          contextSentenceEn: "Researchers used steel wire cables to secure the outdoor generator to its concrete base.",
          contextSentenceId: "Para peneliti menggunakan kabel kawat baja untuk mengunci generator luar ke fondasi betonnya."
        },
        {
          wordId: "oxford-condition",
          word: "condition",
          partOfSpeech: "noun",
          enDefinition: "The state of something, especially with regard to its appearance, quality, or working order.",
          idMeaning: "kondisi, keadaan lingkungan",
          contextSentenceEn: "Under severe storm conditions, all non-essential activities must be halted immediately.",
          contextSentenceId: "Dalam kondisi badai parah, semua kegiatan yang tidak mendesak harus dihentikan seketika."
        },
        {
          wordId: "oxford-prevent",
          word: "prevent",
          partOfSpeech: "verb",
          enDefinition: "Keep (something) from happening or arising.",
          idMeaning: "mencegah terjadinya kerusakan/musibah",
          contextSentenceEn: "Clearing sand from drainage canals helps prevent sudden flash flooding inside the bunkhouse.",
          contextSentenceId: "Membersihkan pasir dari saluran drainase membantu mencegah banjir bandang mendadak di dalam barak."
        },
        {
          wordId: "oxford-emergency",
          word: "emergency",
          partOfSpeech: "noun",
          enDefinition: "A serious, unexpected, and often dangerous situation requiring immediate action.",
          idMeaning: "keadaan darurat krisis",
          contextSentenceEn: "The station keeps a sealed emergency kit containing flares, rations, and first-aid supplies.",
          contextSentenceId: "Stasiun menyimpan kotak darurat bersegel yang berisi suar, ransum makanan, dan pasokan pertolongan pertama."
        },
        {
          wordId: "oxford-supply",
          word: "supply",
          partOfSpeech: "noun",
          enDefinition: "A stock of a resource from which a person or place can be provided with the necessary amount of that resource.",
          idMeaning: "pasokan logistik, persediaan",
          contextSentenceEn: "Our freshwater supply must be rationed strictly until the storm passes and rainfall can be harvested.",
          contextSentenceId: "Pasokan air tawar kita harus dihemat ketat sampai badai mereda dan air hujan dapat dipanen."
        }
      ],
      grammarFocus: {
        topic: "Third Conditionals & Mixed Conditionals for Hypothetical Reflection",
        explanationEn: "Third conditional describes unreal past situations ('If we had done X, Y would have happened'). Mixed conditionals connect a past hypothetical event with a present state of affairs ('If we had secured the roof, we wouldn't be struggling right now').",
        explanationId: "Third Conditional menjelaskan situasi masa lalu yang tidak terjadi ('If we had done X, Y would have happened'). Mixed Conditional menghubungkan pengandaian masa lalu dengan kondisi nyata di masa sekarang ('If we had secured the roof, we wouldn't be struggling right now').",
        examples: [
          {
            en: "If they had not reinforced the wooden dock, the waves would have smashed it completely.",
            id: "Seandainya mereka tidak memperkuat dermaga kayu itu, ombak pasti sudah menghancurkannya sama sekali."
          },
          {
            en: "If Liam had charged the satellite phone yesterday, we would be in communication right now.",
            id: "Seandainya Liam telah mengisi daya telepon satelit kemarin, kita akan terhubung dalam komunikasi saat ini."
          }
        ]
      },
      culturalTip: {
        titleEn: "Batten Down the Hatches: Etymology & Nautical Origin",
        titleId: "Asal Usul Ungkapan Maritim 'Batten Down the Hatches'",
        contentEn: "Originally a 19th-century naval command where wooden battens were nailed over ship cargo hatchways to seal them against incoming storm surges, the phrase today universally means preparing resolutely for an impending crisis.",
        contentId: "Berasal dari instruksi pelaut abad ke-19 saat bilah kayu dipakukan di atas palka kargo kapal untuk menyegelnya dari amukan ombak, ungkapan ini kini bermakna bersiap siaga dengan kokoh menghadapi krisis yang akan datang."
      },
      quiz: [
        {
          id: "s9_ep5_q1",
          questionEn: "Which sentence correctly illustrates a Mixed Conditional (past condition affecting present reality)?",
          questionId: "Kalimat mana yang secara tepat menggambarkan Mixed Conditional (kondisi masa lalu yang mempengaruhi realitas sekarang)?",
          options: [
            "If we had inspected the roof yesterday, we wouldn't be struggling against the wind right now.",
            "If we inspect the roof, we are struggling right now.",
            "If we would inspect the roof, we had struggled.",
            "If we will inspect the roof, we struggle tomorrow."
          ],
          correctIndex: 0,
          explanationEn: "'If we had inspected (past perfect), we wouldn't be struggling (modal + be + present participle)' represents a classic mixed conditional.",
          explanationId: "'If we had inspected (past perfect), we wouldn't be struggling (modal + be + present participle)' adalah bentuk baku mixed conditional yang menghubungkan pengandaian lampau dengan kondisi saat ini."
        },
        {
          id: "s9_ep5_q2",
          questionEn: "Why did Maya verify the perimeter drainage trenches before sealing the bunker?",
          questionId: "Mengapa Maya memeriksa parit drainase sekeliling sebelum menyegel bunker?",
          options: [
            "To prevent torrential rainwater runoff from pooling and flooding the station foundation",
            "To hide her scientific notebooks in the sand",
            "To look for sea crabs for dinner",
            "To make sure Captain Riko's boat could float through the trenches"
          ],
          correctIndex: 0,
          explanationEn: "Clear drainage trenches channel torrential rain safely toward the sea without eroding building foundations.",
          explanationId: "Parit drainase yang lancar mengalirkan air hujan deras secara aman ke laut tanpa mengikis pondasi bangunan."
        },
        {
          id: "s9_ep5_q3",
          questionEn: "What items were transported inside the concrete bunker for protection?",
          questionId: "Barang-barang apa yang dipindahkan ke dalam bunker beton demi perlindungan?",
          options: [
            "Potable drinking water containers and medical emergency supply kits",
            "Wet beach towels and old flip-flops",
            "A broken television set from the mainland",
            "Dr. Vance's souvenir seashell collection"
          ],
          correctIndex: 0,
          explanationEn: "Critical survival supplies—drinking water and medical emergency kits—take highest priority during typhoon defense.",
          explanationId: "Pasokan penunjang hidup vital—air minum dan kotak medis darurat—menjadi prioritas tertinggi selama pertahanan menghadapi topan."
        },
        {
          id: "s9_ep5_q4",
          questionEn: "Which verb means 'to keep something from happening or arising'?",
          questionId: "Kata kerja mana yang bermakna 'menjaga agar sesuatu tidak terjadi atau timbul'?",
          options: [
            "prevent",
            "observe",
            "collect",
            "damage"
          ],
          correctIndex: 0,
          explanationEn: "'Prevent' means to take proactive steps so an undesirable event does not occur.",
          explanationId: "'Prevent' bermakna melakukan tindakan proaktif untuk mencegah terjadinya hal yang tidak diinginkan."
        },
        {
          id: "s9_ep5_q5",
          questionEn: "What is the historical meaning of 'batten down the hatches'?",
          questionId: "Apa makna historis dari 'batten down the hatches'?",
          options: [
            "Fastening tarpaulins and wooden strips over ship openings to seal them against storm seas",
            "Eating all available ship biscuits before they spoil",
            "Lighting flares from the top mast to summon neighboring ships",
            "Lowering lifeboats into the water during calm breezes"
          ],
          correctIndex: 0,
          explanationEn: "In maritime history, battens were wooden slats used to secure canvas covers tightly over open deck hatches.",
          explanationId: "Dalam sejarah maritim, battens adalah bilah kayu penekan yang digunakan untuk mengunci terpal penutup palka kapal secara rapat dari hempasan ombak."
        }
      ],
      takeaways: [
        "Menerapkan pengamanan fasilitas pulau terpencil dari bahaya angin topan dan banjir.",
        "Menggunakan konstruksi *Third & Mixed Conditionals* untuk evaluasi logis retrospektif.",
        "Menguasai kosakata Oxford 3000: *protect*, *secure*, *condition*, *prevent*, *emergency*, *supply*."
      ],
      cliffhanger: "Badai mengamuk semalaman dengan guntur memekakkan telinga. Saat fajar menyingsing, pantai dipenuhi puing-puing dan seekor penyu belimbing raksasa terdampar..."
    },

    // EPISODE 6
    {
      id: 6,
      number: 6,
      title: "Menyelamatkan Penyu Belimbing di Pesisir Karang",
      titleEn: "The Leatherback Sea Turtle Rescue",
      estimatedMinutes: 8,
      recap: "Setelah badai reda, Maya dan Dr. Vance berpatroli di garis pantai dan menemukan penyu belimbing besar yang terlilit jaring hanyut terbengkalai.",
      dialogue: [
        {
          id: "s9e6_d1",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "Dr. Vance! Over by the limestone outcrop! A massive leatherback turtle is stranded in the intertidal zone, unable to crawl back toward the surf.",
          textId: "Dr. Vance! Di dekat tonjolan batu kapur! Seekor penyu belimbing raksasa terdampar di zona pasang surut, tidak mampu merangkak kembali ke arah deburan ombak.",
          audioText: "Dr. Vance! Over by the limestone outcrop! A massive leatherback turtle is stranded in the intertidal zone, unable to crawl back toward the surf."
        },
        {
          id: "s9e6_d2",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Look at its flippers. A discarded nylon fishing net has tangled tightly around its neck and front limbs. If we don't cut it free immediately, dehydration and pressure will kill it.",
          textId: "Lihat siripnya. Jaring pancing nilon terbengkalai telah melilit leher dan kaki depannya dengan kencang. Jika kita tidak memotongnya segera, dehidrasi dan tekanan akan membunuhnya.",
          audioText: "Look at its flippers. A discarded nylon fishing net has tangled tightly around its neck and front limbs. If we do not cut it free immediately, dehydration and pressure will kill it."
        },
        {
          id: "s9e6_d3",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "I brought our trauma shears and damp towels. We must keep its carapace moist and be extremely careful not to injure its soft shell.",
          textId: "Saya membawa gunting trauma medis dan handuk basah. Kita harus menjaga karapasnya tetap lembap dan sangat berhati-hati agar tidak melukai cangkang lunaknya.",
          audioText: "I brought our trauma shears and damp towels. We must keep its carapace moist and be extremely careful not to injure its soft shell."
        },
        {
          id: "s9e6_choice_1",
          type: "interactive_choice",
          promptEn: "How does Maya approach the stressed animal to assist in the rescue?",
          promptId: "Bagaimana cara Maya mendekati hewan yang stres itu untuk membantu penyelamatan?",
          options: [
            {
              id: "s9e6_opt_1a",
              textEn: "Approach calmly from behind its line of sight, covering its eyes gently with a wet cloth to reduce stress while Liam slices the net.",
              textId: "Mendekat dengan tenang dari belakang garis pandangnya, menutup matanya secara lembut dengan kain basah untuk meredakan stres sementara Liam menggunting jaring.",
              feedbackEn: "Exemplary wildlife rescue technique! Darkness calms stranded reptiles.",
              feedbackId: "Teknik penyelamatan satwa liar yang patut dicontoh! Kegelapan menenangkan reptil yang terdampar."
            },
            {
              id: "s9e6_opt_1b",
              textEn: "Pull vigorously on the fishing net with both hands to snap the nylon cords by force.",
              textId: "Menarik jaring pancing dengan kuat menggunakan kedua tangan untuk memutuskan tali nilon secara paksa.",
              feedbackEn: "Dangerous! Pulling hard cuts deep lacerations into the turtle's flippers.",
              feedbackId: "Berbahaya! Menarik kencang akan menimbulkan luka sayatan dalam pada sirip penyu."
            }
          ]
        },
        {
          id: "s9e6_d4",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "The final cord is severed! The wounds are superficial. Let us guide the turtle gently down the sandbank and watch it release back into the rolling waves.",
          textId: "Tali terakhir telah terputus! Lukanya hanya di permukaan. Mari kita pandu penyu ini dengan hati-hati menuruni gundukan pasir dan melihatnya lepas kembali ke gulungan ombak.",
          audioText: "The final cord is severed! The wounds are superficial. Let us guide the turtle gently down the sandbank and watch it release back into the rolling waves."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-rescue",
          word: "rescue",
          partOfSpeech: "verb",
          enDefinition: "Save (someone or something) from a dangerous or distressing situation.",
          idMeaning: "menyelamatkan, mengevakuasi",
          contextSentenceEn: "The conservation team rushed to rescue the stranded marine turtle before the midday sun intensified.",
          contextSentenceId: "Tim konservasi bergegas menyelamatkan penyu laut yang terdampar sebelum terik matahari siang menguat."
        },
        {
          wordId: "oxford-catch",
          word: "catch",
          partOfSpeech: "verb",
          enDefinition: "Intercept and hold (something moving) or entangle in a trap or net.",
          idMeaning: "menjerat, menangkap",
          contextSentenceEn: "Discarded ghost nets can catch and drown non-target ocean wildlife for years.",
          contextSentenceId: "Jaring hantu yang terbengkalai dapat menjerat dan menenggelamkan satwa laut non-sasaran selama bertahun-tahun."
        },
        {
          wordId: "oxford-net",
          word: "net",
          partOfSpeech: "noun",
          enDefinition: "A piece of open-meshed material made of twine, cord, or rope, used especially for catching fish.",
          idMeaning: "jaring jala nelayan",
          contextSentenceEn: "Liam used heavy medical shears to slice through the industrial nylon net.",
          contextSentenceId: "Liam menggunakan gunting medis tebal untuk memotong jaring nilon industri tersebut."
        },
        {
          wordId: "oxford-injure",
          word: "injure",
          partOfSpeech: "verb",
          enDefinition: "Do physical harm or damage to (someone or something).",
          idMeaning: "melukai, mencederai fisik",
          contextSentenceEn: "Tangled monofilament lines can severely injure the soft skin around a turtle's neck.",
          contextSentenceId: "Tali senar yang melilit dapat melukai kulit lembut di sekitar leher penyu secara parah."
        },
        {
          wordId: "oxford-careful",
          word: "careful",
          partOfSpeech: "adjective",
          enDefinition: "Making sure of avoiding potential danger, mishap, or harm; cautious.",
          idMeaning: "berhati-hati, cermat dan waspada",
          contextSentenceEn: "Rescuers must be extremely careful when handling distressed wild creatures on open beaches.",
          contextSentenceId: "Para penyelamat harus sangat berhati-hati saat menangani satwa liar yang tertekan di pantai terbuka."
        },
        {
          wordId: "oxford-release",
          word: "release",
          partOfSpeech: "verb",
          enDefinition: "Allow or enable to escape from confinement; set free.",
          idMeaning: "melepaskan kembali ke habitat bebas",
          contextSentenceEn: "Once freed from the netting, the team helped release the turtle into the incoming tide.",
          contextSentenceId: "Setelah terbebas dari jeratan jaring, tim membantu melepaskan penyu tersebut ke air pasang yang datang."
        }
      ],
      grammarFocus: {
        topic: "Participle Clauses for Simultaneous and Sequential Action",
        explanationEn: "Present and past participle clauses ('Covering its eyes...', 'Once freed from the tangle...') condense narratives by showing how two actions occur simultaneously or in rapid sequence.",
        explanationId: "Participle clauses ('Covering its eyes...', 'Once freed from the tangle...') meringkas alur naratif dengan menunjukkan bagaimana dua tindakan terjadi serempak atau secara beruntun dalam satu kalimat elegan.",
        examples: [
          {
            en: "Approaching from behind, Maya shielded the turtle's eyes to minimize stress.",
            id: "Mendekati dari arah belakang, Maya melindungi mata penyu untuk meminimalkan stres."
          },
          {
            en: "Having cut the final knot, the researchers watched the animal crawl vigorously into the foam.",
            id: "Setelah memotong simpul terakhir, para peneliti menyaksikan hewan itu merangkak dengan penuh tenaga menuju buih ombak."
          }
        ]
      },
      culturalTip: {
        titleEn: "Ghost Nets: The Silent Ocean Threat",
        titleId: "Jaring Hantu: Ancaman Senyap di Lautan Bebas",
        contentEn: "Over 640,000 tons of commercial fishing gear is lost or dumped in world oceans annually. Known as 'ghost gear', these synthetic nets drift for decades, silently entangling turtles, sharks, and marine mammals until volunteer teams intervene.",
        contentId: "Lebih dari 640.000 ton perlengkapan memancing komersial hilang atau dibuang di samudra setiap tahun. Dikenal sebagai 'jaring hantu', jaring sintetis ini terapung selama puluhan tahun, senyap menjerat penyu, hiu, dan mamalia laut hingga tim relawan turun tangan."
      },
      quiz: [
        {
          id: "s9_ep6_q1",
          questionEn: "Why did Maya place a damp cloth over the stranded turtle's eyes?",
          questionId: "Mengapa Maya meletakkan kain lembap di atas mata penyu yang terdampar?",
          options: [
            "To obscure its vision and soothe its sensory stress while Liam cut the net",
            "To wash sand out of its mouth",
            "Because the turtle asked for sunglasses",
            "To test the absorption capability of the field towels"
          ],
          correctIndex: 0,
          explanationEn: "Covering a stranded sea turtle's eyes minimizes visual stimulation and significantly lowers its stress hormones.",
          explanationId: "Menutup mata penyu laut yang terdampar meminimalkan stimulasi visual dan menurunkan hormon stres secara signifikan."
        },
        {
          id: "s9_ep6_q2",
          questionEn: "Which sentence correctly demonstrates a present participle clause?",
          questionId: "Kalimat mana yang secara tepat menunjukkan present participle clause?",
          options: [
            "Kneeling by the wet sand, Liam carefully cut the constricting nylon cords.",
            "Liam kneels by the wet sand and Liam cut the cord.",
            "Liam was kneeling because Liam is cutting cord.",
            "To kneel by sand, Liam cuts cord."
          ],
          correctIndex: 0,
          explanationEn: "'Kneeling by the wet sand, ...' is a classic participial clause modifying the subject 'Liam'.",
          explanationId: "'Kneeling by the wet sand, ...' adalah participial clause klasik yang memodifikasi subjek 'Liam' secara elegan."
        },
        {
          id: "s9_ep6_q3",
          questionEn: "What is 'ghost gear' in marine conservation?",
          questionId: "Apa yang dimaksud dengan 'ghost gear' dalam konservasi kelautan?",
          options: [
            "Abandoned, lost, or discarded commercial fishing nets that continue to entangle marine animals",
            "High-tech scuba diving suits used for nighttime photography",
            "A fictional pirate ship seen during stormy weather",
            "Equipment left behind by ancient island inhabitants"
          ],
          correctIndex: 0,
          explanationEn: "Ghost gear refers to abandoned fishing equipment that indefinitely catches and kills non-target marine life.",
          explanationId: "Ghost gear merujuk pada alat tangkap ikan terbengkalai yang terus-menerus menjerat dan membunuh satwa laut non-sasaran tanpa henti."
        },
        {
          id: "s9_ep6_q4",
          questionEn: "Why was pulling vigorously on the net prohibited?",
          questionId: "Mengapa menarik jaring dengan kencang dilarang?",
          options: [
            "Because taut nylon cords would slice deeply into the animal's flesh and flippers",
            "Because it would break Maya's fingernails",
            "Because the net was very expensive to purchase",
            "Because Dr. Vance wanted to keep the net as a whole blanket"
          ],
          correctIndex: 0,
          explanationEn: "Forcibly pulling tight nylon creates deep lacerations and can amputate flippers.",
          explanationId: "Menarik kencang jaring nilon yang tegang dapat menciptakan luka sayatan dalam bahkan memotong sirip hewan."
        },
        {
          id: "s9_ep6_q5",
          questionEn: "Which verb describes letting an animal go back into the wild?",
          questionId: "Kata kerja mana yang menggambarkan melepaskan hewan kembali ke alam liar?",
          options: [
            "release",
            "catch",
            "injure",
            "damage"
          ],
          correctIndex: 0,
          explanationEn: "'Release' means to set free from restraint or captivity into its natural habitat.",
          explanationId: "'Release' bermakna membebaskan dari ikatan atau penangkaran menuju habitat alaminya."
        }
      ],
      takeaways: [
        "Menerapkan pertolongan pertama pada satwa laut yang terlilit sampah jaring nilon tanpa mencederainya.",
        "Menggunakan konstruksi *Participle Clauses* untuk narasi tindakan yang dinamis.",
        "Menguasai kosakata Oxford 3000: *rescue*, *catch*, *net*, *injure*, *careful*, *release*."
      ],
      cliffhanger: "Penyu itu selamat berenang ke laut lepas, namun saat Liam memeriksa menara pemancar stasiun, antena utama telah patah tersapu badai..."
    },

    // EPISODE 7
    {
      id: 7,
      number: 7,
      title: "Navigasi Bintang Bersama Kapten Riko",
      titleEn: "Celestial Navigation with Captain Riko",
      estimatedMinutes: 8,
      recap: "Kapten Riko berlabuh kembali di teluk kecil setelah berlindung dari badai dan mengajari tim cara membaca rute laut menggunakan formasi bintang malam.",
      dialogue: [
        {
          id: "s9e7_d1",
          speaker: "Captain Riko",
          speakerRole: "Ferry Captain",
          textEn: "Ahoy, team! I weathered the squall behind the lee of Turtle Atoll. I see your communication antenna snapped, so you could not broadcast your status.",
          textId: "Halo, tim! Saya berlindung dari amukan badai di balik sisi terlindung Atol Penyu. Saya lihat antena komunikasi kalian patah, jadi kalian tidak bisa menyiarkan status kalian.",
          audioText: "Ahoy, team! I weathered the squall behind the lee of Turtle Atoll. I see your communication antenna snapped, so you could not broadcast your status."
        },
        {
          id: "s9e7_d2",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "Captain Riko! We are immensely relieved to see your wooden vessel intact. How did you navigate through that pitch-black sea without GPS or radar?",
          textId: "Kapten Riko! Kami sangat lega melihat perahu kayu Anda utuh. Bagaimana Anda menavigasi laut yang gelap gulita itu tanpa GPS atau radar?",
          audioText: "Captain Riko! We are immensely relieved to see your wooden vessel intact. How did you navigate through that pitch-black sea without GPS or radar?"
        },
        {
          id: "s9e7_d3",
          speaker: "Captain Riko",
          speakerRole: "Ferry Captain",
          textEn: "Look up at the clear night sky, Maya. The Southern Cross points our direction. Once you understand celestial geometry, every star becomes an unfailing guide.",
          textId: "Tengadahlah ke langit malam yang cerah, Maya. Salib Selatan menunjukkan arah kita. Begitu kamu memahami geometri langit, setiap bintang menjadi pemandu yang tak pernah salah.",
          audioText: "Look up at the clear night sky, Maya. The Southern Cross points our direction. Once you understand celestial geometry, every star becomes an unfailing guide."
        },
        {
          id: "s9e7_choice_1",
          type: "interactive_choice",
          promptEn: "What question does Maya ask to understand traditional navigation?",
          promptId: "Pertanyaan apa yang diajukan Maya untuk memahami navigasi tradisional?",
          options: [
            {
              id: "s9e7_opt_1a",
              textEn: "How do you calculate our exact geographic position when heavy clouds briefly obscure the constellation?",
              textId: "Bagaimana cara Anda menghitung posisi geografis presisi kita saat awan tebal sempat menutupi rasi bintang?",
              feedbackEn: "Brilliant maritime inquiry! Captain Riko smiles warmly at your inquisitiveness.",
              feedbackId: "Pertanyaan maritim yang cemerlang! Kapten Riko tersenyum hangat atas rasa ingin tahu Anda."
            },
            {
              id: "s9e7_opt_1b",
              textEn: "Isn't it much easier to simply wait until someone invents a smartphone app for that?",
              textId: "Bukankah jauh lebih mudah menunggu sampai seseorang membuat aplikasi ponsel cerdas untuk itu?",
              feedbackEn: "A humorous but unhelpful remark in an off-grid scenario.",
              feedbackId: "Komentar yang menggelitik namun kurang relevan dalam skenario tanpa listrik/sinyal."
            }
          ]
        },
        {
          id: "s9e7_d4",
          speaker: "Captain Riko",
          speakerRole: "Ferry Captain",
          textEn: "When clouds hide the stars, we read the swell pattern of the waves. The ocean has memory. If you listen to its pulse, you can sail any route safely home.",
          textId: "Saat awan menyembunyikan bintang-bintang, kami membaca pola alun gelombang. Samudra memiliki ingatan. Jika kamu mendengarkan denyutnya, kamu bisa melayari rute apa pun pulang dengan selamat.",
          audioText: "When clouds hide the stars, we read the swell pattern of the waves. The ocean has memory. If you listen to its pulse, you can sail any route safely home."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-route",
          word: "route",
          partOfSpeech: "noun",
          enDefinition: "A way or course taken in getting from a starting point to a destination.",
          idMeaning: "rute pelayaran, jalur perjalanan",
          contextSentenceEn: "Captain Riko charted a safe coastal route between the treacherous submerged coral heads.",
          contextSentenceId: "Kapten Riko memetakan rute pesisir yang aman di antara gugusan karang bawah laut yang berbahaya."
        },
        {
          wordId: "oxford-direction",
          word: "direction",
          partOfSpeech: "noun",
          enDefinition: "A course along which someone or something moves.",
          idMeaning: "arah perjalanan, mata angin",
          contextSentenceEn: "Navigators use the Southern Cross to establish true southerly direction without electronic compasses.",
          contextSentenceId: "Para navigator menggunakan rasi Salib Selatan untuk menetapkan arah selatan sejati tanpa kompas elektronik."
        },
        {
          wordId: "oxford-night",
          word: "night",
          partOfSpeech: "noun",
          enDefinition: "The period of darkness in each twenty-four hours; the time from sunset to sunrise.",
          idMeaning: "malam hari, kegelapan malam",
          contextSentenceEn: "On a moonless night at sea, the horizon blends seamlessly into the starlit sky.",
          contextSentenceId: "Pada malam tanpa bulan di tengah laut, garis cakrawala menyatu sempurna dengan langit bertabur bintang."
        },
        {
          wordId: "oxford-guide",
          word: "guide",
          partOfSpeech: "noun",
          enDefinition: "A person or thing that shows the way or directs the movement of others.",
          idMeaning: "pemandu arah, petunjuk jalan",
          contextSentenceEn: "Ancient Polynesian voyagers used ocean swell patterns as a reliable navigational guide.",
          contextSentenceId: "Penjelajah Polinesia purba menggunakan pola alun samudra sebagai pemandu navigasi yang andal."
        },
        {
          wordId: "oxford-position",
          word: "position",
          partOfSpeech: "noun",
          enDefinition: "A place where someone or something is located or has been put.",
          idMeaning: "posisi koordinat geografis",
          contextSentenceEn: "By measuring the altitude of Polaris or the Southern Cross, a mariner determines latitude position.",
          contextSentenceId: "Dengan mengukur ketinggian sudut bintang kutub atau Salib Selatan, pelaut menentukan posisi garis lintang."
        },
        {
          wordId: "oxford-sail",
          word: "sail",
          partOfSpeech: "verb",
          enDefinition: "Travel in a boat or ship, especially by using sails or power.",
          idMeaning: "berlayar, mengarungi laut",
          contextSentenceEn: "Experienced captains can sail through shallow reefs by reading subtle water color variations.",
          contextSentenceId: "Kapten berpengalaman dapat berlayar melintasi terumbu dangkal dengan membaca variasi warna air yang samar."
        }
      ],
      grammarFocus: {
        topic: "Negative Inversion for High-Register Narrative Impact",
        explanationEn: "In literary and formal English (B2), placing negative or restrictive adverbials ('Rarely', 'Only then', 'Seldom') at the start of a sentence inverts the subject and auxiliary verb for emphasis.",
        explanationId: "Dalam bahasa Inggris bernilai sastra dan formal (B2), menempatkan kata keterangan pembatas ('Rarely', 'Only then', 'Seldom') di awal kalimat membalikkan posisi subjek dan kata kerja bantu (*negative inversion*) untuk penegasan dramatis.",
        examples: [
          {
            en: "Rarely had Maya witnessed a night sky so uncluttered by light pollution.",
            id: "Jarang sekali Maya menyaksikan langit malam yang begitu bersih dari polusi cahaya."
          },
          {
            en: "Only when the stars reappeared did the captain adjust their sailing direction.",
            id: "Hanya ketika bintang-bintang muncul kembali lah sang kapten menyesuaikan arah pelayaran mereka."
          }
        ]
      },
      culturalTip: {
        titleEn: "Austronesian & Polynesian Wayfinding Traditions",
        titleId: "Tradisi Navigasi Bahari Nusantara & Polinesia",
        contentEn: "Centuries before European compasses, Austronesian and Pacific navigators crossed thousands of open ocean miles using 'star compasses', bird migration pathways, and wave swell harmonics—an intangible heritage celebrated by modern oceanographers.",
        contentId: "Berabad-abad sebelum kompas Eropa ditemukan, para pelaut Austronesia dan Pasifik mengarungi ribuan mil samudra luas menggunakan 'kompas bintang', jalur migrasi burung, dan gelombang alun laut—sebuah warisan takbenda yang kini dikagumi para ahli oseanografi modern."
      },
      quiz: [
        {
          id: "s9_ep7_q1",
          questionEn: "Which sentence features correct negative inversion syntax?",
          questionId: "Kalimat mana yang menunjukkan sintaksis inversi negatif yang benar?",
          options: [
            "Seldom had the crew seen the ocean surface so perfectly mirror the constellations.",
            "Seldom the crew had seen the ocean surface so perfectly.",
            "Seldom did the crew saw the ocean surface mirror constellations.",
            "The crew seldom has see the ocean surface so."
          ],
          correctIndex: 0,
          explanationEn: "'Seldom had the crew seen...' correctly inverts the auxiliary 'had' before the subject 'the crew'.",
          explanationId: "'Seldom had the crew seen...' secara tepat membalikkan kata kerja bantu 'had' sebelum subjek 'the crew'."
        },
        {
          id: "s9_ep7_q2",
          questionEn: "How does Captain Riko navigate when storm clouds obscure the constellations?",
          questionId: "Bagaimana cara Kapten Riko bernavigasi saat awan badai mengaburkan rasi bintang?",
          options: [
            "By reading ocean swell directions and wave resonance patterns created by distant islands",
            "By guessing randomly and hoping for good luck",
            "By calling a taxi on the phone",
            "By shining a laser pointer toward the mainland"
          ],
          correctIndex: 0,
          explanationEn: "Traditional wayfinders recognize swells generated by constant trade winds that reflect off islands.",
          explanationId: "Navigator tradisional mengenali alun ombak yang dihasilkan oleh angin pasat konstan yang memantul dari pulau-pulau."
        },
        {
          id: "s9_ep7_q3",
          questionEn: "What constellation serves as the primary southern directional guide in the Southern Hemisphere?",
          questionId: "Rasi bintang apa yang menjadi pemandu arah utama di Belahan Bumi Selatan?",
          options: [
            "The Southern Cross (Crux)",
            "The Big Dipper",
            "Orion's Belt",
            "Cassiopeia"
          ],
          correctIndex: 0,
          explanationEn: "The Southern Cross points navigators reliably toward the South Celestial Pole.",
          explanationId: "Rasi Bintang Salib Selatan (Crux) memandu para pelaut secara konsisten menuju Kutub Langit Selatan."
        },
        {
          id: "s9_ep7_q4",
          questionEn: "Which noun refers to the mapped path or passage followed by a boat or traveler?",
          questionId: "Kata benda mana yang merujuk pada jalur atau lintasan terpetakan yang dilalui oleh kapal atau musafir?",
          options: [
            "route",
            "battery",
            "sample",
            "damage"
          ],
          correctIndex: 0,
          explanationEn: "A 'route' is the chosen course or passage taken to reach a destination.",
          explanationId: "'Route' adalah jalur atau haluan yang ditempuh untuk mencapai tempat tujuan."
        },
        {
          id: "s9_ep7_q5",
          questionEn: "What damage did Captain Riko observe on the research station roof?",
          questionId: "Kerusakan apa yang diamati Kapten Riko pada atap stasiun riset?",
          options: [
            "The primary radio communication antenna had snapped during the storm",
            "The entire concrete bunker had vanished into the ocean",
            "The wooden jetty had turned into gold",
            "All the solar panels were stolen by pirates"
          ],
          correctIndex: 0,
          explanationEn: "The gale-force winds snapped the high mast communication antenna, cutting off mainland broadcasts.",
          explanationId: "Hembusan angin kencang mematahkan tiang antena komunikasi utama sehingga memutus siaran ke daratan."
        }
      ],
      takeaways: [
        "Memahami prinsip navigasi samudra tradisional berbasis perbintangan dan alun ombak.",
        "Menguasai teknik *Negative Inversion* (*Rarely had Maya seen...*) untuk bobot ekspresi sastra.",
        "Menguasai kosakata Oxford 3000: *route*, *direction*, *night*, *guide*, *position*, *sail*."
      ],
      cliffhanger: "Kapten Riko harus segera kembali mengantar pasokan ke pulau lain, meninggalkan tim untuk mencatat seluruh data ilmiah sebelum memperbaiki antena..."
    },

    // EPISODE 8
    {
      id: 8,
      number: 8,
      title: "Pendokumentasian Data Ilmiah Manual",
      titleEn: "Analog Field Journaling",
      estimatedMinutes: 8,
      recap: "Dengan laptop kehabisan daya dan komputer stasiun dimatikan untuk penghematan darurat, Maya belajar mendokumentasikan spesimen menggunakan jurnal kertas dan pensil tahan air.",
      dialogue: [
        {
          id: "s9e8_d1",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Maya, our digital tablets have exhausted their battery reserves. For the next forty-eight hours, every scientific observation must be entered by hand.",
          textId: "Maya, tablet digital kita telah kehabisan cadangan baterainya. Selama empat puluh delapan jam ke depan, setiap observasi ilmiah harus dimasukkan dengan tangan.",
          audioText: "Maya, our digital tablets have exhausted their battery reserves. For the next forty-eight hours, every scientific observation must be entered by hand."
        },
        {
          id: "s9e8_d2",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "I admit I was nervous about losing auto-save spreadsheets. But holding this waterproof field journal and a graphite pencil feels surprisingly intimate and authentic.",
          textId: "Saya akui awalnya saya gugup kehilangan lembar sebar penyimpanan otomatis. Namun memegang jurnal lapangan tahan air dan pensil grafit ini terasa sangat akrab dan autentik.",
          audioText: "I admit I was nervous about losing auto-save spreadsheets. But holding this waterproof field journal and a graphite pencil feels surprisingly intimate and authentic."
        },
        {
          id: "s9e8_d3",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "Charles Darwin and Alfred Russel Wallace mapped evolution with nothing more than keen eyes, sharp pencils, and unhurried sketches. Accuracy begins with patient observation, not silicon chips.",
          textId: "Charles Darwin dan Alfred Russel Wallace memetakan evolusi hanya dengan mata jeli, pensil tajam, dan sketsa teliti. Akurasi dimulai dengan observasi sabar, bukan keping silikon.",
          audioText: "Charles Darwin and Alfred Russel Wallace mapped evolution with nothing more than keen eyes, sharp pencils, and unhurried sketches. Accuracy begins with patient observation, not silicon chips."
        },
        {
          id: "s9e8_choice_1",
          type: "interactive_choice",
          promptEn: "How does Maya record the newly discovered coral polyp specimen?",
          promptId: "Bagaimana cara Maya mendokumentasikan spesimen polip karang yang baru ditemukan?",
          options: [
            {
              id: "s9e8_opt_1a",
              textEn: "Measure the polyp diameters with precision calipers and sketch the radial tentacle symmetry with scale bars and date-time stamps.",
              textId: "Mengukur diameter polip dengan jangka sorong presisi dan membuat sketsa simetri tentakel radial lengkap dengan skala ukuran dan stempel tanggal-waktu.",
              feedbackEn: "Exquisite scientific methodology! Dr. Vance signs off on the entry with highest praise.",
              feedbackId: "Metodologi ilmiah yang luar biasa! Dr. Vance menandatangani catatan dengan pujian tertinggi."
            },
            {
              id: "s9e8_opt_1b",
              textEn: "Write a vague one-sentence impression and draw a smiley face next to it.",
              textId: "Menulis kesan samar satu kalimat dan menggambar emotikon senyum di sebelahnya.",
              feedbackEn: "Inadequate for scientific rigor; field journals must serve as permanent archival evidence.",
              feedbackId: "Kurang memenuhi kaidah ketelitian ilmiah; jurnal lapangan harus menjadi bukti arsip permanen."
            }
          ]
        },
        {
          id: "s9e8_d4",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "Your illustrations are extraordinarily detailed, Maya! This archival document will survive even if an electrical pulse wipes our hard drives clean tomorrow.",
          textId: "Ilustrasimu sangat mendetail, Maya! Dokumen arsip ini akan tetap bertahan bahkan jika denyut listrik menghapus bersih cakram keras kita besok.",
          audioText: "Your illustrations are extraordinarily detailed, Maya! This archival document will survive even if an electrical pulse wipes our hard drives clean tomorrow."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-record",
          word: "record",
          partOfSpeech: "verb",
          enDefinition: "Set down in writing or some other permanent form for later reference.",
          idMeaning: "mencatat, merekam data",
          contextSentenceEn: "Biologists must carefully record temperature, water clarity, and tide heights every morning.",
          contextSentenceId: "Ahli biologi harus mencatat suhu, kejernihan air, dan tinggi pasang surut setiap pagi dengan cermat."
        },
        {
          wordId: "oxford-note",
          word: "note",
          partOfSpeech: "noun",
          enDefinition: "A brief record of facts, topics, or thoughts, written down as an aid to memory.",
          idMeaning: "catatan lapangan ringkas",
          contextSentenceEn: "Maya jotted down a descriptive note detailing the bioluminescent pulse rate of the jellyfish.",
          contextSentenceId: "Maya menuliskan catatan deskriptif yang merinci laju denyut pendar ubur-ubur tersebut."
        },
        {
          wordId: "oxford-pencil",
          word: "pencil",
          partOfSpeech: "noun",
          enDefinition: "An instrument for writing or drawing, consisting of a thin stick of graphite or a similar substance enclosed in a long thin piece of wood.",
          idMeaning: "pensil grafit tahan air",
          contextSentenceEn: "Field researchers prefer a hard graphite pencil because ink smudges easily when wet.",
          contextSentenceId: "Peneliti lapangan lebih menyukai pensil grafit keras karena tinta mudah luntur saat terkena basah."
        },
        {
          wordId: "oxford-accurate",
          word: "accurate",
          partOfSpeech: "adjective",
          enDefinition: "Correct in all details; exact.",
          idMeaning: "akurat, tepat dan presisi",
          contextSentenceEn: "An accurate scientific drawing includes exact proportion scale bars and anatomical labels.",
          contextSentenceId: "Gambar ilmiah yang akurat memuat batang skala proporsi yang tepat dan label anatomi."
        },
        {
          wordId: "oxford-measure",
          word: "measure",
          partOfSpeech: "verb",
          enDefinition: "Ascertain the size, amount, or degree of (something) by using an instrument or device marked in standard units.",
          idMeaning: "mengukur dimensi atau kuantitas",
          contextSentenceEn: "Technicians measure the salinity of reef water using an optical refractometer.",
          contextSentenceId: "Para teknisi mengukur salinitas air karang menggunakan refraktometer optik."
        },
        {
          wordId: "oxford-document",
          word: "document",
          partOfSpeech: "verb",
          enDefinition: "Record (something) in written, photographic, or other form.",
          idMeaning: "mendokumentasikan, mengarsipkan",
          contextSentenceEn: "The primary purpose of the expedition is to document previously unrecorded marine flora.",
          contextSentenceId: "Tujuan utama ekspedisi ini adalah mendokumentasikan flora laut yang sebelumnya belum pernah tercatat."
        }
      ],
      grammarFocus: {
        topic: "Subjunctive Mood in Formal Scientific Recommendations",
        explanationEn: "In high-register academic English (B2), the present subjunctive ('insisted that she record', 'recommended that the specimen remain') uses the bare infinitive after verbs of recommendation, demand, or necessity.",
        explanationId: "Dalam bahasa Inggris akademik formal (B2), Subjunctive Mood ('insisted that she record', 'recommended that the specimen remain') menggunakan kata kerja dasar (*bare infinitive*) setelah kata kerja rekomendasi, tuntutan, atau keharusan prosedural.",
        examples: [
          {
            en: "Dr. Vance insisted that every researcher document observations twice before sunset.",
            id: "Dr. Vance bersikeras agar setiap peneliti mendokumentasikan observasi dua kali sebelum matahari terbenam."
          },
          {
            en: "It is essential that each glass vial be labeled immediately with graphite pencil.",
            id: "Sangat penting agar setiap botol kaca segera diberi label dengan pensil grafit."
          }
        ]
      },
      culturalTip: {
        titleEn: "The Enduring Power of the Field Notebook",
        titleId: "Keabadian Jurnal Catatan Lapangan",
        contentEn: "From Alexander von Humboldt to Jane Goodall, handwritten field notebooks made on 100% rag cotton paper have survived centuries of tropical humidity and shipwrecks, outlasting countless obsolete digital disk formats.",
        contentId: "Dari Alexander von Humboldt hingga Jane Goodall, jurnal catatan lapangan bertinta tahan air pada kertas katun telah bertahan melintasi kelembapan tropis dan karamnya kapal selama berabad-abad, jauh melampaui berbagai format disk digital yang kini usang."
      },
      quiz: [
        {
          id: "s9_ep8_q1",
          questionEn: "Which sentence correctly demonstrates the present subjunctive mood?",
          questionId: "Kalimat mana yang secara tepat menunjukkan present subjunctive mood?",
          options: [
            "Dr. Vance recommended that Maya measure each polyp diameter with calipers.",
            "Dr. Vance recommended that Maya measures each polyp diameter.",
            "Dr. Vance recommended that Maya measured each polyp diameter yesterday.",
            "Dr. Vance recommended Maya to be measuring polyps."
          ],
          correctIndex: 0,
          explanationEn: "Subjunctive clauses after verbs like 'recommend that' require the base bare infinitive ('measure', not 'measures' or 'measured').",
          explanationId: "Klausa subjungtif setelah kata kerja seperti 'recommend that' memerlukan bentuk bare infinitive ('measure', bukan 'measures' atau 'measured')."
        },
        {
          id: "s9_ep8_q2",
          questionEn: "Why do field researchers favor graphite pencils over ink pens in wet tropical environments?",
          questionId: "Mengapa peneliti lapangan lebih memilih pensil grafit daripada pena tinta di lingkungan tropis yang basah?",
          options: [
            "Graphite does not smudge or dissolve when paper gets damp or exposed to saltwater",
            "Pencils are much heavier than pens and prevent papers from blowing away",
            "Pencils can be sharpened into weapons against sharks",
            "Ink pens make too much noise while writing"
          ],
          correctIndex: 0,
          explanationEn: "Pencil graphite is completely water-insoluble, guaranteeing legible notes even in rain.",
          explanationId: "Grafit pensil sama sekali tidak larut dalam air, menjamin catatan tetap terbaca dengan jelas meski terkena hujan."
        },
        {
          id: "s9_ep8_q3",
          questionEn: "What historical scientists did Dr. Vance cite to highlight the value of manual sketching?",
          questionId: "Ilmuwan bersejarah mana yang dikutip Dr. Vance untuk menegaskan nilai membuat sketsa manual?",
          options: [
            "Charles Darwin and Alfred Russel Wallace",
            "Isaac Newton and Albert Einstein",
            "Thomas Edison and Nikola Tesla",
            "Galileo Galilei and Christopher Columbus"
          ],
          correctIndex: 0,
          explanationEn: "Both Darwin and Wallace relied exclusively on observational field journals to develop evolutionary theories.",
          explanationId: "Baik Darwin maupun Wallace mengandalkan jurnal lapangan observasional untuk merumuskan teori evolusi."
        },
        {
          id: "s9_ep8_q4",
          questionEn: "Which adjective means 'correct in all details, exact, and free from error'?",
          questionId: "Kata sifat mana yang bermakna 'benar dalam semua detail, presisi, dan bebas dari kesalahan'?",
          options: [
            "accurate",
            "remote",
            "careful",
            "electric"
          ],
          correctIndex: 0,
          explanationEn: "'Accurate' means strictly conforming to truth, measurement, or standard fact.",
          explanationId: "'Accurate' bermakna sesuai persis dengan fakta, ukuran, atau standar kebenaran."
        },
        {
          id: "s9_ep8_q5",
          questionEn: "What is an essential feature of a rigorous biological illustration?",
          questionId: "Apa fitur penting dari sebuah ilustrasi biologis yang ketat?",
          options: [
            "A calibrated scale bar, precise labels, and exact date-time stamp",
            "Bright colorful cartoon stickers",
            "A signature from the ferry boat captain",
            "A poem written across the center of the drawing"
          ],
          correctIndex: 0,
          explanationEn: "Scale bars and anatomical labels transform a drawing into verifiable scientific documentation.",
          explanationId: "Batang skala dan label anatomi mengubah gambar biasa menjadi dokumentasi ilmiah yang dapat diverifikasi."
        }
      ],
      takeaways: [
        "Menghargai ketelitian jurnal ilmiah manual (*analog field journaling*) sebagai rekaman permanen.",
        "Menggunakan konstruksi *Present Subjunctive* (*insisted that she record...*) dalam laporan formal.",
        "Menguasai kosakata Oxford 3000: *record*, *note*, *pencil*, *accurate*, *measure*, *document*."
      ],
      cliffhanger: "Jurnal ilmiah terisi rapi, namun Liam memanggil dari puncak menara: ia menemukan gulungan kabel tembaga tua untuk memperbaiki antena!"
    },

    // EPISODE 9
    {
      id: 9,
      number: 9,
      title: "Menyambung Kabel Pemancar Darurat",
      titleEn: "Connecting the High-Wire Signal",
      estimatedMinutes: 8,
      recap: "Liam dan Maya memanjat menara radio stasiun untuk menyambung kabel tembaga pengganti dan menguji transmisi sinyal darurat.",
      dialogue: [
        {
          id: "s9e9_d1",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "Maya, I managed to hoist our spare copper wire up the radio mast. If we strip this coaxial cable and solder it cleanly, we can re-establish our transmitter circuit.",
          textId: "Maya, saya berhasil mengerek kawat tembaga cadangan ke tiang radio. Jika kita mengupas kabel koaksial ini dan menyoldernya dengan bersih, kita bisa membangun kembali sirkuit pemancar kita.",
          audioText: "Maya, I managed to hoist our spare copper wire up the radio mast. If we strip this coaxial cable and solder it cleanly, we can re-establish our transmitter circuit."
        },
        {
          id: "s9e9_d2",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "I have the soldering iron ready. If Liam were not such a skilled technician, we wouldn't have improvised this antenna replacement in less than two hours.",
          textId: "Saya sudah menyiapkan solder listrik. Seandainya Liam bukan teknisi yang sangat terampil, kita pasti belum bisa mengimprovisasi penggantian antena ini dalam waktu kurang dari dua jam.",
          audioText: "I have the soldering iron ready. If Liam were not such a skilled technician, we would not have improvised this antenna replacement in less than two hours."
        },
        {
          id: "s9e9_d3",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "The solar batteries have recharged to sixty percent under today's bright sunshine. Ground the wire securely against static lightning discharge before flipping the power switch.",
          textId: "Baterai surya telah terisi kembali hingga enam puluh persen di bawah terik matahari hari ini. Bumikan kawat dengan aman terhadap lucutan petir statis sebelum menyalakan sakelar daya.",
          audioText: "The solar batteries have recharged to sixty percent under today's bright sunshine. Ground the wire securely against static lightning discharge before flipping the power switch."
        },
        {
          id: "s9e9_choice_1",
          type: "interactive_choice",
          promptEn: "What transmission protocol should Maya follow once the connection is secured?",
          promptId: "Protokol transmisi apa yang harus diikuti Maya begitu sambungan terpasang kuat?",
          options: [
            {
              id: "s9e9_opt_1a",
              textEn: "Send a structured status message with our station call sign, weather report, and confirmation of crew safety to the regional coast guard.",
              textId: "Mengirimkan pesan status terstruktur berisi kode panggilan stasiun, laporan cuaca, dan konfirmasi keselamatan kru ke penjaga pantai regional.",
              feedbackEn: "Flawless communication! The receiver chirps with a crystal-clear acknowledgment.",
              feedbackId: "Komunikasi sempurna! Perangkat penerima berbunyi dengan konfirmasi penerimaan yang jernih."
            },
            {
              id: "s9e9_opt_1b",
              textEn: "Shout loudly into the microphone without waiting for the transmitter frequency to calibrate.",
              textId: "Berteriak kencang ke mikrofon tanpa menunggu frekuensi pemancar terkalibrasi.",
              feedbackEn: "Amateur error; uncalibrated transmissions create squealing feedback across frequencies.",
              feedbackId: "Kesalahan amatir; transmisi tanpa kalibrasi menimbulkan dengungan feedback di seluruh frekuensi."
            }
          ]
        },
        {
          id: "s9e9_d4",
          speaker: "Coast Guard Dispatcher",
          speakerRole: "Regional Marine Center",
          textEn: "...Coral Crest Station, this is Coast Guard Sector Four. We copy your message loud and clear! Congratulations on your signal restoration. Outstanding resilience, team!",
          textId: "...Stasiun Karang Merah, ini Penjaga Pantai Sektor Empat. Kami menerima pesan Anda dengan keras dan jelas! Selamat atas pulihnya sinyal Anda. Ketangguhan yang luar biasa, tim!",
          audioText: "Coral Crest Station, this is Coast Guard Sector Four. We copy your message loud and clear. Congratulations on your signal restoration. Outstanding resilience, team!"
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-wire",
          word: "wire",
          partOfSpeech: "noun",
          enDefinition: "Metal drawn out into the form of a thin flexible thread or rod.",
          idMeaning: "kawat tembaga penghantar",
          contextSentenceEn: "High-grade copper wire provides minimal electrical resistance for long-distance antenna masts.",
          contextSentenceId: "Kawat tembaga bermutu tinggi memberikan hambatan listrik minimal untuk tiang antena jarak jauh."
        },
        {
          wordId: "oxford-cable",
          word: "cable",
          partOfSpeech: "noun",
          enDefinition: "A thick rope of wire or nonmetallic fiber, typically used for construction or for transmitting electricity or telecommunication signals.",
          idMeaning: "kabel transmisi berselubung",
          contextSentenceEn: "Maya wrapped waterproof vulcanized tape around the spliced coaxial cable.",
          contextSentenceId: "Maya melilitkan pita perekat vulkanisir kedap air di sekeliling kabel koaksial yang disambung."
        },
        {
          wordId: "oxford-connect",
          word: "connect",
          partOfSpeech: "verb",
          enDefinition: "Bring together or into contact so that a real or notional link is established.",
          idMeaning: "menghubungkan, menyambung sirkuit",
          contextSentenceEn: "Technicians must connect the negative ground wire before powering on the high-voltage amplifier.",
          contextSentenceId: "Para teknisi harus menghubungkan kabel arde negatif sebelum menyalakan penguat bertegangan tinggi."
        },
        {
          wordId: "oxford-message",
          word: "message",
          partOfSpeech: "noun",
          enDefinition: "A verbal, written, or recorded communication sent to or left for a recipient who cannot be contacted directly.",
          idMeaning: "pesan radiogram resmi",
          contextSentenceEn: "The coast guard acknowledged receipt of Maya's emergency status message within thirty seconds.",
          contextSentenceId: "Penjaga pantai mengonfirmasi penerimaan pesan status darurat Maya dalam waktu tiga puluh detik."
        },
        {
          wordId: "oxford-signal",
          word: "signal",
          partOfSpeech: "noun",
          enDefinition: "An electrical impulse or radio wave transmitted or received.",
          idMeaning: "sinyal transmisi gelombang",
          contextSentenceEn: "A sharp green LED on the receiver confirmed that our outgoing signal was reaching the mainland.",
          contextSentenceId: "Lampu LED hijau pada alat penerima memastikan bahwa sinyal keluar kita mencapai daratan."
        },
        {
          wordId: "oxford-success",
          word: "success",
          partOfSpeech: "noun",
          enDefinition: "The accomplishment of an aim or purpose.",
          idMeaning: "keberhasilan, kesuksesan",
          contextSentenceEn: "Re-establishing radio contact was a vital operational success for the remote sanctuary.",
          contextSentenceId: "Membangun kembali kontak radio merupakan keberhasilan operasional vital bagi suaka terpencil tersebut."
        }
      ],
      grammarFocus: {
        topic: "Mixed Conditionals (Present Trait Influencing Past Outcome)",
        explanationEn: "Another common B2 mixed conditional connects a permanent personal attribute or ongoing condition in the 'if' clause ('If Liam were not so skilled...') with a past consequence in the main clause ('...we wouldn't have repaired it so quickly').",
        explanationId: "Bentuk Mixed Conditional B2 lainnya menghubungkan sifat kepribadian atau kondisi berkelanjutan pada klausa 'if' ('If Liam were not so skilled...') dengan konsekuensi lampau pada klausa utama ('...we wouldn't have repaired it so quickly').",
        examples: [
          {
            en: "If Dr. Vance were not an experienced sailor, he would have panicked during the squall.",
            id: "Seandainya Dr. Vance bukan seorang pelaut berpengalaman, dia pasti sudah panik selama badai kencang itu."
          },
          {
            en: "If the island were not so isolated, researchers wouldn't have developed such deep self-reliance.",
            id: "Seandainya pulau ini tidak begitu terpencil, para peneliti tidak akan mengembangkan kemandirian yang begitu mendalam."
          }
        ]
      },
      culturalTip: {
        titleEn: "Amateur Radio & Coastal Emergency Networks",
        titleId: "Jaringan Radio Amatir & Keselamatan Pesisir",
        contentEn: "When satellites degrade and fiber optic cables snap during natural catastrophes, volunteer ham radio operators worldwide provide the unbreakable backbone of humanitarian communications, transmitting vital coordinates by Morse code or single-sideband voice.",
        contentId: "Ketika satelit terganggu dan kabel serat optik putus saat bencana alam, para relawan operator radio amatir di seluruh dunia menjadi tulang punggung komunikasi kemanusiaan yang tak terpatahkan, menyiarkan koordinat vital melalui kode Morse atau suara pita sisi tunggal."
      },
      quiz: [
        {
          id: "s9_ep9_q1",
          questionEn: "What type of mixed conditional is illustrated in: 'If Liam were not such a skilled technician, we wouldn't have improvised the antenna'?",
          questionId: "Jenis mixed conditional apa yang diilustrasikan dalam: 'If Liam were not such a skilled technician, we wouldn't have improvised the antenna'?",
          options: [
            "A general present characteristic ('were not') causing a completed past outcome ('wouldn't have improvised')",
            "A future promise combined with past regret",
            "A zero conditional expressing mathematical laws",
            "A passive command used in military ranks"
          ],
          correctIndex: 0,
          explanationEn: "The 'if' clause uses subjunctive past 'were' to state an ongoing characteristic, while the main clause uses 'would + have + past participle' for the past result.",
          explanationId: "Klausa 'if' menggunakan subjunctive past 'were' untuk menyatakan karakteristik berkelanjutan, sementara klausa utama menggunakan 'would + have + past participle' untuk hasil lampau."
        },
        {
          id: "s9_ep9_q2",
          questionEn: "Why was grounding the antenna wire essential before powering on the transmitter?",
          questionId: "Mengapa membumikan kawat antena sangat penting sebelum menyalakan pemancar?",
          options: [
            "To prevent static electricity and lightning energy from destroying the radio circuitry",
            "To allow sea crabs to climb up the pole",
            "To make the radio music louder",
            "To paint the antenna a darker brown color"
          ],
          correctIndex: 0,
          explanationEn: "Grounding safely discharges high-voltage atmospheric static, protecting sensitive radio circuits.",
          explanationId: "Penyambungan arde (grounding) membuang listrik statis atmosferik bertegangan tinggi secara aman demi melindungi sirkuit radio yang sensitif."
        },
        {
          id: "s9_ep9_q3",
          questionEn: "What message did the mainland Coast Guard Sector Four dispatcher return?",
          questionId: "Pesan apa yang dibalas oleh operator Penjaga Pantai Sektor Empat daratan?",
          options: [
            "Acknowledged the message loud and clear and praised the team's resilience",
            "Told them to stop using the radio because it was too loud",
            "Ordered the team to abandon the island immediately",
            "Asked if they had any fresh fish to sell"
          ],
          correctIndex: 0,
          explanationEn: "The dispatcher received the transmission clearly, confirming crew safety and celebrating their successful signal repair.",
          explanationId: "Operator menerima transmisi dengan jelas, mengonfirmasi keselamatan kru dan memuji keberhasilan perbaikan sinyal mereka."
        },
        {
          id: "s9_ep9_q4",
          questionEn: "Which word means 'an electrical impulse or radio wave transmitted through space'?",
          questionId: "Kata mana yang bermakna 'impuls listrik atau gelombang radio yang ditransmisikan melintasi ruang'?",
          options: [
            "signal",
            "battery",
            "device",
            "island"
          ],
          correctIndex: 0,
          explanationEn: "'Signal' denotes electromagnetic impulses carrying telecommunication data.",
          explanationId: "'Signal' merujuk pada impuls elektromagnetik yang membawa data telekomunikasi."
        },
        {
          id: "s9_ep9_q5",
          questionEn: "What did Maya and Liam use to rebuild the broken antenna mast connection?",
          questionId: "Apa yang digunakan Maya dan Liam untuk membangun kembali sambungan tiang antena yang patah?",
          options: [
            "Spare copper wire and coaxial cable soldered together and sealed with vulcanized tape",
            "Old chewing gum and wooden twigs",
            "A fishing rod tied to a palm tree",
            "A broken smartphone taped to the roof"
          ],
          correctIndex: 0,
          explanationEn: "They engineered a durable makeshift antenna using copper wire, coaxial cables, and weatherproof tape.",
          explanationId: "Mereka merancang antena darurat yang tangguh menggunakan kawat tembaga, kabel koaksial, dan pita isolasi tahan cuaca."
        }
      ],
      takeaways: [
        "Mendemonstrasikan kerja sama teknis tangguh dalam memperbaiki sistem telekomunikasi darurat.",
        "Menguasai konstruksi *Mixed Conditionals* tipe sifat permanen versus hasil lampau.",
        "Menguasai kosakata Oxford 3000: *wire*, *cable*, *connect*, *message*, *signal*, *success*."
      ],
      cliffhanger: "Sinyal radio terhubung kembali, dan tiga pekan ekspedisi hampir usai saat perahu Kapten Riko tampak di ufuk fajar..."
    },

    // EPISODE 10
    {
      id: 10,
      number: 10,
      title: "Kepulangan Kapal & Refleksi Ekspedisi",
      titleEn: "The Expedition Debrief & Vessel Departure",
      estimatedMinutes: 8,
      recap: "Hari terakhir ekspedisi tiba. Tim berkemas, menyerahkan spesimen dan jurnal lapangan berharga, serta merefleksikan transformasi pribadi selama hidup tanpa sinyal.",
      dialogue: [
        {
          id: "s9e10_d1",
          speaker: "Captain Riko",
          speakerRole: "Ferry Captain",
          textEn: "Good morning, scholars! My vessel is moored at the jetty, ready to carry you and your research crates back to the mainland.",
          textId: "Selamat pagi, para cendekiawan! Perahu saya telah tertambat di dermaga, siap membawa kalian dan peti-peti riset kalian kembali ke daratan.",
          audioText: "Good morning, scholars! My vessel is moored at the jetty, ready to carry you and your research crates back to the mainland."
        },
        {
          id: "s9e10_d2",
          speaker: "Maya",
          speakerRole: "Marine Volunteer",
          textEn: "Three weeks ago, I feared I would go mad without cellular notifications. Now, looking at this calm sapphire sea, I feel an extraordinary inner peace.",
          textId: "Tiga pekan lalu, saya takut akan menjadi gila tanpa notifikasi ponsel. Sekarang, memandang laut safir yang tenang ini, saya merasakan kedamaian batin yang luar biasa.",
          audioText: "Three weeks ago, I feared I would go mad without cellular notifications. Now, looking at this calm sapphire sea, I feel an extraordinary inner peace."
        },
        {
          id: "s9e10_d3",
          speaker: "Dr. Vance",
          speakerRole: "Station Director",
          textEn: "You did not merely survive the isolation, Maya; you flourished. Our handwritten journals and rescued specimens constitute the most valuable environmental record of this decade.",
          textId: "Kamu tidak sekadar bertahan dalam isolasi ini, Maya; kamu bertumbuh pesat. Jurnal tulisan tangan dan spesimen yang kita selamatkan menjadi catatan lingkungan paling berharga dalam dekade ini.",
          audioText: "You did not merely survive the isolation, Maya; you flourished. Our handwritten journals and rescued specimens constitute the most valuable environmental record of this decade."
        },
        {
          id: "s9e10_choice_1",
          type: "interactive_choice",
          promptEn: "What concluding takeaway does Maya share during the station debrief?",
          promptId: "Kesimpulan refleksi apa yang dibagikan Maya selama evaluasi akhir di stasiun?",
          options: [
            {
              id: "s9e10_opt_1a",
              textEn: "This adventure taught me that real presence and direct observation are far more illuminating than any digital feed could ever be.",
              textId: "Petualangan ini mengajari saya bahwa kehadiran nyata dan observasi langsung jauh lebih mencerahkan daripada arus umpan digital mana pun.",
              feedbackEn: "Profundity that honors true conservation spirit! Dr. Vance and Captain Riko applaud warmly.",
              feedbackId: "Kedalaman makna yang menjunjung semangat konservasi sejati! Dr. Vance dan Kapten Riko bertepuk tangan hangat."
            },
            {
              id: "s9e10_opt_1b",
              textEn: "I can't wait to post three thousand photos online the second we reach mainland cellular towers.",
              textId: "Saya tidak sabar untuk mengunggah tiga ribu foto secara daring begitu kita mencapai menara seluler daratan.",
              feedbackEn: "Understandable humor, though it slightly diminishes the profound quietude of the expedition.",
              feedbackId: "Humor yang dapat dimaklumi, meski sedikit mengurangi kekhidmatan ketenangan ekspedisi."
            }
          ]
        },
        {
          id: "s9e10_d4",
          speaker: "Liam",
          speakerRole: "Field Systems Tech",
          textEn: "All crates are loaded onto the boat. As we return to our modern urban lives, let us never forget the lessons of Coral Crest Island.",
          textId: "Semua peti telah dimuat ke atas perahu. Saat kita kembali ke kehidupan modern perkotaan kita, jangan pernah kita lupakan pelajaran berharga dari Pulau Karang Merah.",
          audioText: "All crates are loaded onto the boat. As we return to our modern urban lives, let us never forget the lessons of Coral Crest Island."
        }
      ],
      highlightedVocab: [
        {
          wordId: "oxford-boat",
          word: "boat",
          partOfSpeech: "noun",
          enDefinition: "A small vessel for traveling over water, propelled by oars, sails, or an engine.",
          idMeaning: "perahu motor ekspedisi",
          contextSentenceEn: "Captain Riko steered the wooden boat gracefully away from the coral reef lagoon.",
          contextSentenceId: "Kapten Riko mengemudikan perahu kayu dengan anggun menjauh dari laguna terumbu karang."
        },
        {
          wordId: "oxford-adventure",
          word: "adventure",
          partOfSpeech: "noun",
          enDefinition: "An unusual and exciting, typically hazardous, experience or activity.",
          idMeaning: "petualangan bermakna",
          contextSentenceEn: "Working on the off-grid island proved to be a life-transforming scientific adventure.",
          contextSentenceId: "Bekerja di pulau terpencil terbukti menjadi petualangan ilmiah yang mengubah jalan hidup."
        },
        {
          wordId: "oxford-experience",
          word: "experience",
          partOfSpeech: "noun",
          enDefinition: "Practical contact with and observation of facts or events.",
          idMeaning: "pengalaman langsung, wawasan praktis",
          contextSentenceEn: "Hands-on field experience taught Maya more about ecology than a semester in lecture halls.",
          contextSentenceId: "Pengalaman lapangan langsung mengajari Maya lebih banyak tentang ekologi daripada satu semester di ruang kuliah."
        },
        {
          wordId: "oxford-valuable",
          word: "valuable",
          partOfSpeech: "adjective",
          enDefinition: "Worth a great deal of money or having great utility, merit, or importance.",
          idMeaning: "sangat berharga, bernilai tinggi",
          contextSentenceEn: "The handwritten notes and preserved specimens are of valuable scientific significance.",
          contextSentenceId: "Catatan tulisan tangan dan spesimen yang diawetkan memiliki nilai ilmiah yang sangat berharga."
        },
        {
          wordId: "oxford-lesson",
          word: "lesson",
          partOfSpeech: "noun",
          enDefinition: "A period of learning or an experience, example, or fact that serves or should serve to warn or encourage.",
          idMeaning: "hikmah pelajaran hidup",
          contextSentenceEn: "Learning to thrive without internet was the most profound personal lesson of the journey.",
          contextSentenceId: "Belajar berkembang tanpa internet adalah pelajaran pribadi paling mendalam dari perjalanan tersebut."
        },
        {
          wordId: "oxford-return",
          word: "return",
          partOfSpeech: "verb",
          enDefinition: "Come or go back to a place or person.",
          idMeaning: "kembali pulang, bertolak balik",
          contextSentenceEn: "As the researchers prepare to return to university, they carry new respect for ocean ecosystems.",
          contextSentenceId: "Saat para peneliti bersiap untuk kembali ke universitas, mereka membawa rasa hormat baru terhadap ekosistem samudra."
        }
      ],
      grammarFocus: {
        topic: "Discourse Markers for Synthesis, Reflection, and Closure",
        explanationEn: "In C1/B2 academic and professional summaries, advanced discourse markers ('In retrospect', 'Notwithstanding the hardships', 'Ultimately', 'It is imperative that') lend elegance and intellectual weight to reflections.",
        explanationId: "Dalam rangkuman akademik dan profesional tingkat lanjut (B2/C1), penanda wacana (*discourse markers*) seperti 'In retrospect' (menengok ke belakang), 'Notwithstanding' (terlepas dari), dan 'Ultimately' (pada akhirnya) memberikan keanggunan dan bobot intelektual pada sebuah refleksi.",
        examples: [
          {
            en: "In retrospect, our temporary detachment from technology deepened our observational acuity.",
            id: "Menengok ke belakang, keterlepasan sementara kita dari teknologi memperdalam ketajaman observasi kita."
          },
          {
            en: "Notwithstanding the severe storm, the expedition achieved every biological milestone.",
            id: "Terlepas dari amukan badai yang parah, ekspedisi ini berhasil mencapai setiap target biologis."
          }
        ]
      },
      culturalTip: {
        titleEn: "The Solitude of Fieldwork & Lifelong Stewardship",
        titleId: "Keheningan Riset Lapangan & Tanggung Jawab Konservasi Seumur Hidup",
        contentEn: "Many of history's greatest environmental champions trace their lifelong environmental advocacy back to a single season spent on an off-grid reserve, where the quiet rhythm of tides reconnected them to Earth's delicate balance.",
        contentId: "Banyak pejuang lingkungan terhebat sepanjang sejarah menelusuri awal dedikasi seumur hidup mereka pada satu musim yang dihabiskan di suaka terpencil, tempat irama pasang surut yang hening menyambungkan kembali jiwa mereka dengan keseimbangan bumi yang rapuh."
      },
      quiz: [
        {
          id: "s9_ep10_q1",
          questionEn: "What profound psychological change did Maya experience over the three weeks on the island?",
          questionId: "Perubahan psikologis mendalam apa yang dialami Maya selama tiga pekan di pulau tersebut?",
          options: [
            "She transitioned from anxiety over lacking digital notifications to deep inner peace and heightened observational focus",
            "She decided she never wanted to see the ocean ever again",
            "She forgot how to speak English entirely",
            "She lost her appetite for tropical fruit"
          ],
          correctIndex: 0,
          explanationEn: "Detox from constant digital distraction allowed Maya to discover mindfulness, patience, and acute scientific presence.",
          explanationId: "Detoks dari distraksi digital yang terus-menerus memungkinkan Maya menemukan kesadaran penuh, kesabaran, dan ketajaman ilmiah yang mendalam."
        },
        {
          id: "s9_ep10_q2",
          questionEn: "Which sentence correctly employs a sophisticated discourse marker of reflection?",
          questionId: "Kalimat mana yang secara tepat menggunakan penanda wacana refleksi yang canggih?",
          options: [
            "In retrospect, our period of isolation proved to be the most enriching chapter of the expedition.",
            "In retrospect, I eat a sandwich.",
            "In retrospect, the boat is having two engines yesterday.",
            "In retrospect, please give me the pencil quickly."
          ],
          correctIndex: 0,
          explanationEn: "'In retrospect' introduces a reflective evaluation of a past experience with thoughtful perspective.",
          explanationId: "'In retrospect' (menengok ke belakang) mengawali evaluasi reflektif atas pengalaman masa lalu dengan perspektif mendalam."
        },
        {
          id: "s9_ep10_q3",
          questionEn: "Why did Dr. Vance consider the handwritten journals and specimens so 'valuable'?",
          questionId: "Mengapa Dr. Vance menganggap jurnal tulisan tangan dan spesimen tersebut begitu 'berharga'?",
          options: [
            "They constitute a permanent, authentic, and uncorrupted baseline record of an endangered reef sanctuary",
            "He plans to sell them at a luxury antique auction in the capital",
            "The paper was made of pure gold leaves",
            "They were heavy enough to anchor Captain Riko's boat"
          ],
          correctIndex: 0,
          explanationEn: "Meticulous field observations and unblemished specimens represent irreplaceable baseline ecological records.",
          explanationId: "Observasi lapangan yang cermat dan spesimen murni merupakan catatan dasar ekologis yang tak ternilai bagi sains."
        },
        {
          id: "s9_ep10_q4",
          questionEn: "Which noun means 'an unusual, exciting, and typically challenging journey or activity'?",
          questionId: "Kata benda mana yang bermakna 'perjalanan atau aktivitas yang luar biasa, menarik, dan menantang'?",
          options: [
            "adventure",
            "battery",
            "direction",
            "frequency"
          ],
          correctIndex: 0,
          explanationEn: "'Adventure' denotes an exciting, daring, and transformative experience.",
          explanationId: "'Adventure' bermakna pengalaman atau petualangan yang mendebarkan, berani, dan membawa perubahan hidup."
        },
        {
          id: "s9_ep10_q5",
          questionEn: "What final commitment did the research crew make as they boarded Captain Riko's boat?",
          questionId: "Komitmen terakhir apa yang dibuat oleh para kru peneliti saat mereka menaiki perahu Kapten Riko?",
          options: [
            "To carry the lessons of self-reliance, observation, and ocean stewardship back into their urban lives",
            "To never tell anyone that Coral Crest Island exists",
            "To buy more smartphones as soon as they reach the harbor",
            "To stop studying marine biology"
          ],
          correctIndex: 0,
          explanationEn: "The crew resolved to integrate the deep lessons of off-grid living and conservation stewardship into their daily modern lives.",
          explanationId: "Para kru bertekad mengintegrasikan pelajaran mendalam tentang kemandirian dan kepedulian konservasi ke dalam kehidupan modern sehari-hari."
        }
      ],
      takeaways: [
        "Merenungi hikmah hidup tanpa konektivitas berlebih untuk memperkaya kepekaan ekologis.",
        "Menggunakan *Discourse Markers* tingkat lanjut (*In retrospect*, *Notwithstanding*) untuk sintesis reflektif.",
        "Menguasai kosakata Oxford 3000: *boat*, *adventure*, *experience*, *valuable*, *lesson*, *return*."
      ],
      cliffhanger: "Kapal berlayar membelah ombak safir menuju daratan; pengalaman ini membekali Maya untuk tantangan puncak berikutnya: wawancara beasiswa riset internasional di ibu kota!"
    }
  ]
};

const outputPath = path.resolve("src/data/stories/story-09.json");
fs.writeFileSync(outputPath, JSON.stringify(story09, null, 2), "utf8");

console.log("✓ SUCCESS: Story 9 (story-09.json) successfully created with all 10 full-length episodes!");
console.log("Total Episodes:", story09.episodes.length);
console.log("Total Quiz Questions:", story09.episodes.length * 5);
console.log("Total Oxford 3000 Vocabularies:", story09.episodes.length * 6);
