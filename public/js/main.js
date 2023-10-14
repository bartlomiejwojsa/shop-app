const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

// eslint-disable-next-line no-unused-vars
function previewImage() {
  const input = document.getElementById('imageInput');
  const preview = document.getElementById('imagePreview');
  
  if (input.files && input.files[0]) {
      const reader = new FileReader();

      reader.onload = function(e) {
          preview.src = e.target.result;
      };

      reader.readAsDataURL(input.files[0]);
  } else {
      preview.src = '';
  }
}

// Optional: You can also reset the form to clear the selected file and preview
document.getElementById('imageUploadForm').addEventListener('reset', function() {
  const preview = document.getElementById('imagePreview');
  preview.src = '';
});