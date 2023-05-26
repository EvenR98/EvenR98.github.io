const userLink = document.getElementById("bruker");
const userPopup = document.getElementById("bruker-popup");
const closeUser = document.getElementById("close-link");

//adder en eventlistener til  linken
userLink.addEventListener("click", () => {
    userPopup.classList.toggle("open");
});

//lukker brukeren
closeUser.addEventListener("click", () => {
    userPopup.classList.toggle("open");

});