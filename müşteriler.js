// js/müşteriler.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("musteriForm");
    const tabloBody = document.querySelector("#musteriTablosu tbody");
    const aramaInput = document.getElementById("arama");
  
    // LocalStorage'tan müşteri verilerini çek
    function getMusteriler() {
      return JSON.parse(localStorage.getItem("musteriler")) || [];
    }
  
    // LocalStorage'a müşteri verisi kaydet
    function setMusteriler(data) {
      localStorage.setItem("musteriler", JSON.stringify(data));
    }
  
    // Müşteri tablosunu güncelle
    function tabloyuGuncelle() {
      const musteriler = getMusteriler();
      const arama = aramaInput.value.toLowerCase();
      tabloBody.innerHTML = "";
  
      musteriler.forEach((musteri, index) => {
        if (musteri.adSoyad.toLowerCase().includes(arama)) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${musteri.adSoyad}</td>
            <td>${musteri.telefon}</td>
            <td>${musteri.email}</td>
            <td>${musteri.adres}</td>
            <td><button onclick="musteriSil(${index})">❌</button></td>
          `;
          tabloBody.appendChild(tr);
        }
      });
    }
  
    // Müşteri silme
    window.musteriSil = function(index) {
      const musteriler = getMusteriler();
      if (confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) {
        musteriler.splice(index, 1);
        setMusteriler(musteriler);
        tabloyuGuncelle();
      }
    };
  
    // Müşteri ekleme formu
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const yeniMusteri = {
        adSoyad: document.getElementById("adSoyad").value.trim(),
        telefon: document.getElementById("telefon").value.trim(),
        email: document.getElementById("email").value.trim(),
        adres: document.getElementById("adres").value.trim()
      };
  
      if (!yeniMusteri.adSoyad || !yeniMusteri.telefon || !yeniMusteri.email || !yeniMusteri.adres) {
        alert("Lütfen tüm alanları doldurun.");
        return;
      }
  
      const musteriler = getMusteriler();
      musteriler.push(yeniMusteri);
      setMusteriler(musteriler);
      form.reset();
      tabloyuGuncelle();
    });
  
    // Arama kutusunu dinle
    aramaInput.addEventListener("input", tabloyuGuncelle);
  
    // Sayfa yüklenince tabloyu hazırla
    tabloyuGuncelle();
  });
  