import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/xlsx.mjs";

let tumPoliceler = [];
let turChart, aylikPrimChart, aylikKomisyonChart, kiminPieChart;

// 📥 Verileri Firebase'den al
async function verileriGetir() {
  const querySnapshot = await getDocs(collection(db, "policeler"));
  tumPoliceler = [];
  querySnapshot.forEach(doc => {
    tumPoliceler.push(doc.data());
  });

  grafikleriCiz();
  acenteDropdownDoldur();
  guncelleKiminTablosu();
}

// 📌 Kimin Müşterisi araması
const kiminInput = document.getElementById("kiminFiltre");
const kiminTablo = document.querySelector("#kiminTablosu tbody");

function guncelleKiminTablosu() {
  const filtre = kiminInput.value.toLowerCase();
  kiminTablo.innerHTML = "";
  const filtrelenmis = tumPoliceler.filter(p => p.kimin?.toLowerCase().includes(filtre));

  filtrelenmis.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.musteri}</td>
      <td>${p.tur}</td>
      <td>${p.bitis}</td>
      <td>${p.prim} ₺</td>
      <td>${p.kimin}</td>
      <td>${p.dis}</td>
    `;
    kiminTablo.appendChild(tr);
  });
}

kiminInput?.addEventListener("input", guncelleKiminTablosu);

document.getElementById("excelAktar")?.addEventListener("click", () => {
  const rows = [["Müşteri", "Tür", "Bitiş", "Prim", "Kimin", "Dış Acente"]];
  const filtre = kiminInput.value.toLowerCase();

  tumPoliceler.forEach(p => {
    if (p.kimin?.toLowerCase().includes(filtre)) {
      rows.push([p.musteri, p.tur, p.bitis, `${p.prim} ₺`, p.kimin, p.dis]);
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Kimin Müsterisi");
  XLSX.writeFile(wb, "rapor_kimin.xlsx");
});

// 📅 Tarih Aralığıyla filtreleme
const tarihTablo = document.querySelector("#tarihTablosu tbody");
const onizleBtn = document.getElementById("onizleBtn");
const excelTarihBtn = document.getElementById("excelTarihAktarBtn");
let filtrelenmisTarih = [];

onizleBtn?.addEventListener("click", () => {
  const bas = new Date(document.getElementById("tarihBaslangic").value);
  const bit = new Date(document.getElementById("tarihBitis").value);
  bit.setHours(23, 59, 59);

  if (isNaN(bas) || isNaN(bit)) {
    alert("Tarihleri eksiksiz girin.");
    return;
  }

  filtrelenmisTarih = tumPoliceler.filter(p => {
    const bitisTarihi = new Date(p.bitis);
    return bitisTarihi >= bas && bitisTarihi <= bit;
  });

  tarihTablo.innerHTML = "";
  if (filtrelenmisTarih.length === 0) {
    tarihTablo.innerHTML = `<tr><td colspan="6">Veri bulunamadı.</td></tr>`;
    excelTarihBtn.disabled = true;
    return;
  }

  filtrelenmisTarih.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.musteri}</td>
      <td>${p.tur}</td>
      <td>${p.bitis}</td>
      <td>${p.prim} ₺</td>
      <td>${p.kimin}</td>
      <td>${p.dis}</td>
    `;
    tarihTablo.appendChild(tr);
  });

  excelTarihBtn.disabled = false;
});

excelTarihBtn?.addEventListener("click", () => {
  const rows = [["Müşteri", "Tür", "Bitiş", "Prim", "Kimin", "Dış Acente"]];
  filtrelenmisTarih.forEach(p => {
    rows.push([p.musteri, p.tur, p.bitis, `${p.prim} ₺`, p.kimin, p.dis]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Tarih Aralığı");
  XLSX.writeFile(wb, "rapor_tarih_araligi.xlsx");
});

// 🔽 Grafik filtreleme dropdown'u
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

  select.addEventListener("change", () => {
    grafikleriCiz(select.value);
  });
}

// 📊 Grafik çizimi
function grafikleriCiz(filtre = "") {
  const veriler = filtre
    ? tumPoliceler.filter(p => p.kimin.toLowerCase() === filtre.toLowerCase())
    : tumPoliceler;

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

verileriGetir();