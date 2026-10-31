# North Rim Inc. — northrimbankinc.com

Isolated Supabase backend (separate from the original bank repo). See [docs/setup-isolated-database.md](docs/setup-isolated-database.md).

```bash
cp .env.example .env   # add your new Supabase project keys
npm install
npm run dev
```

Production site: **https://northrimbankinc.com**

## Git

This project is its own repository (separate from `revolut-clone`):

```bash
cd north-rim-bank
git log -1 --oneline
```

To publish a remote:

**GitHub**

```bash
gh auth login
gh repo create north-rim-bank --private --source=. --remote=origin --push
```

**Cursor Origin** (macOS/Linux/WSL — install the `origin` CLI, then `origin repo create north-rim-bank` and add the printed clone URL as `origin`).
