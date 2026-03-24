window.NurseryData = (() => {
  const business = {
    name: "Lumbini Nursery and Plant service",
    shortName: "Lumbini Nursery",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Zamioculcas_zamiifolia_1.jpg",
    phone: "+977 986-7155296",
    phoneHref: "tel:+9779867155296",
    whatsappHref: "https://wa.me/9779867155296",
    email: "pradeepsharma.shantipur50@gmail.com",
    emailHref: "mailto:pradeepsharma.shantipur50@gmail.com",
    address: "Sainamaina-03, Murgiya, Hatbazar Tol, Rupandehi, Butwal, Nepal, 32900",
    mapEmbed:
      "https://www.google.com/maps?q=Sainamaina-03%2C%20Murgiya%2C%20Hatbazar%20Tol%2C%20Rupandehi%2C%20Butwal%2C%20Nepal%2C%2032900&output=embed",
    mapHref:
      "https://www.google.com/maps/search/?api=1&query=Sainamaina-03%2C%20Murgiya%2C%20Hatbazar%20Tol%2C%20Rupandehi%2C%20Butwal%2C%20Nepal%2C%2032900",
  };

  const categories = [
    { key: "all", name: "All Plants & Essentials", short: "All", accent: "Fresh nursery picks", image: "cat-all", blurb: "Browse the full nursery range, from easy indoor greens to flowering stock, fruit plants, pots, and finishing accessories." },
    { key: "indoor", name: "Indoor Plants", short: "Indoor Plants", accent: "Easy care greens", image: "cat-indoor", blurb: "Low-maintenance greens chosen for bedrooms, living rooms, desks, and bright indoor corners." },
    { key: "outdoor", name: "Outdoor Plants", short: "Outdoor Plants", accent: "Built for sun", image: "cat-outdoor", blurb: "Sun-loving plants and hardy shrubs that suit courtyards, compounds, terraces, and front yards." },
    { key: "flowering", name: "Flowering Plants", short: "Flowering Plants", accent: "Seasonal color", image: "cat-flower", blurb: "Colorful bloomers for verandas, balcony rails, gifting, and garden beds that need a fresh lift." },
    { key: "fruit", name: "Fruit Plants", short: "Fruit Plants", accent: "Kitchen garden favorites", image: "cat-fruit", blurb: "Practical fruit plants for kitchen gardens, home compounds, and customers planning productive spaces." },
    { key: "decorative", name: "Decorative Plants", short: "Decorative Plants", accent: "Premium green styling", image: "cat-decor", blurb: "Statement palms, trailing plants, and premium foliage for styled homes, shops, and reception areas." },
    { key: "accessories", name: "Pots & Garden Accessories", short: "Accessories", accent: "Complete the setup", image: "cat-pot", blurb: "Terracotta pots, decorative stones, and finishing pieces that help a plant display look complete from day one." },
  ];

  const services = [
    { id: "s1", title: "Landscape Gardening", summary: "Planting support for homes, schools, shops, and hospitality spaces.", cta: "Request Garden Visit" },
    { id: "s2", title: "Garden Setup", summary: "Ready-to-enjoy balcony, terrace, and home garden arrangements.", cta: "Plan My Setup" },
    { id: "s3", title: "Plant Recommendations", summary: "Guidance based on sunlight, space, and maintenance comfort.", cta: "Get Recommendations" },
    { id: "s4", title: "Pots and Decorative Support", summary: "Pots, stones, and finishing touches for a complete look.", cta: "Explore Accessories" },
    { id: "s5", title: "Home and Office Greenery Setup", summary: "Low-maintenance plant styling for homes and business interiors.", cta: "Book Consultation" },
  ];

  const highlights = [
    { title: "Healthy nursery-grown plants", text: "Selected for strong roots, healthy leaves, and practical local performance." },
    { title: "Wide variety in one place", text: "Indoor, flowering, fruit plants, decorative options, pots, and garden essentials." },
    { title: "Simple ordering", text: "Browse online, place an order, and confirm pickup or delivery with less back-and-forth." },
    { title: "Trusted local service", text: "A nursery rooted in real customer needs across Murgiya, Sainamaina, Butwal, and Rupandehi." },
  ];

  const qualityPoints = [
    { title: "Care guidance included", text: "Every product view includes light, watering, and maintenance guidance." },
    { title: "Plants plus accessories", text: "Customers can complete a finished setup with pots and decorative stones." },
    { title: "Useful for home and business", text: "Suitable for balconies, family gardens, shops, and office reception areas." },
  ];

  const orderSteps = [
    { step: "Browse the shop", text: "Choose plants and accessories by category, care style, or budget." },
    { step: "Add to cart", text: "Select quantity and keep your list ready for delivery or pickup." },
    { step: "Checkout easily", text: "Enter your name, phone, address, and preferred payment option." },
    { step: "Receive confirmation", text: "The nursery reviews your order and confirms preparation or delivery timing." },
  ];

  const testimonials = [
    { name: "Sushma K.C.", role: "Homeowner, Butwal", rating: 5, text: "The plants arrived healthy, and the recommendations matched our sunlight and space perfectly." },
    { name: "Ramesh Thapa", role: "Shop Owner, Murgiya", rating: 5, text: "They suggested low-maintenance plants that made our storefront look more welcoming right away." },
  ];

  const faqs = [
    { question: "Do you deliver around Butwal and Rupandehi?", answer: "Yes. Local delivery can be arranged around Murgiya, Sainamaina, Butwal, and nearby areas depending on order size." },
    { question: "Can I place an order online and confirm later?", answer: "Yes. Cash on delivery, phone call confirmation, and an eSewa placeholder option are available in the checkout UI." },
    { question: "Do you help choose plants for low-light rooms?", answer: "Yes. The nursery can recommend practical indoor plants based on sunlight, maintenance comfort, and budget." },
    { question: "Do you also offer pots and decorative materials?", answer: "Yes. Decorative pots, stones, and finishing accessories are part of the product range." },
  ];

  const deliveryAreas = [
    { value: "murgiya", label: "Murgiya / Sainamaina", fee: 100 },
    { value: "butwal", label: "Butwal", fee: 150 },
    { value: "rupandehi", label: "Other Rupandehi Areas", fee: 220 },
    { value: "pickup", label: "Nursery Pickup", fee: 0 },
  ];

  const businessHours = [
    { day: "Sunday - Friday", hours: "7:00 AM - 6:30 PM" },
    { day: "Saturday", hours: "8:00 AM - 4:00 PM" },
  ];

  const seedOrders = [
    {
      id: "LNP-240301",
      customerName: "Mina Acharya",
      phone: "+977 984-1112233",
      address: "Traffic Chowk, Butwal",
      deliveryArea: "butwal",
      orderNotes: "Please call before delivery.",
      paymentMethod: "Cash on Delivery",
      status: "Confirmed",
      archived: false,
      createdAt: "2026-03-20T10:30:00.000Z",
      subtotal: 2140,
      deliveryFee: 150,
      total: 2290,
      items: [
        { id: "P-103", name: "ZZ Plant Green", quantity: 1, price: 1250 },
        { id: "P-114", name: "Polished Garden Stones", quantity: 2, price: 445 },
      ],
    },
    {
      id: "LNP-240302",
      customerName: "Kiran Neupane",
      phone: "+977 985-5559988",
      address: "Sainamaina-04, Rupandehi",
      deliveryArea: "murgiya",
      orderNotes: "Need healthy fruit plants.",
      paymentMethod: "Phone Call Confirmation",
      status: "Processing",
      archived: false,
      createdAt: "2026-03-21T08:45:00.000Z",
      subtotal: 1040,
      deliveryFee: 100,
      total: 1140,
      items: [{ id: "P-109", name: "Hybrid Papaya Plant", quantity: 2, price: 520 }],
    },
    {
      id: "LNP-240303",
      customerName: "Hotel Peace Garden",
      phone: "+977 981-4441100",
      address: "Kalikanagar, Butwal",
      deliveryArea: "butwal",
      orderNotes: "Reception area greenery setup.",
      paymentMethod: "eSewa Placeholder",
      status: "Delivered",
      archived: false,
      createdAt: "2026-03-22T11:20:00.000Z",
      subtotal: 6300,
      deliveryFee: 150,
      total: 6450,
      items: [
        { id: "P-108", name: "Charmonda Palm", quantity: 2, price: 2100 },
        { id: "P-113", name: "Decorative Terracotta Pot Set", quantity: 1, price: 2100 },
      ],
    },
  ];

  const adminCredentials = { username: "admin", password: "lumbini123" };

  return {
    business,
    categories,
    services,
    highlights,
    qualityPoints,
    orderSteps,
    testimonials,
    faqs,
    deliveryAreas,
    businessHours,
    seedOrders,
    adminCredentials,
  };
})();
