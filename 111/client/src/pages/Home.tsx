import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Instagram,
  Leaf,
  MapPin,
  Menu as MenuIcon,
  Phone,
  WheatOff,
  X,
} from "lucide-react";

type DietaryTag = "vegetarian" | "gluten-free";
type DietaryFilter = "all" | DietaryTag;

interface MenuItem {
  name: string;
  description?: string;
  price: string;
  dietary?: DietaryTag[];
}

interface MenuSection {
  id: string;
  number: string;
  title: string;
  intro?: string;
  items: MenuItem[];
}

const sections: MenuSection[] = [
  {
    id: "yiros",
    number: "01",
    title: "Yiros",
    intro: '“The Lot” (standard build): lettuce, tomato, onion, garlic sauce & lemon juice.',
    items: [
      { name: "Yiros", description: "Choice of Lamb, Chicken, Pork, or Combo (Lamb +$2)", price: "$20.00" },
      { name: "Mini Yiros", description: "Same choices as above", price: "$15.00" },
      { name: "Veggie Roll", description: "Lettuce, cheese, tomato, onion, garlic sauce, lemon juice, salt & pepper", price: "$8.00", dietary: ["vegetarian"] },
      { name: "Falafel Yiros", description: "Crispy falafels, lettuce, cheese, tomato, onion, garlic sauce, lemon juice, salt & pepper", price: "$15.00", dietary: ["vegetarian"] },
    ],
  },
  {
    id: "ab-pack",
    number: "02",
    title: "AB Pack",
    intro: "Chips, meat of choice & up to 3 sauces.",
    items: [
      { name: "Small", description: "Lamb +$2", price: "$23" },
      { name: "Large", description: "Lamb +$2", price: "$28" },
    ],
  },
  {
    id: "chips",
    number: "03",
    title: "Chips",
    items: [
      { name: "Small", price: "$9", dietary: ["vegetarian", "gluten-free"] },
      { name: "Large", price: "$12", dietary: ["vegetarian", "gluten-free"] },
      { name: "Family", price: "$20", dietary: ["vegetarian", "gluten-free"] },
    ],
  },
  {
    id: "platters",
    number: "04",
    title: "Dine-In Platters",
    intro: "Meat of choice, salad, pita bread, garlic sauce & lemon.",
    items: [
      { name: "Platter for 1", description: "Lamb +$3", price: "$35" },
      { name: "Platter for 2", description: "Lamb +$4", price: "$58" },
    ],
  },
  {
    id: "takeaway-packs",
    number: "05",
    title: "Takeaway Packs",
    items: [
      { name: "Yiros Pack", description: "Half meat, half salad & sauce. Lamb +$2. Add pita bread +$2", price: "$18" },
      { name: "Small Meat Pack", description: "Lamb / Chicken / Pork / Combo. Lamb +$2. Served with garlic sauce & lemon juice", price: "$28" },
      { name: "Meat Pack", description: "Lamb / Chicken / Pork / Combo. Lamb +$3. Served with garlic sauce & lemon juice", price: "$35" },
      { name: "Salad Pack", description: "Lettuce, onion & tomato, lemon & olive oil dressing", price: "$5", dietary: ["vegetarian", "gluten-free"] },
    ],
  },
  {
    id: "garlic-sauce",
    number: "06",
    title: "Garlic Sauce Tubs",
    items: [
      { name: "X-Small", price: "$1" },
      { name: "Small", price: "$2" },
      { name: "Medium", price: "$3.50" },
      { name: "Large", price: "$5" },
    ],
  },
  {
    id: "extras",
    number: "07",
    title: "Extras",
    items: [
      { name: "Extra Meat", price: "$6.00" },
      { name: "Cheese", price: "$1.50", dietary: ["vegetarian", "gluten-free"] },
      { name: "Chips in Yiros", price: "$1.50", dietary: ["vegetarian", "gluten-free"] },
      { name: "Cooked Onion", price: "$1.00", dietary: ["vegetarian", "gluten-free"] },
      { name: "Pita Bread", price: "$2.00" },
      { name: "Falafel", price: "$2.00", dietary: ["vegetarian", "gluten-free"] },
      { name: "Salad on AB Pack", price: "$3.00", dietary: ["vegetarian", "gluten-free"] },
    ],
  },
  {
    id: "sauces",
    number: "08",
    title: "Extra Sauces",
    intro: "+$0.50 each.",
    items: [
      { name: "Garlic", price: "+$0.50" },
      { name: "Mustard", price: "+$0.50" },
      { name: "Peri Peri", price: "+$0.50" },
      { name: "Nando's Peri-Peri", price: "+$0.50" },
      { name: "Aioli", price: "+$0.50" },
      { name: "Mayonnaise", price: "+$0.50" },
      { name: "Hot Chilli", price: "+$0.50" },
      { name: "Sweet Chilli", price: "+$0.50" },
      { name: "Tomato", price: "+$0.50" },
      { name: "BBQ", price: "+$0.50" },
      { name: "Tabasco", price: "+$0.50" },
    ],
  },
  {
    id: "drinks",
    number: "09",
    title: "Drinks",
    items: [{ name: "Greek Coffee", description: "Short black coffee, with 1 sugar", price: "$3.00", dietary: ["vegetarian", "gluten-free"] }],
  },
  {
    id: "drinks-soft",
    number: "10",
    title: "Soft Drinks — 600ml",
    items: [
      { name: "Coke", price: "$5.00" },
      { name: "Coke Zero", price: "$5.00" },
      { name: "Coke Vanilla", price: "$5.00" },
      { name: "Coke Vanilla Zero", price: "$5.00" },
      { name: "Fanta", price: "$5.00" },
      { name: "Fanta Raspberry", price: "$5.00" },
      { name: "Passiona", price: "$5.00" },
      { name: "Sprite", price: "$5.00" },
      { name: "Sprite Zero", price: "$5.00" },
    ],
  },
  {
    id: "drinks-powerade",
    number: "11",
    title: "Powerade",
    items: [
      { name: "Mountain Berry Blast", price: "$5.50" },
      { name: "Grape", price: "$5.50" },
      { name: "Lemon Lime", price: "$5.50" },
      { name: "Gold Rush", price: "$5.50" },
      { name: "Berry Ice", price: "$5.50" },
    ],
  },
  {
    id: "drinks-water",
    number: "12",
    title: "Water",
    items: [
      { name: "Mount Franklin", description: "600ml", price: "$4.00" },
      { name: "Mount Franklin Lightly Sparkling", price: "$4.00" },
      { name: "Mount Franklin Lightly Sparkling Lime", price: "$4.00" },
      { name: "Pump", description: "750ml", price: "$5.50" },
      { name: "Pump Berry", price: "$5.50" },
    ],
  },
  {
    id: "drinks-juice-milk",
    number: "13",
    title: "Juices, Milk & Iced Coffee",
    intro: "Nippy's range.",
    items: [
      { name: "Orange Juice", price: "$5.00" },
      { name: "Unsweetened Orange Juice", price: "$5.00" },
      { name: "Orange & Mango", price: "$5.00" },
      { name: "Breakfast Juice", price: "$5.00" },
      { name: "Apple Juice", price: "$5.00" },
      { name: "Apple Blackcurrant", price: "$5.00" },
      { name: "Chocolate Milk", price: "$5.00" },
      { name: "Iced Coffee", price: "$5.00" },
    ],
  },
  {
    id: "drinks-cans",
    number: "14",
    title: "Cans — 330ml",
    items: [
      { name: "Coke", price: "$3.50" },
      { name: "Coke Zero", price: "$3.50" },
      { name: "Fanta", price: "$3.50" },
      { name: "Fanta Lemon", price: "$3.50" },
      { name: "Sprite", price: "$3.50" },
      { name: "Kirks Ginger Beer", price: "$3.50" },
      { name: "Kirks Creaming Soda", price: "$3.50" },
      { name: "Pepsi Max", price: "$3.50" },
    ],
  },
  {
    id: "drinks-energy",
    number: "15",
    title: "Energy Drinks",
    items: [
      { name: "Monster Energy White Zero", price: "$5.50" },
      { name: "Monster Energy Mango Loco", price: "$5.50" },
    ],
  },
];

