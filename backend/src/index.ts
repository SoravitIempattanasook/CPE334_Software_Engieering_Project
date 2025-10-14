import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { cors } from '@elysiajs/cors';

// อ่านค่า JWT Secret จาก environment variable
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseJwtSecret) {
    console.error("SUPABASE_JWT_SECRET is not set in environment variables.");
    process.exit(1);
}

const app = new Elysia()
    // ใช้งาน CORS เพื่อให้ frontend (localhost:5173) เรียก API ได้
    .use(cors({
        origin: 'http://localhost:5173', // อนุญาตเฉพาะ origin นี้
        credentials: true,
    }))
    // ใช้งาน JWT plugin
    .use(
        jwt({
            name: 'jwt',
            secret: supabaseJwtSecret, // ใช้ secret จาก Supabase
        })
    )
    // Middleware สำหรับตรวจสอบ Token ใน Header
    .derive(async ({ jwt, headers }) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { user: null };
        }
        
        const token = authHeader.substring(7); // ตัดคำว่า "Bearer " ออก
        const userPayload = await jwt.verify(token);

        return {
            user: userPayload || null
        };
    })
    // Route ทั่วไปที่ไม่ต้องการการยืนยันตัวตน
    .get('/', () => 'Hello from Elysia Backend!')
    // Protected Route
    .get('/api/protected', ({ user, set }) => {
        if (!user) {
            set.status = 401; // Unauthorized
            return { error: 'Authentication required' };
        }
        
        return {
            message: 'This is a protected message.',
            userId: user.sub, // 'sub' คือ user ID ใน JWT payload ของ Supabase
            email: user.email,
        };
    })
    .listen(3000);

console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);