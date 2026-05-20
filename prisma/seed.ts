import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);

async function main() {
  // ── 1. WIPE (reverse dependency order) ──────────────────────────────────
  console.log("🗑  Wiping existing data…");
  await prisma.activityLog.deleteMany();
  await prisma.visitorLogBook.deleteMany();
  await prisma.visitorLog.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.member.deleteMany();
  await prisma.class.deleteMany();
  await prisma.shelf.deleteMany();
  await prisma.libraryMap.deleteMany();
  await prisma.category.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ All tables cleared\n");

  // ── 2. USERS ──────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash("admin1234", 10);
  const staffPw = await bcrypt.hash("staff1234", 10);

  const [adminUser] = await Promise.all([
    prisma.user.create({ data: { email: "admin@hunsenkchao.edu.kh",   password: adminPw, nameEn: "Admin",       nameKh: "អ្នកគ្រប់គ្រង", role: "ADMIN"     } }),
    prisma.user.create({ data: { email: "sophea@hunsenkchao.edu.kh",  password: staffPw, nameEn: "Sophea Chan", nameKh: "ចាន់ សុភា",      role: "LIBRARIAN" } }),
    prisma.user.create({ data: { email: "dara@hunsenkchao.edu.kh",    password: staffPw, nameEn: "Dara Pich",   nameKh: "ពិជ ដារ៉ា",      role: "STAFF"     } }),
  ]);
  const seederName = adminUser.nameEn;
  console.log("✓ 3 users seeded");

  // ── 3. SETTINGS ───────────────────────────────────────────────────────────
  await prisma.setting.createMany({
    data: [
      { key: "libraryName",        value: "Hun Sen Kchao High School Library" },
      { key: "libraryNameKh",      value: "បណ្ណាល័យវិទ្យាល័យ ហ៊ុនសែនខ្ចៅ" },
      { key: "address",            value: "ភូមិថ្លុកជ្រៅ ឃុំខ្ចៅ ស្រុកកងមាស ខេត្តកំពង់ចាម" },
      { key: "phone",              value: "+855 12 000 000" },
      { key: "email",              value: "library@hunsenkchao.edu.kh" },
      { key: "loanDaysStudent",    value: "14" },
      { key: "loanDaysTeacher",    value: "30" },
      { key: "loanDaysPublic",     value: "14" },
      { key: "loanDaysResearcher", value: "30" },
      { key: "finePerDay",         value: "500" },
      { key: "maxLoansPerMember",  value: "5" },
      { key: "maxRenewalsPerLoan", value: "2" },
    ],
  });
  console.log("✓ 12 settings seeded");

  // ── 4. CATEGORIES (Khmer primary) ────────────────────────────────────────
  await prisma.category.createMany({
    data: [
      "រឿងប្រឌិត",       // Fiction
      "ក្រៅប្រឌិត",      // Non-Fiction
      "វិទ្យាសាស្ត្រ",   // Science
      "ប្រវត្តិសាស្ត្រ", // History
      "សាសនា",           // Religion
      "ទស្សនវិជ្ជា",    // Philosophy
      "អប់រំ",            // Education
      "សុខភាព",          // Health
      "សិល្បៈ",          // Arts
      "បច្ចេកវិទ្យា",    // Technology
      "ច្បាប់",           // Law
      "សេដ្ឋកិច្ច",      // Economics
      "កសិកម្ម",         // Agriculture
      "អក្សរសិល្ប៍",     // Literature
      "ភាសា",            // Language
    ].map((name) => ({ name })),
  });
  console.log("✓ 15 categories seeded");

  // ── 5. CLASSES (name = grade+section, matching app format) ───────────────
  const classData = [
    { name: "7A",  grade: "7"  },
    { name: "7B",  grade: "7"  },
    { name: "8A",  grade: "8"  },
    { name: "8B",  grade: "8"  },
    { name: "9A",  grade: "9"  },
    { name: "9B",  grade: "9"  },
    { name: "10A", grade: "10" },
    { name: "10B", grade: "10" },
    { name: "11A", grade: "11" },
    { name: "11B", grade: "11" },
    { name: "12A", grade: "12" },
    { name: "12B", grade: "12" },
  ];
  const classes = await Promise.all(classData.map((c) => prisma.class.create({ data: c })));
  const classMap = Object.fromEntries(classes.map((c) => [c.name, c.id]));
  console.log(`✓ ${classes.length} classes seeded`);

  // ── 6. SHELVES (Cabinet → Side → Shelf → Section hierarchy) ────────────
  const shelfData = [
    // Cabinet A — Literature & Fiction (double-sided)
    { code: "A-L-1-1", cabinet: "A", side: "L", shelfNo: 1, sectionNo: 1, zone: "រឿងប្រឌិត និង អក្សរសិល្ប៍" },
    { code: "A-L-1-2", cabinet: "A", side: "L", shelfNo: 1, sectionNo: 2, zone: "រឿងប្រឌិត និង អក្សរសិល្ប៍" },
    { code: "A-L-2-1", cabinet: "A", side: "L", shelfNo: 2, sectionNo: 1, zone: "រឿងប្រឌិត និង អក្សរសិល្ប៍" },
    { code: "A-L-2-2", cabinet: "A", side: "L", shelfNo: 2, sectionNo: 2, zone: "រឿងប្រឌិត និង អក្សរសិល្ប៍" },
    { code: "A-R-1-1", cabinet: "A", side: "R", shelfNo: 1, sectionNo: 1, zone: "អក្សរសិល្ប៍ខ្មែរ" },
    { code: "A-R-1-2", cabinet: "A", side: "R", shelfNo: 1, sectionNo: 2, zone: "អក្សរសិល្ប៍ខ្មែរ" },
    // Cabinet B — History & Social Studies (double-sided)
    { code: "B-L-1-1", cabinet: "B", side: "L", shelfNo: 1, sectionNo: 1, zone: "ប្រវត្តិសាស្ត្រ និង សង្គមវិទ្យា" },
    { code: "B-L-1-2", cabinet: "B", side: "L", shelfNo: 1, sectionNo: 2, zone: "ប្រវត្តិសាស្ត្រ និង សង្គមវិទ្យា" },
    { code: "B-L-2-1", cabinet: "B", side: "L", shelfNo: 2, sectionNo: 1, zone: "ប្រវត្តិសាស្ត្រ និង សង្គមវិទ្យា" },
    { code: "B-R-1-1", cabinet: "B", side: "R", shelfNo: 1, sectionNo: 1, zone: "ភូមិវិទ្យា និង ដែនដី" },
    { code: "B-R-1-2", cabinet: "B", side: "R", shelfNo: 1, sectionNo: 2, zone: "ភូមិវិទ្យា និង ដែនដី" },
    // Cabinet C — Science & Technology (single-sided, wall cabinet)
    { code: "C-1-1", cabinet: "C", shelfNo: 1, sectionNo: 1, zone: "វិទ្យាសាស្ត្រ និង បច្ចេកវិទ្យា" },
    { code: "C-1-2", cabinet: "C", shelfNo: 1, sectionNo: 2, zone: "វិទ្យាសាស្ត្រ និង បច្ចេកវិទ្យា" },
    { code: "C-1-3", cabinet: "C", shelfNo: 1, sectionNo: 3, zone: "វិទ្យាសាស្ត្រ និង បច្ចេកវិទ្យា" },
    { code: "C-2-1", cabinet: "C", shelfNo: 2, sectionNo: 1, zone: "គណិតវិទ្យា" },
    { code: "C-2-2", cabinet: "C", shelfNo: 2, sectionNo: 2, zone: "គណិតវិទ្យា" },
    // Cabinet D — Religion & Philosophy (single-sided)
    { code: "D-1-1", cabinet: "D", shelfNo: 1, sectionNo: 1, zone: "សាសនា និង ទស្សនវិជ្ជា" },
    { code: "D-1-2", cabinet: "D", shelfNo: 1, sectionNo: 2, zone: "សាសនា និង ទស្សនវិជ្ជា" },
    // Cabinet E — Education & Language (double-sided)
    { code: "E-L-1-1", cabinet: "E", side: "L", shelfNo: 1, sectionNo: 1, zone: "អប់រំ" },
    { code: "E-L-1-2", cabinet: "E", side: "L", shelfNo: 1, sectionNo: 2, zone: "អប់រំ" },
    { code: "E-L-2-1", cabinet: "E", side: "L", shelfNo: 2, sectionNo: 1, zone: "អប់រំ" },
    { code: "E-R-1-1", cabinet: "E", side: "R", shelfNo: 1, sectionNo: 1, zone: "ភាសា និង ភាសាសាស្ត្រ" },
    { code: "E-R-1-2", cabinet: "E", side: "R", shelfNo: 1, sectionNo: 2, zone: "ភាសា និង ភាសាសាស្ត្រ" },
    // Cabinet F — Health, Law & Economics (single-sided)
    { code: "F-1-1", cabinet: "F", shelfNo: 1, sectionNo: 1, zone: "សុខភាព ច្បាប់ និង សេដ្ឋកិច្ច" },
    { code: "F-1-2", cabinet: "F", shelfNo: 1, sectionNo: 2, zone: "សុខភាព ច្បាប់ និង សេដ្ឋកិច្ច" },
    { code: "F-2-1", cabinet: "F", shelfNo: 2, sectionNo: 1, zone: "សុខភាព ច្បាប់ និង សេដ្ឋកិច្ច" },
  ];
  const shelves = await Promise.all(shelfData.map((s) => prisma.shelf.create({ data: s })));
  const shelfMap = Object.fromEntries(shelves.map((s) => [s.code, s.id]));
  console.log(`✓ ${shelves.length} shelves seeded`);

  // ── 7. LIBRARY MAP ────────────────────────────────────────────────────────
  await prisma.libraryMap.create({ data: { rows: 8, cols: 12, cells: [] } });
  console.log("✓ Library map seeded");

  // ── 8. BOOKS ──────────────────────────────────────────────────────────────
  const bookData = [
    { isbn: "978-9924-9065-0-1", titleEn: "The History of Cambodia",              titleKh: "ប្រវត្តិសាស្ត្រកម្ពុជា",            author: "David Chandler",    publisher: "Silkworm Books",         publishYear: 2018, category: "ប្រវត្តិសាស្ត្រ", deweyCode: "959.6",    totalCopies: 4, tags: ["history","cambodia","khmer"],        shelfCode: "B-L-1-1" },
    { isbn: "978-9924-9065-1-8", titleEn: "Angkor and the Khmer Civilization",    titleKh: "អង្គរ និងអារ្យធម៌ខ្មែរ",            author: "Michael Coe",       publisher: "Thames & Hudson",        publishYear: 2015, category: "ប្រវត្តិសាស្ត្រ", deweyCode: "959.6",    totalCopies: 3, tags: ["angkor","khmer","archaeology"],       shelfCode: "B-L-1-1" },
    { isbn: "978-9924-9065-2-5", titleEn: "Buddhism in Cambodia",                  titleKh: "ព្រះពុទ្ធសាសនានៅកម្ពុជា",         author: "Ian Harris",        publisher: "Univ. of Hawaii Press",  publishYear: 2005, category: "សាសនា",           deweyCode: "294.3",    totalCopies: 2, tags: ["buddhism","religion","cambodia"],     shelfCode: "D-1-1" },
    { isbn: "978-9924-9065-3-2", titleEn: "Khmer Rouge and the Genocide",          titleKh: "ខ្មែរក្រហម និងរបបប្រល័យពូជ",       author: "Ben Kiernan",       publisher: "Yale University Press",  publishYear: 2008, category: "ប្រវត្តិសាស្ត្រ", deweyCode: "959.604",  totalCopies: 3, tags: ["genocide","history","politics"],       shelfCode: "B-L-2-1" },
    { isbn: "978-9924-9065-4-9", titleEn: "Introduction to Computer Science",      titleKh: "មូលដ្ឋានគ្រឹះវិទ្យាសាស្ត្រកុំព្យូទ័រ",author: "John Brookshear",  publisher: "Pearson",                publishYear: 2019, category: "បច្ចេកវិទ្យា",   deweyCode: "004",      totalCopies: 5, tags: ["computer","programming","science"],   shelfCode: "C-1-1" },
    { isbn: "978-9924-9065-5-6", titleEn: "Khmer Language and Linguistics",        titleKh: "ភាសា និងភាសាសាស្ត្រខ្មែរ",         author: "Judith Jacob",      publisher: "SOAS",                   publishYear: 1996, category: "ភាសា",            deweyCode: "495.9",    totalCopies: 2, tags: ["khmer","linguistics","language"],      shelfCode: "E-R-1-1" },
    { isbn: "978-9924-9065-6-3", titleEn: "Rice Farming in Southeast Asia",        titleKh: "ការដាំស្រូវនៅអាស៊ីអាគ្នេយ៍",       author: "Nguyen Van Luat",   publisher: "IRRI",                   publishYear: 2012, category: "កសិកម្ម",         deweyCode: "633.18",   totalCopies: 3, tags: ["agriculture","rice","farming"],       shelfCode: "F-1-1" },
    { isbn: "978-9924-9065-7-0", titleEn: "Cambodian Law and Governance",          titleKh: "ច្បាប់ និងរដ្ឋាភិបាលកម្ពុជា",      author: "John Ciorciari",    publisher: "Cornell",                publishYear: 2014, category: "ច្បាប់",           deweyCode: "349.596",  totalCopies: 2, tags: ["law","governance","cambodia"],        shelfCode: "F-1-1" },
    { isbn: "978-9924-9065-8-7", titleEn: "Traditional Khmer Music",               titleKh: "តន្ត្រីបុរាណខ្មែរ",                author: "Sam-Ang Sam",       publisher: "Kent State University",  publishYear: 2002, category: "សិល្បៈ",          deweyCode: "781.62",   totalCopies: 2, tags: ["music","arts","khmer","culture"],     shelfCode: "A-L-1-2" },
    { isbn: "978-9924-9065-9-4", titleEn: "Health and Medicine in Cambodia",       titleKh: "សុខភាព និងវេជ្ជសាស្ត្រនៅកម្ពុជា", author: "Margaret Hardiman", publisher: "WHO",                    publishYear: 2010, category: "សុខភាព",          deweyCode: "610",      totalCopies: 3, tags: ["health","medicine","public health"],  shelfCode: "F-1-1" },
    { isbn: "978-9924-9066-0-0", titleEn: "Economic Development of Cambodia",      titleKh: "ការអភិវឌ្ឍន៍សេដ្ឋកិច្ចកម្ពុជា",  author: "Sophal Ear",        publisher: "Stanford Univ. Press",   publishYear: 2012, category: "សេដ្ឋកិច្ច",     deweyCode: "330.9596", totalCopies: 2, tags: ["economics","development","cambodia"], shelfCode: "F-1-1" },
    { isbn: "978-9924-9066-1-7", titleEn: "Cambodian Fiction: Stories of the Land",titleKh: "រឿងប្រឌិតខ្មែរ",                   author: "Teri Yamada",       publisher: "Ling",                   publishYear: 2005, category: "រឿងប្រឌិត",      deweyCode: "895.932",  totalCopies: 4, tags: ["fiction","short stories","literature"],shelfCode: "A-L-1-1" },
    { isbn: "978-9924-9066-2-4", titleEn: "Environmental Science",                 titleKh: "វិទ្យាសាស្ត្របរិស្ថាន",            author: "Richard Wright",    publisher: "Pearson",                publishYear: 2020, category: "វិទ្យាសាស្ត្រ",  deweyCode: "363.7",    totalCopies: 3, tags: ["environment","science","ecology"],    shelfCode: "C-1-1" },
    { isbn: "978-9924-9066-3-1", titleEn: "Philosophy of the Mind",                titleKh: "ទស្សនវិជ្ជានៃចិត្ត",              author: "Jaegwon Kim",       publisher: "Blackwell",              publishYear: 2011, category: "ទស្សនវិជ្ជា",    deweyCode: "128.2",    totalCopies: 2, tags: ["philosophy","mind","consciousness"],  shelfCode: "D-1-1" },
    { isbn: "978-9924-9066-4-8", titleEn: "Primary Education Methods",             titleKh: "វិធីសាស្ត្របង្រៀនថ្នាក់បឋម",      author: "Lim Vuthy",         publisher: "MoEYS Cambodia",         publishYear: 2017, category: "អប់រំ",            deweyCode: "372.1",    totalCopies: 5, tags: ["education","teaching","primary"],     shelfCode: "E-L-1-1" },
    { isbn: "978-9924-9066-5-5", titleEn: "Khmer Poetry and Classical Literature", titleKh: "កំណាព្យ និងអក្សរសិល្ប៍ខ្មែរ",    author: "Khing Hoc Dy",      publisher: "EFEO",                   publishYear: 1990, category: "អក្សរសិល្ប៍",     deweyCode: "895.9",    totalCopies: 3, tags: ["poetry","literature","khmer"],        shelfCode: "A-R-1-1" },
    { isbn: "978-9924-9066-6-2", titleEn: "Mathematics for Secondary School",      titleKh: "គណិតវិទ្យាសម្រាប់វិទ្យាល័យ",     author: "Chea Sothea",       publisher: "MoEYS Cambodia",         publishYear: 2021, category: "អប់រំ",            deweyCode: "510",      totalCopies: 6, tags: ["mathematics","textbook","secondary"], shelfCode: "E-L-1-1" },
    { isbn: "978-9924-9066-7-9", titleEn: "Biology: Living Systems",               titleKh: "ជីវវិទ្យា: ប្រព័ន្ធជីវិត",        author: "Kenneth Miller",    publisher: "Glencoe",                publishYear: 2018, category: "វិទ្យាសាស្ត្រ",  deweyCode: "570",      totalCopies: 4, tags: ["biology","science","textbook"],       shelfCode: "C-1-1" },
    { isbn: "978-9924-9066-8-6", titleEn: "World Geography",                       titleKh: "ភូមិវិទ្យាពិភពលោក",               author: "Jackson Spielvogel",publisher: "National Geographic",    publishYear: 2019, category: "ក្រៅប្រឌិត",     deweyCode: "910",      totalCopies: 3, tags: ["geography","world","textbook"],       shelfCode: "B-R-1-1" },
    { isbn: "978-9924-9066-9-3", titleEn: "Introduction to Physics",               titleKh: "មូលដ្ឋានគ្រឹះរូបវិទ្យា",          author: "Paul Tipler",       publisher: "W. H. Freeman",          publishYear: 2020, category: "វិទ្យាសាស្ត្រ",  deweyCode: "530",      totalCopies: 4, tags: ["physics","science","textbook"],       shelfCode: "C-1-1" },
  ];

  const books = await Promise.all(
    bookData.map(({ shelfCode, ...b }) =>
      prisma.book.create({
        data: { ...b, availableCopies: b.totalCopies, shelfId: shelfMap[shelfCode] },
      })
    )
  );
  console.log(`✓ ${books.length} books seeded`);

  // ── 9. MEMBERS ────────────────────────────────────────────────────────────
  type MemberType = "STUDENT" | "TEACHER" | "PUBLIC" | "RESEARCHER";
  const memberData: {
    memberId: string; nameEn: string; nameKh: string; email?: string; phone?: string;
    type: MemberType; expiresAt?: Date; className?: string;
  }[] = [
    // Students – Grade 7
    { memberId: "LIB-2025-001", nameEn: "Kosal Prak",      nameKh: "ប្រាក់ កុសល",    email: "kosal@hunsenkchao.edu.kh",    phone: "+855 12 345 678", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "7A" },
    { memberId: "LIB-2025-002", nameEn: "Sreymom Heng",    nameKh: "ហេង ស្រីមុំ",   email: "sreymom@hunsenkchao.edu.kh",  phone: "+855 17 234 567", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "7A" },
    { memberId: "LIB-2025-003", nameEn: "Chanthy Ros",     nameKh: "រស់ ចន្ទី",      email: "chanthy@hunsenkchao.edu.kh",  phone: "+855 12 111 222", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "7B" },
    { memberId: "LIB-2025-004", nameEn: "Vicheka Nou",     nameKh: "នូ វិចេកា",      email: "vicheka@hunsenkchao.edu.kh",  phone: "+855 96 123 456", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "7B" },
    // Students – Grade 8
    { memberId: "LIB-2025-005", nameEn: "Borey Lim",       nameKh: "លឹម បូរី",       email: "borey@hunsenkchao.edu.kh",    phone: "+855 77 987 654", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "8A" },
    { memberId: "LIB-2025-006", nameEn: "Pisey Chan",      nameKh: "ចាន់ ពិសី",      email: "pisey@hunsenkchao.edu.kh",    phone: "+855 15 876 543", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "8A" },
    { memberId: "LIB-2025-007", nameEn: "Dalis Keo",       nameKh: "កែវ ដាលីស",      email: "dalis@hunsenkchao.edu.kh",    phone: "+855 98 111 222", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "8B" },
    { memberId: "LIB-2025-008", nameEn: "Monich Sar",      nameKh: "សារ មុននិច",     email: "monich@hunsenkchao.edu.kh",   phone: "+855 69 333 444", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "8B" },
    // Students – Grade 9
    { memberId: "LIB-2025-009", nameEn: "Ratana Sok",      nameKh: "សុក រតនា",       email: "ratana@hunsenkchao.edu.kh",   phone: "+855 11 654 321", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "9A" },
    { memberId: "LIB-2025-010", nameEn: "Theary Mao",      nameKh: "មៅ ធារី",        email: "theary@hunsenkchao.edu.kh",   phone: "+855 93 555 666", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "9A" },
    { memberId: "LIB-2025-011", nameEn: "Kimhak Yun",      nameKh: "យូ គីមហាក់",     email: "kimhak@hunsenkchao.edu.kh",   phone: "+855 86 777 888", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "9B" },
    { memberId: "LIB-2025-012", nameEn: "Sopheak Im",      nameKh: "អ៊ិម សុភ័ក្ដ",   email: "sopheak@hunsenkchao.edu.kh",  phone: "+855 17 333 444", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "9B" },
    // Students – Grade 10–12
    { memberId: "LIB-2025-013", nameEn: "Dara Chhorn",     nameKh: "ឆូន ដារ៉ា",      email: "darac@hunsenkchao.edu.kh",    phone: "+855 12 888 999", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "10A" },
    { memberId: "LIB-2025-014", nameEn: "Sreynich Oum",    nameKh: "អ៊ំ ស្រីនិច",   email: "sreynich@hunsenkchao.edu.kh", phone: "+855 77 100 200", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "10B" },
    { memberId: "LIB-2025-015", nameEn: "Kakada Seng",     nameKh: "សេង កក្កដា",     email: "kakada@hunsenkchao.edu.kh",   phone: "+855 93 200 300", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "11A" },
    { memberId: "LIB-2025-016", nameEn: "Leap Phon",       nameKh: "ភន លាភ",         email: "leap@hunsenkchao.edu.kh",     phone: "+855 15 400 500", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "11B" },
    { memberId: "LIB-2025-017", nameEn: "Sokunthea Kin",   nameKh: "គិន សុគន្ធា",    email: "sokunthea@hunsenkchao.edu.kh",phone: "+855 69 600 700", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "12A" },
    { memberId: "LIB-2025-018", nameEn: "Visal Chhim",     nameKh: "ឈីម វិសាល",      email: "visal@hunsenkchao.edu.kh",    phone: "+855 98 700 800", type: "STUDENT", expiresAt: new Date("2026-06-30"), className: "12B" },
    // Teachers
    { memberId: "LIB-T-001",    nameEn: "Vuthy Kem",       nameKh: "កែម វុទ្ធី",      email: "vuthy@hunsenkchao.edu.kh",    phone: "+855 12 001 002", type: "TEACHER", expiresAt: new Date("2027-06-30") },
    { memberId: "LIB-T-002",    nameEn: "Panha Chheng",    nameKh: "ឈេង បញ្ញា",      email: "panha@hunsenkchao.edu.kh",    phone: "+855 17 002 003", type: "TEACHER", expiresAt: new Date("2027-06-30") },
    { memberId: "LIB-T-003",    nameEn: "Sothea Nhem",     nameKh: "ញ៉ែម សុធា",       email: "sothea@hunsenkchao.edu.kh",   phone: "+855 96 003 004", type: "TEACHER", expiresAt: new Date("2027-06-30") },
    // Public (community members near the school)
    { memberId: "LIB-P-001",    nameEn: "Makara Ros",      nameKh: "រស់ មករា",        email: "makara@gmail.com",            phone: "+855 77 010 020", type: "PUBLIC",  expiresAt: new Date("2026-12-31") },
    { memberId: "LIB-P-002",    nameEn: "Lina Kong",       nameKh: "គង់ លីណា",        email: "lina@gmail.com",              phone: "+855 86 020 030", type: "PUBLIC",  expiresAt: new Date("2026-12-31") },
    // Researchers
    { memberId: "LIB-R-001",    nameEn: "Prof. Mony Ouk",  nameKh: "អ៊ុក ម៉ូនី",      email: "mony@rupp.edu.kh",            phone: "+855 12 100 200", type: "RESEARCHER", expiresAt: new Date("2027-12-31") },
    { memberId: "LIB-R-002",    nameEn: "Dr. Sambath Keo", nameKh: "កែវ សំបាត",       email: "sambath@ica.edu.kh",          phone: "+855 17 200 300", type: "RESEARCHER", expiresAt: new Date("2027-12-31") },
  ];

  const members = await Promise.all(
    memberData.map(({ className, ...m }) =>
      prisma.member.create({
        data: { ...m, classId: className ? classMap[className] : undefined },
      })
    )
  );
  const mId = (n: number) => members[n].id;
  console.log(`✓ ${members.length} members seeded`);

  // ── 10. LOANS ─────────────────────────────────────────────────────────────
  // Track how many copies are checked out per book index
  const checkedOut = new Array(books.length).fill(0);

  type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST";

  const loanData: {
    bookIdx: number; memberIdx: number;
    borrowedAt: Date; dueAt: Date; returnedAt: Date | null;
    status: LoanStatus;
    fineAmount: number; finePaid: boolean; fineWaived: boolean;
    finePaidAt?: Date; fineNote?: string;
    renewalCount?: number;
    checkedOutBy: string; closedBy?: string;
  }[] = [
    // ── Returned – no fine
    { bookIdx:  0, memberIdx:  0, borrowedAt: daysAgo(50), dueAt: daysAgo(36), returnedAt: daysAgo(37), status: "RETURNED", fineAmount:    0, finePaid: false, fineWaived: false, checkedOutBy: seederName, closedBy: seederName },
    { bookIdx:  1, memberIdx:  1, borrowedAt: daysAgo(45), dueAt: daysAgo(15), returnedAt: daysAgo(16), status: "RETURNED", fineAmount:    0, finePaid: false, fineWaived: false, checkedOutBy: seederName, closedBy: seederName },
    { bookIdx:  2, memberIdx: 18, borrowedAt: daysAgo(35), dueAt: daysAgo(5),  returnedAt: daysAgo(6),  status: "RETURNED", fineAmount:    0, finePaid: false, fineWaived: false, checkedOutBy: seederName, closedBy: seederName },
    { bookIdx:  3, memberIdx: 19, borrowedAt: daysAgo(60), dueAt: daysAgo(30), returnedAt: daysAgo(29), status: "RETURNED", fineAmount:    0, finePaid: false, fineWaived: false, checkedOutBy: seederName, closedBy: seederName },
    { bookIdx: 15, memberIdx: 16, borrowedAt: daysAgo(20), dueAt: daysAgo(6),  returnedAt: daysAgo(7),  status: "RETURNED", fineAmount:    0, finePaid: false, fineWaived: false, checkedOutBy: seederName, closedBy: seederName },
    { bookIdx: 16, memberIdx: 17, borrowedAt: daysAgo(25), dueAt: daysAgo(11), returnedAt: daysAgo(12), status: "RETURNED", fineAmount:    0, finePaid: false, fineWaived: false, checkedOutBy: seederName, closedBy: seederName },
    // ── Returned – fine paid
    { bookIdx:  5, memberIdx:  6, borrowedAt: daysAgo(40), dueAt: daysAgo(26), returnedAt: daysAgo(23), status: "RETURNED", fineAmount: 1500, finePaid: true,  fineWaived: false, finePaidAt: daysAgo(23), fineNote: "3 days late",          checkedOutBy: seederName, closedBy: seederName },
    { bookIdx:  6, memberIdx:  7, borrowedAt: daysAgo(55), dueAt: daysAgo(27), returnedAt: daysAgo(20), status: "RETURNED", fineAmount: 3500, finePaid: true,  fineWaived: false, finePaidAt: daysAgo(20), fineNote: "7 days overdue",       checkedOutBy: seederName, closedBy: seederName },
    { bookIdx: 17, memberIdx: 12, borrowedAt: daysAgo(30), dueAt: daysAgo(16), returnedAt: daysAgo(10), status: "RETURNED", fineAmount: 3000, finePaid: true,  fineWaived: false, finePaidAt: daysAgo(10),                                   checkedOutBy: seederName, closedBy: seederName },
    // ── Returned – fine waived
    { bookIdx:  8, memberIdx:  9, borrowedAt: daysAgo(70), dueAt: daysAgo(40), returnedAt: daysAgo(35), status: "RETURNED", fineAmount: 2500, finePaid: true,  fineWaived: true,  finePaidAt: daysAgo(35), fineNote: "Waived – medical leave", checkedOutBy: seederName, closedBy: seederName },
    { bookIdx: 18, memberIdx: 13, borrowedAt: daysAgo(28), dueAt: daysAgo(14), returnedAt: daysAgo(8),  status: "RETURNED", fineAmount: 3000, finePaid: true,  fineWaived: true,  finePaidAt: daysAgo(8),  fineNote: "Waived – exam period",   checkedOutBy: seederName, closedBy: seederName },
    // ── Active
    { bookIdx:  9, memberIdx:  0, borrowedAt: daysAgo(5),  dueAt: daysFromNow(9),  returnedAt: null, status: "ACTIVE", fineAmount: 0, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    { bookIdx: 10, memberIdx:  1, borrowedAt: daysAgo(10), dueAt: daysFromNow(20), returnedAt: null, status: "ACTIVE", fineAmount: 0, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    { bookIdx: 11, memberIdx:  2, borrowedAt: daysAgo(3),  dueAt: daysFromNow(11), returnedAt: null, status: "ACTIVE", fineAmount: 0, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    { bookIdx: 12, memberIdx: 18, borrowedAt: daysAgo(7),  dueAt: daysFromNow(7),  returnedAt: null, status: "ACTIVE", fineAmount: 0, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    { bookIdx: 13, memberIdx: 19, borrowedAt: daysAgo(2),  dueAt: daysFromNow(28), returnedAt: null, status: "ACTIVE", fineAmount: 0, finePaid: false, fineWaived: false, checkedOutBy: seederName, renewalCount: 1 },
    { bookIdx: 19, memberIdx: 20, borrowedAt: daysAgo(4),  dueAt: daysFromNow(26), returnedAt: null, status: "ACTIVE", fineAmount: 0, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    // ── Overdue
    { bookIdx: 14, memberIdx:  3, borrowedAt: daysAgo(25), dueAt: daysAgo(11), returnedAt: null, status: "OVERDUE", fineAmount: 5500, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    { bookIdx:  1, memberIdx:  4, borrowedAt: daysAgo(32), dueAt: daysAgo(18), returnedAt: null, status: "OVERDUE", fineAmount: 9000, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    { bookIdx:  4, memberIdx:  6, borrowedAt: daysAgo(22), dueAt: daysAgo(8),  returnedAt: null, status: "OVERDUE", fineAmount: 4000, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    { bookIdx: 16, memberIdx: 14, borrowedAt: daysAgo(20), dueAt: daysAgo(6),  returnedAt: null, status: "OVERDUE", fineAmount: 3000, finePaid: false, fineWaived: false, checkedOutBy: seederName },
    // ── Lost – fine unpaid
    { bookIdx:  7, memberIdx:  5, borrowedAt: daysAgo(90), dueAt: daysAgo(76), returnedAt: daysAgo(10), status: "LOST", fineAmount: 25000, finePaid: false, fineWaived: false, fineNote: "Lost by student – replacement cost",  checkedOutBy: seederName, closedBy: seederName },
    { bookIdx:  3, memberIdx:  8, borrowedAt: daysAgo(80), dueAt: daysAgo(66), returnedAt: daysAgo(5),  status: "LOST", fineAmount: 18000, finePaid: false, fineWaived: false, fineNote: "Book not returned after inquiry",     checkedOutBy: seederName, closedBy: seederName },
    // ── Lost – fine paid
    { bookIdx:  2, memberIdx: 10, borrowedAt: daysAgo(75), dueAt: daysAgo(61), returnedAt: daysAgo(20), status: "LOST", fineAmount: 12000, finePaid: true, fineWaived: false, finePaidAt: daysAgo(19), fineNote: "Paid in full",                  checkedOutBy: seederName, closedBy: seederName },
  ];

  for (const l of loanData) {
    if (l.status === "ACTIVE" || l.status === "OVERDUE" || l.status === "LOST") {
      checkedOut[l.bookIdx]++;
    }
    await prisma.loan.create({
      data: {
        bookId:      books[l.bookIdx].id,
        memberId:    mId(l.memberIdx),
        borrowedAt:  l.borrowedAt,
        dueAt:       l.dueAt,
        returnedAt:  l.returnedAt ?? undefined,
        status:      l.status,
        fineAmount:  l.fineAmount,
        finePaid:    l.finePaid,
        fineWaived:  l.fineWaived,
        finePaidAt:  l.finePaidAt,
        fineNote:    l.fineNote,
        renewalCount: l.renewalCount ?? 0,
        checkedOutBy: l.checkedOutBy,
        closedBy:    l.closedBy,
      },
    });
  }

  // Adjust availableCopies for checked-out books
  for (let i = 0; i < books.length; i++) {
    if (checkedOut[i] > 0) {
      await prisma.book.update({
        where: { id: books[i].id },
        data: { availableCopies: { decrement: checkedOut[i] } },
      });
    }
  }
  console.log(`✓ ${loanData.length} loans seeded`);

  // ── 11. RESERVATIONS ──────────────────────────────────────────────────────
  await prisma.reservation.createMany({
    data: [
      { bookId: books[0].id,  memberId: mId(10), status: "PENDING",   reservedAt: daysAgo(3),  createdBy: seederName },
      { bookId: books[4].id,  memberId: mId(11), status: "PENDING",   reservedAt: daysAgo(1),  createdBy: seederName },
      { bookId: books[12].id, memberId: mId(15), status: "PENDING",   reservedAt: daysAgo(2),  createdBy: seederName },
      { bookId: books[1].id,  memberId: mId(5),  status: "FULFILLED", reservedAt: daysAgo(20), fulfilledAt: daysAgo(12), createdBy: seederName },
      { bookId: books[7].id,  memberId: mId(21), status: "FULFILLED", reservedAt: daysAgo(15), fulfilledAt: daysAgo(8),  createdBy: seederName },
      { bookId: books[9].id,  memberId: mId(22), status: "CANCELLED", reservedAt: daysAgo(10), cancelledAt: daysAgo(7),  createdBy: seederName },
      { bookId: books[14].id, memberId: mId(13), status: "CANCELLED", reservedAt: daysAgo(8),  cancelledAt: daysAgo(5),  createdBy: seederName },
    ],
  });
  console.log("✓ 7 reservations seeded");

  // ── 12. VISITOR LOGS ──────────────────────────────────────────────────────
  type Purpose = "READING" | "BORROWING" | "SCHOOLWORK" | "RESEARCH" | "OTHER";
  const visitData: {
    memberIdx: number; purpose: Purpose; arrivedAt: Date; leftAt?: Date;
    bookIdxs?: number[]; note?: string;
  }[] = [
    // Today – still inside
    { memberIdx:  0, purpose: "READING",    arrivedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  8, 10) },
    { memberIdx:  2, purpose: "SCHOOLWORK", arrivedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  8, 30), bookIdxs: [16] },
    { memberIdx: 15, purpose: "BORROWING",  arrivedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  9,  5) },
    { memberIdx: 20, purpose: "RESEARCH",   arrivedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  9, 45), bookIdxs: [3, 7] },
    { memberIdx: 23, purpose: "RESEARCH",   arrivedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 15) },
    // Today – already left
    { memberIdx:  1, purpose: "BORROWING",  arrivedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  7, 30), leftAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 10) },
    { memberIdx:  5, purpose: "READING",    arrivedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  7, 45), leftAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0), bookIdxs: [11] },
    { memberIdx: 18, purpose: "SCHOOLWORK", arrivedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(),  8, 0),  leftAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30) },
    // Yesterday
    { memberIdx:  3, purpose: "READING",    arrivedAt: daysAgo(1), leftAt: new Date(daysAgo(1).getTime() + 90 * 60000),  bookIdxs: [1] },
    { memberIdx:  6, purpose: "SCHOOLWORK", arrivedAt: daysAgo(1), leftAt: new Date(daysAgo(1).getTime() + 60 * 60000) },
    { memberIdx: 16, purpose: "BORROWING",  arrivedAt: daysAgo(1), leftAt: new Date(daysAgo(1).getTime() + 30 * 60000) },
    { memberIdx: 21, purpose: "RESEARCH",   arrivedAt: daysAgo(1), leftAt: new Date(daysAgo(1).getTime() + 120 * 60000), bookIdxs: [10, 13] },
    // 2–5 days ago
    { memberIdx:  7, purpose: "READING",    arrivedAt: daysAgo(2), leftAt: new Date(daysAgo(2).getTime() + 75 * 60000) },
    { memberIdx:  9, purpose: "SCHOOLWORK", arrivedAt: daysAgo(2), leftAt: new Date(daysAgo(2).getTime() + 45 * 60000), bookIdxs: [4] },
    { memberIdx: 11, purpose: "BORROWING",  arrivedAt: daysAgo(3), leftAt: new Date(daysAgo(3).getTime() + 20 * 60000) },
    { memberIdx: 14, purpose: "READING",    arrivedAt: daysAgo(3), leftAt: new Date(daysAgo(3).getTime() + 60 * 60000), bookIdxs: [15] },
    { memberIdx:  4, purpose: "OTHER",      arrivedAt: daysAgo(4), leftAt: new Date(daysAgo(4).getTime() + 30 * 60000), note: "Returned a donated book" },
    { memberIdx: 22, purpose: "RESEARCH",   arrivedAt: daysAgo(5), leftAt: new Date(daysAgo(5).getTime() + 180 * 60000), bookIdxs: [7, 10] },
    { memberIdx: 17, purpose: "SCHOOLWORK", arrivedAt: daysAgo(5), leftAt: new Date(daysAgo(5).getTime() + 55 * 60000) },
    // Earlier this week / last week
    { memberIdx:  8, purpose: "READING",    arrivedAt: daysAgo(7),  leftAt: new Date(daysAgo(7).getTime()  + 90 * 60000), bookIdxs: [12] },
    { memberIdx: 10, purpose: "BORROWING",  arrivedAt: daysAgo(8),  leftAt: new Date(daysAgo(8).getTime()  + 40 * 60000) },
    { memberIdx: 13, purpose: "SCHOOLWORK", arrivedAt: daysAgo(9),  leftAt: new Date(daysAgo(9).getTime()  + 50 * 60000), bookIdxs: [6] },
    { memberIdx: 19, purpose: "READING",    arrivedAt: daysAgo(10), leftAt: new Date(daysAgo(10).getTime() + 65 * 60000) },
    { memberIdx: 24, purpose: "RESEARCH",   arrivedAt: daysAgo(12), leftAt: new Date(daysAgo(12).getTime() + 150 * 60000), bookIdxs: [3] },
    { memberIdx:  0, purpose: "READING",    arrivedAt: daysAgo(14), leftAt: new Date(daysAgo(14).getTime() + 45 * 60000), bookIdxs: [0] },
  ];

  for (const v of visitData) {
    const log = await prisma.visitorLog.create({
      data: {
        memberId:   mId(v.memberIdx),
        purpose:    v.purpose,
        note:       v.note,
        arrivedAt:  v.arrivedAt,
        leftAt:     v.leftAt,
        recordedBy: seederName,
      },
    });
    if (v.bookIdxs && v.bookIdxs.length > 0) {
      await prisma.visitorLogBook.createMany({
        data: v.bookIdxs.map((bi) => ({ visitorLogId: log.id, bookId: books[bi].id })),
      });
    }
  }
  console.log(`✓ ${visitData.length} visitor logs seeded`);

  console.log("\n✅ Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
