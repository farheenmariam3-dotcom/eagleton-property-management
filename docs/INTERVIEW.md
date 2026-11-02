# Explaining EAGLETON in an interview

## The 30-second answer (learn this one by heart)
"EAGLETON is a property-management web app I built for my family's real-estate business. Staff sign in and
manage site visits, plots, finalised sales, loans, registrations and payments. The part I'm proudest of is the
payment statement – it automatically calculates sale consideration, service charges with GST, TDS and the
balance, which used to be done by hand. It has a Node.js backend, a JavaScript front end, secure logins, and I
migrated all the existing data from Google Sheets without re-entering anything."

## The 2-minute walkthrough (say it while pointing at the screen)
1. **Problem:** the office tracked everything in spreadsheets and chats – slow and error-prone.
2. **Users:** my father and the office staff, on laptops and phones.
3. **Architecture:** browser (`public/index.html`) → `POST /api` → `server.js` → `backend/Code.gs` → `data/db.json`.
4. **Example flow:** "When I change a customer's rate and press Save, the browser sends the change to the API.
   The backend checks the login token, validates the number, saves it, and sends back fresh data. The screen
   recalculates sale value = plot area × rate + built-up-area amount."
5. **Hardest part:** moving the data and keeping the calculations identical, and fixing a bug where columns
   shifted after the sheet's structure changed – I made writes depend on column *names*, not positions.

## Questions you will be asked, and honest answers

**What does this do / who uses it?** The 30-second answer above.

**Why did you choose Node.js?** It lets me use JavaScript on both the front end and the back end, and the
server needs no extra libraries, so it is easy to run and deploy.

**How does login work?** Passwords are never stored. Each is salted and hashed with SHA-256 repeated 300 times.
After a correct login the server gives a random token that expires after six hours; every request must carry it.
Five wrong attempts lock the account for 15 minutes.

**Where is the data stored?** In one JSON file (`data/db.json`) – one "table" per tab: customers, plots,
payments and so on. It is fine for an office this size. For many users I would move to PostgreSQL – the rest of
the code would not change much, because all reads and writes go through a few functions.

**How do you stop wrong numbers?** The server validates every amount (digits only, commas and ₹ removed,
no negatives) and recalculates totals itself, so the screen can't save a wrong total.

**What was hard?** Keeping 100% identical calculations while changing the platform, and data migration.
(Tell the real story: column shifting bug, header-based writes.)

**What would you improve?** Automated tests, PostgreSQL, roles (owner/staff permissions), email backups.

**What did you learn?** Full request flow (browser → API → storage), validation, authentication, data
migration, deployment and keeping private data out of GitHub.

## Be honest about how it was built
If asked whether you wrote it alone, say what is true: you designed the requirements from running the real
business, tested every calculation against real deals, directed the design, and used AI assistance for coding.
Interviewers respect that – what they test is whether **you understand it**. So before any interview:

1. Run it locally and click through every page.
2. Open `server.js` (71 lines) and read it top to bottom – you should be able to explain every block.
3. Open `backend/Code.gs` and find the `api` function, `login_`, and the payment maths; read each once.
4. Change something small yourself (a label, a colour in the `:root` block of `index.html`) and see it appear.
5. Practise the 30-second answer and the walkthrough out loud.
6. Be ready to draw the diagram: browser → server → logic → file.

## How you know what each part does
| If they ask about… | Open this file | Say |
|---|---|---|
| "How does the page talk to the server?" | `public/gas-client.js` | It sends the action name, data and login token to `/api` with `fetch`. |
| "Where's the server?" | `server.js` | Serves the pages and routes `/api` calls to the logic. |
| "Where are the rules / calculations?" | `backend/Code.gs` | Validation, sale value, service charge + GST, TDS, payment status, login. |
| "Where's the database?" | `backend/gas-runtime.js`, `data/db.json` | A JSON file written safely after every change. |
| "Where's the design?" | `public/index.html` (top `<style>`) | CSS variables define the green theme; dark mode swaps them. |
| "How did you move the data?" | `tools/Export.gs`, `scripts/import-google-export.js` | Export from Google as JSON, import into the new file. |
