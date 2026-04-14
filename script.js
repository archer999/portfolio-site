document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".button");
  buttons.forEach((button) => {
    button.addEventListener("mouseover", () => {
      button.style.filter = "brightness(1.05)";
    });
    button.addEventListener("mouseout", () => {
      button.style.filter = "none";
    });
  });
});
