# Free open-source try-on (Hugging Face Space, IDM-VTON)

1. `npm install` (already done if node_modules exists)
2. Optional: create a free token at https://huggingface.co/settings/tokens and put it in `.env` as `HF_TOKEN=...` (more free GPU quota).
3. Make sure `.env` has `TRYON_PROVIDER=huggingface` (this is the default).
4. `npm start`, then open http://localhost:3000/tryOn.html

Notes: the free Space may queue or sleep (first request can take 1-3 minutes). IDM-VTON is licensed CC BY-NC-SA 4.0 (non-commercial: fine for a university project). Use a clear, front-facing full or half-body photo and a flat garment image.
