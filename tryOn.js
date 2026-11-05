const personInput = document.getElementById("personImage");
const clothesInput = document.getElementById("clothesImage");
const personPreview = document.getElementById("personPreview");
const clothesPreview = document.getElementById("clothesPreview");
const personPlaceholder = document.getElementById("personPlaceholder");
const clothesPlaceholder = document.getElementById("clothesPlaceholder");
const generateBtn = document.getElementById("generateBtn");
const message = document.getElementById("message");
const resultPanel = document.getElementById("resultPanel");
const resultImage = document.getElementById("resultImage");
const downloadResult = document.getElementById("downloadResult");

function previewFile(input, image, placeholder) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        message.textContent = "Please choose a JPG, PNG, or WEBP image.";
        input.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = () => { image.src = reader.result; image.hidden = false; placeholder.hidden = true; };
    reader.readAsDataURL(file);
}
personInput.addEventListener("change", () => previewFile(personInput, personPreview, personPlaceholder));
clothesInput.addEventListener("change", () => previewFile(clothesInput, clothesPreview, clothesPlaceholder));

generateBtn.addEventListener("click", async () => {
    const person = personInput.files[0];
    const outfit = clothesInput.files[0];
    if (!person || !outfit) { message.textContent = "Please upload both your photo and a clothing image."; return; }
    const formData = new FormData();
    formData.append("personImage", person);
    formData.append("clothesImage", outfit);
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    message.textContent = "Sending images to the AI service. This can take a few minutes.";
    resultPanel.hidden = true;
    try {
        const response = await fetch("/api/try-on", { method: "POST", body: formData });
        const type = response.headers.get("content-type") || "";
        const data = type.includes("application/json") ? await response.json() : { error: await response.text() };
        if (!response.ok) throw new Error(data.error || "The try-on request failed.");
        resultImage.src = data.image;
        downloadResult.href = data.image;
        resultPanel.hidden = false;
        message.textContent = "Your virtual try-on is ready!";
    } catch (error) {
        message.textContent = error.message || "Something went wrong. Please try again.";
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate Try-On";
    }
});
