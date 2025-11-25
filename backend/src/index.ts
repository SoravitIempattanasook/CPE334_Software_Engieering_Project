import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { cron } from '@elysiajs/cron'; // 1. import cron
import { Resend } from 'resend';       // 2. import resend
import { createClient } from '@supabase/supabase-js';

// --- Config ---
const supabaseUrl = process.env.SUPABASE_URL || 'ใส่_SUPABASE_URL_ของคุณ';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'ใส่_SERVICE_ROLE_KEY'; // *สำคัญ* ต้องใช้ Service Key เพื่ออ่านข้อมูล User ได้ทุกคน
const resendApiKey = process.env.RESEND_API_KEY || 're_123...'; // ใส่ API Key จาก Resend.com

// --- Init Clients ---
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const app = new Elysia()
    .use(cors())
    // ... (code เดิมของคุณ) ...
    
    // 3. เพิ่ม Cron Job
    .use(
        cron({
            name: 'daily-notify',
            pattern: '0 8 * * *', // รันทุกๆ 8:00 น. ของทุกวัน
            async run() {
                console.log('⏰ Starting Daily Notification Job...');
                
                const today = new Date().toISOString().split('T')[0]; // ได้ค่า YYYY-MM-DD

                // A. ดึงกิจกรรมที่มีวันนี้ (Logic ตัวอย่าง)
                const { data: events } = await supabase
                    .from('Activity') // *ตรวจสอบชื่อ Table ของคุณ*
                    .select('id, name, start_time')
                    .gte('start_time', `${today}T00:00:00`)
                    .lte('start_time', `${today}T23:59:59`);

                if (!events || events.length === 0) {
                    console.log('No events today.');
                    return;
                }

                // B. ดึง User ที่ต้องแจ้งเตือน (ในที่นี้สมมติว่าแจ้งทุกคน หรือต้อง Join Table)
                // ตัวอย่าง: แจ้ง Admin หรือคนที่มี email ในระบบ
                const { data: users } = await supabase.auth.admin.listUsers();

                // C. ส่งอีเมลหาทุกคน
                for (const user of users.users || []) {
                    if (!user.email) continue;

                    // สร้างเนื้อหาอีเมล
                    const eventList = events.map(e => `- ${e.name}`).join('\n');
                    
                    const { error } = await resend.emails.send({
                        from: 'Acitivity Board <onboarding@resend.dev>', // อีเมลผู้ส่ง (ใช้ default ของ Resend ฟรีได้)
                        to: [user.email],
                        subject: `📅 แจ้งเตือนกิจกรรมประจำวันที่ ${today}`,
                        text: `สวัสดีครับ, วันนี้มีกิจกรรมดังนี้:\n\n${eventList}\n\nอย่าลืมเข้าร่วมนะครับ!`,
                    });

                    if (error) console.error('Failed to send to:', user.email, error);
                    else console.log('Sent email to:', user.email);
                }
            }
        })
    )
    // ... (route อื่นๆ) ...
    .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);