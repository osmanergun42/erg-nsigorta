// poliselerListe.js

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

// ✅ Firestore verilerinde eksik alanları tamamla
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
      console.log(`✅ ${d.id} güncellendi.`);
    }
  });
}

// 🔄 Firebase'den verileri çek ve tabloya yaz
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
      <td>${veri.sirket || "-"}</td>
      <td>${veri.policeNo || "-"}</td>
      <td style="text-align: center;">
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

window.silPolice = async (id) => {
  if (confirm("Bu poliçeyi silmek istiyor musunuz?")) {
    await deleteDoc(doc(db, "policeler", id));
    alert("✅ Poliçe silindi!");
    poliseleriGetir();
  }
};

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
  document.getElementById("duzenleSirket").value = veri.sirket || "";
  document.getElementById("duzenlePoliceNo").value = veri.policeNo || "";

  document.getElementById("duzenleModal").style.display = "block";
};

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
  alert("✅ Poliçe başarıyla güncellendi!");
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

document.getElementById("jsonExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(policeListesi, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "policeler.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("excelExport").addEventListener("click", () => {
  const filtreBas = document.getElementById("filtreBaslangic").value;
  const filtreBit = document.getElementById("filtreBitis").value;

  const basTarih = filtreBas ? new Date(filtreBas) : null;
  const bitTarih = filtreBit ? new Date(filtreBit) : null;

  const filtreliVeri = policeListesi.filter(p => {
    const baslangic = new Date(p.baslangic);
    if (basTarih && baslangic < basTarih) return false;
    if (bitTarih && baslangic > bitTarih) return false;
    return true;
  });

  const veri = filtreliVeri.map(p => {
    const prim = Number(p.prim);
    const disKom = Number(p.disKomisyon);
    const kiminKom = Number(p.kiminKomisyon);

    const disKomTutar = (prim * disKom / 100).toFixed(2);
    const kiminKomTutar = (prim * kiminKom / 100).toFixed(2);

    return {
      "Müşteri Adı": p.musteri,
      "Poliçe Tipi": p.tur,
      "Başlangıç Tarihi": new Date(p.baslangic),
      "Bitiş Tarihi": new Date(p.bitis),
      "Prim Miktarı (₺)": prim.toFixed(2),
      "Poliçe Numarası": p.policeNo || "-",
      "Plaka": p.plaka || "-",
      "Tescil Numarası": p.tescilNo || "-",
      "Şirket": p.sirket || "-",
      "Dış Acente": p.dis || "-",
      "Dış Acente Komisyonu": `${disKomTutar} (%${disKom})`,
      "Kimin Müşterisi": p.kimin || "-",
      "Kimin Müşterisi Komisyonu": `${kiminKomTutar} (%${kiminKom})`
    };
  });

  const ws = XLSX.utils.json_to_sheet(veri);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 26 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Policeler");
  XLSX.writeFile(wb, "policeler.xlsx");
});

// 🚀 Sayfa yüklendiğinde çalışacak
await eksikAlanlariGuncelle();
poliseleriGetir();