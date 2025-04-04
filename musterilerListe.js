import { db } from './firebase.js';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/xlsx.mjs";

const tabloBody = document.querySelector("#musteriTablo tbody");
let musteriListesi = [];

// 🔽 Müşterileri çek ve tabloya yaz
async function musterileriGetir() {
  try {
    const querySnapshot = await getDocs(collection(db, "musteriler"));
    musteriListesi = [];
    tabloBody.innerHTML = "";

    querySnapshot.forEach(docSnap => {
      const veri = docSnap.data();
      veri.id = docSnap.id;
      musteriListesi.push(veri);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${veri.adSoyad}</td>
        <td>${veri.telefon || "-"}</td>
        <td>${veri.email || "-"}</td>
        <td>${veri.tc || "-"}</td>
        <td>
          <button onclick="musteriDuzenle('${veri.id}')">✏️</button>
          <button onclick="silMusteri('${veri.id}')">❌</button>
        </td>
      `;
      tabloBody.appendChild(tr);
    });
  } catch (error) {
    console.error("🔥 Veri çekme hatası:", error);
  }
}

// ❌ Silme
window.silMusteri = async (id) => {
  if (confirm("Bu müşteriyi silmek istiyor musunuz?")) {
    await deleteDoc(doc(db, "musteriler", id));
    alert("✅ Silindi!");
    musterileriGetir();
  }
};

// 📁 JSON Aktar
document.getElementById("jsonExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(musteriListesi, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "musteriler.json";
  a.click();
  URL.revokeObjectURL(url);
});

// 📊 Excel Aktar
document.getElementById("excelExport").addEventListener("click", () => {
  const veri = musteriListesi.map(m => ({
    "Ad Soyad": m.adSoyad,
    "Telefon": m.telefon || "",
    "E-mail": m.email || "",
    "TC Kimlik No": m.tc || ""
  }));

  const ws = XLSX.utils.json_to_sheet(veri);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Musteriler");
  XLSX.writeFile(wb, "musteriler.xlsx");
});

// 📝 Düzenleme Modal Fonksiyonları
const modal = document.getElementById("duzenleModal");
const kapatBtn = document.getElementById("kapatModal");
const form = document.getElementById("duzenleForm");
let guncellenecekID = null;

window.musteriDuzenle = function (id) {
  const musteri = musteriListesi.find(m => m.id === id);
  if (!musteri) return;

  guncellenecekID = id;
  document.getElementById("duzenleAdSoyad").value = musteri.adSoyad;
  document.getElementById("duzenleTelefon").value = musteri.telefon || "";
  document.getElementById("duzenleEmail").value = musteri.email || "";
  document.getElementById("duzenleTC").value = musteri.tc || "";
  modal.style.display = "block";
};

// 🔄 Güncelle ve kapat
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ref = doc(db, "musteriler", guncellenecekID);
  await updateDoc(ref, {
    adSoyad: document.getElementById("duzenleAdSoyad").value,
    telefon: document.getElementById("duzenleTelefon").value,
    email: document.getElementById("duzenleEmail").value,
    tc: document.getElementById("duzenleTC").value
  });
  modal.style.display = "none";
  alert("✅ Güncellendi!");
  musterileriGetir();
});

// ✖️ Modal kapat
kapatBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// 🚀 Sayfa yüklenince çalıştır
musterileriGetir();
