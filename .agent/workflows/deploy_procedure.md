---
description: Standart Dağıtım Prosedürü (GitHub Push + Exe Build)
---

Her kod değişikliğinden sonra aşağıdaki adımlar sırasıyla uygulanmalıdır:

1. **Versiyon Güncelleme:**
   - `package.json` dosyasındaki versiyon numarasını artır.

2. **Web Dağıtımı (GitHub & Vercel):**
   - Değişiklikleri git'e ekle: `git add .`
   - Commit oluştur: `git commit -m "vX.X.X: <Değişiklik Açıklaması>"`
   - GitHub'a gönder: `git push`
   - *Not: GitHub'a push yapıldığında Vercel otomatik olarak güncellenir.*

3. **Masaüstü Uygulaması Oluşturma (Exe Build):**
   - Build komutunu çalıştır: `npm run electron:build -- --publish always`
   - *Not: Publish başarısız olsa bile yerel exe dosyası `release` klasöründe oluşturulur.*

4. **Kullanıcı Bilgilendirme:**
   - Web sitesinin güncellendiğini bildir.
   - Yeni `.exe` dosyasının yolunu kullanıcıya ilet.
