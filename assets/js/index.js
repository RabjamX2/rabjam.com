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
