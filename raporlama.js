import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/xlsx.mjs";

let tumPoliceler = [];
let turChart, aylikPrimChart, aylikKomisyonChart, kiminPieChart;

// 📥 Verileri al ve işle
async function verileriGetir() {
  const querySnapshot = await getDocs(collection(db, "policeler"));
  tumPoliceler = [];
  querySnapshot.forEach(doc => {
    tumPoliceler.push(doc.data());
  });

  filtreleriDoldur();
  grafikleriCiz();
}

// 🔽 Dropdown filtrelerini doldur
function filtreleriDoldur() {
  const acenteSelect = document.getElementById("acenteFiltre");
  const aySelect = document.getElementById("ayFiltre"); // 👈 yeni dropdown

  const acenteler = [...new Set(tumPoliceler.map(p => p.kimin).filter(Boolean))];
  const aylar = [...new Set(tumPoliceler.map(p => new Date(p.bitis).toISOString().slice(0, 7)))];

  acenteSelect.innerHTML = `<option value="">Tümü</option>`;
  aySelect.innerHTML = `<option value="">Tümü</option>`;

  acenteler.forEach(a => {
    const o = document.createElement("option");
    o.value = a;
    o.textContent = a;
    acenteSelect.appendChild(o);
  });

  aylar.sort().forEach(a => {
    const o = document.createElement("option");
    o.value = a;
    o.textContent = a;
    aySelect.appendChild(o);
  });

  acenteSelect.addEventListener("change", grafikleriCiz);
  aySelect.addEventListener("change", grafikleriCiz);
}

// 📊 Grafik çizimi ve filtre
function grafikleriCiz() {
  const acente = document.getElementById("acenteFiltre").value;
  const ay = document.getElementById("ayFiltre").value;

  const veriler = tumPoliceler.filter(p => {
    const kiminEslesme = !acente || (p.kimin?.toLowerCase() === acente.toLowerCase());
    const ayEslesme = !ay || new Date(p.bitis).toISOString().slice(0, 7) === ay;
    return kiminEslesme && ayEslesme;
  });

  // Poliçe tür dağılımı
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
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    },
    options: { responsive: true }
  });

  // Aylık prim grafiği
  const aylikPrim = {};
  veriler.forEach(p => {
    const ay = new Date(p.bitis).toISOString().slice(0, 7);
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
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.2
      }]
    },
    options: { responsive: true }
  });

  // Aylık komisyon grafiği
  const aylikKomisyon = {};
  veriler.forEach(p => {
    const ay = new Date(p.bitis).toISOString().slice(0, 7);
    const komisyon = (Number(p.prim || 0) * Number(p.disKomisyon || 0)) / 100;
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
        borderColor: 'rgba(255,159,64,1)',
        backgroundColor: 'rgba(255,159,64,0.2)',
        tension: 0.2
      }]
    },
    options: { responsive: true }
  });

  // Kimin müşterisi bazlı komisyon dağılımı
  const komisyonlar = {};
  veriler.forEach(p => {
    const kimin = p.kimin;
    const kom = (Number(p.prim || 0) * Number(p.disKomisyon || 0)) / 100;
    komisyonlar[kimin] = (komisyonlar[kimin] || 0) + kom;
  });
  if (kiminPieChart) kiminPieChart.destroy();
  kiminPieChart = new Chart(document.getElementById("kiminKomisyonPie"), {
    type: "pie",
    data: {
      labels: Object.keys(komisyonlar),
      datasets: [{
        data: Object.values(komisyonlar),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#66D9EF', '#EAC435'
        ]
      }]
    },
    options: { responsive: true }
  });
}

// 🔁 Başlat
verileriGetir();
