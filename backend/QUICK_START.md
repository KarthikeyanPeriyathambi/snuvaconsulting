# Quick Start Guide - MySQL Backend

## 🚀 Quick Setup (3 Steps)

### Step 1: Start XAMPP
1. Open **XAMPP Control Panel**
2. Click **Start** for MySQL
3. Wait for green "Running" status

### Step 2: Create Database
1. Open browser: `http://localhost/phpmyadmin`
2. Click **New** in left sidebar
3. Database name: `snuva`
4. Click **Create**

### Step 3: Run Seeder & Start Server
```bash
cd backend
node seeder.js
npm run dev
```

## ✅ Success Indicators

You should see:
```
MySQL Connected Successfully
Database tables synchronized
Database tables created successfully!
Admin user created successfully!
2 jobs created successfully!
Data Seeded Successfully!
Server running in development mode on port 5000
```

## 🔑 Default Login

**Email:** admin@example.com  
**Password:** password123

## 📝 What Was Migrated?

✅ **Database:** MongoDB Atlas → MySQL (XAMPP)  
✅ **ORM:** Mongoose → Sequelize  
✅ **Structure:** Document-based → Relational  
✅ **New Feature:** Applications now in separate table  

## 📦 Files You Need

- `backend/.env` - MySQL configuration
- `backend/seeder.js` - Creates tables + sample data

## ⚠️ Troubleshooting

**Can't connect to MySQL?**
- Make sure MySQL is running in XAMPP
- Check `.env` has correct credentials

**Database already exists error?**
- Drop existing database in phpMyAdmin
- Recreate `snuva`

**Seeder fails?**
- Ensure MySQL is running
- Check database exists
- Verify `.env` credentials

## 🎯 Next Steps

1. Test the API endpoints
2. Update frontend if needed (API responses now use `id` instead of `_id`)
3. Deploy with MySQL when ready

---

**Migration Complete!** 🎉

Your backend is now running on MySQL via XAMPP!
