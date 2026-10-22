import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { ArrowRight, LogIn, Sun, Moon, ChevronRight } from "lucide-react";

const STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap");
  .lp-root { font-family: "Inter", sans-serif; }

  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-pulse-dot {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74,222,128,.5); }
    50%       { opacity: .7; box-shadow: 0 0 0 6px rgba(74,222,128,0); }
  }

  .lp-a1 { animation: lp-fade-up .6s ease both; }
  .lp-a2 { animation: lp-fade-up .6s .1s ease both; }
  .lp-a3 { animation: lp-fade-up .6s .2s ease both; }
  .lp-a4 { animation: lp-fade-up .6s .3s ease both; }
  .lp-a5 { animation: lp-fade-up .6s .4s ease both; }

  .lp-live {
    display:inline-block; width:7px; height:7px; border-radius:50%;
    background:#4ade80; animation: lp-pulse-dot 2s ease-in-out infinite;
  }
  .lp-btnp {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 26px; border-radius:10px; border:none;
    background:var(--text-primary); color:var(--bg-app);
    font-size:.9rem; font-weight:600; cursor:pointer;
    transition:opacity .2s,transform .15s; white-space:nowrap;
    font-family:inherit;
  }
  .lp-btnp:hover { opacity:.82; transform:translateY(-1px); }
  .lp-btng {
    display:inline-flex; align-items:center; gap:6px;
    padding:13px 22px; border-radius:10px;
    border:1px solid var(--border-default);
    background:transparent; color:var(--text-secondary);
    font-size:.9rem; font-weight:500; cursor:pointer;
    transition:all .2s; white-space:nowrap; font-family:inherit;
  }
  .lp-btng:hover { border-color:var(--border-emphasis); color:var(--text-primary); background:var(--bg-surface); }
  .lp-stat { padding:24px 20px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:14px; transition:border-color .2s,transform .2s; }
  .lp-stat:hover { border-color:var(--border-emphasis); transform:translateY(-2px); }
  .lp-frow { display:flex; align-items:flex-start; gap:14px; padding:20px 0; border-bottom:1px solid var(--border-subtle); }
  .lp-frow:last-child { border-bottom:none; }
  .lp-ficon { width:36px; height:36px; flex-shrink:0; border-radius:8px; background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:center; font-size:1rem; margin-top:2px; }
  .lp-navlnk { background:none; border:none; color:var(--text-secondary); font-size:.875rem; font-weight:450; cursor:pointer; padding:4px 2px; transition:color .15s; font-family:inherit; }
  .lp-navlnk:hover { color:var(--text-primary); }
  .lp-tog { width:36px; height:36px; border-radius:8px; border:1px solid var(--border-default); background:var(--bg-surface-elevated); color:var(--text-secondary); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; }
  .lp-tog:hover { color:var(--text-primary); border-color:var(--border-emphasis); }
  .lp-pill { display:inline-flex; align-items:center; gap:10px; padding:12px 18px; border-radius:12px; border:1px solid var(--border-subtle); background:var(--bg-surface); font-size:.8125rem; font-weight:500; color:var(--text-secondary); transition:all .2s; cursor:default; }
  .lp-pill:hover { border-color:var(--border-emphasis); color:var(--text-primary); background:var(--bg-surface-elevated); }
  .lp-step { display:flex; align-items:center; gap:8px; padding:10px 16px; border-radius:8px; border:1px solid var(--border-subtle); background:var(--bg-surface); white-space:nowrap; flex-shrink:0; }
  .lp-stepn { font-family:monospace; font-size:.65rem; font-weight:700; color:var(--text-tertiary); background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:4px; padding:1px 5px; }
