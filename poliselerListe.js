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
const sayfalamaDiv = document.getElementById("sayfalama");
let policeListesi = [];
let guncellenecekID = null;
let aktifSayfa = 1;
const sayfaBasina = 10;

// Eksik alanları tamamlama
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

// Firebase'den tüm verileri çek
async function getTumPoliceler() {
  const querySnapshot = await getDocs(collection(db, "policeler"));
  let liste = [];
  querySnapshot.forEach(docSnap => {
    const veri = docSnap.data();
    veri.id = docSnap.id;
    liste.push(veri);
  });
  return liste;
}

// Sayfalamayı çiz
function sayfalariGoster(veriler) {
  const toplamSayfa = Math.ceil(veriler.length / sayfaBasina);
  sayfalamaDiv.innerHTML = "";

  for (let i = 1; i <= toplamSayfa; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.style.margin = "0 5px";
    if (i === aktifSayfa) btn.style.fontWeight = "bold";
    btn.addEventListener("click", () => {
      aktifSayfa = i;
      tabloyuGoster(veriler);
    });
    sayfalamaDiv.appendChild(btn);
  }
}

// Tabloyu oluştur
function tabloyuGoster(veriler) {
  tabloBody.innerHTML = "";
  const start = (aktifSayfa - 1) * sayfaBasina;
  const end = start + sayfaBasina;
  const gosterilecekler = veriler.slice(start, end);

  gosterilecekler.forEach(veri => {
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

  sayfalariGoster(veriler);
}

// Delegasyonla sil/düzenle
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
    await veriYukle();
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
  await veriYukle();
});

// Modal kapatma
document.getElementById("kapatModal").onclick = () => {
  document.getElementById("duzenleModal").style.display = "none";
};
window.onclick = (e) => {
  if (e.target === document.getElementById("duzenleModal")) {
    document.getElementById("duzenleModal").style.display = "none";
  }
};

// JSON Aktar
document.getElementById("jsonExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(policeListesi, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "policeler.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Excel Aktar (tarih filtreli)
document.getElementById("excelExport").addEventListener("click", () => {
  const bas = document.getElementById("filtreBaslangic").value;
  const bit = document.getElementById("filtreBitis").value;
  const basT = bas ? new Date(bas) : null;
  const bitT = bit ? new Date(bit) : null;

  const filtreliVeri = policeListesi.filter(p => {
    const baslangic = new Date(p.baslangic);
    if (basT && baslangic < basT) return false;
    if (bitT && baslangic > bitT) return false;
    return true;
  });

  const veri = filtreliVeri.map(p => ({
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

// Tarih filtreleme
const tarihFiltreBtn = document.getElementById("tarihFiltreleBtn");
tarihFiltreBtn?.addEventListener("click", async () => {
  const bas = document.getElementById("tabloFiltreBaslangic").value;
  const bit = document.getElementById("tabloFiltreBitis").value;
  const basT = bas ? new Date(bas) : null;
  const bitT = bit ? new Date(bit) : null;

  const tumVeri = await getTumPoliceler();
  policeListesi = tumVeri.filter(p => {
    const t = new Date(p.baslangic);
    if (basT && t < basT) return false;
    if (bitT && t > bitT) return false;
    return true;
  });

  aktifSayfa = 1;
  tabloyuGoster(policeListesi);
});

// Başlat
async function veriYukle() {
  policeListesi = await getTumPoliceler();
  aktifSayfa = 1;
  tabloyuGoster(policeListesi);
}

await eksikAlanlariGuncelle();
await veriYukle();