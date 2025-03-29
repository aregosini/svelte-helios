document.addEventListener('DOMContentLoaded', () => {
    const redirectElements = document.querySelectorAll('.redirect');
    redirectElements.forEach(element => {
      element.addEventListener('click', () => {
        const destination = element.getAttribute('destination');
        console.log(destination);
        if (destination) {
          window.location.href = destination;
        }
      });
    });
});