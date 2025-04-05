document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("musteriForm");
    const tabloBody = document.querySelector("#musteriTablo tbody");
    const aramaInput = document.getElementById("arama");
    const musteriSelect = document.getElementById("musteriSelect");
  
    function getMusteriler() {
      return JSON.parse(localStorage.getItem("musteriler")) || [];
    }
  
    function setMusteriler(data) {
      localStorage.setItem("musteriler", JSON.stringify(data));
    }
  
    function tabloyuGuncelle() {
      const musteriler = getMusteriler();
      const arama = aramaInput.value.toLowerCase();
      tabloBody.innerHTML = "";
  
      musteriler.forEach((musteri, index) => {
        const { adSoyad, telefon, email, tcKimlik } = musteri;
        const veri = `${adSoyad} ${telefon} ${email} ${tcKimlik}`.toLowerCase();
  
        if (veri.includes(arama)) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${adSoyad}</td>
            <td>${telefon}</td>
            <td>${email}</td>
            <td>${tcKimlik}</td>
            <td><button onclick="musteriSil(${index})">❌</button></td>
          `;
          tabloBody.appendChild(tr);
        }
      });
    }
  
    function musteriSelect2Guncelle() {
      const musteriler = getMusteriler();
      if (!musteriSelect) return;
  
      $(musteriSelect).empty(); // Önce temizle
      musteriler.forEach(m => {
        const option = new Option(m.adSoyad, m.adSoyad);
        $(musteriSelect).append(option);
      });
  
      // Select2'yi yeniden başlat
      $(musteriSelect).select2({
        placeholder: "Müşteri Seçin...",
        allowClear: true
      });
    }
  
    window.musteriSil = function(index) {
      const musteriler = getMusteriler();
      if (confirm("Bu müşteriyi silmek istiyor musunuz?")) {
        musteriler.splice(index, 1);
        setMusteriler(musteriler);
        tabloyuGuncelle();
        musteriSelect2Guncelle();
      }
    };
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const yeniMusteri = {
        adSoyad: document.getElementById("adSoyad").value.trim(),
        telefon: document.getElementById("telefon").value.trim(),
        email: document.getElementById("email").value.trim(),
        tcKimlik: document.getElementById("tcKimlik").value.trim()
      };
  
      if (!yeniMusteri.adSoyad || !yeniMusteri.telefon || !yeniMusteri.email || !yeniMusteri.tcKimlik) {
        alert("Lütfen tüm alanları doldurun.");
        return;
      }
  
      const musteriler = getMusteriler();
      musteriler.push(yeniMusteri);
      setMusteriler(musteriler);
      form.reset();
      tabloyuGuncelle();
      musteriSelect2Guncelle();
    });
  
    aramaInput.addEventListener("input", tabloyuGuncelle);
  
    tabloyuGuncelle();
    musteriSelect2Guncelle();
  });