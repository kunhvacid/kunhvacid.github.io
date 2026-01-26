const gallery = document.getElementById("gallery");

fetch("/gallery/gallery.json")
  .then(r => r.json())
  .then(data => {
    console.log("Loaded items:", data.length);

    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.src = item.src;

      card.appendChild(img);
      gallery.appendChild(card);
    });
  })
  .catch(err => console.error(err));
