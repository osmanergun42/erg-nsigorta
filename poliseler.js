document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("policeForm");
  const tabloBody = document.querySelector("#policeTablo tbody");
  const aramaInput = document.getElementById("policeArama");
  const musteriSec = document.getElementById("musteriSec");

  const getMusteriler = () => JSON.parse(localStorage.getItem("musteriler")) || [];
  const getPoliceler = () => JSON.parse(localStorage.getItem("policeler")) || [];
  const setPoliceler = (data) => localStorage.setItem("policeler", JSON.stringify(data));

  function musteriListesiYukle() {
    const musteriler = getMusteriler();
    musteriler.forEach((musteri) => {
      const option = document.createElement("option");
      option.value = musteri.adSoyad;
      option.textContent = musteri.adSoyad;
      musteriSec.appendChild(option);
    });
  }

  function tabloyuGuncelle() {
    const policeler = getPoliceler();
    const arama = aramaInput?.value.toLowerCase() || "";

    const basTarihStr = document.getElementById("tabloFiltreBaslangic")?.value;
    const bitTarihStr = document.getElementById("tabloFiltreBitis")?.value;
    const basTarih = basTarihStr ? new Date(basTarihStr) : null;
    const bitTarih = bitTarihStr ? new Date(bitTarihStr) : null;

    tabloBody.innerHTML = "";

    policeler.forEach((p, index) => {
      const poliTarih = new Date(p.baslangic);
      const eslesenArama = p.musteri.toLowerCase().includes(arama);
      const tarihUygun =
        (!basTarih || poliTarih >= basTarih) &&
        (!bitTarih || poliTarih <= bitTarih);

      if (eslesenArama && tarihUygun) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.musteri}</td>
          <td>${p.plaka || "-"}</td>
          <td>${p.tescilNo || "-"}</td>
          <td>${p.tur}</td>
          <td>${p.bitis}</td>
          <td>${p.prim} ₺</td>
          <td>${p.kimin}</td>
          <td>${p.dis}</td>
          <td>${p.sirket || "-"}</td>
          <td>
            <button onclick="policeSil(${index})">❌</button>
            <button onclick="policeDuzenle(${index})">✏️</button>
          </td>
        `;
        tabloBody.appendChild(tr);
      }
    });
  }

  window.policeSil = function (index) {
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
      disKomisyon: parseFloat(document.getElementById("disKomisyon").value),
      plaka: document.getElementById("plaka").value,
      tescilNo: document.getElementById("tescilNo").value,
      sirket: document.getElementById("sirket").value,
      policeNo: document.getElementById("policeNo").value
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

  aramaInput?.addEventListener("input", tabloyuGuncelle);
  document.getElementById("tarihFiltreleBtn").addEventListener("click", tabloyuGuncelle);

  musteriListesiYukle();
  tabloyuGuncelle();
});

let guncellenecekIndex = null;

window.policeDuzenle = function (index) {
  const policeler = JSON.parse(localStorage.getItem("policeler")) || [];
  const p = policeler[index];

  document.getElementById("musteriSec").value = p.musteri;
  document.getElementById("policeTuru").value = p.tur;
  document.getElementById("baslangicTarihi").value = p.baslangic;
  document.getElementById("bitisTarihi").value = p.bitis;
  document.getElementById("primTutari").value = p.prim;
  document.getElementById("kiminMusterisi").value = p.kimin;
  document.getElementById("kiminKomisyon").value = p.kiminKomisyon;
  document.getElementById("disAcente").value = p.dis;
  document.getElementById("disKomisyon").value = p.disKomisyon;
  document.getElementById("plaka").value = p.plaka || "";
  document.getElementById("tescilNo").value = p.tescilNo || "";
  document.getElementById("sirket").value = p.sirket || "";
  document.getElementById("policeNo").value = p.policeNo || "";

  document.querySelector("#policeForm button").textContent = "Güncelle";
  guncellenecekIndex = index;
};
