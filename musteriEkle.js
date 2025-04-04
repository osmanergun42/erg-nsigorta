import { db } from "./firebase.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Form submit olunca Firestore'a müşteri ekle
document.getElementById("musteriForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const yeniMusteri = {
    adSoyad: document.getElementById("adSoyad").value.trim(),
    telefon: document.getElementById("telefon").value.trim(), // opsiyonel
    email: document.getElementById("email").value.trim(),     // opsiyonel
    tc: document.getElementById("tcKimlik").value.trim()      // opsiyonel
  };

  try {
    await addDoc(collection(db, "musteriler"), yeniMusteri);
    alert("✅ Müşteri başarıyla kaydedildi!");
    e.target.reset();
  } catch (err) {
    console.error("❌ Hata:", err);
    alert("Müşteri kaydedilemedi!");
  }
});
