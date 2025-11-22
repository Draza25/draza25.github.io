// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const formidable = require("formidable");

const PORT = 3000;
const TOOLS_DIR = path.join(__dirname, "assets", "mcTools");

const server = http.createServer((req, res) => {
    // --- Servir les fichiers statiques ---
    if (req.method === "GET") {
        let filePath = path.join(__dirname, req.url === "/" ? "HTML/index.html" : req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not Found");
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            let contentType = "text/html";
            if (ext === ".js") contentType = "text/javascript";
            if (ext === ".css") contentType = "text/css";

            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        });
        return;
    }

    // --- Endpoint pour exécuter un outil ---
    if (req.method === "POST" && req.url === "/run-tool") {
        const form = new formidable.IncomingForm({ keepExtensions: true });

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Upload failed: " + err.message }));
                return;
            }

            // --- Récupérer le fichier uploadé ---
            let uploadedFile = files.nbtFile;
            if (Array.isArray(uploadedFile)) uploadedFile = uploadedFile[0];
            if (!uploadedFile) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "No file uploaded" }));
                return;
            }
            const uploadedPath = uploadedFile.filepath;

            // --- Récupérer le script à exécuter ---
            let scriptName = fields.script;
            if (Array.isArray(scriptName)) scriptName = scriptName[0];
            if (!scriptName) {
                fs.unlinkSync(uploadedPath);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "No script specified" }));
                return;
            }

            const scriptPath = path.join(TOOLS_DIR, scriptName);
            if (!fs.existsSync(scriptPath)) {
                fs.unlinkSync(uploadedPath);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Script not found" }));
                return;
            }

            // --- Exécuter le script ---
            exec(`node "${scriptPath}" "${uploadedPath}" "${uploadedFile.originalFilename}"`, (error, stdout, stderr) => {
                fs.unlinkSync(uploadedPath);

                res.writeHead(200, { "Content-Type": "application/json" });

                if (error) {
                    res.end(JSON.stringify({ error: stderr || error.message }));
                    return;
                }

                res.end(JSON.stringify({ output: stdout }));
            });
        });
        return;
    }

    // --- Route non trouvée ---
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
