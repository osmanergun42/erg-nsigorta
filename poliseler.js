// js/poliseler.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("policeForm");
    const tabloBody = document.querySelector("#policeTablosu tbody");
    const aramaInput = document.getElementById("policeArama");
    const musteriSec = document.getElementById("musteriSec");
  
    // LocalStorage'tan verileri al
    const getMusteriler = () => JSON.parse(localStorage.getItem("musteriler")) || [];
    const getPoliceler = () => JSON.parse(localStorage.getItem("policeler")) || [];
    const setPoliceler = (data) => localStorage.setItem("policeler", JSON.stringify(data));
  
    // Müşterileri select dropdown'a yükle
    function musteriListesiYukle() {
      const musteriler = getMusteriler();
      musteriler.forEach((musteri, index) => {
        const option = document.createElement("option");
        option.value = musteri.adSoyad;
        option.textContent = musteri.adSoyad;
        musteriSec.appendChild(option);
      });
    }
  
    // Poliçe tablosunu güncelle
    function tabloyuGuncelle() {
      const policeler = getPoliceler();
      const arama = aramaInput.value.toLowerCase();
      tabloBody.innerHTML = "";
  
      policeler.forEach((p, index) => {
        if (p.musteri.toLowerCase().includes(arama)) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${p.musteri}</td>
            <td>${p.tur}</td>
            <td>${p.bitis}</td>
            <td>${p.prim} ₺</td>
            <td>${p.kimin}</td>
            <td>${p.dis}</td>
            <td><button onclick="policeSil(${index})">❌</button></td>
          `;
          tabloBody.appendChild(tr);
        }
      });
    }
  
    // Poliçe silme
    window.policeSil = function(index) {
      const policeler = getPoliceler();
      if (confirm("Bu poliçeyi silmek istediğinizden emin misiniz?")) {
        policeler.splice(index, 1);
        setPoliceler(policeler);
        tabloyuGuncelle();
      }
    };
  
    form.addEventListener("submit", (e) => {
        e.preventDefault();
      
        const poliçe = {
          musteri: musteriSec.value,
          tur: document.getElementById("policeTuru").value,
          baslangic: document.getElementById("baslangicTarihi").value,
          bitis: document.getElementById("bitisTarihi").value,
          prim: parseFloat(document.getElementById("primTutari").value),
          kimin: document.getElementById("kiminMusterisi").value,
          kiminKomisyon: parseFloat(document.getElementById("kiminKomisyon").value),
          dis: document.getElementById("disAcente").value,
          disKomisyon: parseFloat(document.getElementById("disKomisyon").value)
        };
      
        const policeler = getPoliceler();
      
        if (guncellenecekIndex !== null) {
          policeler[guncellenecekIndex] = poliçe;
          guncellenecekIndex = null;
          document.querySelector("#policeForm button").textContent = "Ekle";
        } else {
          policeler.push(poliçe);
        }
      
        setPoliceler(policeler);
        form.reset();
        tabloyuGuncelle();
      });
      
    aramaInput.addEventListener("input", tabloyuGuncelle);
  
    musteriListesiYukle();
    tabloyuGuncelle();
  });
  // GLOBAL: Güncellenen poliçenin index'i
let guncellenecekIndex = null;

// Poliçeyi düzenle
window.policeDuzenle = function(index) {
  const policeler = getPoliceler();
  const p = policeler[index];

  // Form alanlarını doldur
  document.getElementById("musteriSec").value = p.musteri;
  document.getElementById("policeTuru").value = p.tur;
  document.getElementById("baslangicTarihi").value = p.baslangic;
  document.getElementById("bitisTarihi").value = p.bitis;
  document.getElementById("primTutari").value = p.prim;
  document.getElementById("kiminMusterisi").value = p.kimin;
  document.getElementById("kiminKomisyon").value = p.kiminKomisyon;
  document.getElementById("disAcente").value = p.dis;
  document.getElementById("disKomisyon").value = p.disKomisyon;

  // Butonun yazısını değiştir
  document.querySelector("#policeForm button").textContent = "Güncelle";
  guncellenecekIndex = index;
};
