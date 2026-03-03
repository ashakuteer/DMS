const http = require('http');
const nodemailer = require('nodemailer');

const PORT = parseInt(process.env.PORT || '5000', 10);
const RELAY_SECRET = process.env.EMAIL_RELAY_SECRET || process.env.SESSION_SECRET;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  tls: { rejectUnauthorized: false },
});

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function respond(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return respond(res, 200, { status: 'ok', smtp: !!SMTP_USER });
  }

  if (req.method === 'POST' && req.url === '/send') {
    const secret = req.headers['x-relay-secret'];
    if (!secret || !RELAY_SECRET || secret !== RELAY_SECRET) {
      return respond(res, 403, { success: false, error: 'Unauthorized' });
    }

    try {
      const body = await parseBody(req);
      if (!body.to || !body.subject) {
        return respond(res, 400, { success: false, error: 'to and subject required' });
      }

      const attachments = [];
      if (body.attachments) {
        for (const att of body.attachments) {
          attachments.push({
            filename: att.filename,
            content: att.encoding === 'base64' ? Buffer.from(att.content, 'base64') : att.content,
            contentType: att.contentType,
          });
        }
      }

      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: body.to,
        subject: body.subject,
        html: body.html,
        text: body.text,
        attachments: attachments.length ? attachments : undefined,
      });

      console.log(`Email sent to ${body.to}: ${info.messageId}`);
      return respond(res, 200, { success: true, messageId: info.messageId });
    } catch (err) {
      console.error('Send error:', err.message);
      return respond(res, 500, { success: false, error: err.message });
    }
  }

  respond(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Email relay running on port ${PORT}`);
  console.log(`SMTP: ${SMTP_HOST}:${SMTP_PORT} user=${SMTP_USER ? SMTP_USER.slice(0, 3) + '***' : 'NOT_SET'}`);
});
