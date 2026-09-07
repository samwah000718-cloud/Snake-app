# Nationsormen 🐍

Vite + React-app: en inloggningsskärm (lösenord "nation", inget användarnamn/lösenord i vanlig mening) följt av ett Snake-spel som pågår i totalt 10 minuter.

## Kör lokalt

Kräver Node.js 18+.

```bash
npm install
npm run dev
```

Öppna länken som Vite skriver ut (oftast http://localhost:5173).

Bygg för produktion:

```bash
npm run build
```

Detta skapar en `dist/`-mapp med statiska filer (HTML/CSS/JS) — det är den mappen som ska laddas upp till AWS.

## Driftsätta på AWS

Appen är en ren statisk site (ingen backend), så det enklaste och billigaste sättet är **S3 + CloudFront**, eller **AWS Amplify Hosting** om ni vill ha CI/CD från ett Git-repo.

### Alternativ A: AWS Amplify Hosting (enklast, med CI/CD)

1. Pusha projektet till ett Git-repo (GitHub/GitLab/Bitbucket/CodeCommit).
2. Gå till **AWS Amplify** i konsolen → **New app** → **Host web app**.
3. Koppla repot och branchen ni vill driftsätta.
4. Amplify känner av Vite automatiskt. Om ni behöver ange det manuellt:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Klicka **Save and deploy**. Amplify bygger och ger er en `https://...amplifyapp.com`-URL direkt, samt möjlighet att koppla en egen domän.

### Alternativ B: S3 + CloudFront (manuellt, full kontroll)

1. Bygg appen lokalt:
   ```bash
   npm run build
   ```
2. Skapa en S3-bucket (t.ex. `nationsormen-app`), i valfri region.
3. Ladda upp innehållet i `dist/` till bucketen:
   ```bash
   aws s3 sync dist/ s3://nationsormen-app --delete
   ```
4. Skapa en **CloudFront-distribution** med bucketen som origin (använd gärna en Origin Access Control så bucketen inte behöver vara publik).
5. Sätt **Default root object** till `index.html`.
6. Lägg till en **Error page**-regel: 403/404 → `/index.html` med statuskod 200 (behövs för klientroutning, blir extra viktigt om ni bygger ut appen med fler sidor senare).
7. (Valfritt) Koppla egen domän via Route 53 + ACM-certifikat på CloudFront-distributionen.

Vill ni automatisera detta kan ni lägga steg 3–6 i en GitHub Actions-workflow som körs vid varje push till main.

## Anpassa

- **Lösenordet**: byts i `src/components/Login.jsx`, raden med `value.trim().toLowerCase() === 'nation'`.
- **Speltid**: `SESSION_SECONDS` i `src/components/SnakeGame.jsx` (just nu `10 * 60`).
- **Färger/typsnitt**: `src/App.css`, samt Google Fonts-länken i `index.html`.
