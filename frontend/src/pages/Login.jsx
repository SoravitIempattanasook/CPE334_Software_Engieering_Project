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

    const allowedSpecial = /[!@#$%^&*_\-]/;
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
      setMsg("สมัครสำเร็จ! โปรดยืนยันอีเมลเพื่อเข้าสู่ระบบ ✅");
      setMode("signin");
      setFullName(""); setPhone(""); setEmail(""); setPassword(""); setConfirmPw("");
    }
  };

  // ✅ Google Login แบบเลือกบัญชีทุกครั้ง
  const handleGoogle = async () => {
    resetAlerts();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: "select_account",   // 💥 บังคับ Google แสดงหน้าต่างเลือกบัญชีทุกครั้ง
          hd: "kmutt.ac.th",          // 🎯 ให้แนะนำโดเมนมหาลัย (เป็น hint)
        },
      },
    });

    if (error) setErr(error.message);
  };

  return (
    <div style={rootWrap}>
      <div style={card}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          {mode === "signin" ? "Welcome back 👋" : "Create your account ✨"}
        </h2>

        {msg && <div style={msgOk}>{msg}</div>}
        {err && <div style={msgErr}>{err}</div>}

        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
          {mode === "signup" && (
            <>
              <div style={field}>
                <label>Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
              </div>

              <div style={field}>
                <label>Phone number</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          <div style={field}>
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ ...field, position: "relative" }}>
            <label>Password</label>
            <input
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={() => tipField === "password" && setTipField(null)}
              placeholder="อย่างน้อย 8 ตัว (A-Z, a-z, 0-9, และ !@#$%^&*_-)"
            />
            {tipField === "password" && (
              <div className="tooltip tooltip-top-left">{tipMsg}</div>
            )}
          </div>

          {mode === "signup" && (
            <div style={{ ...field, position: "relative" }}>
              <label>Re-enter password</label>
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
                <div className="tooltip tooltip-top-left">{tipMsg}</div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? "Processing..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div style={{ textAlign: "center", margin: "16px 0", color: "#aaa" }}>or</div>

        <button onClick={handleGoogle} style={googleBtn}>
          Sign in with KMUTT Account
        </button>

        <p style={{ textAlign: "center", marginTop: 16 }}>
          {mode === "signin" ? (
            <>New here? <a href="#" onClick={() => { resetAlerts(); setMode("signup"); }}>Create an account</a></>
          ) : (
            <>Already have an account? <a href="#" onClick={() => { resetAlerts(); setMode("signin"); }}>Sign in</a></>
          )}
        </p>
      </div>
    </div>
  );
}

/* Styles */
const rootWrap = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f7f8fa" };
const card = { width: "100%", maxWidth: 420, background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" };
const field = { marginBottom: 12 };
const inputStyle = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" };
const primaryBtn = { width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" };
const googleBtn = { width: "100%", padding: "12px", background: "#fff", border: "1px solid #ccc", borderRadius: "8px", fontWeight: 600, cursor: "pointer" };
const msgOk = { background: "#e8fff0", border: "1px solid #b5f0c8", padding: 10, borderRadius: 8, marginBottom: 12 };
const msgErr = { background: "#ffecef", border: "1px solid #ffb7c1", padding: 10, borderRadius: 8, marginBottom: 12 };
