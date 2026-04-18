export const generateDescription = ({ title, category, tags = [] }) => {
  const benefits = [
    "engineered for long-lasting performance",
    "crafted with user comfort and reliability in mind",
    "optimized for modern everyday workflows",
    "designed to balance quality, value, and durability"
  ];
  const randomBenefit = benefits[Math.floor(Math.random() * benefits.length)];
  const tagText = tags.length ? ` Key highlights: ${tags.join(", ")}.` : "";

  return `${title} in ${category} is ${randomBenefit}.${tagText} Ideal for shoppers who want trusted quality at a practical price point.`;
};
