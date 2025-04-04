import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/xlsx.mjs";

const tabloBody = document.querySelector("#policeTablo tbody");
let policeListesi = [];
let guncellenecekID = null;

// 🔄 Poliçeleri Firebase'den çek ve tabloya yaz
async function poliseleriGetir() {
  try {
    const querySnapshot = await getDocs(collection(db, "policeler"));
    policeListesi = [];
    tabloBody.innerHTML = "";

    querySnapshot.forEach(docSnap => {
      const veri = docSnap.data();
      veri.id = docSnap.id;
      policeListesi.push(veri);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${veri.musteri}</td>
        <td>${veri.plaka || "-"}</td>
        <td>${veri.tescilNo || "-"}</td>
        <td>${veri.tur}</td>
        <td>${veri.bitis}</td>
        <td>${veri.prim} ₺</td>
        <td>${veri.kimin}</td>
        <td>${veri.dis}</td>
        <td>
          <button onclick="silPolice('${veri.id}')">❌</button>
          <button onclick="duzenlePolice('${veri.id}')">✏️</button>
        </td>
      `;
      tabloBody.appendChild(tr);
    });
  } catch (err) {
    console.error("❌ Veri çekilemedi:", err);
  }
}

// ❌ Silme işlemi
window.silPolice = async (id) => {
  if (confirm("Bu poliçeyi silmek istiyor musunuz?")) {
    await deleteDoc(doc(db, "policeler", id));
    alert("✅ Poliçe silindi!");
    poliseleriGetir();
  }
};

// ✏️ Poliçeyi düzenlemek için modalı aç
window.duzenlePolice = function (id) {
  const veri = policeListesi.find(p => p.id === id);
  if (!veri) return;

  guncellenecekID = id;

  document.getElementById("duzenlePoliceTuru").value = veri.tur;
  document.getElementById("duzenlePlaka").value = veri.plaka || "";
  document.getElementById("duzenleTescilNo").value = veri.tescilNo || "";
  document.getElementById("duzenleBaslangic").value = veri.baslangic;
  document.getElementById("duzenleBitis").value = veri.bitis;
  document.getElementById("duzenlePrim").value = veri.prim;
  document.getElementById("duzenleKimin").value = veri.kimin;
  document.getElementById("duzenleKiminKomisyon").value = veri.kiminKomisyon;
  document.getElementById("duzenleDis").value = veri.dis;
  document.getElementById("duzenleDisKomisyon").value = veri.disKomisyon;

  document.getElementById("duzenleModal").style.display = "block";
};

// ✅ Güncelleme formu gönderildiğinde Firestore’a yaz
document.getElementById("duzenleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const ref = doc(db, "policeler", guncellenecekID);

  await updateDoc(ref, {
    tur: document.getElementById("duzenlePoliceTuru").value,
    plaka: document.getElementById("duzenlePlaka").value,
    tescilNo: document.getElementById("duzenleTescilNo").value,
    baslangic: document.getElementById("duzenleBaslangic").value,
    bitis: document.getElementById("duzenleBitis").value,
    prim: Number(document.getElementById("duzenlePrim").value),
    kimin: document.getElementById("duzenleKimin").value,
    kiminKomisyon: Number(document.getElementById("duzenleKiminKomisyon").value),
    dis: document.getElementById("duzenleDis").value,
    disKomisyon: Number(document.getElementById("duzenleDisKomisyon").value)
  });

  document.getElementById("duzenleModal").style.display = "none";
  alert("✅ Poliçe başarıyla güncellendi!");
  poliseleriGetir();
});

// 🔒 Modalı kapatma işlemleri
document.getElementById("kapatModal").onclick = () => {
  document.getElementById("duzenleModal").style.display = "none";
};

window.onclick = (e) => {
  if (e.target === document.getElementById("duzenleModal")) {
    document.getElementById("duzenleModal").style.display = "none";
  }
};

// 📁 JSON Aktar
document.getElementById("jsonExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(policeListesi, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "policeler.json";
  a.click();
  URL.revokeObjectURL(url);
});

// 📊 Excel Aktar
document.getElementById("excelExport").addEventListener("click", () => {
  const veri = policeListesi.map(p => ({
    "Müşteri": p.musteri,
    "Plaka": p.plaka || "",
    "Tescil No": p.tescilNo || "",
    "Tür": p.tur,
    "Bitiş": p.bitis,
    "Prim": p.prim,
    "Kimin Müşterisi": p.kimin,
    "Dış Acente": p.dis
  }));

  const ws = XLSX.utils.json_to_sheet(veri);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Policeler");
  XLSX.writeFile(wb, "policeler.xlsx");
});

// 🚀 Başlat
poliseleriGetir();