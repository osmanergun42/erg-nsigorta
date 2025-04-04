import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let tumPoliceler = [];
let turChart, aylikPrimChart, aylikKomisyonChart, kiminPieChart;

// Verileri Firebase'den al
async function verileriGetir() {
  const querySnapshot = await getDocs(collection(db, "policeler"));
  tumPoliceler = [];
  querySnapshot.forEach(doc => {
    tumPoliceler.push(doc.data());
  });

  grafikleriCiz();
  acenteDropdownDoldur();
}

// Dropdown filtreleme menüsü
function acenteDropdownDoldur() {
  const select = document.getElementById("acenteFiltre");
  const uniqueAcenteler = [...new Set(tumPoliceler.map(p => p.kimin).filter(Boolean))];

  select.innerHTML = `<option value="">Tümü</option>`;
  uniqueAcenteler.forEach(acente => {
    const option = document.createElement("option");
    option.value = acente;
    option.textContent = acente;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    grafikleriCiz(select.value);
  });
}

// Grafikler
function grafikleriCiz(filtre = "") {
  const veriler = filtre
    ? tumPoliceler.filter(p => p.kimin.toLowerCase() === filtre.toLowerCase())
    : tumPoliceler;

  // Poliçe Türü Dağılımı
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
        data: Object.values(turler)
      }]
    }
  });

  // Aylık Prim
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
        data: Object.values(aylikPrim)
      }]
    }
  });

  // Aylık Komisyon (dış acente oranına göre)
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
        data: Object.values(aylikKomisyon)
      }]
    }
  });

  // Kimin Müşterisi bazlı komisyon pastası
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
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
      }]
    }
  });
}

verileriGetir();
