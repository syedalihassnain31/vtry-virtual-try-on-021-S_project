require("dotenv").config();
const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { hfTryOn } = require("./hf-provider");
const PROVIDER = (process.env.TRYON_PROVIDER || "huggingface").toLowerCase();
const app = express();
const PORT = process.env.PORT || 3000;
const COMFY_URL = (process.env.COMFYUI_URL || "").replace(/\/$/, "");
const COMFY_API_KEY = process.env.COMFYUI_API_KEY || "";
const WORKFLOW_PATH = path.join(__dirname, "workflow-api.json");
const upload = multer({ dest: path.join(__dirname, "tmp"), limits: { fileSize: 12*1024*1024 }, fileFilter: (req,file,cb) => {
 const ok = ["image/jpeg","image/png","image/webp"].includes(file.mimetype);
 cb(ok ? null : new Error("Only JPG, PNG and WEBP images are allowed."), ok);
}});
app.use(express.static(__dirname));
const authHeaders = () => COMFY_API_KEY ? { Authorization: `Bearer ${COMFY_API_KEY}` } : {};
async function uploadImage(filePath, originalName) {
 const form = new FormData(); form.append("image",fs.createReadStream(filePath),{filename:path.basename(originalName)}); form.append("type","input"); form.append("overwrite","true");
 const r = await axios.post(`${COMFY_URL}/upload/image`,form,{headers:{...authHeaders(),...form.getHeaders()},maxBodyLength:Infinity,maxContentLength:Infinity});
 return r.data.name;
}
function envId(k){if(!process.env[k]) throw new Error(`Missing ${k} in .env.`);return process.env[k];}
async function waitForImage(promptId){
 const start=Date.now();
 while(Date.now()-start<8*60*1000){
  await new Promise(r=>setTimeout(r,2500));
  const r=await fetch(`${COMFY_URL}/history/${promptId}`,{headers:authHeaders()}); if(!r.ok) continue;
  const h=await r.json(), job=h[promptId]; if(!job) continue;
  if(job.status?.status_str==="error" || job.status?.messages?.some(m=>m[0]==="execution_error")) throw new Error("ComfyUI workflow failed. Check the cloud worker logs.");
  const images=job.outputs?.[envId("OUTPUT_NODE_ID")]?.images||[];
  if(images.length) return images[0];
  if(job.status?.completed) throw new Error("No output image. Check OUTPUT_NODE_ID and the Save Image node.");
 }
 throw new Error("AI generation timed out. Try again or inspect the cloud GPU.");
}
app.post("/api/try-on",upload.fields([{name:"personImage",maxCount:1},{name:"clothesImage",maxCount:1}]),async(req,res)=>{
 const temp=(req.files?.personImage||[]).concat(req.files?.clothesImage||[]).map(f=>f.path);
 try{
  if(PROVIDER==="huggingface"){
   const p=req.files?.personImage?.[0], o=req.files?.clothesImage?.[0];
   if(!p||!o) return res.status(400).json({error:"Both images are required."});
   return res.json({image:await hfTryOn(p,o)});
  }
  if(!COMFY_URL) throw new Error("Cloud AI is not configured. Set COMFYUI_URL in .env.");
  if(!fs.existsSync(WORKFLOW_PATH)) throw new Error("workflow-api.json is missing. Export your ComfyUI workflow in API format.");
  const person=req.files?.personImage?.[0], outfit=req.files?.clothesImage?.[0]; if(!person||!outfit) return res.status(400).json({error:"Both images are required."});
  const [personName,outfitName]=await Promise.all([uploadImage(person.path,person.originalname),uploadImage(outfit.path,outfit.originalname)]);
  const workflow=JSON.parse(fs.readFileSync(WORKFLOW_PATH,"utf8"));
  const pn=envId("PERSON_IMAGE_NODE_ID"), on=envId("OUTFIT_IMAGE_NODE_ID");
  if(!workflow[pn]?.inputs || !workflow[on]?.inputs) throw new Error("Image node IDs do not match workflow-api.json. Check your .env IDs.");
  workflow[pn].inputs.image=personName; workflow[on].inputs.image=outfitName;
  const r=await fetch(`${COMFY_URL}/prompt`,{method:"POST",headers:{"Content-Type":"application/json",...authHeaders()},body:JSON.stringify({prompt:workflow})});
  const d=await r.json(); if(!r.ok||d.error||!d.prompt_id) throw new Error(d.error?.message||"ComfyUI rejected the workflow. Check models and custom nodes.");
  const image=await waitForImage(d.prompt_id);
  const u=new URL(`${COMFY_URL}/view`);u.searchParams.set("filename",image.filename);u.searchParams.set("subfolder",image.subfolder||"");u.searchParams.set("type",image.type||"output");
  const ir=await fetch(u,{headers:authHeaders()});if(!ir.ok) throw new Error("Could not retrieve the generated image.");
  const b=Buffer.from(await ir.arrayBuffer()),mime=ir.headers.get("content-type")||"image/png";
  res.json({image:`data:${mime};base64,${b.toString("base64")}`});
 }catch(e){console.error(e);res.status(500).json({error:e.message||"Unexpected server error."});}
 finally{temp.forEach(f=>{if(fs.existsSync(f))fs.unlinkSync(f);});}
});
app.use((e,req,res,next)=>res.status(e instanceof multer.MulterError&&e.code==="LIMIT_FILE_SIZE"?413:400).json({error:e.message||"Invalid upload."}));
app.listen(PORT,()=>console.log(`V-TRY at http://localhost:${PORT}`));
