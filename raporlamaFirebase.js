import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/xlsx.mjs";

let tumPoliceler = [];
let turChart, aylikPrimChart, aylikKomisyonChart, kiminPieChart;

// Veri çek
async function verileriGetir() {
  const querySnapshot = await getDocs(collection(db, "policeler"));
  tumPoliceler = [];
  querySnapshot.forEach(doc => {
    const veri = doc.data();
    if (!veri.iptalDurumu) {
      tumPoliceler.push(veri);
    }
  });

  acenteDropdownDoldur();
  grafikleriCiz();
}

function acenteDropdownDoldur() {
  const select = document.getElementById("acenteFiltre");
  const acenteler = [...new Set(tumPoliceler.map(p => p.kimin).filter(Boolean))];
  select.innerHTML = `<option value="">Tümü</option>`;
  acenteler.forEach(acente => {
    const option = document.createElement("option");
    option.value = acente;
    option.textContent = acente;
    select.appendChild(option);
  });
}

document.getElementById("filtreleBtn")?.addEventListener("click", () => {
  const acente = document.getElementById("acenteFiltre").value;
  const ay = document.getElementById("ayFiltre").value; // 2025-01 gibi gelir

  const veriler = tumPoliceler.filter(p => {
    const kiminUygun = !acente || p.kimin === acente;
    const ayUygun = !ay || (p.bitis && p.bitis.startsWith(ay));
    return kiminUygun && ayUygun;
  });

  tabloyuGoster(veriler);
  grafikleriCiz(veriler);
});

function tabloyuGoster(veriler) {
  const tablo = document.querySelector("#filtreTablosu tbody");
  tablo.innerHTML = "";

  veriler.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.musteri || "-"}</td>
      <td>${p.plaka || "-"}</td>
      <td>${p.tescilNo || "-"}</td>
      <td>${p.tur || "-"}</td>
      <td>${p.baslangic || "-"}</td>
      <td>${p.bitis || "-"}</td>
      <td>${p.prim || "0"} ₺</td>
      <td>${p.kimin || "-"}</td>
      <td>${p.dis || "-"}</td>
    `;
    tablo.appendChild(tr);
  });

  // Excel için veriyi cachele
  window.sonFiltreliVeri = veriler;
}

// Excel'e aktar
document.getElementById("excelFiltreAktarBtn")?.addEventListener("click", () => {
  const veri = (window.sonFiltreliVeri || []).map(p => {
    return {
      "Müşteri": p.musteri,
      "Plaka": p.plaka,
      "Tescil No": p.tescilNo,
      "Tür": p.tur,
      "Başlangıç": p.baslangic,
      "Bitiş": p.bitis,
      "Prim (₺)": Number(p.prim).toFixed(2),
      "Kimin Müşterisi": p.kimin,
      "Dış Acente": p.dis
    };
  });

  const ws = XLSX.utils.json_to_sheet(veri);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Filtreli Poliçeler");
  XLSX.writeFile(wb, "filtreli_policeler.xlsx");
});

function grafikleriCiz(veriSeti = tumPoliceler) {
  const veriler = veriSeti;

  const turler = {};
  veriler.forEach(p => {
    turler[p.tur] = (turler[p.tur] || 0) + 1;
  });
  if (turChart) turChart.destroy();
  turChart = new Chart(document.getElementById("turGrafik"), {
    type: "bar",
    data: {
      labels: Object.keys(turler),
      datasets: [{
        label: "Poliçe Sayısı",
        data: Object.values(turler),
        backgroundColor: "#4BC0C0"
      }]
    }
  });

  const aylikPrim = {};
  veriler.forEach(p => {
    const ay = (p.bitis || "").slice(0, 7);
    aylikPrim[ay] = (aylikPrim[ay] || 0) + Number(p.prim || 0);
  });
  if (aylikPrimChart) aylikPrimChart.destroy();
  aylikPrimChart = new Chart(document.getElementById("aylikPrimGrafik"), {
    type: "line",
    data: {
      labels: Object.keys(aylikPrim).sort(),
      datasets: [{
        label: "Toplam Prim (₺)",
        data: Object.values(aylikPrim),
        borderColor: "#36A2EB",
        backgroundColor: "rgba(54,162,235,0.1)",
        tension: 0.4,
        fill: true
      }]
    }
  });

  const aylikKomisyon = {};
  veriler.forEach(p => {
    const ay = (p.bitis || "").slice(0, 7);
    const komisyon = (Number(p.prim || 0) * ((Number(p.disKomisyon) || 0) + (Number(p.kiminKomisyon) || 0))) / 100;
    aylikKomisyon[ay] = (aylikKomisyon[ay] || 0) + komisyon;
  });
  if (aylikKomisyonChart) aylikKomisyonChart.destroy();
  aylikKomisyonChart = new Chart(document.getElementById("aylikKomisyonGrafik"), {
    type: "line",
    data: {
      labels: Object.keys(aylikKomisyon).sort(),
      datasets: [{
        label: "Toplam Komisyon (₺)",
        data: Object.values(aylikKomisyon),
        borderColor: "#FF6384",
        backgroundColor: "rgba(255,99,132,0.1)",
        tension: 0.4,
        fill: true
      }]
    }
  });

  const komisyonlar = {};
  veriler.forEach(p => {
    const kimin = p.kimin;
    const kom = (Number(p.prim || 0) * Number(p.kiminKomisyon || 0)) / 100;
    komisyonlar[kimin] = (komisyonlar[kimin] || 0) + kom;
  });
  if (kiminPieChart) kiminPieChart.destroy();
  kiminPieChart = new Chart(document.getElementById("kiminKomisyonPie"), {
    type: "pie",
    data: {
      labels: Object.keys(komisyonlar),
      datasets: [{
        data: Object.values(komisyonlar),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
      }]
    }
  });
}

// Başlat
verileriGetir();
