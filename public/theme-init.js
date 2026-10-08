// Runs before styles/rendering to restore the selected theme without a dark flash.
(() => {
  let theme = "dark";
  try {
    if (localStorage.getItem("interprepai.theme") === "light") theme = "light";
  } catch {}
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#f5f6fc" : "#0a0b10");
})();