const hours = [
  ["Monday", "9:00 AM – 3:30 PM"],
  ["Tuesday", "9:00 AM – 8:00 PM"],
  ["Wednesday", "9:00 AM – 8:00 PM"],
  ["Thursday", "9:00 AM – 8:00 PM"],
  ["Friday", "9:00 AM – 10:30 PM"],
  ["Saturday", "9:00 AM – 10:30 PM"],
  ["Sunday", "9:00 AM – 8:00 PM"],
];

function BrandMark() {
  return (
    <a href="/" className="brand-mark" aria-label="Yianni's home">
      <span className="brand-medallion">
        <img src="https://yiannis-zeta.vercel.app/images/medallion-512.png" alt="" />
      </span>
      <span className="brand-copy">
        <strong>Yianni’s</strong>
        <small>HELLENIC YIROS</small>
      </span>
    </a>
  );
}

function MenuSectionCard({ section, filter }: { section: MenuSection; filter: DietaryFilter }) {
  const visibleItems = filter === "all" ? section.items : section.items.filter((item) => item.dietary?.includes(filter));

  if (visibleItems.length === 0) return null;

  return (
    <section className="menu-section" id={section.id}>
      <div className="section-heading">
        <span className="section-number">{section.number}</span>
        <div>
          <h2>{section.title}</h2>
          {section.intro && <p>{section.intro}</p>}
        </div>
      </div>
      <div className="menu-items">
        {visibleItems.map((item) => (
          <div className="menu-item" key={`${section.id}-${item.name}`}>
            <div className="item-copy">
              <h3>{item.name}</h3>
              {item.description && <p>{item.description}</p>}
              {item.dietary && (
                <div className="dietary-tags" aria-label="Dietary options">
                  {item.dietary.includes("vegetarian") && <span className="dietary-tag vegetarian"><Leaf size={11} /> Vegetarian</span>}
                  {item.dietary.includes("gluten-free") && <span className="dietary-tag gluten-free"><WheatOff size={11} /> Gluten-free</span>}
                </div>
              )}
            </div>
            <span className="item-rule" aria-hidden="true" />
            <strong className="item-price">{item.price}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState("yiros");
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("all");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-18% 0px -65% 0px", threshold: [0.1, 0.35, 0.7] },
    );
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMobileOpen(false);
  const dietaryFilters: { id: DietaryFilter; label: string; icon: typeof Leaf }[] = [
    { id: "all", label: "All dishes", icon: Leaf },
    { id: "vegetarian", label: "Vegetarian", icon: Leaf },
    { id: "gluten-free", label: "Gluten-free", icon: WheatOff },
  ];
  const filteredSections = sections.filter((section) => section.items.some((item) => dietaryFilter === "all" || item.dietary?.includes(dietaryFilter)));
  const filteredItemCount = filteredSections.reduce((count, section) => count + section.items.filter((item) => dietaryFilter === "all" || item.dietary?.includes(dietaryFilter)).length, 0);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <BrandMark />
          <nav className={`main-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Main navigation">
            <a className="active" href="/menu" onClick={closeMenu}>Menu</a>
            <a href="/about" onClick={closeMenu}>About</a>
            <a href="/location" onClick={closeMenu}>Location</a>
            <a href="/contact" onClick={closeMenu}>Contact</a>
            <a className="nav-order" href="/order" onClick={closeMenu}>Order online <ArrowUpRight size={15} strokeWidth={2.4} /></a>
          </nav>
          <button className="mobile-toggle" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="menu-hero">
          <div className="hero-grid">
            <div className="hero-eyebrow"><span /> Adelaide CBD · Since 1994</div>
            <div className="hero-copy">
              <p className="kicker">The Hindley Street menu</p>
              <h1>Good food.<br /><em>No fuss.</em></h1>
              <p className="hero-intro">Greek yiros, golden chips and the sauces that keep Adelaide coming back.</p>
            </div>
            <div className="hero-stamp" aria-hidden="true">
              <div className="stamp-ring">YIANNI’S · HELLENIC YIROS · YIANNI’S · HELLENIC YIROS ·</div>
              <span>30<br /><small>years</small></span>
            </div>
            <div className="hero-note"><span>01</span> Pick a category<br />and get stuck in <ChevronDown size={16} /></div>
          </div>
        </section>

        <section className="menu-intro">
          <div className="intro-location"><MapPin size={18} /><span>270 Hindley Street, Adelaide SA 5000</span></div>
          <div className="intro-copy">
            <span className="intro-label">Hungry now?</span>
            <p>Standing outside at 10pm? Jump straight to a category below. Looking for Yianni's on Hindley Street? You've found us.</p>
          </div>
          <a className="intro-order" href="/order">Order online <ArrowUpRight size={16} /></a>
        </section>

        <div className="menu-layout">
          <aside className="category-sidebar" aria-label="Menu categories">
            <div className="sidebar-label">Browse menu</div>
            <nav>
              {sections.map((section) => (
                <a key={section.id} className={activeId === section.id ? "is-active" : ""} href={`#${section.id}`}>
                  <span>{section.number}</span>{section.title}
                </a>
              ))}
            </nav>
          </aside>
          <div className="menu-content">
            <div className="menu-content-head">
              <span>What’s on the grill</span>
              <span>{filteredItemCount.toString().padStart(2, "0")} dishes · {filteredSections.length.toString().padStart(2, "0")} categories</span>
            </div>
            <div className="dietary-filter" aria-labelledby="dietary-filter-title">
              <div className="filter-copy">
                <span className="filter-kicker" id="dietary-filter-title"><Leaf size={14} /> Find your fit</span>
                <p>Filter the menu by dietary preference. For gluten-free orders, please confirm preparation with our team.</p>
              </div>
              <div className="filter-options" role="group" aria-label="Dietary filters">
                {dietaryFilters.map(({ id, label, icon: Icon }) => (
                  <button key={id} className={`filter-option ${dietaryFilter === id ? "is-selected" : ""}`} type="button" aria-pressed={dietaryFilter === id} onClick={() => setDietaryFilter(id)}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
            {filteredSections.map((section) => <MenuSectionCard key={section.id} section={section} filter={dietaryFilter} />)}
            {filteredSections.length === 0 && <div className="filter-empty"><WheatOff size={18} /><p>No dishes are tagged for this filter yet.</p><button type="button" onClick={() => setDietaryFilter("all")}>Show all dishes</button></div>}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-cta">
          <p className="kicker">Ready when you are</p>
          <h2>Make it a<br /><em>Yianni’s night.</em></h2>
          <a className="footer-order" href="/order">Order online <ArrowUpRight size={18} /></a>
        </div>
        <div className="footer-details">
          <div className="footer-brand"><BrandMark /><p>Adelaide CBD · Greek yiros for 30 years.</p></div>
          <div className="footer-column"><span className="footer-label">Visit</span><a href="https://www.google.com/maps/search/?api=1&query=270%20Hindley%20Street%2C%20Adelaide%20SA%205000"><MapPin size={15} />270 Hindley Street, Adelaide SA 5000</a><a href="tel:+61882125552"><Phone size={15} />+61 8 8212 5552</a><a href="mailto:yiannisyiros2020@gmail.com">yiannisyiros2020@gmail.com</a></div>
          <div className="footer-column hours-column"><span className="footer-label"><Clock3 size={15} />Opening hours</span>{hours.map(([day, time]) => <div className="hour-row" key={day}><span>{day}</span><strong>{time}</strong></div>)}</div>
          <div className="footer-column follow-column"><span className="footer-label">Follow</span><a href="https://www.facebook.com/share/19LY4HbBXJ/?mibextid=wwXIfr">Facebook <ArrowUpRight size={14} /></a><a href="https://www.instagram.com/yiannisyiroshindley"><Instagram size={14} /> Instagram <ArrowUpRight size={14} /></a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Yianni’s on Hindley Street, Adelaide CBD. All rights reserved.</span><span>Eat well. Stay late.</span></div>
      </footer>
    </div>
  );
}
