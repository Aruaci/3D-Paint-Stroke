// Select elements from the DOM
const uploadImage = document.getElementById('uploadImage');
const penBtn = document.getElementById('enable-pen-btn');
const eraserBtn = document.getElementById('enable-eraser-btn');
const brushSizeObj = document.getElementById('brush-size');
const canvas = document.getElementById('imageCanvas');
const refCanvas = document.getElementById('refImageCanvas');
const ctx = canvas.getContext('2d');
const refCtx = refCanvas.getContext('2d');

const brushImage = './static/brush1.png';

// Create pattern and use it for drawing
brushImage.onload = () => {
    const pattern = ctx.createPattern(brushImage, 'repeat');
    ctx.strokeStyle = pattern;
};

let brushSize = parseInt(brushSizeObj.value, 10); // Initialize with the slider value
let image = new Image();
let isImageLoaded = false;
let isDrawing = false;
let isEraserEnabled = false;
let strokePoints = [];
let averageColor = 'red'; // Default color for the preview

// Function to set canvas size based on image dimensions
function fitCanvasToImage(img) {
    const canvasHeight = canvas.clientHeight;
    const aspectRatio = img.width / img.height;
    const canvasWidth = canvasHeight * aspectRatio;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    refCanvas.width = canvasWidth;
    refCanvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    refCtx.clearRect(0, 0, refCanvas.width, refCanvas.height);
    refCtx.drawImage(img, 0, 0, refCanvas.width, refCanvas.height);
}

// Handle image upload
uploadImage.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            image.src = reader.result;
            image.onload = () => {
                fitCanvasToImage(image);
                isImageLoaded = true;
            };
        };
        reader.readAsDataURL(file);
    }
});


function getAverageColor(points) {
    let totalR = 0, totalG = 0, totalB = 0, count = 0;

    points.forEach(point => {
        const { x, y } = point;
        const pixelData = refCtx.getImageData(x, y, 1, 1).data;
        totalR += pixelData[0];
        totalG += pixelData[1];
        totalB += pixelData[2];
        count++;
    });

    const avgR = Math.round(totalR / count);
    const avgG = Math.round(totalG / count);
    const avgB = Math.round(totalB / count);

    return `rgb(${avgR}, ${avgG}, ${avgB})`;
}

// Canvas drawing logic
canvas.addEventListener('mousedown', () => {
    if (!isImageLoaded) return;
    isDrawing = true;
    strokePoints = [];
    ctx.beginPath();
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false;

        if (strokePoints.length > 0) {
            const finalColor = getAverageColor(strokePoints);
            ctx.strokeStyle = finalColor;

            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.beginPath();
            strokePoints.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        }

        strokePoints = [];
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing || !isImageLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    strokePoints.push({ x, y });

    averageColor = getAverageColor(strokePoints);

    // Draw the preview with the custom brush image
    if (brushImage.complete) {
        const pattern = ctx.createPattern(brushImage, 'repeat');
        ctx.strokeStyle = averageColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }
});

// Update brush size when the slider changes
brushSizeObj.addEventListener('input', () => {
    brushSize = parseInt(brushSizeObj.value, 10);
    console.log(brushSize);
});

penBtn.addEventListener('click', () => {
    isEraserEnabled = false;
});

eraserBtn.addEventListener('click', () => {
    isEraserEnabled = true;
});