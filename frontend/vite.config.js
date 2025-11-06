import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true, // ✅ แก้ refresh แล้วหน้าไม่ขาว
  },
});
