# Your step-by-step guide

Follow the steps in order. Every command goes in the VS Code terminal (**Terminal → New Terminal**).

---

## 0. What you are making

EAGLETON is a **web application** for a real-estate office. People open it in a browser, sign in, and manage
site visits, plots, finalised sales, loans, registrations and payments.

A web app always has two halves, and yours has both:

| Half | What it is | Your files |
|---|---|---|
| **Frontend** ("what you see") | The screens, buttons, tables and colours that run in the browser | `public/index.html`, `public/gas-client.js`, `public/img/*` |
| **Backend** ("what thinks and remembers") | Checks the login, does the calculations, saves the data | `server.js`, `backend/Code.gs`, `backend/gas-runtime.js` |
| **Database** | Where the data is stored | `data/db.json` (one file) |

How one click travels: **you click Save → the browser sends it to `/api` → `server.js` receives it →
`Code.gs` checks you are logged in, validates and calculates → the result is saved in `data/db.json` →
the answer goes back and the screen updates.**

### What every file does

| File | Purpose |
|---|---|
| `server.js` | The web server (about 70 lines). Hands out the pages and receives `/api` calls. |
| `backend/Code.gs` | **All business rules**: sale value = area × rate + B U A, service charge and GST, TDS, payment status, login and passwords. This is your original code, unchanged, so the calculations are identical. |
| `backend/gas-runtime.js` | Lets `Code.gs` (written for Google) run on your own computer and keeps the data in `data/db.json`. |
| `public/index.html` | The whole interface: pages, tables, forms, the logo, the splash screen and the green theme. |
| `public/gas-client.js` | Tiny bridge so the screen talks to your server. |
| `scripts/import-google-export.js` | Copies your old data into the new app. |
| `scripts/upload-to-server.js` | Sends that data to the live website once. |
| `tools/Export.gs` | Goes into your **Google** project to export the data. |
| `package.json` | The project's name and the `npm start` command. |
| `render.yaml`, `.env.example`, `.gitignore` | Hosting settings, example settings, and a list of things that must never go to GitHub. |

---

## 1. Install the tools (once)

1. **VS Code** – https://code.visualstudio.com
2. **Node.js** (LTS, version 20.12 or newer) – https://nodejs.org. Check: `node -v`
3. **Git** – https://git-scm.com. Check: `git --version`
4. A free **GitHub** account – https://github.com

## 2. Put the project in your folder

You said you made an empty folder already. Unzip `eagleton-pm.zip` and **copy everything inside the
`eagleton-pm` folder into your empty folder**, keeping the sub-folders exactly as they are
(the files are very large – `index.html` alone is about 90 KB – so copying is safer than retyping).
Then in VS Code: **File → Open Folder…** and choose your folder. You should see:

```
server.js  package.json  README.md  GUIDE.md  render.yaml  .env.example  .gitignore
backend/    Code.gs  gas-runtime.js
public/     index.html  gas-client.js  img/
scripts/    import-google-export.js  upload-to-server.js
tools/      Export.gs
docs/       (screenshots)
data/       (empty)
```

## 3. Run it on your computer

```
npm start
```
Open **http://localhost:3000**. The terminal prints an **office access code** – you need it on "Create account".
(To choose your own code: rename `.env.example` to `.env` and edit `SIGNUP_CODE`.)
Stop the server with **Ctrl + C**.

## 4. Bring over ALL your existing data

Your real data is in the Google Sheet behind the current app. This copies **everything** – customers, plots,
payments, loans, registrations, follow-ups, tasks, activity log and the **accounts (same email + password)**.
Nothing is changed in your live app; this only reads.

1. Open your Google **Apps Script** project (Extensions → Apps Script from the sheet).
2. Click **+ next to Files → Script**, name it `Export`, and paste the whole of `tools/Export.gs`.
3. Choose the function **exportEagletonData** at the top and press **Run**. Allow the permission it asks for
   (it needs Google Drive to save the file).
