const darkModeToggle = document.getElementById("dark-mode-toggle");
const body = document.body;

// Check if the user has a preferred color scheme
const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Function to set the theme
function setTheme(isDarkMode) {
    if (isDarkMode) {
        body.classList.add("dark-mode");
        darkModeToggle.classList.add("dark-mode");
    } else {
        body.classList.remove("dark-mode");
        darkModeToggle.classList.remove("dark-mode");
    }
}

// Toggle dark mode when the button is clicked
darkModeToggle.addEventListener("click", () => {
    const isDarkMode = body.classList.contains("dark-mode");
    setTheme(!isDarkMode);
});

// Initialize the theme based on user preference
setTheme(prefersDarkMode);

// JavaScript for your dynamic content
const canvasContainer = document.getElementById("canvasContainer");
const canvas = document.getElementById("piRandom");

const smallerBound = window.innerHeight <= window.innerWidth ? window.innerHeight : window.innerWidth;
const canvasHeight = smallerBound * 0.7;
const canvasWidth = smallerBound * 0.7;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

const ctx = canvas.getContext("2d");

const squareSideLength = canvasHeight * 0.9;
ctx.strokeRect(
    canvasWidth / 2 - squareSideLength / 2,
    canvasHeight / 2 - squareSideLength / 2,
    squareSideLength,
    squareSideLength
);

const circleRadius = squareSideLength / 2;
ctx.fillStyle = "#FF5733";
ctx.beginPath();
ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius, 0, 2 * Math.PI);
ctx.stroke();

ctx.translate(canvasWidth / 2 - circleRadius, canvasHeight / 2 - circleRadius);

const inCircleElement = document.getElementById("points-inside");
const outCircleElement = document.getElementById("points-outside");
const totalElement = document.getElementById("total-outside");
const ratio = document.getElementById("inside-total-ratio");
const ratioMultiplied = document.getElementById("ratio-multiplied");

let inCircleAmount = 0;
let outCircleAmount = 0;
function addRandomPoints(randomPointCount) {
    for (let i = 0; i < randomPointCount; i++) {
        const randomXPoint = Math.floor(Math.random() * squareSideLength);
        const randomYPoint = Math.floor(Math.random() * squareSideLength);
        const pointDistanceFromCenter = Math.sqrt(
            (randomXPoint - circleRadius) ** 2 + (randomYPoint - circleRadius) ** 2
        );
        if (pointDistanceFromCenter <= circleRadius) {
            ctx.fillStyle = "white";
            inCircleAmount += 1;
        } else {
            ctx.fillStyle = "red";
            outCircleAmount += 1;
        }
        ctx.fillRect(randomXPoint - 4, randomYPoint - 4, 8, 8);
    }
    const totalCircleAmount = inCircleAmount + outCircleAmount;
    inCircleElement.innerText = inCircleAmount;
    outCircleElement.innerText = outCircleAmount;
    totalElement.innerText = totalCircleAmount;
    ratio.innerText = inCircleAmount / totalCircleAmount;
    ratioMultiplied.innerText = (inCircleAmount / totalCircleAmount) * 4;
}

const calculateButton = document.getElementById("calculate-button");

calculateButton.addEventListener("click", function () {
    const iterationsInput = document.getElementById("iterations");
    const numberOfIterations = parseInt(iterationsInput.value); // Convert to a number
    addRandomPoints(numberOfIterations);
});
