

// read file from pdf
export function readPdfFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        reader.onerror = (err) => {
            reject(err);
        };
        reader.readAsText(file);
    });
}