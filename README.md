# Smart Crop Management System

A web application that helps farmers keep a digital record of their crops and
their daily farming activity, instead of maintaining it in a notebook.

A farmer can register, add the crops sown on their land, log every irrigation,
fertilizer application and pest control spray, and see on one dashboard which
crops are growing and which harvest is coming up next. Each crop also shows a
simple estimate of the expected income, the money already spent and the
profit that is left.

---

## Features

- **Register / login** with a session based login and hashed passwords
- **Crop records** — add, view, update and delete a crop
  (name, land area, sowing date, expected harvest date, status)
- **Activity log** — record irrigation, fertilizer and pest control against a
  crop, with the date, cost and a short note
- **Dashboard** — total crops, land under use, crops grouped by status, and
  every harvest due in the next 30 days
- **Search and filter** — search crops by name and filter them by status
- **Yield / cost estimate** (stretch goal) — expected income, total cost and
  estimated profit per crop
- **Light and dark theme** — a switch in the header, remembered in the browser
- **Printable crop report** — the crop page prints as a clean one page summary
  with the activity log and the estimate

Every page only ever shows the crops of the farmer who is logged in.

---

## Tech stack

| Layer | Used |
|---|---|
| Frontend | EJS (server side rendering) + Tailwind CSS |
| Icons | One inline SVG sprite, written by hand |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | Session based (`express-session` + `connect-mongo`, `bcryptjs`) |
| Version control | Git + GitHub |
| Deployment | Render |

---

## Folder structure

```
.
├── server.js            entry point: database, session, middleware, routes
├── seed.js              fills the database with demo data
├── render.yaml          deployment settings for Render
├── models/
│   ├── User.js          the farmer
│   ├── Crop.js          a crop, with its status and estimate numbers
│   └── Activity.js      one farming activity, always linked to a crop
├── middleware/
│   └── auth.js          requireLogin / redirectIfLoggedIn
├── routes/
│   ├── auth.js          register, login, logout
│   ├── dashboard.js     the dashboard page
│   └── crops.js         crop CRUD, search, filter and the activity log
├── views/
│   ├── partials/        header, footer, flash message, status badge
│   ├── crops/           index (list), form (add/edit), show (details)
│   ├── home.ejs  login.ejs  register.ejs  dashboard.ejs  error.ejs
└── public/css/style.css icon drawing style, base styles and the print layout
```

---

## Setup

**1. Install the packages**

```bash
npm install
```

**2. Create a MongoDB Atlas database**

- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a database user and allow access from your IP address
- Copy the connection string, it looks like
  `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smart-crop`

**3. Create the `.env` file**

Copy `.env.example` to `.env` and fill in your own values:

```
MONGO_URI=your-atlas-connection-string
SESSION_SECRET=any-long-random-text
PORT=3000
```

Make sure the connection string ends with a database name before the `?`,
for example `...mongodb.net/smart-crop?retryWrites=true`. Without it the data
goes into a database called `test`.

A good way to create the session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`.env` is listed in `.gitignore`, so the password is never pushed to GitHub.

**4. (Optional) Add demo data**

```bash
npm run seed
```

This creates one farmer with six crops and a few activities:

```
Email:    farmer@demo.com
Password: farmer123
```

**5. Start the server**

```bash
npm start
```

Open <http://localhost:3000> in the browser.
Use `npm run dev` while developing — it restarts the server on every file save.

---

## Routes

| Method | Path | What it does |
|---|---|---|
| GET | `/` | Landing page |
| GET / POST | `/register` | Create a new farmer account |
| GET / POST | `/login` | Login |
| POST | `/logout` | Logout |
| GET | `/dashboard` | Dashboard with the summary |
| GET | `/crops` | Crop list, also handles `?search=` and `?status=` |
| GET / POST | `/crops/new`, `/crops` | Add a crop |
| GET | `/crops/:id` | Crop details, activity log and estimate |
| GET / POST | `/crops/:id/edit`, `/crops/:id/update` | Edit a crop |
| POST | `/crops/:id/delete` | Delete a crop and its activities |
| POST | `/crops/:id/activities` | Log an activity |
| POST | `/crops/:id/activities/:activityId/delete` | Remove an activity |

HTML forms can only send GET and POST, so update and delete are done with a
POST to their own path instead of the PUT and DELETE methods.

---

## Deploying on Render

1. Push the project to GitHub (`.env` stays out of the repository).
2. On [Render](https://render.com), create a **New Web Service** and connect
   the repository. `render.yaml` already sets the build command
   (`npm install`) and the start command (`npm start`).
3. Add **MONGO_URI** in the Render dashboard. **SESSION_SECRET** does not
   need to be typed in, Render generates it from `render.yaml`.
4. In MongoDB Atlas, allow access from anywhere (`0.0.0.0/0`) so that Render
   can reach the database.

The app reads `process.env.PORT`, which Render sets on its own.

---

## How the styling is organised

Tailwind is loaded from its CDN and configured in
`views/partials/header.ejs`. Instead of repeating long class lists on every
element, the classes this project reuses (`.card`, `.btn-primary`, `.input`,
`.badge`, `.empty` and a few more) are written once in a
`@layer components` block in the same file, so the EJS files stay short and
readable.

`views/partials/icons.ejs` holds every icon in one hidden SVG. A page draws one
with `<svg class="icon"><use href="#i-sprout" /></svg>`. Icons are used instead
of emoji because emoji look different on Windows, macOS and Android.

The dark theme uses Tailwind's `class` strategy: a small script in the `<head>`
adds the `dark` class before the page is drawn, so there is no white flash, and
the choice is saved in `localStorage`.

---

## Notes

- Passwords are hashed with bcrypt before being saved, so the database never
  holds a readable password.
- Login sessions are stored in MongoDB with `connect-mongo`, so a farmer stays
  logged in even if the server restarts.
- Every crop query is filtered by the logged in farmer's id, so one farmer can
  never open, edit or delete another farmer's crop.
