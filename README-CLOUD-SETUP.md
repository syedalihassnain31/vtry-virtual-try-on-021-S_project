# V-TRY cloud AI setup

This project keeps your original HTML/CSS pages and adds a Node.js backend. It talks to a cloud GPU running ComfyUI. The browser never receives your Hugging Face or cloud API secret.

## Model facts
The selected `ausboss/Qwen-Image-2.1-Outfit-Swap-Consistency-LoRA` is a LoRA adapter, not a ready-made hosted API. Its published workflow requires ComfyUI 0.38+ and AusBoss custom nodes 2.5.1+. It also needs the Qwen Image 2.1 diffusion model, text encoder, VAE and LoRA weights.

Official model: https://huggingface.co/ausboss/Qwen-Image-2.1-Outfit-Swap-Consistency-LoRA
Official workflow: https://huggingface.co/ausboss/Qwen-Image-2.1-Outfit-Swap-Consistency-LoRA/resolve/main/workflows/qwen-image-2.1-outfit-swap.json

## 1. Cloud GPU
Provision a GPU machine with a reachable ComfyUI HTTP service on port 8188 (for example, a RunPod GPU Pod). Install ComfyUI 0.38+, ComfyUI-AusBoss 2.5.1+, the model files listed in the official workflow, and `qwen-image-2.1-outfit-swap.safetensors` under `ComfyUI/models/loras/`. Import the official workflow and test it in ComfyUI first.

The model card specifies person as image 1, outfit as image 2, LoRA strength 1.0, 25 steps, CFG 1, Euler/simple, denoise 1.

## 2. Export API-format workflow
The JSON in the model repository is a ComfyUI UI workflow. This server needs an API prompt graph. Load the official workflow in ComfyUI, then use the API workflow export / Save (API Format) feature. Save the result beside `server.js` as `workflow-api.json`.

## 3. Set node IDs
In `workflow-api.json`, identify the two image input nodes and the final Save Image node. Put their JSON object IDs in `.env` as `PERSON_IMAGE_NODE_ID`, `OUTFIT_IMAGE_NODE_ID`, and `OUTPUT_NODE_ID`. The input nodes must expose `inputs.image`. If the official graph uses a custom image loader or different input names, adapt the two assignments in `server.js` to that node's actual schema.

## 4. Run locally
Install Node.js 20+. In this folder run:

    npm install
    cp .env.example .env

Edit `.env` with the ComfyUI URL and node IDs, then run:

    npm start

Open http://localhost:3000/tryOn.html. Do not open the HTML directly using `file://`.

## 5. Production
Deploy this Node.js app to a backend host and configure the same environment variables in its dashboard. Keep `.env` and credentials private. For public use add authentication, rate limiting, quotas, image retention/deletion policy and a durable asynchronous job queue. This starter keeps one HTTP request open while the model runs and is intended for initial integration/testing.

## Licensing warning
The model repository labels this adapter with the Qwen Research License, and the Qwen Image 2.1 base model has its own license terms. Review both before commercial use or offering paid try-ons. Do not assume research licensing permits commercial deployment.
