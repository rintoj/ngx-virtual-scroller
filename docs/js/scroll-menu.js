(function() {

  var startup = function startup() {

    var scrollMenu = document.querySelector('.scroll-menu-content');
    if (scrollMenu == null) return;

    var menu = document.querySelector('#scroll-menu');
    if (menu == null) return;

    var menuSelector = document.querySelector('.menu-selector');
    var sections = scrollMenu.querySelectorAll('section');
    var headers = [];

    sections.forEach(function(section) {
      var titles = section.querySelectorAll('h1');
      if (titles != null) {
        titles.forEach(function(h1) {
          headers.push(h1);
        });
      }
    });

    var firstLevelMenu = headers
      .map((header) => header.innerText)
      .map((text) => '<li>' + text + '</li>')
      .join('\n');

    menu.innerHTML = '<ul>' + firstLevelMenu + '</ul>'

    var menuItems = menu.querySelectorAll('li');
    var prevIndex;
    if (menuItems != null) {
      menuItems.forEach(function(menuItem, index) {
        menuItem.index = index;
        menuItem.addEventListener('click', function() {
          if (prevIndex != null) {
            menuItems[prevIndex].classList.remove('selected');
          }
          if (menuSelector != null) {
            menuSelector.style.transform = 'translate(0, ' + menuItem.offsetTop + 'px)';
          }
          menuItem.classList.add('selected');
          prevIndex = this.index;
        });
      });
    }
  };

  document.addEventListener('DOMContentLoaded', startup);

})();