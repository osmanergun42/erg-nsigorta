// js/muhasebe.js

import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/xlsx.mjs";

document.addEventListener("DOMContentLoaded", async () => {
  const tabloBody = document.querySelector("#muhasebeTablosu tbody");
  const toplamPrimTd = document.getElementById("toplamPrim");
  const toplamKiminTd = document.getElementById("toplamKimin");
  const toplamDisTd = document.getElementById("toplamDis");
  const filtreInput = document.getElementById("kiminFiltre");
  const disFiltreInput = document.getElementById("disFiltre");
  const ayInput = document.getElementById("ayFiltre");
  const filtreleBtn = document.getElementById("filtreleBtn");

  let policeListesi = [];

  // Firestore'dan poliçeleri çek
  async function poliseleriGetir() {
    const querySnapshot = await getDocs(collection(db, "policeler"));
    policeListesi = [];
    querySnapshot.forEach(doc => {
      const veri = doc.data();
      if (!veri.iptalDurumu) {
        policeListesi.push(veri);
      }
    });

    console.log("Firestore'dan çekilen veri sayısı:", policeListesi.length);
    tabloyuGuncelle(policeListesi); // İlk tabloyu göster
  }

  // Tabloyu yazdır
  function tabloyuGuncelle(veriler) {
    tabloBody.innerHTML = "";

    let toplamPrim = 0;
    let toplamKiminKomisyon = 0;
    let toplamDisKomisyon = 0;

    veriler.forEach(p => {
      const prim = Number(p.prim || 0);
      const kiminKom = Number(p.kiminKomisyon || 0);
      const disKom = Number(p.disKomisyon || 0);

      const kiminKomisyon = (prim * kiminKom) / 100;
      const disKomisyon = (prim * disKom) / 100;

      toplamPrim += prim;
      toplamKiminKomisyon += kiminKomisyon;
      toplamDisKomisyon += disKomisyon;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.musteri || "-"}</td>
        <td>${p.tur || "-"}</td>
        <td>${p.baslangic || "-"}</td>
        <td>${p.bitis || "-"}</td>
        <td>${prim.toFixed(2)} ₺</td>
        <td>${p.kimin || "-"}</td>
        <td>${kiminKomisyon.toFixed(2)} ₺</td>
        <td>${p.dis || "-"}</td>
        <td>${disKomisyon.toFixed(2)} ₺</td>
      `;
      tabloBody.appendChild(tr);
    });

    toplamPrimTd.textContent = `₺${toplamPrim.toFixed(2)}`;
    toplamKiminTd.textContent = `₺${toplamKiminKomisyon.toFixed(2)}`;
    toplamDisTd.textContent = `₺${toplamDisKomisyon.toFixed(2)}`;
  }

  // 🔍 Filtrele butonu
  filtreleBtn?.addEventListener("click", () => {
    const kimin = filtreInput.value.trim().toLowerCase();
    const dis = disFiltreInput.value.trim().toLowerCase();
    const ay = ayInput.value; // 2025-01 gibi gelir

    console.log("Filtre parametreleri:", { kimin, dis, ay });

    const filtreli = policeListesi.filter(p => {
      const kiminUygun = !kimin || p.kimin?.toLowerCase().includes(kimin);
      const disUygun = !dis || p.dis?.toLowerCase().includes(dis);
      const ayUygun = !ay || (p.bitis && p.bitis.startsWith(ay));
      return kiminUygun && disUygun && ayUygun;
    });

    console.log("Filtrelenmiş veri sayısı:", filtreli.length);
    tabloyuGuncelle(filtreli);
  });

  // Excel'e aktar
  document.getElementById("excelAktar").addEventListener("click", () => {
    const tablo = document.getElementById("muhasebeTablosu");
    const wb = XLSX.utils.table_to_book(tablo, { sheet: "Muhasebe" });
    XLSX.writeFile(wb, "muhasebe_raporu.xlsx");
  });

  // Verileri al
  poliseleriGetir();
});
