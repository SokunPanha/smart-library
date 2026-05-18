import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Users ────────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash("admin1234", 10);
  const staffPw = await bcrypt.hash("staff1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@library.kh" },
    update: {},
    create: { email: "admin@library.kh", password: adminPw, nameEn: "Admin", nameKh: "អ្នកគ្រប់គ្រង", role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "librarian@library.kh" },
    update: {},
    create: { email: "librarian@library.kh", password: staffPw, nameEn: "Sophea Chan", nameKh: "ចាន់ សុភា", role: "LIBRARIAN" },
  });
  await prisma.user.upsert({
    where: { email: "staff@library.kh" },
    update: {},
    create: { email: "staff@library.kh", password: staffPw, nameEn: "Dara Pich", nameKh: "ពិជ ដារ៉ា", role: "STAFF" },
  });
  console.log("✓ Users seeded");

  // ── Settings ─────────────────────────────────────────────────────────────
  const settings: { key: string; value: string }[] = [
    { key: "libraryName", value: "National Library of Cambodia" },
    { key: "libraryNameKh", value: "បណ្ណាល័យជាតិកម្ពុជា" },
    { key: "address", value: "Street 92, Phnom Penh 12203, Cambodia" },
    { key: "phone", value: "+855 23 430 609" },
    { key: "email", value: "info@nationallibrary.gov.kh" },
    { key: "loanDaysStudent", value: "14" },
    { key: "loanDaysTeacher", value: "30" },
    { key: "loanDaysPublic", value: "14" },
    { key: "loanDaysResearcher", value: "30" },
    { key: "finePerDay", value: "500" },
    { key: "maxLoansPerMember", value: "5" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log("✓ Settings seeded");

  // ── Books ─────────────────────────────────────────────────────────────────
  const books = [
    { isbn: "978-9924-9065-0-1", titleEn: "The History of Cambodia", titleKh: "ប្រវត្តិសាស្ត្រកម្ពុជា", author: "David Chandler", publisher: "Silkworm Books", publishYear: 2018, category: "History", deweyCode: "959.6", totalCopies: 4, tags: ["history", "cambodia", "khmer"] },
    { isbn: "978-9924-9065-1-8", titleEn: "Angkor and the Khmer Civilization", titleKh: "អង្គរ និងអារ្យធម៌ខ្មែរ", author: "Michael Coe", publisher: "Thames & Hudson", publishYear: 2015, category: "History", deweyCode: "959.6", totalCopies: 3, tags: ["angkor", "khmer", "archaeology"] },
    { isbn: "978-9924-9065-2-5", titleEn: "Buddhism in Cambodia", titleKh: "ព្រះពុទ្ធសាសនានៅកម្ពុជា", author: "Ian Harris", publisher: "University of Hawaii Press", publishYear: 2005, category: "Religion", deweyCode: "294.3", totalCopies: 2, tags: ["buddhism", "religion", "cambodia"] },
    { isbn: "978-9924-9065-3-2", titleEn: "Khmer Rouge and the Cambodian Genocide", titleKh: "ខ្មែរក្រហម និងរបបប្រល័យពូជសាសន៍", author: "Ben Kiernan", publisher: "Yale University Press", publishYear: 2008, category: "History", deweyCode: "959.604", totalCopies: 3, tags: ["genocide", "history", "politics"] },
    { isbn: "978-9924-9065-4-9", titleEn: "Introduction to Computer Science", titleKh: "មូលដ្ឋានគ្រឹះវិទ្យាសាស្ត្រកុំព្យូទ័រ", author: "John Brookshear", publisher: "Pearson", publishYear: 2019, category: "Technology", deweyCode: "004", totalCopies: 5, tags: ["computer", "programming", "science"] },
    { isbn: "978-9924-9065-5-6", titleEn: "Khmer Language and Linguistics", titleKh: "ភាសា និងភាសាសាស្ត្រខ្មែរ", author: "Judith Jacob", publisher: "SOAS", publishYear: 1996, category: "Language", deweyCode: "495.9", totalCopies: 2, tags: ["khmer", "linguistics", "language"] },
    { isbn: "978-9924-9065-6-3", titleEn: "Rice Farming in Southeast Asia", titleKh: "ការដាំស្រូវនៅអាស៊ីអាគ្នេយ៍", author: "Nguyen Van Luat", publisher: "IRRI", publishYear: 2012, category: "Agriculture", deweyCode: "633.18", totalCopies: 3, tags: ["agriculture", "rice", "farming"] },
    { isbn: "978-9924-9065-7-0", titleEn: "Cambodian Law and Governance", titleKh: "ច្បាប់ និងរដ្ឋាភិបាលកម្ពុជា", author: "John Ciorciari", publisher: "Cornell", publishYear: 2014, category: "Law", deweyCode: "349.596", totalCopies: 2, tags: ["law", "governance", "cambodia"] },
    { isbn: "978-9924-9065-8-7", titleEn: "Traditional Khmer Music", titleKh: "តន្ត្រីបុរាណខ្មែរ", author: "Sam-Ang Sam", publisher: "Kent State University", publishYear: 2002, category: "Arts", deweyCode: "781.62", totalCopies: 2, tags: ["music", "arts", "khmer", "culture"] },
    { isbn: "978-9924-9065-9-4", titleEn: "Health and Medicine in Cambodia", titleKh: "សុខភាព និងវេជ្ជសាស្ត្រនៅកម្ពុជា", author: "Margaret Hardiman", publisher: "WHO", publishYear: 2010, category: "Health", deweyCode: "610", totalCopies: 3, tags: ["health", "medicine", "public health"] },
    { isbn: "978-9924-9066-0-0", titleEn: "Economic Development of Cambodia", titleKh: "ការអភិវឌ្ឍន៍សេដ្ឋកិច្ចកម្ពុជា", author: "Sophal Ear", publisher: "Stanford University Press", publishYear: 2012, category: "Economics", deweyCode: "330.9596", totalCopies: 2, tags: ["economics", "development", "cambodia"] },
    { isbn: "978-9924-9066-1-7", titleEn: "Cambodian Fiction: Stories of the Land", titleKh: "រឿងប្រឌិតខ្មែរ", author: "Teri Shaffer Yamada", publisher: "Ling", publishYear: 2005, category: "Fiction", deweyCode: "895.932", totalCopies: 4, tags: ["fiction", "short stories", "khmer literature"] },
    { isbn: "978-9924-9066-2-4", titleEn: "Environmental Science", titleKh: "វិទ្យាសាស្ត្របរិស្ថាន", author: "Richard Wright", publisher: "Pearson", publishYear: 2020, category: "Science", deweyCode: "363.7", totalCopies: 3, tags: ["environment", "science", "ecology"] },
    { isbn: "978-9924-9066-3-1", titleEn: "Philosophy of the Mind", titleKh: "ទស្សនវិជ្ជានៃចិត្ត", author: "Jaegwon Kim", publisher: "Blackwell", publishYear: 2011, category: "Philosophy", deweyCode: "128.2", totalCopies: 2, tags: ["philosophy", "mind", "consciousness"] },
    { isbn: "978-9924-9066-4-8", titleEn: "Primary Education Methods", titleKh: "វិធីសាស្ត្របង្រៀនថ្នាក់បឋម", author: "Lim Vuthy", publisher: "MoEYS Cambodia", publishYear: 2017, category: "Education", deweyCode: "372.1", totalCopies: 5, tags: ["education", "teaching", "primary school"] },
  ];

  const createdBooks: { id: string }[] = [];
  for (const b of books) {
    const book = await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: { ...b, availableCopies: b.totalCopies },
    });
    createdBooks.push(book);
  }
  console.log(`✓ ${createdBooks.length} books seeded`);

  // ── Members ───────────────────────────────────────────────────────────────
  const members = [
    { memberId: "LIB-2024-001", nameEn: "Kosal Prak", nameKh: "ប្រាក់ កុសល", email: "kosal.prak@student.edu.kh", phone: "+855 12 345 678", type: "STUDENT" as const, expiresAt: new Date("2025-12-31") },
    { memberId: "LIB-2024-002", nameEn: "Sreymom Heng", nameKh: "ហេង ស្រីមុំ", email: "sreymom.heng@teacher.edu.kh", phone: "+855 17 234 567", type: "TEACHER" as const, expiresAt: new Date("2026-06-30") },
    { memberId: "LIB-2024-003", nameEn: "Vicheka Nou", nameKh: "នូ វិចេកា", email: "vicheka.nou@gmail.com", phone: "+855 96 123 456", type: "PUBLIC" as const, expiresAt: new Date("2025-09-30") },
    { memberId: "LIB-2024-004", nameEn: "Borey Lim", nameKh: "លឹម បូរី", email: "borey.lim@research.org", phone: "+855 77 987 654", type: "RESEARCHER" as const, expiresAt: new Date("2026-12-31") },
    { memberId: "LIB-2024-005", nameEn: "Pisey Chan", nameKh: "ចាន់ ពិសី", email: "pisey.chan@student.edu.kh", phone: "+855 15 876 543", type: "STUDENT" as const, expiresAt: new Date("2025-12-31") },
    { memberId: "LIB-2024-006", nameEn: "Ratana Sok", nameKh: "សុក រតនា", email: "ratana.sok@teacher.edu.kh", phone: "+855 11 654 321", type: "TEACHER" as const, expiresAt: new Date("2026-06-30") },
    { memberId: "LIB-2024-007", nameEn: "Dalis Keo", nameKh: "កែវ ដាលីស", email: "dalis.keo@gmail.com", phone: "+855 98 111 222", type: "PUBLIC" as const, expiresAt: new Date("2025-08-31") },
    { memberId: "LIB-2024-008", nameEn: "Monich Sar", nameKh: "សារ មុននិច", email: "monich.sar@rupp.edu.kh", phone: "+855 69 333 444", type: "STUDENT" as const, expiresAt: new Date("2025-12-31") },
    { memberId: "LIB-2024-009", nameEn: "Theary Mao", nameKh: "មៅ ធារី", email: "theary.mao@research.org", phone: "+855 93 555 666", type: "RESEARCHER" as const, expiresAt: new Date("2026-12-31") },
    { memberId: "LIB-2024-010", nameEn: "Kimhak Yun", nameKh: "យូ គីមហាក់", email: "kimhak.yun@gmail.com", phone: "+855 86 777 888", type: "PUBLIC" as const, expiresAt: new Date("2025-11-30") },
    { memberId: "LIB-2025-001", nameEn: "Chanthy Ros", nameKh: "រស់ ចន្ទី", email: "chanthy.ros@student.edu.kh", phone: "+855 12 111 222", type: "STUDENT" as const, expiresAt: new Date("2026-12-31") },
    { memberId: "LIB-2025-002", nameEn: "Sopheak Im", nameKh: "អ៊ិម សុភ័ក្ដ", email: "sopheak.im@teacher.edu.kh", phone: "+855 17 333 444", type: "TEACHER" as const, expiresAt: new Date("2027-06-30") },
  ];

  const createdMembers: { id: string }[] = [];
  for (const m of members) {
    const member = await prisma.member.upsert({
      where: { memberId: m.memberId },
      update: {},
      create: m,
    });
    createdMembers.push(member);
  }
  console.log(`✓ ${createdMembers.length} members seeded`);

  // ── Loans ─────────────────────────────────────────────────────────────────
  // Only create loans if none exist yet to avoid duplicates on re-seed
  const existingLoans = await prisma.loan.count();
  if (existingLoans === 0) {
    const now = new Date();

    const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
    const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);

    const loanData = [
      // Returned loans (history)
      { bookIdx: 0, memberIdx: 0, borrowedAt: daysAgo(30), dueAt: daysAgo(16), returnedAt: daysAgo(18), status: "RETURNED" as const, fineAmount: 0 },
      { bookIdx: 1, memberIdx: 1, borrowedAt: daysAgo(45), dueAt: daysAgo(15), returnedAt: daysAgo(14), status: "RETURNED" as const, fineAmount: 0 },
      { bookIdx: 2, memberIdx: 2, borrowedAt: daysAgo(20), dueAt: daysAgo(6), returnedAt: daysAgo(7), status: "RETURNED" as const, fineAmount: 0 },
      { bookIdx: 3, memberIdx: 3, borrowedAt: daysAgo(60), dueAt: daysAgo(30), returnedAt: daysAgo(28), status: "RETURNED" as const, fineAmount: 0 },
      { bookIdx: 4, memberIdx: 4, borrowedAt: daysAgo(25), dueAt: daysAgo(11), returnedAt: daysAgo(10), status: "RETURNED" as const, fineAmount: 0 },
      { bookIdx: 0, memberIdx: 5, borrowedAt: daysAgo(50), dueAt: daysAgo(36), returnedAt: daysAgo(33), status: "RETURNED" as const, fineAmount: 0 },
      { bookIdx: 5, memberIdx: 6, borrowedAt: daysAgo(35), dueAt: daysAgo(21), returnedAt: daysAgo(22), status: "RETURNED" as const, fineAmount: 500 },
      { bookIdx: 6, memberIdx: 7, borrowedAt: daysAgo(40), dueAt: daysAgo(26), returnedAt: daysAgo(24), status: "RETURNED" as const, fineAmount: 0 },
      { bookIdx: 7, memberIdx: 8, borrowedAt: daysAgo(55), dueAt: daysAgo(25), returnedAt: daysAgo(20), status: "RETURNED" as const, fineAmount: 0 },
      { bookIdx: 8, memberIdx: 9, borrowedAt: daysAgo(15), dueAt: daysAgo(1), returnedAt: daysAgo(2), status: "RETURNED" as const, fineAmount: 0 },
      // Active loans (currently checked out)
      { bookIdx: 9,  memberIdx: 0,  borrowedAt: daysAgo(5),  dueAt: daysFromNow(9),  returnedAt: null, status: "ACTIVE" as const, fineAmount: 0 },
      { bookIdx: 10, memberIdx: 1,  borrowedAt: daysAgo(10), dueAt: daysFromNow(20), returnedAt: null, status: "ACTIVE" as const, fineAmount: 0 },
      { bookIdx: 11, memberIdx: 2,  borrowedAt: daysAgo(3),  dueAt: daysFromNow(11), returnedAt: null, status: "ACTIVE" as const, fineAmount: 0 },
      { bookIdx: 12, memberIdx: 10, borrowedAt: daysAgo(7),  dueAt: daysFromNow(7),  returnedAt: null, status: "ACTIVE" as const, fineAmount: 0 },
      { bookIdx: 13, memberIdx: 11, borrowedAt: daysAgo(2),  dueAt: daysFromNow(28), returnedAt: null, status: "ACTIVE" as const, fineAmount: 0 },
      // Overdue loans
      { bookIdx: 14, memberIdx: 3, borrowedAt: daysAgo(25), dueAt: daysAgo(11), returnedAt: null, status: "OVERDUE" as const, fineAmount: 5500 },
      { bookIdx: 1,  memberIdx: 4, borrowedAt: daysAgo(30), dueAt: daysAgo(16), returnedAt: null, status: "OVERDUE" as const, fineAmount: 8000 },
      { bookIdx: 4,  memberIdx: 6, borrowedAt: daysAgo(22), dueAt: daysAgo(8),  returnedAt: null, status: "OVERDUE" as const, fineAmount: 4000 },
    ];

    for (const l of loanData) {
      await prisma.loan.create({
        data: {
          bookId: createdBooks[l.bookIdx].id,
          memberId: createdMembers[l.memberIdx].id,
          borrowedAt: l.borrowedAt,
          dueAt: l.dueAt,
          returnedAt: l.returnedAt,
          status: l.status,
          fineAmount: l.fineAmount,
        },
      });
    }

    // Adjust availableCopies for active/overdue loans
    const activeBookIdxs = [9, 10, 11, 12, 13, 14, 1, 4];
    for (const idx of [...new Set(activeBookIdxs)]) {
      await prisma.book.update({
        where: { id: createdBooks[idx].id },
        data: { availableCopies: { decrement: 1 } },
      });
    }

    console.log(`✓ ${loanData.length} loans seeded`);
  } else {
    console.log(`⚠ Loans skipped — ${existingLoans} already exist`);
  }

  // ── Categories ────────────────────────────────────────────────────────────
  const categoryNames = [
    "Fiction", "Non-Fiction", "Science", "History", "Religion",
    "Philosophy", "Education", "Health", "Arts", "Technology",
    "Law", "Economics", "Agriculture", "Literature", "Language",
  ];
  for (const name of categoryNames) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✓ ${categoryNames.length} categories seeded`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
