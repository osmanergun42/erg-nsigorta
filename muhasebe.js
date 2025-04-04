// js/muhasebe.js

document.addEventListener("DOMContentLoaded", () => {
    const tabloBody = document.querySelector("#muhasebeTablosu tbody");
    const toplamPrimTd = document.getElementById("toplamPrim");
    const toplamKiminTd = document.getElementById("toplamKimin");
    const toplamDisTd = document.getElementById("toplamDis");
    const filtreInput = document.getElementById("kiminFiltre");
  
    const getPoliceler = () => JSON.parse(localStorage.getItem("policeler")) || [];
  
    function tabloyuGuncelle() {
      const policeler = getPoliceler();
      const filtre = filtreInput.value.toLowerCase();
  
      tabloBody.innerHTML = "";
  
      let toplamPrim = 0;
      let toplamKiminKomisyon = 0;
      let toplamDisKomisyon = 0;
  
      policeler.forEach((p) => {
        if (p.kimin.toLowerCase().includes(filtre)) {
          const kiminKomisyon = (p.prim * (p.kiminKomisyon || 0)) / 100;
          const disKomisyon = (p.prim * (p.disKomisyon || 0)) / 100;
  
          toplamPrim += p.prim;
          toplamKiminKomisyon += kiminKomisyon;
          toplamDisKomisyon += disKomisyon;
  
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${p.musteri}</td>
            <td>${p.tur}</td>
            <td>${p.prim.toFixed(2)} ₺</td>
            <td>${p.kimin}</td>
            <td>${kiminKomisyon.toFixed(2)} ₺</td>
            <td>${p.dis}</td>
            <td>${disKomisyon.toFixed(2)} ₺</td>
          `;
          tabloBody.appendChild(tr);
        }
      });
  
      // Toplamları yaz
      toplamPrimTd.textContent = `₺${toplamPrim.toFixed(2)}`;
      toplamKiminTd.textContent = `₺${toplamKiminKomisyon.toFixed(2)}`;
      toplamDisTd.textContent = `₺${toplamDisKomisyon.toFixed(2)}`;
    }
  
    filtreInput.addEventListener("input", tabloyuGuncelle);
    tabloyuGuncelle();
  });
  // Excel'e Aktarma Fonksiyonu
document.getElementById("excelAktar").addEventListener("click", () => {
    const tablo = document.getElementById("muhasebeTablosu");
  
    // SheetJS ile tabloyu Excel dosyasına çevir
    const wb = XLSX.utils.table_to_book(tablo, { sheet: "Muhasebe" });
    XLSX.writeFile(wb, "muhasebe_raporu.xlsx");
  });
  let filtrelenmisPoliceler = [];

document.getElementById("onizleBtn").addEventListener("click", () => {
  const baslangic = new Date(document.getElementById("tarihBaslangic").value);
  const bitis = new Date(document.getElementById("tarihBitis").value);
  bitis.setHours(23, 59, 59); // tüm gün dahil

  if (isNaN(baslangic) || isNaN(bitis)) {
    alert("Lütfen geçerli tarihler girin.");
    return;
  }

  const policeler = JSON.parse(localStorage.getItem("policeler")) || [];
  filtrelenmisPoliceler = policeler.filter(p => {
    const bitisTarihi = new Date(p.bitis);
    return bitisTarihi >= baslangic && bitisTarihi <= bitis;
  });

  const tbody = document.querySelector("#onizlemeTablosu tbody");
  tbody.innerHTML = "";

  if (filtrelenmisPoliceler.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6">Bu tarih aralığında poliçe bulunamadı.</td>`;
    tbody.appendChild(tr);
    document.getElementById("excelAktarBtn").disabled = true;
    return;
  }

  filtrelenmisPoliceler.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.musteri}</td>
      <td>${p.tur}</td>
      <td>${p.bitis}</td>
      <td>${p.prim} ₺</td>
      <td>${p.kimin}</td>
      <td>${p.dis}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("excelAktarBtn").disabled = false;
});

// Excel'e aktar
document.getElementById("excelAktarBtn").addEventListener("click", () => {
  if (filtrelenmisPoliceler.length === 0) {
    alert("İndirmek için poliçe bulunamadı.");
    return;
  }

  const wsData = [
    ["Müşteri", "Poliçe Türü", "Bitiş Tarihi", "Prim", "Kimin Müşterisi", "Dış Acente"]
  ];

  filtrelenmisPoliceler.forEach(p => {
    wsData.push([p.musteri, p.tur, p.bitis, p.prim + " ₺", p.kimin, p.dis]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Poliçeler");

  const bas = document.getElementById("tarihBaslangic").value;
  const bit = document.getElementById("tarihBitis").value;
  XLSX.writeFile(wb, `policeler_${bas}_to_${bit}.xlsx`);
});

  