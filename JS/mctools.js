function hideAll() {
    //document.getElementById("monElement").style.display = "none"
    //document.querySelector(".maClasse").style.display = "none"

    //base show
    document.getElementById("toolsBaseText").style.display = "flex"

    //mmMultiblock hide
    document.querySelector(".mmMultiblock").style.display = "none"
    document.getElementById("fileLabel").style.display = "none"
    document.getElementById("fileName").style.display = "none"
    document.getElementById("output").style.display = "none"
    document.getElementById("copyBtn").style.display = "none"

}

function mmMultiblock() {
    //base hide
    document.getElementById("toolsBaseText").style.display = "none"
    //mmMultiblock show
    document.querySelector(".mmMultiblock").style.display = "flex"
    document.getElementById("fileLabel").style.display = "flex"
    document.getElementById("fileName").style.display = "flex"
    document.getElementById("output").style.display = "flex"
    document.getElementById("copyBtn").style.display = "flex"

}
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("nbtFile");
    const fileNameSpan = document.getElementById("fileName");
    const output = document.getElementById("output");

    fileInput.addEventListener("change", async () => {
        if (!fileInput.files.length) return;

        const file = fileInput.files[0];
        fileNameSpan.textContent = file.name;

        const formData = new FormData();
        formData.append("nbtFile", file);
        formData.append("script", "mmMultiblock/convert.js");

        try {
            const res = await fetch("/run-tool", { method: "POST", body: formData });
            const data = await res.json();
            output.textContent = data.output || data.error || "No output";
        } catch (err) {
            output.textContent = "Error: " + err;
        }
    });

    document.getElementById("copyBtn").addEventListener("click", () => {
        const output = document.getElementById("output");
        output.select();
        output.setSelectionRange(0, 99999);

        try {
            document.execCommand("copy");
            //alert("Script copié dans le presse-papiers !");
        } catch (err) {
            alert("Impossible de copier le script : " + err);
        }
    });
});



