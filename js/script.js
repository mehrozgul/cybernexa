/* =========================================================
   CYBERNEXA
   LEARNING PATHS — SHOW / HIDE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const button = document.getElementById("show-learning-paths");
    const extraPaths = document.querySelectorAll(".extra-learning-path");

    if (!button || extraPaths.length === 0) {
        return;
    }

    let expanded = false;

    button.addEventListener("click", function () {

        expanded = !expanded;

        extraPaths.forEach(function (card) {

            if (expanded) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }

        });

        if (expanded) {

            button.innerHTML =
                'Hide Learning Paths <span>↑</span>';

        } else {

            button.innerHTML =
                'Show All Learning Paths <span>↓</span>';

        }

    });

});