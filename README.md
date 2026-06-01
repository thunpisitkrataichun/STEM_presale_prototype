# STEM Presale Prototype — Python Model Setup

คู่มือการสร้าง virtual environment และติดตั้ง dependencies สำหรับโมดูล Python (XGBoost RUL Model)

---

## โครงสร้างโฟลเดอร์

```
STEM_PRESALE_PROTOTYPE/
├── model/
│   ├── requirements.txt   ← รายการ packages
│   ├── src/               ← Python scripts (train, export weights)
│   ├── data/              ← CSV datasets
│   └── venv/              ← Virtual environment (ไม่ต้อง commit)
└── stem_prototype_project/
    └── ...                ← React + Vite dashboard
```

---

## Requirements

- Python **3.12** (ตรวจสอบด้วย `python --version`)
- pip (มาพร้อม Python)

---

## Setup (ครั้งแรก)

### 1. เปิด Terminal แล้วเข้าไปที่โฟลเดอร์ `model/`

```bash
cd "C:\University\Fujitsu Work\STEM\STEM_presale_prototype\model"
```

### 2. สร้าง Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

**Windows (Command Prompt)**
```bash
venv\Scripts\activate
```

**Windows (PowerShell)**
```powershell
venv\Scripts\Activate.ps1
```

**Mac / Linux**
```bash
source venv/bin/activate
```

> เมื่อ activate สำเร็จ จะเห็น `(venv)` ขึ้นต้น prompt

### 4. ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

---

## ใช้งานทุกครั้ง (Daily Use)

ทุกครั้งที่เปิด terminal ใหม่ ต้อง activate ก่อนเสมอ

```bash
cd "C:\University\Fujitsu Work\STEM\STEM_presale_prototype\model"
venv\Scripts\activate
```

---

## Deactivate

เมื่อเลิกใช้งาน

```bash
deactivate
```

---

## Packages ที่ติดตั้ง

| Package | Version | การใช้งาน |
|---|---|---|
| xgboost | 2.0.3 | XGBoost Regressor สำหรับ RUL prediction |
| scikit-learn | 1.4.0 | Train/test split, metrics |
| pandas | 2.2.0 | อ่านและจัดการ CSV datasets |
| numpy | 1.26.0 | Matrix operations |
| scipy | (latest) | Statistical utilities |

---

## Troubleshooting

**PowerShell บอกว่า script ถูก block**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**ติดตั้ง package ไม่ได้ / pip error**
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**venv หาย หรือต้องการสร้างใหม่**
```bash
# ลบโฟลเดอร์ venv เดิมก่อน แล้วรัน setup ใหม่ตั้งแต่ขั้นตอนที่ 2
```

---

## หมายเหตุ

- โฟลเดอร์ `venv/` ไม่ควร commit ขึ้น Git (เพิ่มใน `.gitignore` แล้ว)
- ไฟล์ `requirements.txt` ต้อง commit เพื่อให้ทีมติดตั้งได้เหมือนกัน
- โฟลเดอร์ `stem_prototype_project/` (React) ใช้ Node.js แยกต่างหาก ดู `package.json`


# STEM Presale Prototype — React Dashboard Setup

คู่มือการติดตั้งและ build React + Vite dashboard สำหรับ STEM/Isuzu Predictive Maintenance Demo

---

## โครงสร้างโฟลเดอร์

```
STEM_PRESALE_PROTOTYPE/
├── model/                        ← Python (XGBoost) — ดู README.md
└── stem_prototype_project/       ← React Dashboard (ที่นี่)
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── components/
    │   ├── pages/
    │   └── utils/
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    ├── data/                     ← CSV files วางที่นี่
    ├── dist/                     ← Build output (ส่ง client)
    ├── package.json
    └── vite.config.ts
```

---

## Requirements

- **Node.js v18+** — ตรวจสอบด้วย `node --version`
- **npm v9+** — ตรวจสอบด้วย `npm --version`

> ดาวน์โหลด Node.js ได้ที่ https://nodejs.org (แนะนำ LTS)

---

## Setup (ครั้งแรก)

### 1. เปิด Terminal แล้วเข้าไปที่โฟลเดอร์ `stem_prototype_project/`

### 2. ติดตั้ง Dependencies

```bash
npm install
```

> จะสร้างโฟลเดอร์ `node_modules/` ขึ้นมา ใช้เวลาสักครู่

---

## Development Mode (รัน local)

```bash
npm run dev
```

เปิด browser ที่ **http://localhost:5173**

ทุกครั้งที่แก้ไขไฟล์ หน้าจะ reload อัตโนมัติ (Hot Module Replacement)

---

## Build สำหรับส่ง STEM

```bash
npm run build
```

ผลลัพธ์จะอยู่ในโฟลเดอร์ `dist/` ประกอบด้วย

```
dist/
├── index.html
├── favicon.svg
├── icons.svg
└── assets/
    └── index-xxxxxx.js    ← JavaScript ทั้งหมด bundle รวมไฟล์เดียว
```

### ทดสอบ build ก่อนส่ง

```bash
npm run preview
```

เปิด browser ที่ **http://localhost:4173** เพื่อดู production build

---

## วิธีส่ง Client (Offline Package)

1. รัน `npm run build`
2. Copy โฟลเดอร์ `dist/` และโฟลเดอร์ `data/` ออกมารวมกัน

```
ส่ง client/
├── dist/          ← จาก npm run build
│   ├── index.html
│   └── assets/
└── data/          ← CSV files
    ├── sensor_readings.csv
    ├── maintenance_logs.csv
    ├── quality_inspection.csv
    └── production_logs.csv
```

3. Client ดับเบิลคลิก `dist/index.html` → ใช้งานได้ทันที **ไม่ต้องติดตั้งอะไร**

> ⚠️ ต้องเปิดผ่าน browser (Chrome/Edge) ไม่ใช่ Internet Explorer

---

## Scripts ทั้งหมด

| คำสั่ง | การใช้งาน |
|---|---|
| `npm install` | ติดตั้ง packages (ครั้งแรก) |
| `npm run dev` | รัน development server |
| `npm run build` | Build สำหรับ production |
| `npm run preview` | Preview production build |
| `npm run lint` | ตรวจสอบ code quality |

---

## Tech Stack

| Technology | Version | การใช้งาน |
|---|---|---|
| React | 18 | UI Framework |
| TypeScript | 5 | Type safety |
| Vite | latest | Build tool + Dev server |
| Tailwind CSS | - | Styling |
---

## Troubleshooting

**`npm install` ช้ามาก หรือ error**
```bash
# ลบ cache แล้วลองใหม่
npm cache clean --force
npm install
```

**Port 5173 ถูกใช้งานอยู่แล้ว**
```bash
# ระบุ port อื่น
npm run dev -- --port 3000
```

**`node_modules` หายหรือ error แปลก ๆ**
```bash
# ลบแล้วติดตั้งใหม่
rmdir /s /q node_modules
npm install
```

**dist/index.html เปิดแล้วหน้าว่าง (blank page)**

ให้ตรวจสอบ `vite.config.ts` ว่ามี `base: './'` แล้ว
```ts
export default defineConfig({
  base: './',
  // ...
})
```

---

## หมายเหตุ

- โฟลเดอร์ `node_modules/` และ `dist/` ไม่ควร commit ขึ้น Git (เพิ่มใน `.gitignore` แล้ว)
- ไฟล์ `package.json` และ `package-lock.json` ต้อง commit เพื่อให้ทีมติดตั้งได้เหมือนกัน
- โฟลเดอร์ `model/` (Python) ใช้ venv แยกต่างหาก ดู `model/README.md`