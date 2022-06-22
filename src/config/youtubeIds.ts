//#
/* cSpell:disable */

const youtubeIds = [
  {
    slug: "12tone",
    title: "12tone",
    id: "video_channel:deb1097d-43db-4673-95e2-f2a9fb3f6433",
    youtube_id: "UCTUtqcDkzw7bisadh6AOx5w",
  },
  {
    slug: "adam-neely",
    title: "Adam Neely",
    id: "video_channel:6358c08f-f9a4-4883-a6c7-e40219105a5b",
    youtube_id: "UCnkp4xDOwqqJD7sSM3xdUiQ",
  },
  {
    slug: "ahilltodieon",
    title: "A Hill to Die On",
    id: "video_channel:db7c828c-d8c7-4970-9caf-43b12119fb18",
    youtube_id: "UC_EzCruiFF-QNJCkBOSCYhA",
  },
  {
    slug: "aimeenoltemusic",
    title: "Aimee Nolte Music",
    id: "video_channel:26be8e30-1687-4bd7-8dd6-888ed5ede10e",
    youtube_id: "UCZIB_p5AgVVdxgkYWHeUy-Q",
  },
  {
    slug: "airplane-mode",
    title: "Airplane Mode",
    id: "video_channel:2cf5b90d-b6ad-49c5-8e5c-09259cca49f0",
    youtube_id: "UCmmtZ28wLMH2wBcCmB7w4mA",
  },
  {
    slug: "alex-goes-bananas",
    title: "Alex Goes Bananas",
    id: "video_channel:a1523607-d02f-4845-9fac-502dab90a49e",
    youtube_id: null,
  },
  {
    slug: "alexscorner",
    title: "Alex's Corner",
    id: "video_channel:bc436a82-c7f2-495e-aa65-37c7b0911d86",
    youtube_id: "UCnbtlei4RJMHWSUq4LKn_SQ",
  },
  {
    slug: "aliabdaal",
    title: "Ali Abdaal",
    id: "video_channel:bb0c7ecb-2864-453d-a718-ef12f6c7a856",
    youtube_id: "UCoOae5nYA7VqaXzerajD0lg",
  },
  {
    slug: "altshiftx",
    title: "Alt Shift X",
    id: "video_channel:547c9615-0c8f-4ac9-acda-44506d9225bc",
    youtube_id: "UCveZqqGewoyPiacooywP5Ig",
  },
  {
    slug: "apple-talk",
    title: "Apple Talk",
    id: "video_channel:935e63e1-312e-48d0-9134-ef9c175bfce2",
    youtube_id: "UCrunioydAXI6z5yuJIHk-0Q",
  },
  {
    slug: "austinmcconnell",
    title: "Austin McConnell",
    id: "video_channel:702b7b9b-2d1e-405b-ada0-1346add422d0",
    youtube_id: "UCbxQcz9k0NRRuy0ukgQTDQQ",
  },
  {
    slug: "badseedtech",
    title: "BadSeed Tech",
    id: "video_channel:15dffc69-6508-4501-bb99-e888a25cd44d",
    youtube_id: "UCOFH59uoSs8SUF0L_p3W0sg",
  },
  {
    slug: "battleofbritain",
    title: "Battle of Britain",
    id: "video_channel:345d423a-2005-4b40-89c6-7bb645bb8510",
    youtube_id: null,
  },
  {
    slug: "bermpeak",
    title: "Berm Peak",
    id: "video_channel:28365b94-1495-4907-8e45-234aca021adc",
    youtube_id: "UCu8YylsPiu9XfaQC74Hr_Gw",
  },
  {
    slug: "betterelevation",
    title: "Better Elevation",
    id: "video_channel:322f5485-ed65-469a-8bb9-9b5b52340df7",
    youtube_id: null,
  },
  {
    slug: "bigjoel",
    title: "Big Joel",
    id: "video_channel:d3d636c9-54a2-4810-a371-b33a4603b27a",
    youtube_id: "UCaN8DZdc8EHo5y1LsQWMiig",
  },
  {
    slug: "bioark",
    title: "BioArk",
    id: "video_channel:d92686eb-7d1c-429c-b2be-bd4d83eb7366",
    youtube_id: "UCVkgJKL07bSQ1b54Pnz186Q",
  },
  {
    slug: "boyinaband",
    title: "Boyinaband",
    id: "video_channel:e5ddbaf7-2d55-4321-b516-9b37b47381cf",
    youtube_id: "UCQ4FyiI_1mWI2AtLS5ChdPQ",
  },
  {
    slug: "braincraft",
    title: "BrainCraft",
    id: "video_channel:d6de9005-08f3-466f-a599-6979b333fa96",
    youtube_id: null,
  },
  {
    slug: "questionableadvice",
    title: "BrainCraft — Questionable Advice",
    id: "video_channel:18c5e56b-a3a7-4713-bd6f-792fdd112b93",
    youtube_id: null,
  },
  {
    slug: "bright-sun-films",
    title: "Bright Sun Films",
    id: "video_channel:c9f9f841-35a5-4ea6-857f-1c00cad8029b",
    youtube_id: "UC5k3Kc0avyDJ2nG9Kxm9JmQ",
  },
  {
    slug: "avoidclimatechange",
    title: "Can We Avoid a Climate Change Disaster?",
    id: "video_channel:5f116338-f80b-40d7-86d6-4ff1c599f198",
    youtube_id: null,
  },
  {
    slug: "captainmidnight",
    title: "Captain Midnight",
    id: "video_channel:ae36e0c3-f0a0-4669-b001-12ca01e0731b",
    youtube_id: "UCROQqK3_z79JuTetNP3pIXQ",
  },
  {
    slug: "chainbear",
    title: "Chain Bear",
    id: "video_channel:180d14d5-b665-4d1f-a830-c058999c2983",
    youtube_id: "UC7u-Dg0jb7g9s7XjmtJrtpg",
  },
  {
    slug: "charles-cornell",
    title: "Charles Cornell",
    id: "video_channel:086ada3a-8fb4-4e3f-a0cc-b8fa0f528e66",
    youtube_id: "UC4PIiYewI1YGyiZvgNlJNrA",
  },
  {
    slug: "cinemawins",
    title: "CinemaWins",
    id: "video_channel:47348e82-59fb-4de3-972c-3fab25f51ac9",
    youtube_id: "UCL8h3ri2WN_-IbviBlWtUcQ",
  },
  {
    slug: "citybeautiful",
    title: "City Beautiful",
    id: "video_channel:7a8d3e20-6893-4edc-ac43-e2686906d2f2",
    youtube_id: "UCGc8ZVCsrR3dAuhvUbkbToQ",
  },
  {
    slug: "city-beautiful-best-city-awards",
    title: "City Beautiful — Best City Awards",
    id: "video_channel:1bd18fa2-0373-40b5-8791-0c43e6d3c8e4",
    youtube_id: null,
  },
  {
    slug: "planning-ancient-rome",
    title: "City Beautiful — Planning Ancient Rome",
    id: "video_channel:7d76aa4c-95aa-4f9f-96a4-dd6fc7cd083a",
    youtube_id: null,
  },
  {
    slug: "the-closer-look",
    title: "The Closer Look",
    id: "video_channel:ef83667b-5e5f-4b72-be1f-be56baf4883f",
    youtube_id: "UCI9DUIgtRGHNH_HmSTcfUbA",
  },
  {
    slug: "codingtrain",
    title: "The Coding Train",
    id: "video_channel:30efe2d2-65c2-4492-af56-0e7729f396e0",
    youtube_id: "UCvjgXvBlbQiydffZU7m1_aw",
  },
  {
    slug: "cogito",
    title: "Cogito",
    id: "video_channel:39dc9dfb-6999-4ac2-b31e-11fe947d3aa5",
    youtube_id: "UCKMnl27hDMKvch--noWe5CA",
  },
  {
    slug: "coldfusion",
    title: "ColdFusion",
    id: "video_channel:b065231e-0c26-4790-a93c-7993423485f9",
    youtube_id: "UC4QZ_LsYcvcq7qOsOhpAX4A",
  },
  {
    slug: "conversations-with-joe",
    title: "Conversations with Joe",
    id: "video_channel:5d373c7f-f601-405e-868e-88dd843ab57e",
    youtube_id: "UCJzc7TiJ2nnuyJkUpOZ8RKA",
  },
  {
    slug: "creatordynamics",
    title: "Creator Dynamics",
    id: "video_channel:94995c52-5c95-4413-a9ce-45da06945846",
    youtube_id: "UCdQytVTN3EqMNcEO3m1d2Jg",
  },
  {
    slug: "culttennis",
    title: "CULT TENNIS",
    id: "video_channel:65c7404f-b3fe-4425-a14a-a0e575f05129",
    youtube_id: "UCeNyqKqfgv1HJBuD1DavHOQ",
  },
  {
    slug: "curiouselephant",
    title: "Curious Elephant",
    id: "video_channel:bff81668-2684-4bb4-9637-a6fe4ff80b58",
    youtube_id: "",
  },
  {
    slug: "thedailybriefing",
    title: "TLDR Daily",
    id: "video_channel:fd74f4ce-70da-46f5-a3d4-14ce4e8fc90e",
    youtube_id: "UCz_3xlMTVUYYTQqCfh9lD7w",
  },
  {
    slug: "danieltitchener",
    title: "Daniel Titchener",
    id: "video_channel:ebe28865-d25b-4914-b3b7-417043214940",
    youtube_id: "UC6_8mLw-CglRDk3y8HKGnNQ",
  },
  {
    slug: "dwiskus",
    title: "Dave Wiskus",
    id: "video_channel:7a3401c9-82d1-4e5c-a4e6-0ee69d29ea38",
    youtube_id: "UCNwJDNN4ib8zqp5Apcj4I9w",
  },
  {
    slug: "domburgess",
    title: "Dom Burgess",
    id: "video_channel:ef62131e-f7b2-4f9a-962e-5cac92e36fe4",
    youtube_id: "UCGI000V6ZIAQf97MNybAaLQ",
  },
  {
    slug: "drawcuriosity",
    title: "Draw Curiosity",
    id: "video_channel:9657c3c5-fc91-4b95-893e-6fe878d99c02",
    youtube_id: "UCOs_jEnQF2ePJzjJTgRtunA",
  },
  {
    slug: "edith",
    title: "E.D.I.T.H. — The Framing of Tony Stark",
    id: "video_channel:c69b98bb-3d96-4340-b1de-16ac9d7c8e20",
    youtube_id: null,
  },
  {
    slug: "elizabethfilips",
    title: "Elizabeth Filips",
    id: "video_channel:fc17cb07-51e6-49f1-bfd6-5881d7b02494",
    youtube_id: "UCUFFHXvzAMRSD8Bq4bJppxQ",
  },
  {
    slug: "eposvox",
    title: "EposVox",
    id: "video_channel:c4779805-083f-491b-b811-b6a6d12bd523",
    youtube_id: "UCRBHiacaQb5S70pljtJYB2g",
  },
  {
    slug: "exploringhistory",
    title: "Exploring History",
    id: "video_channel:aeabb71d-afb8-4030-9661-dbf8f81f9562",
    youtube_id: "UCyuAKnN3g2fZ7_R9irgEUZQ",
  },
  {
    slug: "extracredits",
    title: "Extra Credits",
    id: "video_channel:2067bfde-8a51-4f76-9482-0199192ac342",
    youtube_id: "UCCODtTcd5M1JavPCOr_Uydg",
  },
  {
    slug: "extrahistory",
    title: "Extra History",
    id: "video_channel:88a72e1e-1065-46d1-8b79-91cfbaf356ad",
    youtube_id: null, //"UCCODtTcd5M1JavPCOr_Uydg",
  },
  {
    slug: "tipusultan",
    title: "Extra History — Tipu Sultan: Tiger or Tyrant?",
    id: "video_channel:a8e7758a-68ec-4d34-9d8c-26fba19b0e25",
    youtube_id: null,
  },
  {
    slug: "extramythology",
    title: "Extra Mythology",
    id: "video_channel:0c02e9bf-79a9-4e6f-ae1b-9ede7dfc8581",
    youtube_id: null, //"UCCODtTcd5M1JavPCOr_Uydg",
  },
  {
    slug: "extremities",
    title: "Extremities",
    id: "video_channel:a37b5eba-88ad-48ef-b985-511aac605460",
    youtube_id: "UCTWKe1zATFV6d0o6oLS9sgw",
  },
  {
    slug: "fdsignifier",
    title: "F.D Signifier",
    id: "video_channel:d8cb2e35-23d2-4e33-b2e4-f9a04bce7d17",
    youtube_id: "UCgi2u-lGY-2i2ubLsUr6FbQ",
  },
  {
    slug: "featurehistory",
    title: "Feature History",
    id: "video_channel:b328f229-b8a3-4c6a-a13b-7e7942af70ae",
    youtube_id: "UCHdluULl5c7bilx1x1TGzJQ",
  },
  {
    slug: "foreignman",
    title: "Foreign Man in a Foreign Land",
    id: "video_channel:73e92180-42fd-47ed-aca2-79a296794305",
    youtube_id: "UC1qBXNO9sM4xV0wKC0_SlYQ",
  },
  {
    slug: "the-friday-checkout",
    title: "The Friday Checkout",
    id: "video_channel:736edbca-580e-4a5c-bd9a-9a2eb527b0c7",
    youtube_id: "UCRG_N2uO405WO4P3Ruef9NA",
  },
  {
    slug: "gmtk",
    title: "Game Maker's Toolkit",
    id: "video_channel:3d27ad5d-1781-4fbe-9412-c3734392d7a5",
    youtube_id: "UCqJ-Xo29CKyLTjn6z2XwYAw",
  },
  {
    slug: "georgiadow",
    title: "Georgia Dow",
    id: "video_channel:82b5ec83-cc5e-4a92-9238-42fe0a0e0f45",
    youtube_id: "UCBNA43Ppw3sCUbq-x2SvP8g",
  },
  {
    slug: "gonebirds",
    title: "Bright Trip — Gone Birds",
    id: "video_channel:5c446de2-3e7a-4860-9782-f04a4e48a9d7",
    youtube_id: null,
  },
  {
    slug: "grandtestauto",
    title: "Grand Test Auto",
    id: "video_channel:221d128f-1374-4e8e-bbac-2b4d68a3517d",
    youtube_id: "",
  },
  {
    slug: "the-great-war",
    title: "The Great War",
    id: "video_channel:d1fbec3d-7601-44c0-aa5d-e59daa8f9fbd",
    youtube_id: "UCUcyEsEjhPEDf69RRVhRh4A",
  },
  {
    slug: "hai",
    title: "Half as Interesting",
    id: "video_channel:8f3a2a56-3f9f-4ce0-b105-ede41688d84b",
    youtube_id: "UCuCkxoKLYO_EQ2GeFtbM_bw",
  },
  {
    slug: "haicrimespree",
    title: "Half as Interesting’s Crime Spree",
    id: "video_channel:b3153e23-7728-4a28-a064-aed44e418bbe",
    youtube_id: null,
  },
  {
    slug: "brick-facade",
    title: "Half as Interesting — The Brick Facade",
    id: "video_channel:6fb5d443-d926-48ea-b453-cce2c565e045",
    youtube_id: null,
  },
  {
    slug: "haminations",
    title: "Haminations",
    id: "video_channel:f511475a-df12-41ef-a3c9-09da6633119d",
    youtube_id: "UC2hm5rD_IrfYRMfq5YQudgA",
  },
  {
    slug: "hbomberguy",
    title: "HBomberguy",
    id: "video_channel:0816b59b-efeb-4ad8-b7ae-84eea574c88a",
    youtube_id: "UClt01z1wHHT7c5lKcU8pxRQ",
  },
  {
    slug: "hellofutureme",
    title: "Hello Future Me",
    id: "video_channel:11ffc72a-5c11-46ec-81bd-82de444c2dd8",
    youtube_id: "UCFQMO-YL87u-6Rt8hIVsRjA",
  },
  {
    slug: "historybuffs",
    title: "History Buffs",
    id: "video_channel:8947e329-ad70-46f8-925c-0b142bbbfe10",
    youtube_id: "UCggHoXaj8BQHIiPmOxezeWA",
  },
  {
    slug: "imaginaryambition",
    title: "Imaginary Ambition",
    id: "video_channel:6bc54cdc-17e4-45ea-b399-c4177158f401",
    youtube_id: "UCP5bYRGZUJMG93AVoMekz9g",
  },
  {
    slug: "innuendostudios",
    title: "Innuendo Studios",
    id: "video_channel:2b2f0d1a-48e1-420a-9df2-f81a932501f4",
    youtube_id: "UC5fdssPqmmGhkhsJi4VcckA",
  },
  {
    slug: "invisiblepeople",
    title: "Invisible People",
    id: "video_channel:83aa6c67-467b-4d70-ac42-463fa0b6744d",
    youtube_id: "UCh4pyZUB0mNzieaKv831flA",
  },
  {
    slug: "iphonedo",
    title: "iPhonedo",
    id: "video_channel:8e034e20-ad08-4b90-8202-6480a2015b7d",
    youtube_id: "UCvkODZ-I4tsdP2Qopov0jrA",
  },
  {
    slug: "isaacarthur",
    title: "Isaac Arthur",
    id: "video_channel:a542ab38-97c7-4b06-b8fa-93b0e58b63fc",
    youtube_id: "UCZFipeZtQM5CKUjx6grh54g",
  },
  {
    slug: "jacob-geller",
    title: "Jacob Geller",
    id: "video_channel:e9dad742-4f2e-4d7f-9e73-4a4d3d5ce461",
    youtube_id: "UCeTfBygNb1TahcNpZyELO8g",
  },
  {
    slug: "jenny-ma",
    title: "Jenny Ma",
    id: "video_channel:626bf77c-0302-4e6e-a83f-1d3d5714b783",
    youtube_id: "UCC_sp9B1jwesbC5-T04Tt9w",
  },
  {
    slug: "jessiegender",
    title: "Jessie Gender",
    id: "video_channel:2940aa70-829b-40a1-9e15-bdc95a01240f",
    youtube_id: "UChBcQ24GbjS5xCXm3K4e8-A",
  },
  {
    slug: "jetlag",
    title: "Jet Lag: The Game",
    id: "video_channel:9cea6296-223e-4c7e-a245-d96db75de32f",
    youtube_id: null,
  },
  {
    slug: "joescott",
    title: "Joe Scott",
    id: "video_channel:ee1b232b-999c-464b-8305-135f3dacd747",
    youtube_id: "UC-2YHgc363EdcusLIBbgxzg",
  },
  {
    slug: "joescottmysteries",
    title: "Joe Scott Presents: Mysteries of the Human Body",
    id: "video_channel:7fb81159-fb2c-40fc-90ab-b8ff29353b62",
    youtube_id: null,
  },
  {
    slug: "jordan-harrod",
    title: "Jordan Harrod",
    id: "video_channel:94c84e30-d51d-4f35-ab53-42575f55b784",
    youtube_id: "UC1H1NWNTG2Xi3pt85ykVSHA",
  },
  {
    slug: "justwrite",
    title: "Just Write",
    id: "video_channel:0ea0d1c3-02ec-4601-8398-2a1a582043ec",
    youtube_id: "UCx0L2ZdYfiq-tsAXb8IXpQg",
  },
  {
    slug: "kalleflodin",
    title: "Kalle Flodin",
    id: "video_channel:c4758ab4-42b1-49bd-89ea-ba8d33795222",
    youtube_id: "UCe-5wDW9r3-C0HVdcm9_knA",
  },
  {
    slug: "kaptainkristian",
    title: "kaptainkristian",
    id: "video_channel:de64c5ea-ccdc-4956-9c1d-12e30f2aeba6",
    youtube_id: "UCuPgdqQKpq4T4zeqmTelnFg",
  },
  {
    slug: "kat-blaque",
    title: "Kat Blaque",
    id: "video_channel:f9b43da9-3c04-47c0-b379-13ba4b388dc8",
    youtube_id: "UCxFWzKZa74SyAqpJyVlG5Ew",
  },
  {
    slug: "kentobento",
    title: "Kento Bento",
    id: "video_channel:8b985d4e-00d6-4770-b9c4-4d0280f35276",
    youtube_id: "UCLOwKVD0bYHxaDZxXkK4piw",
  },
  {
    slug: "mostinsanehijacking",
    title:
      "Kento Bento — Orchestrating the Most Insane Hijacking in Japanese History",
    id: "video_channel:2ccf3fed-2045-46c6-9955-cc11d836302d",
    youtube_id: null,
  },
  {
    slug: "kento-bento-pork-bun-murders",
    title: "Kento Bento — The Shocking Chinese Pork Bun Murders",
    id: "video_channel:6a3da2bc-cfb1-45d1-a25d-f53c9eef951f",
    youtube_id: null,
  },
  {
    slug: "knowingbetter",
    title: "Knowing Better",
    id: "video_channel:f92c0d98-a96c-4a8a-a93e-ecc40407b35f",
    youtube_id: "UC8XjmAEDVZSCQjI150cb4QA",
  },
  {
    slug: "ladyemily",
    title: "Lady Emily",
    id: "video_channel:703c6c26-712a-4b65-9073-c8313152dd7c",
    youtube_id: "UCG9fr-NSOwaE65w092RO_AA",
  },
  {
    slug: "ladyknightthebrave",
    title: "LadyKnightTheBrave",
    id: "video_channel:2086e017-5302-4dfa-9057-caa5f1b4c52e",
    youtube_id: "UC7pBv8EE3FtDZEF3HtnbFjA",
  },
  {
    slug: "lauracrone",
    title: "Laura Crone",
    id: "video_channel:a58ee498-0739-4edf-ab71-c0dddfda2384",
    youtube_id: "UCS6Hy72uP6nCbKMfs7hHKKg",
  },
  {
    slug: "legaleagle",
    title: "LegalEagle",
    id: "video_channel:85bf1f47-7cb1-409f-ae8f-4ea1a9b4414b",
    youtube_id: "UCpa-Zb0ZcQjTCPP1Dx_1M8Q",
  },
  {
    slug: "badlawwordsgood",
    title: "LegalEagle — Bad Law Words Good",
    id: "video_channel:5d8f6122-e0a2-4c39-914b-9f56850ebcde",
    youtube_id: null,
  },
  {
    slug: "leovader",
    title: "Leo Vader",
    id: "video_channel:65f6aa26-b251-47bc-a30a-a9b00ccd8e0a",
    youtube_id: "UCDT-KKAV1iTIoD1j7AZKkYw",
  },
  {
    slug: "lfts",
    title: "Lessons from the Screenplay",
    id: "video_channel:9abc9302-f45d-4de6-a14c-8afad8c8ef24",
    youtube_id: "UCErSSa3CaP_GJxmFpdjG9Jw",
  },
  {
    slug: "lsoo",
    title: "Like Stories of Old",
    id: "video_channel:cb034ddc-cf94-42e0-96fe-72dd1b13b81d",
    youtube_id: "UCs7nPQIEba0T3tGOWWsZpJQ",
  },
  {
    slug: "lilyalexandre",
    title: "Lily Alexandre",
    id: "video_channel:5f63e532-20db-4912-9da6-f04fc1cfc932",
    youtube_id: "UCHu6yK2Ht1J7lfvYBXv0OsQ",
  },
  {
    slug: "lindsayellis",
    title: "Lindsay Ellis",
    id: "video_channel:11e9d866-d05a-466f-80a9-ce9f9e061aa2",
    youtube_id: "UCG1h-Wqjtwz7uUANw6gazRw",
  },
  {
    slug: "blazingsaddles",
    title: "Lindsay Ellis — Could Blazing Saddles Be Made Today?",
    id: "video_channel:b79b168d-de3c-46bb-85d3-55f2ee0eb5fc",
    youtube_id: null,
  },
  {
    slug: "lindsayellistropicthunder",
    title: "Lindsay Ellis — How Tropic Thunder Exposes the Sham",
    id: "video_channel:2b68afe1-9072-484d-a374-b3c285ea8330",
    youtube_id: null,
  },
  {
    slug: "lindsay-ellis-tom-hoopers-les-miserables",
    title: "Lindsay Ellis — Tom Hooper's Les Miserables",
    id: "video_channel:f4b27b7f-0dee-48e6-b4e6-4248469808ff",
    youtube_id: null,
  },
  {
    slug: "listeningin",
    title: "Listening In",
    id: "video_channel:125f21a1-b425-4fd3-8767-835c49556979",
    youtube_id: "UCiawGYzxoZSPDLReSFETqeQ",
  },
  {
    slug: "d-day",
    title: "The Logistics of D-Day",
    id: "video_channel:f01ef19c-9b35-4899-baff-818f1f8d5422",
    youtube_id: null,
  },
  {
    slug: "lolasebastian",
    title: "Lola Sebastian",
    id: "video_channel:9f05322f-55f2-4534-acd2-562c66261a97",
    youtube_id: "UCVExSO-VMTHDMJoZ2GmZPUQ",
  },
  {
    slug: "lowspecgamer",
    title: "LowSpecGamer",
    id: "video_channel:e5476a8f-b7be-4afa-a128-081609cdca14",
    youtube_id: "UCQkd05iAYed2-LOmhjzDG6g",
  },
  {
    slug: "goldminers",
    title: "LowSpecGamer — Digital GoldMiners",
    id: "video_channel:d2a0cf3d-c2dd-44d8-b639-b9d2b758029f",
    youtube_id: null,
  },
  {
    slug: "maggiemaefish",
    title: "Maggie Mae Fish",
    id: "video_channel:815bdf38-d6a9-4e2f-9749-83a9bc989ac3",
    youtube_id: "UChBD4NpITiW2CzIz5GwppDA",
  },
  {
    slug: "makingphilosophytube",
    title: "Making Philosophy Tube",
    id: "video_channel:94ec30de-4388-46fb-9b9b-a265e7c2c09c",
    youtube_id: null,
  },
  {
    slug: "mariana",
    title: "Mariana's Corner",
    id: "video_channel:b72aea31-f600-40c2-bc24-745966d6ce56",
    youtube_id: "UCEHp_b02I0GvTYCBPX_0w1g",
  },
  {
    slug: "mkbhd",
    title: "Marques Brownlee",
    id: "video_channel:d23c07c6-6312-4dbe-aa44-2a31e5e0fbd7",
    youtube_id: "UCBJycsmduvYEL83R_U4JriQ",
  },
  {
    slug: "mary-spender",
    title: "Mary Spender",
    id: "video_channel:dcfbfca7-fa67-4153-a109-d8173fe96346",
    youtube_id: "UCpV5A65O3mvaJmlc669cI1A",
  },
  {
    slug: "makingofsongbook",
    title: "Mary Spender — The Making of Songbook",
    id: "video_channel:b7d6801c-6421-44b1-9d17-e186367cabdf",
    youtube_id: null,
  },
  {
    slug: "medlifecrisis",
    title: "Medlife Crisis",
    id: "video_channel:7876cc79-764b-4cfb-8b1c-4bc2c9d4abbe",
    youtube_id: "UCgRBRE1DUP2w7HTH9j_L4OQ",
  },
  {
    slug: "miamulder",
    title: "Mia Mulder",
    id: "video_channel:558de3dc-7986-4609-b269-406acc3b42a3",
    youtube_id: "",
  },
  {
    slug: "michaelwuerth",
    title: "Michael Wuerth",
    id: "video_channel:c2add79b-952a-41b2-8bbc-73bfc0984cf4",
    youtube_id: "UC_OttpBEWWzSUlZbk5qmhSA",
  },
  {
    slug: "middle8",
    title: "Middle 8",
    id: "video_channel:134c7423-1e82-4acb-b963-dd4b135f22e1",
    youtube_id: "UCfeppgcy70ERp4gQrsYijsg",
  },
  {
    slug: "mikeboyd",
    title: "Mike Boyd",
    id: "video_channel:15f31e35-f05d-4564-8d6e-7e1cb59a5ad2",
    youtube_id: "UCIRiWCPZoUyZDbydIqitHtQ",
  },
  {
    slug: "minutebody",
    title: "MinuteBody",
    id: "video_channel:2e5bee30-3803-4029-9771-a20fba19e874",
    youtube_id: null, //UCeiYXex_fwgYDonaTcSIk6w
  },
  {
    slug: "minutephysics",
    title: "MinutePhysics",
    id: "video_channel:e7cacabc-34e6-468b-ac4b-7e663416d2ac",
    youtube_id: "UCUHW94eEFW7hkUMVaZz4eDg",
  },
  {
    slug: "misteramazing",
    title: "misteramazing",
    id: "video_channel:b22dc0ce-e8a8-40f7-8e43-723dda146d21",
    youtube_id: "UCUG9w-kUDyIenbVnldsa6ug",
  },
  {
    slug: "mobox",
    title: "MOBOX Graphics",
    id: "video_channel:7c2e75b9-edc6-4c6e-a303-3122d5b7aca3",
    youtube_id: "UCQyp3CBrBSfIynoDosN3c7g",
  },
  {
    slug: "msbeautyphile",
    title: "MsBeautyphile",
    id: "video_channel:09ee16f4-122a-4f47-b89d-9afea1bcb266",
    youtube_id: "UC5gI4wshlCozPRgYaBIHREQ",
  },
  {
    slug: "mustard",
    title: "Mustard",
    id: "video_channel:18a3366f-21ea-4856-869e-f27f2874c4b7",
    youtube_id: "UC1ZBQ-F-yktYD4m5AzM6pww",
  },
  {
    slug: "originsofstealth",
    title: "Mustard — The Origins of Stealth: The F-117 Nighthawk",
    id: "video_channel:678a260b-f636-4c6a-985d-646a16ea3b11",
    youtube_id: null,
  },
  {
    slug: "mustard-underwater-aircraft-carriers",
    title:
      "Mustard — Underwater Aircraft Carriers: Imperial Japan’s Secret Weapon",
    id: "video_channel:2752b848-ba6a-45a9-b199-4da7a12ec2a8",
    youtube_id: null,
  },
  {
    slug: "nandovmovies",
    title: "Nando v Movies",
    id: "video_channel:19ae1516-af16-4dd9-a239-1c31c1db123f",
    youtube_id: "UCf29Sq6-XxLQG_XuJwMHaFg",
  },
  {
    slug: "promos",
    title: "Nebula Promos",
    id: "video_channel:8f0cb852-4e84-4a22-9adf-0439aea6796b",
    youtube_id: null,
  },
  {
    slug: "neo",
    title: "neo",
    id: "video_channel:3ca56414-7bd4-48ee-b335-05e6ae8c19c7",
    youtube_id: "UCtYKe7-XbaDjpUwcU5x0bLg",
  },
  {
    slug: "nerdsync",
    title: "NerdSync",
    id: "video_channel:7cb0dab3-5965-4c43-b0aa-f8ef8d3e539c",
    youtube_id: "UCURz5rKDgt7YibUSageNhEw",
  },
  {
    slug: "neurotransmissions",
    title: "Neuro Transmissions",
    id: "video_channel:de9aa902-8128-4d0c-89dd-45cb8c25e1ef",
    youtube_id: "UCYLrBefhyp8YyI9VGPbghvw",
  },
  {
    slug: "thenewfword",
    title: "The New F Word",
    id: "video_channel:ebcabf16-f9b2-4870-8aa5-3771dd8e55f4",
    youtube_id: null,
  },
  {
    slug: "notesbyniba",
    title: "NotesByNiba",
    id: "video_channel:a2bfd5bc-7e96-4ac9-b7f1-ed16016dc6c0",
    youtube_id: "UCVE-Dvzz_kpVTKPah6cSlCw",
  },
  {
    slug: "nothingbuttech",
    title: "NothingButTech",
    id: "video_channel:54a9295f-a05f-4dca-ae2e-5f1cb0c6e46c",
    youtube_id: "UCTd08bYLVmO6sMR0ftRltuQ",
  },
  {
    slug: "notjustbikes",
    title: "Not Just Bikes",
    id: "video_channel:8714203d-6950-4536-be0b-78196a599cf6",
    youtube_id: "UC0intLFzLaudFG-xAvUEO-A",
  },
  {
    slug: "now-you-see-it",
    title: "Now You See It",
    id: "video_channel:d26ebc1f-2f45-4777-b93d-b4accea60485",
    youtube_id: "UCWTFGPpNQ0Ms6afXhaWDiRw",
  },
  {
    slug: "one-villainous-scene",
    title: "One Villainous Scene",
    id: "video_channel:5e01ca89-d124-409c-ad3e-109e88c8dd30",
    youtube_id: null,
  },
  {
    slug: "one-x-cellent-scene",
    title: "One X-Cellent Scene",
    id: "video_channel:9a06d179-5f32-4385-b44f-a36d1896feb9",
    youtube_id: null,
  },
  {
    slug: "occ",
    title: "Our Changing Climate",
    id: "video_channel:bdb6d76a-9a9d-4ad1-83c6-b70d4449b793",
    youtube_id: "UCNXvxXpDJXp-mZu3pFMzYHQ",
  },
  {
    slug: "oztalkshw",
    title: "OzTalksHW",
    id: "video_channel:9643b1bc-055d-48f7-b3dc-4984482e9ccc",
    youtube_id: "UC6Jxh95N32m1JvKG_-fQ6QQ",
  },
  {
    slug: "pantslesspajamas",
    title: "PantslessPajamas",
    id: "video_channel:ceb19452-2108-4619-9cb5-a16f54f49833",
    youtube_id: "UCR0O-1cvuPNxDosvSDLpWHg",
  },
  {
    slug: "paperclips",
    title: "The Paperclip Maximizer",
    id: "video_channel:3e364299-2c33-4254-a0ba-dedc898d585c",
    youtube_id: null,
  },
  {
    slug: "paperskies",
    title: "Paper Skies",
    id: "video_channel:c7e29d6f-631a-48eb-88d3-12580ba915c9",
    youtube_id: "UCnmEz-Q8w4meSGoQdd-cQBw",
  },
  {
    slug: "patrickhwillems",
    title: "Patrick (H) Willems",
    id: "video_channel:a909a46f-3b6b-4a15-a590-6e77fd9d9051",
    youtube_id: "UCF1fG3gT44nGTPU2sVLoFWg",
  },
  {
    slug: "nightofthecoconut",
    title: "Night of the Coconut",
    id: "video_channel:c895a58a-f8c1-4ec5-8fbc-ebcc09191ad9",
    youtube_id: null,
  },
  {
    slug: "people-make-games",
    title: "People Make Games",
    id: "video_channel:e7f5c260-c250-4241-99a7-b332156ddcaf",
    youtube_id: "UCZB6V9fUov0Mx_us3MWWILg",
  },
  {
    slug: "philosophytube",
    title: "Philosophy Tube",
    id: "video_channel:67e524f1-5fc5-4b90-8cb9-16520b4e9490",
    youtube_id: "UC2PA-AKmVpU6NKCGtZq_rKQ",
  },
  {
    slug: "polymatter",
    title: "PolyMatter",
    id: "video_channel:1ba9e83c-5522-463c-bd95-321864144b25",
    youtube_id: "UCgNg3vwj3xt7QOrcIDaHdFg",
  },
  {
    slug: "chinaactually",
    title: "PolyMatter — China, Actually",
    id: "video_channel:d96d774d-597b-4b9d-b113-02dad39a3451",
    youtube_id: null,
  },
  {
    slug: "polymatter-macau",
    title: "PolyMatter — Macau: The Story of China’s Golden Child",
    id: "video_channel:10067ec1-6d49-463d-95d6-c0061cb74745",
    youtube_id: null,
  },
  {
    slug: "polyphonic",
    title: "Polyphonic",
    id: "video_channel:a2ad8f3a-47df-4b5d-8786-e5fee9ba6733",
    youtube_id: "UCXkNod_JcH7PleOjwK_8rYQ",
  },
  {
    slug: "polyphonic-dark-side",
    title: "Polyphonic — Dark Side of the Moon",
    id: "video_channel:62314c17-eace-4cbf-8358-e598c2089b80",
    youtube_id: null,
  },
  {
    slug: "polyphonic-epics",
    title: "Polyphonic — Led Zeppelin's Epics",
    id: "video_channel:fa6535da-656c-4b7d-b214-b802bb6d1187",
    youtube_id: null,
  },
  {
    slug: "practical-engineering",
    title: "Practical Engineering",
    id: "video_channel:81c20690-b0ee-4e4c-834d-6a49c6cfe3fa",
    youtube_id: "UCMOqf8ab-42UUQIdVoKwjlQ",
  },
  {
    slug: "melinapendulum",
    title: "Princess Weekes",
    id: "video_channel:97e3b894-efbb-48a9-9e46-a4a54e5b57b6",
    youtube_id: "UClnCLTkRd1vhQYU1t1HyivQ",
  },
  {
    slug: "rareearth",
    title: "Rare Earth",
    id: "video_channel:42773a32-2268-4bda-81d4-2f0848977de2",
    youtube_id: "UCtGG8ucQgEJPeUPhJZ4M4jA",
  },
  {
    slug: "rare-earth-originals",
    title: "Rare Earth Originals",
    id: "video_channel:363bc5f8-6adf-4d68-9381-2eadbe1159d0",
    youtube_id: null,
  },
  {
    slug: "razbuten",
    title: "Razbuten",
    id: "video_channel:0277b8e8-360c-4290-8642-162a51f9a563",
    youtube_id: "UCfHmyqCntYHQ81ZukNu66rg",
  },
  {
    slug: "realengineering",
    title: "Real Engineering",
    id: "video_channel:cd10b3ef-9ad8-4562-9e39-5387485102a0",
    youtube_id: "UCR1IuLEqb6UEA_zQ81kwXfg",
  },
  {
    slug: "reallifelore",
    title: "RealLifeLore",
    id: "video_channel:67fdf179-b530-46c6-a0d1-6e998ae1167c",
    youtube_id: "UCP5tjEmvPItGyLhmjdwP7Ww",
  },
  {
    slug: "ghosttowns",
    title: "RealLifeLore — Ghost Towns",
    id: "video_channel:1277d93e-8ad5-4b70-b0f8-28859adda82e",
    youtube_id: null,
  },
  {
    slug: "modernconflicts",
    title: "RealLifeLore — Modern Conflicts",
    id: "video_channel:8e4165c3-8582-4044-a5a0-1465d66bc0c6",
    youtube_id: null,
  },
  {
    slug: "realscience",
    title: "Real Science",
    id: "video_channel:656b2e46-4675-42bd-adcd-f73fb706c8a8",
    youtube_id: "UC176GAQozKKjhz62H8u9vQQ",
  },
  {
    slug: "realtimehistory",
    title: "Real Time History",
    id: "video_channel:72450552-861a-4702-a0f2-74091779c5ff",
    youtube_id: "UCB1eDEd1AYG3YrRIJSZzMOQ",
  },
  {
    slug: "16daysinberlin",
    title: "Real Time History — 16 Days in Berlin",
    id: "video_channel:19c04dbf-b6e7-45e8-99e4-ad1318ce6b52",
    youtube_id: null,
  },
  {
    slug: "reneritchie",
    title: "Rene Ritchie",
    id: "video_channel:156c4256-8dbd-4787-a958-3b928151ce1b",
    youtube_id: "UCLBHPoY3NugnZYURxln3fKQ",
  },
  {
    slug: "impact",
    title: "Rene Ritchie — Impact",
    id: "video_channel:6d86a754-9239-4017-9ed7-bc71c6f07003",
    youtube_id: null,
  },
  {
    slug: "rng",
    title: "RnG",
    id: "video_channel:92589cd5-adae-4662-8cfd-a099f7be0efe",
    youtube_id: null,
  },
  {
    slug: "avgts",
    title: "Sam From Wendover's 'A Very Good Trivia Show'",
    id: "video_channel:d04b8647-5307-4173-90e1-14997955d20b",
    youtube_id: null,
  },
  {
    slug: "samonella",
    title: "Sam O'Nella",
    id: "video_channel:8ef93396-3e34-47b7-a0a4-5f94ea322ce0",
    youtube_id: "UC1DTYW241WD64ah5BFWn4JA",
  },
  {
    slug: "sarahz",
    title: "SarahZ",
    id: "video_channel:57586ec8-7cdd-4bbe-a666-f06737fb33f8",
    youtube_id: "UCK-GxvzttTnNhq3JPYpXhqg",
  },
  {
    slug: "sarah-z-debater-theater",
    title: "Sarah Z  — Debater Theater",
    id: "video_channel:ff298ddb-b160-4f5c-85bc-10a53b5349e0",
    youtube_id: null,
  },
  {
    slug: "katiestewart",
    title: "Science With Katie",
    id: "video_channel:f1227a7a-b8b8-4863-b4e7-ce7d7c45b539",
    youtube_id: "UCyFUl1BHR7rN6549LGa2e5Q",
  },
  {
    slug: "secondthought",
    title: "Second Thought",
    id: "video_channel:367677bf-c83a-42b2-a84d-cc52857fbf32",
    youtube_id: "UCJm2TgUqtK1_NLBrjNQ1P-w",
  },
  {
    slug: "simonclark",
    title: "Simon Clark",
    id: "video_channel:6fb20f6f-0e7d-435f-9697-8a0ff4e0906d",
    youtube_id: "UCRRr_xrOm66qaigIbwFLvbQ",
  },
  {
    slug: "skipintro",
    title: "Skip Intro",
    id: "video_channel:d9d0799d-9247-4a5f-a8be-e06d7ed436cf",
    youtube_id: "UCKUm503onGg3NatpBtTWHkQ",
  },
  {
    slug: "sophs-notes",
    title: "Soph's Notes",
    id: "video_channel:c6d3a8d7-0dae-4084-8b43-a1ffe664ab72",
    youtube_id: "UC-Qj80avWItNRjkZ41rzHyw",
  },
  {
    slug: "soundsgood",
    title: "Sounds Good",
    id: "video_channel:780bb853-592b-4669-99e0-a57d5783f565",
    youtube_id: "UCiuOCDkRu0-ncKMK8K4R96Q",
  },
  {
    slug: "soyouhaventread",
    title: "So You Haven't Read",
    id: "video_channel:1603eeeb-9562-471c-ab58-4f45899b6009",
    youtube_id: null,
  },
  {
    slug: "stevenbridges",
    title: "Steven Bridges",
    id: "video_channel:7552f0b4-302b-4986-85c2-a3716489783b",
    youtube_id: "UCqK0ukwGsTDh7sHih1OmLJA",
  },
  {
    slug: "stewarthicks",
    title: "Stewart Hicks",
    id: "video_channel:54bff8a1-574a-49fe-9be1-68fad64f5215",
    youtube_id: "https://www.youtube.com/user/stewarthicks",
  },
  {
    slug: "storymode",
    title: "Story Mode",
    id: "video_channel:d7a9fe83-bb42-4eed-a6f6-54d7a5d43aeb",
    youtube_id: null,
  },
  {
    slug: "strangeparts",
    title: "Strange Parts",
    id: "video_channel:3ba13534-19d6-4664-9085-636025e4f6ad",
    youtube_id: "UCO8DQrSp5yEP937qNqTooOw",
  },
  {
    slug: "suibhne",
    title: "Suibhne",
    id: "video_channel:bc68491b-f942-405f-a790-d57d78d15d95",
    youtube_id: "UCQD-0MjUbDBwm2UTVYr0Dag",
  },
  {
    slug: "superbunnyhop",
    title: "Super Bunnyhop",
    id: "video_channel:86ab55de-44db-40b7-9325-519234fc5243",
    youtube_id: "UCWqr2tH3dPshNhPjV5h1xRw",
  },
  {
    slug: "t1j",
    title: "T1J",
    id: "video_channel:c62d56c9-d567-4a72-8319-eb1ce6e3ac06",
    youtube_id: "UCajw8zd6DPpXOuF6d22Fjkw",
  },
  {
    slug: "talefoundry",
    title: "Tale Foundry",
    id: "video_channel:b72734fe-e61d-418d-84dc-2965e3b3833e",
    youtube_id: "UCusb0SpT8elBJdbcEJS_l2A",
  },
  {
    slug: "teamseas",
    title: "#TeamSeas",
    id: "video_channel:0b7faa58-7a18-41b3-b98f-53d4e7d61111",
    youtube_id: null,
  },
  {
    slug: "techaltar",
    title: "TechAltar",
    id: "video_channel:702bb67a-c7c3-4b70-8ad3-f40ad79b8683",
    youtube_id: "UCtZO3K2p8mqFwiKWb9k7fXA",
  },
  {
    slug: "technicality",
    title: "Technicality",
    id: "video_channel:b64e9493-1278-4449-9632-72d1ebfb107c",
    youtube_id: "UCnoIjdOZF4tTA7M7C4Nt4-w",
  },
  {
    slug: "technorama",
    title: "Technorama",
    id: "video_channel:cbd0df8e-5955-4218-a029-9be3c272f88b",
    youtube_id: null,
  },
  {
    slug: "terriblewritingadvice",
    title: "Terrible Writing Advice",
    id: "video_channel:33611b09-0c75-4f50-a923-a40c9d2093fe",
    youtube_id: "UC3ogrx6d9oohf6D42G44j1A",
  },
  {
    slug: "theamaazing",
    title: "TheAMaazing",
    id: "video_channel:d87deae5-7dea-4d2c-b07c-18e5d336fdf7",
    youtube_id: "UCQ9HvHH-KRYHI5ynj2kbLwQ",
  },
  {
    slug: "nextlevelworldbuilding",
    title: "The Closer Look — Next-Level Worldbuilding",
    id: "video_channel:0830b88a-0e5b-4e56-a575-fadaf6efe407",
    youtube_id: null,
  },
  {
    slug: "the-efficient-engineer",
    title: "The Efficient Engineer",
    id: "video_channel:f8700e85-232b-4373-8d4d-85992b610c19",
    youtube_id: "UCXAS_Ekkq0iFJ9dSUIkcAkw",
  },
  {
    slug: "royal-ocean-film-society",
    title: "The Royal Ocean Film Society",
    id: "video_channel:8e121225-470b-4aa0-a58d-e41bf886dd72",
    youtube_id: "UCWq-qJSudqKrzquTVep9Jwg",
  },
  {
    slug: "thespiffingbrit",
    title: "The Spiffing Brit",
    id: "video_channel:f9eef4ca-0ecd-4d63-89b8-fab4ef21dc00",
    youtube_id: "UCRHXUZ0BxbkU2MYZgsuFgkQ",
  },
  {
    slug: "thomasflight",
    title: "Thomas Flight",
    id: "video_channel:2988bd31-7e27-4eaa-b47d-ac5c56551adc",
    youtube_id: "UCUyvQV2JsICeLZP4c_h40kA",
  },
  {
    slug: "thomasfrank",
    title: "Thomas Frank",
    id: "video_channel:ad499e8c-9bd6-4196-aad6-93e695a4319b",
    youtube_id: "UCG-KntY7aVnIGXYEBQvmBAQ",
  },
  {
    slug: "thomasfrankexplains",
    title: "Thomas Frank Explains",
    id: "video_channel:5304a234-c5ba-4213-89dd-6360b81769bb",
    youtube_id: "UCd_WBvzBg1UbHE8j8MIL5Ng",
  },
  {
    slug: "tierzoo",
    title: "TierZoo",
    id: "video_channel:6ca6d676-e2d2-4e7f-8b04-aead15f41996",
    youtube_id: "UCHsRtomD4twRf5WVHHk-cMw",
  },
  {
    slug: "tierzoo-lets-play",
    title: "TierZoo — Let's Play Outside",
    id: "video_channel:dff00d5b-9915-4ec9-890e-c2dcc4a63bb5",
    youtube_id: null,
  },
  {
    slug: "tldrnewseu",
    title: "TLDR News EU",
    id: "video_channel:35009c31-e1cc-4410-bd92-5f618b115944",
    youtube_id: "UC-eegKVWEgBCa4OzjnK_PtA",
  },
  {
    slug: "tldrnewsglobal",
    title: "TLDR News Global",
    id: "video_channel:e3eda4cd-3ee3-414b-a489-4b7c5f731a6c",
    youtube_id: "UC-uhvujip5deVcEtLxnW8qg",
  },
  {
    slug: "tldrnewsuk",
    title: "TLDR News UK",
    id: "video_channel:238fe61e-02b2-4789-885b-77f63c5a8e08",
    youtube_id: "UCSMqateX8OA2s1wsOR2EgJA",
  },
  {
    slug: "tldrnewsus",
    title: "TLDR News US",
    id: "video_channel:f9426b1b-81cd-4bd7-a075-9e6cfd836ad0",
    youtube_id: "UCGg5QDOcFZYS3FbLVHRvJUw",
  },
  {
    slug: "todd-in-the-shadows",
    title: "Todd in the Shadows",
    id: "video_channel:b064663b-88cf-4363-bdd9-de2986ce4e1c",
    youtube_id: "UCaTSjmqzOO-P8HmtVW3t7sA",
  },
  {
    slug: "tomnicholas",
    title: "Tom Nicholas",
    id: "video_channel:396542ae-0dda-4b8c-b751-31b66e0428ca",
    youtube_id: "UCxt2r57cLastdmrReiQJkEg",
  },
  {
    slug: "tom-scott-presents-money",
    title: "Tom Scott Presents: Money",
    id: "video_channel:54967c6b-3473-4260-8e72-26511af7a3c6",
    youtube_id: null,
  },
  {
    slug: "unknowncity",
    title: "The Unknown City",
    id: "video_channel:41e6c81c-07b6-459c-b05a-81595d260b13",
    youtube_id: null,
  },
  {
    slug: "tracedominguez",
    title: "Uno Dos of Trace",
    id: "video_channel:b84c0645-428b-4ec4-8b0c-fe592227e23c",
    youtube_id: "UCerL4WZxy37tdPyDt2x3zMA",
  },
  {
    slug: "upandatom",
    title: "Up and Atom",
    id: "video_channel:3514e35d-3640-4047-9a03-4a280b72f7db",
    youtube_id: "UCSIvk78tK2TiviLQn4fSHaw",
  },
  {
    slug: "an-argument-against-reality",
    title: "Up and Atom — An Argument Against Reality",
    id: "video_channel:2601d385-c22e-46a0-9a00-5c9e4a3eb65b",
    youtube_id: null,
  },
  {
    slug: "ismathinvented",
    title: "Up and Atom — Is Mathematics Invented or Discovered?",
    id: "video_channel:8bb46a00-e05a-44fc-bd11-450cb04f03b4",
    youtube_id: null,
  },
  {
    slug: "vector",
    title: "Vector",
    id: "video_channel:b56d64f9-f6cc-4adb-b6c8-aa89571c7b18",
    youtube_id: "UC3rK4_AbQfu1Lv9GI1tKp4A",
  },
  {
    slug: "volksgeist",
    title: "Volksgeist",
    id: "video_channel:197dfaf2-ec84-4512-9475-27ebbd4e3b69",
    youtube_id: "UCikpumVCosztN-ZUthleRug",
  },
  {
    slug: "volksgeist-a-brief-history-of-music",
    title: "Volksgeist — A Brief History of Music",
    id: "video_channel:2dc63969-a85b-4fd8-8d82-f4d10f59f9e0",
    youtube_id: null,
  },
  {
    slug: "wendover",
    title: "Wendover",
    id: "video_channel:fe4d9c1c-017b-494c-9afc-e79e6859b211",
    youtube_id: "UC9RM-iSvTu1uPJb8X5yp3EQ",
  },
  {
    slug: "alaskassilentsummer",
    title: "Wendover — Alaska’s Silent Summer",
    id: "video_channel:276b4d44-658d-4d60-9491-a04d1143936a",
    youtube_id: null,
  },
  {
    slug: "thecoloradoproblem",
    title: "Wendover — The Colorado Problem",
    id: "video_channel:1cad47b0-cc28-427e-b6f0-4faf05d02ccb",
    youtube_id: null,
  },
  {
    slug: "wendover-final-days-of-majuro",
    title: "Wendover — The Final Years of Majuro",
    id: "video_channel:573ca46e-7ff2-41e4-9fbd-084774b4fff8",
    youtube_id: null,
  },
  {
    slug: "wendover-airport",
    title: "Wendover — The World's Most Useful Airport",
    id: "video_channel:88d3ff2d-09cd-403e-90dc-d35c4fd5d9ab",
    youtube_id: null,
  },
  {
    slug: "wonderwhy",
    title: "WonderWhy",
    id: "video_channel:6a7cd221-3b93-416a-82e1-b985dba78b36",
    youtube_id: "UCcEPmwpXKrKzZahqjwpIAsQ",
  },
  {
    slug: "workingtitles",
    title: "Working Titles",
    id: "video_channel:41aa6b97-98a2-4df0-9977-ca4c1b2aa581",
    youtube_id: "UCI_39phihRzJz_y5ySfp9NA",
  },
  {
    slug: "zachhighley",
    title: "Zach Highley",
    id: "video_channel:5c4f31f6-55b5-4aaf-a016-91d32c7bde03",
    youtube_id: "UCaffuWQ2mLfRevosyKoz87Q",
  },
];

export default youtubeIds;

//https://www.youtube.com/results?search_query=
