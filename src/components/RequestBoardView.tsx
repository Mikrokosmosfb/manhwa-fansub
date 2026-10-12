import React, { useEffect } from 'react';

export const RequestBoardView: React.FC = () => {
  useEffect(() => {
    // Global variable declarations on window to prevent duplicate script re-declarations
    const win = window as any;

    win.SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYG7XKo4Wq8_hAaZb-vMomSHq-ZdLAlQhQQ2x9SKbDnPK_0ou5bWXniRcTDHn-vYZX/exec";
    win.DISCORD_URL = "https://discord.gg/H4cAsuFSYz";
    win.DEFAULT_COVER = "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=200&auto=format&fit=crop";
    win.IMGBB_API_KEY = "889bb65f39d53ff8809f0a9a97974b2a";

    win.currentStatusFilter = 'all';
    win.currentCategoryFilter = 'all';
    win.adminPassword = localStorage.getItem("mikro_admin_pass") || "";
    win.globalDataList = [];
    win.isSubmitting = false;

    win.normalizeText = function(str: any) {
      if (!str) return "";
      return String(str).replace(/İ/g, "i").replace(/I/g, "ı").replace(/Ş/g, "ş")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü").replace(/Ö/g, "ö").replace(/Ç/g, "ç")
        .toLowerCase().trim();
    };

    win.getUserToken = function() {
      let token = localStorage.getItem("mikro_user_token");
      if (!token) {
        token = "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("mikro_user_token", token);
      }
      return token;
    };

    win.apiCall = async function(payloadObj: any) {
      try {
        const res = await fetch(win.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payloadObj)
        });
        return await res.json();
      } catch (err) {
        return { success: false, message: "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin." };
      }
    };

    win.cleanSingleUrl = function(url: any) {
      if (!url) return "";
      let str = String(url).trim();
      if (str.toLowerCase().indexOf('http') === 0) {
        let nextHttp = str.indexOf('http', 4);
        if (nextHttp !== -1) str = str.substring(0, nextHttp).trim();
      }
      return str;
    };

    win.isImageUrl = function(url: any) {
      if (!url) return false;
      const str = String(url).trim().toLowerCase();
      return (str.includes('ibb.co/') || str.includes('imgur.com/') || 
              str.includes('googleusercontent.com/') || str.includes('share.google/') ||
              str.includes('drive.google.com/') || str.includes('photos.app.goo.gl/') ||
              str.includes('.jpg') || str.includes('.png') || 
              str.includes('.jpeg') || str.includes('.webp'));
    };

    win.openModal = function() { const m = document.getElementById("requestModal"); if(m) m.style.display = "flex"; };
    win.closeModal = function() {
      const m = document.getElementById("requestModal"); if(m) m.style.display = "none";
      win.isSubmitting = false;
      const btn = document.getElementById("submitBtn");
      if(btn) { btn.disabled = false; btn.innerText = "🚀 Gönder"; }
    };
    win.closeEditModal = function() { const m = document.getElementById("editModal"); if(m) m.style.display = "none"; };

    win.forceRefreshData = async function() {
      localStorage.removeItem("mikro_requests_cache");
      const loading = document.getElementById("loadingText");
      if (loading) loading.style.display = "block";
      win.showToast("🔄 Liste Google'dan yenileniyor...");
      await win.loadData();
    };

    win.handleFileUpload = function(input: any, targetInputId: string, statusId: string, boxId: string, imgId: string) {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) return alert("Lütfen 10 MB'tan küçük bir fotoğraf seçin.");

      const statusEl = document.getElementById(statusId);
      if (statusEl) {
        statusEl.innerText = "⚡ Fotoğraf Yükleniyor...";
        statusEl.style.color = "var(--neon-gold)";
        statusEl.style.display = "block";
      }

      const reader = new FileReader();
      reader.onload = async function(e: any) {
        const base64Data = e.target.result.split(',')[1];
        try {
          let uploadedUrl = await win.uploadToImgBB(base64Data);
          if (!uploadedUrl) uploadedUrl = await win.uploadToFreeImageHost(base64Data);
          if (uploadedUrl) {
            const targetInp: any = document.getElementById(targetInputId);
            if (targetInp) targetInp.value = uploadedUrl;
            win.previewImage(uploadedUrl, boxId, imgId);
            if (statusEl) { statusEl.innerText = "✅ Başarıyla yüklendi!"; statusEl.style.color = "var(--neon-green)"; }
          } else { throw new Error("Yükleme başarısız"); }
        } catch (err) {
          if (statusEl) { statusEl.innerText = "❌ Yüklenirken sorun oluştu."; statusEl.style.color = "#ff6b6b"; }
        }
      };
      reader.readAsDataURL(file);
    };

    win.uploadToImgBB = async function(b64: string) {
      try {
        const p = new URLSearchParams(); p.append("key", win.IMGBB_API_KEY || "3a35a6435c5b4e3bd91dd8bd2b069d35"); p.append("image", b64);
        const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: p });
        const json = await res.json(); if(json && json.data) return json.data.url;
      } catch(e){} return null;
    };

    win.uploadToFreeImageHost = async function(b64: string) {
      try {
        const p = new URLSearchParams(); p.append("key", "6d207e02198a847aa50d0a2233e07542"); p.append("action", "upload"); p.append("source", b64); p.append("format", "json");
        const res = await fetch("https://freeimage.host/api/1/upload", { method: "POST", body: p });
        const json = await res.json(); if(json && json.image) return json.image.url;
      } catch(e){} return null;
    };

    win.formatDate = function(dStr: any) {
      if(!dStr) return '';
      let str = String(dStr);
      if (str.includes('T')) { try { return new Date(str).toLocaleDateString('tr-TR'); } catch(e) { return str.split('T')[0]; } }
      return str;
    };

    win.fixImageUrl = function(url: any) {
      if (!url) return win.DEFAULT_COVER;
      url = win.cleanSingleUrl(url);
      let dm = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/share\.google\/([a-zA-Z0-9_-]+)/);
      if (dm && dm[1]) return 'https://lh3.googleusercontent.com/d/' + dm[1];
      if (url.includes('imgur.com/') && !url.includes('i.imgur.com') && !url.endsWith('.jpg') && !url.endsWith('.png')) {
        return 'https://i.imgur.com/' + url.split('/').pop().split('.')[0] + '.jpg';
      }
      return url;
    };

    win.previewImage = function(url: any, boxId: string, imgId: string) {
      const box = document.getElementById(boxId), img: any = document.getElementById(imgId);
      if (!box || !img) return;
      if(url && url.length > 5) { img.src = win.fixImageUrl(url); img.onerror = function() { this.src = win.DEFAULT_COVER; }; box.style.display = "block"; } else box.style.display = "none";
    };

    win.checkDuplicateTitle = function(val: string) {
      const warning = document.getElementById("duplicateWarning");
      if (!warning) return;
      if (!val || val.trim().length < 2) { warning.style.display = "none"; return; }
      const cleanInput = val.toLowerCase().trim();
      const exists = win.globalDataList.find((x: any) => String(x.seri || "").toLowerCase().trim() === cleanInput);
      if (exists) {
        warning.innerHTML = `⚠️ <strong>"${win.escapeHTML(exists.seri)}"</strong> zaten listede var! (Mevcut Oy: ${exists.oy || 0})<br>Tekrar eklemek yerine ona oy verebilirsin.`;
        warning.style.display = "block";
      } else warning.style.display = "none";
    };

    win.showToast = function(msg: string) {
      const box = document.getElementById("toastBox"); if(!box) return;
      const t = document.createElement("div"); t.className = "toast"; t.innerText = msg;
      box.appendChild(t); setTimeout(() => t.remove(), 3500);
    };

    win.toggleAdmin = function() {
      const app = document.getElementById("mikroApp"), btn = document.getElementById("adminBtnText");
      if (!win.adminPassword) {
        const p = prompt("Yönetici Şifrenizi Girin:");
        if (p) { win.adminPassword = p; localStorage.setItem("mikro_admin_pass", p); if(app) app.classList.add("admin-mode-on"); if(btn) btn.innerText = "Çıkış Yap"; win.showToast("🔑 Giriş Başarılı!"); }
      } else {
        win.adminPassword = ""; localStorage.removeItem("mikro_admin_pass");
        if(app) app.classList.remove("admin-mode-on"); if(btn) btn.innerText = "Admin Girişi"; win.showToast("Çıkış Yapıldı.");
      }
    };

    win.loadData = async function() {
      const loading = document.getElementById("loadingText");
      const res = await win.apiCall({ action: "list" });
      if (loading) loading.style.display = "none";
      if (res && res.success && Array.isArray(res.data)) {
        win.globalDataList = res.data;
        localStorage.setItem("mikro_requests_cache", JSON.stringify(res.data));
        win.renderDataList(res.data);
      } else { win.showToast("⚠️ Veriler çekilirken sorun oluştu."); }
    };

    win.initFastLoad = function() {
      const cachedData = localStorage.getItem("mikro_requests_cache");
      if (cachedData) {
        try { win.globalDataList = JSON.parse(cachedData); if (win.globalDataList.length > 0) win.renderDataList(win.globalDataList); } catch(e){}
      }
      win.loadData();
    };

    win.getStatusInfo = function(raw: any) {
      const st = win.normalizeText(raw || "Beklemede");
      if (st.includes("incele")) return { bClass: "badge-incelemede", dataStatus: "incelemede", text: "İncelemede" };
      if (st.includes("kabul")) return { bClass: "badge-kabul", dataStatus: "kabul", text: "Kabul Edildi" };
      if (st.includes("yapim") || st.includes("yapım")) return { bClass: "badge-yapim", dataStatus: "yapim", text: "Yapımda" };
      if (st.includes("yakin") || st.includes("yakın")) return { bClass: "badge-yakin", dataStatus: "yakin", text: "Yakında" };
      if (st.includes("yayin") || st.includes("yayın")) return { bClass: "badge-yayin", dataStatus: "yayin", text: "Yayında!" };
      if (st.includes("red")) return { bClass: "badge-red", dataStatus: "red", text: "Reddedildi" };
      return { bClass: "badge-beklemede", dataStatus: "beklemede", text: "Beklemede" };
    };

    win.renderDataList = function(dataList: any[]) {
      const grid = document.getElementById("cardGrid");
      if (!grid) return;
      grid.innerHTML = "";
      if(!dataList || dataList.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--text-sub); padding:20px;">Henüz hiç istek yok. İlk isteği siz gönderin!</div>';
        win.renderTrendCard(null); return;
      }
      const topTrend = [...dataList].filter(i => { const st = win.getStatusInfo(i.durum); return st.dataStatus !== "yayin" && st.dataStatus !== "red"; })
                                    .sort((a,b) => (b.oy || 0) - (a.oy || 0))[0];
      if (topTrend && (topTrend.oy || 0) > 0) win.renderTrendCard(topTrend);
      else {
        const trendEl = document.getElementById("trendShowcase");
        if (trendEl) trendEl.style.display = "none";
      }

      [...dataList].reverse().forEach(item => win.renderCard(item, grid));
      win.filterCards();
    };

    win.renderTrendCard = function(item: any) {
      const box = document.getElementById("trendShowcase"), c = document.getElementById("trendContent");
      if (!box || !c) return;
      if (!item) { box.style.display = "none"; return; }
      box.style.display = "block";
      let img = win.fixImageUrl(item.resim); if ((!item.resim || item.resim === win.DEFAULT_COVER) && win.isImageUrl(item.link)) img = win.fixImageUrl(item.link);
      const st = win.getStatusInfo(item.durum);
      let tags = "";
      if (item.tur && item.tur !== "Genel") item.tur.split(',').forEach((t: any) => { let cls = "tag-badge" + (t.includes("+18") ? " tag-18" : "") + (t.includes("BL") ? " tag-bl" : ""); tags += `<span class="${cls}">${win.escapeHTML(t.trim())}</span>`; });
      
      let note = "";
      if (st.dataStatus === "red" && item.link && item.link.includes("Red Nedeni")) note = `<div class="red-reason-box">❌ ${win.escapeHTML(item.link)}</div>`;
      else if (item.link && !win.isImageUrl(item.link)) note = `<div class="note-display-box" title="${win.escapeHTML(item.link)}"><strong>Not:</strong> ${win.escapeHTML(item.link)}</div>`;

      c.innerHTML = `
        <img class="trend-img" src="${win.escapeHTML(img)}" referrerpolicy="no-referrer" onerror="this.src='${win.DEFAULT_COVER}';">
        <div class="trend-info">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:4px;">
            <h3>${win.escapeHTML(item.seri)}</h3><span class="badge ${st.bClass}">${st.text}</span>
          </div>
          <p style="margin:0 0 6px 0; font-size:12px; color:var(--text-sub);">
            <strong>İsteyen:</strong> ${win.escapeHTML(item.kullanici)} (${win.formatDate(item.tarih)}) | <span style="color:var(--neon-purple); font-weight:bold;">${win.escapeHTML(item.kat)}</span> ${item.seriDurumu ? '| <span style="color:var(--neon-gold); font-size:11px; font-weight:600;"><i class="fa-solid fa-bookmark"></i> '+win.escapeHTML(item.seriDurumu)+'</span>' : ''}
          </p>
          ${tags ? `<div style="margin-bottom:6px;">${tags}</div>` : ''}
          ${note}
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button class="btn-vote voted" onclick="window.voteItem(${item.row})">👍 ${item.oy || 0} Oy</button>
            ${st.dataStatus === "yayin" && item.readLink ? `<a href="${win.escapeHTML(item.readLink)}" target="_blank" class="btn-read-now"><i class="fa-solid fa-book-open"></i> Oku</a>` : ''}
            <a href="${win.DISCORD_URL}" target="_blank" class="btn-cosmic" style="padding:5px 12px; font-size:11px;"><i class="fa-brands fa-discord"></i> Sor</a>
          </div>
        </div>`;
    };

    win.renderCard = function(item: any, container: HTMLElement) {
      const st = win.getStatusInfo(item.durum);
      let img = win.fixImageUrl(item.resim); if ((!item.resim || item.resim === win.DEFAULT_COVER) && win.isImageUrl(item.link)) img = win.fixImageUrl(item.link);
      let tags = "";
      if (item.tur && item.tur !== "Genel") item.tur.split(',').forEach((t: any) => { let cls = "tag-badge" + (t.includes("+18") ? " tag-18" : "") + (t.includes("BL") ? " tag-bl" : ""); tags += `<span class="${cls}">${win.escapeHTML(t.trim())}</span>`; });
      
      let note = "";
      if (st.dataStatus === "red" && item.link && item.link.includes("Red Nedeni")) note = `<div class="red-reason-box">❌ ${win.escapeHTML(item.link)}</div>`;
      else if (item.link && !win.isImageUrl(item.link)) note = `<div class="note-display-box" title="${win.escapeHTML(item.link)}"><strong>Not:</strong> ${win.escapeHTML(item.link)}</div>`;

      const card = document.createElement("div"); card.className = "series-card"; card.setAttribute("data-status", st.dataStatus); card.setAttribute("data-category", item.kat || "Manhwa");
      card.innerHTML = `
        <img class="cover-img" src="${win.escapeHTML(img)}" referrerpolicy="no-referrer" onerror="this.src='${win.DEFAULT_COVER}';">
        <div class="card-details">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:3px;">
            <h4 title="${win.escapeHTML(item.seri)}">${win.escapeHTML(item.seri)}</h4><span class="badge ${st.bClass}">${st.text}</span>
          </div>
          <div class="card-meta">
            <span><strong>İsteyen:</strong> ${win.escapeHTML(item.kullanici)} (${win.formatDate(item.tarih)})</span> | <span style="color:var(--neon-purple); font-weight:bold;">${win.escapeHTML(item.kat)}</span> ${item.seriDurumu ? ' | <span style="color:var(--neon-gold); font-size:10.5px; font-weight:600;"><i class="fa-solid fa-bookmark"></i> '+win.escapeHTML(item.seriDurumu)+'</span>' : ''}
          </div>
          ${tags ? `<div style="margin-bottom:4px;">${tags}</div>` : ''}
          ${note}
          <div class="card-action-bar">
            <button class="btn-vote" id="vote-btn-${item.row}" onclick="window.voteItem(${item.row})">👍 <span id="vote-cnt-${item.row}">${item.oy || 0}</span> Oy</button>
            ${st.dataStatus === "yayin" && item.readLink ? `<a href="${win.escapeHTML(item.readLink)}" target="_blank" class="btn-read-now"><i class="fa-solid fa-book-open"></i> Oku</a>` : ''}
            <a href="${win.DISCORD_URL}" target="_blank" style="font-size:10px; color:var(--text-sub); text-decoration:none;"><i class="fa-brands fa-discord"></i> Ekibe Sor</a>
          </div>
          <div class="admin-tools">
            <button class="act-btn act-edit" onclick="window.openEditModal(${item.row})">✏️ Düzenle</button>
            <button class="act-btn act-inceleme" onclick="window.updateStatus(${item.row}, 'İncelemede')">🔍 İnceleme</button>
            <button class="act-btn act-kabul" onclick="window.updateStatus(${item.row}, 'Kabul Edildi')">🟢 Kabul</button>
            <button class="act-btn act-yapim" onclick="window.updateStatus(${item.row}, 'Yapımda')">🔵 Yapım</button>
            <button class="act-btn act-yakin" onclick="window.updateStatus(${item.row}, 'Yakında')">⏳ Yakında</button>
            <button class="act-btn act-yayin" onclick="window.updateStatus(${item.row}, 'Yayında!')">🔮 Yayında</button>
            <button class="act-btn act-red" onclick="window.rejectItem(${item.row})">🔴 Reddet</button>
            <button class="act-btn act-sil" onclick="window.deleteItem(${item.row})">🗑️ Sil</button>
          </div>
        </div>`;
      container.appendChild(card);
    };

    win.voteItem = async function(row: any) {
      const item = win.globalDataList.find((x: any) => x.row == row); if (!item) return;
      const res = await win.apiCall({ action: "vote", row: row, seri: item.seri, userToken: win.getUserToken() });
      if (res && res.success) {
        item.oy = res.votes;
        const c = document.getElementById("vote-cnt-" + row), b = document.getElementById("vote-btn-" + row);
        if(c) c.innerText = res.votes; if(b) b.classList.add("voted");
        localStorage.setItem("mikro_requests_cache", JSON.stringify(win.globalDataList)); win.showToast("👍 Oyunuz eklendi!");
      } else { win.showToast("⚠️ " + (res.message || "Oy verirken sorun oluştu")); }
    };

    win.openEditModal = function(row: any) {
      if (!win.adminPassword) return alert("Admin girişi yapmalısınız!");
      const item = win.globalDataList.find((x: any) => x.row == row); if (!item) return;
      (document.getElementById("editRow") as any).value = item.row;
      (document.getElementById("editOldSeri") as any).value = item.seri;
      (document.getElementById("editTitle") as any).value = item.seri;
      (document.getElementById("editKat") as any).value = item.kat || "Manhwa";
      (document.getElementById("editDurum") as any).value = item.durum || "Beklemede";
      (document.getElementById("editSeriDurum") as any).value = item.seriDurumu || "";
      (document.getElementById("editImg") as any).value = item.resim || "";
      (document.getElementById("editReadLink") as any).value = item.readLink || "";
      (document.getElementById("editLink") as any).value = item.link || "";
      (document.getElementById("editTur") as any).value = item.tur || "Genel";
      win.previewImage(item.resim, 'editPreviewBox', 'editPreviewImg');
      const m = document.getElementById("editModal"); if(m) m.style.display = "flex";
    };

    win.updateStatus = async function(row: any, newStatus: string, customNote = "") {
      if (!win.adminPassword) return alert("Admin girişi yapmalısınız!");
      const item = win.globalDataList.find((x: any) => x.row == row); if (!item) return;
      const res = await win.apiCall({ action: "update", row: row, seri: item.seri, durum: newStatus, link: customNote, passcode: win.adminPassword });
      if (res && res.success) {
        item.durum = newStatus; if (customNote) item.link = customNote;
        localStorage.setItem("mikro_requests_cache", JSON.stringify(win.globalDataList));
        win.renderDataList(win.globalDataList); win.showToast(`✅ Durum "${newStatus}" yapıldı.`);
      } else alert("Hata: " + (res.message || "Güncellenemedi"));
    };

    win.rejectItem = function(row: any) {
      if (!win.adminPassword) return alert("Admin girişi yapmalısınız!");
      const reason = prompt("Reddetme nedenini yazın (İsteğe bağlı):", "Örn: Başka ekip çeviriyor");
      win.updateStatus(row, 'Reddedildi', reason ? "Red Nedeni: " + reason : "");
    };

    win.deleteItem = async function(row: any) {
      if (!win.adminPassword) return alert("Admin girişi yapmalısınız!");
      if (!confirm("Bu isteği silmek istediğinize emin misiniz?")) return;
      
      const item = win.globalDataList.find((x: any) => x.row == row); if (!item) return;
      const res = await win.apiCall({ action: "delete", row: row, seri: item.seri, passcode: win.adminPassword });
      
      if (res && res.success) {
        win.showToast("🗑️ İstek tamamen silindi. Liste yenileniyor...");
        await win.loadData();
      } else {
        alert("Hata: " + (res.message || "Silinemedi"));
      }
    };

    win.setCategoryFilter = function(category: string, el: HTMLElement) {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      if (el) el.classList.add('active');
      win.currentCategoryFilter = category;
      win.filterCards();
    };

    win.setFilter = function(status: string, el: HTMLElement) {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      if (el) el.classList.add('active');
      win.currentStatusFilter = status;
      win.filterCards();
    };

    win.filterCards = function() {
      const qInp = document.getElementById("searchInput") as HTMLInputElement;
      const q = qInp ? win.normalizeText(qInp.value) : "";
      document.querySelectorAll(".series-card").forEach((card: any) => {
        const matchS = win.currentStatusFilter === 'all' || card.getAttribute("data-status") === win.currentStatusFilter;
        const matchC = win.currentCategoryFilter === 'all' || card.getAttribute("data-category") === win.currentCategoryFilter;
        card.style.display = (matchS && matchC && win.normalizeText(card.innerText).includes(q)) ? "flex" : "none";
      });
    };

    win.escapeHTML = function(str: any) {
      return String(str || '').replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
    };

    win.initApp = function() {
      const a = document.getElementById("mikroApp"), b = document.getElementById("adminBtnText");
      if (win.adminPassword) { if(a) a.classList.add("admin-mode-on"); if(b) b.innerText = "Çıkış Yap"; }

      const reqF = document.getElementById("requestForm");
      if (reqF && !(reqF as any)._initialized) {
        (reqF as any)._initialized = true;
        reqF.addEventListener("submit", async function(e) {
          e.preventDefault(); if (win.isSubmitting) return;
          win.isSubmitting = true; const btn = document.getElementById("submitBtn") as HTMLButtonElement; if(btn) { btn.disabled=true; btn.innerText="Gönderiliyor..."; }
          let tags: string[] = []; document.querySelectorAll(".tag-check:checked").forEach((cb: any) => tags.push(cb.value));
          const res = await win.apiCall({
            action: "add", kullanici: (document.getElementById("reqUser") as HTMLInputElement)?.value || "",
            seri: (document.getElementById("reqTitle") as HTMLInputElement)?.value || "", kat: (document.getElementById("reqKat") as HTMLSelectElement)?.value || "Manhwa",
            seriDurumu: (document.getElementById("reqSeriDurum") as HTMLInputElement)?.value || "", resim: (document.getElementById("reqImg") as HTMLInputElement)?.value || "",
            link: (document.getElementById("reqLink") as HTMLInputElement)?.value || "", tur: tags.length > 0 ? tags.join(", ") : "Genel"
          });
          win.isSubmitting = false; if(btn) { btn.disabled = false; btn.innerText = "🚀 Gönder"; }
          if (res && res.success) {
            win.showToast("✨ İstek eklendi!");
            win.closeModal();
            (reqF as HTMLFormElement).reset();
            const prevBox = document.getElementById("previewBox");
            if (prevBox) prevBox.style.display="none";
            await win.loadData();
          }
          else alert("Hata: " + (res.message || "İstek eklenemedi"));
        });
      }

      const editF = document.getElementById("editForm");
      if (editF && !(editF as any)._initialized) {
        (editF as any)._initialized = true;
        editF.addEventListener("submit", async function(e) {
          e.preventDefault(); if (!win.adminPassword) return alert("Admin girişi yapmalısınız!");
          const res = await win.apiCall({
            action: "edit", row: (document.getElementById("editRow") as HTMLInputElement)?.value, oldSeri: (document.getElementById("editOldSeri") as HTMLInputElement)?.value,
            seri: (document.getElementById("editTitle") as HTMLInputElement)?.value, kat: (document.getElementById("editKat") as HTMLSelectElement)?.value, durum: (document.getElementById("editDurum") as HTMLSelectElement)?.value,
            seriDurumu: (document.getElementById("editSeriDurum") as HTMLInputElement)?.value, resim: (document.getElementById("editImg") as HTMLInputElement)?.value, readLink: (document.getElementById("editReadLink") as HTMLInputElement)?.value,
            link: (document.getElementById("editLink") as HTMLInputElement)?.value, tur: (document.getElementById("editTur") as HTMLInputElement)?.value, passcode: win.adminPassword
          });
          if (res && res.success) { win.showToast("💾 Kaydedildi!"); win.closeEditModal(); await win.loadData(); } else alert("Hata: " + (res.message || "Düzenlenemedi"));
        });
      }
      win.initFastLoad();
    };

    win.initApp();
  }, []);

  return (
    <div className="w-full">
      <style>{`
        *, *:before, *:after { box-sizing: border-box; }

        :root {
          --bg-space: #0b0614;
          --card-bg: rgba(23, 13, 41, 0.75);
          --border-glow: #3c1e70;
          --neon-purple: #9d4edd;
          --neon-pink: #f72585;
          --neon-cyan: #4cc9f0;
          --neon-green: #28a745;
          --neon-gold: #ffc107;
          --text-bright: #f1e6ff;
          --text-sub: #a392c1;
        }

        .mikro-wrapper {
          background: var(--bg-space);
          background-image: radial-gradient(circle at 50% 0%, #29104d 0%, #0b0614 80%);
          color: var(--text-bright);
          padding: 20px 15px; border-radius: 20px; font-family: 'Segoe UI', Tahoma, sans-serif;
          border: 1px solid var(--border-glow); box-shadow: 0 0 40px rgba(157, 78, 221, 0.15);
          max-width: 1000px; margin: 0 auto; position: relative; overflow-x: hidden;
        }

        .mikro-header {
          background: linear-gradient(135deg, rgba(60,30,112,0.6), rgba(157,78,221,0.2));
          border: 1px solid var(--border-glow); padding: 25px 15px; border-radius: 16px;
          text-align: center; margin-bottom: 20px; backdrop-filter: blur(10px);
        }
        .mikro-header h2 { margin: 0 0 8px 0; font-size: 1.8rem; color: #fff; text-shadow: 0 0 15px var(--neon-purple); word-break: break-word; }
        .mikro-header p { margin: 0 0 18px 0; color: var(--text-sub); font-size: 0.9rem; line-height: 1.4; }

        .header-btns { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .btn-cosmic {
          background: linear-gradient(135deg, #7b2cbf, #9d4edd); color: #fff; border: none;
          padding: 10px 18px; border-radius: 30px; font-weight: 700; cursor: pointer; transition: 0.3s;
          box-shadow: 0 0 15px rgba(157, 78, 221, 0.4); display: inline-flex; align-items: center; gap: 6px;
          text-decoration: none; font-size: 13px; justify-content: center;
        }
        .btn-cosmic:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(199, 125, 255, 0.7); }
        .btn-cosmic:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
        .btn-admin-login { background: rgba(255,255,255,0.1); border: 1px solid var(--border-glow); }
        .btn-discord { background: linear-gradient(135deg, #5865F2, #7289da); box-shadow: 0 0 15px rgba(88,101,242,0.4); }
        .btn-refresh { background: rgba(76, 201, 240, 0.15); border: 1px solid var(--neon-cyan); color: var(--neon-cyan); }
        
        .admin-indicator {
          display: none; background: rgba(247, 37, 133, 0.2); border: 1px solid var(--neon-pink);
          color: #fff; padding: 8px 12px; border-radius: 15px; font-size: 11px; font-weight: bold;
          margin-top: 12px; text-align: center; align-items: center; justify-content: center; gap: 8px;
        }
        .admin-mode-on .admin-indicator { display: flex; }

        /* DUYURU KUTUSU */
        .notice-box {
          background: rgba(25, 12, 45, 0.85); border: 1px solid var(--neon-purple);
          border-left: 4px solid var(--neon-pink); border-radius: 14px;
          padding: 16px; margin-bottom: 20px; box-shadow: 0 0 20px rgba(157, 78, 221, 0.15);
        }
        .notice-header {
          font-size: 1rem; font-weight: 700; color: var(--neon-pink); margin-bottom: 10px;
          display: flex; align-items: center; gap: 6px; text-shadow: 0 0 8px rgba(247,37,133,0.4);
        }
        .notice-list {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 15px;
          font-size: 11.5px; color: var(--text-bright); line-height: 1.4;
        }
        .notice-item { display: flex; align-items: flex-start; gap: 6px; }
        .notice-item i { color: var(--neon-cyan); margin-top: 2px; flex-shrink: 0; }

        /* KATEGORİ SEKMELERİ */
        .category-tabs {
          display: flex; justify-content: center; gap: 6px; margin-bottom: 15px; flex-wrap: wrap;
          border-bottom: 1px solid var(--border-glow); padding-bottom: 12px;
        }
        .cat-tab {
          background: rgba(15, 8, 28, 0.8); border: 1px solid var(--border-glow);
          color: var(--text-sub); padding: 8px 14px; border-radius: 20px; font-size: 12px;
          font-weight: 700; cursor: pointer; transition: 0.25s; user-select: none;
        }
        .cat-tab:hover, .cat-tab.active {
          background: linear-gradient(135deg, #7b2cbf, #9d4edd); color: #fff;
          border-color: var(--neon-purple); box-shadow: 0 0 12px rgba(157,78,221,0.5);
        }

        /* TREND VİTRİN KARTI */
        .trend-showcase {
          display: none; background: linear-gradient(135deg, rgba(247,37,133,0.15), rgba(157,78,221,0.25));
          border: 2px solid var(--neon-pink); border-radius: 16px; padding: 16px; margin-bottom: 20px;
          box-shadow: 0 0 25px rgba(247, 37, 133, 0.3); position: relative; overflow: hidden;
        }
        .trend-badge-title {
          position: absolute; top: 10px; right: 10px; background: var(--neon-pink);
          color: #fff; font-size: 10px; font-weight: bold; padding: 3px 10px; border-radius: 10px;
          box-shadow: 0 0 10px var(--neon-pink); text-transform: uppercase;
        }
        .trend-content { display: flex; gap: 15px; align-items: center; }
        .trend-img { width: 85px; height: 120px; object-fit: cover; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.6); flex-shrink: 0; }
        .trend-info { flex-grow: 1; min-width: 0; }
        .trend-info h3 { margin: 0 0 6px 0; font-size: 1.2rem; color: #fff; text-shadow: 0 0 10px var(--neon-purple); word-break: break-word; }

        /* Arama ve Filtreler */
        .search-box { position: relative; margin-bottom: 15px; }
        .search-box i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--neon-purple); }
        .search-input {
          width: 100%; padding: 12px 12px 12px 45px; border-radius: 25px;
          background: rgba(15, 8, 28, 0.9); border: 1px solid var(--border-glow);
          color: #fff; font-size: 0.9rem; outline: none; box-sizing: border-box; transition: 0.3s;
        }

        .filter-bar { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
        .filter-chip {
          background: rgba(25, 14, 43, 0.8); border: 1px solid var(--border-glow);
          color: var(--text-sub); padding: 6px 12px; border-radius: 18px; font-size: 11px;
          font-weight: 600; cursor: pointer; transition: 0.2s; user-select: none;
        }
        .filter-chip:hover, .filter-chip.active { background: var(--neon-purple); color: #fff; border-color: var(--neon-purple); }

        /* CARD GRID */
        .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }

        .series-card {
          background: var(--card-bg); border: 1px solid var(--border-glow);
          border-radius: 12px; padding: 12px; display: flex; gap: 12px; align-items: flex-start;
          backdrop-filter: blur(8px); transition: 0.3s; position: relative; overflow: hidden;
        }
        .series-card:hover { border-color: var(--neon-purple); box-shadow: 0 0 15px rgba(157, 78, 221, 0.25); }
        
        .cover-img { width: 75px; height: 110px; object-fit: cover; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.5); flex-shrink: 0; }
        .card-details { flex-grow: 1; min-width: 0; }
        .card-details h4 { margin: 0 0 4px 0; font-size: 1rem; color: #fff; word-break: break-word; line-height: 1.3; }
        .card-meta { font-size: 0.75rem; color: var(--text-sub); margin-bottom: 6px; }

        /* Rozetler */
        .badge { padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; text-transform: uppercase; display: inline-block; white-space: nowrap; flex-shrink: 0; }
        .badge-beklemede { background: rgba(255, 193, 7, 0.15); color: #ffc107; border: 1px solid #ffc107; }
        .badge-incelemede { background: rgba(187, 134, 252, 0.2); color: #c77dff; border: 1px solid #c77dff; }
        .badge-kabul { background: rgba(40, 167, 69, 0.15); color: #28a745; border: 1px solid #28a745; }
        .badge-yapim { background: rgba(76, 201, 240, 0.15); color: var(--neon-cyan); border: 1px solid var(--neon-cyan); }
        .badge-yakin { background: rgba(255, 152, 0, 0.15); color: #ff9800; border: 1px solid #ff9800; }
        .badge-yayin { background: rgba(247, 37, 133, 0.2); color: var(--neon-pink); border: 1px solid var(--neon-pink); }
        .badge-red { background: rgba(220, 53, 69, 0.15); color: #dc3545; border: 1px solid #dc3545; }

        .tag-badge { background: rgba(157, 78, 221, 0.2); color: #d8b4fe; border: 1px solid rgba(157, 78, 221, 0.4); padding: 1px 5px; border-radius: 4px; font-size: 9px; margin-right: 3px; display: inline-block; }
        .tag-18 { background: rgba(247, 37, 133, 0.25); color: var(--neon-pink); border-color: var(--neon-pink); }
        .tag-bl { background: rgba(76, 201, 240, 0.2); color: var(--neon-cyan); border-color: var(--neon-cyan); }

        .note-display-box {
          font-size: 11px;
          color: var(--neon-cyan);
          margin-bottom: 6px;
          line-height: 1.35;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .red-reason-box {
          font-size: 10.5px; color: #ff6b6b; background: rgba(220,53,69,0.15);
          border: 1px solid rgba(220,53,69,0.35); padding: 4px 8px; border-radius: 6px;
          margin-bottom: 6px; font-weight: 600; line-height: 1.3; word-break: break-word;
        }

        .card-action-bar { display: flex; gap: 6px; margin-top: 6px; align-items: center; flex-wrap: wrap; }
        .btn-vote {
          background: rgba(255, 193, 7, 0.15); border: 1px solid var(--neon-gold); color: var(--neon-gold);
          padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.2s;
        }
        .btn-vote:hover, .btn-vote.voted { background: var(--neon-gold); color: #000; }

        .btn-read-now {
          background: linear-gradient(135deg, #28a745, #20c997); color: #fff;
          padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: bold; text-decoration: none;
          display: inline-flex; align-items: center; gap: 3px;
        }

        .admin-tools { display: none; gap: 4px; margin-top: 8px; padding-top: 6px; border-top: 1px dashed var(--border-glow); flex-wrap: wrap; }
        .admin-mode-on .admin-tools { display: flex; }
        .act-btn { padding: 3px 7px; border-radius: 5px; border: none; font-size: 9.5px; font-weight: bold; cursor: pointer; color: #fff; }
        .act-edit { background: #ff9800; }
        .act-inceleme { background: #9d4edd; }
        .act-kabul { background: #28a745; }
        .act-yapim { background: #00b4d8; }
        .act-yakin { background: #ff9800; }
        .act-yayin { background: #f72585; }
        .act-red { background: #dc3545; }
        .act-sil { background: #495057; }

        .modal-overlay {
          display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(7, 3, 14, 0.85); backdrop-filter: blur(8px); z-index: 99999;
          justify-content: center; align-items: center; padding: 12px;
        }
        .modal-box {
          background: #140b24; border: 1px solid var(--border-glow); border-radius: 16px;
          padding: 20px; width: 100%; max-width: 450px; box-shadow: 0 0 30px rgba(157,78,221,0.3);
          position: relative; color: #fff; max-height: 92vh; overflow-y: auto;
        }
        .modal-close { position: absolute; top: 12px; right: 16px; font-size: 20px; cursor: pointer; color: var(--text-sub); }
        
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; font-size: 11.5px; margin-bottom: 4px; color: var(--text-sub); }
        .form-control {
          width: 100%; padding: 10px; border-radius: 8px; background: rgba(8, 4, 15, 0.9);
          border: 1px solid var(--border-glow); color: #fff; box-sizing: border-box; outline: none; font-size: 13px;
        }

        .upload-btn-wrapper { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
        .btn-file-upload {
          background: rgba(157, 78, 221, 0.2); border: 1px dashed var(--neon-purple);
          color: var(--neon-purple); padding: 8px 14px; border-radius: 8px; font-size: 11.5px;
          font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
          transition: 0.2s; width: 100%; justify-content: center;
        }
        .btn-file-upload:hover { background: var(--neon-purple); color: #fff; }
        .upload-status { font-size: 11px; margin-top: 4px; display: none; }

        .tag-select-group { display: flex; flex-wrap: wrap; gap: 5px; }
        .tag-check { display: none; }
        .tag-label {
          padding: 4px 8px; border-radius: 10px; border: 1px solid var(--border-glow);
          font-size: 10px; cursor: pointer; color: var(--text-sub); background: rgba(15,8,28,0.8);
        }
        .tag-check:checked + .tag-label { background: var(--neon-purple); color: #fff; border-color: var(--neon-purple); }

        .duplicate-warning {
          display: none; background: rgba(255,193,7,0.15); border: 1px solid #ffc107;
          color: #ffc107; padding: 6px 10px; border-radius: 6px; font-size: 10.5px; margin-top: 5px;
        }

        .preview-box { text-align: center; margin-top: 8px; display: none; }
        .preview-box img { width: 65px; height: 95px; object-fit: cover; border-radius: 6px; border: 1px solid var(--neon-purple); }

        #toastBox { position: fixed; bottom: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; gap: 8px; }
        .toast {
          background: #1f1038; border: 1px solid var(--neon-purple); color: #fff; padding: 10px 16px;
          border-radius: 8px; font-size: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }

        @media (max-width: 800px) {
          .card-grid { grid-template-columns: 1fr; }
          .notice-list { grid-template-columns: 1fr; }
        }

        @media (max-width: 500px) {
          .mikro-wrapper { padding: 15px 10px; }
          .header-btns { flex-direction: column; width: 100%; }
          .btn-cosmic { width: 100%; }
          .trend-content { flex-direction: column; text-align: center; }
          .trend-badge-title { position: static; display: inline-block; margin-bottom: 10px; }
          .series-card { align-items: flex-start; }
        }
      `}</style>

      <div className="mikro-wrapper" id="mikroApp">

        {/* Header */}
        <div className="mikro-header">
          <h2>✨ Mikrokosmos İstek Havuzu</h2>
          <p>Çevrilmesini istediğiniz serileri bize iletin veya mevcut isteklerin durumunu takip edin!</p>
          <div className="header-btns">
            <button className="btn-cosmic" onClick={() => (window as any).openModal()}><i className="fa-solid fa-paper-plane"></i> Yeni İstek Gönder</button>
            <button className="btn-cosmic btn-refresh" onClick={() => (window as any).forceRefreshData()}><i class="fa-solid fa-rotate-right"></i> Listeyi Yenile</button>
            <a href="https://discord.gg/H4cAsuFSYz" target="_blank" rel="noopener noreferrer" className="btn-cosmic btn-discord"><i className="fa-brands fa-discord"></i> Ekibe Sor (Discord)</a>
            <button className="btn-cosmic btn-admin-login" onClick={() => (window as any).toggleAdmin()}><i className="fa-solid fa-user-shield"></i> <span id="adminBtnText">Admin Girişi</span></button>
          </div>
          <div className="admin-indicator">
            <span>🔑 Yönetici Modu Aktif (Değişiklikleri kartların altından yapabilirsiniz)</span>
          </div>
        </div>

        {/* DUYURU KUTUSU */}
        <div className="notice-box">
          <div className="notice-header">
            <i className="fa-solid fa-circle-info"></i> 📌 Okuyucularımızın Dikkatine (Seri Kabul Kriterlerimiz)
          </div>
          <div className="notice-list">
            <div className="notice-item">
              <i className="fa-solid fa-fire"></i>
              <span><strong>Oy Sayısı:</strong> En çok oy alan seriler en çabuk değerlendirmeye alınır. Oylarda aktif olalım.</span>
            </div>
            <div className="notice-item">
              <i className="fa-solid fa-palette"></i>
              <span><strong>Çizim Kalitesi:</strong> Çizimi profesyonel ve kaliteli olan serilerin alınma olasılığı yüksektir. Çizimi süper olmasa bile konusu çok ilgi çekici serileri tabii ki alıyoruz. Ama lütfen amatör ve ilgi çekmeyen çizimli serileri önermekten kaçının. Gerçekten bazen serinin çizimi yüzünden insan okumak istemiyor.</span>
            </div>
            <div className="notice-item">
              <i className="fa-solid fa-bolt"></i>
              <span><strong>Güncellik:</strong> Kısa, tamamlanmış ve en yeni/güncel serileri de hızlı alıyoruz.Cünki kısa oluyorlar.</span>
            </div>
            <div className="notice-item">
              <i className="fa-solid fa-hands-holding-circle"></i>
              <span><strong>Emeğimiz:</strong> Bir seriyi başka fansubların yapması veya yapmış olması bizi ilgilendirmez; biz kendi emeğimizle istenilen her seriyi yapıyoruz. Bu yüzden bu seri bu fansubda var niye yapıyorsunuz ve ya yeni serileri yapın başka fansubların yaptığı serileri yapmayın cümlelerini ciddiye almıyoruz. </span>
            </div>
            <div className="notice-item">
              <i className="fa-solid fa-book-bookmark"></i>
              <span><strong>Uzun Seriler:</strong> Uzun serilerin tamamlanmış olması bir artıdır. Devam eden uzun bir seri ise çizim ve konusuna ekstra dikkat ediyoruz. Her taraflı 4-4lük bir seriyse uzun olması sorununu kıyak geçiyoruz. </span>
            </div>
            <div className="notice-item">
              <i className="fa-solid fa-book-bookmark"></i>
              <span><strong>İncelemede olan Seriler:</strong> İncelemede olan seriler bizim bile yapmakta kararsız kaldığımız serilerdir. Bu serilerin alınıp alınmayacağına oylara yani isteklere bakılarak karar verilecek.</span>
            </div>
          </div>
        </div>

        {/* KATEGORİ SEKMELERİ */}
        <div className="category-tabs">
          <div className="cat-tab active" onClick={(e) => (window as any).setCategoryFilter('all', e.currentTarget)}>Tüm İstekler</div>
          <div className="cat-tab" onClick={(e) => (window as any).setCategoryFilter('Manhwa', e.currentTarget)}>Manhwa</div>
          <div className="cat-tab" onClick={(e) => (window as any).setCategoryFilter('Novel', e.currentTarget)}>Novel</div>
          <div className="cat-tab" onClick={(e) => (window as any).setCategoryFilter('Manga', e.currentTarget)}>Manga</div>
          <div className="cat-tab" onClick={(e) => (window as any).setCategoryFilter('Manhua', e.currentTarget)}>Manhua</div>
        </div>

        {/* TREND İSTEK VİTRİNİ */}
        <div className="trend-showcase" id="trendShowcase">
          <div className="trend-badge-title">🔥 HAFTANIN TREND İSTEĞİ</div>
          <div className="trend-content" id="trendContent"></div>
        </div>

        {/* Arama ve Durum Filtreleri */}
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input type="text" className="search-input" id="searchInput" onKeyUp={() => (window as any).filterCards()} placeholder="Seri adı veya kullanıcı ara..." />
        </div>

        {/* FİLTRE ÇİPLERİ */}
        <div className="filter-bar">
          <div className="filter-chip active" onClick={(e) => (window as any).setFilter('all', e.currentTarget)}>Tümü</div>
          <div className="filter-chip" onClick={(e) => (window as any).setFilter('beklemede', e.currentTarget)}>Beklemede</div>
          <div className="filter-chip" onClick={(e) => (window as any).setFilter('incelemede', e.currentTarget)}>İncelemede</div>
          <div className="filter-chip" onClick={(e) => (window as any).setFilter('kabul', e.currentTarget)}>Kabul Edildi</div>
          <div className="filter-chip" onClick={(e) => (window as any).setFilter('yapim', e.currentTarget)}>Yapımda</div>
          <div className="filter-chip" onClick={(e) => (window as any).setFilter('yakin', e.currentTarget)}>Yakında</div>
          <div className="filter-chip" onClick={(e) => (window as any).setFilter('yayin', e.currentTarget)}>Yayında</div>
          <div className="filter-chip" onClick={(e) => (window as any).setFilter('red', e.currentTarget)}>Reddedildi</div>
        </div>

        <div id="loadingText" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-sub)' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x"></i><br /><br />Galaksi verileri çekiliyor...
        </div>

        <div className="card-grid" id="cardGrid"></div>

      </div>

      {/* İSTEK MODALI */}
      <div className="modal-overlay" id="requestModal">
        <div className="modal-box">
          <span className="modal-close" onClick={() => (window as any).closeModal()}>✕</span>
          <h3 style={{ margin: '0 0 15px 0', color: 'var(--neon-purple)' }}><i className="fa-solid fa-rocket"></i> Seri İsteğinde Bulun</h3>
          <form id="requestForm">
            <div className="form-group">
              <label>Kullanıcı Adınız:</label>
              <input type="text" className="form-control" id="reqUser" required placeholder="Örn: Starlight" />
            </div>
            <div className="form-group">
              <label>İstediğiniz Seri Adı:</label>
              <input type="text" className="form-control" id="reqTitle" onInput={(e: any) => (window as any).checkDuplicateTitle(e.target.value)} required placeholder="Örn: Solo Leveling" />
              <div className="duplicate-warning" id="duplicateWarning"></div>
            </div>
            <div className="form-group">
              <label>Kategori:</label>
              <select className="form-control" id="reqKat">
                <option value="Manhwa">Manhwa</option>
                <option value="Novel">Novel</option>
                <option value="Manga">Manga</option>
                <option value="Manhua">Manhua</option>
              </select>
            </div>
            <div className="form-group">
              <label>📖 Serinin Orijinal Durumu (İsteğe Bağlı):</label>
              <input type="text" className="form-control" id="reqSeriDurum" placeholder="Örn: Tamamlandı (80 Bölüm), Devam Ediyor vb." />
            </div>
            <div className="form-group">
              <label>Tür / Etiketler (İsteğe Bağlı):</label>
              <div className="tag-select-group">
                <input type="checkbox" id="tag_bl" className="tag-check" value="BL" /><label htmlFor="tag_bl" className="tag-label">BL</label>
                <input type="checkbox" id="tag_gl" className="tag-check" value="GL" /><label htmlFor="tag_gl" className="tag-label">GL</label>
                <input type="checkbox" id="tag_yeni" className="tag-check" value="Yeni Seri" /><label htmlFor="tag_yeni" className="tag-label">Yeni Seri</label>
                <input type="checkbox" id="tag_18" className="tag-check" value="+18" /><label htmlFor="tag_18" className="tag-label">+18</label>
              </div>
            </div>

            <div className="form-group">
              <label>🖼️ Kapak Resmi (Yükleyin veya Link Yapıştırın):</label>
              <div className="upload-btn-wrapper">
                <label htmlFor="reqFileInput" className="btn-file-upload">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Galeriden / Bilgisayardan Fotoğraf Seç
                </label>
                <input type="file" id="reqFileInput" accept="image/*" style={{ display: 'none' }} onChange={(e: any) => (window as any).handleFileUpload(e.target, 'reqImg', 'uploadStatus', 'previewBox', 'previewImg')} />
              </div>
              <div className="upload-status" id="uploadStatus"></div>
              <input type="url" className="form-control" id="reqImg" style={{ marginTop: '6px' }} onInput={(e: any) => (window as any).previewImage(e.target.value, 'previewBox', 'previewImg')} placeholder="Veya doğrudan https://... resim linki yapıştırın" />
              <div className="preview-box" id="previewBox">
                <img id="previewImg" src="" referrerPolicy="no-referrer" alt="Önizleme" />
              </div>
            </div>

            <div className="form-group">
              <label>Not veya Bağlantı (İsteğe Bağlı):</label>
              <input type="text" className="form-control" id="reqLink" placeholder="Örn: Raw linki veya açıklaması" />
            </div>
            <button type="submit" className="btn-cosmic" style={{ width: '100%', justifyContent: 'center' }} id="submitBtn">🚀 Gönder</button>
          </form>
        </div>
      </div>

      {/* ADMIN DÜZENLEME MODALI */}
      <div className="modal-overlay" id="editModal">
        <div className="modal-box">
          <span className="modal-close" onClick={() => (window as any).closeEditModal()}>✕</span>
          <h3 style={{ margin: '0 0 15px 0', color: 'var(--neon-purple)' }}><i className="fa-solid fa-pen-to-square"></i> Seri Bilgilerini Düzenle</h3>
          <form id="editForm">
            <input type="hidden" id="editRow" />
            <input type="hidden" id="editOldSeri" />
            <div className="form-group">
              <label>Seri Adı:</label>
              <input type="text" className="form-control" id="editTitle" required />
            </div>
            <div className="form-group">
              <label>Kategori:</label>
              <select className="form-control" id="editKat">
                <option value="Manhwa">Manhwa</option>
                <option value="Novel">Novel</option>
                <option value="Manga">Manga</option>
                <option value="Manhua">Manhua</option>
              </select>
            </div>
            <div className="form-group">
              <label>Durum:</label>
              <select className="form-control" id="editDurum">
                <option value="Beklemede">Beklemede</option>
                <option value="İncelemede">İncelemede</option>
                <option value="Kabul Edildi">Kabul Edildi</option>
                <option value="Yapımda">Yapımda</option>
                <option value="Yakında">Yakında</option>
                <option value="Yayında!">Yayında!</option>
                <option value="Reddedildi">Reddedildi</option>
              </select>
            </div>
            <div className="form-group">
              <label>📖 Serinin Orijinal Durumu:</label>
              <input type="text" className="form-control" id="editSeriDurum" placeholder="Örn: Tamamlandı (100 Bölüm)" />
            </div>
            <div className="form-group">
              <label>🖼️ Kapak Resmi (Yükleyin veya Değiştirin):</label>
              <div className="upload-btn-wrapper">
                <label htmlFor="editFileInput" className="btn-file-upload">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Yeni Fotoğraf Yükle
                </label>
                <input type="file" id="editFileInput" accept="image/*" style={{ display: 'none' }} onChange={(e: any) => (window as any).handleFileUpload(e.target, 'editImg', 'editUploadStatus', 'editPreviewBox', 'editPreviewImg')} />
              </div>
              <div className="upload-status" id="editUploadStatus"></div>
              <input type="url" className="form-control" id="editImg" style={{ marginTop: '6px' }} onInput={(e: any) => (window as any).previewImage(e.target.value, 'editPreviewBox', 'editPreviewImg')} />
              <div className="preview-box" id="editPreviewBox">
                <img id="editPreviewImg" src="" referrerPolicy="no-referrer" alt="Önizleme" />
              </div>
            </div>
            <div className="form-group">
              <label>📖 Okuma Linki (Yayında Seriler İçin):</label>
              <input type="url" className="form-control" id="editReadLink" placeholder="https://mikrokosmosfb.blogspot.com/..." />
            </div>
            <div className="form-group">
              <label>Not / Bağlantı / ❌ Red Nedeni:</label>
              <input type="text" className="form-control" id="editLink" placeholder="Örn: Red Nedeni: Başka ekip çeviriyor" />
            </div>
            <div className="form-group">
              <label>Tür / Etiketler (Virgülle Ayırın):</label>
              <input type="text" className="form-control" id="editTur" placeholder="BL, Romantizm, +18" />
            </div>
            <button type="submit" className="btn-cosmic" style={{ width: '100%', justifyContent: 'center' }}>💾 Değişiklikleri Kaydet</button>
          </form>
        </div>
      </div>

      <div id="toastBox"></div>
    </div>
  );
};
