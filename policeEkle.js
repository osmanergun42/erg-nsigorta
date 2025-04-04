import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 🔽 1. Müşteri Dropdown'unu Firebase'den Doldur + Tom Select uygula
async function musterileriDropDownaYaz() {
  const select = document.getElementById("musteriSec");
  select.innerHTML = '<option value="">Müşteri Seçin</option>'; // varsayılan seçenek

  try {
    const querySnapshot = await getDocs(collection(db, "musteriler"));
    querySnapshot.forEach(doc => {
      const veri = doc.data();
      const option = document.createElement("option");
      option.value = veri.adSoyad;
      option.textContent = veri.adSoyad;
      select.appendChild(option);
    });

    // ✅ Tom Select'i aktif et
    new TomSelect("#musteriSec", {
      placeholder: "Müşteri Seçin...",
      maxOptions: 500,
      create: false,
      persist: false
    });

  } catch (err) {
    console.error("🚫 Müşteri verileri çekilemedi:", err);
  }
}

// 🔁 Sayfa yüklenince müşteri dropdown'unu doldur
musterileriDropDownaYaz();

// 📝 2. Poliçe Formunu Firestore’a Kaydet
document.getElementById("policeForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const police = {
    musteri: document.getElementById("musteriSec").value,
    plaka: document.getElementById("plaka").value,
    tescilNo: document.getElementById("tescilNo").value,
    tur: document.getElementById("policeTuru").value,
    baslangic: document.getElementById("baslangicTarihi").value,
    bitis: document.getElementById("bitisTarihi").value,
    prim: Number(document.getElementById("primTutari").value),
    kimin: document.getElementById("kiminMusterisi").value,
    dis: document.getElementById("disAcente").value,
    kiminKomisyon: Number(document.getElementById("kiminKomisyon").value),
    disKomisyon: Number(document.getElementById("disKomisyon").value),
    eklenme: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "policeler"), police);
    alert("✅ Poliçe başarıyla kaydedildi!");
    e.target.reset();
    location.reload();
  } catch (err) {
    console.error("❌ Hata:", err);
    alert("Poliçe kaydedilemedi!");
  }
});
