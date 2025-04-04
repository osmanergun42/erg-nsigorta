import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let tumPoliceler = [];
let komisyonChart;

// Şirketin kendi adı (acente)
const ACENTE_ADI = "ERGÜN SİGORTA";

// Sayfa yüklenince verileri çek
window.addEventListener("DOMContentLoaded", async () => {
  const snap = await getDocs(collection(db, "policeler"));
  tumPoliceler = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  sirketSecimiDoldur();
  grafikleriCiz();
});

function sirketSecimiDoldur() {
  const select = document.getElementById("sirketSec");
  const sirketler = new Set();

  tumPoliceler.forEach(p => {
    if (p.kimin) sirketler.add(p.kimin);
    if (p.dis) sirketler.add(p.dis);
  });

  sirketler.forEach(sirket => {
    const opt = document.createElement("option");
    opt.value = sirket;
    opt.textContent = sirket;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    hesaplaVeGoster(select.value);
    grafikleriCiz(select.value);
  });
}

function hesaplaVeGoster(sirket) {
  const sonucEl = document.getElementById("komisyonSonuc");
  let toplamAlacak = 0;
  let toplamVerecek = 0;

  tumPoliceler.forEach(p => {
    const prim = Number(p.prim || 0);
    const kiminKom = Number(p.kiminKomisyon || 0);
    const disKom = Number(p.disKomisyon || 0);

    if (p.kimin === sirket) {
      toplamVerecek += (prim * kiminKom) / 100;
    }
    if (p.dis === sirket) {
      toplamAlacak += (prim * disKom) / 100;
    }
  });

  const netFark = toplamAlacak - toplamVerecek;

  let aciklama = "";
  if (sirket === ACENTE_ADI) {
    aciklama = "<em>(Bu sizin acenteniz olduğu için sadece alınacak komisyon dikkate alınır.)</em>";
  }

  sonucEl.innerHTML = `
    <strong>${sirket}</strong> için:<br>
    🧾 Alınacak Komisyon: <strong>${toplamAlacak.toFixed(2)} ₺</strong><br>
    💸 Ödenecek Komisyon: <strong>${toplamVerecek.toFixed(2)} ₺</strong><br>
    📊 Net Fark: <strong>${netFark.toFixed(2)} ₺</strong><br>
    ${aciklama}
  `;
}

function grafikleriCiz(filtreSirket = "") {
  const aylik = {};

  tumPoliceler.forEach(p => {
    const tarih = new Date(p.bitis);
    const ay = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`;
    const prim = Number(p.prim || 0);
    const kiminKom = Number(p.kiminKomisyon || 0);
    const disKom = Number(p.disKomisyon || 0);

    let al = 0, ver = 0;

    if (!filtreSirket || p.dis === filtreSirket) {
      al = (prim * disKom) / 100;
    }
    if (!filtreSirket || p.kimin === filtreSirket) {
      ver = (prim * kiminKom) / 100;
    }

    if (!aylik[ay]) aylik[ay] = { alacak: 0, verecek: 0 };
    aylik[ay].alacak += al;
    aylik[ay].verecek += ver;
  });

  const labels = Object.keys(aylik).sort();
  const alacakData = labels.map(l => aylik[l].alacak);
  const verecekData = labels.map(l => aylik[l].verecek);

  if (komisyonChart) komisyonChart.destroy();

  komisyonChart = new Chart(document.getElementById("komisyonGrafik"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Alınacak (₺)",
          data: alacakData,
          backgroundColor: "rgba(75, 192, 192, 0.6)"
        },
        {
          label: "Ödenecek (₺)",
          data: verecekData,
          backgroundColor: "rgba(255, 99, 132, 0.6)"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Excel aktarımı
const excelBtn = document.getElementById("excelAktar");
excelBtn.addEventListener("click", () => {
  const sirket = document.getElementById("sirketSec").value;
  const rows = [["Müşteri", "Tür", "Prim", "Kimin Müşterisi", "Kimin Kom (%)", "Dış Acente", "Dış Kom (%)"]];

  const filtrelenmis = sirket
    ? tumPoliceler.filter(p => p.kimin === sirket || p.dis === sirket)
    : tumPoliceler;

  filtrelenmis.forEach(p => {
    rows.push([
      p.musteri,
      p.tur,
      p.prim,
      p.kimin,
      p.kiminKomisyon,
      p.dis,
      p.disKomisyon
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Muhasebe");
  XLSX.writeFile(wb, "muhasebe_raporu.xlsx");
});