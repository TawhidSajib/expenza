import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase, getDatabase, getDbStatus, isDbConnected } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory OTP storage fallback
interface OtpEntry {
  otp: string;
  name: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpEntry>();

// Initialize database on startup
connectToDatabase().catch(() => {});

// Database health check & status
app.get('/api/db-status', (req, res) => {
  res.json(getDbStatus());
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store in memory
    otpStore.set(cleanNumber, {
      otp,
      name: name || 'User',
      expiresAt,
      attempts: 0,
    });

    // Store in MongoDB if connected
    const db = getDatabase();
    if (db && isDbConnected()) {
      try {
        await db.collection('otps').updateOne(
          { phoneNumber: cleanNumber },
          {
            $set: {
              phoneNumber: cleanNumber,
              otp,
              name: name || 'User',
              expiresAt,
              attempts: 0,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (dbErr) {
        console.warn('[MongoDB] Could not persist OTP in DB:', dbErr);
      }
    }

    let smsSent = false;
    let smsProvider = 'preview';
    let providerError = '';

    // 1. Try Twilio if credentials are set
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioAuth && twilioFrom) {
      try {
        const body = new URLSearchParams({
          To: cleanNumber,
          From: twilioFrom,
          Body: `Your Expenza verification code is ${otp}. Valid for 5 minutes.`,
        });

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          }
        );

        if (twilioRes.ok) {
          smsSent = true;
          smsProvider = 'twilio';
        } else {
          const errData = (await twilioRes.json()) as any;
          providerError = errData.message || 'Twilio send failed';
        }
      } catch (err: any) {
        providerError = err.message || 'Twilio error';
      }
    }

    // 2. Try TextBelt SMS gateway if Twilio was not used or failed
    if (!smsSent) {
      try {
        const textbeltKey = process.env.TEXTBELT_KEY || 'textbelt';
        const tbRes = await fetch('https://textbelt.com/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanNumber,
            message: `Your Expenza verification code is ${otp}. Valid for 5 minutes.`,
            key: textbeltKey,
          }),
        });
        const tbData = (await tbRes.json()) as any;
        if (tbData.success) {
          smsSent = true;
          smsProvider = 'textbelt';
        } else {
          providerError = tbData.error || providerError;
        }
      } catch (err: any) {
        providerError = err.message || providerError;
      }
    }

