import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc
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

  async function poliseleriGetir() {
    const querySnapshot = await getDocs(collection(db, "policeler"));
    policeListesi = [];
    querySnapshot.forEach(docSnap => {
      const veri = docSnap.data();
      policeListesi.push({ ...veri, id: docSnap.id });
    });

    tabloyuGuncelle(policeListesi);
  }

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

      let iptalEtiketi = "";
      let iptalButonHTML = "";

      if (p.iptalDurumu) {
        tr.classList.add("iptal-poliçe");
        iptalEtiketi = `<span style="color:red; font-weight:bold;">❌ İptal Edildi</span><br>`;
        iptalButonHTML = `<button data-id="${p.id}" class="iptalKaldirBtn">İptali Geri Al</button>`;
      }

      tr.innerHTML = `
        <td>${iptalEtiketi}${p.musteri || "-"}<br>${iptalButonHTML}</td>
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

    document.querySelectorAll(".iptalKaldirBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const veri = policeListesi.find(p => p.id === id);
        if (!veri) return;

        if (!confirm("Bu poliçenin iptalini geri almak istiyor musunuz?")) return;

        await updateDoc(doc(db, "policeler", id), {
          iptalDurumu: false,
          iptalTarihi: "",
          iptalNotu: "",
          kiminKesinti: 0,
          disKesinti: 0,
          kazanilanPrim: 0,
          prim: veri.orijinalPrim || veri.prim,
          orijinalPrim: ""
        });

        alert("✅ İptal durumu kaldırıldı ve prim geri yüklendi!");
        poliseleriGetir();
      });
    });
  }

  // ✅ GÜNCELLENEN FİLTRELEME
  filtreleBtn?.addEventListener("click", () => {
    const kimin = filtreInput.value.trim().toLowerCase();
    const dis = disFiltreInput.value.trim().toLowerCase();
    const ay = ayInput.value;

    const filtreli = policeListesi.filter(p => {
      const kiminUygun = !kimin || p.kimin?.toLowerCase().includes(kimin);
      const disUygun = !dis || p.dis?.toLowerCase().includes(dis);
      const baslangicAy = (p.baslangic || "").slice(0, 7);
      const ayUygun = !ay || baslangicAy === ay;
      return kiminUygun && disUygun && ayUygun;
    });

    tabloyuGuncelle(filtreli);
  });

  document.getElementById("excelAktar").addEventListener("click", () => {
    const tablo = document.getElementById("muhasebeTablosu");
    const wb = XLSX.utils.table_to_book(tablo, { sheet: "Muhasebe" });
    XLSX.writeFile(wb, "muhasebe_raporu.xlsx");
  });

  poliseleriGetir();
});
