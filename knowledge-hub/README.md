# knowledge-hub

Interactive **Meridian KB** prototype (`Meridian-KB-prototype.html`).

## Access password

The published page shows a password gate before the prototype.

- Default password: ``
- Unlock is stored in `sessionStorage` for the current browser tab.
- This is **client-side** protection only (the hash is in the page source). It keeps casual visitors out; it is not strong security.

To change the password, update `GATE_PASSWORD_HASH` in `Meridian-KB-prototype.html` to the SHA-256 hex digest of your new password:

```bash
python3 -c "import hashlib; print(hashlib.sha256(b'YOUR_PASSWORD').hexdigest())"
```

## GitHub Pages (Actions)

A workflow deploys the prototype on every push to `main` (and via **Actions → Deploy GitHub Pages → Run workflow**).

### One-time setup

1. Make the repository **public** (or use GitHub Pro/Team for private Pages).
2. Open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main` (or run the workflow manually). The site URL will appear on the workflow run and under **Settings → Pages**.

The workflow copies `Meridian-KB-prototype.html` to `index.html` at the Pages root.
