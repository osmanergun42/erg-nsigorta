import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let tumPoliceler = [];
let tumMusteriler = [];

window.addEventListener("DOMContentLoaded", async () => {
  const tablo = document.querySelector("#uyariTablosu tbody");
  const aramaInput = document.getElementById("anaAramaInput");
  const aramaBtn = document.getElementById("anaAramaBtn");
  const sonucListesi = document.getElementById("aramaOnerileri");

  try {
    const policySnap = await getDocs(collection(db, "policeler"));
    tumPoliceler = policySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    localStorage.setItem("policeler", JSON.stringify(tumPoliceler));

    const musteriSnap = await getDocs(collection(db, "musteriler"));
    tumMusteriler = musteriSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    localStorage.setItem("musteriler", JSON.stringify(tumMusteriler));
  } catch (err) {
    console.error("❌ Veriler alınamadı:", err);
    return;
  }

  // 📆 7 gün içinde bitecek poliçeler
  const bugun = new Date();
  tablo.innerHTML = "";
  const yaklasanlar = tumPoliceler.filter(p => {
    const bitis = new Date(p.bitis);
    const fark = Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24));
    return fark <= 7 && fark >= 0;
  });

  if (yaklasanlar.length > 0) {
    yaklasanlar.forEach(p => {
      const farkGun = Math.ceil((new Date(p.bitis) - bugun) / (1000 * 60 * 60 * 24));
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.musteri}</td>
        <td>${p.tur}</td>
        <td>${p.bitis}</td>
        <td>${farkGun} gün</td>
      `;
      tablo.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">Yaklaşan poliçe bulunmamaktadır.</td>`;
    tablo.appendChild(tr);
  }

  // 🔍 Canlı arama önerileri (sadece müşteri adı göster)
aramaInput.addEventListener("input", () => {
  const kelime = aramaInput.value.toLocaleLowerCase("tr-TR").trim();
  sonucListesi.innerHTML = "";
  if (!kelime) return;

  const musteriOneri = tumMusteriler.filter(m =>
    m.adSoyad?.toLocaleLowerCase("tr-TR").includes(kelime)
  );

  const birlesik = musteriOneri.slice(0, 6); // sadece müşteri listesi

  birlesik.forEach(m => {
    const li = document.createElement("li");
    li.textContent = m.adSoyad;
    li.classList.add("arama-oneri");
    li.addEventListener("click", () => {
      localStorage.setItem("aramaKelimesi", m.adSoyad);
      window.location.href = "aramaSonuc.html";
    });
    sonucListesi.appendChild(li);
  });
});


  // 🔎 Arama Butonu
  aramaBtn.addEventListener("click", () => {
    const aranan = aramaInput.value.trim();
    if (!aranan) return alert("Lütfen bir isim veya plaka girin.");
    localStorage.setItem("aramaKelimesi", aranan);
    window.location.href = "aramaSonuc.html";
  });

  // 📥 Yedekleme
  document.getElementById("verileriIndir").addEventListener("click", () => {
    const data = {
      musteriler: tumMusteriler,
      policeler: tumPoliceler
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yedek_poliseler.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // 📤 JSON Yükleme
  document.getElementById("veriYukle").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const json = JSON.parse(event.target.result);
        if (json.musteriler && json.policeler) {
          localStorage.setItem("musteriler", JSON.stringify(json.musteriler));
          localStorage.setItem("policeler", JSON.stringify(json.policeler));
          alert("Veriler başarıyla yüklendi! Sayfayı yenileyin.");
        } else {
          alert("Geçersiz dosya formatı.");
        }
      } catch (err) {
        alert("Dosya okunamadı veya geçersiz JSON.");
      }
    };
    reader.readAsText(file);
  });

  // 📅 Tarihli İndirme
  document.getElementById("tarihliIndir").addEventListener("click", () => {
    const bas = new Date(document.getElementById("baslangicTarih").value);
    const bit = new Date(document.getElementById("bitisTarih").value);
    bit.setHours(23, 59, 59);
    if (isNaN(bas) || isNaN(bit)) return alert("Tarihleri eksiksiz girin.");

    const filtrelenmis = tumPoliceler.filter(p => {
      const bitisTarihi = new Date(p.bitis);
      return bitisTarihi >= bas && bitisTarihi <= bit;
    });

    if (filtrelenmis.length === 0) return alert("Bu tarihlerde poliçe bulunamadı.");

    const blob = new Blob([JSON.stringify(filtrelenmis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const basStr = document.getElementById("baslangicTarih").value;
    const bitStr = document.getElementById("bitisTarih").value;
    a.download = `policeler_${basStr}_${bitStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});
