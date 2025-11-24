import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { session } = useAuth();

  const [mode, setMode] = useState("signin");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [tipField, setTipField] = useState(null);
  const [tipMsg, setTipMsg] = useState("");

  if (session) return <Navigate to="/" />;

  const isPhoneValid = (v) => {
    const cleaned = v.replace(/[^\d]/g, "");
    return cleaned.length >= 9 && cleaned.length <= 15;
  };

  const resetAlerts = () => {
    setErr("");
    setMsg("");
    setTipField(null);
    setTipMsg("");
  };

  const validatePasswordRules = (pw) => {
    if (!pw || pw.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    if (!/[A-Z]/.test(pw)) return "ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว";
    if (!/[a-z]/.test(pw)) return "ต้องมีตัวอักษรพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว";
    if (!/[0-9]/.test(pw)) return "ต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว";

    // ✅ แก้ไข: เอา \ ออกจาก _\- เป็น _-
    // เครื่องหมาย - ถ้าอยู่ท้ายสุดของ [] ไม่ต้อง escape ครับ
    const allowedSpecial = /[!@#$%^&*_-]/; 
    const forbiddenSpecial = /[<>/"'`]/;

    if (forbiddenSpecial.test(pw)) {
      return 'ห้ามใช้อักขระพิเศษบางตัว เช่น < > " \' ` /';
    }
    if (!allowedSpecial.test(pw)) {
      return "ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว เช่น ! @ # $ % ^ & * _ -";
    }
    return null;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    resetAlerts();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (!isPhoneValid(phone)) return setErr("กรุณากรอกเบอร์โทรให้ถูกต้อง");

    const pwErr = validatePasswordRules(password);
    if (pwErr) {
      setTipField("password");
      setTipMsg(pwErr);
      return;
    }

    if (password !== confirmPw) {
      setTipField("confirmPw");
      setTipMsg("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || undefined, phone: phone || undefined },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) setErr(error.message);
    else {
      setMsg("สมัครสำเร็จ! หากยืนยันอีเมลแล้วสามารถล็อกอินได้เลย ✅");
      setMode("signin");
      setFullName(""); setPhone(""); setEmail(""); setPassword(""); setConfirmPw("");
    }
  };

  const handleGoogle = async () => {
    resetAlerts();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) setErr(error.message);
  };

  return (
    <div style={rootWrap}>
      <div style={card}>
        <h2 style={{ textAlign: "center", marginBottom: 24, color: '#333' }}>
          {mode === "signin" ? "Welcome back 👋" : "Create your account ✨"}
        </h2>

        {msg && <div style={msgOk}>{msg}</div>}
        {err && <div style={msgErr}>{err}</div>}

        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
          {mode === "signup" && (
            <>
              <div style={field}>
                <label style={labelStyle}>Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} required />
              </div>

              <div style={field}>
                <label style={labelStyle}>Phone number</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="08XXXXXXXX" />
              </div>
            </>
          )}

          <div style={field}>
            <label style={labelStyle}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ ...field, position: "relative" }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={() => tipField === "password" && setTipField(null)}
              placeholder="อย่างน้อย 8 ตัว (A-Z, a-z, 0-9, !@#)"
            />
            {tipField === "password" && (
              <div style={tooltipStyle}>{tipMsg}</div>
            )}
          </div>

          {mode === "signup" && (
            <div style={{ ...field, position: "relative" }}>
              <label style={labelStyle}>Re-enter password</label>
              <input
                type="password"
                minLength={8}
                required
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                style={inputStyle}
                onFocus={() => tipField === "confirmPw" && setTipField(null)}
              />
              {tipField === "confirmPw" && (
                <div style={tooltipStyle}>{tipMsg}</div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Processing..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div style={{ textAlign: "center", margin: "16px 0", color: "#aaa", fontSize: "0.9rem" }}>or</div>

        <button onClick={handleGoogle} style={googleBtn}>
           <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{width: 20, marginRight: 8, verticalAlign: 'bottom'}} />
           Sign in with Google
        </button>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.9rem", color: "#666" }}>
          {mode === "signin" ? (
            <>New here? <span style={linkStyle} onClick={() => { resetAlerts(); setMode("signup"); }}>Create an account</span></>
          ) : (
            <>Already have an account? <span style={linkStyle} onClick={() => { resetAlerts(); setMode("signin"); }}>Sign in</span></>
          )}
        </p>
      </div>
    </div>
  );
}

/* Styles */
const rootWrap = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Inter', sans-serif" };
const card = { width: "100%", maxWidth: 420, background: "#fff", padding: "40px 32px", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" };
const field = { marginBottom: 16 };
const labelStyle = { display: "block", marginBottom: 6, fontSize: "0.9rem", fontWeight: 500, color: "#333" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", outline: "none", boxSizing: "border-box" };
const primaryBtn = { width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "1rem", marginTop: 8 };
const googleBtn = { width: "100%", padding: "12px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px", fontWeight: 500, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", color: "#333" };
const msgOk = { background: "#e8fff0", color: "#1b5e20", border: "1px solid #b5f0c8", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: "0.9rem" };
const msgErr = { background: "#ffecef", color: "#b71c1c", border: "1px solid #ffb7c1", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: "0.9rem" };
const linkStyle = { color: "#2563eb", cursor: "pointer", fontWeight: 500, marginLeft: 4 };

const tooltipStyle = {
    position: "absolute", top: "100%", left: 0, marginTop: 4,
    background: "#333", color: "#fff", padding: "6px 10px", borderRadius: 4,
    fontSize: "0.8rem", zIndex: 10, width: "100%"
};