# Project Specific Agent Instructions

- Her işlem ve güncelleme sonrasında yapılan değişiklikleri MUTLAKA `git add .`, anlamlı bir commit mesajıyla `git commit` ve ardından GitHub'a `git push origin master` ve `git push origin master:main` yaparak depoya gönder. Kullanıcının tekrar tekrar commit/push istemesine gerek kalmadan her turun sonunda commit ve push otomatik yapılmalıdır.
- Sitenin genel teması kalıcı olarak Gece (Dark) modunda tutulmalıdır.
- Yönetim paneli sadece `mikrokosmosfansub@gmail.com` ve `aseleliyeva77@gmail.com` e-posta hesapları için profilde görünür olmalıdır.
- **GitHub Yetkilendirmesi:** Kod gönderimi için `origin` (Mikrokosmosfb/manhwa-fansub) remote adresi kullanılmalıdır. `git push` komutlarını her zaman bu repo origin adresiyle çalıştır.
- **Otomatik Push İçin Token:** Eğer push yaparken token yetkisi (403/Password required vb.) sorunu yaşarsan, projenin kök dizinindeki gizli `.github_token` dosyasını (içindeki token'ı) kullanarak origin URL'sini şu formatta ayarla ve öyle pushla: `git remote set-url origin https://<TOKEN>@github.com/Mikrokosmosfb/manhwa-fansub.git`
