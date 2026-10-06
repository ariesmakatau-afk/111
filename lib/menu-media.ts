// Photos for menu items that have one. Add a line here when a new product
// photo arrives (drop the file in /public/images first).
export const productPhotos: Record<string, { src: string; alt: string }> = {
  yiros: { src: "/images/yiros-wrap-2.jpg", alt: "A charcoal yiros wrapped in paper, chips behind it" },
  "ab-pack": { src: "/images/ab-pack-box.jpg", alt: "An AB Pack: charcoal meat over chips with sauces" },
  "meat-pack": { src: "/images/meat-pack.jpg", alt: "A Meat Pack: charcoal meat with garlic sauce" },
  "yiros-pack": { src: "/images/yiros-pack.jpg", alt: "A Yiros Pack: charcoal meat and salad with garlic sauce" },
  platter: { src: "/images/platter-blue.jpg", alt: "A platter of charcoal meat, salad and pita" },
  chips: { src: "/images/chips-tray.jpg", alt: "A tray of hot chips" },
  "greek-coffee": { src: "/images/greek-coffee.jpg", alt: "A Greek coffee in a meander cup" },
};

export const groupPhotos: Record<string, { src: string; alt: string }> = {
  yiros: productPhotos.yiros,
  "ab-pack": productPhotos["ab-pack"],
  "meat-pack": productPhotos["meat-pack"],
  platters: productPhotos.platter,
  sides: productPhotos.chips,
  coffee: productPhotos["greek-coffee"],
};
