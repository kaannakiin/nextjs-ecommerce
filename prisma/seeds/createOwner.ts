import prisma from "@/lib/prisma";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateUserToOwner() {
  try {
    console.log("🔧 Kullanıcıyı OWNER yapma aracı");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const identifier = await askQuestion(
      "📧 Email veya 📱 Telefon girin: Örnek:+905454544141 veya deneme@gmail.com "
    );

    if (!identifier) {
      console.log("❌ Email veya telefon boş olamaz!");
      rl.close();
      return;
    }

    const isEmail = identifier.includes("@");

    console.log(
      `🔍 ${isEmail ? "Email" : "Telefon"} ile kullanıcı aranıyor...`
    );

    const user = await prisma.user.findUnique({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user) {
      console.log(`❌ Kullanıcı bulunamadı: ${identifier}`);
      rl.close();
      return;
    }

    // Kullanıcı bilgilerini göster
    console.log("\n👤 Bulunan kullanıcı:");
    console.log(`   İsim: ${user.name} ${user.surname}`);
    console.log(`   Email: ${user.email || "Yok"}`);
    console.log(`   Phone: ${user.phone || "Yok"}`);
    console.log(`   Mevcut Role: ${user.role}`);

    if (user.role === "OWNER") {
      console.log("⚠️  Bu kullanıcı zaten OWNER!");
      rl.close();
      return;
    }

    const confirm = await askQuestion(
      "\n❓ Bu kullanıcıyı OWNER yapmak istediğinizden emin misiniz? (y/N): "
    );

    if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
      console.log("❌ İşlem iptal edildi.");
      rl.close();
      return;
    }

    // Owner yap
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: "OWNER" },
    });

    console.log("\n✅ Başarılı!");
    console.log(
      `🎉 ${updatedUser.name} ${updatedUser.surname} artık OWNER!. Admin paneline giriş yapmak için lütfen çıkış yapıp tekrar giriş yapınız.`
    );
  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

updateUserToOwner();
