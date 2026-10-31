# North Rim Inc. — northrimbankinc.com

Isolated Supabase backend (separate from the original bank repo). See [docs/setup-isolated-database.md](docs/setup-isolated-database.md).

```bash
cp .env.example .env   # add your new Supabase project keys
npm install
npm run dev
```

Production site: **https://northrimbankinc.com**

## Git

Remote: **[github.com/milobombe97/northrim](https://github.com/milobombe97/northrim)** (`main`)

```bash
git clone https://github.com/milobombe97/northrim.git
cd northrim
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5190** (North Rim only — do not use port 5173; that is often the older `revolut-clone` / Nevolute app).

There is **no public URL** until you deploy (e.g. Vercel) and connect **northrimbankinc.com**.
