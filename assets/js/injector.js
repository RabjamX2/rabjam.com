async function injectHeader() {
    const headerPlaceholder = document.getElementById("headerPlaceholder");
    const headerUrl = "/assets/html/header.html"; // Adjust the URL to go up one level

    try {
        const response = await fetch(headerUrl);
        if (response.ok) {
            const headerContent = await response.text();
            headerPlaceholder.innerHTML = headerContent;
        } else {
            console.error("Error loading header. Status:", response.status);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

// Use async/await to ensure injectHeader has finished before proceeding
async function loadPage() {
    await injectHeader();

    // Check if the user has a preferred color scheme
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const body = document.body;
    const darkModeToggle = document.getElementById("dark-mode-toggle");

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
}

// Call loadPage to start the process
loadPage();
