import React from 'react';

export const SocialMediaView: React.FC = () => {
  return (
    <>
      <style>{`
        .mk-social-universe {
          --lila: #d8b4fe;
          --mor: #8b5cf6;
          --koyu: #0b0314;
          --pembe: #f0abfc;

          position: relative;
          min-height: calc(100vh - 80px); /* adjusted for layout headers if any */
          padding: 40px 14px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 20% 15%, #9333ea99, transparent 28%),
            radial-gradient(circle at 80% 25%, #ec489999, transparent 25%),
            radial-gradient(circle at 50% 100%, #7c3aed88, transparent 35%),
            linear-gradient(135deg, #05010a, #16051f 45%, #2a0b45);
          font-family: "Segoe UI", Arial, sans-serif;
          color: white;
          border-radius: 18px;
        }

        .mk-social-universe * {
          box-sizing: border-box;
        }

        .mk-space,
        .mk-space span {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .mk-space::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(#fff 1px, transparent 1.5px),
            radial-gradient(#d8b4fe 1px, transparent 1.5px);
          background-size: 38px 38px, 75px 75px;
          opacity: .5;
          animation: mkStars 22s linear infinite;
        }

        @keyframes mkStars {
          to { transform: translateY(-120px); }
        }

        .mk-space span {
          width: 180px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #fff, transparent);
          opacity: .8;
          transform: rotate(-28deg);
          animation: mkMeteor 5s linear infinite;
        }

        .mk-space span:nth-child(1){ top: 12%; left: -30%; animation-delay: 0s; }
        .mk-space span:nth-child(2){ top: 35%; left: -40%; animation-delay: 1.4s; }
        .mk-space span:nth-child(3){ top: 58%; left: -35%; animation-delay: 2.6s; }
        .mk-space span:nth-child(4){ top: 78%; left: -45%; animation-delay: 3.8s; }
        .mk-space span:nth-child(5){ top: 22%; left: -50%; animation-delay: 4.7s; }

        @keyframes mkMeteor {
          0% { transform: translateX(0) rotate(-28deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translateX(150vw) rotate(-28deg); opacity: 0; }
        }

        .mk-saturn {
          position: absolute;
          width: 135px;
          height: 135px;
          top: 35px;
          right: 22px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 28%, #fff7, transparent 20%),
            linear-gradient(135deg, #f0abfc, #9333ea 58%, #2e1065);
          box-shadow: 0 0 55px #c084fcaa;
          animation: mkFloat 4s ease-in-out infinite;
        }

        .mk-saturn::before {
          content: "";
          position: absolute;
          width: 205px;
          height: 48px;
          border: 4px solid #f5d0fe;
          border-left-color: transparent;
          border-right-color: transparent;
          border-radius: 50%;
          top: 42px;
          left: -35px;
          transform: rotate(-17deg);
          box-shadow: 0 0 22px #e879f9;
        }

        .mk-moon {
          position: absolute;
          width: 70px;
          height: 70px;
          left: 24px;
          bottom: 42px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #ffffff, #c084fc 45%, #6b21a8);
          box-shadow: 0 0 35px #e9d5ff99;
          opacity: .75;
          animation: mkFloat 5.5s ease-in-out infinite reverse;
        }

        @keyframes mkFloat {
          50% { transform: translateY(-16px); }
        }

        .mk-panel {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 470px;
          padding: 34px 20px 26px;
          border-radius: 34px;
          text-align: center;
          background:
            linear-gradient(145deg, rgba(255,255,255,.22), rgba(255,255,255,.06));
          border: 1px solid rgba(255,255,255,.28);
          box-shadow:
            0 0 0 1px rgba(216,180,254,.18),
            0 35px 90px rgba(0,0,0,.55),
            inset 0 0 35px rgba(216,180,254,.08);
          backdrop-filter: blur(20px);
        }

        .mk-panel::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 36px;
          padding: 2px;
          background: linear-gradient(135deg, #f0abfc, #8b5cf6, #38bdf8, #f0abfc);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: mkBorder 4s linear infinite;
          pointer-events: none;
        }

        @keyframes mkBorder {
          50% { filter: hue-rotate(70deg); }
        }

        .mk-top-orbit {
          width: 112px;
          height: 112px;
          margin: 0 auto 14px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 2px dashed #e9d5ff;
          box-shadow: 0 0 45px #a855f7;
          animation: mkSpin 12s linear infinite;
        }

        .mk-core {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 36px;
          font-weight: 900;
          color: #fff;
          background: radial-gradient(circle at 30% 25%, #fff8, transparent 24%),
                      linear-gradient(135deg, #ec4899, #8b5cf6);
          box-shadow: 0 0 30px #f0abfc;
          animation: mkSpinReverse 12s linear infinite;
        }

        @keyframes mkSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes mkSpinReverse {
          to { transform: rotate(-360deg); }
        }

        .mk-panel h1 {
          margin: 0;
          font-size: 38px;
          letter-spacing: 1.5px;
          color: #f5d0fe;
          text-shadow:
            0 0 10px #c084fc,
            0 0 28px #a855f7;
        }

        .mk-sub {
          margin: 8px 0 25px;
          color: #f3e8ff;
          font-size: 14px;
        }

        .mk-links {
          display: grid;
          gap: 14px;
        }

        .mk-link {
          position: relative;
          overflow: hidden;
          display: block;
          padding: 16px 18px;
          border-radius: 21px;
          text-decoration: none;
          text-align: left;
          color: white !important;
          background: rgba(255,255,255,.1);
          border: 1px solid rgba(255,255,255,.18);
          transition: .28s ease;
        }

        .mk-link::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,.26), transparent);
          transform: translateX(-120%);
          transition: .5s;
        }

        .mk-link:hover::before {
          transform: translateX(120%);
        }

        .mk-link:hover {
          transform: translateY(-5px) scale(1.025);
          box-shadow: 0 18px 38px rgba(216,180,254,.25);
        }

        .mk-link b {
          display: block;
          font-size: 18px;
          margin-bottom: 4px;
        }

        .mk-link small {
          color: #f3e8ff;
          font-size: 12.5px;
        }

        .dc { background: linear-gradient(135deg, rgba(88,101,242,.45), rgba(139,92,246,.18)); }
        .ig { background: linear-gradient(135deg, rgba(236,72,153,.45), rgba(249,115,22,.18)); }
        .wa { background: linear-gradient(135deg, rgba(34,197,94,.38), rgba(20,184,166,.16)); }
        .tt { background: linear-gradient(135deg, rgba(15,23,42,.65), rgba(168,85,247,.22)); }
        .site { background: linear-gradient(135deg, rgba(192,132,252,.45), rgba(59,130,246,.18)); }

        .mk-note {
          margin: 24px 0 0;
          font-size: 13px;
          color: #f5d0fe;
          opacity: .95;
        }

        @media (max-width: 480px) {
          .mk-social-universe {
            padding: 28px 12px;
            align-items: flex-start;
          }

          .mk-panel {
            margin-top: 35px;
            padding: 30px 15px 24px;
            border-radius: 28px;
          }

          .mk-panel h1 {
            font-size: 33px;
          }

          .mk-saturn {
            width: 82px;
            height: 82px;
            right: 8px;
            top: 16px;
          }

          .mk-saturn::before {
            width: 128px;
            height: 32px;
            top: 26px;
            left: -23px;
            border-width: 3px;
          }

          .mk-moon {
            width: 48px;
            height: 48px;
            left: 12px;
            bottom: 20px;
          }
        }
      `}</style>
      
      <div className="mk-social-universe max-w-[1200px] mx-auto w-full my-4">
        <div className="mk-space">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <div className="mk-saturn"></div>
        <div className="mk-moon"></div>

        <section className="mk-panel">
          <div className="mk-top-orbit">
            <div className="mk-core">M</div>
          </div>

          <h1>Mikrokosmos FB</h1>
          <p className="mk-sub">Galaksimizin Sosyal Medya Hesapları</p>

          <div className="mk-links">
            <a href="https://discord.gg/53p43EW3jk" target="_blank" rel="noopener noreferrer" className="mk-link dc">
              <b>Discord</b><small>Aramıza sen de katıl.</small>
            </a>

            <a href="https://www.instagram.com/mikrokosmos.fb?igsh=MTVnd3Y2NzQzbnc0Mw==" target="_blank" rel="noopener noreferrer" className="mk-link ig">
              <b>Instagram</b><small>Duyurular ve paylaşımlar</small>
            </a>

            <a href="https://whatsapp.com/channel/0029Vb7tIun8fewqhUTTUH13" target="_blank" rel="noopener noreferrer" className="mk-link wa">
              <b>WhatsApp</b><small>Bildirim kanalımız</small>
            </a>

            <a href="https://www.tiktok.com/@mikrokosmosfansub?_r=1&_t=ZS-96bHCpcZhCO" target="_blank" rel="noopener noreferrer" className="mk-link tt">
              <b>TikTok</b><small>Kısa içerikler</small>
            </a>

            <a href="https://mikrokosmosfblink.blogspot.com/?m=0" target="_blank" rel="noopener noreferrer" className="mk-link site">
              <b>Yedek Site</b><small>Alternatif giriş bağlantısı</small>
            </a>
          </div>

          <p className="mk-note">✦ Mikrokosmos Fansub evrenine hoş geldin ✦</p>
        </section>
      </div>
    </>
  );
};
