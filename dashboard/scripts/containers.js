document.addEventListener('DOMContentLoaded', function () {
    const containers = document.querySelectorAll('.text-container');

    function highlightContainer() {
      containers.forEach(container => {
        const rect = container.getBoundingClientRect();
        const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
        const windowWidth = (window.innerWidth || document.documentElement.clientWidth);

        if (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= windowHeight &&
          rect.right <= windowWidth
        ) {
          container.classList.add('highlight');
        } else {
          container.classList.remove('highlight');
        }
      });
    }

    window.addEventListener('scroll', highlightContainer);
    window.addEventListener('resize', highlightContainer);
    highlightContainer();
  });