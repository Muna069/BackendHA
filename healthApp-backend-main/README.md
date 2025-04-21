# 🚀 Node.js, Express.js, and MongoDB Backend Setup

This guide provides **step-by-step instructions** to set up and run a **Node.js backend** using **Express.js** and **MongoDB Atlas**.  
It includes **JWT authentication**, **Cloudinary for media storage**, **Google AI API integration**, and **deployment on Railway** for **cron job support**.

---

## 📌 Environment Variables

Create a `.env` file in the root directory and add the following variables:

```md
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GOOGLE_AI_API_KEY=your_google_ai_api_key
```

💡 **Notes:**
- `JWT_SECRET` can be **any random string** (e.g., `mystrongsecret`).
- `PORT` is set to `5000` but can be changed.

---

## 🛠 Project Setup & Running Locally

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/your-repo-name.git
cd your-repo-name
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Run the Server
- Using **Node.js**:  
  ```sh
  npm start
  ```
- Using **Nodemon** (for auto-restart on file changes):  
  ```sh
  nodemon start
  ```

---

## ☁️ Setting Up MongoDB Atlas (Cloud Database)

MongoDB Atlas is a cloud-based database service.

### **Steps to Set Up MongoDB Atlas**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and **Sign Up**.
2. Click **Create a Cluster** and choose the **free/shared tier**.
3. Under **Database Deployment**, click **Connect** → **Connect your application**.
4. Copy the **MongoDB URI** (should look like this):
   ```bash
   mongodb+srv://username:password@cluster.mongodb.net/mydatabase?retryWrites=true&w=majority
   ```
5. Replace `username`, `password`, and `mydatabase` in your `.env` file.

---
### **Add this to the MongoDB Database users to create an admin with username "admin" and password "admin"**

```md
  {
  "_id": {
    "$oid": "67e7957e6ecb6022f028f4d9"
  },
  "username": "admin",
  "password": "$2b$10$ct9FoA3jZDNqNpsyQd0Su..YPACs9JZVlxY9j4rGy59fyq/T04eFK",
  "isVerified": true,
  "isUser": true,
  "isAdmin": true
    }
  ```

## 🌥 Setting Up Cloudinary for Image Uploads

Cloudinary allows you to store and manage images in the cloud.

### **Steps to Set Up Cloudinary**
1. Go to [Cloudinary](https://cloudinary.com/) and **Sign Up**.
2. After logging in, go to **Dashboard** and find:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Copy and paste them into your `.env` file.

---

## 🤖 Getting Google AI API Key

Google AI API allows you to integrate AI-powered features like image processing and text recognition.

### **Steps to Get Google AI API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. **Create a new project**.
3. In the search bar, type **Google AI APIs** and enable the API.
4. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **API Key**.
5. Copy the API Key and add it to `.env` as:

   ```env
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

---

## 🚀 Deploying on Railway (For Cron Job Support)

Railway is a **free hosting platform** that supports cron jobs and auto-deploys.

### **Steps to Deploy on Railway**
#### 1️⃣ Sign Up & Create a New Project
1. Go to [Railway.app](https://railway.app/) and **Sign Up**.
2. Click **New Project** → **Deploy from GitHub**.
3. Select your **backend repository**.

#### 2️⃣ Add Environment Variables
- After deploying, go to **Project Settings** → **Environment Variables**.
- Add all variables from your `.env` file.

#### 3️⃣ Deploy & Get Backend URL
- Click **Deploy Now**.
- Once deployed, Railway provides a **backend domain (URL)**.
- Use this domain for API requests in your frontend.

---

## 🔥 Final Notes
✅ Your backend is now **set up and deployed**! 🎉  
For debugging on Railway, check logs with:

```sh
railway logs
```

If you encounter issues, refer to the documentation on [MongoDB Atlas](https://www.mongodb.com/atlas/database), [Cloudinary](https://cloudinary.com/), [Google Cloud](https://console.cloud.google.com/), or [Railway](https://docs.railway.app/).

---