    return res.json({
      success: true,
      phoneNumber: cleanNumber,
      smsSent,
      smsProvider,
      providerError: providerError || undefined,
      code: otp,
      message: smsSent
        ? `SMS successfully dispatched to ${cleanNumber}`
        : `OTP generated for ${cleanNumber}`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp, name } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    let matchedOtp = false;
    let fallbackName = name || 'User';

    // Check memory store
    const memEntry = otpStore.get(cleanNumber);
    if (memEntry) {
      if (Date.now() <= memEntry.expiresAt && memEntry.otp === otp.trim()) {
        matchedOtp = true;
        fallbackName = memEntry.name;
        otpStore.delete(cleanNumber);
      }
    }

    // Check MongoDB store if not matched yet
    const db = getDatabase();
    if (!matchedOtp && db && isDbConnected()) {
      try {
        const dbEntry = await db.collection('otps').findOne({ phoneNumber: cleanNumber });
        if (dbEntry && Date.now() <= dbEntry.expiresAt && dbEntry.otp === otp.trim()) {
          matchedOtp = true;
          fallbackName = dbEntry.name || fallbackName;
          await db.collection('otps').deleteOne({ phoneNumber: cleanNumber });
        }
      } catch (err) {
        console.warn('[MongoDB] OTP check error:', err);
      }
    }

    if (!matchedOtp) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // User lookup or creation in MongoDB
    let userData: any = {
      id: `usr_${Date.now()}`,
      name: name || fallbackName,
      mobile: cleanNumber,
      currency: '$',
      createdAt: new Date().toISOString(),
      monthlyBudget: 2500,
    };

    if (db && isDbConnected()) {
      try {
        const existing = await db.collection('users').findOne({ mobile: cleanNumber });
        if (existing) {
          userData = {
            id: existing.id || existing._id.toString(),
            name: existing.name || name || fallbackName,
            mobile: existing.mobile,
            currency: existing.currency || '$',
            createdAt: existing.createdAt || new Date().toISOString(),
            monthlyBudget: existing.monthlyBudget || 2500,
          };
        } else {
          await db.collection('users').insertOne({
            ...userData,
            _id: undefined,
            createdAt: new Date(),
          });
        }
      } catch (dbErr) {
        console.warn('[MongoDB] User persistence error:', dbErr);
      }
    }

    return res.json({
      success: true,
      verified: true,
      user: userData,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
});

// Fetch user data (Categories & Expenses) from MongoDB
app.get('/api/user-data', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDatabase();
    if (!db || !isDbConnected()) {
      return res.json({
        fromMongo: false,
        categories: [],
        expenses: [],
      });
    }

    const categories = await db
      .collection('categories')
      .find({ userId: String(userId) }, { projection: { _id: 0 } })
      .toArray();

    const expenses = await db
      .collection('expenses')
      .find({ userId: String(userId) }, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray();

    const userDoc = await db
      .collection('users')
      .findOne({ id: String(userId) }, { projection: { _id: 0 } });

    return res.json({
      fromMongo: true,
      categories,
      expenses,
      user: userDoc || undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch user data' });
  }
});

// Sync user data to MongoDB
app.post('/api/sync', async (req, res) => {
  try {
    const { userId, categories, expenses, user } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDatabase();
    if (!db || !isDbConnected()) {
      return res.json({
        synced: false,
        reason: 'MongoDB is not connected. Saved in local storage.',
      });
    }

    // 1. Sync User Profile
    if (user) {
      await db.collection('users').updateOne(
        { id: String(userId) },
        {
          $set: {
            id: String(userId),
            name: user.name,
            mobile: user.mobile,
            currency: user.currency,
            monthlyBudget: user.monthlyBudget,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    // 2. Sync Categories
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        await db.collection('categories').updateOne(
          { id: cat.id, userId: String(userId) },
          { $set: { ...cat, userId: String(userId), updatedAt: new Date() } },
          { upsert: true }
        );
      }
    }

    // 3. Sync Expenses
    if (Array.isArray(expenses)) {
      for (const exp of expenses) {
        await db.collection('expenses').updateOne(
          { id: exp.id, userId: String(userId) },
          { $set: { ...exp, userId: String(userId), updatedAt: new Date() } },
          { upsert: true }
        );
      }
    }

    return res.json({
      synced: true,
      categoryCount: categories?.length || 0,
      expenseCount: expenses?.length || 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// Add / Upsert single Category
app.post('/api/categories', async (req, res) => {
  try {
    const category = req.body;
    const db = getDatabase();
    if (db && isDbConnected() && category?.id && category?.userId) {
      await db.collection('categories').updateOne(
        { id: category.id, userId: category.userId },
        { $set: { ...category, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    return res.json({ success: true, category });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete single Category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const db = getDatabase();
    if (db && isDbConnected() && id && userId) {
      await db.collection('categories').deleteOne({ id, userId: String(userId) });
    }
    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Add / Upsert single Expense
app.post('/api/expenses', async (req, res) => {
  try {
    const expense = req.body;
    const db = getDatabase();
    if (db && isDbConnected() && expense?.id && expense?.userId) {
      await db.collection('expenses').updateOne(
        { id: expense.id, userId: expense.userId },
        { $set: { ...expense, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    return res.json({ success: true, expense });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete single Expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const db = getDatabase();
    if (db && isDbConnected() && id && userId) {
      await db.collection('expenses').deleteOne({ id, userId: String(userId) });
    }
    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Setup Vite middlewares in development or serve static in production
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Expenza full-stack server running on port ${PORT}`);
});