4. Open https://drive.google.com – a file **eagleton-export.json** is there. **Download** it.
5. Put it in your project's `data` folder, so the path is `data/eagleton-export.json`.
6. In the terminal run:
   ```
   npm run import
   npm start
   ```
7. Sign in at http://localhost:3000 with **your usual email and password**.

**Check it matches**: open the same customer in the old app and the new one, side by side – the plot, rate,
sale value, service charges, payments and balance must be identical. (They use the same calculation code.)

> `data/eagleton-export.json` and `data/db.json` hold real client details. `.gitignore` keeps them off GitHub –
> never remove those lines.

## 5. Put it on GitHub (your portfolio)

1. On github.com click **New repository**. Name: `eagleton-property-management`. Keep it **Public**,
   leave "Add a README" **unticked**. Create it.
2. In the VS Code terminal:
   ```
   git init
   git add .
   git status
   ```
   **Look at the list.** It must NOT contain `data/db.json`, `data/eagleton-export.json` or `.env`.
   If you see any, stop and ask me.
3. Then:
   ```
   git commit -m "EAGLETON property management app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/eagleton-property-management.git
   git push -u origin main
   ```
   (GitHub asks you to sign in the first time.)
4. On the repo page: click the ⚙ next to **About** → add the description *"Property management web app for a
   real-estate office – sales, plots, payments, loans & registrations"* and topics
   `nodejs` `javascript` `property-management` `real-estate` `crm`.
5. The screenshots in `docs/` use **made-up demo customers**, so the README is safe to show publicly.

## 6. Publish it so your dad only needs a link

Your data is a file, so the website must be hosted somewhere that **keeps files** (a persistent disk).
Free hosts erase files whenever they restart, which would delete your data – so use a small paid plan.
**Render** is the easiest (about US$7–8 a month; check render.com/pricing).

1. Make a Render account at https://render.com and connect GitHub.
2. **New + → Blueprint** → pick your `eagleton-property-management` repo → it reads `render.yaml`
   (a web service plus a 1 GB disk).
3. When asked, fill in **SIGNUP_CODE** (your private office code). Click **Apply**. After a few minutes
   you get a link like `https://eagleton.onrender.com`.
4. **Upload your old data once.** In Render open the service → **Environment** → add
   `ADMIN_KEY` = a long random password (12+ characters), save, wait for it to redeploy. Then on your
   computer, in the terminal:
   ```
   ADMIN_KEY=your-long-password npm run upload -- https://eagleton.onrender.com
   ```
   (On Windows PowerShell: `$env:ADMIN_KEY="your-long-password"; npm run upload -- https://eagleton.onrender.com`)
   It prints how many customers, plots and payments went across. The site restarts by itself.
5. **Delete `ADMIN_KEY`** from Render's Environment tab so nobody can ever use that door again.
6. Open the link, sign in with your usual email and password, and check a customer. 
7. Send your dad the link. On his phone: open it → browser menu → **Add to Home screen** and it sits on his
   screen like an app. He signs in with his existing account (or "Create account" using your code).

**Backups:** every week download `/var/data/db.json` from Render (Shell tab) or re-run the Google export –
a live business should always have a copy.

**Want it free instead?** Your dad can keep using the original Google link. The new site is the one you show
on GitHub/LinkedIn; use demo data there if you do not want client names online.

## 7. LinkedIn

See `docs/LINKEDIN.md` for the Projects entry, a ready-to-post update and a CV line.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| `'node' is not recognized` | Install Node.js, then close and reopen VS Code |
| `Cannot find data/eagleton-export.json` | The file is not in the `data` folder, or has another name |
| "Invalid email or password" after import | Use the same email/password as the old app; check the Accounts rows exported |
| Port already in use | Another copy is running – press Ctrl+C in that terminal, or set `PORT=3001` in `.env` |
| Page looks old after an update | Hard refresh: **Ctrl + Shift + R** |
