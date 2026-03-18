# Greysteel Unit Walkthrough Tool

A mobile-friendly web app for conducting multifamily unit walkthroughs on-site. Walks inspectors unit by unit through configurable inspection categories, captures notes, photos, and voice notes, and exports everything to Excel.

---

## Deployment — GitHub Pages (step by step)

### Step 1: Create a GitHub account
If you don't have one, go to [github.com](https://github.com) and sign up. It's free.

### Step 2: Create a new repository
1. Click the **+** icon in the top right → **New repository**
2. Name it: `walkthrough` (or anything you like)
3. Set it to **Public**
4. Click **Create repository**

### Step 3: Upload the files
1. On the new repo page, click **uploading an existing file**
2. Drag and drop the entire contents of this folder:
   - `index.html`
   - `app.html`
   - `css/` folder
   - `js/` folder
3. Scroll down, click **Commit changes**

### Step 4: Enable GitHub Pages
1. Go to your repo's **Settings** tab
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Set branch to **main** and folder to **/ (root)**
5. Click **Save**

### Step 5: Access your app
After ~1 minute, your app will be live at:
```
https://YOUR-USERNAME.github.io/walkthrough/
```
GitHub will show you the exact URL in the Pages settings.

---

## Changing the password

The default password is: **greysteel2024**

To change it:

1. Open a browser and go to your deployed site
2. Open the browser console (F12 → Console tab)
3. Run this command, replacing `yournewpassword`:
```javascript
crypto.subtle.digest('SHA-256', new TextEncoder().encode('yournewpassword'))
  .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
```
4. Copy the long string of letters and numbers it outputs
5. Open `js/auth.js` in GitHub (click the file → pencil icon to edit)
6. Find the line that starts with `return hash ===` and replace the hash string with your new one
7. Click **Commit changes**

---

## How to use

1. **Login** — enter the access code at the login screen
2. **Setup** — enter property name, inspector name, date, and unit numbers (one per line). Edit or reorder the inspection categories as needed.
3. **Inspect** — the app walks you through each category for each unit. For each item: select a condition (Good / Fair / Poor / N/A), type notes, add photos, or record a voice note.
4. **Navigate** — use the sidebar to jump to any unit. Progress is auto-saved as a draft in your browser.
5. **Export** — when done, go to the Summary screen and click Export to Excel. You'll get a `.xlsx` file with:
   - **Walkthrough sheet**: one row per unit, condition + notes + photo count per category
   - **Photo Index sheet**: reference list of all photos by unit and category
   - **Summary sheet**: property info and condition breakdown per unit

---

## Notes

- **Photos** are stored in your browser during the session. The Excel export includes a photo count and index — photos themselves are too large to embed in Excel via the browser.
- **Drafts** are auto-saved to browser local storage. If you close the tab and reopen the app, it will offer to restore your session.
- **Voice notes** are captured per category entry and saved in-session, but are not exported to Excel (browser limitation for audio export).
- This is a client-side only app — no data is sent to any server. Everything stays in your browser.

---

## File structure

```
/
├── index.html          Login page
├── app.html            Main application
├── css/
│   └── style.css       All styles
└── js/
    ├── auth.js         Password protection
    └── app.js          Application logic + export
```
