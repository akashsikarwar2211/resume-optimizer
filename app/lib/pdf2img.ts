export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: typeof import("pdfjs-dist") | null = null;
let loadPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfJs(): Promise<typeof import("pdfjs-dist")> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    loadPromise = Promise.all([
        import("pdfjs-dist/build/pdf.mjs"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url") // Get matching worker URL
    ]).then(([lib, workerSrc]) => {
        (lib as any).GlobalWorkerOptions.workerSrc = (workerSrc as any).default;
        pdfjsLib = lib;
        return lib;
    });

    return loadPromise;
}


export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (!context) {
            return {
                imageUrl: "",
                file: null,
                error: "Canvas context could not be created",
            };
        }

            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";


        await page.render({ canvasContext: context!, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err : any) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err?.message || err}`,
        };
    }
}