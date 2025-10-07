(function () {
  "use strict";
  bsCustomFileInput.init();
  // selects all forms that will use bootstrap validation
  const forms = document.querySelectorAll(".validated-form");

  // loop over the forms and prevent submit
  Array.from(forms).forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();