`;

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const toPortal = () => navigate(user ? "/dashboard" : "/login");
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const stats = [
    { val: "2", label: "Program Penempatan", sub: "Tokutei Ginou & Magang" },
    { val: "6", label: "Tahap Pipeline", sub: "Pendaftaran → Keberangkatan" },
    { val: "RT", label: "Realtime Sync", sub: "Cloud Supabase Database" },
  ];

  const programs = [
    { icon: "🎯", name: "Tokutei Ginou (SSW)", ja: "特定技能", dur: "Visa Kerja Spesifik • s/d 5 Tahun" },
    { icon: "🔧", name: "Magang (Ikushei Shuro)", ja: "技能実習", dur: "Pemagangan Industri • 3–5 Tahun" },
  ];

  const features = [
    { icon: "📊", title: "Dashboard Realtime", desc: "Grafik donut statistik pipeline siswa, tersinkronisasi otomatis dari Supabase." },
    { icon: "📁", title: "Manajemen Dokumen", desc: "Lacak status berkas KTP, Paspor, MCU, COE tiap siswa secara terstruktur." },
    { icon: "📤", title: "Ekspor PDF & Excel", desc: "Cetak rekap data siswa lengkap dengan spesifikasi SSW dan riwayat sertifikasi." },
    { icon: "🔐", title: "Audit Trail Aman", desc: "Setiap perubahan tercatat dengan timestamp dan identitas pengguna yang akuntabel." },
  ];

  const steps = ["Pendaftaran","Pelatihan Bahasa","Wawancara","Menunggu Kontrak","Pengurusan COE","Keberangkatan"];

  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-root" style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)", color: "var(--text-primary)", overflowX: "hidden" }}>

        {/* NAVBAR */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: scrolled ? "var(--bg-surface)" : "transparent", borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent", backdropFilter: scrolled ? "blur(16px)" : "none", transition: "all .3s ease" }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 28px", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <img src="/logo.png" alt="BMU" style={{ width: "30px", height: "30px", borderRadius: "7px", objectFit: "contain", backgroundColor: "#fff", padding: "2px", border: "1px solid var(--border-subtle)" }} />
              <span style={{ fontWeight: 700, fontSize: ".9375rem", letterSpacing: "-.02em" }}>Student Hub <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>BMU</span></span>
            </div>
            <nav style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <button className="lp-navlnk" onClick={() => scrollTo("program")}>Program</button>
              <button className="lp-navlnk" onClick={() => scrollTo("fitur")}>Fitur</button>
              <button className="lp-navlnk" onClick={() => scrollTo("profil")}>Tentang</button>
              <div style={{ width: "1px", height: "16px", background: "var(--border-subtle)" }} />
              <button className="lp-tog" onClick={toggleTheme}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button className="lp-btnp" style={{ padding: "9px 18px", fontSize: ".8125rem" }} onClick={toPortal}>
                {user ? "Dashboard" : "Masuk"} <ArrowRight size={14} />
              </button>
            </nav>
          </div>
        </header>

        {/* HERO */}
        <section style={{ maxWidth: "920px", margin: "0 auto", padding: "96px 28px 80px", textAlign: "center" }}>
          <div className="lp-a1" style={{ marginBottom: "28px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 13px", borderRadius: "999px", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: ".03em" }}>
              <span className="lp-live" />
              SISTEM AKTIF • LPK &amp; SO BAHTERA MITRA UNGGULAN
            </span>
          </div>

          <h1 className="lp-a2" style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.035em", margin: 0 }}>
            Pusat Pangkalan Data Siswa<br />
            <span style={{ color: "var(--text-tertiary)", fontWeight: 300 }}>LPK SO Bahtera Mitra Unggulan</span>
          </h1>

          <p className="lp-a3" style={{ marginTop: "22px", fontSize: "clamp(.9rem,2vw,1.0625rem)", color: "var(--text-secondary)", lineHeight: 1.68, maxWidth: "540px", marginLeft: "auto", marginRight: "auto" }}>
            Sistem informasi terintegrasi LPK BMU — pantau progres siswa dari pendaftaran,
            pelatihan bahasa, seleksi kerja, hingga keberangkatan ke Jepang.
          </p>

          <div className="lp-a4" style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "38px", flexWrap: "wrap" }}>
            <button className="lp-btnp" onClick={toPortal}>
              {user ? "Buka Dashboard" : "Masuk ke Portal"} <ArrowRight size={16} />
            </button>
            <button className="lp-btng" onClick={() => scrollTo("fitur")}>
              Pelajari Fitur <ChevronRight size={15} />
            </button>
          </div>

          {/* Stats */}
          <div className="lp-a5" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginTop: "68px" }}>
            {stats.map((s, i) => (
              <div key={i} className="lp-stat" style={{ textAlign: "left" }}>
                <div style={{ fontSize: "clamp(1.75rem,4vw,2.25rem)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontWeight: 600, fontSize: ".8125rem", marginTop: "8px" }}>{s.label}</div>
                <div style={{ fontSize: ".72rem", color: "var(--text-tertiary)", marginTop: "3px" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PROGRAM */}
        <section id="program" style={{ borderTop: "1px solid var(--border-subtle)", padding: "68px 28px" }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto", textAlign: "center" }}>
            {/* Header centered */}
            <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: ".08em", textTransform: "uppercase", margin: "0 0 6px" }}>Program Penempatan</p>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 10px" }}>Dua Jalur Karir ke Jepang</h2>
            <button className="lp-btng" onClick={toPortal} style={{ fontSize: ".8125rem", padding: "9px 18px", marginBottom: "36px" }}>
              Lihat Data Siswa <ArrowRight size={14} />
            </button>

            {/* Pills centered */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "48px", justifyContent: "center" }}>
              {programs.map((p, i) => (
                <div key={i} className="lp-pill">
                  <span style={{ fontSize: "1.25rem" }}>{p.icon}</span>
                  <span style={{ textAlign: "left" }}>
                    <strong style={{ color: "var(--text-primary)", display: "block", fontSize: ".875rem" }}>{p.name}</strong>
                    <span style={{ fontSize: ".7rem", color: "var(--text-tertiary)" }}>{p.dur}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Pipeline centered */}
            <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "16px" }}>Alur Pipeline Siswa</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", overflowX: "auto", padding: "4px 0", scrollbarWidth: "none" }}>
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="lp-step">
                    <span className="lp-stepn">{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: ".8125rem", fontWeight: 500 }}>{step}</span>
                  </div>
                  {i < steps.length - 1 && <ChevronRight size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0, margin: "0 4px" }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* FITUR */}
        <section id="fitur" style={{ borderTop: "1px solid var(--border-subtle)", padding: "68px 28px", background: "var(--bg-surface)" }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>
            <div style={{ position: "sticky", top: "90px" }}>
              <p style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: ".08em", textTransform: "uppercase", margin: 0 }}>Fitur Sistem</p>
              <h2 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-.03em", margin: "8px 0 16px", lineHeight: 1.18 }}>
                Semua yang kamu<br />butuhkan, satu sistem.
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: ".875rem", lineHeight: 1.72, margin: 0, maxWidth: "340px" }}>
                Dirancang untuk pimpinan, staf operasional, dan pengajar LPK BMU agar pengelolaan data siswa lebih efisien dan akuntabel.
              </p>
              <button className="lp-btnp" style={{ marginTop: "28px" }} onClick={toPortal}>
                {user ? "Buka Dashboard" : "Masuk ke Portal"} <ArrowRight size={15} />
              </button>
            </div>
            <div>
              {features.map((f, i) => (
                <div key={i} className="lp-frow">
                  <div className="lp-ficon">{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: "4px" }}>{f.title}</div>
                    <div style={{ fontSize: ".8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT / CTA */}
        <section id="profil" style={{ borderTop: "1px solid var(--border-subtle)", padding: "88px 28px" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
            <img src="/logo.png" alt="BMU" style={{ width: "50px", height: "50px", borderRadius: "12px", objectFit: "contain", backgroundColor: "#fff", padding: "3px", border: "1px solid var(--border-default)", marginBottom: "24px" }} />
            <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.125rem)", fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.2, margin: "0 0 14px" }}>
              LPK &amp; Sending Organization<br />Bahtera Mitra Unggulan
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: ".9375rem", lineHeight: 1.7, margin: "0 0 36px" }}>
              Lembaga resmi pelatihan kerja dan pengiriman tenaga kerja profesional ke Jepang, berkomitmen membentuk SDM berkualitas, berkarakter, dan siap berkarir sukses.
            </p>
            <button className="lp-btnp" onClick={toPortal} style={{ fontSize: ".9375rem" }}>
              <LogIn size={16} />
              {user ? "Buka Dashboard" : "Akses Pangkalan Data"}
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "26px 28px" }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/logo.png" alt="BMU" style={{ width: "22px", height: "22px", borderRadius: "5px", objectFit: "contain", backgroundColor: "#fff", padding: "1px" }} />
              <span style={{ fontSize: ".8125rem", fontWeight: 600 }}>Student Hub BMU</span>
            </div>
            <span style={{ fontSize: ".75rem", color: "var(--text-tertiary)" }}>&copy; {year} LPK Bahtera Mitra Unggulan</span>
          </div>
        </footer>

      </div>
    </>
  );
}
