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

// 🧩 Eksik alanları tamamlama
async function eksikAlanlariGuncelle() {
  const snapshot = await getDocs(collection(db, "policeler"));
  snapshot.forEach(async (d) => {
    const veri = d.data();
    const ref = doc(db, "policeler", d.id);
    const guncelle = {};
    if (!("tescilNo" in veri)) guncelle.tescilNo = "";
    if (!("sirket" in veri)) guncelle.sirket = "";
    if (Object.keys(guncelle).length > 0) {
      await updateDoc(ref, guncelle);
    }
  });
}

// 🔄 Tüm poliçeleri getir
async function poliseleriGetir(veriKumesi = null) {
  const veriListesi = veriKumesi || await getTumPoliceler();
  tabloBody.innerHTML = "";
  veriListesi.forEach(veri => {
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
      <td>${veri.sirket || "-"}</td>
      <td>${veri.policeNo || "-"}</td>
      <td>
        <button class="btn-sil" data-id="${veri.id}">❌</button>
        <button class="btn-duzenle" data-id="${veri.id}">✏️</button>
      </td>
    `;
    tabloBody.appendChild(tr);
  });
}

// 🔎 Firebase'den tüm verileri çek
async function getTumPoliceler() {
  const querySnapshot = await getDocs(collection(db, "policeler"));
  policeListesi = [];
  querySnapshot.forEach(docSnap => {
    const veri = docSnap.data();
    veri.id = docSnap.id;
    policeListesi.push(veri);
  });
  return policeListesi;
}

// 🧽 Filtrele
document.getElementById("tarihFiltreleBtn")?.addEventListener("click", async () => {
  const bas = document.getElementById("tabloFiltreBaslangic").value;
  const bit = document.getElementById("tabloFiltreBitis").value;
  const basT = bas ? new Date(bas) : null;
  const bitT = bit ? new Date(bit) : null;

  const tumVeri = await getTumPoliceler();
  const filtreli = tumVeri.filter(p => {
    const t = new Date(p.baslangic);
    if (basT && t < basT) return false;
    if (bitT && t > bitT) return false;
    return true;
  });

  poliseleriGetir(filtreli);
});

// 🛠 Delegasyonla sil / düzenle
tabloBody.addEventListener("click", (e) => {
  const btn = e.target;
  const id = btn.dataset.id;
  if (btn.classList.contains("btn-sil")) silPolice(id);
  if (btn.classList.contains("btn-duzenle")) duzenlePolice(id);
});

async function silPolice(id) {
  if (confirm("Silmek istediğine emin misin?")) {
    await deleteDoc(doc(db, "policeler", id));
    alert("✅ Silindi!");
    poliseleriGetir();
  }
}

function duzenlePolice(id) {
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
  document.getElementById("duzenleSirket").value = veri.sirket || "";
  document.getElementById("duzenlePoliceNo").value = veri.policeNo || "";
  document.getElementById("duzenleModal").style.display = "block";
}

// 💾 Güncelle
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
    disKomisyon: Number(document.getElementById("duzenleDisKomisyon").value),
    sirket: document.getElementById("duzenleSirket").value,
    policeNo: document.getElementById("duzenlePoliceNo").value
  });

  document.getElementById("duzenleModal").style.display = "none";
  alert("✔️ Güncellendi");
  poliseleriGetir();
});

document.getElementById("kapatModal").onclick = () => {
  document.getElementById("duzenleModal").style.display = "none";
};

window.onclick = (e) => {
  if (e.target === document.getElementById("duzenleModal")) {
    document.getElementById("duzenleModal").style.display = "none";
  }
};

// 📤 JSON
document.getElementById("jsonExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(policeListesi, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "policeler.json";
  a.click();
  URL.revokeObjectURL(url);
});

// 📊 Excel
document.getElementById("excelExport").addEventListener("click", () => {
  const veri = policeListesi.map(p => ({
    "Müşteri Adı": p.musteri,
    "Poliçe Tipi": p.tur,
    "Başlangıç Tarihi": new Date(p.baslangic),
    "Bitiş Tarihi": new Date(p.bitis),
    "Prim (₺)": Number(p.prim).toFixed(2),
    "Poliçe No": p.policeNo || "-",
    "Plaka": p.plaka || "-",
    "Tescil No": p.tescilNo || "-",
    "Şirket": p.sirket || "-",
    "Dış Acente": p.dis || "-",
    "Kimin Müşterisi": p.kimin || "-"
  }));

  const ws = XLSX.utils.json_to_sheet(veri);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Policeler");
  XLSX.writeFile(wb, "policeler.xlsx");
});

// 🚀 Yüklenince çalıştır
await eksikAlanlariGuncelle();
poliseleriGetir();
